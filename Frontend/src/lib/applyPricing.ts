/**
 * Engine de pricing: aplica listas de precios, promociones y cupón a un carrito
 * y devuelve líneas con precios efectivos + lista de promos aplicadas.
 *
 * Reglas:
 *  1. Lista de precios primero (override de precio base por producto).
 *  2. Promociones automáticas vigentes después (descuentos sobre los precios ya overrides).
 *  3. Cupón al final (sobre el total).
 *
 * Si una promoción no es stackable, no se acumula con otra del mismo producto.
 */
import { CartItem } from '@/types/sales';
import { Client } from '@/types/client';
import { Promotion, PriceList, Coupon, AppliedPromotion } from '@/types/promotion';

export interface ApplyPricingInput {
  items: CartItem[];
  client?: Client | null;
  promotions: Promotion[];
  priceLists: PriceList[];
  coupon?: Coupon | null;
  now?: number;
}

export interface ApplyPricingResult {
  items: CartItem[];                  // items con finalPrice ya ajustado
  appliedPromotions: AppliedPromotion[];
  totalSavings: number;               // diferencia respecto al precio base
  baseTotal: number;                  // suma de price base × qty (sin overrides ni promos)
  total: number;                      // total final
  priceListUsed?: PriceList | null;   // referencia para UI
}

function isPromoActive(p: Promotion, now: number): boolean {
  if (!p.active) return false;
  if (p.validFrom && now < p.validFrom) return false;
  if (p.validTo && now > p.validTo) return false;
  return true;
}

function selectPriceList(priceLists: PriceList[], client?: Client | null): PriceList | null {
  if (!client) return null;
  const active = priceLists.filter(pl => pl.active);
  const byClient = active.find(pl => (pl.appliesByClientIds || []).includes(client.id));
  if (byClient) return byClient;
  const tags = client.tags || [];
  const byTag = active.find(pl => pl.appliesByTag && tags.includes(pl.appliesByTag));
  return byTag || null;
}

export function applyPricing(input: ApplyPricingInput): ApplyPricingResult {
  const now = input.now ?? Date.now();
  const list = selectPriceList(input.priceLists, input.client ?? null);
  const overrideById = new Map<string, number>();
  if (list) {
    list.items.forEach(it => overrideById.set(it.productId, it.price));
  }

  // Línea base con overrides aplicados (preservando el resto de fields)
  const items = input.items.map(orig => {
    const override = overrideById.get(orig.id);
    if (override !== undefined && override >= 0) {
      return { ...orig, finalPrice: override };
    }
    return { ...orig, finalPrice: orig.finalPrice ?? orig.price };
  });

  const baseTotal = input.items.reduce((s, it) => s + (it.price ?? 0) * it.quantity, 0);

  const applied: AppliedPromotion[] = [];
  const promoTouched = new Set<string>(); // productIds tocados por una promo no-stackable

  const activePromos = input.promotions.filter(p => isPromoActive(p, now));

  // PERCENT_PRODUCT y BUY_X_GET_Y y BUNDLE primero (por producto)
  for (const promo of activePromos) {
    if (promo.type === 'PERCENT_PRODUCT' && (promo.percentValue ?? 0) > 0) {
      let saved = 0;
      const touched: string[] = [];
      const targetIds = new Set(promo.productIds || []);
      items.forEach(it => {
        if (!targetIds.has(it.id)) return;
        if (!promo.stackable && promoTouched.has(it.id)) return;
        const disc = it.finalPrice * (promo.percentValue! / 100);
        it.finalPrice = +(it.finalPrice - disc).toFixed(2);
        saved += disc * it.quantity;
        if (!touched.includes(it.id)) touched.push(it.id);
        if (!promo.stackable) promoTouched.add(it.id);
      });
      if (saved > 0) {
        applied.push({
          promotionId: promo.id,
          name: promo.name,
          type: promo.type,
          amount: +saved.toFixed(2),
          productIds: touched,
        });
      }
    } else if (promo.type === 'BUY_X_GET_Y' && (promo.buyX ?? 0) > (promo.payY ?? 0)) {
      const X = promo.buyX!;
      const Y = promo.payY!;
      let saved = 0;
      const touched: string[] = [];
      const targetIds = new Set(promo.productIds || []);
      items.forEach(it => {
        if (!targetIds.has(it.id)) return;
        if (!promo.stackable && promoTouched.has(it.id)) return;
        const groupsOfX = Math.floor(it.quantity / X);
        if (groupsOfX <= 0) return;
        const freeUnits = groupsOfX * (X - Y);
        const lineSaved = freeUnits * it.finalPrice;
        saved += lineSaved;
        if (!touched.includes(it.id)) touched.push(it.id);
        if (!promo.stackable) promoTouched.add(it.id);
      });
      if (saved > 0) {
        applied.push({
          promotionId: promo.id,
          name: promo.name,
          type: promo.type,
          amount: +saved.toFixed(2),
          productIds: touched,
        });
      }
    } else if (promo.type === 'BUNDLE' && (promo.bundleProductIds || []).length > 0 && (promo.bundlePrice ?? -1) >= 0) {
      const required = promo.bundleProductIds!;
      // ¿Cuántos combos se completan? mínimo qty de cada producto requerido.
      const minQtyByProduct = required.map(pid => items.find(it => it.id === pid)?.quantity ?? 0);
      const completions = Math.min(...minQtyByProduct);
      if (completions <= 0) continue;
      if (!promo.stackable && required.some(pid => promoTouched.has(pid))) continue;
      // Precio normal del combo
      const normalBundleTotal = required.reduce((s, pid) => {
        const it = items.find(x => x.id === pid);
        return s + (it ? it.finalPrice : 0);
      }, 0);
      const discPerCombo = normalBundleTotal - promo.bundlePrice!;
      if (discPerCombo <= 0) continue;
      const totalDisc = discPerCombo * completions;
      applied.push({
        promotionId: promo.id,
        name: promo.name,
        type: promo.type,
        amount: +totalDisc.toFixed(2),
        productIds: required,
      });
      if (!promo.stackable) required.forEach(pid => promoTouched.add(pid));
    }
  }

  // Después: PERCENT_TOTAL sobre subtotal con overrides+promos ya aplicadas
  const subtotalAfterProduct = items.reduce((s, it) => s + it.finalPrice * it.quantity, 0)
    - applied
        .filter(a => a.type === 'BUNDLE')
        .reduce((s, a) => s + a.amount, 0);

  for (const promo of activePromos) {
    if (promo.type !== 'PERCENT_TOTAL') continue;
    if ((promo.percentValue ?? 0) <= 0) continue;
    if (promo.minCartTotal && subtotalAfterProduct < promo.minCartTotal) continue;
    const disc = +(subtotalAfterProduct * (promo.percentValue! / 100)).toFixed(2);
    if (disc > 0) {
      applied.push({
        promotionId: promo.id,
        name: promo.name,
        type: promo.type,
        amount: disc,
      });
    }
  }

  // Sumar ahorros excluyendo cupón (se calcula después)
  let totalSavings = applied.reduce((s, a) => s + a.amount, 0);

  // Cupón al final
  const c = input.coupon;
  if (c && c.active) {
    const expired = c.expiresAt && now > c.expiresAt;
    const limitReached = c.usageLimit != null && c.usedCount >= c.usageLimit;
    const minOk = !c.minCartTotal || subtotalAfterProduct >= c.minCartTotal;
    if (!expired && !limitReached && minOk) {
      let disc = 0;
      if (c.type === 'PERCENT') {
        disc = +(subtotalAfterProduct * (c.value / 100)).toFixed(2);
      } else {
        disc = Math.min(c.value, subtotalAfterProduct);
      }
      if (disc > 0) {
        applied.push({
          couponCode: c.code,
          name: c.name || `Cupón ${c.code}`,
          type: c.type === 'PERCENT' ? 'COUPON_PERCENT' : 'COUPON_FIXED',
          amount: +disc.toFixed(2),
        });
        totalSavings += disc;
      }
    }
  }

  const finalLineTotal = items.reduce((s, it) => s + it.finalPrice * it.quantity, 0);
  // Restar PERCENT_TOTAL + BUNDLE + cupón (los demás ya están en finalPrice)
  const nonLineSavings = applied
    .filter(a => a.type === 'PERCENT_TOTAL' || a.type === 'BUNDLE' || a.type === 'COUPON_PERCENT' || a.type === 'COUPON_FIXED')
    .reduce((s, a) => s + a.amount, 0);
  const total = Math.max(0, +(finalLineTotal - nonLineSavings).toFixed(2));

  return {
    items,
    appliedPromotions: applied,
    totalSavings: +totalSavings.toFixed(2),
    baseTotal: +baseTotal.toFixed(2),
    total,
    priceListUsed: list,
  };
}

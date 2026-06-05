/**
 * Modelos de pricing dinámico: promociones, listas de precios y cupones.
 *
 * Tres conceptos separados:
 *   - Promotion: regla automática (no requiere código) sobre el carrito.
 *   - PriceList: tabla de precios alternativa aplicada por tag de cliente o lista de clientes específicos.
 *   - Coupon: código que el cajero ingresa manualmente; al validarse aplica un descuento.
 */

export type PromotionType =
  | 'PERCENT_TOTAL'      // % off al total del carrito
  | 'PERCENT_PRODUCT'    // % off a productos específicos
  | 'BUY_X_GET_Y'        // ej: 3x2 (compra X, paga Y) — productos elegibles
  | 'BUNDLE';            // combo: lista de productos a un precio fijo

export interface Promotion {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  type: PromotionType;

  // Vigencia
  active: boolean;
  validFrom?: number | null;   // epoch ms — null = sin inicio
  validTo?: number | null;     // epoch ms — null = sin fin

  // Para PERCENT_TOTAL / PERCENT_PRODUCT: porcentaje (0..100)
  percentValue?: number;

  // Para PERCENT_PRODUCT / BUY_X_GET_Y: productos a los que aplica
  productIds?: string[];

  // Para PERCENT_TOTAL: monto mínimo del carrito antes de aplicar
  minCartTotal?: number;

  // Para BUY_X_GET_Y: comprar X y pagar Y (X > Y, ambos > 0)
  buyX?: number;
  payY?: number;

  // Para BUNDLE: productos requeridos + precio total fijo del combo
  bundleProductIds?: string[]; // todos deben estar en el carrito (al menos 1 vez)
  bundlePrice?: number;        // precio fijo total cuando se completa el combo

  // Stack: si false, no se aplica con otra promoción ya activa en la misma línea
  stackable?: boolean;

  createdAt: number;
  updatedAt: number;
}

export interface PriceListItem {
  productId: string;
  price: number; // override absoluto, en USD
}

export interface PriceList {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  active: boolean;

  // Aplicación: por tag de cliente O por lista de clientes específicos
  appliesByTag?: string | null;
  appliesByClientIds?: string[];

  items: PriceListItem[];

  createdAt: number;
  updatedAt: number;
}

export interface Coupon {
  id: string;
  ownerId: string;
  code: string;           // normalizado a uppercase trimmed
  name?: string;

  type: 'PERCENT' | 'FIXED'; // % o monto fijo en USD
  value: number;

  active: boolean;
  expiresAt?: number | null;
  minCartTotal?: number;
  usageLimit?: number | null; // null = ilimitado
  usedCount: number;

  createdAt: number;
  updatedAt: number;
}

/**
 * Lo que retorna el engine de pricing por venta. Se persiste un resumen en cada Sale.
 */
export interface AppliedPromotion {
  promotionId?: string;
  couponCode?: string;
  name: string;
  type: PromotionType | 'COUPON_PERCENT' | 'COUPON_FIXED';
  amount: number;          // ahorro generado por esta promo, en USD
  productIds?: string[];   // productos afectados (para reporte)
}

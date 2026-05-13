"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useOwnerContext } from '@/hooks/useOwnerContext';
import { useInventory } from '@/hooks/useInventory';
import { useClients } from '@/hooks/useClients';
import { usePromotions, usePriceLists, useCoupons } from '@/hooks/usePricingData';
import { PromotionService, PriceListService, CouponService } from '@/services/promotion.service';
import { Promotion, PromotionType, PriceList, PriceListItem, Coupon } from '@/types/promotion';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tag, Percent, Ticket, Plus, Trash2, X, Edit2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { can } from '@/lib/permissions';
import { useCurrency } from '@/context/CurrencyContext';

type Tab = 'promotions' | 'priceLists' | 'coupons';

const TYPE_LABEL: Record<PromotionType, string> = {
  PERCENT_TOTAL: '% al total',
  PERCENT_PRODUCT: '% por producto',
  BUY_X_GET_Y: 'X x Y',
  BUNDLE: 'Combo',
};

export default function PricingScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { ownerId } = useOwnerContext();
  const { products } = useInventory(ownerId);
  const { clients } = useClients(ownerId);
  const { items: promotions } = usePromotions(ownerId);
  const { items: priceLists } = usePriceLists(ownerId);
  const { items: coupons } = useCoupons(ownerId);
  const { formatPrice } = useCurrency();
  const [tab, setTab] = useState<Tab>('promotions');

  useEffect(() => {
    if (!authLoading && user) {
      if (!can(user.role, 'manageBusiness')) router.replace('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || !can(user.role, 'manageBusiness')) return null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 md:pb-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-ui-text uppercase leading-none">Precios</h1>
        <p className="text-ui-text-muted text-sm mt-2 font-medium">
          Promociones, listas de precios y cupones
        </p>
      </div>

      <div className="ui-input-box p-1 md:p-1.5 flex gap-1 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-x-auto hide-scrollbar w-full md:w-auto md:inline-flex">
        {[
          { id: 'promotions' as const, label: 'Promociones', icon: Percent },
          { id: 'priceLists' as const, label: 'Listas', icon: Tag },
          { id: 'coupons' as const, label: 'Cupones', icon: Ticket },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 md:flex-none ${
              tab === t.id ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-ui-text-muted hover:text-ui-text hover:bg-white/5'
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'promotions' && (
        <PromotionsTab ownerId={ownerId} promotions={promotions} products={products} formatPrice={formatPrice} />
      )}
      {tab === 'priceLists' && (
        <PriceListsTab ownerId={ownerId} priceLists={priceLists} products={products} clients={clients} formatPrice={formatPrice} />
      )}
      {tab === 'coupons' && (
        <CouponsTab ownerId={ownerId} coupons={coupons} formatPrice={formatPrice} />
      )}
    </div>
  );
}

// ───────────────────────── PROMOTIONS ─────────────────────────

function PromotionsTab({ ownerId, promotions, products, formatPrice }: {
  ownerId: string;
  promotions: Promotion[];
  products: { id: string; name: string }[];
  formatPrice: (n: number) => string;
}) {
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [creating, setCreating] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black uppercase tracking-tight text-ui-text">Promociones</h2>
        <Button size="sm" onClick={() => setCreating(true)} className="gap-2">
          <Plus size={14} /> Nueva
        </Button>
      </div>
      {promotions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-ui-text-muted text-sm">No hay promociones configuradas.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {promotions.map(p => (
            <Card key={p.id} className="ui-card border-0 bg-white/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${p.active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-ui-bg text-ui-text-muted'}`}>
                        {p.active ? 'Activa' : 'Inactiva'}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-ui-text-muted">{TYPE_LABEL[p.type]}</span>
                    </div>
                    <h3 className="font-black text-sm text-ui-text">{p.name}</h3>
                    {p.description && <p className="text-[10px] text-ui-text-muted mt-0.5">{p.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(p)} className="p-1.5 text-ui-text-muted hover:text-accent-primary">
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`¿Eliminar la promoción "${p.name}"?`)) {
                          try { await PromotionService.remove(p.id); toast.success('Eliminada'); }
                          catch { toast.error('No se pudo eliminar'); }
                        }
                      }}
                      className="p-1.5 text-ui-text-muted hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <PromotionSummary promotion={p} products={products} formatPrice={formatPrice} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {(creating || editing) && (
        <PromotionEditor
          ownerId={ownerId}
          initial={editing ?? null}
          products={products}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}

function PromotionSummary({ promotion: p, products, formatPrice }: {
  promotion: Promotion;
  products: { id: string; name: string }[];
  formatPrice: (n: number) => string;
}) {
  const productNames = (ids?: string[]) => {
    if (!ids || ids.length === 0) return '—';
    const names = ids
      .slice(0, 3)
      .map(id => products.find(p => p.id === id)?.name || 'Producto')
      .join(', ');
    return ids.length > 3 ? `${names} +${ids.length - 3}` : names;
  };
  return (
    <div className="text-[10px] text-ui-text-muted font-bold space-y-0.5">
      {p.type === 'PERCENT_TOTAL' && <p>{p.percentValue}% al total{p.minCartTotal ? ` (min ${formatPrice(p.minCartTotal)})` : ''}</p>}
      {p.type === 'PERCENT_PRODUCT' && <p>{p.percentValue}% off en: {productNames(p.productIds)}</p>}
      {p.type === 'BUY_X_GET_Y' && <p>Compra {p.buyX} paga {p.payY} en: {productNames(p.productIds)}</p>}
      {p.type === 'BUNDLE' && <p>Combo a {formatPrice(p.bundlePrice || 0)}: {productNames(p.bundleProductIds)}</p>}
      {(p.validFrom || p.validTo) && (
        <p>
          Vigencia: {p.validFrom ? new Date(p.validFrom).toLocaleDateString() : '—'} → {p.validTo ? new Date(p.validTo).toLocaleDateString() : '—'}
        </p>
      )}
    </div>
  );
}

function PromotionEditor({ ownerId, initial, products, onClose }: {
  ownerId: string;
  initial: Promotion | null;
  products: { id: string; name: string }[];
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [type, setType] = useState<PromotionType>(initial?.type || 'PERCENT_TOTAL');
  const [active, setActive] = useState(initial?.active ?? true);
  const [stackable, setStackable] = useState(initial?.stackable ?? false);
  const [percentValue, setPercentValue] = useState(String(initial?.percentValue ?? ''));
  const [minCartTotal, setMinCartTotal] = useState(String(initial?.minCartTotal ?? ''));
  const [buyX, setBuyX] = useState(String(initial?.buyX ?? ''));
  const [payY, setPayY] = useState(String(initial?.payY ?? ''));
  const [bundlePrice, setBundlePrice] = useState(String(initial?.bundlePrice ?? ''));
  const [productIds, setProductIds] = useState<string[]>(initial?.productIds || []);
  const [bundleProductIds, setBundleProductIds] = useState<string[]>(initial?.bundleProductIds || []);
  const [validFrom, setValidFrom] = useState(initial?.validFrom ? new Date(initial.validFrom).toISOString().slice(0, 10) : '');
  const [validTo, setValidTo] = useState(initial?.validTo ? new Date(initial.validTo).toISOString().slice(0, 10) : '');
  const [productSearch, setProductSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const productList = useMemo(() => {
    const q = productSearch.toLowerCase();
    return q ? products.filter(p => p.name.toLowerCase().includes(q)) : products;
  }, [products, productSearch]);

  const toggleProduct = (id: string) => {
    setProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleBundle = (id: string) => {
    setBundleProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const save = async () => {
    if (!name.trim()) { toast.error('Falta el nombre'); return; }
    setIsSaving(true);
    try {
      const data: Omit<Promotion, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        active,
        stackable,
        validFrom: validFrom ? new Date(validFrom).getTime() : null,
        validTo: validTo ? new Date(validTo + 'T23:59:59').getTime() : null,
      };
      if (type === 'PERCENT_TOTAL' || type === 'PERCENT_PRODUCT') {
        data.percentValue = parseFloat(percentValue);
        if (!Number.isFinite(data.percentValue) || data.percentValue <= 0) { toast.error('Porcentaje inválido'); setIsSaving(false); return; }
      }
      if (type === 'PERCENT_TOTAL' && minCartTotal) {
        data.minCartTotal = parseFloat(minCartTotal);
      }
      if (type === 'PERCENT_PRODUCT' || type === 'BUY_X_GET_Y') {
        if (productIds.length === 0) { toast.error('Selecciona al menos un producto'); setIsSaving(false); return; }
        data.productIds = productIds;
      }
      if (type === 'BUY_X_GET_Y') {
        data.buyX = parseInt(buyX, 10);
        data.payY = parseInt(payY, 10);
        if (!data.buyX || !data.payY || data.buyX <= data.payY) {
          toast.error('Compra X > Paga Y, ambos enteros positivos');
          setIsSaving(false);
          return;
        }
      }
      if (type === 'BUNDLE') {
        if (bundleProductIds.length < 2) { toast.error('Selecciona al menos 2 productos para el combo'); setIsSaving(false); return; }
        data.bundleProductIds = bundleProductIds;
        data.bundlePrice = parseFloat(bundlePrice);
        if (!Number.isFinite(data.bundlePrice) || data.bundlePrice < 0) { toast.error('Precio de combo inválido'); setIsSaving(false); return; }
      }
      if (isEdit && initial) {
        await PromotionService.update(initial.id, data);
        toast.success('Promoción actualizada');
      } else {
        await PromotionService.add(ownerId, data);
        toast.success('Promoción creada');
      }
      onClose();
    } catch (e) {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg">
      <Card className="w-full max-w-2xl bg-slate-900/90 border-white/10 rounded-[32px] max-h-[90vh] overflow-hidden flex flex-col">
        <CardContent className="p-6 md:p-8 space-y-4 overflow-y-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{isEdit ? 'Editar' : 'Nueva'} promoción</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white"><X /></button>
          </div>

          <Input label="NOMBRE" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: 20% Black Friday" />
          <Input label="DESCRIPCIÓN (opcional)" value={description} onChange={e => setDescription(e.target.value)} />

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">TIPO</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as PromotionType)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-wide text-white focus:outline-none focus:border-accent-primary"
            >
              <option value="PERCENT_TOTAL">{TYPE_LABEL.PERCENT_TOTAL}</option>
              <option value="PERCENT_PRODUCT">{TYPE_LABEL.PERCENT_PRODUCT}</option>
              <option value="BUY_X_GET_Y">{TYPE_LABEL.BUY_X_GET_Y}</option>
              <option value="BUNDLE">{TYPE_LABEL.BUNDLE}</option>
            </select>
          </div>

          {(type === 'PERCENT_TOTAL' || type === 'PERCENT_PRODUCT') && (
            <Input label="PORCENTAJE %" type="number" min={0} max={100} step="0.1" value={percentValue} onChange={e => setPercentValue(e.target.value)} />
          )}
          {type === 'PERCENT_TOTAL' && (
            <Input label="MONTO MÍNIMO DE CARRITO (opcional)" type="number" min={0} step="0.01" value={minCartTotal} onChange={e => setMinCartTotal(e.target.value)} />
          )}
          {type === 'BUY_X_GET_Y' && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="COMPRA X" type="number" min={1} step="1" value={buyX} onChange={e => setBuyX(e.target.value)} />
              <Input label="PAGA Y" type="number" min={1} step="1" value={payY} onChange={e => setPayY(e.target.value)} />
            </div>
          )}
          {type === 'BUNDLE' && (
            <Input label="PRECIO TOTAL DEL COMBO" type="number" min={0} step="0.01" value={bundlePrice} onChange={e => setBundlePrice(e.target.value)} />
          )}

          {(type === 'PERCENT_PRODUCT' || type === 'BUY_X_GET_Y' || type === 'BUNDLE') && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">
                {type === 'BUNDLE' ? 'PRODUCTOS DEL COMBO' : 'PRODUCTOS ELEGIBLES'}
                {' '}({(type === 'BUNDLE' ? bundleProductIds : productIds).length})
              </label>
              <Input leftIcon={<Search size={14} />} placeholder="Buscar producto..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
              <div className="max-h-48 overflow-y-auto space-y-1 bg-black/30 rounded-xl border border-white/10 p-2">
                {productList.slice(0, 50).map(prod => {
                  const ids = type === 'BUNDLE' ? bundleProductIds : productIds;
                  const checked = ids.includes(prod.id);
                  return (
                    <button
                      key={prod.id}
                      onClick={() => type === 'BUNDLE' ? toggleBundle(prod.id) : toggleProduct(prod.id)}
                      className={`w-full text-left p-2 rounded-lg text-xs font-bold flex items-center gap-2 ${checked ? 'bg-accent-primary/20 text-accent-primary' : 'text-white/70 hover:bg-white/5'}`}
                    >
                      <span className={`w-3 h-3 rounded border-2 flex items-center justify-center ${checked ? 'border-accent-primary bg-accent-primary' : 'border-white/30'}`}>
                        {checked && <span className="text-white text-[8px]">✓</span>}
                      </span>
                      <span className="truncate">{prod.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input label="VÁLIDO DESDE (opcional)" type="date" value={validFrom} onChange={e => setValidFrom(e.target.value)} />
            <Input label="VÁLIDO HASTA (opcional)" type="date" value={validTo} onChange={e => setValidTo(e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">Activa</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={stackable} onChange={e => setStackable(e.target.checked)} />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">Acumulable con otras</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>CANCELAR</Button>
            <Button onClick={save} isLoading={isSaving} className="flex-1">{isEdit ? 'ACTUALIZAR' : 'CREAR'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ───────────────────────── PRICE LISTS ─────────────────────────

function PriceListsTab({ ownerId, priceLists, products, clients, formatPrice }: {
  ownerId: string;
  priceLists: PriceList[];
  products: { id: string; name: string; price: number }[];
  clients: { id: string; name: string; tags?: string[] }[];
  formatPrice: (n: number) => string;
}) {
  const [editing, setEditing] = useState<PriceList | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black uppercase tracking-tight text-ui-text">Listas de precios</h2>
        <Button size="sm" onClick={() => setCreating(true)} className="gap-2"><Plus size={14} /> Nueva</Button>
      </div>
      {priceLists.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-ui-text-muted text-sm">No hay listas de precios.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {priceLists.map(pl => (
            <Card key={pl.id} className="ui-card border-0 bg-white/5">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${pl.active ? 'bg-emerald-500/15 text-emerald-600' : 'bg-ui-bg text-ui-text-muted'}`}>
                        {pl.active ? 'Activa' : 'Inactiva'}
                      </span>
                      {pl.appliesByTag && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-full">
                          tag: {pl.appliesByTag}
                        </span>
                      )}
                      {pl.appliesByClientIds && pl.appliesByClientIds.length > 0 && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-ui-text-muted">
                          {pl.appliesByClientIds.length} cliente(s)
                        </span>
                      )}
                    </div>
                    <h3 className="font-black text-sm text-ui-text">{pl.name}</h3>
                    <p className="text-[10px] text-ui-text-muted">{pl.items.length} producto(s) con precio override</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditing(pl)} className="p-1.5 text-ui-text-muted hover:text-accent-primary"><Edit2 size={14} /></button>
                    <button
                      onClick={async () => {
                        if (confirm(`¿Eliminar la lista "${pl.name}"?`)) {
                          try { await PriceListService.remove(pl.id); toast.success('Eliminada'); }
                          catch { toast.error('No se pudo eliminar'); }
                        }
                      }}
                      className="p-1.5 text-ui-text-muted hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {(creating || editing) && (
        <PriceListEditor
          ownerId={ownerId}
          initial={editing ?? null}
          products={products}
          clients={clients}
          formatPrice={formatPrice}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}

function PriceListEditor({ ownerId, initial, products, clients, formatPrice, onClose }: {
  ownerId: string;
  initial: PriceList | null;
  products: { id: string; name: string; price: number }[];
  clients: { id: string; name: string; tags?: string[] }[];
  formatPrice: (n: number) => string;
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || '');
  const [active, setActive] = useState(initial?.active ?? true);
  const [appliesByTag, setAppliesByTag] = useState(initial?.appliesByTag || '');
  const [clientIds, setClientIds] = useState<string[]>(initial?.appliesByClientIds || []);
  const [itemsMap, setItemsMap] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    (initial?.items || []).forEach(it => { m[it.productId] = String(it.price); });
    return m;
  });
  const [productSearch, setProductSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    clients.forEach(c => (c.tags || []).forEach(t => set.add(t)));
    return Array.from(set);
  }, [clients]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase();
    return q ? products.filter(p => p.name.toLowerCase().includes(q)) : products.slice(0, 100);
  }, [products, productSearch]);

  const save = async () => {
    if (!name.trim()) { toast.error('Falta el nombre'); return; }
    const items: PriceListItem[] = Object.entries(itemsMap)
      .filter(([, v]) => v.trim() !== '')
      .map(([productId, raw]) => ({ productId, price: parseFloat(raw) }))
      .filter(it => Number.isFinite(it.price) && it.price >= 0);
    if (items.length === 0) { toast.error('Define el precio de al menos un producto'); return; }
    setIsSaving(true);
    try {
      const data: Omit<PriceList, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        active,
        items,
        appliesByTag: appliesByTag.trim() || null,
        appliesByClientIds: clientIds.length > 0 ? clientIds : [],
      };
      if (isEdit && initial) {
        await PriceListService.update(initial.id, data);
        toast.success('Lista actualizada');
      } else {
        await PriceListService.add(ownerId, data);
        toast.success('Lista creada');
      }
      onClose();
    } catch (e) {
      toast.error('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg">
      <Card className="w-full max-w-2xl bg-slate-900/90 border-white/10 rounded-[32px] max-h-[90vh] overflow-hidden flex flex-col">
        <CardContent className="p-6 md:p-8 space-y-4 overflow-y-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{isEdit ? 'Editar' : 'Nueva'} lista de precios</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white"><X /></button>
          </div>

          <Input label="NOMBRE" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Mayoristas" />

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">APLICA POR TAG DE CLIENTE</label>
            <select
              value={appliesByTag}
              onChange={e => setAppliesByTag(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-accent-primary"
            >
              <option value="">Ninguno</option>
              {availableTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">O CLIENTES ESPECÍFICOS ({clientIds.length})</label>
            <div className="max-h-32 overflow-y-auto space-y-1 bg-black/30 rounded-xl border border-white/10 p-2">
              {clients.slice(0, 30).map(c => {
                const checked = clientIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setClientIds(prev => checked ? prev.filter(x => x !== c.id) : [...prev, c.id])}
                    className={`w-full text-left p-2 rounded-lg text-xs font-bold flex items-center gap-2 ${checked ? 'bg-accent-primary/20 text-accent-primary' : 'text-white/70 hover:bg-white/5'}`}
                  >
                    <span className={`w-3 h-3 rounded border-2 flex items-center justify-center ${checked ? 'border-accent-primary bg-accent-primary' : 'border-white/30'}`}>
                      {checked && <span className="text-white text-[8px]">✓</span>}
                    </span>
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">PRECIOS POR PRODUCTO</label>
            <Input leftIcon={<Search size={14} />} placeholder="Buscar producto..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
            <div className="max-h-72 overflow-y-auto space-y-1 bg-black/30 rounded-xl border border-white/10 p-2">
              {filteredProducts.map(p => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                  <span className="flex-1 text-xs font-bold text-white truncate">{p.name}</span>
                  <span className="text-[10px] text-white/40 font-bold whitespace-nowrap">Lista: {formatPrice(p.price)}</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="—"
                    value={itemsMap[p.id] || ''}
                    onChange={e => setItemsMap(prev => ({ ...prev, [p.id]: e.target.value }))}
                    className="w-24 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-white focus:outline-none focus:border-accent-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">Activa</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>CANCELAR</Button>
            <Button onClick={save} isLoading={isSaving} className="flex-1">{isEdit ? 'ACTUALIZAR' : 'CREAR'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ───────────────────────── COUPONS ─────────────────────────

function CouponsTab({ ownerId, coupons, formatPrice }: {
  ownerId: string;
  coupons: Coupon[];
  formatPrice: (n: number) => string;
}) {
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black uppercase tracking-tight text-ui-text">Cupones</h2>
        <Button size="sm" onClick={() => setCreating(true)} className="gap-2"><Plus size={14} /> Nuevo</Button>
      </div>
      {coupons.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-ui-text-muted text-sm">No hay cupones.</CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {coupons.map(c => {
            const expired = c.expiresAt && Date.now() > c.expiresAt;
            const limitReached = c.usageLimit != null && c.usedCount >= c.usageLimit;
            return (
              <Card key={c.id} className="ui-card border-0 bg-white/5">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${c.active && !expired && !limitReached ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-600'}`}>
                          {expired ? 'Vencido' : limitReached ? 'Agotado' : (c.active ? 'Activo' : 'Inactivo')}
                        </span>
                      </div>
                      <h3 className="font-black text-base text-ui-text font-mono">{c.code}</h3>
                      {c.name && <p className="text-[10px] text-ui-text-muted">{c.name}</p>}
                      <p className="text-[10px] text-ui-text-muted mt-1">
                        {c.type === 'PERCENT' ? `${c.value}% de descuento` : `${formatPrice(c.value)} de descuento`}
                        {c.minCartTotal ? ` (min ${formatPrice(c.minCartTotal)})` : ''}
                      </p>
                      <p className="text-[10px] text-ui-text-muted">
                        Usado {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''} {c.expiresAt ? `· vence ${new Date(c.expiresAt).toLocaleDateString()}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditing(c)} className="p-1.5 text-ui-text-muted hover:text-accent-primary"><Edit2 size={14} /></button>
                      <button
                        onClick={async () => {
                          if (confirm(`¿Eliminar el cupón ${c.code}?`)) {
                            try { await CouponService.remove(c.id); toast.success('Eliminado'); }
                            catch { toast.error('No se pudo eliminar'); }
                          }
                        }}
                        className="p-1.5 text-ui-text-muted hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {(creating || editing) && (
        <CouponEditor ownerId={ownerId} initial={editing ?? null} onClose={() => { setEditing(null); setCreating(false); }} />
      )}
    </div>
  );
}

function CouponEditor({ ownerId, initial, onClose }: { ownerId: string; initial: Coupon | null; onClose: () => void; }) {
  const isEdit = !!initial;
  const [code, setCode] = useState(initial?.code || '');
  const [name, setName] = useState(initial?.name || '');
  const [type, setType] = useState<'PERCENT' | 'FIXED'>(initial?.type || 'PERCENT');
  const [value, setValue] = useState(String(initial?.value ?? ''));
  const [active, setActive] = useState(initial?.active ?? true);
  const [minCartTotal, setMinCartTotal] = useState(String(initial?.minCartTotal ?? ''));
  const [usageLimit, setUsageLimit] = useState(initial?.usageLimit ? String(initial.usageLimit) : '');
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ? new Date(initial.expiresAt).toISOString().slice(0, 10) : '');
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!code.trim()) { toast.error('Falta el código'); return; }
    const val = parseFloat(value);
    if (!Number.isFinite(val) || val <= 0) { toast.error('Valor inválido'); return; }
    setIsSaving(true);
    try {
      const data = {
        code: code.trim(),
        name: name.trim() || undefined,
        type,
        value: val,
        active,
        minCartTotal: minCartTotal ? parseFloat(minCartTotal) : undefined,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        expiresAt: expiresAt ? new Date(expiresAt + 'T23:59:59').getTime() : null,
      };
      if (isEdit && initial) {
        await CouponService.update(initial.id, data);
        toast.success('Cupón actualizado');
      } else {
        await CouponService.add(ownerId, data);
        toast.success('Cupón creado');
      }
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg">
      <Card className="w-full max-w-md bg-slate-900/90 border-white/10 rounded-[32px]">
        <CardContent className="p-6 md:p-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">{isEdit ? 'Editar' : 'Nuevo'} cupón</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white"><X /></button>
          </div>

          <Input label="CÓDIGO" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="DESCUENTO10" />
          <Input label="NOMBRE (opcional)" value={name} onChange={e => setName(e.target.value)} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">TIPO</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as 'PERCENT' | 'FIXED')}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-accent-primary"
              >
                <option value="PERCENT">% Porcentaje</option>
                <option value="FIXED">$ Monto fijo</option>
              </select>
            </div>
            <Input label="VALOR" type="number" min={0} step="0.01" value={value} onChange={e => setValue(e.target.value)} />
          </div>

          <Input label="MIN. CARRITO (opcional)" type="number" min={0} step="0.01" value={minCartTotal} onChange={e => setMinCartTotal(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="LÍMITE DE USOS" type="number" min={0} step="1" value={usageLimit} onChange={e => setUsageLimit(e.target.value)} />
            <Input label="VENCE EL" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
            <span className="text-xs font-bold uppercase tracking-widest text-white/70">Activo</span>
          </label>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>CANCELAR</Button>
            <Button onClick={save} isLoading={isSaving} className="flex-1">{isEdit ? 'ACTUALIZAR' : 'CREAR'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

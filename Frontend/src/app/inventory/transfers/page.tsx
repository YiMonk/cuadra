"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useOwnerContext } from '@/hooks/useOwnerContext';
import { useInventory } from '@/hooks/useInventory';
import { LocationService } from '@/services/location.service';
import { StockTransferService } from '@/services/stockTransfer.service';
import type { Location } from '@/types/location';
import type { StockTransfer, StockTransferItem } from '@/types/stockTransfer';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowRight, ArrowLeftRight, Search, Plus, Package, X } from 'lucide-react';
import { toast } from 'sonner';
import { can } from '@/lib/permissions';
import { getStockAtLocation, hasLocationStock } from '@/lib/stock';

export default function TransfersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { ownerId } = useOwnerContext();
  const { products } = useInventory(ownerId);
  const [locations, setLocations] = useState<Location[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (!can(user.role, 'manageInventory')) router.replace('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!ownerId) return;
    const unsubLoc = LocationService.subscribeToLocations(ownerId, setLocations);
    const unsubTr = StockTransferService.subscribe(ownerId, setTransfers);
    return () => { unsubLoc(); unsubTr(); };
  }, [ownerId]);

  if (authLoading || !user || !can(user.role, 'manageInventory')) return null;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-ui-text uppercase leading-none">Transferencias</h1>
          <p className="text-ui-text-muted text-sm mt-2 font-medium">
            Mover stock entre sucursales
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="gap-2" size="lg" disabled={locations.length < 2}>
          <Plus size={18} />
          Nueva Transferencia
        </Button>
      </div>

      {locations.length < 2 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-sm text-ui-text-muted">
            Necesitas al menos 2 sucursales para hacer transferencias. Ve a Administración → Sedes.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-black uppercase tracking-tight text-ui-text">Historial</h2>
        {transfers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-sm text-ui-text-muted">
              No hay transferencias registradas.
            </CardContent>
          </Card>
        ) : (
          transfers.map(t => (
            <Card key={t.id} className="ui-card border-0 bg-white/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-tight text-ui-text">
                    <span>{t.fromLocationName}</span>
                    <ArrowRight size={16} className="text-accent-primary" />
                    <span>{t.toLocationName}</span>
                  </div>
                  <span className="text-[10px] font-bold text-ui-text-muted">
                    {new Date(t.createdAt).toLocaleString()} · {t.createdByName || 'Sistema'}
                  </span>
                </div>
                <div className="space-y-1">
                  {t.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-ui-text">{it.productName}</span>
                      <span className="font-black text-accent-primary">{it.quantity}u</span>
                    </div>
                  ))}
                </div>
                {t.notes && (
                  <p className="text-[10px] text-ui-text-muted italic border-l-2 border-ui-border pl-2">
                    {t.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showModal && (
        <TransferModal
          ownerId={ownerId}
          locations={locations}
          products={products}
          currentUser={user}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function TransferModal({ ownerId, locations, products, currentUser, onClose }: {
  ownerId: string;
  locations: Location[];
  products: any[];
  currentUser: { uid: string; displayName: string | null; email: string | null };
  onClose: () => void;
}) {
  const [fromLocationId, setFromLocationId] = useState(locations[0]?.id || '');
  const [toLocationId, setToLocationId] = useState(locations[1]?.id || '');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => !q || p.name.toLowerCase().includes(q));
  }, [products, search]);

  const selectedItemsCount = Object.values(items).filter(v => v > 0).length;

  const setQty = (productId: string, qty: number) => {
    setItems(prev => ({ ...prev, [productId]: Math.max(0, qty) }));
  };

  const handleSave = async () => {
    if (!fromLocationId || !toLocationId) { toast.error('Selecciona origen y destino'); return; }
    if (fromLocationId === toLocationId) { toast.error('Origen y destino deben ser distintos'); return; }
    const list: StockTransferItem[] = [];
    for (const [pid, qty] of Object.entries(items)) {
      if (qty > 0) {
        const p = products.find((x: any) => x.id === pid);
        if (!p) continue;
        const available = hasLocationStock(p) ? getStockAtLocation(p, fromLocationId) : (p.stock || 0);
        if (qty > available) {
          toast.error(`"${p.name}" — solo hay ${available} disponibles en origen`);
          return;
        }
        list.push({ productId: pid, productName: p.name, quantity: qty });
      }
    }
    if (list.length === 0) { toast.error('Selecciona al menos un producto con cantidad'); return; }
    setIsSaving(true);
    try {
      await StockTransferService.create({
        ownerId,
        fromLocationId,
        fromLocationName: locations.find(l => l.id === fromLocationId)?.name || '',
        toLocationId,
        toLocationName: locations.find(l => l.id === toLocationId)?.name || '',
        items: list,
        notes: notes.trim() || undefined,
        createdBy: { id: currentUser.uid, name: currentUser.displayName || currentUser.email || 'Usuario' },
      });
      toast.success(`Transferencia registrada: ${list.length} producto(s)`);
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Error al transferir');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg">
      <Card className="w-full max-w-2xl bg-slate-900/90 border-white/10 rounded-[32px] max-h-[90vh] overflow-hidden flex flex-col">
        <CardContent className="p-6 md:p-8 space-y-4 overflow-y-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Nueva transferencia</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white"><X /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">ORIGEN</label>
              <select
                value={fromLocationId}
                onChange={e => setFromLocationId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-accent-primary"
              >
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">DESTINO</label>
              <select
                value={toLocationId}
                onChange={e => setToLocationId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-accent-primary"
              >
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <Input leftIcon={<Search size={14} />} placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} />

          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">
              Productos ({selectedItemsCount} seleccionado{selectedItemsCount === 1 ? '' : 's'})
            </p>
            <div className="max-h-72 overflow-y-auto space-y-1 bg-black/30 rounded-xl border border-white/10 p-2">
              {filteredProducts.slice(0, 100).map((p: any) => {
                const available = hasLocationStock(p) ? getStockAtLocation(p, fromLocationId) : (p.stock || 0);
                const qty = items[p.id] || 0;
                return (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <Package size={12} className="text-white/40 shrink-0" />
                    <span className="flex-1 text-xs font-bold text-white truncate">{p.name}</span>
                    <span className="text-[10px] text-white/40 font-bold whitespace-nowrap">Disp: {available}</span>
                    <input
                      type="number"
                      min={0}
                      max={available}
                      value={qty || ''}
                      onChange={e => setQty(p.id, parseInt(e.target.value, 10) || 0)}
                      placeholder="0"
                      className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-white text-center focus:outline-none focus:border-accent-primary"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">NOTAS (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:border-accent-primary min-h-[60px]"
              placeholder="Ej: Reabastecimiento mensual sucursal Centro"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>CANCELAR</Button>
            <Button onClick={handleSave} isLoading={isSaving} className="flex-1 gap-2">
              <ArrowLeftRight size={16} />
              REGISTRAR
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

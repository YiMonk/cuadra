/**
 * Helpers para stock multi-sucursal.
 *
 * Regla: si Product.stockByLocation existe y tiene al menos una entry, es la
 * fuente de verdad. Si no, `Product.stock` (legado) representa el único bucket.
 */
import { Product } from '@/types/inventory';

export function hasLocationStock(p: Product): boolean {
  return !!p.stockByLocation && Object.keys(p.stockByLocation).length > 0;
}

/** Total de stock root (suma de stockByLocation o stock legacy). */
export function getTotalStock(p: Product): number {
  if (hasLocationStock(p)) {
    return Object.values(p.stockByLocation!).reduce((s, v) => s + (Number(v) || 0), 0);
  }
  return Number(p.stock) || 0;
}

/** Stock disponible para vender desde una sucursal específica (o "all" para total). */
export function getStockAtLocation(p: Product, locationId: string | null | undefined): number {
  if (!locationId || locationId === 'all') return getTotalStock(p);
  if (hasLocationStock(p)) return Number(p.stockByLocation![locationId]) || 0;
  // Sin stockByLocation: si el producto tiene una location asignada (legado) y coincide, devuelve stock; si no, 0.
  if (p.location && p.location !== locationId) return 0;
  return Number(p.stock) || 0;
}

/**
 * Devuelve el patch de actualización para deducir `qty` unidades desde una sucursal.
 * Garantiza consistencia: actualiza el bucket y mantiene el stock raíz como suma del map.
 */
export function buildStockDeduction(
  p: Product,
  locationId: string | null | undefined,
  qty: number
): { patch: Partial<Product>; newTotal: number } {
  if (hasLocationStock(p) && locationId && locationId !== 'all') {
    const current = Number(p.stockByLocation![locationId]) || 0;
    if (current < qty) throw new Error(`Stock insuficiente en sucursal para "${p.name}". Disponible: ${current}`);
    const updated = { ...p.stockByLocation!, [locationId]: current - qty };
    const newTotal = Object.values(updated).reduce((s, v) => s + (Number(v) || 0), 0);
    return {
      patch: { stockByLocation: updated, stock: newTotal, updatedAt: Date.now() },
      newTotal,
    };
  }
  // Fallback: deducir del stock legacy
  const current = Number(p.stock) || 0;
  if (current < qty) throw new Error(`Stock insuficiente para "${p.name}". Disponible: ${current}`);
  return {
    patch: { stock: current - qty, updatedAt: Date.now() },
    newTotal: current - qty,
  };
}

/** Patch para agregar `qty` unidades a una sucursal (compra, devolución, transferencia in). */
export function buildStockAddition(
  p: Product,
  locationId: string | null | undefined,
  qty: number
): { patch: Partial<Product>; newTotal: number } {
  if (hasLocationStock(p) || locationId) {
    const map = { ...(p.stockByLocation || {}) };
    const key = locationId || p.location || '__unassigned';
    map[key] = (Number(map[key]) || 0) + qty;
    const newTotal = Object.values(map).reduce((s, v) => s + (Number(v) || 0), 0);
    return {
      patch: { stockByLocation: map, stock: newTotal, updatedAt: Date.now() },
      newTotal,
    };
  }
  const current = Number(p.stock) || 0;
  return {
    patch: { stock: current + qty, updatedAt: Date.now() },
    newTotal: current + qty,
  };
}

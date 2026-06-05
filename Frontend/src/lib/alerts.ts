import { Sale } from '@/types/sales';
import { Product } from '@/types/inventory';
import { Client } from '@/types/client';

export type AlertSeverity = 'info' | 'warning' | 'danger';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  href?: string;
  /** Etiqueta clave del tipo de alerta — útil para agrupar/filtrar. */
  kind:
    | 'stock_out'
    | 'stock_low'
    | 'debt_old'
    | 'sales_below_avg'
    | 'no_cost_data'
    | 'expiring_soon'
    | 'reorder_suggested';
}

const DAY_MS = 86400000;

/**
 * Engine cliente-side que produce alertas a partir de los datos ya cargados en
 * el dashboard. Sin escrituras a Firestore, sin red — barato de recalcular en
 * cada render.
 */
export function computeAlerts(opts: {
  products: Product[];
  sales: Sale[];
  clients: Client[];
  now?: number;
}): Alert[] {
  const now = opts.now ?? Date.now();
  const alerts: Alert[] = [];

  // 1) Stock agotado
  const outOfStock = opts.products.filter(p => (p.stock ?? 0) <= 0 && p.active !== false);
  if (outOfStock.length > 0) {
    alerts.push({
      id: 'stock_out',
      severity: 'danger',
      kind: 'stock_out',
      title: `${outOfStock.length} producto${outOfStock.length === 1 ? '' : 's'} sin stock`,
      description:
        outOfStock.slice(0, 3).map(p => p.name).join(', ') +
        (outOfStock.length > 3 ? `, y ${outOfStock.length - 3} más` : ''),
      href: '/inventory',
    });
  }

  // 2) Stock bajo (sobre el umbral minStockAlert)
  const lowStock = opts.products.filter(p => {
    const stock = p.stock ?? 0;
    const min = p.minStockAlert ?? 5;
    return stock > 0 && stock <= min && p.active !== false;
  });
  if (lowStock.length > 0) {
    alerts.push({
      id: 'stock_low',
      severity: 'warning',
      kind: 'stock_low',
      title: `${lowStock.length} producto${lowStock.length === 1 ? '' : 's'} con stock bajo`,
      description:
        lowStock.slice(0, 3).map(p => `${p.name} (${p.stock})`).join(', ') +
        (lowStock.length > 3 ? `, y ${lowStock.length - 3} más` : ''),
      href: '/inventory',
    });
  }

  // 3) Deudas antiguas (> 30 días)
  const oldDebts = opts.sales.filter(s => s.status === 'pending' && now - s.createdAt > 30 * DAY_MS);
  if (oldDebts.length > 0) {
    const total = oldDebts.reduce((sum, s) => sum + (s.total || 0), 0);
    const clientSet = new Set(oldDebts.map(s => s.clientId).filter(Boolean));
    alerts.push({
      id: 'debt_old',
      severity: 'warning',
      kind: 'debt_old',
      title: `${clientSet.size || oldDebts.length} cliente${clientSet.size === 1 ? '' : 's'} con deuda > 30 días`,
      description: `$${total.toFixed(2)} pendiente de cobrar`,
      href: '/collections',
    });
  }

  // 4) Ventas hoy vs promedio últimos 7 días
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const todayStart = startOfToday.getTime();
  const salesToday = opts.sales.filter(s => s.status !== 'cancelled' && s.createdAt >= todayStart);
  const totalToday = salesToday.reduce((sum, s) => sum + (s.total || 0), 0);

  const sevenDayWindowStart = todayStart - 7 * DAY_MS;
  const last7Sales = opts.sales.filter(s =>
    s.status !== 'cancelled' &&
    s.createdAt >= sevenDayWindowStart &&
    s.createdAt < todayStart
  );
  const total7Days = last7Sales.reduce((sum, s) => sum + (s.total || 0), 0);
  const avgDaily7 = total7Days / 7;
  // Solo dispara si ya hubo actividad significativa los últimos 7 días Y el día
  // está suficientemente avanzado (después de las 14h) para que tenga sentido comparar.
  const hour = new Date(now).getHours();
  if (avgDaily7 > 0 && hour >= 14 && totalToday < avgDaily7 * 0.5) {
    const pct = Math.round((totalToday / avgDaily7) * 100);
    alerts.push({
      id: 'sales_below_avg',
      severity: 'info',
      kind: 'sales_below_avg',
      title: 'Ventas hoy debajo del promedio',
      description: `Llevas $${totalToday.toFixed(2)} (${pct}% del promedio de la semana)`,
      href: '/reports',
    });
  }

  // 5) Productos sin costo definido — bloquea margen real
  const noCost = opts.products.filter(p => p.active !== false && (p.costPrice == null || p.costPrice <= 0));
  if (noCost.length > 0 && opts.products.length > 0 && noCost.length / opts.products.length > 0.3) {
    alerts.push({
      id: 'no_cost_data',
      severity: 'info',
      kind: 'no_cost_data',
      title: `${noCost.length} productos sin costo definido`,
      description: 'Define costos para ver márgenes y utilidad real.',
      href: '/inventory',
    });
  }

  // 6) Sugerencia de reorden — productos con stock OK pero se agotarán pronto
  // según la velocidad de venta de los últimos 30 días (cobertura < 7 días).
  const REORDER_COVER_DAYS = 7;
  const lookbackStart = todayStart - 30 * DAY_MS;
  const recentSales = opts.sales.filter(s => s.status !== 'cancelled' && s.createdAt >= lookbackStart);
  const unitsSold30: Record<string, number> = {};
  for (const s of recentSales) {
    for (const it of s.items || []) {
      unitsSold30[it.id] = (unitsSold30[it.id] || 0) + it.quantity;
    }
  }
  const reorderSuggested = opts.products.filter(p => {
    if (p.active === false || p.deletedAt) return false;
    const stock = (p.stock ?? 0) + (p.variants || []).reduce((s, v) => s + (Number(v.stock) || 0), 0);
    if (stock <= (p.minStockAlert ?? 5)) return false; // ya está cubierto por stock_low/stock_out
    const sold = unitsSold30[p.id] || 0;
    if (sold === 0) return false;
    const avgDaily = sold / 30;
    const daysOfCover = stock / avgDaily;
    return daysOfCover <= REORDER_COVER_DAYS;
  });
  if (reorderSuggested.length > 0) {
    alerts.push({
      id: 'reorder_suggested',
      severity: 'warning',
      kind: 'reorder_suggested',
      title: `${reorderSuggested.length} producto${reorderSuggested.length === 1 ? '' : 's'} para reordenar`,
      description:
        reorderSuggested.slice(0, 3).map(p => p.name).join(', ') +
        (reorderSuggested.length > 3 ? `, y ${reorderSuggested.length - 3} más` : '') +
        ` — se agotarán en ≤${REORDER_COVER_DAYS} días al ritmo actual.`,
      href: '/inventory',
    });
  }

  return alerts;
}

export const severityStyles: Record<AlertSeverity, { bg: string; border: string; text: string; dot: string }> = {
  info: {
    bg: 'bg-accent-primary/5',
    border: 'border-accent-primary/30',
    text: 'text-accent-primary',
    dot: 'bg-accent-primary',
  },
  warning: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/30',
    text: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  danger: {
    bg: 'bg-red-500/5',
    border: 'border-red-500/30',
    text: 'text-red-500',
    dot: 'bg-red-500',
  },
};

"use client";

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useOwnerContext } from '@/hooks/useOwnerContext';
import { useSales } from '@/hooks/useSales';
import { useClients } from '@/hooks/useClients';
import { useInventory } from '@/hooks/useInventory';
import { useCurrency } from '@/context/CurrencyContext';
import { Sale } from '@/types/sales';
import {
    ShoppingCart,
    DollarSign,
    Package,
    Bell,
    TrendingUp,
    TrendingDown,
    Users as UsersIcon,
    ArrowRight,
    Crown,
    Target,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { computeAlerts, severityStyles } from '@/lib/alerts';

const DAY_MS = 86400000;

function greeting(name?: string | null): string {
    const h = new Date().getHours();
    const first = (name || '').split(' ')[0];
    const prefix = h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
    return first ? `${prefix}, ${first}` : prefix;
}

function sumSalesInRange(sales: Sale[], start: number, end: number): { total: number; count: number } {
    let total = 0;
    let count = 0;
    for (const s of sales) {
        if (s.status === 'cancelled') continue;
        if (s.createdAt >= start && s.createdAt < end) {
            total += s.total || 0;
            count += 1;
        }
    }
    return { total, count };
}

interface DeltaProps {
    current: number;
    previous: number;
    label: string;
    formatPrice: (n: number) => string;
}
function Delta({ current, previous, label, formatPrice }: DeltaProps) {
    if (previous <= 0) {
        return (
            <span className="text-[10px] font-bold text-ui-text-muted/70 uppercase tracking-widest">
                {label}: —
            </span>
        );
    }
    const diff = current - previous;
    const pct = (diff / previous) * 100;
    const up = diff >= 0;
    const Icon = up ? TrendingUp : TrendingDown;
    return (
        <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest ${
                up ? 'text-emerald-500' : 'text-red-500'
            }`}
        >
            <Icon size={11} strokeWidth={2.5} />
            {pct >= 0 ? '+' : ''}
            {pct.toFixed(0)}%{' '}
            <span className="text-ui-text-muted/70 font-bold normal-case tracking-normal">
                {label} ({formatPrice(previous)})
            </span>
        </span>
    );
}

export default function HomePage() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { ownerId } = useOwnerContext();
    const { sales: pendingSales } = useSales(ownerId);
    const { clients } = useClients(ownerId);
    const { products } = useInventory(ownerId);
    const { formatPrice } = useCurrency();

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/auth/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!authLoading && user?.role === 'staff') {
            router.replace('/pos');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!authLoading && (user?.role === 'admin' || user?.role === 'admingod')) {
            router.replace('/admin/dashboard');
        }
    }, [user, authLoading, router]);

    // Métricas con comparativas
    const metrics = useMemo(() => {
        const now = Date.now();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const todayStart = startOfToday.getTime();
        const yesterdayStart = todayStart - DAY_MS;
        const weekAgoStart = todayStart - 7 * DAY_MS;
        const monthAgoStart = todayStart - 30 * DAY_MS;
        const twoWeeksAgoStart = todayStart - 14 * DAY_MS;
        const twoMonthsAgoStart = todayStart - 60 * DAY_MS;

        const today = sumSalesInRange(pendingSales, todayStart, now + 1);
        const yesterday = sumSalesInRange(pendingSales, yesterdayStart, todayStart);
        const thisWeek = sumSalesInRange(pendingSales, weekAgoStart, now + 1);
        const prevWeek = sumSalesInRange(pendingSales, twoWeeksAgoStart, weekAgoStart);
        const thisMonth = sumSalesInRange(pendingSales, monthAgoStart, now + 1);
        const prevMonth = sumSalesInRange(pendingSales, twoMonthsAgoStart, monthAgoStart);

        return { today, yesterday, thisWeek, prevWeek, thisMonth, prevMonth, todayStart };
    }, [pendingSales]);

    // Proyección de fin de mes (6.2.b)
    const projection = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const monthStart = new Date(year, month, 1).getTime();
        const monthEnd = new Date(year, month + 1, 1).getTime();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayOfMonth = now.getDate();

        const mtd = sumSalesInRange(pendingSales, monthStart, Date.now() + 1);
        const avgDaily = dayOfMonth > 0 ? mtd.total / dayOfMonth : 0;
        const projected = avgDaily * daysInMonth;
        const remaining = Math.max(0, projected - mtd.total);

        // Mes anterior completo para comparación
        const prevMonthStart = new Date(year, month - 1, 1).getTime();
        const prevMonthEnd = monthStart;
        const prev = sumSalesInRange(pendingSales, prevMonthStart, prevMonthEnd);

        return {
            mtdTotal: mtd.total,
            mtdCount: mtd.count,
            avgDaily,
            projected,
            remaining,
            daysInMonth,
            dayOfMonth,
            daysRemaining: daysInMonth - dayOfMonth,
            prevMonthTotal: prev.total,
            monthEnd,
        };
    }, [pendingSales]);

    // Tendencia últimos 7 días
    const trend = useMemo(() => {
        const arr: { label: string; total: number }[] = [];
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        for (let i = 6; i >= 0; i--) {
            const dayStart = startOfToday.getTime() - i * DAY_MS;
            const dayEnd = dayStart + DAY_MS;
            const { total } = sumSalesInRange(pendingSales, dayStart, dayEnd);
            arr.push({
                label: new Date(dayStart).toLocaleDateString('es-VE', { weekday: 'short' }).slice(0, 3),
                total,
            });
        }
        return arr;
    }, [pendingSales]);

    const maxTrend = Math.max(1, ...trend.map(t => t.total));

    // Top productos del mes
    const topProducts = useMemo(() => {
        const startOfMonth = Date.now() - 30 * DAY_MS;
        const counts = new Map<string, { name: string; quantity: number; revenue: number }>();
        for (const sale of pendingSales) {
            if (sale.status === 'cancelled') continue;
            if (sale.createdAt < startOfMonth) continue;
            for (const item of sale.items || []) {
                const key = item.id;
                const entry = counts.get(key) ?? { name: item.name, quantity: 0, revenue: 0 };
                entry.quantity += item.quantity;
                entry.revenue += (item.finalPrice ?? item.price ?? 0) * item.quantity;
                counts.set(key, entry);
            }
        }
        return Array.from(counts.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);
    }, [pendingSales]);

    // Top clientes del mes
    const topClients = useMemo(() => {
        const startOfMonth = Date.now() - 30 * DAY_MS;
        const map = new Map<string, { name: string; total: number; count: number }>();
        for (const sale of pendingSales) {
            if (sale.status === 'cancelled') continue;
            if (sale.createdAt < startOfMonth) continue;
            if (!sale.clientId) continue;
            const entry = map.get(sale.clientId) ?? {
                name: sale.clientName || 'Cliente',
                total: 0,
                count: 0,
            };
            entry.total += sale.total || 0;
            entry.count += 1;
            map.set(sale.clientId, entry);
        }
        return Array.from(map.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [pendingSales]);

    // Alertas
    const alerts = useMemo(
        () => computeAlerts({ products, sales: pendingSales, clients }),
        [products, pendingSales, clients]
    );

    if (authLoading || !user || user.role === 'staff' || user.role === 'admin' || user.role === 'admingod') {
        return null;
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
            {/* Greeting */}
            <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-ui-text uppercase">
                    {greeting(user.displayName)}
                </h1>
                <p className="text-ui-text-muted text-sm mt-2 font-medium">
                    {new Date().toLocaleDateString('es-VE', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                    {user.businessName && <span> · {user.businessName}</span>}
                </p>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Bell size={14} className="text-ui-text-muted" />
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">
                            Alertas inteligentes
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {alerts.map(a => {
                            const s = severityStyles[a.severity];
                            const content = (
                                <div className={`p-3 rounded-xl border ${s.bg} ${s.border} flex items-start gap-3`}>
                                    <span className={`mt-1 w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-black uppercase tracking-tight ${s.text}`}>
                                            {a.title}
                                        </p>
                                        <p className="text-[10px] text-ui-text-muted mt-0.5">{a.description}</p>
                                    </div>
                                    {a.href && <ArrowRight size={14} className={s.text} />}
                                </div>
                            );
                            return a.href ? (
                                <Link key={a.id} href={a.href} className="block">
                                    {content}
                                </Link>
                            ) : (
                                <div key={a.id}>{content}</div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* KPIs principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-ui-surface border border-ui-border rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">
                                Ventas Hoy
                            </p>
                            <h2 className="text-2xl font-black text-ui-text mt-1.5">
                                {formatPrice(metrics.today.total)}
                            </h2>
                            <p className="text-[10px] text-ui-text-muted mt-0.5">
                                {metrics.today.count} transacc{metrics.today.count === 1 ? 'ión' : 'iones'}
                            </p>
                        </div>
                        <div className="w-11 h-11 bg-accent-primary/10 rounded-xl flex items-center justify-center">
                            <ShoppingCart size={20} className="text-accent-primary" />
                        </div>
                    </div>
                    <Delta
                        current={metrics.today.total}
                        previous={metrics.yesterday.total}
                        label="vs ayer"
                        formatPrice={formatPrice}
                    />
                </div>

                <div className="bg-ui-surface border border-ui-border rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">
                                Últimos 7 días
                            </p>
                            <h2 className="text-2xl font-black text-ui-text mt-1.5">
                                {formatPrice(metrics.thisWeek.total)}
                            </h2>
                            <p className="text-[10px] text-ui-text-muted mt-0.5">
                                Prom. diario {formatPrice(metrics.thisWeek.total / 7)}
                            </p>
                        </div>
                        <div className="w-11 h-11 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <TrendingUp size={20} className="text-emerald-500" />
                        </div>
                    </div>
                    <Delta
                        current={metrics.thisWeek.total}
                        previous={metrics.prevWeek.total}
                        label="vs semana pasada"
                        formatPrice={formatPrice}
                    />
                </div>

                <div className="bg-ui-surface border border-ui-border rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">
                                Últimos 30 días
                            </p>
                            <h2 className="text-2xl font-black text-ui-text mt-1.5">
                                {formatPrice(metrics.thisMonth.total)}
                            </h2>
                            <p className="text-[10px] text-ui-text-muted mt-0.5">
                                {metrics.thisMonth.count} ventas
                            </p>
                        </div>
                        <div className="w-11 h-11 bg-purple-500/10 rounded-xl flex items-center justify-center">
                            <DollarSign size={20} className="text-purple-500" />
                        </div>
                    </div>
                    <Delta
                        current={metrics.thisMonth.total}
                        previous={metrics.prevMonth.total}
                        label="vs mes pasado"
                        formatPrice={formatPrice}
                    />
                </div>
            </div>

            {/* Proyección de fin de mes */}
            <div className="bg-ui-surface border border-ui-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Target size={14} className="text-accent-primary" />
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-ui-text">
                            Proyección fin de mes
                        </h3>
                    </div>
                    <span className="text-[10px] font-bold text-ui-text-muted">
                        Día {projection.dayOfMonth} de {projection.daysInMonth} · faltan {projection.daysRemaining}d
                    </span>
                </div>
                {projection.mtdTotal === 0 ? (
                    <p className="text-xs text-ui-text-muted py-4 text-center">Sin ventas en lo que va del mes.</p>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-ui-text-muted mb-1">Mes a la fecha</p>
                                <p className="text-base font-black text-ui-text">{formatPrice(projection.mtdTotal)}</p>
                                <p className="text-[10px] text-ui-text-muted">{projection.mtdCount} ventas</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-ui-text-muted mb-1">Prom. diario</p>
                                <p className="text-base font-black text-ui-text">{formatPrice(projection.avgDaily)}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-accent-primary mb-1">Proyección</p>
                                <p className="text-base font-black text-accent-primary">{formatPrice(projection.projected)}</p>
                                <p className="text-[10px] text-accent-primary/70">+{formatPrice(projection.remaining)} por venir</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-ui-text-muted mb-1">Mes anterior</p>
                                <p className="text-base font-black text-ui-text">{formatPrice(projection.prevMonthTotal)}</p>
                                {projection.prevMonthTotal > 0 && (() => {
                                    const diff = projection.projected - projection.prevMonthTotal;
                                    const pct = (diff / projection.prevMonthTotal) * 100;
                                    const up = diff >= 0;
                                    return (
                                        <span className={`text-[10px] font-bold ${up ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {up ? '+' : ''}{pct.toFixed(0)}% vs mes pasado
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                        <div className="h-2 bg-ui-bg rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent-primary transition-all"
                                style={{ width: `${Math.min(100, (projection.mtdTotal / Math.max(projection.projected, 1)) * 100)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-ui-text-muted mt-2 text-center">
                            Avance: {projection.projected > 0 ? ((projection.mtdTotal / projection.projected) * 100).toFixed(0) : 0}% del proyectado
                        </p>
                    </>
                )}
            </div>

            {/* Mini-gráfico de tendencia 7 días */}
            <div className="bg-ui-surface border border-ui-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-ui-text">
                        Tendencia últimos 7 días
                    </h3>
                    <Link
                        href="/reports"
                        className="text-[10px] font-black uppercase tracking-widest text-accent-primary hover:underline flex items-center gap-1"
                    >
                        Ver reportes <ArrowRight size={11} />
                    </Link>
                </div>
                <div className="flex items-end gap-2 h-32">
                    {trend.map((t, i) => {
                        const heightPct = (t.total / maxTrend) * 100;
                        const isToday = i === trend.length - 1;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                <div className="w-full flex items-end h-24">
                                    <div
                                        className={`w-full rounded-t-md transition-all ${
                                            isToday ? 'bg-accent-primary' : 'bg-accent-primary/30'
                                        }`}
                                        style={{ height: `${Math.max(heightPct, 2)}%` }}
                                        title={`${t.label}: ${formatPrice(t.total)}`}
                                    />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-ui-text-muted">
                                    {t.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top productos + Top clientes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-ui-surface border border-ui-border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-ui-text">
                            Top productos (30 días)
                        </h3>
                        <Crown size={14} className="text-amber-500" />
                    </div>
                    {topProducts.length === 0 ? (
                        <p className="text-xs text-ui-text-muted py-6 text-center">
                            Sin ventas en los últimos 30 días
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {topProducts.map((p, idx) => (
                                <div
                                    key={p.name + idx}
                                    className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-ui-bg/60"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${
                                                idx === 0
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-black/5 dark:bg-white/5 text-ui-text-muted'
                                            }`}
                                        >
                                            {idx + 1}
                                        </span>
                                        <span className="text-xs font-bold text-ui-text truncate">{p.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-[10px] font-black text-ui-text-muted">
                                            {p.quantity} und.
                                        </span>
                                        <span className="text-xs font-black text-ui-text">
                                            {formatPrice(p.revenue)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-ui-surface border border-ui-border rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-ui-text">
                            Top clientes (30 días)
                        </h3>
                        <UsersIcon size={14} className="text-accent-primary" />
                    </div>
                    {topClients.length === 0 ? (
                        <p className="text-xs text-ui-text-muted py-6 text-center">
                            Sin clientes con ventas recientes
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {topClients.map((c, idx) => (
                                <div
                                    key={c.name + idx}
                                    className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-ui-bg/60"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black ${
                                                idx === 0
                                                    ? 'bg-accent-primary text-white'
                                                    : 'bg-black/5 dark:bg-white/5 text-ui-text-muted'
                                            }`}
                                        >
                                            {idx + 1}
                                        </span>
                                        <span className="text-xs font-bold text-ui-text truncate">{c.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-[10px] font-black text-ui-text-muted">
                                            {c.count} venta{c.count === 1 ? '' : 's'}
                                        </span>
                                        <span className="text-xs font-black text-ui-text">
                                            {formatPrice(c.total)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick actions */}
            <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted mb-3">
                    Acciones rápidas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Button
                        size="lg"
                        onClick={() => router.push('/pos')}
                        className="flex flex-col items-center justify-center gap-2 h-auto py-5 bg-accent-primary hover:bg-accent-primary/90"
                    >
                        <ShoppingCart size={22} />
                        <span className="text-xs font-black uppercase tracking-widest">Nueva Venta</span>
                    </Button>
                    <Button
                        size="lg"
                        variant="ghost"
                        onClick={() => router.push('/collections')}
                        className="flex flex-col items-center justify-center gap-2 h-auto py-5"
                    >
                        <DollarSign size={22} />
                        <span className="text-xs font-black uppercase tracking-widest">Cobros</span>
                    </Button>
                    <Button
                        size="lg"
                        variant="ghost"
                        onClick={() => router.push('/inventory')}
                        className="flex flex-col items-center justify-center gap-2 h-auto py-5"
                    >
                        <Package size={22} />
                        <span className="text-xs font-black uppercase tracking-widest">Inventario</span>
                    </Button>
                    <Button
                        size="lg"
                        variant="ghost"
                        onClick={() => router.push('/cash')}
                        className="flex flex-col items-center justify-center gap-2 h-auto py-5"
                    >
                        <TrendingUp size={22} />
                        <span className="text-xs font-black uppercase tracking-widest">Caja</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}

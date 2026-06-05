"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOwnerContext } from '@/hooks/useOwnerContext';
import { useCashboxes } from '@/hooks/useCashboxes';
import { useClosings } from '@/hooks/useClosings';
import { useCurrency } from '@/context/CurrencyContext';
import { CashSessionService } from '@/services/cashSession.service';
import { CashClosingService } from '@/services/cashClosing.service';
import { SalesService } from '@/services/sales.service';
import { CashSession } from '@/types/cashSession';
import { CashClosing } from '@/types/cashClosing';
import { Sale } from '@/types/sales';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  Play,
  Square,
  AlertCircle,
  X,
  ChevronDown,
  Archive,
  Banknote,
  Smartphone,
  CreditCard,
  ArrowLeftRight,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

const METHOD_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  cash: { label: 'Efectivo', icon: <Banknote size={12} /> },
  transfer: { label: 'Transferencia', icon: <ArrowLeftRight size={12} /> },
  mobile_pay: { label: 'Pago Móvil', icon: <Smartphone size={12} /> },
  credit: { label: 'Crédito', icon: <CreditCard size={12} /> },
};

export default function CashSessionsPage() {
  const { user } = useAuth();
  const { ownerId } = useOwnerContext();
  const { cashboxes } = useCashboxes(ownerId);
  const { closings } = useClosings(ownerId);
  const { formatPrice } = useCurrency();

  // Session states
  const [openSessions, setOpenSessions] = useState<(CashSession & { id: string })[]>([]);
  const [sessionStatsMap, setSessionStatsMap] = useState<Record<string, any>>({});
  const [isOpeningSession, setIsOpeningSession] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');
  const [sessionToClose, setSessionToClose] = useState<(CashSession & { id: string }) | null>(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [openSessionCashboxId, setOpenSessionCashboxId] = useState<string>('');

  // Reactive feed of recent sales (replaces polling)
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  // Closing modal states
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingStep, setClosingStep] = useState<1 | 2>(1);
  const [selectedCashboxIds, setSelectedCashboxIds] = useState<string[]>([]);
  const [includesUnassigned, setIncludesUnassigned] = useState(false);
  const [closingDateFrom, setClosingDateFrom] = useState<number>(0);
  const [closingDateTo, setClosingDateTo] = useState<number>(0);
  const [previewSales, setPreviewSales] = useState<Sale[]>([]);
  const [closingNotes, setClosingNotes] = useState('');
  const [isCreatingClosing, setIsCreatingClosing] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // History states
  const [expandedClosing, setExpandedClosing] = useState<string | null>(null);
  const [closingDetails, setClosingDetails] = useState<Record<string, Sale[]>>({});
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [closingPeriod, setClosingPeriod] = useState<'day' | 'week' | 'month' | 'all'>('day');

  // ─── Subscriptions ───────────────────────────────────────────────────────────

  // Sessions (real-time via onSnapshot)
  useEffect(() => {
    if (!ownerId) return;
    const unsub = CashSessionService.subscribeToSessions(ownerId, (sessions) => {
      const open = sessions.filter(s => s.status === 'open');
      setOpenSessions(open);
    });
    return () => unsub();
  }, [ownerId]);

  // Recent sales — single reactive listener (replaces two polling loops)
  useEffect(() => {
    if (!ownerId) return;
    const unsub = SalesService.subscribeToRecentSales(ownerId, 200, setRecentSales);
    return () => unsub();
  }, [ownerId]);

  // Derived: sales without cashbox
  const salesWithoutCashbox = useMemo(
    () => recentSales.filter(s => !s.cashboxId && s.status !== 'cancelled' && !s.closedInClosingId),
    [recentSales]
  );

  // Derived: live stats per open session from the same feed
  useEffect(() => {
    const map: Record<string, any> = {};
    openSessions.forEach(session => {
      const sessionCashboxId = session.cashboxId ?? null;
      const sessionSales = recentSales.filter(
        s => s.createdAt >= session.openedAt
          && s.status !== 'cancelled'
          && (s.cashboxId ?? null) === sessionCashboxId
      );
      const totalByMethod = { cash: 0, transfer: 0, mobile_pay: 0, credit: 0 };
      let totalSales = 0;
      sessionSales.forEach(sale => {
        totalSales += sale.total;
        if (sale.paymentMethod in totalByMethod) {
          totalByMethod[sale.paymentMethod as keyof typeof totalByMethod] += sale.total;
        }
      });
      const pendingSales = sessionSales.filter(s => s.status === 'pending');
      const paidSales = sessionSales.filter(s => s.status === 'paid');
      map[session.id] = {
        totalSales,
        totalByMethod,
        salesCount: sessionSales.length,
        pendingCount: pendingSales.length,
        pendingAmount: pendingSales.reduce((sum, s) => sum + s.total, 0),
        paidCount: paidSales.length,
        paidAmount: paidSales.reduce((sum, s) => sum + s.total, 0),
      };
    });
    setSessionStatsMap(map);
  }, [openSessions, recentSales]);

  // Reset modal when opened
  useEffect(() => {
    if (!showClosingModal) return;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    setClosingDateFrom(startOfToday.getTime());
    setClosingDateTo(Date.now());
    setSelectedCashboxIds([]);
    setIncludesUnassigned(false);
    setClosingNotes('');
    setPreviewSales([]);
    setClosingStep(1);
  }, [showClosingModal]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleOpenSession = async () => {
    if (!ownerId || !user) return;
    setIsOpeningSession(true);
    try {
      const cashboxId = openSessionCashboxId || undefined;
      const cashboxName = cashboxId
        ? cashboxes.find(c => c.id === cashboxId)?.name
        : undefined;
      await CashSessionService.openSession(
        ownerId,
        user.uid,
        user.displayName || user.email || 'Usuario',
        cashboxId,
        cashboxName,
      );
      toast.success('Sesión abierta');
      setShowOpenModal(false);
      setOpenSessionCashboxId('');
    } catch (error: any) {
      toast.error(error.message || 'Error al abrir sesión');
    } finally {
      setIsOpeningSession(false);
    }
  };

  const handleCloseSession = async () => {
    if (!sessionToClose) return;
    setIsClosingSession(true);
    try {
      await CashSessionService.closeSession(sessionToClose.id, closeNotes);
      toast.success('Sesión cerrada');
      setSessionToClose(null);
      setCloseNotes('');
    } catch (error: any) {
      toast.error(error.message || 'Error al cerrar sesión');
    } finally {
      setIsClosingSession(false);
    }
  };

  const handleLoadClosingPreview = async () => {
    if (selectedCashboxIds.length === 0 && !includesUnassigned) {
      toast.error('Selecciona al menos una caja o ventas sin caja asignada');
      return;
    }
    setIsLoadingPreview(true);
    try {
      const sales = await CashClosingService.getSalesForClosing(ownerId, {
        cashboxIds: selectedCashboxIds,
        includesUnassigned,
        from: closingDateFrom,
        to: closingDateTo,
      });
      setPreviewSales(sales);
      setClosingStep(2);
    } catch {
      toast.error('Error al cargar ventas');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleCreateClosing = async () => {
    if (!user || previewSales.length === 0) return;
    setIsCreatingClosing(true);
    try {
      const totalByMethod = { cash: 0, transfer: 0, mobile_pay: 0, credit: 0 };
      let totalSales = 0;
      let paidAmount = 0;
      let pendingAmount = 0;

      previewSales.forEach((sale) => {
        totalSales += sale.total;
        if (sale.status === 'paid') paidAmount += sale.total;
        else pendingAmount += sale.total;
        const m = sale.paymentMethod as keyof typeof totalByMethod;
        if (m in totalByMethod) totalByMethod[m] += sale.total;
      });

      const closingId = await CashClosingService.createClosing({
        ownerId,
        closedAt: Date.now(),
        closedBy: user.uid,
        closedByName: user.displayName || user.email || 'Usuario',
        cashboxIds: selectedCashboxIds,
        cashboxNames: selectedCashboxIds
          .map((id) => cashboxes.find((cb) => cb.id === id)?.name)
          .filter(Boolean) as string[],
        includesUnassigned,
        saleIds: previewSales.map((s) => s.id!).filter(Boolean),
        dateRange: { from: closingDateFrom, to: closingDateTo },
        totalSales,
        totalByMethod,
        paidAmount,
        pendingAmount,
        salesCount: previewSales.length,
        notes: closingNotes,
      });

      // Mark ALL included sales as closed
      const saleIdsToMark = previewSales.map((s) => s.id!).filter(Boolean);
      if (saleIdsToMark.length > 0) {
        await SalesService.updateMultipleSales(saleIdsToMark, { closedInClosingId: closingId });
      }

      toast.success(`Cierre registrado: ${previewSales.length} ventas · ${formatPrice(totalSales)}`);
      setShowClosingModal(false);
      // recentSales se actualiza automáticamente vía onSnapshot
    } catch {
      toast.error('Error al crear cierre');
    } finally {
      setIsCreatingClosing(false);
    }
  };

  const handleExpandClosing = async (closing: CashClosing & { id: string }) => {
    if (expandedClosing === closing.id) {
      setExpandedClosing(null);
      return;
    }
    setExpandedClosing(closing.id);
    if (!closingDetails[closing.id] && closing.saleIds?.length > 0) {
      setLoadingDetails(closing.id);
      try {
        const sales = await SalesService.getSalesByIds(closing.saleIds);
        setClosingDetails((prev) => ({ ...prev, [closing.id]: sales }));
      } catch {
        toast.error('Error al cargar detalles');
      } finally {
        setLoadingDetails(null);
      }
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const filteredClosings = closings.filter((c) => {
    const now = Date.now();
    const cutoff =
      closingPeriod === 'all' ? 0
      : closingPeriod === 'day' ? now - 86400000
      : closingPeriod === 'week' ? now - 86400000 * 7
      : now - 86400000 * 30;
    return c.closedAt >= cutoff;
  });

  const previewTotal = previewSales.reduce((s, v) => s + v.total, 0);
  const previewPaid = previewSales.filter(s => s.status === 'paid').reduce((s, v) => s + v.total, 0);
  const previewPending = previewSales.filter(s => s.status === 'pending').reduce((s, v) => s + v.total, 0);
  const previewByMethod = previewSales.reduce((acc, s) => {
    const m = s.paymentMethod as keyof typeof acc;
    if (m in acc) acc[m] += s.total;
    return acc;
  }, { cash: 0, transfer: 0, mobile_pay: 0, credit: 0 });

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-ui-text uppercase tracking-tight">
            Cierre de Caja
          </h1>
          <p className="text-ui-text-muted text-sm mt-1 font-medium">
            Gestiona sesiones y reconcilia movimientos
          </p>
        </div>
        <Button
          onClick={() => setShowClosingModal(true)}
          className="bg-accent-primary hover:bg-accent-primary/90"
          size="lg"
        >
          <Archive size={18} />
          Hacer Cierre
        </Button>
      </div>

      {/* Unassigned sales alert */}
      {salesWithoutCashbox.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-black text-amber-600 uppercase tracking-tight">
              {salesWithoutCashbox.length} venta{salesWithoutCashbox.length !== 1 ? 's' : ''} sin caja asignada
            </p>
            <p className="text-xs text-amber-600/80 mt-1">
              Total: {formatPrice(salesWithoutCashbox.reduce((s, v) => s + v.total, 0))} · Inclúyelas al hacer un cierre marcando la opción correspondiente.
            </p>
          </div>
        </div>
      )}

      {/* Open Sessions */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">
            Sesiones Activas {openSessions.length > 0 && `(${openSessions.length})`}
          </h2>
          <Button
            onClick={() => setShowOpenModal(true)}
            className="bg-accent-primary hover:bg-accent-primary/90"
            size="sm"
          >
            <Play size={14} />
            Abrir Sesión
          </Button>
        </div>

        {openSessions.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <Clock size={40} className="mx-auto mb-4 text-ui-text-muted opacity-40" />
              <h2 className="text-lg font-black text-ui-text mb-2 uppercase tracking-tight">No hay sesiones activas</h2>
              <p className="text-sm text-ui-text-muted">Abre una sesión para registrar ventas por caja</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {openSessions.map(session => {
              const stats = sessionStatsMap[session.id];
              return (
                <Card key={session.id} className="border-accent-primary/30 bg-accent-primary/5">
                  <CardContent className="p-5 md:p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm md:text-base font-black text-ui-text uppercase tracking-tight">
                            {session.cashboxName || 'Sin caja asignada'}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                            Abierta
                          </span>
                        </div>
                        <p className="text-[11px] text-ui-text-muted">
                          {new Date(session.openedAt).toLocaleString()} · {session.cashierName}
                        </p>
                      </div>
                      <Button
                        onClick={() => setSessionToClose(session)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                        size="sm"
                      >
                        <Square size={14} />
                        Cerrar
                      </Button>
                    </div>

                    {stats && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="bg-ui-bg/60 p-2.5 rounded-xl border border-ui-border/50">
                          <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Total</p>
                          <p className="text-base font-black text-accent-primary">{formatPrice(stats.totalSales)}</p>
                        </div>
                        <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Pagado</p>
                          <p className="text-base font-black text-emerald-600">{formatPrice(stats.paidAmount)}</p>
                          <p className="text-[9px] text-emerald-600/70">{stats.paidCount} tx</p>
                        </div>
                        <div className="bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                          <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Deuda</p>
                          <p className="text-base font-black text-amber-600">{formatPrice(stats.pendingAmount)}</p>
                          <p className="text-[9px] text-amber-600/70">{stats.pendingCount} tx</p>
                        </div>
                        <div className="bg-ui-bg/60 p-2.5 rounded-xl border border-ui-border/50">
                          <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Ventas</p>
                          <p className="text-base font-black text-ui-text">{stats.salesCount}</p>
                        </div>
                      </div>
                    )}

                    {stats?.totalByMethod && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(METHOD_LABELS).map(([key, { label, icon }]) => (
                          <div key={key} className="bg-ui-bg/40 p-2 rounded-lg border border-ui-border/50">
                            <div className="flex items-center gap-1 text-ui-text-muted mb-1">{icon}<span className="text-[9px] font-black uppercase tracking-widest">{label}</span></div>
                            <p className="text-xs font-black text-ui-text">{formatPrice(stats.totalByMethod[key] || 0)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Historial de Cierres ─── */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">Historial de Cierres</h2>
          <div className="flex gap-1.5">
            {(['day', 'week', 'month', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setClosingPeriod(p)}
                className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-colors ${
                  closingPeriod === p
                    ? 'bg-accent-primary text-white'
                    : 'bg-ui-bg border border-ui-border text-ui-text-muted hover:border-accent-primary'
                }`}
              >
                {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Todo'}
              </button>
            ))}
          </div>
        </div>

        {filteredClosings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Archive size={32} className="mx-auto mb-3 text-ui-text-muted opacity-30" />
              <p className="text-sm text-ui-text-muted">No hay cierres registrados en este período</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredClosings.map((closing) => {
              const isExpanded = expandedClosing === closing.id;
              const details = closingDetails[closing.id];
              return (
                <Card key={closing.id} className="border-ui-border/50 overflow-hidden">
                  <button
                    onClick={() => handleExpandClosing(closing)}
                    className="w-full text-left"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Date + badges */}
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <div className="flex items-center gap-1.5">
                              <Archive size={14} className="text-accent-primary flex-shrink-0" />
                              <span className="text-xs font-black text-ui-text-muted">
                                {new Date(closing.closedAt).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })}{' '}
                                {new Date(closing.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {closing.cashboxNames?.map((name) => (
                              <span key={name} className="text-[9px] font-black bg-accent-primary/15 text-accent-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                                {name}
                              </span>
                            ))}
                            {closing.includesUnassigned && (
                              <span className="text-[9px] font-black bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                + Sin asignar
                              </span>
                            )}
                            <span className="text-[9px] text-ui-text-muted">por {closing.closedByName}</span>
                          </div>

                          {/* Summary grid */}
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-0.5">Total</p>
                              <p className="text-base font-black text-ui-text">{formatPrice(closing.totalSales)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Pagado</p>
                              <p className="text-base font-black text-emerald-600">{formatPrice(closing.paidAmount)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Deuda</p>
                              <p className="text-base font-black text-amber-600">{formatPrice(closing.pendingAmount)}</p>
                            </div>
                          </div>

                          <p className="text-[10px] text-ui-text-muted mt-1">{closing.salesCount} venta{closing.salesCount !== 1 ? 's' : ''}</p>
                        </div>
                        <ChevronDown
                          size={18}
                          className={`text-ui-text-muted flex-shrink-0 transition-transform mt-1 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </CardContent>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-ui-border/50 p-4 space-y-4 bg-ui-bg/30">
                      {/* By payment method */}
                      <div>
                        <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-2">Desglose por método</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {Object.entries(METHOD_LABELS).map(([key, { label, icon }]) => {
                            const amount = closing.totalByMethod?.[key as keyof typeof closing.totalByMethod] || 0;
                            return (
                              <div key={key} className="bg-ui-bg p-2.5 rounded-lg border border-ui-border/50">
                                <div className="flex items-center gap-1 text-ui-text-muted mb-1">{icon}<span className="text-[9px] font-black uppercase tracking-widest">{label}</span></div>
                                <p className="text-sm font-black text-ui-text">{formatPrice(amount)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Ventas incluidas */}
                      <div>
                        <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-2">
                          Ventas incluidas ({closing.salesCount})
                        </p>
                        {loadingDetails === closing.id ? (
                          <p className="text-xs text-ui-text-muted">Cargando ventas...</p>
                        ) : details && details.length > 0 ? (
                          <div className="space-y-1.5 max-h-72 overflow-y-auto">
                            {details.map((sale) => (
                              <div key={sale.id} className="flex items-center justify-between gap-2 p-2.5 bg-ui-bg rounded-lg border border-ui-border/50">
                                <div className="flex items-center gap-2 min-w-0">
                                  <User size={12} className="text-ui-text-muted flex-shrink-0" />
                                  <span className="text-xs font-bold text-ui-text truncate">
                                    {sale.clientName || 'Cliente general'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="text-[9px] text-ui-text-muted uppercase tracking-widest">
                                    {METHOD_LABELS[sale.paymentMethod]?.label || sale.paymentMethod}
                                  </span>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest ${
                                    sale.status === 'paid'
                                      ? 'bg-emerald-500/20 text-emerald-600'
                                      : 'bg-amber-500/20 text-amber-600'
                                  }`}>
                                    {sale.status === 'paid' ? 'Pagada' : 'Deuda'}
                                  </span>
                                  <span className="text-xs font-black text-ui-text">{formatPrice(sale.total)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : closing.saleIds?.length === 0 ? (
                          <p className="text-xs text-ui-text-muted">Sin ventas registradas</p>
                        ) : (
                          <p className="text-xs text-ui-text-muted">No se pudieron cargar las ventas</p>
                        )}
                      </div>

                      {closing.notes && (
                        <div className="p-3 rounded-lg bg-ui-bg border border-ui-border/50">
                          <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Notas</p>
                          <p className="text-xs text-ui-text italic">{closing.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Modal: Abrir Sesión ─── */}
      {showOpenModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="ui-card w-full max-w-sm border border-ui-border shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">Abrir Sesión</h2>
              <button onClick={() => { setShowOpenModal(false); setOpenSessionCashboxId(''); }} className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ui-text-muted">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-black text-ui-text-muted uppercase tracking-widest block mb-2">Caja</label>
                <select
                  value={openSessionCashboxId}
                  onChange={(e) => setOpenSessionCashboxId(e.target.value)}
                  className="w-full bg-ui-bg border border-ui-border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-accent-primary text-ui-text"
                >
                  <option value="">Sin caja asignada</option>
                  {cashboxes
                    .filter(c => !openSessions.some(s => (s.cashboxId ?? null) === c.id))
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <p className="text-[10px] text-ui-text-muted mt-1">
                  Se ocultan cajas con sesión ya abierta. Solo puede haber una sesión por caja.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowOpenModal(false); setOpenSessionCashboxId(''); }} className="flex-1 h-11 rounded-xl bg-black/5 dark:bg-white/5 font-black text-xs uppercase tracking-widest text-ui-text-muted">Cancelar</button>
              <button onClick={handleOpenSession} disabled={isOpeningSession} className="flex-1 h-11 rounded-xl bg-accent-primary text-white font-black text-xs uppercase tracking-widest hover:bg-accent-primary/90 disabled:opacity-50">
                {isOpeningSession ? 'Abriendo...' : 'Abrir Sesión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Cerrar Sesión ─── */}
      {sessionToClose && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="ui-card w-full max-w-sm border border-ui-border shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">
                Cerrar Sesión · {sessionToClose.cashboxName || 'Sin caja'}
              </h2>
              <button onClick={() => { setSessionToClose(null); setCloseNotes(''); }} className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ui-text-muted">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              {salesWithoutCashbox.length > 0 && (sessionToClose.cashboxId ?? null) !== null && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-xs text-amber-600">
                    ⚠️ Hay {salesWithoutCashbox.length} venta{salesWithoutCashbox.length !== 1 ? 's' : ''} sin caja ({formatPrice(salesWithoutCashbox.reduce((s, v) => s + v.total, 0))}) — no entran en esta sesión.
                  </p>
                </div>
              )}
              <div>
                <label className="text-xs font-black text-ui-text-muted uppercase tracking-widest block mb-2">Notas (Opcional)</label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Observaciones del cierre de sesión..."
                  className="w-full bg-ui-bg border border-ui-border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-accent-primary text-ui-text placeholder:text-ui-text-muted/40 min-h-[80px]"
                />
              </div>
              {sessionStatsMap[sessionToClose.id] && (
                <div className="bg-ui-bg/50 p-3 rounded-lg border border-ui-border/50 space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-ui-text-muted">Total vendido:</span><span className="font-black text-ui-text">{formatPrice(sessionStatsMap[sessionToClose.id].totalSales)}</span></div>
                  <div className="flex justify-between"><span className="text-ui-text-muted">Pagado:</span><span className="font-black text-emerald-600">{formatPrice(sessionStatsMap[sessionToClose.id].paidAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-ui-text-muted">Deuda:</span><span className="font-black text-amber-600">{formatPrice(sessionStatsMap[sessionToClose.id].pendingAmount)}</span></div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setSessionToClose(null); setCloseNotes(''); }} className="flex-1 h-11 rounded-xl bg-black/5 dark:bg-white/5 font-black text-xs uppercase tracking-widest text-ui-text-muted">Cancelar</button>
              <button onClick={handleCloseSession} disabled={isClosingSession} className="flex-1 h-11 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 disabled:opacity-50">
                {isClosingSession ? 'Cerrando...' : 'Cerrar Sesión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Cierre de Caja ─── */}
      {showClosingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="ui-card w-full max-w-lg border border-ui-border shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">
                {closingStep === 1 ? 'Configurar Cierre' : `Resumen · ${previewSales.length} ventas`}
              </h2>
              <button
                onClick={() => setShowClosingModal(false)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ui-text-muted"
              >
                <X size={16} />
              </button>
            </div>

            {closingStep === 1 ? (
              <div className="space-y-5 mb-6">
                {/* Cashbox selection */}
                <div>
                  <label className="text-xs font-black text-ui-text-muted uppercase tracking-widest block mb-3">Cajas a incluir</label>
                  {cashboxes.length === 0 ? (
                    <p className="text-xs text-ui-text-muted">No hay cajas configuradas</p>
                  ) : (
                    <div className="space-y-2">
                      {cashboxes.map((box) => (
                        <button
                          key={box.id}
                          onClick={() =>
                            setSelectedCashboxIds((prev) =>
                              prev.includes(box.id) ? prev.filter((id) => id !== box.id) : [...prev, box.id]
                            )
                          }
                          className={`w-full p-3 rounded-xl text-left font-bold text-xs border-2 transition-all flex items-center gap-2 ${
                            selectedCashboxIds.includes(box.id)
                              ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                              : 'border-ui-border bg-ui-bg text-ui-text-muted hover:border-accent-primary/50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selectedCashboxIds.includes(box.id) ? 'border-accent-primary bg-accent-primary' : 'border-ui-border/50'}`}>
                            {selectedCashboxIds.includes(box.id) && <span className="text-white text-[10px]">✓</span>}
                          </div>
                          {box.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Unassigned sales option */}
                {salesWithoutCashbox.length > 0 && (
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 transition-colors">
                    <div
                      onClick={() => setIncludesUnassigned(!includesUnassigned)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${includesUnassigned ? 'border-amber-500 bg-amber-500' : 'border-amber-500/50'}`}
                    >
                      {includesUnassigned && <span className="text-white text-[10px]">✓</span>}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-amber-600 uppercase tracking-widest">
                        Incluir ventas sin caja asignada
                      </p>
                      <p className="text-[10px] text-amber-600/70 mt-0.5">
                        {salesWithoutCashbox.length} venta{salesWithoutCashbox.length !== 1 ? 's' : ''} · {formatPrice(salesWithoutCashbox.reduce((s, v) => s + v.total, 0))}
                      </p>
                    </div>
                  </label>
                )}

                {/* Date range */}
                <div>
                  <label className="text-xs font-black text-ui-text-muted uppercase tracking-widest block mb-2">Rango de fechas</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] text-ui-text-muted mb-1">Desde</p>
                      <input
                        type="datetime-local"
                        value={new Date(closingDateFrom).toISOString().slice(0, 16)}
                        onChange={(e) => setClosingDateFrom(new Date(e.target.value).getTime())}
                        className="w-full bg-ui-bg border border-ui-border rounded-lg px-2 py-2 text-xs font-bold outline-none focus:border-accent-primary text-ui-text"
                      />
                    </div>
                    <div>
                      <p className="text-[9px] text-ui-text-muted mb-1">Hasta</p>
                      <input
                        type="datetime-local"
                        value={new Date(closingDateTo).toISOString().slice(0, 16)}
                        onChange={(e) => setClosingDateTo(new Date(e.target.value).getTime())}
                        className="w-full bg-ui-bg border border-ui-border rounded-lg px-2 py-2 text-xs font-bold outline-none focus:border-accent-primary text-ui-text"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {previewSales.length === 0 ? (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm font-black text-red-600 mb-1">Sin ventas en este período</p>
                    <p className="text-xs text-red-600/80">
                      No se encontraron ventas con los filtros seleccionados. Verifica el rango de fechas o selecciona otras cajas.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Totals summary */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-ui-bg/60 p-3 rounded-xl border border-ui-border/50">
                        <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Total</p>
                        <p className="text-lg font-black text-ui-text">{formatPrice(previewTotal)}</p>
                      </div>
                      <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Pagado</p>
                        <p className="text-lg font-black text-emerald-600">{formatPrice(previewPaid)}</p>
                      </div>
                      <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Deuda</p>
                        <p className="text-lg font-black text-amber-600">{formatPrice(previewPending)}</p>
                      </div>
                    </div>

                    {/* By method */}
                    <div>
                      <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-2">Por método de pago</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(METHOD_LABELS).map(([key, { label, icon }]) => (
                          <div key={key} className="bg-ui-bg/50 p-2.5 rounded-lg border border-ui-border/50">
                            <div className="flex items-center gap-1 text-ui-text-muted mb-1">{icon}<span className="text-[9px] font-black uppercase tracking-widest">{label}</span></div>
                            <p className="text-sm font-black text-ui-text">{formatPrice(previewByMethod[key as keyof typeof previewByMethod])}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sales list preview */}
                    <div>
                      <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-2">
                        Ventas a cerrar ({previewSales.length})
                      </p>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {previewSales.map((sale) => (
                          <div key={sale.id} className="flex items-center justify-between gap-2 p-2 bg-ui-bg rounded-lg border border-ui-border/50">
                            <div className="flex items-center gap-2 min-w-0">
                              <User size={11} className="text-ui-text-muted flex-shrink-0" />
                              <span className="text-[11px] font-bold text-ui-text truncate">{sale.clientName || 'Cliente general'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[9px] text-ui-text-muted">{METHOD_LABELS[sale.paymentMethod]?.label}</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${sale.status === 'paid' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}>
                                {sale.status === 'paid' ? 'Pagada' : 'Deuda'}
                              </span>
                              <span className="text-[11px] font-black text-ui-text">{formatPrice(sale.total)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-black text-ui-text-muted uppercase tracking-widest block mb-2">Notas (Opcional)</label>
                      <textarea
                        value={closingNotes}
                        onChange={(e) => setClosingNotes(e.target.value)}
                        placeholder="Ej: Verificado físicamente, diferencia de $5..."
                        className="w-full bg-ui-bg border border-ui-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent-primary text-ui-text placeholder:text-ui-text-muted/40 min-h-[60px]"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              {closingStep === 2 && (
                <button
                  onClick={() => setClosingStep(1)}
                  className="flex-1 h-11 rounded-xl bg-black/5 dark:bg-white/5 font-black text-xs uppercase tracking-widest text-ui-text-muted hover:text-ui-text"
                >
                  ← Atrás
                </button>
              )}
              <button
                onClick={() => {
                  if (closingStep === 1) handleLoadClosingPreview();
                  else if (previewSales.length > 0) handleCreateClosing();
                }}
                disabled={isLoadingPreview || isCreatingClosing || (closingStep === 2 && previewSales.length === 0)}
                className={`flex-1 h-11 rounded-xl font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-50 ${
                  closingStep === 1
                    ? 'bg-accent-primary text-white hover:bg-accent-primary/90'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isLoadingPreview ? 'Cargando...' : isCreatingClosing ? 'Guardando...' : closingStep === 1 ? 'Ver Resumen →' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

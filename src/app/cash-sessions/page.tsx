"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { CashSessionService } from '@/services/cashSession.service';
import { CashClosingService } from '@/services/cashClosing.service';
import { CashboxService } from '@/services/cashbox.service';
import { SalesService } from '@/services/sales.service';
import { CashSession } from '@/types/cashSession';
import { CashClosing } from '@/types/cashClosing';
import { Cashbox } from '@/types/cashbox';
import { Sale } from '@/types/sales';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Clock,
  Play,
  Square,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  X,
  ChevronDown,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CashSessionsPage() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [openSession, setOpenSession] = useState<CashSession | null>(null);
  const [allSessions, setAllSessions] = useState<CashSession[]>([]);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [salesWithoutCashbox, setSalesWithoutCashbox] = useState<Sale[]>([]);
  const [isOpeningSession, setIsOpeningSession] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);

  // New states for manual cash closing
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [closings, setClosings] = useState<(CashClosing & { id: string })[]>([]);
  const [showClosingModal, setShowClosingModal] = useState(false);
  const [closingStep, setClosingStep] = useState<1 | 2>(1);
  const [selectedCashboxIds, setSelectedCashboxIds] = useState<string[]>([]);
  const [includesUnassigned, setIncludesUnassigned] = useState(false);
  const [closingDateFrom, setClosingDateFrom] = useState<number>(Date.now() - 86400000);
  const [closingDateTo, setClosingDateTo] = useState<number>(Date.now());
  const [previewSales, setPreviewSales] = useState<Sale[]>([]);
  const [closingNotes, setClosingNotes] = useState('');
  const [isCreatingClosing, setIsCreatingClosing] = useState(false);
  const [expandedClosing, setExpandedClosing] = useState<string | null>(null);
  const [closingPeriod, setClosingPeriod] = useState<'day' | 'week' | 'month' | 'all'>('day');

  const ownerId = user?.ownerId || user?.uid || '';

  // Subscribe to sessions
  useEffect(() => {
    if (!ownerId) return;

    const unsubscribe = CashSessionService.subscribeToSessions(ownerId, (sessions) => {
      setAllSessions(sessions);
      const open = sessions.find(s => s.status === 'open');
      setOpenSession(open || null);
    });

    return () => unsubscribe();
  }, [ownerId]);

  // Load sales without cashbox
  useEffect(() => {
    if (!ownerId) return;

    const loadSalesWithoutCashbox = async () => {
      const sales = await SalesService.getSalesWithoutCashbox(ownerId);
      setSalesWithoutCashbox(sales);
    };

    loadSalesWithoutCashbox();
    const interval = setInterval(loadSalesWithoutCashbox, 10000);
    return () => clearInterval(interval);
  }, [ownerId]);

  // Subscribe to cashboxes
  useEffect(() => {
    if (!ownerId) return;

    const unsubscribe = CashboxService.subscribeToCashboxes(ownerId, setCashboxes);
    return () => unsubscribe();
  }, [ownerId]);

  // Subscribe to closings
  useEffect(() => {
    if (!ownerId) return;

    const unsubscribe = CashClosingService.subscribeToClosings(ownerId, setClosings);
    return () => unsubscribe();
  }, [ownerId]);

  // Update session stats in real-time
  useEffect(() => {
    if (!openSession || !ownerId) return;

    const updateStats = async () => {
      const stats = await CashSessionService.getCurrentSessionStats(openSession.id || '', ownerId);
      setSessionStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [openSession, ownerId]);

  const handleOpenSession = async () => {
    if (!ownerId || !user) return;

    setIsOpeningSession(true);
    try {
      const sessionId = await CashSessionService.openSession(
        ownerId,
        user.uid,
        user.displayName || user.email || 'Usuario'
      );
      toast.success('Sesión de caja abierta');
    } catch (error: any) {
      toast.error(error.message || 'Error al abrir sesión');
    } finally {
      setIsOpeningSession(false);
    }
  };

  const handleCloseSession = async () => {
    if (!openSession || !ownerId) return;

    setIsClosingSession(true);
    try {
      await CashSessionService.closeSession(openSession.id || '', closeNotes);
      toast.success('Sesión de caja cerrada');
      setShowCloseModal(false);
      setCloseNotes('');
    } catch (error: any) {
      toast.error(error.message || 'Error al cerrar sesión');
    } finally {
      setIsClosingSession(false);
    }
  };

  const handleLoadClosingPreview = async () => {
    try {
      const sales = await CashClosingService.getSalesForClosing(ownerId, {
        cashboxIds: selectedCashboxIds,
        includesUnassigned,
        from: closingDateFrom,
        to: closingDateTo,
      });
      setPreviewSales(sales);
      setClosingStep(2);
    } catch (error: any) {
      toast.error('Error al cargar preview');
    }
  };

  const handleCreateClosing = async () => {
    if (!user) return;

    setIsCreatingClosing(true);
    try {
      const totalByMethod = { cash: 0, transfer: 0, mobile_pay: 0, credit: 0 };
      let totalSales = 0;
      let paidAmount = 0;
      let pendingAmount = 0;

      previewSales.forEach((sale) => {
        totalSales += sale.total;
        if (sale.status === 'paid') {
          paidAmount += sale.total;
        } else {
          pendingAmount += sale.total;
        }
        if (sale.paymentMethod in totalByMethod) {
          totalByMethod[sale.paymentMethod as keyof typeof totalByMethod] += sale.total;
        }
      });

      await CashClosingService.createClosing({
        ownerId,
        closedAt: Date.now(),
        closedBy: user.uid,
        closedByName: user.displayName || user.email || 'Usuario',
        cashboxIds: selectedCashboxIds,
        cashboxNames: selectedCashboxIds
          .map((id) => cashboxes.find((cb) => cb.id === id)?.name)
          .filter(Boolean) as string[],
        includesUnassigned,
        saleIds: previewSales.map((s) => s.id || ''),
        dateRange: { from: closingDateFrom, to: closingDateTo },
        totalSales,
        totalByMethod,
        paidAmount,
        pendingAmount,
        salesCount: previewSales.length,
        notes: closingNotes,
      });

      toast.success('Cierre de caja registrado');
      setShowClosingModal(false);
      setClosingStep(1);
      setSelectedCashboxIds([]);
      setIncludesUnassigned(false);
      setClosingNotes('');
      setPreviewSales([]);
    } catch (error: any) {
      toast.error('Error al crear cierre');
    } finally {
      setIsCreatingClosing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-4 animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-ui-text uppercase tracking-tight">
            Cierre de Caja
          </h1>
          <p className="text-ui-text-muted text-sm mt-1 font-medium">
            Gestiona tus sesiones y reconcilia movimientos
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

      {/* Current Session Card */}
      {openSession ? (
        <Card className="border-accent-primary/30 bg-accent-primary/5">
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              {/* Session Info */}
              <div className="space-y-3">
                <h2 className="text-base md:text-lg font-black text-ui-text uppercase tracking-tight">
                  Sesión Actual
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] md:text-xs font-black text-ui-text-muted uppercase tracking-widest">
                      Iniciada
                    </span>
                    <span className="text-[11px] md:text-sm font-black text-ui-text text-right break-words">
                      {new Date(openSession.openedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] md:text-xs font-black text-ui-text-muted uppercase tracking-widest">
                      Cajero
                    </span>
                    <span className="text-[11px] md:text-sm font-black text-ui-text text-right truncate">
                      {openSession.cashierName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] md:text-xs font-black text-ui-text-muted uppercase tracking-widest">
                      Deuda al iniciar
                    </span>
                    <span className="text-[11px] md:text-sm font-black text-accent-secondary">
                      {formatPrice(openSession.debtPendingAtOpen)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Stats */}
              {sessionStats && (
                <div className="space-y-3">
                  <h2 className="text-base md:text-lg font-black text-ui-text uppercase tracking-tight">
                    Estadísticas (En Vivo)
                  </h2>
                  <div className="bg-ui-bg/50 p-3 rounded-lg">
                    <p className="text-[8px] md:text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-1">
                      Total Vendido
                    </p>
                    <p className="text-xl md:text-2xl font-black text-accent-primary">
                      {formatPrice(sessionStats.totalSales)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <p className="text-[7px] md:text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">
                        Pagadas
                      </p>
                      <p className="text-[10px] md:text-xs font-black text-emerald-600 truncate">
                        {sessionStats.paidCount}
                      </p>
                      <p className="text-[9px] md:text-[10px] font-black text-emerald-600">
                        {formatPrice(sessionStats.paidAmount)}
                      </p>
                    </div>
                    <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      <p className="text-[7px] md:text-[8px] font-black text-amber-600 uppercase tracking-widest mb-0.5">
                        Fiadas
                      </p>
                      <p className="text-[10px] md:text-xs font-black text-amber-600 truncate">
                        {sessionStats.pendingCount}
                      </p>
                      <p className="text-[9px] md:text-[10px] font-black text-amber-600">
                        {formatPrice(sessionStats.pendingAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Income by Method */}
            {sessionStats && (
              <div className="mb-6 pb-6 border-t border-ui-border">
                <h3 className="text-xs md:text-sm font-black text-ui-text uppercase tracking-tight mb-3">
                  Ingresos por Método
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  {[
                    { key: 'cash', label: '💵 Efectivo' },
                    { key: 'transfer', label: '📲 Transf.' },
                    { key: 'mobile_pay', label: '📱 P. Móvil' },
                    { key: 'credit', label: '📝 Crédito' },
                  ].map(({ key, label }) => (
                    <div key={key} className="bg-ui-bg p-2 md:p-3 rounded-lg">
                      <p className="text-[7px] md:text-[9px] font-bold text-ui-text-muted uppercase tracking-widest mb-1">
                        {label}
                      </p>
                      <p className="text-[10px] md:text-sm font-black text-ui-text truncate">
                        {formatPrice(sessionStats.totalByMethod[key as keyof typeof sessionStats.totalByMethod] || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCloseModal(true)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                size="lg"
              >
                <Square size={18} />
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            {salesWithoutCashbox.length > 0 && (
              <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-left">
                    <p className="text-sm font-black text-amber-600 uppercase tracking-tight mb-2">
                      {salesWithoutCashbox.length} Venta{salesWithoutCashbox.length === 1 ? '' : 's'} sin caja asignada
                    </p>
                    <p className="text-xs text-amber-600/80">
                      Total: {formatPrice(salesWithoutCashbox.reduce((sum, s) => sum + s.total, 0))}
                    </p>
                    <p className="text-[11px] text-amber-600/70 mt-2">
                      Se incluirán en el cierre cuando abras una nueva sesión.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Clock size={40} className="mx-auto mb-4 text-ui-text-muted opacity-50" />
            <h2 className="text-lg font-black text-ui-text mb-2 uppercase tracking-tight">
              No hay sesión activa
            </h2>
            <p className="text-sm text-ui-text-muted mb-6">Abre una nueva sesión para comenzar a registrar ventas</p>
            <Button
              onClick={handleOpenSession}
              disabled={isOpeningSession}
              className="bg-accent-primary hover:bg-accent-primary/90"
              size="lg"
            >
              <Play size={18} />
              {isOpeningSession ? 'Abriendo...' : 'Abrir Sesión'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Close Session Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="ui-card w-full max-w-sm border border-ui-border shadow-2xl animate-in zoom-in-95 duration-300 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">
                Cerrar Sesión
              </h2>
              <button
                onClick={() => setShowCloseModal(false)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ui-text-muted hover:text-ui-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {salesWithoutCashbox.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-amber-600">
                      ⚠️ Hay {salesWithoutCashbox.length} venta{salesWithoutCashbox.length === 1 ? '' : 's'} sin caja ({formatPrice(salesWithoutCashbox.reduce((sum, s) => sum + s.total, 0))}) que se incluirán en este cierre.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-black text-ui-text-muted uppercase tracking-widest block mb-2">
                  Notas (Opcional)
                </label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Ej: Verificado físicamente, diferencia de $5 en efectivo"
                  className="w-full bg-ui-bg border border-ui-border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-accent-primary text-ui-text placeholder:text-ui-text-muted/40 min-h-[80px]"
                />
              </div>

              {sessionStats && (
                <div className="bg-accent-primary/5 p-4 rounded-lg border border-accent-primary/20">
                  <p className="text-xs font-black text-ui-text-muted uppercase tracking-widest mb-3">
                    Resumen del Cierre
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-ui-text-muted">Total vendido:</span>
                      <span className="font-black text-ui-text">
                        {formatPrice(sessionStats.totalSales)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ui-text-muted">Deuda al cierre:</span>
                      <span className="font-black text-accent-secondary">
                        {formatPrice(sessionStats.pendingAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ui-text-muted">Pagado en caja:</span>
                      <span className="font-black text-emerald-600">
                        {formatPrice(sessionStats.paidAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 h-12 rounded-xl bg-black/5 dark:bg-white/5 font-black text-xs uppercase tracking-widest text-ui-text-muted hover:text-ui-text transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseSession}
                disabled={isClosingSession}
                className="flex-1 h-12 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50 shadow-lg shadow-red-500/20"
              >
                {isClosingSession ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Closing Modal */}
      {showClosingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="ui-card w-full max-w-lg border border-ui-border shadow-2xl animate-in zoom-in-95 duration-300 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">
                {closingStep === 1 ? 'Configurar Cierre' : 'Confirmar Cierre'}
              </h2>
              <button
                onClick={() => {
                  setShowClosingModal(false);
                  setClosingStep(1);
                  setSelectedCashboxIds([]);
                  setIncludesUnassigned(false);
                  setClosingNotes('');
                  setPreviewSales([]);
                }}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ui-text-muted hover:text-ui-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {closingStep === 1 ? (
              <div className="space-y-4 mb-6">
                {/* Cashboxes Selection */}
                <div>
                  <label className="text-xs font-black text-ui-text-muted uppercase tracking-widest block mb-3">
                    Cajas a incluir
                  </label>
                  <div className="space-y-2">
                    {cashboxes.length === 0 ? (
                      <p className="text-xs text-ui-text-muted">No hay cajas configuradas</p>
                    ) : (
                      cashboxes.map((box) => (
                        <button
                          key={box.id}
                          onClick={() => {
                            setSelectedCashboxIds((prev) =>
                              prev.includes(box.id) ? prev.filter((id) => id !== box.id) : [...prev, box.id]
                            );
                          }}
                          className={`w-full p-3 rounded-xl text-left font-bold text-xs border-2 transition-all ${
                            selectedCashboxIds.includes(box.id)
                              ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                              : 'border-ui-border bg-ui-bg text-ui-text-muted hover:border-accent-primary'
                          }`}
                        >
                          □ {box.name}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Unassigned Sales */}
                {salesWithoutCashbox.length > 0 && (
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border-2 border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50">
                      <input
                        type="checkbox"
                        checked={includesUnassigned}
                        onChange={(e) => setIncludesUnassigned(e.target.checked)}
                        className="w-4 h-4 rounded cursor-pointer accent-amber-600"
                      />
                      <span className="text-xs font-black text-amber-600 uppercase tracking-widest flex-1">
                        Incluir {salesWithoutCashbox.length} venta{salesWithoutCashbox.length === 1 ? '' : 's'} sin caja asignada
                      </span>
                      <span className="text-xs font-black text-amber-600">
                        {formatPrice(salesWithoutCashbox.reduce((sum, s) => sum + s.total, 0))}
                      </span>
                    </label>
                  </div>
                )}

                {/* Date Range */}
                <div>
                  <label className="text-xs font-black text-ui-text-muted uppercase tracking-widest block mb-2">
                    Rango de Fechas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="datetime-local"
                      value={new Date(closingDateFrom).toISOString().slice(0, 16)}
                      onChange={(e) => setClosingDateFrom(new Date(e.target.value).getTime())}
                      className="w-full bg-ui-bg border border-ui-border rounded-lg px-2 py-2 text-xs font-bold outline-none focus:border-accent-primary text-ui-text"
                    />
                    <input
                      type="datetime-local"
                      value={new Date(closingDateTo).toISOString().slice(0, 16)}
                      onChange={(e) => setClosingDateTo(new Date(e.target.value).getTime())}
                      className="w-full bg-ui-bg border border-ui-border rounded-lg px-2 py-2 text-xs font-bold outline-none focus:border-accent-primary text-ui-text"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {/* Preview Summary */}
                <div className="bg-accent-primary/5 p-4 rounded-lg border border-accent-primary/20">
                  <p className="text-xs font-black text-ui-text-muted uppercase tracking-widest mb-3">
                    Resumen del Cierre
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-ui-text-muted">Total vendido:</span>
                      <span className="font-black text-ui-text">
                        {formatPrice(previewSales.reduce((sum, s) => sum + s.total, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ui-text-muted">Ventas pagadas:</span>
                      <span className="font-black text-emerald-600">
                        {previewSales.filter((s) => s.status === 'paid').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ui-text-muted">Deuda:</span>
                      <span className="font-black text-accent-secondary">
                        {formatPrice(previewSales.filter((s) => s.status === 'pending').reduce((sum, s) => sum + s.total, 0))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-black text-ui-text-muted uppercase tracking-widest block mb-2">
                    Notas (Opcional)
                  </label>
                  <textarea
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Ej: Verificado físicamente, diferencia de $5"
                    className="w-full bg-ui-bg border border-ui-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent-primary text-ui-text placeholder:text-ui-text-muted/40 min-h-[80px]"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {closingStep === 2 && (
                <button
                  onClick={() => setClosingStep(1)}
                  className="flex-1 h-12 rounded-xl bg-black/5 dark:bg-white/5 font-black text-xs uppercase tracking-widest text-ui-text-muted hover:text-ui-text transition-colors"
                >
                  ← Atrás
                </button>
              )}
              <button
                onClick={() => {
                  if (closingStep === 1) {
                    if (selectedCashboxIds.length === 0 && !includesUnassigned) {
                      toast.error('Selecciona al menos una caja o ventas sin caja');
                      return;
                    }
                    handleLoadClosingPreview();
                  } else {
                    handleCreateClosing();
                  }
                }}
                disabled={isCreatingClosing}
                className={`flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-colors disabled:opacity-50 ${
                  closingStep === 1
                    ? 'bg-accent-primary text-white hover:bg-accent-primary/90'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isCreatingClosing ? 'Guardando...' : closingStep === 1 ? 'Ver Resumen →' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

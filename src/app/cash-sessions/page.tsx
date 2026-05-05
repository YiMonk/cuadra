"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { CashSessionService } from '@/services/cashSession.service';
import { CashSession } from '@/types/cashSession';
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
} from 'lucide-react';
import { toast } from 'sonner';

export default function CashSessionsPage() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [openSession, setOpenSession] = useState<CashSession | null>(null);
  const [allSessions, setAllSessions] = useState<CashSession[]>([]);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [isOpeningSession, setIsOpeningSession] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);

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

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
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

      {/* Closed Sessions History */}
      <div>
        <h2 className="text-lg font-black text-ui-text uppercase tracking-tight mb-4">
          Sesiones Cerradas
        </h2>
        <div className="space-y-3">
          {allSessions.filter(s => s.status === 'closed').length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-ui-text-muted">
                No hay sesiones cerradas
              </CardContent>
            </Card>
          ) : (
            allSessions
              .filter(s => s.status === 'closed')
              .map(session => (
                <Card key={session.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-3 md:p-6">
                    {/* Mobile Layout */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-[8px] font-black text-ui-text-muted uppercase tracking-widest mb-0.5">
                            Fecha
                          </p>
                          <p className="text-xs font-black text-ui-text">
                            {new Date(session.openedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-[8px] font-black text-ui-text-muted uppercase tracking-widest mb-0.5">
                            Total Vendido
                          </p>
                          <p className="text-sm font-black text-accent-primary">
                            {formatPrice(session.totalSales)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-[8px] font-black text-ui-text-muted uppercase tracking-widest mb-0.5">
                            Ventas
                          </p>
                          <p className="text-sm font-black text-ui-text">{session.saleIds.length}</p>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-[8px] font-black text-ui-text-muted uppercase tracking-widest mb-0.5">
                            Deuda al cierre
                          </p>
                          <p className="text-sm font-black text-accent-secondary">
                            {formatPrice(session.debtPendingAtClose)}
                          </p>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-ui-bg hover:bg-ui-border text-ui-text text-xs"
                        size="sm"
                      >
                        <FileText size={14} />
                        Ver Reporte
                      </Button>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:grid grid-cols-5 gap-4 items-center">
                      <div>
                        <p className="text-xs font-black text-ui-text-muted uppercase tracking-widest mb-1">
                          Fecha
                        </p>
                        <p className="text-sm font-black text-ui-text">
                          {new Date(session.openedAt).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-ui-text-muted font-bold">
                          {new Date(session.openedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-ui-text-muted uppercase tracking-widest mb-1">
                          Total Vendido
                        </p>
                        <p className="text-lg font-black text-accent-primary">
                          {formatPrice(session.totalSales)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-ui-text-muted uppercase tracking-widest mb-1">
                          Ventas
                        </p>
                        <p className="text-lg font-black text-ui-text">{session.saleIds.length}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-ui-text-muted uppercase tracking-widest mb-1">
                          Deuda al cierre
                        </p>
                        <p className="text-lg font-black text-accent-secondary">
                          {formatPrice(session.debtPendingAtClose)}
                        </p>
                      </div>
                      <div>
                        <Button
                          className="w-full bg-ui-bg hover:bg-ui-border text-ui-text"
                          size="sm"
                        >
                          <FileText size={16} />
                          Ver Reporte
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>

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
    </div>
  );
}

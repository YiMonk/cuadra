"use client";

import React, { useEffect, useState } from 'react';
import { SalesService } from '@/services/sales.service';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Search, CheckCircle, Clock, AlertCircle, RotateCcw, Trash2, CreditCard, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface Movement {
  id: string;
  date: number;
  clientName?: string | null;
  total: number;
  status: 'paid' | 'pending' | 'cancelled';
  paymentMethod?: string;
  hasReturns?: boolean;
  creatorName?: string | null;
}

export const MovementHistory: React.FC = () => {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'cancelled'>('all');

  const ownerId = user?.ownerId || user?.uid || '';

  useEffect(() => {
    if (!ownerId) return;

    const loadMovements = async () => {
      try {
        const allSales = await SalesService.getAllSales(ownerId);
        const movementsList: Movement[] = allSales
          .filter(s => s.status !== 'cancelled' || s.hasReturns)
          .map(sale => ({
            id: sale.id || '',
            date: sale.createdAt,
            clientName: sale.clientName,
            total: sale.total,
            status: sale.status,
            paymentMethod: sale.paymentMethod,
            hasReturns: sale.hasReturns,
            creatorName: sale.creatorName,
          }))
          .sort((a, b) => b.date - a.date);

        setMovements(movementsList);
        setLoading(false);
      } catch (error) {
        console.error('Error loading movements:', error);
        toast.error('Error al cargar movimientos');
        setLoading(false);
      }
    };

    loadMovements();
  }, [ownerId]);

  useEffect(() => {
    let filtered = movements;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(m => m.status === filterStatus);
    }

    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMovements(filtered);
  }, [searchQuery, filterStatus, movements]);

  const getStatusBadge = (movement: Movement) => {
    const baseClasses = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest';

    if (movement.status === 'paid') {
      return (
        <div className={`${baseClasses} bg-emerald-500/10 border border-emerald-500/30 text-emerald-600`}>
          <CheckCircle size={14} />
          Pagado
          {movement.hasReturns && <RotateCcw size={12} />}
        </div>
      );
    }

    if (movement.status === 'pending') {
      return (
        <div className={`${baseClasses} bg-amber-500/10 border border-amber-500/30 text-amber-600`}>
          <Clock size={14} />
          Pendiente
        </div>
      );
    }

    if (movement.status === 'cancelled') {
      return (
        <div className={`${baseClasses} bg-red-500/10 border border-red-500/30 text-red-600`}>
          <Trash2 size={14} />
          Cancelado
        </div>
      );
    }

    return null;
  };

  const getPaymentMethodBadge = (movement: Movement) => {
    if (!movement.paymentMethod || movement.status !== 'paid') return null;

    const methodMap = {
      cash: { emoji: '💵', label: 'Efectivo', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
      transfer: { emoji: '📲', label: 'Transferencia', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
      mobile_pay: { emoji: '📱', label: 'Pago Móvil', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
      credit: { emoji: '📝', label: 'Crédito', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
    };

    const method = methodMap[movement.paymentMethod as keyof typeof methodMap];
    if (!method) return null;

    return (
      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[8px] font-bold border ${method.color}`}>
        <span>{method.emoji}</span>
        {method.label}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="BUSCAR CLIENTE..."
            className="text-[13px]"
            leftIcon={<Search size={18} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'paid', 'pending', 'cancelled'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 md:px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-accent-primary text-white'
                  : 'bg-ui-bg border border-ui-border text-ui-text hover:border-accent-primary'
              }`}
            >
              {status === 'all' ? 'Todos' : status === 'paid' ? 'Pagados' : status === 'pending' ? 'Pendientes' : 'Cancelados'}
            </button>
          ))}
        </div>
      </div>

      {/* Movements List */}
      <div className="space-y-2">
        {filteredMovements.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-ui-text-muted">
              <FileText size={32} className="mx-auto mb-3 opacity-50" />
              <p className="font-medium">No hay movimientos que mostrar</p>
            </CardContent>
          </Card>
        ) : (
          filteredMovements.map(movement => {
            const date = new Date(movement.date);
            return (
              <Card key={movement.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-3 md:p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0">
                      {movement.status === 'paid' && (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <CheckCircle size={20} className="text-emerald-600" />
                        </div>
                      )}
                      {movement.status === 'pending' && (
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                          <Clock size={20} className="text-amber-600" />
                        </div>
                      )}
                      {movement.status === 'cancelled' && (
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                          <Trash2 size={20} className="text-red-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <p className="text-sm font-black text-ui-text uppercase tracking-tight">
                            {movement.clientName || 'Consumidor Final'}
                          </p>
                          <p className="text-[10px] text-ui-text-muted font-bold mt-0.5">
                            {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {movement.creatorName && (
                            <p className="text-[9px] text-ui-text-muted font-medium mt-0.5">
                              Cajero: {movement.creatorName}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-start md:items-end gap-2">
                          <p className="text-lg font-black text-ui-text tracking-tighter">
                            {formatPrice(movement.total)}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {getStatusBadge(movement)}
                            {getPaymentMethodBadge(movement)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

"use client";

import React, { useEffect, useState } from 'react';
import { SalesService } from '@/services/sales.service';
import { ClientService } from '@/services/client.service';
import { Search, Clock, FileText, MessageCircle, DollarSign, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';

export default function CollectionsScreen() {
    const router = useRouter();
    const { formatPrice } = useCurrency();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<any[]>([]);
    const [debtors, setDebtors] = useState<any[]>([]);
    const [filteredDebtors, setFilteredDebtors] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'debt' | 'date'>('debt');
    const [reminderModal, setReminderModal] = useState<{client: any, debt: number} | null>(null);
    const [payModal, setPayModal] = useState<{client: any, sales: any[], debt: number} | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mobile_pay'>('cash');
    const [isPaying, setIsPaying] = useState(false);

    useEffect(() => {
        const ownerId = user?.ownerId || user?.uid || '';
        if (!ownerId) return;
        const unsubClients = ClientService.subscribeToClients(ownerId, (list) => {
            setClients(list);
        });

        return () => unsubClients();
    }, [user]);

    useEffect(() => {
        const ownerId = user?.ownerId || user?.uid || '';
        if (!ownerId) return;
        const unsubscribe = SalesService.subscribeToPendingSales(ownerId, (pendingSales: any[]) => {
            try {
                const uniqueClientIds = Array.from(new Set(pendingSales.map((s: any) => s.clientId).filter(Boolean))) as string[];
                const debtorsMap: Record<string, { debt: number, sales: any[], lastDate: number }> = {};

                pendingSales.forEach((sale: any) => {
                    if (sale.clientId) {
                        if (!debtorsMap[sale.clientId]) {
                            debtorsMap[sale.clientId] = { debt: 0, sales: [], lastDate: 0 };
                        }
                        debtorsMap[sale.clientId].debt += sale.total;
                        debtorsMap[sale.clientId].sales.push(sale);
                        if (sale.createdAt > debtorsMap[sale.clientId].lastDate) {
                            debtorsMap[sale.clientId].lastDate = sale.createdAt;
                        }
                    }
                });

                const debtorsList: any[] = [];
                for (const clientId of uniqueClientIds) {
                    const client = clients.find(c => c.id === clientId);
                    if (client) {
                        debtorsList.push({
                            client,
                            debt: debtorsMap[clientId].debt,
                            sales: debtorsMap[clientId].sales,
                            lastSaleDate: debtorsMap[clientId].lastDate
                        });
                    }
                }
                setDebtors(debtorsList);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [clients, user]);

    useEffect(() => {
        let filtered = debtors.filter((d: any) =>
            d.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.client.phone && d.client.phone.includes(searchQuery))
        );

        if (sortBy === 'debt') {
            filtered.sort((a, b) => b.debt - a.debt);
        } else {
            filtered.sort((a, b) => b.lastSaleDate - a.lastSaleDate);
        }

        setFilteredDebtors(filtered);
    }, [searchQuery, debtors, sortBy]);

    const handleRemindClick = (client: any, debt: number) => {
        setReminderModal({ client, debt });
    };

    const copyReminderMessage = () => {
        if (!reminderModal) return;
        const message = `Hola ${reminderModal.client.name}, te recordamos que tienes un saldo pendiente de $${reminderModal.debt.toFixed(2)} en Cuadra.`;
        navigator.clipboard.writeText(message);
        toast.success('Mensaje copiado al portapapeles');
        setReminderModal(null);
    };

    const openWhatsApp = () => {
        if (!reminderModal) return;
        const message = `Hola ${reminderModal.client.name}, te recordamos que tienes un saldo pendiente de $${reminderModal.debt.toFixed(2)} en Cuadra.`;
        const whatsappUrl = `https://wa.me/${reminderModal.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        setReminderModal(null);
    };

    const handlePayAll = async () => {
        if (!payModal) return;
        setIsPaying(true);
        try {
            await SalesService.payAllDebts(payModal.client.id, { paymentMethod });
            toast.success(`Deuda de ${payModal.client.name} cobrada con éxito`);
            setPayModal(null);
        } catch (error: any) {
            toast.error(error.message || 'Error al registrar el cobro');
        } finally {
            setIsPaying(false);
        }
    };

    const totalDebt = debtors.reduce((sum, d) => sum + d.debt, 0);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span className="ml-3 text-gray-500 font-medium tracking-wide">Calculando deudas...</span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">

            {/* Header bento */}
            <div className="liquid-glass rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Cobranzas</h1>
                    <p className="text-foreground/50 font-medium tracking-wide mt-1">Gestión de créditos y cuentas por cobrar</p>
                </div>
                <div className="liquid-glass rounded-[18px] p-4 flex flex-col items-center min-w-[160px]" style={{ border: '1px solid rgba(255,59,48,0.20)' }}>
                    <span className="text-[11px] font-black text-ios-red/70 tracking-widest uppercase mb-1">Total Deuda</span>
                    <span className="text-3xl font-black text-ios-red">{formatPrice(totalDebt)}</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 mb-2">
                <Input
                    placeholder="BUSCAR DEUDOR..."
                    className="text-[13px] liquid-glass w-full"
                    leftIcon={<Search size={18} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />

                <div className="liquid-glass rounded-[18px] flex p-1 shrink-0 h-14 gap-1">
                    <button
                        onClick={() => setSortBy('debt')}
                        className={`flex-1 px-5 py-2 rounded-[14px] text-sm font-bold transition-all whitespace-nowrap ${sortBy === 'debt' ? 'bg-white/25 dark:bg-white/10 text-foreground shadow-sm' : 'text-foreground/45 hover:text-foreground/70'}`}
                    >
                        Mayor Deuda
                    </button>
                    <button
                        onClick={() => setSortBy('date')}
                        className={`flex-1 px-5 py-2 rounded-[14px] text-sm font-bold transition-all whitespace-nowrap ${sortBy === 'date' ? 'bg-white/25 dark:bg-white/10 text-foreground shadow-sm' : 'text-foreground/45 hover:text-foreground/70'}`}
                    >
                        Más Reciente
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {filteredDebtors.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 dark:text-gray-600">
                        <FileText className="mx-auto mb-4 opacity-30" size={56} />
                        <p className="text-lg font-medium">No hay deudas pendientes en este momento.</p>
                    </div>
                ) : (
                    filteredDebtors.map(item => (
                        <Card key={item.client.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="p-5 flex flex-col md:flex-row gap-4 md:items-center">

                                <div className="flex items-center flex-1 gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xl shadow-inner shrink-0 transition-transform group-hover:scale-105">
                                        {item.client.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.client.name}</h3>
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            <Clock size={14} className="mr-1.5 opacity-70" />
                                            <span>Último crédito: {new Date(item.lastSaleDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-4 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-ui-border">
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[9px] md:text-[10px] font-black text-ui-text-muted uppercase tracking-[0.15em] mb-0.5 truncate">Total Pendiente</span>
                                        <span className="text-xl md:text-2xl font-black text-red-600 dark:text-red-400 tracking-tighter">
                                            {formatPrice(item.debt)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemindClick(item.client, item.debt); }}
                                            className="w-11 h-11 flex items-center justify-center text-green-500 bg-green-500/5 hover:bg-green-500/10 border border-green-500/10 rounded-2xl transition-all active:scale-90"
                                            title="Recordar Cobro"
                                            aria-label="Enviar recordatorio"
                                        >
                                            <MessageCircle size={20} strokeWidth={2.5} />
                                        </button>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPaymentMethod('cash'); setPayModal({ client: item.client, sales: item.sales, debt: item.debt }); }}
                                            className="h-11 px-4 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                            title="Registrar cobro"
                                        >
                                            <DollarSign size={14} />
                                            Cobrar
                                        </button>

                                        <Button
                                            onClick={() => router.push(`/clients/${item.client.id}`)}
                                            className="h-11 px-5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                        >
                                            Gestionar
                                        </Button>
                                    </div>
                                </div>

                            </div>
                        </Card>
                    ))
                )}
            </div>

            {payModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200" role="dialog" aria-modal="true">
                    <div className="ui-card w-full max-w-sm border border-ui-border shadow-2xl animate-in zoom-in-95 duration-300 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-ui-text uppercase tracking-tight">Registrar Cobro</h2>
                                <p className="text-[11px] font-bold text-ui-text-muted mt-1 uppercase tracking-widest">{payModal.client.name}</p>
                            </div>
                            <button onClick={() => setPayModal(null)} className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ui-text-muted hover:text-ui-text" aria-label="Cerrar">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="ui-input-box px-6 py-4 mb-6 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">Total a Cobrar</span>
                            <span className="text-2xl font-black text-red-500">{formatPrice(payModal.debt)}</span>
                        </div>

                        <div className="space-y-3 mb-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">Método de Pago</p>
                            {([
                                { id: 'cash', emoji: '💵', label: 'Efectivo' },
                                { id: 'transfer', emoji: '📲', label: 'Transferencia' },
                                { id: 'mobile_pay', emoji: '📱', label: 'Pago Móvil' },
                            ] as const).map(opt => (
                                <button key={opt.id} onClick={() => setPaymentMethod(opt.id)} className={`w-full p-3 rounded-xl flex items-center gap-3 font-bold border-2 transition-all active:scale-95 ${paymentMethod === opt.id ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-transparent bg-black/5 dark:bg-white/5 text-ui-text-muted hover:bg-black/10'}`}>
                                    <span className="text-lg">{opt.emoji}</span>
                                    <span className="uppercase tracking-wide text-xs">{opt.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setPayModal(null)} className="flex-1 h-12 rounded-xl bg-black/5 dark:bg-white/5 font-black text-sm uppercase tracking-widest text-ui-text-muted hover:text-ui-text transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handlePayAll} disabled={isPaying} className="flex-1 h-12 rounded-xl bg-emerald-500 text-white font-black text-sm uppercase tracking-widest hover:bg-emerald-600 transition-colors disabled:opacity-50">
                                {isPaying ? 'Procesando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reminderModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 transition-all animate-in fade-in duration-200">
                    <div className="ui-card w-full max-w-sm border border-ui-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-[#25D366]/20 text-[#25D366] rounded-2xl flex items-center justify-center mb-6">
                            <MessageCircle size={32} />
                        </div>
                        <h2 className="text-xl font-black text-ui-text mb-2 uppercase tracking-tight">Vía de Contacto</h2>
                        <p className="text-xs font-bold text-ui-text-muted mb-8 tracking-wide">
                            Selecciona cómo notificar a <span className="text-ui-text">{reminderModal.client.name}</span>
                        </p>
                        
                        <div className="w-full space-y-3">
                            <button onClick={openWhatsApp} className="w-full py-4 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-black uppercase tracking-widest text-xs transition-transform active:scale-95 flex items-center justify-center gap-3 shadow-md">
                                <MessageCircle size={18} /> Abrir WhatsApp
                            </button>
                            <button onClick={copyReminderMessage} className="w-full py-4 px-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-ui-text rounded-xl font-black uppercase tracking-widest text-xs transition-transform active:scale-95 flex items-center justify-center gap-3">
                                <FileText size={18} opacity={0.5} /> Copiar Mensaje
                            </button>
                        </div>
                        
                        <button onClick={() => setReminderModal(null)} className="mt-8 text-[10px] p-2 font-black text-ui-text-muted uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

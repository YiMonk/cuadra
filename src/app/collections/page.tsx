"use client";

import React, { useEffect, useState } from 'react';
import { SalesService } from '@/services/sales.service';
import { ClientService } from '@/services/client.service';
import { Search, Clock, FileText, ChevronRight, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

export default function CollectionsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [debtors, setDebtors] = useState<any[]>([]);
    const [filteredDebtors, setFilteredDebtors] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'debt' | 'date'>('debt');

    useEffect(() => {
        const unsubscribe = SalesService.subscribeToPendingSales(async (pendingSales: any[]) => {
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
                    const client = await ClientService.getClientById(clientId);
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
    }, []);

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

    const handleRemind = (client: any, debt: number) => {
        const message = `Hola ${client.name}, te recordamos que tienes un saldo pendiente de $${debt.toFixed(2)} en Cuadra.`;
        const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
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
                    <span className="text-3xl font-black text-ios-red">${totalDebt.toFixed(2)}</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 mb-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/35" size={18} />
                    <Input
                        placeholder="Buscar deudor..."
                        className="pl-12 h-14 text-base liquid-glass border-0 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

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

                                <div className="flex items-center justify-between md:justify-end gap-6 md:w-1/2">
                                    <div className="text-left md:text-right">
                                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Deuda</span>
                                        <span className="text-2xl font-black text-red-600 dark:text-red-400">${item.debt.toFixed(2)}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemind(item.client, item.debt); }}
                                            className="p-3 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-colors font-medium flex items-center justify-center group-hover:bg-green-50"
                                            title="Recordar por WhatsApp"
                                        >
                                            <MessageCircle size={24} />
                                        </button>
                                        <Button
                                            onClick={() => router.push(`/clients/${item.client.id}`)}
                                            className="hidden sm:flex"
                                        >
                                            Gestionar
                                        </Button>
                                        <button
                                            onClick={() => router.push(`/clients/${item.client.id}`)}
                                            className="sm:hidden p-3 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </Card>
                    ))
                )}
            </div>

        </div>
    );
}

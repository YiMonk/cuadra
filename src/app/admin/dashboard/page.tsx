"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserService, UserMetadata } from '@/services/user.service';
import { SalesService } from '@/services/sales.service';
import { DataManager } from '@/services/DataManager';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Store,
    Users,
    Banknote,
    ShoppingCart,
    Trash2,
    RefreshCw,
    Settings,
    UserPlus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Sale } from '@/types/sales';
import { Select } from '@/components/ui/Select';

export default function AdminGodDashboardPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserMetadata[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
    const [wiping, setWiping] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allUsers, allSales] = await Promise.all([
                UserService.getUsers(),
                SalesService.getAllSales ? SalesService.getAllSales() : []
            ]);
            setUsers(allUsers);
            setSales(allSales as Sale[]);
        } catch (error) {
            console.error("Error loading admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleWipeDatabase = async () => {
        if (!user) return;
        
        toast.error('⚠️ LIMPIAR BASE DE DATOS', {
            description: '¿Estás seguro de que quieres eliminar TODOS los datos? Esta acción NO se puede deshacer.',
            action: {
                label: 'Eliminar TODO',
                onClick: async () => {
                    setWiping(true);
                    try {
                        await DataManager.wipeDatabase(user.uid);
                        toast.success('Base de datos limpiada con éxito');
                        loadData();
                    } catch (error) {
                        toast.error('Error al limpiar la base de datos');
                    } finally {
                        setWiping(false);
                    }
                }
            },
            cancel: { label: 'Cancelar', onClick: () => {} }
        });
    };

    const owners = useMemo(() => {
        return users.filter(u => u.role === 'admin' && (!u.ownerId || u.ownerId === u.id));
    }, [users]);

    const filteredData = useMemo(() => {
        let startTime = 0;
        const now = Date.now();
        if (timeRange === '7d') startTime = subDays(now, 7).getTime();
        else if (timeRange === '30d') startTime = subDays(now, 30).getTime();

        const filteredSales = sales.filter(s => s.createdAt >= startTime);
        const filteredUsers = users.filter(u => u.createdAt >= startTime);

        return { filteredSales, filteredUsers };
    }, [sales, users, timeRange]);

    const chartData = useMemo(() => {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 10;
        const data: any[] = [];

        const interval = eachDayOfInterval({
            start: subDays(new Date(), days - 1),
            end: new Date()
        });

        interval.forEach(day => {
            const dateStr = format(day, 'dd/MM', { locale: es });

            const daySales = filteredData.filteredSales.filter(s =>
                isWithinInterval(new Date(s.createdAt), {
                    start: startOfDay(day),
                    end: endOfDay(day)
                })
            );

            const dayUsers = filteredData.filteredUsers.filter(u =>
                isWithinInterval(new Date(u.createdAt), {
                    start: startOfDay(day),
                    end: endOfDay(day)
                })
            );

            data.push({
                name: dateStr,
                ventas: daySales.length,
                usuarios: dayUsers.length
            });
        });

        return data;
    }, [filteredData, timeRange]);

    const totalSalesVolume = filteredData.filteredSales.reduce((acc, s) => acc + (s.total || 0), 0);
    const totalSubscriptionRevenue = filteredData.filteredUsers.reduce((acc, u) => acc + (u.subscriptionPrice || 0), 0);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500 font-medium">Cargando Panel de Control...</span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col">
                    <h1 className="text-4xl font-black tracking-tighter text-ui-text uppercase leading-none mb-2">Panel Maestro</h1>
                    <p className="text-[10px] font-black text-ui-text-muted uppercase tracking-[0.3em] opacity-60">Gestión Global del Ecosistema Cuadra</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="min-w-[180px]">
                        <Select
                            options={[
                                { value: '7d', label: 'Últimos 7 días' },
                                { value: '30d', label: 'Últimos 30 días' },
                                { value: 'all', label: 'Todo el tiempo' }
                            ]}
                            value={timeRange}
                            onChange={(val) => setTimeRange(val as any)}
                        />
                    </div>

                    <button
                        onClick={loadData}
                        className="p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm hover:shadow hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400 transition"
                        title="Actualizar datos"
                    >
                        <RefreshCw size={18} />
                    </button>

                    {(user?.role === 'admingod' || user?.role === 'admin') && (
                        <button
                            onClick={handleWipeDatabase}
                            disabled={wiping}
                            className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-xl shadow-sm hover:shadow hover:border-red-200 dark:hover:border-red-900 transition disabled:opacity-50"
                            title="Limpiar Base de Datos"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="ui-card ui-glass-card p-6 flex flex-col group hover:border-accent-primary/50 transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-accent-primary/10 flex items-center justify-center text-accent-primary mb-4 shadow-inner group-hover:scale-110 transition-transform">
                        <Store size={24} />
                    </div>
                    <span className="text-[10px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Tiendas</span>
                    <span className="text-3xl font-black text-ui-text tracking-tighter">{owners.length}</span>
                </div>

                <div className="ui-card ui-glass-card p-6 flex flex-col group hover:border-purple-500/50 transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-4 shadow-inner group-hover:scale-110 transition-transform">
                        <Users size={24} />
                    </div>
                    <span className="text-[10px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Usuarios</span>
                    <span className="text-3xl font-black text-ui-text tracking-tighter">{users.length}</span>
                </div>

                <div className="ui-card ui-glass-card p-6 flex flex-col group hover:border-emerald-500/50 transition-all duration-300 bg-linear-to-br from-emerald-500/5 to-transparent">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-inner group-hover:scale-110 transition-transform">
                        <Banknote size={24} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Recaudación Total</span>
                    <span className="text-3xl font-black text-ui-text tracking-tighter">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalSubscriptionRevenue)}
                    </span>
                    <span className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mt-2 opacity-50 italic">Suscripciones Activas</span>
                </div>

                <div className="ui-card ui-glass-card p-6 flex flex-col group hover:border-orange-500/50 transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-4 shadow-inner group-hover:scale-110 transition-transform">
                        <ShoppingCart size={24} />
                    </div>
                    <span className="text-[10px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Transacciones</span>
                    <span className="text-3xl font-black text-ui-text tracking-tighter">{filteredData.filteredSales.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                <div className="ui-card ui-glass-card p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                            <ShoppingCart size={20} />
                        </div>
                        <h3 className="text-sm font-black text-ui-text uppercase tracking-widest">Actividad de Ventas</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#000', padding: '12px 20px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                                />
                                <Line type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="ui-card ui-glass-card p-8">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <UserPlus size={20} />
                        </div>
                        <h3 className="text-sm font-black text-ui-text uppercase tracking-widest">Nuevos Usuarios</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#000', padding: '12px 20px' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                                />
                                <Bar dataKey="usuarios" fill="#10b981" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

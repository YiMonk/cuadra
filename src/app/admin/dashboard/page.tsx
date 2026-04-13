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
    Settings
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
            cancel: { label: 'Cancelar' }
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
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">AdminGod</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide">Gestión Global del Sistema</p>
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/50">
                    <CardContent className="p-5 flex flex-col">
                        <Store className="text-blue-600 dark:text-blue-400 mb-2" size={24} />
                        <span className="text-xs font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-widest mb-1">Tiendas</span>
                        <span className="text-2xl font-black text-blue-900 dark:text-blue-100">{owners.length}</span>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/50">
                    <CardContent className="p-5 flex flex-col">
                        <Users className="text-purple-600 dark:text-purple-400 mb-2" size={24} />
                        <span className="text-xs font-bold text-purple-600/70 dark:text-purple-400/70 uppercase tracking-widest mb-1">Usuarios</span>
                        <span className="text-2xl font-black text-purple-900 dark:text-purple-100">{users.length}</span>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50">
                    <CardContent className="p-5 flex flex-col">
                        <Banknote className="text-green-600 dark:text-green-400 mb-2" size={24} />
                        <span className="text-xs font-bold text-green-600/70 dark:text-green-400/70 uppercase tracking-widest mb-1">Volumen</span>
                        <span className="text-2xl font-black text-green-900 dark:text-green-100">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalSalesVolume)}
                        </span>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900/50">
                    <CardContent className="p-5 flex flex-col">
                        <ShoppingCart className="text-orange-600 dark:text-orange-400 mb-2" size={24} />
                        <span className="text-xs font-bold text-orange-600/70 dark:text-orange-400/70 uppercase tracking-widest mb-1">Ventas</span>
                        <span className="text-2xl font-black text-orange-900 dark:text-orange-100">{filteredData.filteredSales.length}</span>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Actividad de Ventas</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#000' }}
                                    />
                                    <Line type="monotone" dataKey="ventas" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Nuevos Usuarios</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.9)', color: '#000' }}
                                    />
                                    <Bar dataKey="usuarios" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

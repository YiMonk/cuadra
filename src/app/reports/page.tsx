"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

import React, { useEffect, useState, useMemo } from 'react';
import { SalesService } from '@/services/sales.service';
import { UserService } from '@/services/user.service';
import { Sale } from '@/types/sales';
import { UserMetadata } from '@/services/user.service';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, FileText, ShoppingCart, TrendingUp, Calendar, Filter, User as UserIcon, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'];

export default function ReportsScreen() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
    const [cashiers, setCashiers] = useState<UserMetadata[]>([]);
    const [selectedCashier, setSelectedCashier] = useState<string>('all');

    // Metrics
    const [metrics, setMetrics] = useState({ revenue: 0, pending: 0, count: 0, average: 0 });
    const [chartData, setChartData] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);
    const [cashboxMetrics, setCashboxMetrics] = useState<any[]>([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [salesData, cashiersData] = await Promise.all([
                    SalesService.getAllSales(),
                    UserService.getUsers()
                ]);
                setAllSales(salesData);
                setCashiers(cashiersData);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user && user.role !== 'staff') {
            fetchInitialData();
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading && user) {
            if (user.role === 'staff') {
                router.replace('/pos');
            } else if (user.role === 'admin' || user.role === 'admingod') {
                router.replace('/admin/dashboard');
            }
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        let filtered = allSales.filter(s => {
            if (selectedCashier !== 'all') {
                return s.cashboxId === selectedCashier || s.createdBy === selectedCashier;
            }
            return true;
        });

        filtered.sort((a, b) => {
            const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt as any)?.toDate?.()?.getTime() || 0;
            const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt as any)?.toDate?.()?.getTime() || 0;
            return timeB - timeA;
        });

        setFilteredSales(filtered);
        processStats(filtered);
    }, [allSales, selectedCashier]);

    const processStats = (data: Sale[]) => {
        const rev = data.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
        const pend = data.filter(s => s.status === 'pending').reduce((sum, s) => sum + (Number(s.total) || 0), 0);

        setMetrics({
            revenue: rev,
            pending: pend,
            count: data.length,
            average: data.length > 0 ? rev / data.length : 0
        });

        // Line Chart Data
        const last7 = data.slice(0, 7).reverse();
        const cData = last7.map(s => {
            const time = typeof s.createdAt === 'number' ? s.createdAt : (s.createdAt as any)?.toDate?.()?.getTime() || 0;
            return {
                name: time ? new Date(time).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '?',
                total: Number(s.total) || 0
            };
        });
        setChartData(cData);

        // Pie Chart Data
        const methods: Record<string, number> = {};
        data.forEach(s => {
            const m = s.paymentMethod === 'cash' ? 'Efectivo' :
                s.paymentMethod === 'transfer' ? 'Transf.' :
                    s.paymentMethod === 'credit' ? 'Crédito' : 'Otro';
            methods[m] = (methods[m] || 0) + 1;
        });

        setPieData(Object.entries(methods).map(([name, value], idx) => ({
            name,
            value,
            color: COLORS[idx % COLORS.length]
        })));

        // Cashbox Metrics
        const boxSummary: Record<string, any> = {};
        data.forEach(s => {
            if (s.status === 'cancelled') return;

            const bId = s.cashboxId || 'unknown';
            const bName = s.cashboxName || 'Sin Caja';
            const cId = s.createdBy || 'unknown';
            const cName = s.creatorName || 'Desconocido';
            const amount = Number(s.total) || 0;

            if (!boxSummary[cId]) {
                boxSummary[cId] = { id: cId, name: cName, real: 0, teorico: 0, salesCount: 0 };
            }
            boxSummary[cId].teorico += amount;
            boxSummary[cId].salesCount += 1;

            if (s.status === 'paid') {
                const effectiveBId = bId === 'unknown' ? 'sincaja' : bId;
                const effectiveBName = bId === 'unknown' ? 'Sin Caja Asignada' : bName;
                if (!boxSummary[effectiveBId]) {
                    boxSummary[effectiveBId] = { id: effectiveBId, name: effectiveBName, real: 0, teorico: 0, salesCount: 0 };
                }
                boxSummary[effectiveBId].real += amount;
            }
        });

        const summaryList = Object.values(boxSummary).sort((a, b) => b.real - a.real || b.teorico - a.teorico);
        setCashboxMetrics(summaryList);
    };

    const exportToExcel = () => {
        try {
            const dataToExport = filteredSales.map(sale => {
                const time = typeof sale.createdAt === 'number' ? sale.createdAt : (sale.createdAt as any)?.toDate?.()?.getTime() || 0;
                return {
                    ID: sale.id?.substring(0, 8) || 'N/A',
                    Fecha: new Date(time).toLocaleString(),
                    Cajero: sale.creatorName || 'N/A',
                    Caja: sale.cashboxName || 'Sin Caja',
                    Metodo: sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'transfer' ? 'Transferencia' : 'Crédito',
                    Estado: sale.status === 'paid' ? 'Pagado' : sale.status === 'pending' ? 'Pendiente' : 'Cancelado',
                    Total: Number(sale.total).toFixed(2)
                };
            });

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Ventas");
            XLSX.writeFile(wb, `Reporte_Cuadra_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success("Excel exportado correctamente");
        } catch (e) {
            toast.error("Error al exportar Excel");
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();
            const dateStr = new Date().toISOString().split('T')[0];
            
            // Header
            doc.setFillColor(0, 122, 255);
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(28);
            doc.text("CUADRA", 20, 25);
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("SISTEMA DE GESTIÓN Y MÉTRICAS", 20, 32);
            doc.text(`REPORTE GENERADO: ${new Date().toLocaleString()}`, 130, 25);

            // Metrics
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("Resumen General", 20, 55);
            
            autoTable(doc, {
                startY: 60,
                head: [['KPI', 'Valor']],
                body: [
                    ['Ventas Reales (Pagadas)', `$${metrics.revenue.toFixed(2)}`],
                    ['Cuentas por Cobrar', `$${metrics.pending.toFixed(2)}`],
                    ['Transacciones Totales', `${metrics.count}`],
                    ['Valor Promedio Ticket', `$${metrics.average.toFixed(2)}`]
                ],
                theme: 'striped',
                headStyles: { fillColor: [0, 122, 255], textColor: [255, 255, 255] },
                margin: { left: 20, right: 20 }
            });

            // Sales list
            const lastY = (doc as any).lastAutoTable.finalY || 100;
            doc.setFontSize(16);
            doc.text("Listado Detallado de Ventas", 20, lastY + 20);
            
            autoTable(doc, {
                startY: lastY + 25,
                head: [['Fecha', 'Cajero', 'Método', 'Estado', 'Total']],
                body: filteredSales.map(s => {
                    const time = typeof s.createdAt === 'number' ? s.createdAt : (s.createdAt as any)?.toDate?.()?.getTime() || 0;
                    return [
                        new Date(time).toLocaleDateString(),
                        s.creatorName || 'N/A',
                        s.paymentMethod === 'cash' ? 'Efec.' : s.paymentMethod === 'transfer' ? 'Transf.' : 'Créd.',
                        s.status === 'paid' ? 'Pagado' : s.status === 'pending' ? 'Pend.' : 'Can.',
                        `$${Number(s.total).toFixed(2)}`
                    ];
                }),
                headStyles: { fillColor: [31, 41, 55] },
                alternateRowStyles: { fillColor: [249, 250, 251] },
                margin: { left: 20, right: 20 }
            });

            doc.save(`Reporte_Cuadra_${dateStr}.pdf`);
            toast.success("PDF exportado correctamente");
        } catch (e) {
            console.error(e);
            toast.error("Error al exportar PDF");
        }
    };

    if (loading || authLoading || (user?.role === 'staff' || user?.role === 'admin' || user?.role === 'admingod')) {
        return (
            <div className="flex justify-center items-center h-[80vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500 font-medium tracking-wide">Calculando reportes...</span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Ventas y Métricas</h1>
                    <p className="text-foreground/60 font-medium">Análisis completo de operaciones</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select
                        options={[
                            { value: 'all', label: 'Todas las cajas' },
                            ...cashiers.map(c => ({ value: c.id, label: c.displayName || c.id }))
                        ]}
                        value={selectedCashier}
                        onChange={(val) => setSelectedCashier(val)}
                        icon={<UserIcon size={16} />}
                        className="w-[200px]"
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={exportToExcel} className="hidden md:flex gap-2">
                            <FileSpreadsheet size={16} /> Excel
                        </Button>
                        <Button variant="primary" size="sm" onClick={exportToPDF} className="flex gap-2">
                            <Download size={16} /> PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg shadow-blue-500/10 bg-linear-to-br from-blue-500/10 to-transparent dark:from-blue-600/20">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div className="bg-blue-600 shadow-lg shadow-blue-600/20 p-3 rounded-2xl w-fit">
                            <DollarSign className="text-white" size={24} strokeWidth={2.5} />
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">Ingresos Reales</p>
                            <h3 className="text-3xl font-black text-ui-text tracking-tighter">${metrics.revenue.toFixed(2)}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-red-500/10 bg-linear-to-br from-red-500/10 to-transparent dark:from-red-600/20">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div className="bg-red-500 shadow-lg shadow-red-500/20 p-3 rounded-2xl w-fit">
                            <FileText className="text-white" size={24} strokeWidth={2.5} />
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-[0.2em] mb-1">Cuentas por Cobrar</p>
                            <h3 className="text-3xl font-black text-ui-text tracking-tighter">${metrics.pending.toFixed(2)}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-green-500/10 bg-linear-to-br from-green-500/10 to-transparent dark:from-green-600/20">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div className="bg-green-500 shadow-lg shadow-green-500/20 p-3 rounded-2xl w-fit">
                            <ShoppingCart className="text-white" size={24} strokeWidth={2.5} />
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.2em] mb-1">Total Ventas</p>
                            <h3 className="text-3xl font-black text-ui-text tracking-tighter">{metrics.count} <span className="text-xs font-bold opacity-60">Transacciones</span></h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-orange-500/10 bg-linear-to-br from-orange-500/10 to-transparent dark:from-orange-600/20">
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                        <div className="bg-orange-500 shadow-lg shadow-orange-500/20 p-3 rounded-2xl w-fit">
                            <TrendingUp className="text-white" size={24} strokeWidth={2.5} />
                        </div>
                        <div className="mt-6">
                            <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-[0.2em] mb-1">Ticket Promedio</p>
                            <h3 className="text-3xl font-black text-ui-text tracking-tighter">${metrics.average.toFixed(2)}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 overflow-hidden border-0 shadow-sm shadow-blue-900/5">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Tendencia de Ventas (Últimas)</h2>
                        <div className="h-72">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(value: any) => [`$${value}`, 'Ventas']}
                                            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#3b82f6"
                                            strokeWidth={4}
                                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6, stroke: '#fff' }}
                                            activeDot={{ r: 8, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 font-medium">No hay suficientes datos</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-0 shadow-sm shadow-blue-900/5">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Métodos de Pago</h2>
                        <div className="h-72">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [`${value} Ventas`, 'Cantidad']}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 font-medium">No hay datos</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cashbox Summary List */}
            <Card className="overflow-hidden border-0 shadow-sm shadow-blue-900/5">
                <CardContent className="p-0">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rendimiento por Cajero</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/20 text-xs uppercase tracking-wider text-gray-500 font-bold">
                                    <th className="p-4 border-b border-gray-100 dark:border-gray-800 rounded-tl-xl font-bold">Cajero / Usuario</th>
                                    <th className="p-4 border-b border-gray-100 dark:border-gray-800 font-bold text-right">Ventas</th>
                                    <th className="p-4 border-b border-gray-100 dark:border-gray-800 font-bold text-right text-green-600 dark:text-green-500">Ingreso Real</th>
                                    <th className="p-4 border-b border-gray-100 dark:border-gray-800 rounded-tr-xl font-bold text-right text-blue-600 dark:text-blue-500">Teórico Generado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {cashboxMetrics.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-gray-500 font-medium">Sin datos en caja.</td></tr>
                                ) : (
                                    cashboxMetrics.map(box => (
                                        <tr key={box.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900 dark:text-white">{box.name}</div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className="font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm">
                                                    {box.salesCount} tx
                                                </span>
                                            </td>
                                            <td className="p-4 text-right font-bold text-green-600 dark:text-green-500">
                                                ${box.real.toFixed(2)}
                                            </td>
                                            <td className="p-4 text-right font-bold text-blue-600 dark:text-blue-500">
                                                ${box.teorico.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

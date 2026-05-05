"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';

import React, { useEffect, useState, useMemo } from 'react';
import { SalesService } from '@/services/sales.service';
import { ReturnService } from '@/services/return.service';
import { UserService } from '@/services/user.service';
import { Sale } from '@/types/sales';
import { UserMetadata } from '@/services/user.service';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { DollarSign, FileText, ShoppingCart, TrendingUp, Calendar, Filter, User as UserIcon, Download, FileJson, FileSpreadsheet, Eye, Info, AlertCircle, X, Clock, CreditCard, Wallet, Banknote, RotateCcw, Search, Copy, Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const COLORS = ['#7C3AED', '#C026D3', '#8B5CF6', '#D946EF', '#6366F1'];

function ReportsScreen() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { formatPrice, fromUSD, currency } = useCurrency();
    
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
    
    // Modal State
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingPayment, setIsEditingPayment] = useState(false);
    const [tempPaymentData, setTempPaymentData] = useState({ reference: '', bank: '', date: '' });
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Return Modal State
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnItems, setReturnItems] = useState<Record<string, number>>({});
    const [returnReason, setReturnReason] = useState('');
    const [isProcessingReturn, setIsProcessingReturn] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'cancelled'>('all');
    const [filterMethod, setFilterMethod] = useState<'all' | 'cash' | 'transfer' | 'mobile_pay' | 'credit'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 20;

    // Paying Pending Sale State
    const [isPayingPending, setIsPayingPending] = useState(false);
    const [pendingPayMethod, setPendingPayMethod] = useState<'cash' | 'transfer' | 'mobile_pay' | ''>('');
    const [pendingPayData, setPendingPayData] = useState({ reference: '', bank: '', date: '' });
    const [pendingEvidenceFile, setPendingEvidenceFile] = useState<File | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    // Product Chart State
    const [productChartPeriod, setProductChartPeriod] = useState<'day' | 'week' | 'month' | 'all'>('month');

    // Share buttons state
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const ownerId = user?.ownerId || user?.uid || '';
                const [salesData, cashiersData] = await Promise.all([
                    SalesService.getAllSales(ownerId),
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
            if (selectedCashier !== 'all' && s.cashboxId !== selectedCashier && s.createdBy !== selectedCashier) return false;
            if (filterStatus !== 'all' && s.status !== filterStatus) return false;
            if (filterMethod !== 'all' && s.paymentMethod !== filterMethod) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const ok = (s.clientName || '').toLowerCase().includes(q)
                        || (s.creatorName || '').toLowerCase().includes(q)
                        || (s.id || '').toLowerCase().includes(q);
                if (!ok) return false;
            }
            return true;
        });

        filtered.sort((a, b) => {
            const timeA = typeof a.createdAt === 'number' ? a.createdAt : (a.createdAt as any)?.toDate?.()?.getTime() || 0;
            const timeB = typeof b.createdAt === 'number' ? b.createdAt : (b.createdAt as any)?.toDate?.()?.getTime() || 0;
            return timeB - timeA;
        });

        setFilteredSales(filtered);
        setCurrentPage(1);
        processStats(filtered);
    }, [allSales, selectedCashier, filterStatus, filterMethod, searchQuery]);

    const processStats = (data: Sale[]) => {
        const summary = SalesService.computeSummary(data);
        setMetrics({
            revenue: summary.revenue,
            pending: summary.pending,
            count: summary.count,
            average: summary.average,
        });

        // Line Chart Data — last 7 sales in chronological order
        const last7 = data.slice(0, 7).reverse();
        setChartData(last7.map(s => {
            const time = typeof s.createdAt === 'number' ? s.createdAt : (s.createdAt as any)?.toDate?.()?.getTime() || 0;
            return {
                name: time ? new Date(time).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : '?',
                total: Number(s.total) || 0,
            };
        }));

        // Pie Chart Data — payment method distribution
        const methodLabels: Record<string, string> = { cash: 'Efectivo', transfer: 'Transf.', credit: 'Crédito', mobile_pay: 'Pago Móvil' };
        const byCount: Record<string, number> = {};
        data.forEach(s => {
            const label = methodLabels[s.paymentMethod] || 'Otro';
            byCount[label] = (byCount[label] || 0) + 1;
        });
        setPieData(Object.entries(byCount).map(([name, value], idx) => ({ name, value, color: COLORS[idx % COLORS.length] })));

        setCashboxMetrics(summary.byCashbox);
    };

    const displayedSales = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredSales.slice(start, start + PAGE_SIZE);
    }, [filteredSales, currentPage]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));
    }, [filteredSales]);

    const topProductsData = useMemo(() => {
        const now = Date.now();
        const cutoffs = { day: 86400000, week: 604800000, month: 2592000000 };
        const cutoff = productChartPeriod === 'all' ? 0 : now - cutoffs[productChartPeriod];

        const counter: Record<string, { name: string; qty: number; revenue: number }> = {};
        allSales
            .filter(s => s.status === 'paid' && (productChartPeriod === 'all' || s.createdAt >= cutoff))
            .forEach(s => {
                s.items.forEach(item => {
                    const key = item.id + (item.variantId || '');
                    const label = item.variantName ? `${item.name} (${item.variantName})` : item.name;
                    if (!counter[key]) counter[key] = { name: label, qty: 0, revenue: 0 };
                    counter[key].qty += item.quantity;
                    counter[key].revenue += item.finalPrice * item.quantity;
                });
            });
        return Object.values(counter)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 10);
    }, [allSales, productChartPeriod]);

    const handlePayPendingSale = async () => {
        if (!selectedSale?.id || !pendingPayMethod) {
            toast.error('Debes seleccionar un método de pago');
            return;
        }
        setIsProcessingPayment(true);
        try {
            let evidenceUrl = selectedSale.evidenceUrl;
            if (pendingEvidenceFile) {
                const formData = new FormData();
                formData.append('file', pendingEvidenceFile);
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    evidenceUrl = data.url;
                }
            }
            const updateData: Partial<Sale> = {
                status: 'paid',
                paymentMethod: pendingPayMethod,
                paidAt: Date.now(),
                evidenceUrl,
            };
            if ((pendingPayMethod === 'transfer' || pendingPayMethod === 'mobile_pay') &&
                (pendingPayData.reference || pendingPayData.bank || pendingPayData.date)) {
                updateData.paymentData = Object.fromEntries(
                    Object.entries(pendingPayData).filter(([_, v]) => v)
                ) as any;
            }
            await SalesService.updateSale(selectedSale.id, updateData);
            toast.success('Venta cobrada exitosamente');
            const updated = { ...selectedSale, ...updateData } as Sale;
            setSelectedSale(updated);
            setAllSales(prev => prev.map(s => s.id === selectedSale.id ? updated : s));
            setIsPayingPending(false);
            setPendingPayMethod('');
            setPendingPayData({ reference: '', bank: '', date: '' });
            setPendingEvidenceFile(null);
        } catch (error: any) {
            toast.error(error.message || 'Error al cobrar la venta');
        } finally {
            setIsProcessingPayment(false);
        }
    };

    const handleCopyList = () => {
        if (!selectedSale) return;
        let text = `Cliente: ${selectedSale.clientName || 'Consumidor Final'}\n`;
        text += `📋 Lista de productos:\n`;

        selectedSale.items?.forEach((item: any) => {
            const qty = item.quantity || 0;
            const price = item.finalPrice || item.price || 0;
            const variantText = item.variantName ? ` (${item.variantName})` : '';
            const subtotal = price * qty;

            text += `• ${qty}x ${item.name}${variantText} — $${price.toFixed(2)} c/u = $${subtotal.toFixed(2)}\n`;
            if (item.discountApplied) {
                text += `  └─ Nota: ${item.discountApplied}\n`;
            }
        });

        const { exchangeRate } = useCurrency();
        text += `\nTotal: ${formatPrice(selectedSale.total)}\n`;
        text += `Bs. ${(selectedSale.total * exchangeRate).toLocaleString('es-VE')} (Tasa BCV: Bs. ${exchangeRate.toFixed(2)})\n`;
        text += `\nCuadra POS`;

        navigator.clipboard.writeText(text);
        toast.success('Lista copiada al portapapeles');
    };

    const handleGenerateImage = async () => {
        if (!selectedSale) return;
        setIsGeneratingImage(true);
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const allItems = selectedSale.items || [];
            const itemLineHeight = 35;
            const detailHeight = allItems.length * itemLineHeight;
            const baseHeight = 500;
            const totalHeight = Math.max(600, baseHeight + detailHeight);

            const scale = 2;
            canvas.width = 400 * scale;
            canvas.height = totalHeight * scale;
            ctx.scale(scale, scale);

            const radius = 40;
            const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(x, y, w, h, r);
                } else {
                    ctx.rect(x, y, w, h);
                }
            };

            drawRoundedRect(0, 0, 400, totalHeight, radius);
            ctx.clip();
            ctx.fillStyle = '#0D0B1F';
            ctx.fillRect(0, 0, 400, totalHeight);

            ctx.strokeStyle = '#7C3AED';
            ctx.lineWidth = 14;
            drawRoundedRect(7, 7, 386, totalHeight - 14, radius);
            ctx.stroke();

            ctx.fillStyle = '#7C3AED';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CUADRA', 200, 50);

            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('DETALLE DE VENTA:', 45, 90);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 18px Inter, sans-serif';
            ctx.fillText((selectedSale.clientName || 'Consumidor Final').toUpperCase(), 45, 115);

            let currentY = 150;

            if (allItems.length > 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.font = 'black 10px Inter, sans-serif';
                ctx.fillText('PRODUCTOS', 45, 145);

                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(45, 155);
                ctx.lineTo(355, 155);
                ctx.stroke();

                currentY = 180;
                allItems.forEach((item: any) => {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Inter, sans-serif';
                    const nameText = `${item.quantity}x ${item.name.substring(0, 24)}`;
                    ctx.fillText(nameText, 45, currentY);

                    ctx.textAlign = 'right';
                    ctx.fillText(formatPrice(item.finalPrice || item.price), 355, currentY);
                    ctx.textAlign = 'left';

                    if (item.discountApplied) {
                        currentY += 15;
                        ctx.fillStyle = '#C026D3';
                        ctx.font = 'italic 10px Inter, sans-serif';
                        ctx.fillText(`└─ ${item.discountApplied.substring(0, 30)}`, 55, currentY);
                    }
                    currentY += itemLineHeight;
                });
                currentY += 20;
            }

            const { exchangeRate } = useCurrency();
            const summaryY = Math.max(currentY, totalHeight - 150);
            ctx.strokeStyle = '#7C3AED';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(45, summaryY);
            ctx.lineTo(355, summaryY);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 32px Inter, sans-serif';
            ctx.fillText(`Total: ${formatPrice(selectedSale.total)}`, 45, summaryY + 45);

            const vesY = summaryY + 80;
            ctx.fillStyle = '#C026D3';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.fillText(`Bs. ${(selectedSale.total * exchangeRate).toLocaleString('es-VE')}`, 45, vesY);

            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillText(`TASA BCV: Bs. ${exchangeRate.toFixed(2)}`, 45, vesY + 20);

            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.textAlign = 'center';
            ctx.font = '900 10px Inter, sans-serif';
            ctx.fillText('cuadra.vercel.app', 200, totalHeight - 30);

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], 'venta-cuadra.png', { type: 'image/png' });
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Detalle de Venta', text: `Detalle de compra de ${selectedSale.clientName}` });
                } else {
                    try {
                        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                        toast.success('Imagen copiada. Pégala en WhatsApp.');
                    } catch (e) {
                        toast.error('Error al compartir');
                    }
                }
            }, 'image/png');

        } catch (error: any) {
            console.error(error);
            toast.error('Error al generar imagen');
        } finally {
            setIsGeneratingImage(false);
        }
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
            XLSX.utils.book_append_sheet(wb, ws, "Transacciones");
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
                    ['Transacciones Completadas', `$${metrics.revenue.toFixed(2)}`],
                    ['Cuentas por Cobrar', `$${metrics.pending.toFixed(2)}`],
                    ['Total de Transacciones', `${metrics.count}`],
                    ['Valor Promedio Transacción', `$${metrics.average.toFixed(2)}`]
                ],
                theme: 'striped',
                headStyles: { fillColor: [0, 122, 255], textColor: [255, 255, 255] },
                margin: { left: 20, right: 20 }
            });

            // Transactions list
            const lastY = (doc as any).lastAutoTable.finalY || 100;
            doc.setFontSize(16);
            doc.text("Listado Detallado de Transacciones", 20, lastY + 20);
            
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                <span className="ml-3 text-ui-text-muted font-black uppercase tracking-widest text-[10px]">Calculando reportes...</span>
            </div>
        );
    }

    const openSaleDetails = (sale: Sale) => {
        setSelectedSale(sale);
        setTempPaymentData({
            reference: sale.paymentData?.reference || '',
            bank: sale.paymentData?.bank || '',
            date: sale.paymentData?.date || ''
        });
        setIsEditingPayment(false);
        setIsModalOpen(true);
    };

    const handleUpdatePaymentData = async () => {
        if (!selectedSale?.id) return;
        setIsSavingEdit(true);
        try {
            await SalesService.updateSale(selectedSale.id, {
                paymentData: {
                    ...selectedSale.paymentData,
                    ...tempPaymentData
                }
            });
            toast.success('Datos de pago actualizados');

            // Update local state
            const updatedSale = {
                ...selectedSale,
                paymentData: { ...selectedSale.paymentData, ...tempPaymentData }
            };
            setSelectedSale(updatedSale);
            setAllSales(prev => prev.map(s => s.id === selectedSale.id ? updatedSale : s));
            setIsEditingPayment(false);
        } catch (error) {
            toast.error('Error al actualizar datos');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleProcessReturn = async () => {
        if (!selectedSale?.id) return;
        if (!returnReason.trim()) {
            toast.error('Debes ingresar un motivo para la devolución');
            return;
        }

        const itemsToReturn = Object.entries(returnItems)
            .filter(([_, qty]) => qty > 0)
            .map(([itemKey, qty]) => {
                const item = selectedSale.items.find(i => i.id + (i.variantId || '') === itemKey);
                if (!item) throw new Error('Producto no encontrado');
                return {
                    productId: item.id,
                    productName: item.name,
                    quantity: qty,
                    price: item.finalPrice,
                    variantId: item.variantId,
                    variantName: item.variantName,
                };
            });

        if (itemsToReturn.length === 0) {
            toast.error('Debes seleccionar al menos un producto para devolver');
            return;
        }

        setIsProcessingReturn(true);
        try {
            await ReturnService.createReturn(
                selectedSale.id,
                itemsToReturn,
                returnReason.trim(),
                { id: user?.uid || '', name: user?.displayName || '' }
            );
            toast.success('Devolución registrada exitosamente');
            setIsReturnModalOpen(false);
            setReturnItems({});
            setReturnReason('');

            // Update sale to show it has returns
            const updated = { ...selectedSale, hasReturns: true };
            setSelectedSale(updated);
            setAllSales(prev => prev.map(s => s.id === selectedSale.id ? updated : s));
        } catch (error: any) {
            toast.error(error.message || 'Error al procesar la devolución');
        } finally {
            setIsProcessingReturn(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 md:pb-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl md:text-[40px] font-black tracking-tighter text-ui-text uppercase leading-none">Métricas</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-1 w-8 bg-accent-primary rounded-full" />
                        <p className="text-ui-text-muted/80 font-black uppercase tracking-[0.2em] text-[10px]">Análisis de Operaciones</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="w-full sm:w-64 z-30">
                        <Select
                            options={[
                                { value: 'all', label: 'Todas las cajas' },
                                ...cashiers.map(c => ({ value: c.id, label: c.displayName || c.id }))
                            ]}
                            value={selectedCashier}
                            onChange={(val) => setSelectedCashier(val)}
                            icon={<UserIcon size={16} className="text-accent-primary" />}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={exportToExcel} className="flex-1 sm:flex-none h-12 px-5 bg-white dark:bg-black/5 hover:bg-gray-50 border-ui-border/50 font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2">
                            <FileSpreadsheet size={16} /> Excel
                        </Button>
                        <Button variant="primary" onClick={exportToPDF} className="flex-1 sm:flex-none h-12 px-5 bg-accent-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-accent-primary/20 flex items-center justify-center gap-2">
                            <Download size={16} /> Export PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card className="border-0 shadow-lg shadow-violet-500/10 bg-linear-to-br from-violet-500/10 to-transparent dark:from-violet-600/20">
                    <CardContent className="p-4 md:p-6 h-full flex flex-col justify-between">
                        <div className="bg-violet-600 shadow-lg shadow-violet-600/20 p-2.5 md:p-3 rounded-xl md:rounded-2xl w-fit">
                            <DollarSign className="text-white" size={22} strokeWidth={2.5} />
                        </div>
                        <div className="mt-4 md:mt-6">
                            <p className="text-[8px] md:text-[10px] font-black text-violet-600 dark:text-violet-400 uppercase tracking-[0.2em] mb-1">Ingresos</p>
                            <h3 className="text-xl md:text-3xl font-black text-ui-text tracking-tighter leading-none">{formatPrice(metrics.revenue)}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-fuchsia-500/10 bg-linear-to-br from-fuchsia-500/10 to-transparent dark:from-fuchsia-600/20">
                    <CardContent className="p-4 md:p-6 h-full flex flex-col justify-between">
                        <div className="bg-fuchsia-500 shadow-lg shadow-fuchsia-500/20 p-2.5 md:p-3 rounded-xl md:rounded-2xl w-fit">
                            <FileText className="text-white" size={22} strokeWidth={2.5} />
                        </div>
                        <div className="mt-4 md:mt-6">
                            <p className="text-[8px] md:text-[10px] font-black text-fuchsia-500 dark:text-fuchsia-400 uppercase tracking-[0.2em] mb-1">Cuentas</p>
                            <h3 className="text-xl md:text-3xl font-black text-ui-text tracking-tighter leading-none">{formatPrice(metrics.pending)}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-indigo-500/10 bg-linear-to-br from-indigo-500/10 to-transparent dark:from-indigo-600/20">
                    <CardContent className="p-4 md:p-6 h-full flex flex-col justify-between">
                        <div className="bg-indigo-500 shadow-lg shadow-indigo-500/20 p-2.5 md:p-3 rounded-xl md:rounded-2xl w-fit">
                            <ShoppingCart className="text-white" size={22} strokeWidth={2.5} />
                        </div>
                        <div className="mt-4 md:mt-6">
                            <p className="text-[8px] md:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-1">Transacciones</p>
                            <h3 className="text-xl md:text-3xl font-black text-ui-text tracking-tighter leading-none">{metrics.count} <span className="text-[10px] md:text-xs font-bold opacity-60">Tx</span></h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg shadow-purple-500/10 bg-linear-to-br from-purple-500/10 to-transparent dark:from-purple-600/20">
                    <CardContent className="p-4 md:p-6 h-full flex flex-col justify-between">
                        <div className="bg-purple-500 shadow-lg shadow-purple-500/20 p-2.5 md:p-3 rounded-xl md:rounded-2xl w-fit">
                            <TrendingUp className="text-white" size={22} strokeWidth={2.5} />
                        </div>
                        <div className="mt-4 md:mt-6">
                            <p className="text-[8px] md:text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] mb-1">Ticket Prom.</p>
                            <h3 className="text-xl md:text-3xl font-black text-ui-text tracking-tighter leading-none">{formatPrice(metrics.average)}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 overflow-hidden border-0 shadow-sm shadow-blue-900/5">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Tendencia de Transacciones (Últimas)</h2>
                        <div className="h-72">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => currency === 'USD' ? `$${value}` : `Bs.${Math.round(fromUSD(value))}`} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            formatter={(value: any) => [formatPrice(value), 'Transacciones']}
                                            labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="total"
                                            stroke="#7C3AED"
                                            strokeWidth={4}
                                            dot={{ fill: '#7C3AED', strokeWidth: 2, r: 6, stroke: '#fff' }}
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
                                            formatter={(value) => [`${value} Transacciones`, 'Cantidad']}
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
            <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
                <CardContent className="p-0">
                    <div className="p-6 border-b border-ui-border flex items-center justify-between">
                        <h2 className="text-sm font-black text-ui-text uppercase tracking-widest">Rendimiento por Cajero</h2>
                        <div className="h-1 w-12 bg-accent-primary rounded-full" />
                    </div>
                    
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-accent-primary/10 text-[10px] uppercase tracking-[0.2em] text-accent-primary font-black">
                                    <th className="p-5 font-black">Cajero / Usuario</th>
                                    <th className="p-5 font-black text-right">Transacciones</th>
                                    <th className="p-5 font-black text-right">Ingreso Real</th>
                                    <th className="p-5 font-black text-right">Teórico Generado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ui-border/50">
                                {cashboxMetrics.length === 0 ? (
                                    <tr><td colSpan={4} className="p-12 text-center text-ui-text-muted font-bold uppercase tracking-widest text-[10px] opacity-60">Sin datos en caja.</td></tr>
                                ) : (
                                    cashboxMetrics.map(box => (
                                        <tr key={box.id} className="hover:bg-accent-primary/[0.02] transition-colors group">
                                            <td className="p-5">
                                                <div className="font-black text-ui-text uppercase tracking-tight group-hover:text-accent-primary transition-colors">{box.name}</div>
                                            </td>
                                            <td className="p-5 text-right">
                                                <span className="font-black text-ui-text-muted bg-ui-bg px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest">
                                                    {box.salesCount} tx
                                                </span>
                                            </td>
                                            <td className="p-5 text-right font-black text-accent-primary">
                                                {formatPrice(box.real)}
                                            </td>
                                            <td className="p-5 text-right font-black text-accent-secondary opacity-80">
                                                {formatPrice(box.teorico)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-ui-border/30">
                        {cashboxMetrics.length === 0 ? (
                            <div className="p-12 text-center text-ui-text-muted font-bold uppercase tracking-widest text-[10px] opacity-60">Sin datos en caja.</div>
                        ) : (
                            cashboxMetrics.map(box => (
                                <div key={box.id} className="p-5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="font-black text-ui-text uppercase tracking-tight text-sm">{box.name}</span>
                                        <span className="px-3 py-1 bg-ui-bg text-[9px] font-black uppercase tracking-[0.2em] rounded-full text-ui-text-muted">
                                            {box.salesCount} Transacciones
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 dark:bg-black/20 p-3 rounded-xl border border-ui-border/30">
                                            <p className="text-[8px] font-black text-accent-primary uppercase tracking-widest mb-1">Ingreso Real</p>
                                            <p className="text-sm font-black text-ui-text">{formatPrice(box.real)}</p>
                                        </div>
                                        <div className="bg-white/5 dark:bg-black/20 p-3 rounded-xl border border-ui-border/30">
                                            <p className="text-[8px] font-black text-accent-secondary uppercase tracking-widest mb-1">Teórico</p>
                                            <p className="text-sm font-black text-ui-text opacity-70">{formatPrice(box.teorico)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Sales History Table */}
            <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
                <CardContent className="p-0">
                    <div className="p-6 border-b border-ui-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-fuchsia-500/20 p-2 rounded-lg">
                                <FileText size={18} className="text-fuchsia-500" />
                            </div>
                            <h2 className="text-sm font-black text-ui-text uppercase tracking-widest">Historial de Transacciones</h2>
                        </div>
                        <p className="hidden sm:block text-[10px] font-black text-ui-text-muted uppercase tracking-[0.2em]">{filteredSales.length} Registros</p>
                    </div>

                    {/* Search & Filters */}
                    <div className="p-4 border-b border-ui-border flex flex-col sm:flex-row gap-3 bg-ui-bg/30">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-text-muted" />
                            <input
                                type="text"
                                placeholder="Buscar cliente, cajero o ID..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-4 py-2.5 bg-ui-bg border border-ui-border rounded-xl text-xs font-bold text-ui-text outline-none focus:border-accent-primary placeholder:text-ui-text-muted/50 uppercase tracking-wide"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as any)}
                            className="px-4 py-2.5 bg-ui-bg border border-ui-border rounded-xl text-xs font-bold text-ui-text outline-none focus:border-accent-primary uppercase tracking-wide"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="paid">Pagado</option>
                            <option value="pending">Pendiente</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                        <select
                            value={filterMethod}
                            onChange={e => setFilterMethod(e.target.value as any)}
                            className="px-4 py-2.5 bg-ui-bg border border-ui-border rounded-xl text-xs font-bold text-ui-text outline-none focus:border-accent-primary uppercase tracking-wide"
                        >
                            <option value="all">Todos los métodos</option>
                            <option value="cash">Efectivo</option>
                            <option value="transfer">Transferencia</option>
                            <option value="mobile_pay">Pago Móvil</option>
                            <option value="credit">Crédito / Fiado</option>
                        </select>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-ui-bg/50 text-[10px] uppercase tracking-[0.2em] text-ui-text-muted font-black border-b border-ui-border">
                                    <th className="p-5">Fecha / Hora</th>
                                    <th className="p-5">Cliente</th>
                                    <th className="p-5">Cajero</th>
                                    <th className="p-5 text-center">Método</th>
                                    <th className="p-5 text-right">Total</th>
                                    <th className="p-5 text-center">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ui-border/30">
                                {filteredSales.length === 0 ? (
                                    <tr><td colSpan={6} className="p-12 text-center text-ui-text-muted font-bold uppercase tracking-widest text-[10px] opacity-60">No hay ventas registradas.</td></tr>
                                ) : (
                                    displayedSales.map(sale => {
                                        const time = typeof sale.createdAt === 'number' ? sale.createdAt : (sale.createdAt as any)?.toDate?.()?.getTime() || 0;
                                        const hasPriceMod = sale.items.some(it => it.finalPrice !== it.price);
                                        
                                        return (
                                            <tr key={sale.id} className="hover:bg-accent-primary/[0.02] transition-colors group cursor-pointer" onClick={() => openSaleDetails(sale)}>
                                                <td className="p-5">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-ui-text uppercase tracking-tight text-xs">{new Date(time).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                        <span className="text-[10px] text-ui-text-muted font-bold uppercase tracking-widest">{new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="font-black text-ui-text uppercase tracking-tight text-xs">{sale.clientName || 'Cliente General'}</div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="font-bold text-ui-text-muted uppercase tracking-widest text-[10px]">{sale.creatorName || 'N/A'}</div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-ui-bg text-[9px] font-black uppercase tracking-widest border border-ui-border/50 text-ui-text-muted">
                                                        {sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'transfer' ? 'Transf.' : sale.paymentMethod === 'mobile_pay' ? 'P. Móvil' : 'Crédito'}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {hasPriceMod && (
                                                            <div className="text-accent-secondary animate-pulse" title="Precio Modificado">
                                                                <AlertCircle size={14} />
                                                            </div>
                                                        )}
                                                        <span className="font-black text-ui-text text-sm tracking-tighter">{formatPrice(sale.total)}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <button className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary hover:bg-accent-primary hover:text-white transition-all">
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-ui-border/30">
                        {filteredSales.length === 0 ? (
                            <div className="p-12 text-center text-ui-text-muted font-bold uppercase tracking-widest text-[10px] opacity-60">No hay ventas registradas.</div>
                        ) : (
                            displayedSales.map(sale => {
                                const time = typeof sale.createdAt === 'number' ? sale.createdAt : (sale.createdAt as any)?.toDate?.()?.getTime() || 0;
                                const hasPriceMod = sale.items.some(it => it.finalPrice !== it.price);
                                
                                return (
                                    <div key={sale.id} className="p-5 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer" onClick={() => openSaleDetails(sale)}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-accent-primary uppercase tracking-widest">
                                                    {new Date(time).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • {new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-sm font-black text-ui-text uppercase tracking-tight mt-0.5">{sale.clientName || 'Consumidor Final'}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-black text-ui-text tracking-tighter block">{formatPrice(sale.total)}</span>
                                                <div className="inline-flex items-center gap-1 mt-1">
                                                    {hasPriceMod && <AlertCircle size={10} className="text-accent-secondary" />}
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-ui-text-muted">
                                                        {sale.paymentMethod === 'cash' ? 'Efectivo' : sale.paymentMethod === 'transfer' ? 'Transf.' : 'P. Móvil'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t border-ui-border/20">
                                            <span className="text-[8px] font-bold text-ui-text-muted uppercase tracking-widest">Atendido por: {sale.creatorName || 'N/A'}</span>
                                            <span className="text-accent-primary font-black text-[9px] uppercase tracking-widest flex items-center gap-1">
                                                Ver Detalles <Eye size={12} />
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-ui-border flex items-center justify-between bg-ui-bg/30">
                            <span className="text-[10px] font-black text-ui-text-muted uppercase tracking-widest">
                                Pág. {currentPage} de {totalPages} — {filteredSales.length} registros
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-lg bg-ui-bg border border-ui-border text-ui-text font-black text-sm uppercase tracking-widest hover:bg-accent-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    ‹ Anterior
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum = i + 1;
                                        if (totalPages > 5) {
                                            if (currentPage <= 3) pageNum = i + 1;
                                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                            else pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-2.5 py-1.5 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${
                                                    currentPage === pageNum
                                                        ? 'bg-accent-primary text-white shadow-lg shadow-accent-primary/20'
                                                        : 'bg-ui-bg border border-ui-border text-ui-text hover:border-accent-primary'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 rounded-lg bg-ui-bg border border-ui-border text-ui-text font-black text-sm uppercase tracking-widest hover:bg-accent-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Siguiente ›
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Top Products Chart */}
            <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-black text-ui-text uppercase tracking-widest">Productos Más Vendidos</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {['day', 'week', 'month', 'all'].map(period => (
                                <button
                                    key={period}
                                    onClick={() => setProductChartPeriod(period as any)}
                                    className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                                        productChartPeriod === period
                                            ? 'bg-accent-primary text-white'
                                            : 'bg-ui-bg border border-ui-border text-ui-text hover:border-accent-primary'
                                    }`}
                                >
                                    {period === 'day' ? 'Hoy' : period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Todo'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-80">
                        {topProductsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topProductsData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 11 }}
                                        interval={0}
                                        angle={-20}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(value: any, name: string | undefined) => {
                                            if (name === 'qty') return [value, 'Cantidad'];
                                            if (name === 'revenue') return [formatPrice(value), 'Ingresos'];
                                            return [value, name || ''];
                                        }}
                                        labelFormatter={() => ''}
                                    />
                                    <Bar dataKey="qty" fill="#7C3AED" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 font-medium">No hay datos de productos vendidos</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Sale Detail Modal */}
            {isModalOpen && selectedSale && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-2xl bg-ui-surface backdrop-blur-2xl border border-ui-border rounded-[2.5rem] shadow-float overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-400">
                        {/* Header */}
                        <div className="p-8 border-b border-ui-border flex items-center justify-between bg-accent-primary/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-accent-primary flex items-center justify-center text-white shadow-lg shadow-accent-primary/30">
                                    <ShoppingCart size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-ui-text uppercase tracking-tighter leading-none">Detalle de Venta</h2>
                                    <p className="text-[10px] text-ui-text-muted font-bold uppercase tracking-[0.2em] mt-1">ID: {selectedSale.id?.substring(0, 12)}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 rounded-full bg-ui-bg border border-ui-border flex items-center justify-center text-ui-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            {/* Top Info Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-ui-bg/50 p-4 rounded-2xl border border-ui-border/50">
                                    <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Fecha</p>
                                    <p className="text-xs font-black text-ui-text uppercase">{new Date(selectedSale.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="bg-ui-bg/50 p-4 rounded-2xl border border-ui-border/50">
                                    <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Hora</p>
                                    <p className="text-xs font-black text-ui-text uppercase">{new Date(selectedSale.createdAt).toLocaleTimeString()}</p>
                                </div>
                                <div className="bg-ui-bg/50 p-4 rounded-2xl border border-ui-border/50">
                                    <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Estado</p>
                                    <div className="inline-flex items-center px-2 py-0.5 rounded-lg bg-accent-success/10 text-accent-success text-[9px] font-black uppercase tracking-widest border border-accent-success/20">
                                        {selectedSale.status === 'paid' ? 'Pagado' : selectedSale.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                                    </div>
                                </div>
                                <div className="bg-ui-bg/50 p-4 rounded-2xl border border-ui-border/50">
                                    <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Cajero</p>
                                    <p className="text-xs font-black text-ui-text uppercase tracking-tighter truncate">{selectedSale.creatorName || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Client & Payment */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-accent-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                        <UserIcon size={14} /> Información del Cliente
                                    </h3>
                                    <div className="bg-ui-bg/30 p-5 rounded-3xl border border-ui-border flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-ui-bg flex items-center justify-center text-ui-text-muted">
                                            <UserIcon size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-ui-text uppercase tracking-tight">{selectedSale.clientName || 'Consumidor Final'}</p>
                                            <p className="text-[10px] text-ui-text-muted font-bold uppercase tracking-widest">Cliente Registrado</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-accent-primary uppercase tracking-[0.2em] flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={14} /> Método de Pago
                                        </div>
                                        {(selectedSale.paymentMethod === 'transfer' || selectedSale.paymentMethod === 'mobile_pay') && !isEditingPayment && (
                                            <button 
                                                onClick={() => setIsEditingPayment(true)}
                                                className="text-[9px] font-black text-accent-primary hover:underline"
                                            >
                                                Editar Datos
                                            </button>
                                        )}
                                    </h3>
                                    <div className="bg-ui-bg/30 p-5 rounded-3xl border border-ui-border space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                                                {selectedSale.paymentMethod === 'cash' ? <Banknote size={20} /> : selectedSale.paymentMethod === 'transfer' ? <Info size={20} /> : <Wallet size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-ui-text uppercase tracking-tight">
                                                    {selectedSale.paymentMethod === 'cash' ? 'Efectivo' : selectedSale.paymentMethod === 'transfer' ? 'Transferencia' : selectedSale.paymentMethod === 'mobile_pay' ? 'Pago Móvil' : 'Crédito'}
                                                </p>
                                                {!isEditingPayment && (
                                                    <p className="text-[10px] text-ui-text-muted font-bold uppercase tracking-widest">
                                                        {selectedSale.paymentData?.bank ? `${selectedSale.paymentData.bank} - Ref: ${selectedSale.paymentData.reference}` : 'Sin datos de referencia'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {isEditingPayment && (
                                            <div className="pt-2 space-y-3 animate-in slide-in-from-top-2">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-ui-text-muted uppercase tracking-widest">Referencia</label>
                                                        <input 
                                                            className="w-full bg-ui-bg/50 border border-ui-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent-primary text-ui-text"
                                                            value={tempPaymentData.reference}
                                                            onChange={e => setTempPaymentData(prev => ({ ...prev, reference: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-ui-text-muted uppercase tracking-widest">Banco</label>
                                                        <input 
                                                            className="w-full bg-ui-bg/50 border border-ui-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent-primary text-ui-text"
                                                            value={tempPaymentData.bank}
                                                            onChange={e => setTempPaymentData(prev => ({ ...prev, bank: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="space-y-1 col-span-2">
                                                        <label className="text-[8px] font-black text-ui-text-muted uppercase tracking-widest">Fecha del Pago</label>
                                                        <input 
                                                            type="date"
                                                            className="w-full bg-ui-bg/50 border border-ui-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent-primary text-ui-text"
                                                            value={tempPaymentData.date}
                                                            onChange={e => setTempPaymentData(prev => ({ ...prev, date: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        disabled={isSavingEdit}
                                                        onClick={handleUpdatePaymentData}
                                                        className="flex-1 bg-accent-primary text-white text-[9px] font-black uppercase tracking-widest py-2 rounded-lg hover:bg-accent-primary/90 disabled:opacity-50"
                                                    >
                                                        {isSavingEdit ? 'Guardando...' : 'Guardar'}
                                                    </button>
                                                    <button 
                                                        onClick={() => setIsEditingPayment(false)}
                                                        className="px-4 bg-ui-bg text-ui-text-muted text-[9px] font-black uppercase tracking-widest py-2 rounded-lg hover:bg-ui-border"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-accent-primary uppercase tracking-[0.2em]">Productos en Orden</h3>
                                <div className="bg-ui-bg/20 rounded-[2rem] border border-ui-border overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-ui-bg/50 text-[9px] uppercase tracking-widest text-ui-text-muted font-black">
                                                <th className="p-4">Producto</th>
                                                <th className="p-4 text-center">Cant.</th>
                                                <th className="p-4 text-right">Precio Un.</th>
                                                <th className="p-4 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-ui-border/50">
                                            {selectedSale.items.map((item, idx) => {
                                                const isModified = item.finalPrice !== item.price;
                                                return (
                                                    <tr key={idx}>
                                                        <td className="p-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-ui-text uppercase tracking-tight leading-tight">{item.name}</span>
                                                                {isModified && (
                                                                    <span className="text-[8px] font-bold text-accent-secondary uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                                                        <AlertCircle size={8} /> Precio ajustado (Original: {formatPrice(item.price)})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center text-xs font-black text-ui-text">x{item.quantity}</td>
                                                        <td className="p-4 text-right text-xs font-black text-ui-text">{formatPrice(item.finalPrice)}</td>
                                                        <td className="p-4 text-right text-xs font-black text-accent-primary">{formatPrice(item.finalPrice * item.quantity)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Notes Section */}
                            {(selectedSale.notes || selectedSale.discountReason) && (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {selectedSale.notes && (
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-accent-secondary uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Info size={14} /> Notas Adicionales
                                            </h3>
                                            <div className="bg-accent-secondary/5 p-5 rounded-3xl border border-accent-secondary/20 relative">
                                                <p className="text-xs font-bold text-ui-text italic leading-relaxed">
                                                    "{selectedSale.notes}"
                                                </p>
                                                <div className="absolute top-[-8px] right-4 bg-accent-secondary text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                                    Nota del Cajero
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedSale.discountReason && (
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                                <AlertCircle size={14} /> Motivo del Ajuste
                                            </h3>
                                            <div className="bg-amber-500/5 p-5 rounded-3xl border border-amber-500/20 relative">
                                                <p className="text-xs font-bold text-ui-text italic leading-relaxed">
                                                    "{selectedSale.discountReason}"
                                                </p>
                                                <div className="absolute top-[-8px] right-4 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                                    Precio Modificado
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer - Total & Actions */}
                        <div className="p-8 bg-ui-bg/50 border-t border-ui-border space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Clock size={16} className="text-ui-text-muted" />
                                    <span className="text-[10px] font-black text-ui-text-muted uppercase tracking-[0.2em]">Resumen Final</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-[0.3em] mb-1">Total Pagado</p>
                                    <h3 className="text-4xl font-black text-ui-text tracking-tighter leading-none">{formatPrice(selectedSale.total)}</h3>
                                </div>
                            </div>

                            {/* Share Buttons */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleCopyList}
                                    className="flex-1 py-2.5 px-4 bg-ui-bg border border-ui-border rounded-xl text-ui-text hover:border-ui-text hover:bg-ui-border/50 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    title="Copiar lista de productos al portapapeles"
                                >
                                    <Copy size={16} />
                                    Copiar
                                </button>
                                <button
                                    onClick={handleGenerateImage}
                                    disabled={isGeneratingImage}
                                    className="flex-1 py-2.5 px-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-600 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    title="Generar y compartir imagen"
                                >
                                    <Camera size={16} />
                                    {isGeneratingImage ? 'Generando...' : 'Imagen'}
                                </button>
                            </div>

                            {selectedSale.status === 'pending' && !isPayingPending && (
                                <button
                                    onClick={() => setIsPayingPending(true)}
                                    className="w-full py-2.5 px-4 bg-accent-primary/10 border border-accent-primary/30 rounded-xl text-accent-primary hover:bg-accent-primary hover:text-white text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <CreditCard size={16} />
                                    Cobrar Venta
                                </button>
                            )}

                            {selectedSale.status === 'pending' && isPayingPending && (
                                <div className="space-y-3 p-4 bg-accent-primary/5 rounded-2xl border border-accent-primary/20">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest">Método de Pago</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(['cash', 'transfer', 'mobile_pay'] as const).map(method => (
                                                <button
                                                    key={method}
                                                    onClick={() => {
                                                        setPendingPayMethod(method);
                                                        setPendingPayData({ reference: '', bank: '', date: '' });
                                                    }}
                                                    className={`py-2 px-3 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${
                                                        pendingPayMethod === method
                                                            ? 'bg-accent-primary text-white'
                                                            : 'bg-ui-bg border border-ui-border text-ui-text hover:border-accent-primary'
                                                    }`}
                                                >
                                                    {method === 'cash' ? 'Efectivo' : method === 'transfer' ? 'Transferencia' : 'P. Móvil'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {(pendingPayMethod === 'transfer' || pendingPayMethod === 'mobile_pay') && (
                                        <div className="space-y-3 pt-2 border-t border-accent-primary/20">
                                            <div>
                                                <label className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest block mb-1">Referencia</label>
                                                <input
                                                    type="text"
                                                    value={pendingPayData.reference}
                                                    onChange={e => setPendingPayData(p => ({ ...p, reference: e.target.value }))}
                                                    placeholder="Número de referencia"
                                                    className="w-full bg-ui-bg/80 border border-ui-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent-primary text-ui-text placeholder:text-ui-text-muted/40"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest block mb-1">Banco</label>
                                                <input
                                                    type="text"
                                                    value={pendingPayData.bank}
                                                    onChange={e => setPendingPayData(p => ({ ...p, bank: e.target.value }))}
                                                    placeholder="Nombre del banco"
                                                    className="w-full bg-ui-bg/80 border border-ui-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent-primary text-ui-text placeholder:text-ui-text-muted/40"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest block mb-1">Fecha del Pago</label>
                                                <input
                                                    type="date"
                                                    value={pendingPayData.date}
                                                    onChange={e => setPendingPayData(p => ({ ...p, date: e.target.value }))}
                                                    className="w-full bg-ui-bg/80 border border-ui-border rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-accent-primary text-ui-text"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-2 border-t border-accent-primary/20">
                                        <button
                                            onClick={handlePayPendingSale}
                                            disabled={isProcessingPayment || !pendingPayMethod}
                                            className="flex-1 py-2 px-4 bg-accent-primary text-white font-black text-[9px] uppercase tracking-widest rounded-lg hover:shadow-lg hover:shadow-accent-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            {isProcessingPayment ? 'Procesando...' : 'Confirmar Pago'}
                                        </button>
                                        <button
                                            onClick={() => setIsPayingPending(false)}
                                            disabled={isProcessingPayment}
                                            className="py-2 px-4 bg-ui-bg border border-ui-border text-ui-text font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-ui-border disabled:opacity-50 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selectedSale.status === 'paid' && (
                                <button
                                    onClick={() => {
                                        setReturnItems({});
                                        setReturnReason('');
                                        setIsReturnModalOpen(true);
                                    }}
                                    className="w-full py-2.5 px-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-600 hover:bg-amber-500/20 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={16} />
                                    Registrar Devolución
                                </button>
                            )}
                            {selectedSale.hasReturns && (
                                <div className="py-1.5 px-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 text-[9px] font-black uppercase tracking-widest text-center">
                                    ✓ Tiene devoluciones registradas
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {isReturnModalOpen && selectedSale && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-xl bg-ui-surface backdrop-blur-2xl border border-ui-border rounded-[2.5rem] shadow-float overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-400">
                        {/* Header */}
                        <div className="p-6 border-b border-ui-border flex items-center justify-between bg-amber-500/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600">
                                    <RotateCcw size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-ui-text uppercase tracking-tighter leading-none">Registrar Devolución</h2>
                                    <p className="text-[9px] text-ui-text-muted font-bold uppercase tracking-[0.2em] mt-0.5">Selecciona los productos a devolver</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsReturnModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-ui-bg border border-ui-border flex items-center justify-center text-ui-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {/* Items Selection */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-ui-text-muted uppercase tracking-[0.2em]">Productos en la Venta</p>
                                {selectedSale.items.map((item) => {
                                    const itemKey = item.id + (item.variantId || '');
                                    const returnQty = returnItems[itemKey] || 0;
                                    return (
                                        <div key={itemKey} className="bg-ui-bg/50 p-4 rounded-xl border border-ui-border/50 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-black text-ui-text uppercase tracking-tight">{item.name}</p>
                                                    {item.variantName && (
                                                        <p className="text-[9px] text-ui-text-muted font-bold mt-0.5">Variante: {item.variantName}</p>
                                                    )}
                                                    <p className="text-[9px] text-ui-text-muted font-bold mt-1">Precio: {formatPrice(item.finalPrice)} × {item.quantity} un</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[9px] font-bold text-ui-text-muted uppercase">Cantidad a devolver:</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={item.quantity}
                                                    value={returnQty}
                                                    onChange={(e) => {
                                                        const val = Math.max(0, Math.min(item.quantity, parseInt(e.target.value) || 0));
                                                        setReturnItems(prev => ({
                                                            ...prev,
                                                            [itemKey]: val
                                                        }));
                                                    }}
                                                    className="w-16 h-8 bg-ui-bg border border-ui-border rounded-lg text-xs font-black text-ui-text text-center outline-none focus:border-accent-primary"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reason */}
                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] font-black text-ui-text-muted uppercase tracking-[0.2em]">
                                    Motivo de la Devolución <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    placeholder="Ej: Producto defectuoso, cambio de decisión, talla incorrecta..."
                                    rows={3}
                                    className="w-full bg-ui-bg border border-ui-border rounded-xl px-3 py-2 text-xs font-bold text-ui-text placeholder:text-ui-text-muted/40 outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 resize-none"
                                />
                            </div>

                            {/* Total Refund */}
                            {Object.values(returnItems).some(v => v > 0) && (
                                <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-xl p-3 space-y-1">
                                    <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-[0.2em]">Total a Devolver</p>
                                    <p className="text-lg font-black text-accent-primary tracking-tighter">
                                        {formatPrice(
                                            Object.entries(returnItems).reduce((sum, [itemKey, qty]) => {
                                                const item = selectedSale.items.find(i => i.id + (i.variantId || '') === itemKey);
                                                return sum + (item?.finalPrice || 0) * qty;
                                            }, 0)
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-ui-bg/50 border-t border-ui-border flex gap-3">
                            <button
                                onClick={() => setIsReturnModalOpen(false)}
                                className="flex-1 py-2.5 px-4 bg-ui-bg border border-ui-border rounded-xl text-ui-text-muted hover:text-ui-text text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleProcessReturn}
                                disabled={isProcessingReturn || !Object.values(returnItems).some(v => v > 0) || !returnReason.trim()}
                                className="flex-1 py-2.5 px-4 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest transition-all rounded-xl"
                            >
                                {isProcessingReturn ? 'Procesando...' : 'Confirmar Devolución'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Page() {
    return (
        <ErrorBoundary label="Reportes">
            <ReportsScreen />
        </ErrorBoundary>
    );
}

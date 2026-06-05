"use client";

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useOwnerContext } from '@/hooks/useOwnerContext';
import { useCurrency } from '@/context/CurrencyContext';

import React, { useEffect, useState, useMemo } from 'react';
import { SalesService } from '@/services/sales.service';
import { ReturnService } from '@/services/return.service';
import { UserService } from '@/services/user.service';
import { ProductService } from '@/services/product.service';
import { ExpenseService } from '@/services/expense.service';
import { LocationService } from '@/services/location.service';
import { Sale } from '@/types/sales';
import { Product } from '@/types/inventory';
import { Expense } from '@/types/expense';
import { UserMetadata } from '@/services/user.service';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { DollarSign, FileText, ShoppingCart, TrendingUp, Calendar, Filter, User as UserIcon, Download, FileJson, FileSpreadsheet, Eye, Info, AlertCircle, X, Clock, CreditCard, Wallet, Banknote, RotateCcw, Search, Copy, Camera, MessageCircle } from 'lucide-react';
import { ClientService } from '@/services/client.service';
import { generateReceiptPdf, buildWhatsAppMessage, buildWhatsAppUrl } from '@/lib/receipt';
import { can } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const COLORS = ['#7C3AED', '#C026D3', '#8B5CF6', '#D946EF', '#6366F1'];

// Sale.createdAt suele ser un número (epoch ms) pero al venir de Firestore puede
// llegar como Timestamp con un método toDate(). Este helper normaliza ambos casos.
type MaybeTimestamp = number | { toDate?: () => Date } | undefined | null;
const toMillis = (v: MaybeTimestamp): number => {
    if (typeof v === 'number') return v;
    return v?.toDate?.()?.getTime() ?? 0;
};

function ReportsScreen() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { ownerId } = useOwnerContext();
    const { formatPrice, fromUSD, currency } = useCurrency();
    
    const [loading, setLoading] = useState(true);
    const [allSales, setAllSales] = useState<Sale[]>([]);
    const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [cashiers, setCashiers] = useState<UserMetadata[]>([]);
    const [selectedCashier, setSelectedCashier] = useState<string>('all');
    const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('all');

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

    // Commissions State
    const currentMonthIso = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();
    const [commissionMonth, setCommissionMonth] = useState<string>(currentMonthIso);

    // Share buttons state
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler, { passive: true });
        return () => window.removeEventListener('resize', handler);
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [salesData, cashiersData, productsData, expensesData] = await Promise.all([
                    SalesService.getAllSales(ownerId),
                    UserService.getUsers(),
                    ProductService.getProducts(ownerId),
                    ExpenseService.getExpenses(ownerId),
                ]);
                setAllSales(salesData);
                setCashiers(cashiersData);
                setProducts(productsData);
                setExpenses(expensesData);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user && can(user.role, 'viewReports')) {
            fetchInitialData();
        }
    }, [user]);

    useEffect(() => {
        if (!ownerId) return;
        const unsub = LocationService.subscribeToLocations(ownerId, (data) => {
            setLocations(data.map(l => ({ id: l.id, name: l.name })));
        });
        return () => unsub();
    }, [ownerId]);

    useEffect(() => {
        if (!authLoading && user) {
            if (!can(user.role, 'viewReports')) {
                router.replace('/pos');
            } else if (user.role === 'admin' || user.role === 'admingod') {
                router.replace('/admin/dashboard');
            }
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        let filtered = allSales.filter(s => {
            if (selectedCashier !== 'all' && s.cashboxId !== selectedCashier && s.createdBy !== selectedCashier) return false;
            if (selectedLocation !== 'all' && (s.locationId ?? null) !== selectedLocation) return false;
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

        filtered.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        setFilteredSales(filtered);
        setCurrentPage(1);
        processStats(filtered);
    }, [allSales, selectedCashier, selectedLocation, filterStatus, filterMethod, searchQuery]);

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
            const time = toMillis(s.createdAt);
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

    const commissionsByMember = useMemo(() => {
        const [yearStr, monthStr] = commissionMonth.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        if (Number.isNaN(year) || Number.isNaN(month)) return [];
        const start = new Date(year, month, 1).getTime();
        const end = new Date(year, month + 1, 1).getTime();

        const agg: Record<string, {
            id: string;
            name: string;
            salesCount: number;
            salesTotal: number;
            commission: number;
            pctSeen: Set<number>;
        }> = {};

        allSales.forEach(s => {
            if (s.status !== 'paid') return;
            const t = toMillis(s.createdAt);
            if (t < start || t >= end) return;
            const commission = Number(s.commissionAmount) || 0;
            if (commission <= 0) return;
            const id = s.createdBy || 'unknown';
            const name = s.creatorName || cashiers.find(c => c.id === id)?.displayName || 'Sin asignar';
            if (!agg[id]) agg[id] = { id, name, salesCount: 0, salesTotal: 0, commission: 0, pctSeen: new Set() };
            agg[id].salesCount += 1;
            agg[id].salesTotal += Number(s.total) || 0;
            agg[id].commission += commission;
            if (typeof s.commissionPct === 'number' && s.commissionPct > 0) agg[id].pctSeen.add(s.commissionPct);
        });

        return Object.values(agg)
            .map(row => ({
                ...row,
                pctLabel: row.pctSeen.size === 1 ? `${[...row.pctSeen][0]}%` : (row.pctSeen.size > 1 ? 'Mixto' : '—'),
            }))
            .sort((a, b) => b.commission - a.commission);
    }, [allSales, cashiers, commissionMonth]);

    const commissionsTotal = useMemo(() => {
        return commissionsByMember.reduce((acc, r) => ({
            salesCount: acc.salesCount + r.salesCount,
            salesTotal: acc.salesTotal + r.salesTotal,
            commission: acc.commission + r.commission,
        }), { salesCount: 0, salesTotal: 0, commission: 0 });
    }, [commissionsByMember]);

    const monthOptions = useMemo(() => {
        const months: { value: string; label: string }[] = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const v = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            months.push({ value: v, label: label[0].toUpperCase() + label.slice(1) });
        }
        return months;
    }, []);

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
                    Object.entries(pendingPayData).filter(([, v]) => v)
                ) as Sale['paymentData'];
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

    const handleDownloadReceipt = () => {
        if (!selectedSale) return;
        const doc = generateReceiptPdf(selectedSale, {
            name: user?.displayName || undefined,
        });
        doc.save(`comprobante-${(selectedSale.id || 'venta').slice(0, 8)}.pdf`);
        toast.success('Comprobante descargado');
    };

    const handleSendWhatsApp = async () => {
        if (!selectedSale) return;
        let phone: string | undefined;
        if (selectedSale.clientId) {
            try {
                const client = await ClientService.getClientById(selectedSale.clientId);
                phone = client?.phone || undefined;
            } catch {
                // sin teléfono: se abre wa.me sin destinatario
            }
        }
        const msg = buildWhatsAppMessage(selectedSale, {
            name: user?.displayName || undefined,
        });
        const url = buildWhatsAppUrl(phone, msg);
        window.open(url, '_blank');
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
                const time = toMillis(sale.createdAt);
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

            // Transactions list — jspdf-autotable extiende jsPDF con lastAutoTable
            const lastY =
                (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ??
                100;
            doc.setFontSize(16);
            doc.text("Listado Detallado de Transacciones", 20, lastY + 20);
            
            autoTable(doc, {
                startY: lastY + 25,
                head: [['Fecha', 'Cajero', 'Método', 'Estado', 'Total']],
                body: filteredSales.map(s => {
                    const time = toMillis(s.createdAt);
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

    if (loading || authLoading || !user || !can(user.role, 'viewReports') || user.role === 'admin' || user.role === 'admingod') {
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
                    {locations.length > 0 && (
                        <div className="w-full sm:w-56 z-30">
                            <Select
                                options={[
                                    { value: 'all', label: 'Todas las sucursales' },
                                    ...locations.map(l => ({ value: l.id, label: l.name }))
                                ]}
                                value={selectedLocation}
                                onChange={(val) => setSelectedLocation(val)}
                                icon={<UserIcon size={16} className="text-accent-primary" />}
                            />
                        </div>
                    )}
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
                            <p className="text-[8px] md:text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] mb-1">Venta Prom.</p>
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
                                            isAnimationActive={!isMobile}
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
                                            isAnimationActive={!isMobile}
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

            {/* Comisiones Mensuales */}
            <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
                <CardContent className="p-0">
                    <div className="p-6 border-b border-ui-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-black text-ui-text uppercase tracking-widest">Comisiones del Mes</h2>
                            <p className="text-[10px] text-ui-text-muted font-bold tracking-wider mt-1">Solo ventas pagadas con comisión configurada</p>
                        </div>
                        <select
                            value={commissionMonth}
                            onChange={(e) => setCommissionMonth(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-ui-text focus:outline-none focus:border-accent-primary"
                        >
                            {monthOptions.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-accent-primary/10 text-[10px] uppercase tracking-[0.2em] text-accent-primary font-black">
                                    <th className="p-5 font-black">Miembro</th>
                                    <th className="p-5 font-black text-right">% Comisión</th>
                                    <th className="p-5 font-black text-right">Tx</th>
                                    <th className="p-5 font-black text-right">Ventas</th>
                                    <th className="p-5 font-black text-right">Comisión</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ui-border/50">
                                {commissionsByMember.length === 0 ? (
                                    <tr><td colSpan={5} className="p-12 text-center text-ui-text-muted font-bold uppercase tracking-widest text-[10px] opacity-60">Sin comisiones en este mes.</td></tr>
                                ) : (
                                    <>
                                        {commissionsByMember.map(row => (
                                            <tr key={row.id} className="hover:bg-accent-primary/[0.02] transition-colors group">
                                                <td className="p-5 font-black text-ui-text uppercase tracking-tight group-hover:text-accent-primary transition-colors">{row.name}</td>
                                                <td className="p-5 text-right text-ui-text-muted font-bold">{row.pctLabel}</td>
                                                <td className="p-5 text-right">
                                                    <span className="font-black text-ui-text-muted bg-ui-bg px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest">{row.salesCount}</span>
                                                </td>
                                                <td className="p-5 text-right font-black text-ui-text">{formatPrice(row.salesTotal)}</td>
                                                <td className="p-5 text-right font-black text-accent-primary">{formatPrice(row.commission)}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-accent-primary/5">
                                            <td className="p-5 font-black text-ui-text uppercase tracking-tight">Total</td>
                                            <td className="p-5"></td>
                                            <td className="p-5 text-right font-black text-ui-text">{commissionsTotal.salesCount}</td>
                                            <td className="p-5 text-right font-black text-ui-text">{formatPrice(commissionsTotal.salesTotal)}</td>
                                            <td className="p-5 text-right font-black text-accent-primary">{formatPrice(commissionsTotal.commission)}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile */}
                    <div className="md:hidden divide-y divide-ui-border/30">
                        {commissionsByMember.length === 0 ? (
                            <div className="p-12 text-center text-ui-text-muted font-bold uppercase tracking-widest text-[10px] opacity-60">Sin comisiones en este mes.</div>
                        ) : (
                            <>
                                {commissionsByMember.map(row => (
                                    <div key={row.id} className="p-5 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-black text-ui-text uppercase tracking-tight text-sm">{row.name}</span>
                                            <span className="px-3 py-1 bg-ui-bg text-[9px] font-black uppercase tracking-[0.2em] rounded-full text-ui-text-muted">{row.pctLabel}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-white/5 dark:bg-black/20 p-2 rounded-xl border border-ui-border/30">
                                                <p className="text-[8px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Tx</p>
                                                <p className="text-sm font-black text-ui-text">{row.salesCount}</p>
                                            </div>
                                            <div className="bg-white/5 dark:bg-black/20 p-2 rounded-xl border border-ui-border/30">
                                                <p className="text-[8px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Ventas</p>
                                                <p className="text-sm font-black text-ui-text">{formatPrice(row.salesTotal)}</p>
                                            </div>
                                            <div className="bg-white/5 dark:bg-black/20 p-2 rounded-xl border border-ui-border/30">
                                                <p className="text-[8px] font-black text-accent-primary uppercase tracking-widest mb-1">Comisión</p>
                                                <p className="text-sm font-black text-accent-primary">{formatPrice(row.commission)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-5 bg-accent-primary/5 flex justify-between items-center">
                                    <span className="font-black text-ui-text uppercase tracking-tight text-sm">Total</span>
                                    <span className="font-black text-accent-primary">{formatPrice(commissionsTotal.commission)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Margen por Categoría */}
            <MarginByCategoryCard products={products} sales={filteredSales} formatPrice={formatPrice} />

            {/* Utilidad Neta */}
            <NetProfitCard products={products} sales={filteredSales} expenses={expenses} formatPrice={formatPrice} />

            {/* Inventario Valorizado */}
            <InventoryValueCard products={products} formatPrice={formatPrice} />

            {/* Análisis ABC */}
            <ABCAnalysisCard products={products} sales={filteredSales} formatPrice={formatPrice} />

            {/* Rotación de Inventario */}
            <InventoryTurnoverCard products={products} sales={filteredSales} />

            {/* Frecuentemente Comprados Juntos */}
            <FrequentlyBoughtTogetherCard sales={filteredSales} />

            {/* Sugerencia de Reorden */}
            <ReorderSuggestionCard products={products} sales={filteredSales} formatPrice={formatPrice} />

            {/* Efectividad de Promociones */}
            <PromotionEffectivenessCard sales={filteredSales} formatPrice={formatPrice} />

            {/* Comparativo por Sucursal */}
            <LocationComparisonCard sales={allSales} locations={locations} formatPrice={formatPrice} />

            {/* Top Products Chart */}
            <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
                <CardContent className="p-4 md:p-6">
                    <div className="space-y-4 mb-6">
                        <h2 className="text-xs md:text-sm font-black text-ui-text uppercase tracking-widest">
                          Productos Más Vendidos
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {(['day', 'week', 'month', 'all'] as const).map(period => (
                                <button
                                    key={period}
                                    onClick={() => setProductChartPeriod(period)}
                                    className={`flex-1 md:flex-initial px-2.5 md:px-3 py-1.5 rounded-lg font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${
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
                    <div style={{ height: Math.max(250, topProductsData.length * 45) }} className="w-full transition-all duration-500">
                        {topProductsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={topProductsData}
                                    layout="vertical"
                                    margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.8} />
                                            <stop offset="100%" stopColor="#C026D3" stopOpacity={1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" opacity={0.1} />
                                    <XAxis 
                                        type="number" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#6B7280', fontSize: 10, fontWeight: 600 }}
                                    />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        width={window.innerWidth < 768 ? 90 : 140}
                                        tick={(props) => {
                                            const { x, y, payload } = props;
                                            const name = payload.value;
                                            const maxLength = window.innerWidth < 768 ? 14 : 22;
                                            const displayName = name.length > maxLength ? name.substring(0, maxLength) + '...' : name;
                                            return (
                                                <g transform={`translate(${x},${y})`}>
                                                    <text
                                                        x={-10}
                                                        y={0}
                                                        dy={4}
                                                        textAnchor="end"
                                                        fill="#9CA3AF"
                                                        fontSize={window.innerWidth < 768 ? 9 : 10}
                                                        fontWeight="800"
                                                        className="uppercase tracking-tight"
                                                    >
                                                        {displayName}
                                                    </text>
                                                </g>
                                            );
                                        }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(124, 58, 237, 0.1)' }}
                                        contentStyle={{ 
                                            borderRadius: '16px', 
                                            border: '1px solid rgba(255, 255, 255, 0.1)', 
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                                            background: '#0f172a',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ color: '#F3F4F6', fontWeight: 'bold', fontSize: '12px' }}
                                        labelStyle={{ color: '#9CA3AF', fontWeight: '900', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.1em' }}
                                        formatter={((value: any, name: any) => {
                                            if (name === 'qty') return [value, 'Cantidad'];
                                            if (name === 'revenue') return [formatPrice(value), 'Total'];
                                            return [value, name != null ? String(name) : ''];
                                        }) as any}
                                    />
                                    <Bar
                                        dataKey="qty"
                                        fill="url(#barGradient)"
                                        radius={[0, 6, 6, 0]}
                                        barSize={window.innerWidth < 768 ? 16 : 24}
                                        isAnimationActive={!isMobile}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-[10px] opacity-60">No hay datos de productos vendidos</div>
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
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleCopyList}
                                    className="py-2.5 px-3 bg-ui-bg border border-ui-border rounded-xl text-ui-text hover:border-ui-text hover:bg-ui-border/50 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    title="Copiar lista de productos al portapapeles"
                                >
                                    <Copy size={16} />
                                    Copiar
                                </button>
                                <button
                                    onClick={handleGenerateImage}
                                    disabled={isGeneratingImage}
                                    className="py-2.5 px-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-600 hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    title="Generar y compartir imagen"
                                >
                                    <Camera size={16} />
                                    {isGeneratingImage ? 'Generando...' : 'Imagen'}
                                </button>
                                <button
                                    onClick={handleDownloadReceipt}
                                    className="py-2.5 px-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-600 hover:bg-blue-500/20 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    title="Descargar comprobante en PDF"
                                >
                                    <Download size={16} />
                                    PDF
                                </button>
                                <button
                                    onClick={handleSendWhatsApp}
                                    className="py-2.5 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 hover:bg-emerald-500/20 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    title="Enviar por WhatsApp"
                                >
                                    <MessageCircle size={16} />
                                    WhatsApp
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

function MarginByCategoryCard({
    products,
    sales,
    formatPrice,
}: {
    products: Product[];
    sales: Sale[];
    formatPrice: (n: number) => string;
}) {
    const data = useMemo(() => {
        const productById = new Map(products.map(p => [p.id, p]));
        const byCategory = new Map<string, { revenue: number; cost: number; units: number }>();
        for (const sale of sales) {
            if (sale.status === 'cancelled') continue;
            for (const item of sale.items || []) {
                const product = productById.get(item.id);
                const category = product?.category || item.category || 'Sin categoría';
                const cost = product?.costPrice;
                if (cost == null || cost <= 0) continue;
                const entry = byCategory.get(category) ?? { revenue: 0, cost: 0, units: 0 };
                const unitPrice = item.finalPrice ?? item.price ?? 0;
                entry.revenue += unitPrice * item.quantity;
                entry.cost += cost * item.quantity;
                entry.units += item.quantity;
                byCategory.set(category, entry);
            }
        }
        return Array.from(byCategory.entries())
            .map(([category, v]) => ({
                category,
                revenue: v.revenue,
                cost: v.cost,
                margin: v.revenue - v.cost,
                marginPct: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue) * 100 : 0,
                units: v.units,
            }))
            .sort((a, b) => b.margin - a.margin);
    }, [products, sales]);

    const totalMargin = data.reduce((s, d) => s + d.margin, 0);
    const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
            <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs md:text-sm font-black text-ui-text uppercase tracking-widest">
                        Margen por Categoría
                    </h2>
                    {totalRevenue > 0 && (
                        <div className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">
                            Margen total:{' '}
                            <span className={totalMargin >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                                {formatPrice(totalMargin)} ({((totalMargin / totalRevenue) * 100).toFixed(1)}%)
                            </span>
                        </div>
                    )}
                </div>
                {data.length === 0 ? (
                    <p className="text-xs text-ui-text-muted py-8 text-center">
                        Sin datos de margen. Define el costo de tus productos en Inventario para ver esta métrica.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {data.map(d => (
                            <div key={d.category} className="p-3 rounded-xl border border-ui-border/30 bg-ui-bg/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-black uppercase tracking-tight text-ui-text">{d.category}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-ui-text-muted">
                                        {d.units} und.
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-[10px] font-black uppercase tracking-widest">
                                    <div>
                                        <p className="text-ui-text-muted mb-1">Ingreso</p>
                                        <p className="text-ui-text">{formatPrice(d.revenue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-ui-text-muted mb-1">Costo</p>
                                        <p className="text-ui-text-muted">{formatPrice(d.cost)}</p>
                                    </div>
                                    <div>
                                        <p className="text-ui-text-muted mb-1">Margen</p>
                                        <p className={d.margin >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                                            {formatPrice(d.margin)} ({d.marginPct.toFixed(1)}%)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function NetProfitCard({
    products,
    sales,
    expenses,
    formatPrice,
}: {
    products: Product[];
    sales: Sale[];
    expenses: Expense[];
    formatPrice: (n: number) => string;
}) {
    const data = useMemo(() => {
        const productById = new Map(products.map(p => [p.id, p]));
        let revenue = 0;
        let cost = 0;
        let costCovered = 0; // suma de revenue solo de items con costo definido
        for (const sale of sales) {
            if (sale.status === 'cancelled') continue;
            revenue += sale.total;
            for (const item of sale.items || []) {
                const product = productById.get(item.id);
                if (product?.costPrice && product.costPrice > 0) {
                    cost += product.costPrice * item.quantity;
                    costCovered += (item.finalPrice ?? item.price ?? 0) * item.quantity;
                }
            }
        }
        // Si el rango de fechas no se filtra para expenses, usamos las fechas de sales
        let totalExpenses = 0;
        if (sales.length > 0) {
            const times = sales.map(s => toMillis(s.createdAt)).filter(t => t > 0);
            if (times.length > 0) {
                const min = Math.min(...times);
                const max = Math.max(...times);
                totalExpenses = expenses
                    .filter(e => e.paidAt >= min && e.paidAt <= max)
                    .reduce((s, e) => s + e.amount, 0);
            } else {
                totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
            }
        } else {
            totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
        }
        return {
            revenue,
            cost,
            costCovered,
            grossProfit: revenue - cost,
            expenses: totalExpenses,
            netProfit: revenue - cost - totalExpenses,
        };
    }, [products, sales, expenses]);

    const hasCostData = data.cost > 0;
    const coveragePct = data.revenue > 0 ? (data.costCovered / data.revenue) * 100 : 0;

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
            <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs md:text-sm font-black text-ui-text uppercase tracking-widest">
                        Utilidad Neta
                    </h2>
                    {hasCostData && coveragePct < 100 && (
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                            Cobertura de costo: {coveragePct.toFixed(0)}%
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Ingresos</p>
                        <p className="text-base font-black text-emerald-600">{formatPrice(data.revenue)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-ui-bg/60 border border-ui-border/50">
                        <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Costo Productos</p>
                        <p className="text-base font-black text-ui-text">{formatPrice(data.cost)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                        <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Gastos</p>
                        <p className="text-base font-black text-red-500">{formatPrice(data.expenses)}</p>
                    </div>
                    <div className={`p-3 rounded-xl border ${data.netProfit >= 0 ? 'bg-accent-primary/10 border-accent-primary/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${data.netProfit >= 0 ? 'text-accent-primary' : 'text-red-500'}`}>
                            Utilidad Neta
                        </p>
                        <p className={`text-base font-black ${data.netProfit >= 0 ? 'text-accent-primary' : 'text-red-500'}`}>
                            {formatPrice(data.netProfit)}
                        </p>
                    </div>
                </div>

                <p className="text-[9px] font-black uppercase tracking-widest text-ui-text-muted/70">
                    Fórmula: Ingresos − Costo de productos vendidos − Gastos operativos.
                    {!hasCostData && ' Define costos en Inventario para una utilidad más precisa.'}
                </p>
            </CardContent>
        </Card>
    );
}

function InventoryValueCard({ products, formatPrice }: { products: Product[]; formatPrice: (n: number) => string; }) {
    const data = useMemo(() => {
        let totalUnits = 0;
        let costValue = 0;
        let saleValue = 0;
        let costCoveredUnits = 0;
        let productsWithCost = 0;
        let productsWithoutCost = 0;
        for (const p of products) {
            if (p.active === false || p.deletedAt) continue;
            const rootStock = Number(p.stock) || 0;
            const variantStock = (p.variants || []).reduce((s, v) => s + (Number(v.stock) || 0), 0);
            const stock = rootStock + variantStock;
            totalUnits += stock;
            saleValue += stock * (Number(p.price) || 0);
            if (typeof p.costPrice === 'number' && p.costPrice > 0) {
                costValue += stock * p.costPrice;
                costCoveredUnits += stock;
                productsWithCost += 1;
            } else {
                productsWithoutCost += 1;
            }
        }
        const coveragePct = totalUnits > 0 ? (costCoveredUnits / totalUnits) * 100 : 0;
        return { totalUnits, costValue, saleValue, coveragePct, productsWithCost, productsWithoutCost };
    }, [products]);

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
            <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs md:text-sm font-black text-ui-text uppercase tracking-widest">Inventario Valorizado</h2>
                    {data.coveragePct < 100 && (
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                            Cobertura de costo: {data.coveragePct.toFixed(0)}%
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-accent-primary/5 border border-accent-primary/20">
                        <p className="text-[9px] font-black text-accent-primary uppercase tracking-widest mb-1">Unidades en stock</p>
                        <p className="text-lg font-black text-accent-primary">{data.totalUnits.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-ui-bg/60 border border-ui-border/50">
                        <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Valor al costo</p>
                        <p className="text-lg font-black text-ui-text">{formatPrice(data.costValue)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Valor a precio venta</p>
                        <p className="text-lg font-black text-emerald-600">{formatPrice(data.saleValue)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-ui-bg/60 border border-ui-border/50">
                        <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Margen latente</p>
                        <p className="text-lg font-black text-ui-text">{formatPrice(data.saleValue - data.costValue)}</p>
                    </div>
                </div>
                {data.productsWithoutCost > 0 && (
                    <p className="text-[10px] text-ui-text-muted mt-3 font-bold">
                        {data.productsWithoutCost} producto{data.productsWithoutCost === 1 ? '' : 's'} sin costo definido — define el costo en Inventario para mejorar la precisión.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function ABCAnalysisCard({ products, sales, formatPrice }: { products: Product[]; sales: Sale[]; formatPrice: (n: number) => string; }) {
    const data = useMemo(() => {
        const productById = new Map(products.map(p => [p.id, p]));
        const revenueByProduct = new Map<string, { name: string; revenue: number; units: number }>();
        for (const sale of sales) {
            if (sale.status === 'cancelled') continue;
            for (const item of sale.items || []) {
                const key = item.id;
                const product = productById.get(key);
                const name = product?.name || item.name || 'Sin nombre';
                const lineRevenue = (item.finalPrice ?? item.price ?? 0) * item.quantity;
                const entry = revenueByProduct.get(key) ?? { name, revenue: 0, units: 0 };
                entry.revenue += lineRevenue;
                entry.units += item.quantity;
                revenueByProduct.set(key, entry);
            }
        }
        const rows = Array.from(revenueByProduct.entries())
            .map(([id, v]) => ({ id, ...v }))
            .sort((a, b) => b.revenue - a.revenue);
        const total = rows.reduce((s, r) => s + r.revenue, 0);
        let cumulative = 0;
        const classified = rows.map(r => {
            cumulative += r.revenue;
            const cumPct = total > 0 ? (cumulative / total) * 100 : 0;
            const sharePct = total > 0 ? (r.revenue / total) * 100 : 0;
            const klass: 'A' | 'B' | 'C' = cumPct <= 80 ? 'A' : cumPct <= 95 ? 'B' : 'C';
            return { ...r, cumPct, sharePct, klass };
        });
        const summary = { A: 0, B: 0, C: 0 } as Record<'A' | 'B' | 'C', number>;
        const counts = { A: 0, B: 0, C: 0 } as Record<'A' | 'B' | 'C', number>;
        classified.forEach(r => {
            summary[r.klass] += r.revenue;
            counts[r.klass] += 1;
        });
        return { rows: classified, total, summary, counts };
    }, [products, sales]);

    const KLASS_COLOR = { A: 'bg-emerald-500/15 text-emerald-600', B: 'bg-amber-500/15 text-amber-600', C: 'bg-red-500/15 text-red-600' };

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
            <CardContent className="p-4 md:p-6">
                <div className="mb-4">
                    <h2 className="text-xs md:text-sm font-black text-ui-text uppercase tracking-widest">Análisis ABC</h2>
                    <p className="text-[10px] text-ui-text-muted font-bold tracking-wider mt-1">A = 80% ingreso · B = 95% · C = resto</p>
                </div>
                {data.rows.length === 0 ? (
                    <p className="text-xs text-ui-text-muted py-8 text-center">Sin ventas en el período seleccionado.</p>
                ) : (
                    <>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {(['A', 'B', 'C'] as const).map(k => (
                                <div key={k} className={`p-3 rounded-xl ${KLASS_COLOR[k]} border border-current/20`}>
                                    <p className="text-[9px] font-black uppercase tracking-widest mb-1">Clase {k}</p>
                                    <p className="text-base font-black">{data.counts[k]} prod.</p>
                                    <p className="text-[10px] font-bold opacity-80">{formatPrice(data.summary[k])}</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                            {data.rows.slice(0, 30).map(r => (
                                <div key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-ui-bg/40 border border-ui-border/30">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${KLASS_COLOR[r.klass]}`}>{r.klass}</span>
                                        <span className="text-xs font-bold text-ui-text truncate">{r.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-ui-text-muted">{r.units} u</span>
                                        <span className="text-ui-text">{formatPrice(r.revenue)}</span>
                                        <span className="text-ui-text-muted w-12 text-right">{r.sharePct.toFixed(1)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {data.rows.length > 30 && (
                            <p className="text-[10px] text-ui-text-muted mt-3 font-bold text-center">Mostrando top 30 de {data.rows.length}</p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function InventoryTurnoverCard({ products, sales }: { products: Product[]; sales: Sale[]; }) {
    const data = useMemo(() => {
        const productById = new Map(products.map(p => [p.id, p]));
        const unitsSold = new Map<string, number>();
        for (const sale of sales) {
            if (sale.status === 'cancelled') continue;
            for (const item of sale.items || []) {
                unitsSold.set(item.id, (unitsSold.get(item.id) || 0) + item.quantity);
            }
        }
        const times = sales.map(s => toMillis(s.createdAt)).filter(t => t > 0);
        const periodDays = times.length > 0
            ? Math.max(1, Math.ceil((Math.max(...times) - Math.min(...times)) / 86400000) + 1)
            : 30;

        const rows: { id: string; name: string; sold: number; stock: number; turnover: number; daysOfCover: number }[] = [];
        for (const p of products) {
            if (p.active === false || p.deletedAt) continue;
            const rootStock = Number(p.stock) || 0;
            const variantStock = (p.variants || []).reduce((s, v) => s + (Number(v.stock) || 0), 0);
            const stock = rootStock + variantStock;
            const sold = unitsSold.get(p.id) || 0;
            const avgDaily = sold / periodDays;
            const turnover = stock > 0 ? sold / stock : (sold > 0 ? Infinity : 0);
            const daysOfCover = avgDaily > 0 ? stock / avgDaily : Infinity;
            if (sold > 0 || stock > 0) {
                rows.push({ id: p.id, name: p.name, sold, stock, turnover, daysOfCover });
            }
        }
        rows.sort((a, b) => b.turnover - a.turnover);
        return { rows, periodDays };
    }, [products, sales]);

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
            <CardContent className="p-4 md:p-6">
                <div className="mb-4">
                    <h2 className="text-xs md:text-sm font-black text-ui-text uppercase tracking-widest">Rotación de Inventario</h2>
                    <p className="text-[10px] text-ui-text-muted font-bold tracking-wider mt-1">
                        Período: {data.periodDays} día{data.periodDays === 1 ? '' : 's'} · Rotación = unidades vendidas / stock actual
                    </p>
                </div>
                {data.rows.length === 0 ? (
                    <p className="text-xs text-ui-text-muted py-8 text-center">Sin movimientos para calcular rotación.</p>
                ) : (
                    <div className="space-y-1 max-h-72 overflow-y-auto">
                        {data.rows.slice(0, 30).map(r => {
                            const isHot = r.turnover >= 1;
                            const isStale = r.turnover === 0 && r.stock > 0;
                            const cover = Number.isFinite(r.daysOfCover) ? `${r.daysOfCover.toFixed(0)}d` : '∞';
                            const turnoverLabel = Number.isFinite(r.turnover) ? r.turnover.toFixed(2) : '∞';
                            return (
                                <div key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-ui-bg/40 border border-ui-border/30">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isHot ? 'bg-emerald-500' : isStale ? 'bg-red-500' : 'bg-amber-500'}`} />
                                        <span className="text-xs font-bold text-ui-text truncate">{r.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-ui-text-muted">Vend: {r.sold}</span>
                                        <span className="text-ui-text-muted">Stock: {r.stock}</span>
                                        <span className="text-ui-text">Rot: {turnoverLabel}</span>
                                        <span className="text-ui-text-muted w-12 text-right">{cover}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function FrequentlyBoughtTogetherCard({ sales }: { sales: Sale[]; }) {
    const data = useMemo(() => {
        const pairs = new Map<string, { a: string; b: string; count: number; aName: string; bName: string }>();
        const singles = new Map<string, number>();
        for (const sale of sales) {
            if (sale.status === 'cancelled') continue;
            const items = sale.items || [];
            const uniqueIds = new Map<string, string>();
            for (const it of items) {
                if (!uniqueIds.has(it.id)) uniqueIds.set(it.id, it.name);
            }
            const ids = Array.from(uniqueIds.keys());
            ids.forEach(id => singles.set(id, (singles.get(id) || 0) + 1));
            for (let i = 0; i < ids.length; i++) {
                for (let j = i + 1; j < ids.length; j++) {
                    const [a, b] = ids[i] < ids[j] ? [ids[i], ids[j]] : [ids[j], ids[i]];
                    const key = `${a}|${b}`;
                    const existing = pairs.get(key);
                    if (existing) existing.count += 1;
                    else pairs.set(key, { a, b, count: 1, aName: uniqueIds.get(a)!, bName: uniqueIds.get(b)! });
                }
            }
        }
        return Array.from(pairs.values())
            .filter(p => p.count >= 2)
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);
    }, [sales]);

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
            <CardContent className="p-4 md:p-6">
                <div className="mb-4">
                    <h2 className="text-xs md:text-sm font-black text-ui-text uppercase tracking-widest">Comprados Juntos</h2>
                    <p className="text-[10px] text-ui-text-muted font-bold tracking-wider mt-1">Top pares con ≥2 co-ocurrencias en la misma venta</p>
                </div>
                {data.length === 0 ? (
                    <p className="text-xs text-ui-text-muted py-8 text-center">No hay suficientes ventas multi-producto para detectar patrones.</p>
                ) : (
                    <div className="space-y-2">
                        {data.map((p, i) => (
                            <div key={`${p.a}-${p.b}`} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-ui-bg/40 border border-ui-border/30">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[10px] font-black text-ui-text-muted bg-ui-bg w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-ui-text truncate">{p.aName}</p>
                                        <p className="text-[10px] font-bold text-ui-text-muted truncate">+ {p.bName}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-accent-primary bg-accent-primary/10 px-3 py-1.5 rounded-lg uppercase tracking-widest flex-shrink-0">
                                    {p.count}×
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ReorderSuggestionCard({ products, sales, formatPrice }: { products: Product[]; sales: Sale[]; formatPrice: (n: number) => string; }) {
    const data = useMemo(() => {
        const unitsSold = new Map<string, number>();
        for (const sale of sales) {
            if (sale.status === 'cancelled') continue;
            for (const item of sale.items || []) {
                unitsSold.set(item.id, (unitsSold.get(item.id) || 0) + item.quantity);
            }
        }
        const times = sales.map(s => toMillis(s.createdAt)).filter(t => t > 0);
        const periodDays = times.length > 0
            ? Math.max(1, Math.ceil((Math.max(...times) - Math.min(...times)) / 86400000) + 1)
            : 30;

        const rows: { id: string; name: string; stock: number; avgDaily: number; daysOfCover: number; suggestedQty: number; cost: number }[] = [];
        for (const p of products) {
            if (p.active === false || p.deletedAt) continue;
            const rootStock = Number(p.stock) || 0;
            const variantStock = (p.variants || []).reduce((s, v) => s + (Number(v.stock) || 0), 0);
            const stock = rootStock + variantStock;
            const sold = unitsSold.get(p.id) || 0;
            if (sold === 0) continue;
            const avgDaily = sold / periodDays;
            const daysOfCover = avgDaily > 0 ? stock / avgDaily : Infinity;
            if (daysOfCover > 14) continue;
            const suggestedQty = Math.max(1, Math.ceil(avgDaily * 30 - stock));
            rows.push({ id: p.id, name: p.name, stock, avgDaily, daysOfCover, suggestedQty, cost: p.costPrice || 0 });
        }
        rows.sort((a, b) => a.daysOfCover - b.daysOfCover);
        const totalCost = rows.reduce((s, r) => s + r.suggestedQty * r.cost, 0);
        return { rows, periodDays, totalCost };
    }, [products, sales]);

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
            <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xs md:text-sm font-black text-ui-text uppercase tracking-widest">Sugerencia de Reorden</h2>
                        <p className="text-[10px] text-ui-text-muted font-bold tracking-wider mt-1">
                            Stock con cobertura ≤14 días al ritmo actual · proyectado a 30 días
                        </p>
                    </div>
                    {data.totalCost > 0 && (
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-ui-text-muted">Costo estimado</p>
                            <p className="text-sm font-black text-accent-primary">{formatPrice(data.totalCost)}</p>
                        </div>
                    )}
                </div>
                {data.rows.length === 0 ? (
                    <p className="text-xs text-ui-text-muted py-8 text-center">Sin productos urgentes para reordenar.</p>
                ) : (
                    <div className="space-y-1 max-h-72 overflow-y-auto">
                        {data.rows.map(r => {
                            const isCritical = r.daysOfCover <= 3;
                            const cover = Number.isFinite(r.daysOfCover) ? `${r.daysOfCover.toFixed(0)}d` : '—';
                            return (
                                <div key={r.id} className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border ${isCritical ? 'bg-red-500/5 border-red-500/30' : 'bg-amber-500/5 border-amber-500/30'}`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`} />
                                        <span className="text-xs font-bold text-ui-text truncate">{r.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0 text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-ui-text-muted">Stock: {r.stock}</span>
                                        <span className={isCritical ? 'text-red-500' : 'text-amber-600'}>Cobertura: {cover}</span>
                                        <span className="text-accent-primary">Pedir: {r.suggestedQty}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function PromotionEffectivenessCard({ sales, formatPrice }: { sales: Sale[]; formatPrice: (n: number) => string; }) {
    const data = useMemo(() => {
        const promos = new Map<string, { name: string; uses: number; savings: number; type: string }>();
        let totalSavings = 0;
        let totalSalesWithPromo = 0;
        for (const s of sales) {
            if (s.status === 'cancelled') continue;
            if (!s.appliedPromotions || s.appliedPromotions.length === 0) continue;
            totalSalesWithPromo += 1;
            totalSavings += s.promotionSavings || 0;
            for (const ap of s.appliedPromotions) {
                const key = ap.promotionId || `coupon:${ap.couponCode}` || ap.name;
                const entry = promos.get(key) ?? { name: ap.name, uses: 0, savings: 0, type: String(ap.type) };
                entry.uses += 1;
                entry.savings += ap.amount;
                promos.set(key, entry);
            }
        }
        return {
            rows: Array.from(promos.values()).sort((a, b) => b.savings - a.savings),
            totalSavings,
            totalSalesWithPromo,
        };
    }, [sales]);

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
            <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xs md:text-sm font-black text-ui-text uppercase tracking-widest">Efectividad de Promociones</h2>
                        <p className="text-[10px] text-ui-text-muted font-bold tracking-wider mt-1">
                            {data.totalSalesWithPromo} venta{data.totalSalesWithPromo === 1 ? '' : 's'} con descuento aplicado
                        </p>
                    </div>
                    {data.totalSavings > 0 && (
                        <div className="text-right">
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Ahorro entregado</p>
                            <p className="text-sm font-black text-emerald-600">{formatPrice(data.totalSavings)}</p>
                        </div>
                    )}
                </div>
                {data.rows.length === 0 ? (
                    <p className="text-xs text-ui-text-muted py-8 text-center">Sin promociones aplicadas en este período.</p>
                ) : (
                    <div className="space-y-1">
                        {data.rows.map((r, i) => (
                            <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-ui-bg/40 border border-ui-border/30">
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-ui-text truncate">{r.name}</p>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-ui-text-muted mt-0.5">{r.type}</p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0 text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-ui-text-muted">{r.uses} uso{r.uses === 1 ? '' : 's'}</span>
                                    <span className="text-emerald-600">{formatPrice(r.savings)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function LocationComparisonCard({ sales, locations, formatPrice }: {
    sales: Sale[];
    locations: { id: string; name: string }[];
    formatPrice: (n: number) => string;
}) {
    const data = useMemo(() => {
        if (locations.length === 0) return [];
        const map = new Map<string, { id: string; name: string; revenue: number; pending: number; count: number; lastSaleAt: number }>();
        for (const l of locations) {
            map.set(l.id, { id: l.id, name: l.name, revenue: 0, pending: 0, count: 0, lastSaleAt: 0 });
        }
        const unassigned = { id: '__none', name: 'Sin sucursal', revenue: 0, pending: 0, count: 0, lastSaleAt: 0 };
        for (const s of sales) {
            if (s.status === 'cancelled') continue;
            const bucket = s.locationId ? (map.get(s.locationId) ?? unassigned) : unassigned;
            const t = toMillis(s.createdAt);
            if (s.status === 'paid') bucket.revenue += s.total || 0;
            else if (s.status === 'pending') bucket.pending += s.total || 0;
            bucket.count += 1;
            if (t > bucket.lastSaleAt) bucket.lastSaleAt = t;
        }
        const rows = Array.from(map.values());
        if (unassigned.count > 0) rows.push(unassigned);
        return rows.sort((a, b) => b.revenue - a.revenue);
    }, [sales, locations]);

    const totalRevenue = data.reduce((s, r) => s + r.revenue, 0);

    if (locations.length === 0) return null;

    return (
        <Card className="overflow-hidden border-0 shadow-xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
            <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xs md:text-sm font-black text-ui-text uppercase tracking-widest">Comparativo por Sucursal</h2>
                        <p className="text-[10px] text-ui-text-muted font-bold tracking-wider mt-1">Considera todas las ventas (no afectado por filtros activos)</p>
                    </div>
                </div>
                <div className="space-y-2">
                    {data.map(row => {
                        const share = totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0;
                        return (
                            <div key={row.id} className="p-3 rounded-xl border border-ui-border/30 bg-ui-bg/30 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-black text-sm text-ui-text uppercase tracking-tight truncate">{row.name}</span>
                                    <span className="text-[10px] font-black text-accent-primary uppercase tracking-widest">
                                        {share.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-[10px] font-black uppercase tracking-widest">
                                    <div>
                                        <p className="text-ui-text-muted mb-0.5">Ingreso</p>
                                        <p className="text-ui-text">{formatPrice(row.revenue)}</p>
                                    </div>
                                    <div>
                                        <p className="text-ui-text-muted mb-0.5">Por cobrar</p>
                                        <p className="text-amber-600">{formatPrice(row.pending)}</p>
                                    </div>
                                    <div>
                                        <p className="text-ui-text-muted mb-0.5">Ventas</p>
                                        <p className="text-ui-text">{row.count}</p>
                                    </div>
                                </div>
                                <div className="h-1.5 bg-ui-bg rounded-full overflow-hidden">
                                    <div className="h-full bg-accent-primary" style={{ width: `${share}%` }} />
                                </div>
                                {row.lastSaleAt > 0 && (
                                    <p className="text-[9px] font-bold text-ui-text-muted">
                                        Última venta: {new Date(row.lastSaleAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export default function Page() {
    return (
        <ErrorBoundary label="Reportes">
            <ReportsScreen />
        </ErrorBoundary>
    );
}

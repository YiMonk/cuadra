"use client";

import React, { useEffect, useState } from 'react';
import { SalesService } from '@/services/sales.service';
import { ClientService } from '@/services/client.service';
import { Search, Clock, FileText, MessageCircle, DollarSign, X, Camera, LayoutList } from 'lucide-react';
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
    const [reminderModal, setReminderModal] = useState<{client: any, debt: number, sales: any[]} | null>(null);
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

    const [isGeneratingImage, setIsGeneratingImage] = useState(false);

    const handleRemindClick = (client: any, debt: number, sales: any[]) => {
        setReminderModal({ client, debt, sales });
    };

    const { exchangeRate } = useCurrency();

    const shareAsImage = async (includeDetails: boolean = true) => {
        if (!reminderModal) return;
        setIsGeneratingImage(true);
        
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const loadImage = (src: string): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = src;
                });
            };

            const logo = await loadImage('/Logotipo.svg').catch(() => null);

            const allItems: any[] = [];
            if (includeDetails) {
                reminderModal.sales.forEach((s: any) => allItems.push(...s.items));
            }

            const itemLineHeight = 35;
            const detailHeight = includeDetails ? allItems.length * itemLineHeight : 0;
            const baseHeight = includeDetails ? 500 : 450;
            const totalHeight = Math.max(includeDetails ? 600 : 450, baseHeight + detailHeight);

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

            if (logo) {
                const logoWidth = 220;
                const logoHeight = (logoWidth * logo.height) / logo.width;
                ctx.save();
                ctx.filter = 'brightness(0) invert(1)';
                ctx.drawImage(logo, 200 - logoWidth / 2, 45, logoWidth, logoHeight);
                ctx.restore();
                ctx.fillStyle = '#7C3AED';
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('SISTEMA DE GESTIÓN', 200, 55 + logoHeight);
            }

            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('ESTADO DE CUENTA PARA:', 45, 145);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 20px Inter, sans-serif';
            ctx.fillText(reminderModal.client.name.toUpperCase(), 45, 170);

            let currentY = 195;

            if (includeDetails && allItems.length > 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.font = 'black 10px Inter, sans-serif';
                ctx.fillText('DETALLE DE PRODUCTOS', 45, 205);
                
                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(45, 215); ctx.lineTo(355, 215); ctx.stroke();

                currentY = 240;
                allItems.forEach((item) => {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Inter, sans-serif';
                    const nameText = `${item.quantity}x ${item.name.substring(0, 24)}${item.name.length > 24 ? '...' : ''}`;
                    ctx.fillText(nameText, 45, currentY);
                    
                    ctx.textAlign = 'right';
                    ctx.fillText(formatPrice(item.finalPrice || item.price), 355, currentY);
                    ctx.textAlign = 'left';

                    if (item.discountApplied) {
                        currentY += 15;
                        ctx.fillStyle = '#C026D3';
                        ctx.font = 'italic 10px Inter, sans-serif';
                        ctx.fillText(`└─ ${item.discountApplied}`, 55, currentY);
                    }
                    currentY += itemLineHeight;
                });
                currentY += 20;
            }

            const summaryY = Math.max(currentY, totalHeight - 180);
            ctx.strokeStyle = '#7C3AED';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(45, summaryY); ctx.lineTo(355, summaryY); ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 36px Inter, sans-serif';
            ctx.fillText(`Total: ${formatPrice(reminderModal.debt)}`, 45, summaryY + 50);

            const vesY = summaryY + 85;
            ctx.fillStyle = '#C026D3';
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.fillText(`Bs. ${(reminderModal.debt * exchangeRate).toLocaleString('es-VE')}`, 45, vesY);
            
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 10px Inter, sans-serif';
            ctx.fillText(`TASA BCV: Bs. ${exchangeRate.toFixed(2)}`, 45, vesY + 20);

            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.textAlign = 'center';
            ctx.font = '900 10px Inter, sans-serif';
            ctx.fillText('cuadrave.vercel.app', 200, totalHeight - 40);

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], 'cobro-cuadra.png', { type: 'image/png' });
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: 'Cobro Cuadra', text: `Hola ${reminderModal.client.name}, adjunto tu detalle de cuenta.` });
                } else {
                    try {
                        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                        toast.success('Imagen copiada. Pégala en WhatsApp.');
                    } catch (e) { toast.error('Error al compartir'); }
                }
            }, 'image/png');

        } catch (error: any) { 
            console.error(error);
            toast.error(`Error: ${error.message || 'Error al generar imagen'}`); 
        } finally { setIsGeneratingImage(false); }
    };

    const copyReminderMessage = () => {
        if (!reminderModal) return;
        
        let breakdown = '\n\nDetalle de productos:\n';
        reminderModal.sales.forEach((sale: any) => {
            sale.items.forEach((item: any) => {
                breakdown += `• ${item.quantity}x ${item.name}${item.variantName ? ` (${item.variantName})` : ''} - ${formatPrice(item.finalPrice || item.price)}\n`;
                if (item.discountApplied) breakdown += `  └─ Nota: ${item.discountApplied}\n`;
            });
        });

        const message = `Hola ${reminderModal.client.name}, te envío un recordatorio de tu saldo pendiente por pagar en Cuadra.\n\nTotal: ${formatPrice(reminderModal.debt)}${breakdown}\nTasa BCV: Bs. ${exchangeRate.toFixed(2)}\nEquivalente: Bs. ${(reminderModal.debt * exchangeRate).toLocaleString('es-VE')}\n\nQuedamos atentos a tu pago. ¡Muchas gracias!`;
        navigator.clipboard.writeText(message);
        toast.success('Mensaje copiado al portapapeles');
        setReminderModal(null);
    };

    const openWhatsApp = () => {
        if (!reminderModal) return;
        
        let breakdown = '\n\n*Detalle de productos:*\n';
        reminderModal.sales.forEach((sale: any) => {
            sale.items.forEach((item: any) => {
                breakdown += `• ${item.quantity}x ${item.name}${item.variantName ? ` (${item.variantName})` : ''} - ${formatPrice(item.finalPrice || item.price)}\n`;
                if (item.discountApplied) breakdown += `  └─ _Nota: ${item.discountApplied}_\n`;
            });
        });

        const message = `Hola *${reminderModal.client.name}*, te envío un recordatorio de tu saldo pendiente por pagar en *Cuadra*.\n\n*Total:* ${formatPrice(reminderModal.debt)}${breakdown}\n_Tasa BCV: Bs. ${exchangeRate.toFixed(2)}_\n_Equivalente: Bs. ${(reminderModal.debt * exchangeRate).toLocaleString('es-VE')}_\n\nQuedamos atentos a tu pago. ¡Muchas gracias!`;
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
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">

            <div className="liquid-glass rounded-[24px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Cobranzas</h1>
                    <p className="text-foreground/50 font-medium tracking-wide mt-1 text-sm md:text-base">Gestión de créditos y cuentas por cobrar</p>
                </div>
                <div className="liquid-glass rounded-[18px] p-4 flex flex-col items-center justify-center min-w-[160px] self-center md:self-auto" style={{ border: '1px solid rgba(255,59,48,0.20)' }}>
                    <span className="text-[10px] md:text-[11px] font-black text-ios-red/70 tracking-widest uppercase mb-1">Total Deuda</span>
                    <span className="text-2xl md:text-3xl font-black text-ios-red">{formatPrice(totalDebt)}</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 mb-2">
                <div className="relative flex-1">
                    <Input
                        placeholder="BUSCAR DEUDOR..."
                        className="text-[13px] liquid-glass w-full"
                        leftIcon={<Search size={18} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="liquid-glass rounded-[18px] flex p-1 shrink-0 h-12 md:h-14 gap-1">
                    <button
                        onClick={() => setSortBy('debt')}
                        className={`flex-1 px-4 md:px-5 py-2 rounded-[14px] text-xs md:text-sm font-bold transition-all whitespace-nowrap ${sortBy === 'debt' ? 'bg-white/25 dark:bg-white/10 text-foreground shadow-sm' : 'text-foreground/45 hover:text-foreground/70'}`}
                    >
                        Mayor Deuda
                    </button>
                    <button
                        onClick={() => setSortBy('date')}
                        className={`flex-1 px-4 md:px-5 py-2 rounded-[14px] text-xs md:text-sm font-bold transition-all whitespace-nowrap ${sortBy === 'date' ? 'bg-white/25 dark:bg-white/10 text-foreground shadow-sm' : 'text-foreground/45 hover:text-foreground/70'}`}
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
                            <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4 md:items-center">

                                <div className="flex items-center flex-1 gap-3 md:gap-4">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-linear-to-tr from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-lg md:text-xl shadow-inner shrink-0 transition-transform group-hover:scale-105">
                                        {item.client.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.client.name}</h3>
                                        <div className="flex items-center text-[11px] md:text-sm text-gray-500 dark:text-gray-400 mt-0.5 md:mt-1">
                                            <Clock size={12} className="mr-1 md:mr-1.5 opacity-70" />
                                            <span className="truncate">Corte: {new Date(item.lastSaleDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-0 border-ui-border">
                                    <div className="flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start min-w-0 md:min-w-[120px]">
                                        <span className="text-[9px] md:text-[10px] font-black text-ui-text-muted uppercase tracking-[0.15em] mb-0.5 truncate">Pendiente</span>
                                        <span className="text-lg md:text-2xl font-black text-red-600 dark:text-red-400 tracking-tighter">
                                            {formatPrice(item.debt)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 md:flex items-center gap-2 md:gap-2.5">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRemindClick(item.client, item.debt, item.sales); }}
                                            className="h-10 md:h-11 flex items-center justify-center text-green-500 bg-green-500/5 hover:bg-green-500/10 border border-green-500/10 rounded-xl md:rounded-2xl transition-all active:scale-90"
                                            title="Recordar Cobro"
                                            aria-label="Enviar recordatorio"
                                        >
                                            <MessageCircle size={20} strokeWidth={2.5} />
                                        </button>

                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPaymentMethod('cash'); setPayModal({ client: item.client, sales: item.sales, debt: item.debt }); }}
                                            className="h-10 md:h-11 px-2 md:px-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 md:gap-2"
                                            title="Registrar cobro"
                                        >
                                            <DollarSign size={14} />
                                            <span>Cobrar</span>
                                        </button>

                                        <Button
                                            onClick={() => router.push(`/clients/${item.client.id}`)}
                                            className="h-10 md:h-11 px-2 md:px-5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center"
                                        >
                                            Ver
                                        </Button>
                                    </div>
                                </div>

                            </div>
                        </Card>
                    ))
                )}
            </div>

            {payModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" role="dialog" aria-modal="true">
                    <div className="ui-card w-full max-w-sm border border-ui-border shadow-2xl animate-in zoom-in-95 duration-300 p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg md:text-xl font-black text-ui-text uppercase tracking-tight">Registrar Cobro</h2>
                                <p className="text-[10px] md:text-[11px] font-bold text-ui-text-muted mt-1 uppercase tracking-widest truncate max-w-[200px] md:max-w-none">{payModal.client.name}</p>
                            </div>
                            <button onClick={() => setPayModal(null)} className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ui-text-muted hover:text-ui-text transition-colors" aria-label="Cerrar">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="ui-input-box px-4 md:px-6 py-3 md:py-4 mb-6 flex justify-between items-center bg-black/5 dark:bg-white/5 border-0">
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-ui-text-muted">Total</span>
                            <span className="text-xl md:text-2xl font-black text-red-500">{formatPrice(payModal.debt)}</span>
                        </div>

                        <div className="space-y-2 md:space-y-3 mb-8">
                            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-ui-text-muted ml-1">Método de Pago</p>
                            {([
                                { id: 'cash', emoji: '💵', label: 'Efectivo' },
                                { id: 'transfer', emoji: '📲', label: 'Transferencia' },
                                { id: 'mobile_pay', emoji: '📱', label: 'Pago Móvil' },
                            ] as const).map(opt => (
                                <button key={opt.id} onClick={() => setPaymentMethod(opt.id)} className={`w-full p-3 md:p-3.5 rounded-xl flex items-center gap-3 font-bold border-2 transition-all active:scale-95 ${paymentMethod === opt.id ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-transparent bg-black/5 dark:bg-white/5 text-ui-text-muted hover:bg-black/10 dark:hover:bg-white/10'}`}>
                                    <span className="text-lg">{opt.emoji}</span>
                                    <span className="uppercase tracking-wide text-[10px] md:text-xs">{opt.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setPayModal(null)} className="flex-1 h-12 rounded-xl bg-black/5 dark:bg-white/5 font-black text-[10px] md:text-xs uppercase tracking-widest text-ui-text-muted hover:text-ui-text transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handlePayAll} disabled={isPaying} className="flex-1 h-12 rounded-xl bg-emerald-500 text-white font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                                {isPaying ? '...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reminderModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all animate-in fade-in duration-200">
                    <div className="ui-card w-full max-w-sm border border-ui-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-6 md:p-8 flex flex-col items-center text-center">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-[#25D366]/20 text-[#25D366] rounded-2xl flex items-center justify-center mb-6">
                            <MessageCircle size={32} />
                        </div>
                        <h2 className="text-lg md:text-xl font-black text-ui-text mb-2 uppercase tracking-tight">Vía de Contacto</h2>
                        <p className="text-[11px] md:text-xs font-bold text-ui-text-muted mb-8 tracking-wide">
                            Selecciona cómo notificar a <span className="text-ui-text block mt-1">{reminderModal.client.name}</span>
                        </p>
                        
                        <div className="w-full space-y-3">
                            <button onClick={openWhatsApp} className="w-full py-3.5 md:py-4 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-transform active:scale-95 flex items-center justify-center gap-3 shadow-md shadow-[#25D366]/20">
                                <MessageCircle size={18} /> Abrir WhatsApp
                            </button>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={() => shareAsImage(false)} 
                                    disabled={isGeneratingImage}
                                    className="py-3 px-2 bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary rounded-xl font-black uppercase tracking-[0.05em] text-[9px] md:text-[10px] transition-transform active:scale-95 flex flex-col items-center justify-center gap-1.5"
                                >
                                    <Camera size={16} /> Solo Monto
                                </button>
                                <button 
                                    onClick={() => shareAsImage(true)} 
                                    disabled={isGeneratingImage}
                                    className="py-3 px-2 bg-accent-primary text-white hover:bg-accent-primary/90 rounded-xl font-black uppercase tracking-[0.05em] text-[9px] md:text-[10px] transition-transform active:scale-95 flex flex-col items-center justify-center gap-1.5"
                                >
                                    <LayoutList size={16} /> Con Detalles
                                </button>
                            </div>

                            <button onClick={copyReminderMessage} className="w-full py-3.5 md:py-4 px-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-ui-text rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-transform active:scale-95 flex items-center justify-center gap-3">
                                <FileText size={18} className="opacity-50" /> Copiar Mensaje
                            </button>
                        </div>
                        
                        <button onClick={() => setReminderModal(null)} className="mt-6 md:mt-8 text-[9px] md:text-[10px] p-2 font-black text-ui-text-muted uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

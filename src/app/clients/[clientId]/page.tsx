"use client";

import React, { useState, useEffect } from 'react';
import { ClientService } from '@/services/client.service';
import { SalesService } from '@/services/sales.service';
import { UserService } from '@/services/user.service';
import { ReturnService } from '@/services/return.service';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ArrowLeft, User, Phone, CheckCircle2, Clock, Calendar, Edit2, Check, Banknote, HelpCircle, ShoppingCart, ChevronRight, MessageCircle, FileText, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

export default function ClientProfileScreen({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = React.use(params);
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const { formatPrice } = useCurrency();

    const [client, setClient] = useState<any>(null);
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedDebts, setSelectedDebts] = useState<string[]>([]);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const [payModalVisible, setPayModalVisible] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mobile_pay'>('cash');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [isSavingPayment, setIsSavingPayment] = useState(false);
    const [reminderModalVisible, setReminderModalVisible] = useState(false);

    const [selectedSaleForDetail, setSelectedSaleForDetail] = useState<any>(null);
    const [isSaleDetailModalOpen, setIsSaleDetailModalOpen] = useState(false);

    // Return states for detail modal
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [returnItems, setReturnItems] = useState<Record<string, number>>({});
    const [returnReason, setReturnReason] = useState('');
    const [isProcessingReturn, setIsProcessingReturn] = useState(false);

    useEffect(() => {
        loadData();
    }, [clientId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const clientData = await ClientService.getClientById(clientId);
            if (clientData) {
                setClient(clientData);
                setName(clientData.name);
                setPhone(clientData.phone);

                const clientSales = await SalesService.getSalesByClient(clientId);
                setSales(clientSales);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name || !phone) {
            alert('Nombre y teléfono son obligatorios');
            return;
        }
        try {
            await ClientService.updateClient(clientId, { name, phone });
            setIsEditing(false);
            setClient((prev: any) => prev ? { ...prev, name, phone } : null);
        } catch (error) {
            alert('No se pudo actualizar el perfil');
        }
    };

    const pendingSales = sales.filter(s => s.status === 'pending');

    const handleConfirmPayment = async () => {
        setIsSavingPayment(true);
        try {
            const isPartial = selectedDebts.length > 0 && selectedDebts.length < pendingSales.length;
            const bulkNote = paymentNotes ? `[PAGO MASIVO] ${paymentNotes}` : (isPartial ? `[PAGO PARCIAL] ${selectedDebts.length} deudas seleccionadas.` : '[PAGO MASIVO] Saldo total de crédito.');

            if (selectedDebts.length > 0) {
                await SalesService.paySpecificDebts(selectedDebts, {
                    paymentMethod,
                    evidenceUrl: null,
                    notes: bulkNote,
                    cashboxId: currentUser?.uid,
                    cashboxName: currentUser?.displayName || 'Cajero',
                });
            } else {
                await SalesService.payAllDebts(clientId, {
                    paymentMethod,
                    evidenceUrl: null,
                    notes: bulkNote,
                    cashboxId: currentUser?.uid,
                    cashboxName: currentUser?.displayName || 'Cajero',
                });
            }
            
            setPayModalVisible(false);
            setPaymentNotes('');
            setSelectedDebts([]);
            loadData();
        } catch (error) {
            alert('No se pudo procesar el pago');
        } finally {
            setIsSavingPayment(false);
        }
    };
    const generateMessage = () => {
        if (!client) return '';
        const amount = selectedDebtTotal > 0 ? selectedDebtTotal : totalDebt;
        const debtCount = selectedDebts.length > 0 ? selectedDebts.length : pendingSales.length;

        if (amount <= 0) {
            return `Hola ${client.name}, te escribimos de Cuadra.`;
        }

        if (selectedDebts.length > 0 && selectedDebts.length < pendingSales.length) {
            return `Hola ${client.name}, te recordamos que tienes un saldo pendiente de $${amount.toFixed(2)} (${debtCount} cobro${debtCount > 1 ? 's' : ''}) en Cuadra.`;
        }

        return `Hola ${client.name}, te recordamos que tienes un saldo pendiente de $${amount.toFixed(2)} en Cuadra.`;
    };

    const openWhatsApp = () => {
        if (!client) return;
        const message = generateMessage();
        const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        setReminderModalVisible(false);
    };

    const copyReminderMessage = () => {
        if (!client) return;
        const message = generateMessage();
        navigator.clipboard.writeText(message);
        toast.success('Mensaje copiado al portapapeles');
        setReminderModalVisible(false);
    };

    const handleProcessReturn = async () => {
        if (!selectedSaleForDetail?.id) return;
        if (!returnReason.trim()) {
            toast.error('Debes ingresar un motivo para la devolución');
            return;
        }

        const itemsToReturn = Object.entries(returnItems)
            .filter(([_, qty]) => qty > 0)
            .map(([itemKey, qty]) => {
                const item = selectedSaleForDetail.items.find((i: any) => i.id + (i.variantId || '') === itemKey);
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
                selectedSaleForDetail.id,
                itemsToReturn,
                returnReason.trim(),
                { id: currentUser?.uid || '', name: currentUser?.displayName || '' }
            );
            toast.success('Devolución registrada exitosamente');
            setIsReturnModalOpen(false);
            setReturnItems({});
            setReturnReason('');
            setSelectedSaleForDetail({ ...selectedSaleForDetail, hasReturns: true });
        } catch (error: any) {
            toast.error(error.message || 'Error al procesar la devolución');
        } finally {
            setIsProcessingReturn(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500 font-medium">Cargando Perfil...</span>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex h-[80vh] items-center justify-center text-gray-500">
                Cliente no encontrado
            </div>
        );
    }

    const totalDebt = pendingSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const selectedDebtTotal = selectedDebts.length > 0 
        ? pendingSales.filter(s => selectedDebts.includes(s.id)).reduce((sum, s) => sum + (s.total || 0), 0)
        : totalDebt;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center min-w-0">
                    <button onClick={() => router.back()} className="p-2.5 mr-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-all active:scale-90 text-gray-600 dark:text-gray-300 shrink-0">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-gray-900 dark:text-white truncate uppercase">Perfil</h1>
                </div>
                {!isEditing && (
                    <Button onClick={() => alert("Nueva venta flow missing params")} size="sm" className="h-10 px-6 rounded-xl font-black uppercase tracking-widest text-[11px]">Venta</Button>
                )}
            </div>

            {/* Profile Card */}
            <Card className="bg-white dark:bg-gray-900 shadow-md border-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-r from-blue-600 to-teal-400 opacity-90"></div>

                <CardContent className="p-5 md:p-8 pt-16 md:pt-12 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 text-center sm:text-left">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-xl flex items-center justify-center text-blue-600 text-3xl font-black shrink-0">
                                {client.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="pb-1">
                                {isEditing ? (
                                    <div className="space-y-3 mb-2 w-full min-w-[200px]">
                                        <Input value={name} onChange={(e) => setName(e.target.value)} className="font-bold text-lg" autoFocus placeholder="Nombre" />
                                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Teléfono" />
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white leading-none">{client.name}</h2>
                                        <p className="text-gray-500 dark:text-gray-400 font-bold flex items-center justify-center sm:justify-start mt-2 text-sm tracking-wide">
                                            <Phone size={14} className="mr-2 text-blue-500" />
                                            {client.phone}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-center sm:justify-start gap-3 pb-1 w-full sm:w-auto">
                            {!isEditing && (
                                <Button variant="outline" onClick={() => setReminderModalVisible(true)} className="flex-1 sm:flex-none h-11 px-5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-white/5 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30 font-black uppercase tracking-widest text-[10px] rounded-xl">
                                    <MessageCircle size={16} className="mr-2" /> Mensaje
                                </Button>
                            )}
                            {isEditing ? (
                                <Button onClick={handleSave} className="flex-1 sm:flex-none h-11 px-8 bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-green-500/20">
                                    <Check size={16} className="mr-2" /> Guardar
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1 sm:flex-none h-11 px-5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-white/5 font-black uppercase tracking-widest text-[10px] rounded-xl">
                                    <Edit2 size={16} className="mr-2 text-gray-400 dark:text-gray-500" /> Editar
                                </Button>
                            )}
                        </div>
                    </div>


                    {totalDebt > 0 && !isEditing && (
                        <div className="mt-10 p-6 bg-red-500/5 dark:bg-red-900/10 rounded-2xl border border-red-500/10 dark:border-red-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
                            <div>
                                <h3 className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-[0.2em] mb-2 flex items-center justify-center sm:justify-start">
                                    <Banknote size={14} className="mr-2" /> {selectedDebts.length > 0 ? 'Deuda Seleccionada' : 'Deuda Pendiente'}
                                </h3>
                                <p className="text-3xl font-black text-red-600 dark:text-red-400 text-center sm:text-left tracking-tighter">
                                    {formatPrice(selectedDebtTotal)}
                                </p>
                            </div>
                            <Button onClick={() => setPayModalVisible(true)} className="w-full sm:w-auto h-12 px-8 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[11px] rounded-xl shadow-lg shadow-red-500/20 active:scale-95 transition-all">
                                {selectedDebts.length > 0 ? `Saldar (${selectedDebts.length})` : 'Saldar Todo'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Purchase History */}
            <div className="pt-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Historial de Compras</h3>

                {sales.length === 0 ? (
                    <Card className="bg-gray-50 border-dashed dark:bg-gray-900/50 dark:border-gray-800">
                        <CardContent className="p-12 text-center text-gray-500 dark:text-gray-400">
                            <ShoppingCart className="mx-auto mb-4 opacity-20" size={48} />
                            No hay compras registradas para este cliente.
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden border-ui-border shadow-soft">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-ui-text-muted">
                                <thead className="text-[10px] text-ui-text-muted uppercase bg-black/2 tracking-widest dark:bg-white/5 border-b border-ui-border font-black">
                                    <tr>
                                        <th scope="col" className="px-4 py-4 w-10"></th>
                                        <th scope="col" className="px-2 py-4">Fecha</th>
                                        <th scope="col" className="px-6 py-4">Monto Total</th>
                                        <th scope="col" className="px-6 py-4">Estado</th>
                                        <th scope="col" className="px-6 py-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map((sale) => {
                                        const isPending = sale.status === 'pending';
                                        const isSelected = selectedDebts.includes(sale.id);

                                        return (
                                            <tr
                                                key={sale.id}
                                                onClick={() => {
                                                    if (isPending) {
                                                        setSelectedDebts(prev =>
                                                            prev.includes(sale.id) ? prev.filter(id => id !== sale.id) : [...prev, sale.id]
                                                        );
                                                    } else {
                                                        setSelectedSaleForDetail(sale);
                                                        setIsSaleDetailModalOpen(true);
                                                    }
                                                }}
                                                className={`border-b dark:border-gray-800 transition-colors group cursor-pointer ${isPending ? 'hover:bg-gray-50 dark:hover:bg-gray-800/80 ' + (isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-900') : 'hover:bg-gray-50 dark:hover:bg-gray-800/80 bg-white dark:bg-gray-900'}`}
                                            >
                                                <td className="px-4 py-4">
                                                    {isPending && (
                                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600'}`}>
                                                            {isSelected && <Check size={14} className="text-white" />}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-2 py-4 font-medium text-gray-900 dark:text-white flex items-center">
                                                    <Calendar size={14} className="mr-2 text-gray-400" />
                                                    {new Date(sale.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                                    {formatPrice(sale.total || 0)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {sale.status === 'paid' ? (
                                                        <span className="flex items-center text-xs font-bold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-full w-fit">
                                                            <CheckCircle2 size={12} className="mr-1" />
                                                            PAGADO
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-xs font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full w-fit">
                                                            <Clock size={12} className="mr-1" />
                                                            PENDIENTE
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {!isPending && <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors inline-block" />}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* Pay Modal */}
            {payModalVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 border-0">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Saldar Deuda Total</h2>
                            <p className="text-gray-500 text-sm mb-6">Confirma el medio de pago para saldar todas las compras pendientes.</p>

                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl mb-6 flex items-center justify-between border border-gray-100 dark:border-gray-800">
                                <span className="font-medium text-gray-600 dark:text-gray-300">Total a cobrar:</span>
                                <span className="text-2xl font-black text-red-600 dark:text-red-400">${selectedDebtTotal.toFixed(2)}</span>
                            </div>

                            <div className="space-y-4 mb-6">
                                <label className="flex items-center p-3 border border-gray-200 dark:border-gray-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                    <input type="radio" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500" />
                                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Efectivo</span>
                                </label>
                                <label className="flex items-center p-3 border border-gray-200 dark:border-gray-800 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                                    <input type="radio" value="transfer" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500" />
                                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Transferencia / Pago Móvil</span>
                                </label>
                            </div>

                            <Input
                                label="Descripción / Notas (Opcional)"
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                placeholder="Ej: Pago de fiao semanal..."
                            />

                            <div className="flex gap-3 pt-6 mt-2 border-t border-gray-100 dark:border-gray-800">
                                <Button type="button" variant="ghost" className="flex-1" onClick={() => setPayModalVisible(false)} disabled={isSavingPayment}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleConfirmPayment} className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500" isLoading={isSavingPayment}>
                                    Confirmar Pago
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            {/* Reminder Modal */}
            {reminderModalVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 transition-all animate-in fade-in duration-200">
                    <div className="ui-card w-full max-w-md border border-ui-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-6 flex flex-col !bg-white dark:!bg-[#1c1c1e]">
                        <div className="w-12 h-12 bg-[#25D366]/20 text-[#25D366] rounded-xl flex items-center justify-center mb-4">
                            <MessageCircle size={24} />
                        </div>
                        <h2 className="text-lg font-black text-ui-text mb-1 uppercase tracking-tight">Vía de Contacto</h2>
                        <p className="text-[10px] font-bold text-ui-text-muted mb-4 tracking-wide">
                            Notificar a <span className="text-ui-text">{client.name}</span>
                        </p>

                        {/* Message Preview */}
                        <div className="mb-6 p-4 bg-[#25D366]/5 border border-[#25D366]/20 rounded-xl">
                            <p className="text-[11px] font-black text-ui-text-muted uppercase tracking-widest mb-2">Vista Previa del Mensaje</p>
                            <p className="text-xs text-ui-text leading-relaxed italic">
                                {generateMessage()}
                            </p>
                        </div>

                        <div className="w-full space-y-2">
                            <button onClick={openWhatsApp} className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-black uppercase tracking-widest text-[11px] transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-md">
                                <MessageCircle size={16} /> Abrir WhatsApp
                            </button>
                            <button onClick={copyReminderMessage} className="w-full py-3 px-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-ui-text rounded-lg font-black uppercase tracking-widest text-[11px] transition-transform active:scale-95 flex items-center justify-center gap-2">
                                <FileText size={16} /> Copiar Mensaje
                            </button>
                        </div>

                        <button onClick={() => setReminderModalVisible(false)} className="mt-4 text-[10px] p-2 font-black text-ui-text-muted uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity self-center">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Sale Detail Modal */}
            {isSaleDetailModalOpen && selectedSaleForDetail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="ui-card w-full max-w-2xl border border-ui-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-ui-border flex items-center justify-between bg-ui-bg/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                                    <ShoppingCart size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-ui-text uppercase tracking-tighter">Detalle de Compra</h2>
                                    <p className="text-[9px] text-ui-text-muted font-bold uppercase tracking-[0.2em] mt-0.5">
                                        {new Date(selectedSaleForDetail.createdAt).toLocaleDateString()} • {new Date(selectedSaleForDetail.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsSaleDetailModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-ui-bg border border-ui-border flex items-center justify-center text-ui-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {/* Info Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-ui-bg/50 p-3 rounded-lg border border-ui-border/50">
                                    <p className="text-[8px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Estado</p>
                                    <div className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-ui-bg border border-ui-border">
                                        {selectedSaleForDetail.status === 'paid' ? (
                                            <span className="text-green-600 dark:text-green-400">✓ Pagado</span>
                                        ) : selectedSaleForDetail.status === 'pending' ? (
                                            <span className="text-amber-600 dark:text-amber-400">⏱ Pendiente</span>
                                        ) : (
                                            <span className="text-red-600 dark:text-red-400">✗ Cancelado</span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-ui-bg/50 p-3 rounded-lg border border-ui-border/50">
                                    <p className="text-[8px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Método de Pago</p>
                                    <p className="text-xs font-bold text-ui-text">
                                        {selectedSaleForDetail.paymentMethod === 'cash' ? 'Efectivo' : selectedSaleForDetail.paymentMethod === 'transfer' ? 'Transferencia' : selectedSaleForDetail.paymentMethod === 'mobile_pay' ? 'Pago Móvil' : 'Crédito'}
                                    </p>
                                </div>
                                <div className="bg-ui-bg/50 p-3 rounded-lg border border-ui-border/50">
                                    <p className="text-[8px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Cajero</p>
                                    <p className="text-xs font-bold text-ui-text truncate">{selectedSaleForDetail.creatorName || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-ui-text-muted uppercase tracking-[0.2em]">Productos Comprados</h3>
                                <div className="space-y-2">
                                    {selectedSaleForDetail.items?.map((item: any, idx: number) => (
                                        <div key={idx} className="bg-ui-bg/50 p-3 rounded-lg border border-ui-border/50 flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-ui-text uppercase tracking-tight">{item.name}</p>
                                                {item.variantName && (
                                                    <p className="text-[9px] text-ui-text-muted font-bold mt-0.5">Variante: {item.variantName}</p>
                                                )}
                                                <p className="text-[9px] text-ui-text-muted font-bold mt-1">Cantidad: {item.quantity} × {formatPrice(item.finalPrice)}</p>
                                            </div>
                                            <div className="text-right ml-4 shrink-0">
                                                <p className="text-xs font-black text-accent-primary">{formatPrice(item.finalPrice * item.quantity)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Notes if exists */}
                            {selectedSaleForDetail.notes && (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-ui-text-muted uppercase tracking-[0.2em]">Notas</p>
                                    <div className="bg-accent-secondary/5 p-3 rounded-lg border border-accent-secondary/20">
                                        <p className="text-xs text-ui-text italic">{selectedSaleForDetail.notes}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer - Total & Actions */}
                        <div className="p-6 bg-ui-bg/50 border-t border-ui-border space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-ui-text-muted uppercase tracking-[0.2em]">Total</span>
                                <p className="text-3xl font-black text-ui-text tracking-tighter">{formatPrice(selectedSaleForDetail.total)}</p>
                            </div>

                            {selectedSaleForDetail.status === 'paid' && (
                                <button
                                    onClick={() => {
                                        setReturnItems({});
                                        setReturnReason('');
                                        setIsReturnModalOpen(true);
                                    }}
                                    className="w-full py-2.5 px-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={16} />
                                    Registrar Devolución
                                </button>
                            )}
                            {selectedSaleForDetail.hasReturns && (
                                <div className="py-2 px-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 dark:text-green-400 text-[9px] font-black uppercase tracking-widest text-center">
                                    ✓ Tiene devoluciones registradas
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {isReturnModalOpen && selectedSaleForDetail && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-ui-surface backdrop-blur-2xl border border-ui-border rounded-2xl shadow-float overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-400">
                        {/* Header */}
                        <div className="p-6 border-b border-ui-border flex items-center justify-between bg-amber-500/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600">
                                    <RotateCcw size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-ui-text uppercase tracking-tighter leading-none">Registrar Devolución</h2>
                                    <p className="text-[9px] text-ui-text-muted font-bold uppercase tracking-[0.2em] mt-0.5">Selecciona qué devolver</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsReturnModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-ui-bg border border-ui-border flex items-center justify-center text-ui-text-muted hover:text-amber-600 hover:bg-amber-600/10 transition-all"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {/* Items Selection */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-ui-text-muted uppercase tracking-[0.2em]">Productos</p>
                                {selectedSaleForDetail.items.map((item: any) => {
                                    const itemKey = item.id + (item.variantId || '');
                                    const returnQty = returnItems[itemKey] || 0;
                                    return (
                                        <div key={itemKey} className="bg-ui-bg/50 p-3 rounded-lg border border-ui-border/50 space-y-2">
                                            <div>
                                                <p className="text-xs font-black text-ui-text uppercase tracking-tight">{item.name}</p>
                                                {item.variantName && (
                                                    <p className="text-[9px] text-ui-text-muted font-bold mt-0.5">Variante: {item.variantName}</p>
                                                )}
                                                <p className="text-[9px] text-ui-text-muted font-bold mt-1">{formatPrice(item.finalPrice)} × {item.quantity} un</p>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[9px] font-bold text-ui-text-muted uppercase">A devolver:</span>
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
                                                    className="w-14 h-7 bg-ui-bg border border-ui-border rounded-lg text-xs font-black text-ui-text text-center outline-none focus:border-amber-500"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Reason */}
                            <div className="space-y-2 pt-2">
                                <label className="text-[10px] font-black text-ui-text-muted uppercase tracking-[0.2em]">
                                    Motivo <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    placeholder="Producto defectuoso, cambio de decisión..."
                                    rows={3}
                                    className="w-full bg-ui-bg border border-ui-border rounded-lg px-3 py-2 text-xs font-bold text-ui-text placeholder:text-ui-text-muted/40 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-none"
                                />
                            </div>

                            {/* Total Refund */}
                            {Object.values(returnItems).some(v => v > 0) && (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-1">
                                    <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-[0.2em]">Total a Devolver</p>
                                    <p className="text-lg font-black text-amber-600 dark:text-amber-400 tracking-tighter">
                                        {formatPrice(
                                            Object.entries(returnItems).reduce((sum, [itemKey, qty]) => {
                                                const item = selectedSaleForDetail.items.find((i: any) => i.id + (i.variantId || '') === itemKey);
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
                                className="flex-1 py-2.5 px-4 bg-ui-bg border border-ui-border rounded-lg text-ui-text-muted hover:text-ui-text text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleProcessReturn}
                                disabled={isProcessingReturn || !Object.values(returnItems).some(v => v > 0) || !returnReason.trim()}
                                className="flex-1 py-2.5 px-4 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest transition-all rounded-lg"
                            >
                                {isProcessingReturn ? 'Procesando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

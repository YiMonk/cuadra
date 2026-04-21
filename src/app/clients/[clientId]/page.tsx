"use client";

import React, { useState, useEffect } from 'react';
import { ClientService } from '@/services/client.service';
import { SalesService } from '@/services/sales.service';
import { UserService } from '@/services/user.service';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ArrowLeft, User, Phone, CheckCircle2, Clock, Calendar, Edit2, Check, Banknote, HelpCircle, ShoppingCart, ChevronRight, MessageCircle, FileText } from 'lucide-react';
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
    const openWhatsApp = () => {
        if (!client) return;
        const message = totalDebt > 0 
            ? `Hola ${client.name}, te recordamos que tienes un saldo pendiente de $${totalDebt.toFixed(2)} en Cuadra.`
            : `Hola ${client.name}, te escribimos de Cuadra.`;
        const whatsappUrl = `https://wa.me/${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        setReminderModalVisible(false);
    };

    const copyReminderMessage = () => {
        if (!client) return;
        const message = totalDebt > 0 
            ? `Hola ${client.name}, te recordamos que tienes un saldo pendiente de $${totalDebt.toFixed(2)} en Cuadra.`
            : `Hola ${client.name}, te escribimos de Cuadra.`;
        navigator.clipboard.writeText(message);
        toast.success('Mensaje copiado al portapapeles');
        setReminderModalVisible(false);
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
                                                        router.push(`/sales/${sale.id}`);
                                                    }
                                                }} 
                                                className={`border-b dark:border-gray-800 transition-colors group ${isPending ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 ' + (isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-900') : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/80 bg-white dark:bg-gray-900'}`}
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
                    <div className="ui-card w-full max-w-sm border border-ui-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-8 flex flex-col items-center text-center !bg-white dark:!bg-[#1c1c1e]">
                        <div className="w-16 h-16 bg-[#25D366]/20 text-[#25D366] rounded-2xl flex items-center justify-center mb-6">
                            <MessageCircle size={32} />
                        </div>
                        <h2 className="text-xl font-black text-ui-text mb-2 uppercase tracking-tight">Vía de Contacto</h2>
                        <p className="text-xs font-bold text-ui-text-muted mb-8 tracking-wide">
                            Selecciona cómo notificar a <span className="text-ui-text">{client.name}</span>
                        </p>
                        
                        <div className="w-full space-y-3">
                            <button onClick={openWhatsApp} className="w-full py-4 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-black uppercase tracking-widest text-xs transition-transform active:scale-95 flex items-center justify-center gap-3 shadow-md">
                                <MessageCircle size={18} /> Abrir WhatsApp
                            </button>
                            <button onClick={copyReminderMessage} className="w-full py-4 px-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-ui-text rounded-xl font-black uppercase tracking-widest text-xs transition-transform active:scale-95 flex items-center justify-center gap-3">
                                <FileText size={18} opacity={0.5} /> Copiar Mensaje
                            </button>
                        </div>
                        
                        <button onClick={() => setReminderModalVisible(false)} className="mt-8 text-[10px] p-2 font-black text-ui-text-muted uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

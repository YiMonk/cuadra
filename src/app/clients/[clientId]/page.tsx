"use client";

import React, { useState, useEffect } from 'react';
import { ClientService } from '@/services/client.service';
import { SalesService } from '@/services/sales.service';
import { UserService } from '@/services/user.service';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, User, Phone, CheckCircle2, Clock, Calendar, Edit2, Check, Banknote, HelpCircle, ShoppingCart, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

export default function ClientProfileScreen({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = React.use(params);
    const router = useRouter();
    const { user: currentUser } = useAuth();

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
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                    <button onClick={() => router.back()} className="p-2 mr-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Perfil del Cliente</h1>
                </div>
                {!isEditing && (
                    <Button onClick={() => alert("Nueva venta flow missing params")} size="sm" className="hidden sm:flex">Venta</Button>
                )}
            </div>

            {/* Profile Card */}
            <Card className="bg-white dark:bg-gray-900 shadow-md border-0 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-linear-to-r from-blue-600 to-teal-400 opacity-90"></div>

                <CardContent className="p-6 pt-12 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="flex items-end gap-5">
                            <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center text-blue-600 text-3xl font-bold">
                                {client.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="pb-2">
                                {isEditing ? (
                                    <div className="space-y-2 mb-2">
                                        <Input value={name} onChange={(e) => setName(e.target.value)} className="font-bold text-lg" autoFocus />
                                        <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{client.name}</h2>
                                        <p className="text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                            <Phone size={14} className="mr-1.5" />
                                            {client.phone}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pb-2">
                            {isEditing ? (
                                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white min-w-[120px] shadow-sm">
                                    <Check size={16} className="mr-2" /> Guardar
                                </Button>
                            ) : (
                                <Button variant="outline" onClick={() => setIsEditing(true)} className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700">
                                    <Edit2 size={16} className="mr-2 text-gray-500" /> Editar
                                </Button>
                            )}
                        </div>
                    </div>


                    {totalDebt > 0 && !isEditing && (
                        <div className="mt-8 p-5 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                            <div>
                                <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-1 flex items-center">
                                    <Banknote size={16} className="mr-2" /> {selectedDebts.length > 0 ? 'Deuda Seleccionada' : 'Deuda Pendiente'}
                                </h3>
                                <p className="text-3xl font-black text-red-700 dark:text-red-300">
                                    ${selectedDebtTotal.toFixed(2)}
                                </p>
                            </div>
                            <Button onClick={() => setPayModalVisible(true)} className="bg-red-600 hover:bg-red-700 shadow-md shadow-red-500/20">
                                {selectedDebts.length > 0 ? `Saldar Seleccionadas (${selectedDebts.length})` : 'Saldar Completamente'}
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
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                    <tr>
                                        <th scope="col" className="px-4 py-4 w-10"></th>
                                        <th scope="col" className="px-2 py-4 font-bold">Fecha</th>
                                        <th scope="col" className="px-6 py-4 font-bold">Monto Total</th>
                                        <th scope="col" className="px-6 py-4 font-bold">Estado</th>
                                        <th scope="col" className="px-6 py-4"></th>
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
                                                    ${(sale.total || 0).toFixed(2)}
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
        </div>
    );
}

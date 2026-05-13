"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOwnerContext } from '@/hooks/useOwnerContext';
import { useCurrency } from '@/context/CurrencyContext';
import { SupplierService } from '@/services/supplier.service';
import { Supplier } from '@/types/supplier';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, X, Trash2, Edit, Truck, Phone, Mail, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';

export default function SuppliersPage() {
    const { user } = useAuth();
    const { ownerId } = useOwnerContext();
    const { formatPrice } = useCurrency();
    const canManage = usePermission('manageSuppliers');

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Supplier | null>(null);

    // Form
    const [name, setName] = useState('');
    const [contactName, setContactName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [notes, setNotes] = useState('');
    const [balanceOwed, setBalanceOwed] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!ownerId) return;
        const unsub = SupplierService.subscribeToSuppliers(ownerId, setSuppliers);
        return () => unsub();
    }, [ownerId]);

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return suppliers;
        const q = searchQuery.toLowerCase();
        return suppliers.filter(s =>
            s.name.toLowerCase().includes(q) ||
            (s.contactName || '').toLowerCase().includes(q) ||
            (s.phone || '').includes(q)
        );
    }, [suppliers, searchQuery]);

    const totalOwed = suppliers.reduce((sum, s) => sum + (s.balanceOwed || 0), 0);

    const resetForm = () => {
        setName('');
        setContactName('');
        setPhone('');
        setEmail('');
        setAddress('');
        setNotes('');
        setBalanceOwed('');
        setEditing(null);
    };

    const openCreate = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEdit = (s: Supplier) => {
        setEditing(s);
        setName(s.name);
        setContactName(s.contactName || '');
        setPhone(s.phone || '');
        setEmail(s.email || '');
        setAddress(s.address || '');
        setNotes(s.notes || '');
        setBalanceOwed(s.balanceOwed ? s.balanceOwed.toString() : '');
        setModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !ownerId) return;
        if (!name.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }
        setIsSaving(true);
        try {
            const balanceNum = parseFloat(balanceOwed);
            const payload = {
                ownerId,
                name: name.trim(),
                contactName: contactName.trim() || undefined,
                phone: phone.trim() || undefined,
                email: email.trim() || undefined,
                address: address.trim() || undefined,
                notes: notes.trim() || undefined,
                balanceOwed: Number.isFinite(balanceNum) && balanceNum > 0 ? balanceNum : 0,
                active: true,
            };
            if (editing?.id) {
                await SupplierService.updateSupplier(editing.id, payload);
                toast.success('Proveedor actualizado');
            } else {
                await SupplierService.createSupplier(payload);
                toast.success('Proveedor agregado');
            }
            setModalOpen(false);
            resetForm();
        } catch {
            toast.error('Error al guardar proveedor');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (supplier: Supplier) => {
        if (!supplier.id) return;
        toast.error(`¿Eliminar "${supplier.name}"?`, {
            action: {
                label: 'Eliminar',
                onClick: async () => {
                    try {
                        await SupplierService.deleteSupplier(supplier.id!);
                        toast.success('Proveedor eliminado');
                    } catch {
                        toast.error('Error al eliminar');
                    }
                },
            },
            cancel: { label: 'Cancelar', onClick: () => {} },
        });
    };

    if (user && !canManage) {
        return (
            <div className="p-8 max-w-3xl mx-auto">
                <p className="text-sm text-ui-text-muted">No tienes permiso para ver esta sección.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-ui-text uppercase tracking-tight">
                        Proveedores
                    </h1>
                    <p className="text-ui-text-muted text-sm mt-1 font-medium">
                        Gestiona tus proveedores y cuentas por pagar
                    </p>
                </div>
                <Button
                    onClick={openCreate}
                    className="bg-accent-primary hover:bg-accent-primary/90"
                    size="lg"
                >
                    <Plus size={18} />
                    Nuevo Proveedor
                </Button>
            </div>

            {totalOwed > 0 && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Truck className="text-amber-600" size={20} />
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-amber-600">
                                Cuentas por pagar
                            </p>
                            <p className="text-base font-black text-amber-600">{formatPrice(totalOwed)}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-text-muted/50" />
                <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar proveedor..."
                    className="w-full bg-ui-bg border border-ui-border rounded-xl pl-10 pr-3 py-2.5 text-sm font-bold outline-none focus:border-accent-primary text-ui-text placeholder:text-ui-text-muted/40"
                />
            </div>

            {filtered.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                        <Truck size={32} className="mx-auto mb-3 text-ui-text-muted opacity-30" />
                        <p className="text-sm text-ui-text-muted">
                            {searchQuery ? 'Sin resultados' : 'No tienes proveedores registrados'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filtered.map(supplier => (
                        <Card key={supplier.id} className="border-ui-border/50">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2 rounded-xl bg-accent-primary/10 text-accent-primary flex-shrink-0">
                                            <Truck size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-black text-ui-text uppercase tracking-tight truncate">
                                                {supplier.name}
                                            </h3>
                                            {supplier.contactName && (
                                                <p className="text-[10px] text-ui-text-muted font-bold">
                                                    {supplier.contactName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => openEdit(supplier)}
                                            className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-accent-primary hover:text-white text-ui-text-muted flex items-center justify-center transition-all"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(supplier)}
                                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-[11px] font-medium text-ui-text-muted">
                                    {supplier.phone && (
                                        <div className="flex items-center gap-2"><Phone size={12} />{supplier.phone}</div>
                                    )}
                                    {supplier.email && (
                                        <div className="flex items-center gap-2"><Mail size={12} />{supplier.email}</div>
                                    )}
                                    {supplier.address && (
                                        <div className="flex items-center gap-2"><MapPin size={12} />{supplier.address}</div>
                                    )}
                                </div>

                                {supplier.balanceOwed != null && supplier.balanceOwed > 0 && (
                                    <div className="mt-3 pt-3 border-t border-ui-border/50 flex items-center justify-between">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-600">
                                            Saldo Pendiente
                                        </span>
                                        <span className="text-sm font-black text-amber-600">
                                            {formatPrice(supplier.balanceOwed)}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="ui-card w-full max-w-md border border-ui-border shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">
                                {editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                            </h2>
                            <button
                                onClick={() => { setModalOpen(false); resetForm(); }}
                                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ui-text-muted"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <Input label="Nombre / Razón Social" value={name} onChange={e => setName(e.target.value)} required />
                            <Input label="Persona de Contacto" value={contactName} onChange={e => setContactName(e.target.value)} />
                            <Input label="Teléfono" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+58 ..." />
                            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                            <Input label="Dirección" value={address} onChange={e => setAddress(e.target.value)} />
                            <Input label="Saldo Pendiente (USD)" type="number" step="0.01" value={balanceOwed} onChange={e => setBalanceOwed(e.target.value)} placeholder="0.00" />
                            <div>
                                <label className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted block mb-2">
                                    Notas
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Observaciones..."
                                    className="w-full bg-ui-bg border border-ui-border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-accent-primary text-ui-text placeholder:text-ui-text-muted/40 min-h-[60px]"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setModalOpen(false); resetForm(); }}
                                    className="flex-1 h-11 rounded-xl bg-black/5 dark:bg-white/5 font-black text-xs uppercase tracking-widest text-ui-text-muted"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 h-11 rounded-xl bg-accent-primary text-white font-black text-xs uppercase tracking-widest hover:bg-accent-primary/90 disabled:opacity-50"
                                >
                                    {isSaving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Registrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

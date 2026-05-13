"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { ClientService } from '@/services/client.service';
import { Search, UserPlus, Phone, User as UserIcon, ChevronRight, Tag, Download, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useOwnerContext } from '@/hooks/useOwnerContext';
import { useClients } from '@/hooks/useClients';
import { Client } from '@/types/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/Card';
import { useContactPicker } from '@/hooks/useContactPicker';
import { Contact2 } from 'lucide-react';

const TAG_SUGGESTIONS = ['VIP', 'Mayorista', 'Moroso', 'Frecuente', 'Nuevo'];

const parseTagsInput = (raw: string): string[] => {
    return raw
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => t.length > 30 ? t.slice(0, 30) : t);
};

const exportClientsCsv = (clients: Client[]) => {
    const rows = [['Nombre', 'Teléfono', 'Tags', 'Notas', 'Creado']];
    clients.forEach(c => {
        rows.push([
            c.name || '',
            c.phone || '',
            (c.tags || []).join('; '),
            (c.notes || '').replace(/\n/g, ' '),
            new Date(c.createdAt).toLocaleDateString('es-VE'),
        ]);
    });
    const csv = rows.map(r =>
        r.map(cell => {
            const s = String(cell);
            return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(',')
    ).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

export default function ClientListScreen() {
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [activeTags, setActiveTags] = useState<string[]>([]);
    const router = useRouter();

    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newTagsRaw, setNewTagsRaw] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const { user, isLoading: authLoading } = useAuth();
    const { ownerId } = useOwnerContext();
    const { clients, isLoading: loading } = useClients(ownerId);

    const allTags = useMemo(() => {
        const set = new Set<string>();
        clients.forEach(c => (c.tags || []).forEach(t => set.add(t)));
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [clients]);

    const filteredClients = useMemo(() => {
        return clients.filter(c => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!c.name.toLowerCase().includes(q) && !c.phone.includes(searchQuery)) return false;
            }
            if (activeTags.length > 0) {
                const clientTags = c.tags || [];
                if (!activeTags.every(t => clientTags.includes(t))) return false;
            }
            return true;
        });
    }, [clients, searchQuery, activeTags]);

    const toggleTag = (t: string) => {
        setActiveTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    };
    const { isSupported, pickContact } = useContactPicker();

    const handlePickContact = async () => {
        const contact = await pickContact();
        if (contact) {
            setNewName(contact.name);
            setNewPhone(contact.phone);
        }
    };

    useEffect(() => {
        if (!authLoading && user) {
            if (user.role === 'staff') {
                router.replace('/pos');
            } else if (user.role === 'admin' || user.role === 'admingod') {
                router.replace('/admin/dashboard');
            }
        }
    }, [user, authLoading, router]);

    const onChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newPhone) return;
        setIsSaving(true);
        try {
            const tags = parseTagsInput(newTagsRaw);
            await ClientService.addClient({
                name: newName,
                phone: newPhone,
                active: true,
                ...(tags.length > 0 ? { tags } : {}),
            }, ownerId);
            setModalVisible(false);
            setNewName('');
            setNewPhone('');
            setNewTagsRaw('');
            toast.success('Cliente registrado con éxito');
        } catch (err) {
            toast.error("Error creando cliente");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || authLoading || (user?.role === 'staff' || user?.role === 'admin' || user?.role === 'admingod')) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500 font-medium tracking-wide">Cargando Clientes...</span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
                    <p className="text-xs text-foreground/50 mt-1">
                        {filteredClients.length} de {clients.length} cliente{clients.length === 1 ? '' : 's'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => exportClientsCsv(filteredClients)}
                        disabled={filteredClients.length === 0}
                        className="gap-2"
                        size="lg"
                        title="Exportar a CSV"
                    >
                        <Download size={18} />
                        <span className="hidden md:inline">Exportar CSV</span>
                    </Button>
                    <Button onClick={() => setModalVisible(true)} className="gap-2 shadow-md hover:shadow-lg transition-all" size="lg">
                        <UserPlus size={20} />
                        Nuevo Cliente
                    </Button>
                </div>
            </div>

            <Input
                placeholder="BUSCAR POR NOMBRE O TELÉFONO..."
                className="liquid-glass mb-2"
                leftIcon={<Search size={18} />}
                value={searchQuery}
                onChange={onChangeSearch}
            />

            {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <Tag size={14} className="text-foreground/50" />
                    {allTags.map(t => (
                        <button
                            key={t}
                            onClick={() => toggleTag(t)}
                            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border transition-colors ${
                                activeTags.includes(t)
                                    ? 'bg-ios-blue text-white border-ios-blue'
                                    : 'bg-transparent text-foreground/70 border-foreground/20 hover:border-ios-blue'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                    {activeTags.length > 0 && (
                        <button
                            onClick={() => setActiveTags([])}
                            className="text-[10px] font-bold text-foreground/50 hover:text-foreground inline-flex items-center gap-1"
                        >
                            <X size={12} /> Limpiar
                        </button>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredClients.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-foreground/30">
                        <UserIcon className="mx-auto mb-4 opacity-20" size={56} />
                        <p className="text-lg font-medium">No hay clientes registrados.</p>
                    </div>
                ) : (
                    filteredClients.map(client => (
                        <button
                            key={client.id}
                            onClick={() => router.push(`/clients/${client.id}`)}
                            className="liquid-glass w-full flex items-center gap-3 p-4 rounded-[22px] hover:scale-[1.01] active:scale-[0.99] transition-all text-left group"
                        >
                            <div className="w-11 h-11 rounded-2xl bg-ios-blue/15 text-ios-blue flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                                <UserIcon size={20} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <h3 className="text-[15px] font-bold text-foreground truncate group-hover:text-ios-blue transition-colors">{client.name}</h3>
                                <div className="flex items-center text-[13px] text-foreground/50 mt-0.5">
                                    <Phone size={12} className="mr-1.5 opacity-60" />
                                    <span>{client.phone}</span>
                                </div>
                                {client.tags && client.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {client.tags.slice(0, 3).map(t => (
                                            <span key={t} className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-ios-blue/10 text-ios-blue">
                                                {t}
                                            </span>
                                        ))}
                                        {client.tags.length > 3 && (
                                            <span className="text-[9px] font-bold text-foreground/40">+{client.tags.length - 3}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <ChevronRight className="text-foreground/25 group-hover:text-ios-blue group-hover:translate-x-0.5 transition-all shrink-0" size={18} />
                        </button>
                    ))
                )}
            </div>

            {modalVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border-0">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Registrar Cliente</h2>
                            <form onSubmit={handleCreateClient} className="space-y-5">
                                <Input
                                    label="Nombre Completo"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ej: Juan Pérez"
                                    required
                                />
                                <Input
                                    label="Teléfono"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    placeholder="Ej: 04121234567"
                                    type="tel"
                                    required
                                    rightIcon={isSupported ? (
                                        <button
                                            type="button"
                                            onClick={handlePickContact}
                                            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-ios-blue"
                                            title="Importar de contactos"
                                        >
                                            <Contact2 size={20} />
                                        </button>
                                    ) : undefined}
                                />
                                <div>
                                    <Input
                                        label="Tags (separados por coma)"
                                        value={newTagsRaw}
                                        onChange={(e) => setNewTagsRaw(e.target.value)}
                                        placeholder="Ej: VIP, Mayorista"
                                    />
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {TAG_SUGGESTIONS.map(t => {
                                            const current = parseTagsInput(newTagsRaw);
                                            const active = current.includes(t);
                                            return (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => {
                                                        const next = active
                                                            ? current.filter(x => x !== t)
                                                            : [...current, t];
                                                        setNewTagsRaw(next.join(', '));
                                                    }}
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors ${
                                                        active
                                                            ? 'bg-ios-blue text-white border-ios-blue'
                                                            : 'bg-transparent text-foreground/60 border-foreground/20 hover:border-ios-blue'
                                                    }`}
                                                >
                                                    {t}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setModalVisible(false)} disabled={isSaving}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="flex-1" isLoading={isSaving}>
                                        Guardar
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

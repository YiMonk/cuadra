"use client";

import React, { useEffect, useState } from 'react';
import { ClientService } from '@/services/client.service';
import { Search, UserPlus, Phone, User as UserIcon, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { Client } from '@/types/client'; // Assuming it exported from index or similar

export default function ClientListScreen() {
    const [clients, setClients] = useState<any[]>([]); // Using any[] temporarily if types are not fully resolved
    const [filteredClients, setFilteredClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const router = useRouter();

    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = ClientService.subscribeToClients((updatedClients) => {
            setClients(updatedClients);
            setFilteredClients(updatedClients);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const onChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (!query) {
            setFilteredClients(clients);
        } else {
            setFilteredClients(clients.filter(client =>
                client.name.toLowerCase().includes(query.toLowerCase()) ||
                client.phone.includes(query)
            ));
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newPhone) return;
        setIsSaving(true);
        try {
            await ClientService.addClient({ name: newName, phone: newPhone } as any);
            setModalVisible(false);
            setNewName('');
            setNewPhone('');
        } catch (err) {
            alert("Error creando cliente");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
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
                    <p className="text-foreground/60 font-medium tracking-wide">Directorio de Clientes Registrados</p>
                </div>
                <Button onClick={() => setModalVisible(true)} className="gap-2 shadow-md hover:shadow-lg transition-all" size="lg">
                    <UserPlus size={20} />
                    Nuevo Cliente
                </Button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                    placeholder="Buscar por nombre o teléfono..."
                    className="pl-12 h-14 text-base rounded-ios-lg shadow-sm border-ios-separator/20"
                    value={searchQuery}
                    onChange={onChangeSearch}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-gray-400 dark:text-gray-600">
                        <UserIcon className="mx-auto mb-4 opacity-30" size={56} />
                        <p className="text-lg font-medium">No hay clientes registrados.</p>
                    </div>
                ) : (
                    filteredClients.map(client => (
                        <button
                            key={client.id}
                            onClick={() => router.push(`/clients/${client.id}`)}
                            className="w-full flex items-center p-4 bg-ios-secondary-bg rounded-ios-lg border border-ios-separator/10 shadow-sm transition-all duration-200 hover:shadow-md hover:border-ios-blue/30 text-left group"
                        >
                            <div className="w-12 h-12 rounded-full bg-ios-blue/10 text-ios-blue flex items-center justify-center mr-4 transition-transform group-hover:scale-110">
                                <UserIcon size={24} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <h3 className="text-lg font-bold text-foreground truncate group-hover:text-ios-blue transition-colors">{client.name}</h3>
                                <div className="flex items-center text-sm text-foreground/60 mt-1">
                                    <Phone size={14} className="mr-1.5 opacity-70" />
                                    <span>{client.phone}</span>
                                </div>
                            </div>
                            <ChevronRight className="text-ios-gray/40 group-hover:text-ios-blue transform group-hover:translate-x-1 transition-all" size={20} />
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
                                />
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

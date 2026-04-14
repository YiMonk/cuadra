"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserService, UserMetadata } from '@/services/user.service';
import { LocationService, Location } from '@/services/location.service';
import { CashboxService, Cashbox } from '@/services/cashbox.service';
import { 
    Plus, Users, Mail, Shield, Trash2, X, ShieldCheck, 
    UserPlus, Key, Home, Smartphone, Settings2, AlertTriangle, Search
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/config/firebaseConfig';

type AdminTab = 'team' | 'locations' | 'cashboxes';

export default function AdministrationScreen() {
    const router = useRouter();
    const { user: owner, isLoading: authLoading } = useAuth();
    
    // UI State
    const [activeTab, setActiveTab] = useState<AdminTab>('team');
    const [loading, setLoading] = useState(true);
    
    // Data State
    const [team, setTeam] = useState<UserMetadata[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);

    // Modals
    const [staffModalVisible, setStaffModalVisible] = useState(false);
    const [locationModalVisible, setLocationModalVisible] = useState(false);
    const [cashboxModalVisible, setCashboxModalVisible] = useState(false);
    const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ 
        id: string, 
        name: string, 
        type: 'staff' | 'location' | 'cashbox' 
    } | null>(null);

    // Form States
    const [staffName, setStaffName] = useState('');
    const [staffEmail, setStaffEmail] = useState('');
    const [staffPassword, setStaffPassword] = useState('');
    const [itemName, setItemName] = useState(''); // Shared for location/cashbox
    const [deleteInput, setDeleteInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!authLoading && owner) {
            const isGlobalAdmin = owner.role === 'admin' || owner.role === 'admingod';
            const isStaff = owner.role === 'staff';
            if (isGlobalAdmin) {
                router.replace('/admin/dashboard');
            } else if (isStaff) {
                router.replace('/pos');
            }
        }
    }, [owner, authLoading, router]);

    useEffect(() => {
        if (!owner?.uid) return;

        const unsubTeam = UserService.subscribeToTeam(owner.uid, (members) => {
            setTeam(members.filter(m => m.id !== owner.uid));
            setLoading(false);
        });

        const unsubLocations = LocationService.subscribeToLocations((data) => {
            setLocations(data);
        });

        const unsubCashboxes = CashboxService.subscribeToCashboxes((data) => {
            setCashboxes(data);
        });

        return () => {
            unsubTeam();
            unsubLocations();
            unsubCashboxes();
        };
    }, [owner]);

    // ---- Handlers ----
    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!staffName || !staffEmail || !staffPassword) return;
        setIsSaving(true);
        const secondaryAppName = `secondary-staff-${Date.now()}`;
        let secondaryApp;
        try {
            secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
            const secondaryAuth = getAuth(secondaryApp);
            const cred = await createUserWithEmailAndPassword(secondaryAuth, staffEmail.trim(), staffPassword);
            await UserService.syncUserMetadata(cred.user.uid, {
                id: cred.user.uid,
                displayName: staffName,
                email: staffEmail.trim(),
                role: 'staff',
                active: true,
                ownerId: owner!.uid,
                createdAt: Date.now()
            });
            toast.success("Miembro creado");
            setStaffModalVisible(false);
            setStaffName(''); setStaffEmail(''); setStaffPassword('');
        } catch (error: any) {
            toast.error("Error: " + (error.code === 'auth/email-already-in-use' ? "Correo en uso" : "No se pudo crear"));
        } finally {
            if (secondaryApp) await deleteApp(secondaryApp);
            setIsSaving(false);
        }
    };

    const handleCreateLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemName) return;
        setIsSaving(true);
        try {
            await LocationService.addLocation(itemName);
            toast.success("Sede agregada");
            setLocationModalVisible(false);
            setItemName('');
        } catch (e) { toast.error("Error al guardar"); }
        finally { setIsSaving(false); }
    };

    const handleCreateCashbox = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemName) return;
        setIsSaving(true);
        try {
            await CashboxService.addCashbox(itemName);
            toast.success("Caja agregada");
            setCashboxModalVisible(false);
            setItemName('');
        } catch (e) { toast.error("Error al guardar"); }
        finally { setIsSaving(false); }
    };

    const confirmDelete = async () => {
        if (!deleteConfirmModal) return;
        if (deleteInput.trim().toLowerCase() !== deleteConfirmModal.name.toLowerCase()) {
            toast.error("El nombre no coincide");
            return;
        }

        try {
            if (deleteConfirmModal.type === 'staff') await UserService.deleteUserMetadata(deleteConfirmModal.id);
            else if (deleteConfirmModal.type === 'location') await LocationService.deleteLocation(deleteConfirmModal.id);
            else if (deleteConfirmModal.type === 'cashbox') await CashboxService.deleteCashbox(deleteConfirmModal.id);
            
            toast.success("Eliminado correctamente");
            setDeleteConfirmModal(null);
            setDeleteInput('');
        } catch (e) {
            toast.error("Error al eliminar");
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-ui-text uppercase leading-none">Administración</h1>
                    <div className="flex items-center gap-2 mt-3">
                        <div className="h-1 w-8 bg-accent-primary rounded-full" />
                        <p className="text-ui-text-muted font-black uppercase tracking-[0.2em] text-[10px]">Gestión Global del Negocio</p>
                    </div>
                </div>
                
                {/* Tabs Selector */}
                <div className="ui-input-box p-1.5 flex gap-1 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                    {[
                        { id: 'team', label: 'Equipo', icon: Users },
                        { id: 'locations', label: 'Sedes', icon: Home },
                        { id: 'cashboxes', label: 'Cajas', icon: Smartphone }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as AdminTab)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                ${activeTab === tab.id ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-ui-text-muted hover:text-ui-text hover:bg-white/5'}
                            `}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-8">
                {activeTab === 'team' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-tight text-ui-text">Personal Autorizado</h2>
                            <Button onClick={() => setStaffModalVisible(true)} size="sm" className="gap-2">
                                <UserPlus size={16} /> Agregar
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {team.map(member => (
                                <Card key={member.id} className="ui-card ui-card-hover border-0 bg-white/5">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-accent-primary/20 text-accent-primary flex items-center justify-center font-black text-lg uppercase">
                                                {member.displayName[0]}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-black text-ui-text uppercase text-sm truncate">{member.displayName}</h3>
                                                <p className="text-[10px] text-ui-text-muted font-bold tracking-tight truncate">{member.email}</p>
                                            </div>
                                            <button 
                                                onClick={() => setDeleteConfirmModal({ id: member.id, name: member.displayName, type: 'staff' })}
                                                className="p-2 text-ui-text-muted hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'locations' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-tight text-ui-text">Sedes y Almacenes</h2>
                            <Button onClick={() => setLocationModalVisible(true)} size="sm" className="gap-2">
                                <Plus size={16} /> Nueva Sede
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {locations.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-ui-text-muted font-black uppercase tracking-widest text-xs opacity-50">No hay sedes registradas</div>
                            ) : (
                                locations.map(loc => (
                                    <Card key={loc.id} className="ui-card ui-card-hover border-0 bg-white/5">
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-accent-cyan/20 text-accent-cyan">
                                                    <Home size={20} />
                                                </div>
                                                <h3 className="font-black text-ui-text uppercase text-sm">{loc.name}</h3>
                                            </div>
                                            <button 
                                                onClick={() => setDeleteConfirmModal({ id: loc.id, name: loc.name, type: 'location' })}
                                                className="p-2 text-ui-text-muted hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'cashboxes' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black uppercase tracking-tight text-ui-text">Cajas Receptoras</h2>
                            <Button onClick={() => setCashboxModalVisible(true)} size="sm" className="gap-2">
                                <Plus size={16} /> Nueva Caja
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cashboxes.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-ui-text-muted font-black uppercase tracking-widest text-xs opacity-50">No hay cajas registradas</div>
                            ) : (
                                cashboxes.map(box => (
                                    <Card key={box.id} className="ui-card ui-card-hover border-0 bg-white/5">
                                        <CardContent className="p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-accent-primary/20 text-accent-primary">
                                                    <Smartphone size={20} />
                                                </div>
                                                <h3 className="font-black text-ui-text uppercase text-sm">{box.name}</h3>
                                            </div>
                                            <button 
                                                onClick={() => setDeleteConfirmModal({ id: box.id, name: box.name, type: 'cashbox' })}
                                                className="p-2 text-ui-text-muted hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals Implementation (Abbreviated for clarity, but functional) */}
            
            {/* Create Staff Modal */}
            {staffModalVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg">
                    <Card className="w-full max-w-md bg-slate-900/90 border-white/10 rounded-[32px] overflow-hidden">
                        <CardContent className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Nuevo Staff</h2>
                                <button onClick={() => setStaffModalVisible(false)}><X className="text-white/50 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleCreateStaff} className="space-y-4">
                                <Input label="NOMBRE" value={staffName} onChange={e => setStaffName(e.target.value)} required />
                                <Input label="EMAIL" type="email" value={staffEmail} onChange={e => setStaffEmail(e.target.value)} required />
                                <Input label="PASSWORD" type="password" value={staffPassword} onChange={e => setStaffPassword(e.target.value)} required />
                                <Button type="submit" className="w-full h-14" isLoading={isSaving}>GUARDAR</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Simple Create Item Modal (Reusable for Location/Cashbox) */}
            {(locationModalVisible || cashboxModalVisible) && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg">
                    <Card className="w-full max-w-sm bg-slate-900/90 border-white/10 rounded-[32px]">
                        <CardContent className="p-8 space-y-6">
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Agregar {locationModalVisible ? 'Sede' : 'Caja'}</h2>
                            <form onSubmit={locationModalVisible ? handleCreateLocation : handleCreateCashbox} className="space-y-4">
                                <Input label="NOMBRE" value={itemName} onChange={e => setItemName(e.target.value)} placeholder="Ej: Central" required />
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => {setLocationModalVisible(false); setCashboxModalVisible(false);}}>CANCELAR</Button>
                                    <Button type="submit" className="flex-1" isLoading={isSaving}>CREAR</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* GitHub Style Delete Confirmation */}
            {deleteConfirmModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <Card className="w-full max-w-md bg-red-950/20 border-red-500/50 rounded-[32px] overflow-hidden">
                        <CardContent className="p-8 space-y-6">
                            <div className="flex flex-col items-center text-center gap-4">
                                <AlertTriangle size={48} className="text-red-500 animate-pulse" />
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">¿Estás seguro?</h2>
                                    <p className="text-xs text-red-200/60 font-bold uppercase tracking-widest mt-1">Esta acción es irreversible</p>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Escribe el nombre para confirmar:</p>
                                <p className="text-lg font-black text-white mt-1 uppercase">{deleteConfirmModal.name}</p>
                            </div>

                            <Input 
                                value={deleteInput} 
                                onChange={e => setDeleteInput(e.target.value)} 
                                placeholder="Escribe el nombre aquí..."
                                className="text-center font-black uppercase tracking-widest bg-black/40 border-red-500/30"
                            />

                            <div className="flex gap-4">
                                <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmModal(null)}>CANCELAR</Button>
                                <Button 
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 shadow-[0_0_20px_rgba(220,38,38,0.3)]" 
                                    disabled={deleteInput.trim().toLowerCase() !== deleteConfirmModal.name.toLowerCase()}
                                    onClick={confirmDelete}
                                >
                                    ELIMINAR
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

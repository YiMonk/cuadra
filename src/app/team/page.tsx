"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserService, UserMetadata } from '@/services/user.service';
import { Plus, Users, Mail, Shield, Trash2, X, ShieldCheck, UserPlus, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/config/firebaseConfig';

export default function TeamManagementScreen() {
    const router = useRouter();
    const { user: owner, isLoading: authLoading } = useAuth();
    const [team, setTeam] = useState<UserMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    React.useEffect(() => {
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
    
    // New staff form
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (owner?.uid) {
            loadTeam();
        }
    }, [owner]);

    const loadTeam = async () => {
        setLoading(true);
        try {
            const members = await UserService.getTeamMembers(owner!.uid);
            // Filter out the owner themselves
            setTeam(members.filter(m => m.id !== owner!.uid));
        } catch (error) {
            console.error(error);
            toast.error("Error cargando equipo");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password) return;
        if (password.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            return;
        }

        setIsSaving(true);
        // Use a secondary app to create user without signing out the owner
        const secondaryAppName = `secondary-app-${Date.now()}`;
        let secondaryApp;
        
        try {
            secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
            const secondaryAuth = getAuth(secondaryApp);
            
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
            const uid = userCredential.user.uid;

            // Sync metadata
            await UserService.syncUserMetadata(uid, {
                id: uid,
                displayName: name,
                email: email.trim(),
                role: 'staff',
                active: true,
                ownerId: owner!.uid,
                createdAt: Date.now()
            });

            toast.success("Miembro del equipo creado con éxito");
            setModalVisible(false);
            setName('');
            setEmail('');
            setPassword('');
            loadTeam();
        } catch (error: any) {
            console.error(error);
            let msg = "Error al crear el usuario";
            if (error.code === 'auth/email-already-in-use') msg = "Este correo ya está registrado";
            toast.error(msg);
        } finally {
            if (secondaryApp) {
                await deleteApp(secondaryApp);
            }
            setIsSaving(false);
        }
    };

    const handleDeleteMember = async (uid: string, name: string) => {
        toast.warning(`¿Eliminar a ${name}?`, {
            description: "Esta acción quitará el acceso al sistema para este usuario.",
            action: {
                label: 'Eliminar',
                onClick: async () => {
                    try {
                        await UserService.deleteUserMetadata(uid);
                        toast.success("Usuario eliminado del equipo");
                        loadTeam();
                    } catch (error) {
                        toast.error("Error al eliminar");
                    }
                }
            },
            cancel: { label: 'Cancelar' }
        });
    };

    if (loading || authLoading || (owner?.role === 'admin' || owner?.role === 'admingod' || owner?.role === 'staff')) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                <span className="ml-3 text-ui-text-muted font-black tracking-widest uppercase text-xs">
                    {loading ? 'Cargando Equipo...' : 'Redirigiendo...'}
                </span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-ui-text uppercase">Mi Equipo</h1>
                    <p className="text-ui-text-muted font-bold mt-2 uppercase tracking-[0.2em] text-xs">
                        Gestiona los accesos de tus vendedores y colaboradores
                    </p>
                </div>
                <Button onClick={() => setModalVisible(true)} size="lg" className="shadow-float gap-2">
                    <UserPlus size={20} /> Nuevo Miembro
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.length === 0 ? (
                    <div className="col-span-full py-20 text-center ui-card border-dashed border-2 border-white/10 opacity-40">
                        <Users className="mx-auto mb-4" size={48} />
                        <p className="font-black uppercase tracking-widest text-sm">No has agregado miembros todavía</p>
                    </div>
                ) : (
                    team.map(member => (
                        <Card key={member.id} className="border-0 shadow-lg bg-white/5 backdrop-blur-sm group hover:bg-white/10 transition-all duration-300">
                            <CardContent className="p-6 relative">
                                <button 
                                    onClick={() => handleDeleteMember(member.id, member.displayName)}
                                    className="absolute top-4 right-4 p-2 text-ui-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-accent-primary/10 text-accent-primary flex items-center justify-center font-black text-xl shadow-inner">
                                        {member.displayName[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-ui-text uppercase tracking-tight truncate leading-tight">{member.displayName}</h3>
                                        <div className="flex items-center gap-1.5 text-ui-text-muted font-bold text-[10px] uppercase tracking-widest mt-1">
                                            <Mail size={12} className="opacity-50" />
                                            <span className="truncate">{member.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${member.role === 'admin' ? 'bg-accent-primary/10 text-accent-primary' : 'bg-accent-success/10 text-accent-success'}`}>
                                        <ShieldCheck size={12} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Rol: {member.role}</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-ui-text-muted italic opacity-50">
                                        Activo
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {modalVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-in fade-in duration-300">
                    <Card className="w-full max-w-md shadow-2xl border-white/10 bg-slate-900/40 backdrop-blur-3xl rounded-[40px] animate-in zoom-in-95 duration-300 overflow-hidden">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Registrar Staff</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Nuevo colaborador comercial</p>
                                </div>
                                <button onClick={() => setModalVisible(false)} className="p-2 text-gray-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateStaff} className="space-y-5">
                                <Input 
                                    label="NOMBRE COMPLETO"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Juan Vendedor"
                                    className="bg-white/5"
                                    required
                                />
                                <Input 
                                    label="CORREO ELECTRÓNICO (LOGIN)"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="personal@negocio.com"
                                    className="bg-white/5"
                                    required
                                />
                                <div className="relative">
                                    <Input 
                                        label="CONTRASEÑA TEMPORAL"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min. 6 caracteres"
                                        className="bg-white/5 pr-12"
                                        required
                                    />
                                    <Key className="absolute right-4 top-[42px] text-gray-600" size={18} />
                                </div>

                                <div className="p-4 bg-accent-primary/5 rounded-2xl border border-accent-primary/10 flex items-start gap-3">
                                    <Shield className="text-accent-primary shrink-0" size={18} />
                                    <p className="text-[10px] text-ui-text-muted font-bold leading-relaxed uppercase tracking-wide">
                                        El personal podrá vender, ver stock y registrar clientes. No podrán ver reportes ni configuraciones.
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="outline" className="flex-1 uppercase font-black tracking-widest h-14" onClick={() => setModalVisible(false)} disabled={isSaving}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="flex-1 uppercase font-black tracking-widest h-14 shadow-float" isLoading={isSaving} disabled={isSaving}>
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

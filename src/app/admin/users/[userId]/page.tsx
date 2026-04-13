"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { UserService, UserMetadata } from '@/services/user.service';
import { useAuth } from '@/context/AuthContext';
import { 
    ChevronLeft, Shield, User as UserIcon, Calendar, Clock, AlertCircle, 
    CheckCircle2, XCircle, Trash2, Save, Plus, Minus, Mail, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
    const resolvedParams = use(params);
    const userId = resolvedParams.userId;
    const router = useRouter();
    const { user: currentUser } = useAuth();
    
    const [userMeta, setUserMeta] = useState<UserMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form inputs
    const [displayName, setDisplayName] = useState('');
    const [active, setActive] = useState(true);
    const [daysToAdd, setDaysToAdd] = useState('30');

    useEffect(() => {
        loadUser();
    }, [userId]);

    const loadUser = async () => {
        setLoading(true);
        try {
            const data = await UserService.getUserById(userId);
            if (data) {
                setUserMeta(data);
                setDisplayName(data.displayName || '');
                setActive(data.active);
            } else {
                toast.error('Usuario no encontrado');
                router.push('/admin/users');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error cargando usuario');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBasic = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await UserService.updateUser(userId, {
                displayName,
                active
            });
            toast.success('Perfil actualizado');
            loadUser();
        } catch (error) {
            toast.error('No se pudo actualizar el perfil');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddSubscription = async () => {
        if (!userMeta) return;
        const days = parseInt(daysToAdd) || 0;
        if (days <= 0) return;

        setIsSaving(true);
        try {
            const currentEnd = userMeta.subscriptionEndsAt && userMeta.subscriptionEndsAt > Date.now() 
                ? userMeta.subscriptionEndsAt 
                : Date.now();
            
            const newEnd = currentEnd + (days * 24 * 60 * 60 * 1000);
            
            await UserService.updateUser(userId, {
                subscriptionEndsAt: newEnd,
                active: true // Reactivate if was inactive
            });
            
            toast.success(`Suscripción extendida por ${days} días`);
            loadUser();
        } catch (error) {
            toast.error('Error al extender suscripción');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeactivate = async () => {
        setIsSaving(true);
        try {
            await UserService.updateUser(userId, { active: !active });
            setActive(!active);
            toast.success(active ? 'Usuario deshabilitado' : 'Usuario habilitado');
        } catch (error) {
            toast.error('Error al cambiar estado');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async () => {
        toast.error('¿Estás seguro de eliminar los METADATOS de este usuario?', {
            description: 'Esto no elimina la cuenta de autenticación, pero borrará su perfil en la base de datos.',
            action: {
                label: 'Eliminar permanentemente',
                onClick: async () => {
                    setIsDeleting(true);
                    try {
                        await UserService.deleteUserMetadata(userId);
                        toast.success('Metadatos eliminados');
                        router.push('/admin/users');
                    } catch (error) {
                        toast.error('Error eliminando metadatos');
                    } finally {
                        setIsDeleting(false);
                    }
                }
            },
            cancel: { label: 'Cancelar' }
        });
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
                <span className="ml-3 text-ui-text-muted font-black tracking-widest uppercase text-xs">Cargando Perfil...</span>
            </div>
        );
    }

    if (!userMeta) return null;

    const daysLeft = userMeta.subscriptionEndsAt 
        ? Math.ceil((userMeta.subscriptionEndsAt - Date.now()) / (1000 * 60 * 60 * 24)) 
        : 0;
    const isExpired = userMeta.subscriptionEndsAt ? userMeta.subscriptionEndsAt < Date.now() : true;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-ui-text-muted hover:text-accent-primary transition-all font-black uppercase tracking-widest text-[10px] bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl"
            >
                <ChevronLeft size={16} /> Volver al Directorio
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center shadow-float
                        ${userMeta.role === 'admin' ? 'bg-accent-primary/10 text-accent-primary' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}
                    `}>
                        {userMeta.role === 'admin' ? <Shield size={40} /> : <UserIcon size={40} />}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-ui-text uppercase leading-none">{userMeta.displayName}</h1>
                        <p className="text-ui-text-muted font-bold mt-2 uppercase tracking-widest text-xs flex items-center gap-2">
                            <Mail size={14} className="opacity-50" /> {userMeta.email}
                        </p>
                    </div>
                </div>
                
                <div className={`px-6 py-3 rounded-2xl flex items-center gap-3 border shadow-sm
                    ${userMeta.active && !isExpired ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-500'}
                `}>
                    {userMeta.active && !isExpired ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                    <span className="font-black uppercase tracking-widest text-[11px]">
                        {userMeta.active ? (isExpired ? 'Suscripción Vencida' : 'Cuenta Activa') : 'Cuenta Deshabilitada'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Subscription Management */}
                <Card className="border-0 shadow-lg bg-linear-to-br from-accent-primary/5 to-transparent">
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="text-accent-primary" size={20} />
                            <h3 className="font-black text-ui-text uppercase tracking-widest text-sm">Control de Suscripción</h3>
                        </div>

                        <div className="p-6 ui-input-box bg-white/40 dark:bg-black/20 border-white/20">
                            <p className="text-[10px] font-black text-ui-text-muted uppercase tracking-widest mb-1">Días Restantes</p>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-black tracking-tighter ${isExpired ? 'text-red-500' : 'text-ui-text'}`}>
                                    {isExpired ? 0 : daysLeft}
                                </span>
                                <span className="text-xs font-bold text-ui-text-muted uppercase tracking-widest">Días</span>
                            </div>
                            {userMeta.subscriptionEndsAt && (
                                <p className="text-[10px] font-bold text-ui-text-muted mt-2 uppercase">
                                    Vence el: {new Date(userMeta.subscriptionEndsAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <p className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted">Añadir Tiempo de Actividad</p>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <Input 
                                        type="number" 
                                        value={daysToAdd} 
                                        onChange={(e) => setDaysToAdd(e.target.value)}
                                        placeholder="Días"
                                        className="h-14 font-black text-xl"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-ui-text-muted uppercase pointer-events-none">Días</span>
                                </div>
                                <Button className="h-14 px-8" onClick={handleAddSubscription} isLoading={isSaving} disabled={isSaving}>
                                    Añadir
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                {['7', '30', '90', '365'].map(d => (
                                    <button 
                                        key={d}
                                        onClick={() => setDaysToAdd(d)}
                                        className="px-4 py-2 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 text-[10px] font-black uppercase tracking-widest text-ui-text-muted transition-all active:scale-95"
                                    >
                                        +{d}d
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Settings */}
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Clock className="text-orange-500" size={20} />
                            <h3 className="font-black text-ui-text uppercase tracking-widest text-sm">Estado de Cuenta</h3>
                        </div>

                        <form onSubmit={handleUpdateBasic} className="space-y-6">
                            <Input 
                                label="NOMBRE PARA MOSTRAR"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="Nombre completo"
                            />

                            <div className="flex items-center justify-between p-6 ui-input-box border border-ui-border">
                                <div>
                                    <p className="font-black text-ui-text uppercase tracking-tight">Acceso al Sistema</p>
                                    <p className="text-[10px] text-ui-text-muted font-bold mt-1 uppercase tracking-widest">
                                        {active ? 'Cuenta habilitada actualmente' : 'Acceso restringido'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActive(!active)}
                                    className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${active ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <Button type="submit" className="w-full h-14 uppercase tracking-[0.2em] font-black" isLoading={isSaving}>
                                <Save size={18} className="mr-2" /> Guardar Cambios
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Critical Actions */}
            <div className="pt-8 border-t border-ui-border flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3 text-red-500/60 p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                    <AlertCircle size={20} />
                    <p className="text-[10px] font-bold uppercase tracking-widest max-w-[400px]">
                        Las acciones de eliminación de metadatos son irreversibles. No eliminarán la cuenta de Email del usuario.
                    </p>
                </div>
                
                <button 
                    onClick={handleDeleteUser}
                    className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-6 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[11px] border border-red-500/20 active:scale-95"
                    disabled={isDeleting}
                >
                    <Trash2 size={18} /> {isDeleting ? 'Eliminando...' : 'Eliminar Metadatos'}
                </button>
            </div>
        </div>
    );
}

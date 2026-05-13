"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { UserService, UserMetadata } from '@/services/user.service';
import { AuthManagementService } from '@/services/authManagement.service';
import { useAuth } from '@/context/AuthContext';
import { 
    ChevronLeft, Shield, User as UserIcon, Calendar, Clock, AlertCircle, 
    CheckCircle2, XCircle, Trash2, Save, Plus, Minus, Mail, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';
import { ActivityService } from '@/services/activity.service';

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
    const resolvedParams = use(params);
    const userId = resolvedParams.userId;
    const router = useRouter();
    const { user: currentUser } = useAuth();
    
    const [userMeta, setUserMeta] = useState<UserMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Deletion Modal State
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');

    // Form inputs
    const [displayName, setDisplayName] = useState('');
    const [active, setActive] = useState(true);
    const [daysToAdd, setDaysToAdd] = useState('30');
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        loadUser();
        loadHistory();
    }, [userId]);

    const loadHistory = async () => {
        try {
            const logs = await ActivityService.getUserHistory(userId);
            setHistory(logs);
        } catch (error) {
            console.error("Error loading history:", error);
        }
    };

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
            if (currentUser) {
                await ActivityService.logAction({
                    action: 'user_status_changed',
                    targetUserId: userId,
                    targetUserName: userMeta?.displayName || 'Usuario',
                    adminId: currentUser.uid,
                    adminName: currentUser.displayName || 'Admin',
                    details: `Perfil de usuario actualizado. Nombre: ${displayName}, Estado: ${active ? 'Activo' : 'Inactivo'}`
                });
            }
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
            
            if (currentUser) {
                await ActivityService.logAction({
                    action: 'subscription_extended',
                    targetUserId: userId,
                    targetUserName: userMeta.displayName,
                    adminId: currentUser.uid,
                    adminName: currentUser.displayName || 'Admin',
                    details: `Se extendió la suscripción por ${days} días.`
                });
            }
            
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

    const handleDeleteUser = () => {
        setDeleteEmailConfirm('');
        setDeleteModalVisible(true);
    };

    const handleConfirmDelete = async () => {
        if (!userMeta || deleteEmailConfirm !== userMeta.email) return;

        setIsDeleting(true);
        try {
            await AuthManagementService.deleteUser(userId);

            if (currentUser) {
                await ActivityService.logAction({
                    action: 'user_deleted',
                    targetUserId: userId,
                    targetUserName: userMeta.displayName,
                    adminId: currentUser.uid,
                    adminName: currentUser.displayName || 'Admin',
                    details: `Usuario eliminado permanentemente: ${userMeta.displayName} (${userMeta.email})`
                });
            }
            toast.success('Usuario y metadatos eliminados permanentemente del sistema');
            setDeleteModalVisible(false);
            router.push('/admin/users');
        } catch (error) {
            toast.error('Error eliminando usuario');
        } finally {
            setIsDeleting(false);
        }
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

            {/* User Activity History */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                    <LayoutGrid className="text-accent-primary" size={20} />
                    <h3 className="font-black text-ui-text uppercase tracking-widest text-sm">Historial de Actividad Administrativa</h3>
                </div>

                <div className="space-y-3">
                    {history.length === 0 ? (
                        <div className="p-12 text-center ui-card border border-dashed border-ui-border">
                            <Clock className="mx-auto mb-4 opacity-10" size={40} />
                            <p className="text-[10px] font-black text-ui-text-muted uppercase tracking-widest">No hay registros de actividad aún</p>
                        </div>
                    ) : (
                        history.map((log) => (
                            <div key={log.id} className="p-5 ui-card border border-ui-border hover:border-accent-primary/20 transition-all flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                                    ${log.action === 'user_created' ? 'bg-emerald-500/10 text-emerald-500' :
                                      log.action === 'subscription_extended' ? 'bg-blue-500/10 text-blue-500' :
                                      log.action === 'user_status_changed' ? 'bg-amber-500/10 text-amber-500' : 'bg-gray-500/10 text-gray-500'}
                                `}>
                                    {log.action === 'user_created' ? <Plus size={20} /> :
                                     log.action === 'subscription_extended' ? <Calendar size={20} /> :
                                     log.action === 'user_status_changed' ? <Shield size={20} /> : <Clock size={20} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-ui-text leading-relaxed">{log.details}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-ui-text-muted uppercase tracking-widest">
                                            <UserIcon size={12} className="opacity-50" /> {log.adminName}
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-ui-border" />
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-ui-text-muted uppercase">
                                            <Clock size={12} className="opacity-50" /> {new Date(log.createdAt).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Critical Actions */}
            <div className="pt-8 border-t border-ui-border flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3 text-red-500/60 p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                    <AlertCircle size={20} />
                    <p className="text-[10px] font-bold uppercase tracking-widest max-w-[400px]">
                        Las acciones de eliminación son irreversibles. Se borrará permanentemente todo el perfil y configuración del usuario en la base de datos.
                    </p>
                </div>
                
                <button 
                    onClick={handleDeleteUser}
                    className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-6 py-4 rounded-2xl transition-all font-black uppercase tracking-widest text-[11px] border border-red-500/20 active:scale-95"
                    disabled={isDeleting}
                >
                    <Trash2 size={18} /> {isDeleting ? 'Eliminando...' : 'Eliminar Usuario'}
                </button>
            </div>

            {/* GitHub style Critical Deletion Modal */}
            {deleteModalVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="w-full max-w-md shadow-2xl border-red-500/10 bg-white/95 dark:bg-gray-900/90 backdrop-blur-3xl rounded-[32px] animate-in zoom-in-95 duration-300 overflow-hidden">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                        <AlertCircle className="text-red-500" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-ui-text uppercase tracking-tighter leading-none">Eliminar Usuario</h2>
                                    </div>
                                </div>
                                <button onClick={() => setDeleteModalVisible(false)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                    Esta acción es <strong className="text-red-500">irreversible</strong>. Se eliminará permanentemente la cuenta de usuario, todos sus registros, y su configuración en la plataforma.
                                </p>
                                
                                <div className="p-5 bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-500/10 shadow-inner">
                                    <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest text-center mb-3">
                                        Para confirmar, escribe el correo del usuario:
                                    </p>
                                    <p className="text-sm font-black text-center text-ui-text select-all bg-white dark:bg-black/20 p-2 rounded-lg border border-red-100 dark:border-white/5">
                                        {userMeta.email}
                                    </p>
                                </div>

                                <Input 
                                    value={deleteEmailConfirm}
                                    onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                                    placeholder="Confirmar correo completo..."
                                    className="font-mono text-center h-14 tracking-wide"
                                />

                                <div className="flex gap-4 pt-2">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        className="flex-1 uppercase font-black tracking-widest h-14" 
                                        onClick={() => { setDeleteModalVisible(false); setDeleteEmailConfirm(''); }} 
                                        disabled={isDeleting}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button 
                                        variant="danger"
                                        className="flex-1 uppercase font-black tracking-widest h-14" 
                                        isLoading={isDeleting} 
                                        disabled={deleteEmailConfirm !== userMeta.email || isDeleting}
                                        onClick={handleConfirmDelete}
                                    >
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

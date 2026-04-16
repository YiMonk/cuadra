"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserService, UserMetadata } from '@/services/user.service';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Search, Shield, User as UserIcon, ShieldAlert, ArrowRight, UserCog, Calendar, Clock, UserPlus, X, Key, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/config/firebaseConfig';

export default function AdminUserManagementPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<UserMetadata[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admingod' | 'admin' | 'owner' | 'staff'>('all');

    // New User Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [subDays, setSubDays] = useState('30');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await UserService.getUsers();
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesQuery =
                u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'all' || u.role === roleFilter;
            return matchesQuery && matchesRole;
        });
    }, [users, searchQuery, roleFilter]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newEmail || !newPassword) return;
        
        setIsSaving(true);
        const secondaryAppName = `admin-reg-${Date.now()}`;
        let secondaryApp;
        
        try {
            secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
            const secondaryAuth = getAuth(secondaryApp);
            
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail.trim(), newPassword);
            const uid = userCredential.user.uid;

            const subscriptionEndsAt = Date.now() + (parseInt(subDays) * 24 * 60 * 60 * 1000);

            // Create as 'owner' (Merchant) by default when created by global admin
            await UserService.syncUserMetadata(uid, {
                id: uid,
                displayName: newName,
                email: newEmail.trim(),
                role: 'owner',
                active: true,
                ownerId: uid,
                subscriptionEndsAt,
                createdAt: Date.now()
            });

            toast.success("Usuario registrado con éxito");
            setModalVisible(false);
            setNewName('');
            setNewEmail('');
            setNewPassword('');
            loadUsers();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Error al crear usuario");
        } finally {
            if (secondaryApp) await deleteApp(secondaryApp);
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500 font-medium tracking-wide">Cargando Directorio...</span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase tracking-tighter">Directorio</h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase text-[10px] tracking-[0.2em] mt-1">Gestión Central de Usuarios</p>
                </div>
                <Button onClick={() => setModalVisible(true)} className="shadow-float gap-2" size="lg">
                    <UserPlus size={18} /> Nuevo Usuario
                </Button>
            </div>

            <Card className="shadow-sm">
                <CardContent className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            placeholder="Buscar por nombre o email..."
                            className="pl-12 h-12 text-base"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {(['all', 'admin', 'admingod', 'owner', 'staff'] as const).map(role => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-4 py-2 rounded-xl text-[11px] uppercase tracking-widest font-black transition-all duration-200 border ${roleFilter === role
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20 scale-105'
                                        : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-100 dark:border-gray-800 text-gray-500'
                                    }`}
                            >
                                {role === 'all' ? 'Todos' : 
                                 role === 'admin' ? 'Admin Global' : 
                                 role === 'admingod' ? 'Master' : 
                                 role === 'owner' ? 'Tiendas' : 'Vendedores'}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4 mt-6">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-20 text-ui-text-muted/30">
                        <UserCog className="mx-auto mb-6 opacity-20" size={64} />
                        <p className="text-xl font-black uppercase tracking-widest">No hay usuarios registrados</p>
                    </div>
                ) : (
                    filteredUsers.map(item => (
                        <button
                            key={item.id}
                            onClick={() => router.push(`/admin/users/${item.id}`)}
                            className="w-full flex items-center p-6 ui-card border border-ui-border hover:border-accent-primary/40 transition-all duration-300 group text-left relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-accent-primary/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center mr-8 shadow-inner transition-transform group-hover:scale-110 shrink-0
                                ${item.role === 'admin' || item.role === 'admingod' ? 'bg-accent-primary/10 text-accent-primary'
                                : item.role === 'owner' ? 'bg-accent-success/10 text-accent-success'
                                : 'bg-black/5 dark:bg-white/5 text-ui-text-muted'}`}
                            >
                                {item.role === 'admingod' ? <ShieldAlert size={32} /> : item.role === 'admin' ? <Shield size={32} /> : <UserIcon size={32} />}
                            </div>
 
                            <div className="flex-1 min-w-0 relative z-10">
                                <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <h3 className="text-2xl font-black text-ui-text uppercase tracking-tighter transition-colors group-hover:text-accent-primary truncate">
                                        {item.displayName}
                                    </h3>
                                    <div className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.2em] border
                                        ${item.role === 'admingod' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' : 
                                          item.role === 'admin' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' : 
                                          item.role === 'owner' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 
                                          'bg-black/5 dark:bg-white/5 text-ui-text-muted border-ui-border/50'}
                                    `}>
                                        {item.role === 'admingod' ? 'Master' : item.role === 'admin' ? 'Gestor' : item.role === 'owner' ? 'Socio' : 'Colaborador'}
                                    </div>
                                    {item.id === user?.uid && (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[8px] font-black tracking-[0.2em] shadow-lg shadow-amber-500/20">MI CUENTA</span>
                                    )}
                                </div>
                                <p className="text-[11px] font-bold text-ui-text-muted truncate lowercase opacity-70 mb-4">{item.email}</p>
                                
                                <div className="flex flex-wrap items-center gap-4">
                                    {(item.role === 'admin' || item.role === 'owner') && (
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border
                                            ${!item.subscriptionEndsAt ? 'bg-black/5 dark:bg-white/5 text-ui-text-muted border-ui-border/50' :
                                              item.subscriptionEndsAt < Date.now() ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-accent-success/10 text-accent-success border-accent-success/20'}
                                        `}>
                                            <Calendar size={14} className="opacity-70" />
                                            {!item.subscriptionEndsAt ? 'Verificando...' :
                                             item.subscriptionEndsAt < Date.now() ? 'Expirado' : 
                                             `${Math.ceil((item.subscriptionEndsAt - Date.now()) / (1000 * 60 * 60 * 24))} días`}
                                        </div>
                                    )}
                                    
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border
                                        ${item.active ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}
                                    `}>
                                        <CheckCircle2 size={14} className="opacity-70" />
                                        {item.active ? 'Operativo' : 'Suspendido'}
                                    </div>
                                </div>
                            </div>
 
                            <div className="ml-6 flex items-center justify-center w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300">
                                <ArrowRight className="text-ui-text" size={20} />
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/* Create User Modal */}
            {modalVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <Card className="w-full max-w-md shadow-2xl border-white/10 bg-white/95 dark:bg-gray-900/90 backdrop-blur-3xl rounded-[32px] animate-in zoom-in-95 duration-300 overflow-hidden">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-ui-text uppercase tracking-tighter">Registrar Dueño</h2>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Nueva Suscripción Cuadra</p>
                                </div>
                                <button onClick={() => setModalVisible(false)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateUser} className="space-y-5">
                                <Input 
                                    label="NOMBRE DEL DUEÑO / NEGOCIO"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Ej: Inversiones Pedro"
                                    required
                                />
                                <Input 
                                    label="CORREO ELECTRÓNICO"
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="correo@cliente.com"
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Input 
                                            label="CONTRASEÑA"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••"
                                            required
                                        />
                                        <Key className="absolute right-3 top-[38px] text-gray-300" size={16} />
                                    </div>
                                    <Input 
                                        label="DÍAS ACTIVOS"
                                        type="number"
                                        value={subDays}
                                        onChange={(e) => setSubDays(e.target.value)}
                                        placeholder="30"
                                        required
                                    />
                                </div>

                                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex items-start gap-3">
                                    <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={16} />
                                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed uppercase tracking-wider">
                                        El usuario será registrado con el rol de <b>TIENDA (Owner)</b>. Tendrá acceso completo a POS, Inventario y Reportes durante el periodo asignado.
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="outline" className="flex-1 uppercase font-black tracking-widest h-14" onClick={() => setModalVisible(false)} disabled={isSaving}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="flex-1 uppercase font-black tracking-widest h-14" isLoading={isSaving} disabled={isSaving}>
                                        Registrar
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

"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { UserService } from '@/services/user.service';
import { auth } from '@/config/firebaseConfig';
import { updateProfile, verifyBeforeUpdateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { User, LogOut, Moon, Sun, Shield, Settings2, Edit3, X, Mail, Lock, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function SettingsScreen() {
    const { user, signOut, isLoading, reloadUser } = useAuth();
    const { theme, setTheme } = useTheme();

    const [profileDialogVisible, setProfileDialogVisible] = useState(false);
    const [newName, setNewName] = useState(user?.displayName || '');
    const [newEmail, setNewEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [updating, setUpdating] = useState(false);

    const isDark = theme === 'dark';

    const handleLogout = () => {
        toast.warning('¿Estás seguro que deseas salir?', {
            action: {
                label: 'Cerrar Sesión',
                onClick: () => signOut()
            },
            cancel: { label: 'Cancelar', onClick: () => {} }
        });
    };

    const validateEmail = (email: string) => {
        return String(email)
            .toLowerCase()
            .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        if (newEmail.trim() !== currentUser.email && !validateEmail(newEmail.trim())) {
            toast.error('Por favor, ingresa un correo electrónico válido.');
            return;
        }

        setUpdating(true);
        let emailChanged = false;

        try {
            // Re-auth if sensitive changes
            if ((newEmail.trim() !== currentUser.email || newPassword.trim()) && currentPassword) {
                const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword);
                await reauthenticateWithCredential(currentUser, credential);
            } else if ((newEmail.trim() !== currentUser.email || newPassword.trim()) && !currentPassword) {
                toast.error('Para cambiar tu correo o contraseña, debes ingresar tu contraseña actual.');
                setUpdating(false);
                return;
            }

            // Update Name
            if (newName.trim() !== currentUser.displayName) {
                await updateProfile(currentUser, { displayName: newName.trim() });
            }

            // Update Email
            if (newEmail.trim() !== currentUser.email) {
                await verifyBeforeUpdateEmail(currentUser, newEmail.trim());
                emailChanged = true;
            }

            // Update Password
            if (newPassword.trim()) {
                await updatePassword(currentUser, newPassword.trim());
            }

            // Sync Firestore
            await UserService.syncUserMetadata(currentUser.uid, {
                displayName: newName.trim(),
                email: emailChanged ? (currentUser.email || '') : newEmail.trim()
            });

            await reloadUser();

            if (emailChanged) {
                toast.success(`Se ha enviado un correo de verificación a ${newEmail}.`);
            } else {
                toast.success('Perfil actualizado correctamente');
            }

            setProfileDialogVisible(false);
            setCurrentPassword('');
            setNewPassword('');
        } catch (error: any) {
            console.error(error);
            if (error.code?.includes('wrong-password') || error.code?.includes('invalid-credential')) {
                toast.error('La contraseña actual es incorrecta o la sesión ha expirado.');
            } else {
                toast.error(error.message || 'No se pudo actualizar el perfil');
            }
        } finally {
            setUpdating(false);
        }
    };

    if (isLoading) return null;

    return (
        <div className="p-4 md:p-12 max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-ui-text uppercase leading-none">Settings</h1>
                    <p className="text-ui-text-muted font-bold mt-3 uppercase tracking-[0.3em] text-[10px] flex items-center gap-2">
                        <Settings2 size={14} className="text-accent-primary" /> Sistema / Perfil de Usuario
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Perfil Header - Bento Style */}
                <div className="md:col-span-12 lg:col-span-4 ui-card border border-ui-border p-8 flex flex-col items-center text-center relative overflow-hidden group shadow-float">
                    <div className="absolute inset-x-0 top-0 h-1 bg-accent-primary shadow-[0_0_20px_rgba(0,122,255,0.5)]" />
                    
                    <div className="w-24 h-24 rounded-3xl bg-linear-to-tr from-accent-primary to-accent-secondary p-1 mb-6 shadow-xl group-hover:scale-105 transition-transform duration-500">
                        <div className="w-full h-full bg-white dark:bg-black rounded-[22px] flex items-center justify-center">
                            <span className="text-4xl font-black text-transparent bg-clip-text bg-linear-to-tr from-accent-primary to-accent-secondary italic">
                                {user?.displayName?.[0] || 'U'}
                            </span>
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-ui-text mb-1 uppercase tracking-tighter">
                        {user?.displayName || 'Usuario'}
                    </h2>
                    <p className="text-[11px] font-bold text-ui-text-muted mb-6 uppercase tracking-[0.2em] opacity-80">
                        {user?.email}
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                        {user?.role === 'admingod' ? (
                            <span className="px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-amber-500/20">⭐ Master</span>
                        ) : user?.role === 'admin' ? (
                            <span className="px-3 py-1 bg-accent-primary text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-blue-500/20">Administrador</span>
                        ) : (
                            <span className="px-3 py-1 bg-accent-success text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full">Colaborador</span>
                        )}
                        <span className="px-3 py-1 bg-ui-bg dark:bg-white/5 border border-ui-border text-ui-text-muted text-[9px] font-black uppercase tracking-[0.2em] rounded-full">Activo</span>
                    </div>

                    <button
                        className="ui-btn ui-btn-primary w-full gap-3 py-4 text-xs group/btn relative overflow-hidden"
                        onClick={() => {
                            setNewName(user?.displayName || '');
                            setNewEmail(user?.email || '');
                            setCurrentPassword('');
                            setNewPassword('');
                            setProfileDialogVisible(true);
                        }}
                    >
                        <Edit3 size={16} /> <span>Gestionar Identidad</span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                    </button>
                </div>

                <div className="md:col-span-12 lg:col-span-8 space-y-8">
                    {/* Preferencias */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="ui-card border border-ui-border p-8 flex flex-col justify-between group cursor-pointer hover:border-accent-primary/30 transition-all shadow-bento" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
                            <div className="flex justify-between items-start mb-8">
                                <div className={`p-4 rounded-2xl ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-orange-500/10 text-orange-500'} group-hover:scale-110 transition-transform duration-500`}>
                                    {isDark ? <Moon size={28} fill="currentColor" /> : <Sun size={28} fill="currentColor" />}
                                </div>
                                <div className={`w-12 h-6 rounded-full border border-ui-border p-1 flex items-center transition-colors ${isDark ? 'bg-accent-primary' : 'bg-ui-bg'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-black text-ui-text uppercase tracking-tight text-xl mb-1">Apariencia</h3>
                                <p className="text-[10px] text-ui-text-muted font-bold uppercase tracking-widest">{isDark ? 'Modo Oscuro' : 'Modo Claro'} Activado</p>
                            </div>
                        </div>

                        <div className="ui-card border border-ui-border p-8 flex flex-col justify-between group hover:border-red-500/30 transition-all shadow-bento cursor-pointer" onClick={handleLogout}>
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 group-hover:scale-110 transition-transform duration-500">
                                    <LogOut size={28} />
                                </div>
                                <ChevronRight size={20} className="text-ui-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </div>
                            <div>
                                <h3 className="font-black text-ui-text uppercase tracking-tight text-xl mb-1 text-red-500">Finalizar Sesión</h3>
                                <p className="text-[10px] text-ui-text-muted font-bold uppercase tracking-widest">Desconectar cuenta actual</p>
                            </div>
                        </div>
                    </div>

                    {/* Build Info */}
                    <div className="ui-card border border-ui-border p-6 bg-black/5 dark:bg-white/5 flex items-center justify-between shadow-soft">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-accent-primary/10 rounded-lg">
                                <Shield className="text-accent-primary" size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-ui-text uppercase tracking-widest">Estado de Seguridad</p>
                                <p className="text-[10px] text-ui-text-muted font-bold uppercase tracking-[0.1em]">Protección en tiempo real activa</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-black text-ui-text-muted uppercase tracking-[0.2em] opacity-40">Build v2.1.0</span>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {profileDialogVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="ui-card w-full max-w-md border border-ui-border flex flex-col max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 p-0">
                        <div className="p-0 flex flex-col h-full">
                            <div className="px-6 py-4 border-b border-ui-border flex justify-between items-center bg-black/2 dark:bg-white/2">
                                <h2 className="text-lg font-bold text-ui-text">Actualizar Perfil</h2>
                                <button onClick={() => setProfileDialogVisible(false)} className="text-ui-text-muted hover:text-ui-text"><X size={20} /></button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                placeholder="Nombre Completo"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>

                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                placeholder="Correo Electrónico"
                                                type="email"
                                                value={newEmail}
                                                onChange={(e) => setNewEmail(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-ui-border space-y-4">
                                        <h3 className="text-sm font-bold text-orange-500 flex items-center gap-2">
                                            <Shield size={16} /> Verificación de Seguridad
                                        </h3>
                                        <p className="text-xs text-ui-text-muted">Si deseas cambiar tu contraseña o correo, ingresa la actual.</p>

                                        <div className="relative">
                                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ui-text-muted/50" />
                                            <Input
                                                placeholder="Contraseña Actual"
                                                type="password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>

                                        <div className="relative">
                                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <Input
                                                placeholder="Nueva Contraseña (Opcional)"
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-ui-border bg-black/2 dark:bg-white/2 flex justify-end gap-3">
                                <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setProfileDialogVisible(false)} disabled={updating}>
                                    Cancelar
                                </button>
                                <button type="submit" form="profile-form" className="ui-btn ui-btn-primary px-6" disabled={updating}>
                                    {updating ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

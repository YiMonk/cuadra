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
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-ui-text uppercase">Configuración</h1>
                <div className="h-1 w-20 bg-accent-primary mt-2 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-start">
                {/* Perfil Header */}
                <div className="md:col-span-4 ui-card border border-ui-border p-6 md:p-10 flex flex-col items-center text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-linear-to-b from-accent-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    
                    <h2 className="text-3xl font-black text-ui-text mb-2 uppercase tracking-tighter">
                        {user?.displayName || 'Usuario'}
                    </h2>
                    <p className="text-sm font-bold text-accent-primary break-all mb-4 uppercase tracking-widest opacity-80">
                        {user?.email}
                    </p>

                    <div className="inline-block px-4 py-1.5 bg-accent-primary/5 dark:bg-white/5 text-ui-text-muted rounded-md text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-ui-border">
                        {user?.role === 'admingod' ? (
                            <span className="text-accent-primary">⭐ Admin Master</span>
                        ) : user?.role === 'admin' ? (
                            <span className="text-accent-primary text-xs tracking-tighter">Administrador del Negocio</span>
                        ) : (
                            <span className="text-accent-success">Colaborador (Staff)</span>
                        )}
                    </div>

                    <button
                        className="ui-btn ui-btn-secondary w-full gap-2 py-4 md:py-6 text-sm uppercase tracking-widest flex items-center justify-center relative z-10"
                        onClick={() => {
                            setNewName(user?.displayName || '');
                            setNewEmail(user?.email || '');
                            setCurrentPassword('');
                            setNewPassword('');
                            setProfileDialogVisible(true);
                        }}
                    >
                        <Edit3 size={18} /> Editar Perfil
                    </button>
                </div>

                <div className="md:col-span-8 space-y-8">
                    {/* Preferencias */}
                    <div className="ui-card border border-ui-border overflow-hidden">
                        <div className="px-4 md:px-8 py-4 md:py-5 flex items-center gap-3 border-b border-ui-border bg-black/2 dark:bg-white/2">
                            <div className="p-2 bg-accent-primary/10 rounded-lg">
                                <Settings2 className="text-accent-primary" size={20} />
                            </div>
                            <h3 className="font-black text-ui-text uppercase tracking-widest text-sm">Preferencias de Sistema</h3>
                        </div>

                        <div className="p-4 md:p-8 space-y-6">
                            <div className="flex items-center justify-between p-4 md:p-6 ui-input-box border border-ui-border">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-500/20 text-orange-500'}`}>
                                        {isDark ? <Moon size={24} fill="currentColor" /> : <Sun size={24} fill="currentColor" />}
                                    </div>
                                    <div>
                                        <p className="font-black text-ui-text uppercase tracking-tight text-lg">Tema Visual</p>
                                        <p className="text-sm text-ui-text-muted font-bold mt-1 uppercase tracking-widest">{isDark ? 'Modo oscuro activado' : 'Modo claro activado'}</p>
                                    </div>
                                </div>
                                
                                {/* Flat Switch Large */}
                                <button
                                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                                    className="relative w-20 h-10 rounded-full bg-black/10 dark:bg-white/10 p-1 transition-colors duration-300 focus:outline-none flex items-center"
                                >
                                    <div className={`w-8 h-8 rounded-full shadow-md bg-white flex items-center justify-center transition-transform duration-300 ${isDark ? 'translate-x-10' : 'translate-x-0'}`}>
                                        {isDark ? (
                                            <Moon size={16} className="text-indigo-600 fill-indigo-600" />
                                        ) : (
                                            <Sun size={16} className="text-orange-500 fill-orange-500" />
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Seguridad y Sesion */}
                    <div className="ui-card border border-ui-border overflow-hidden">
                        <div className="px-4 md:px-8 py-4 md:py-5 flex items-center gap-3 border-b border-ui-border bg-black/2 dark:bg-white/2">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <Shield className="text-red-500" size={20} />
                            </div>
                            <h3 className="font-black text-ui-text uppercase tracking-widest text-sm">Seguridad y Acceso</h3>
                        </div>

                        <div className="p-4 md:p-8">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-between p-4 md:p-6 ui-card hover:bg-black/5 dark:hover:bg-white/5 border border-red-500/20 text-red-500 transition-all font-black group relative overflow-hidden active:scale-95"
                            >
                                <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="p-3 bg-red-500/10 rounded-lg group-hover:scale-110 transition-transform">
                                        <LogOut size={22} strokeWidth={3} />
                                    </div>
                                    <span className="uppercase tracking-[0.1em] text-sm md:text-lg">Cerrar Sesión Global</span>
                                </div>
                                <ChevronRight size={20} className="relative z-10 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-[10px] text-ui-text-muted font-black uppercase tracking-widest opacity-40 py-4">Cuadra Admin PWA • Build v2.0.0</p>
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

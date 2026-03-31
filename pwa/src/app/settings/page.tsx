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
        if (confirm('¿Estás seguro que deseas salir?')) {
            signOut();
        }
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
            alert('Por favor, ingresa un correo electrónico válido.');
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
                alert('Para cambiar tu correo o contraseña, debes ingresar tu contraseña actual.');
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
                alert(`Se ha enviado un correo de verificación a ${newEmail}. Debes verificarlo para que el cambio sea efectivo.`);
            } else {
                alert('Perfil actualizado correctamente');
            }

            setProfileDialogVisible(false);
            setCurrentPassword('');
            setNewPassword('');
        } catch (error: any) {
            console.error(error);
            if (error.code?.includes('wrong-password') || error.code?.includes('invalid-credential')) {
                alert('La contraseña actual es incorrecta o la sesión ha expirado.');
            } else {
                alert(error.message || 'No se pudo actualizar el perfil');
            }
        } finally {
            setUpdating(false);
        }
    };

    if (isLoading) return null;

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-neo-text uppercase">Configuración</h1>
                <div className="h-1 w-20 neo-accent-bg mt-2 rounded-full shadow-[0_0_12px_rgba(22,200,242,0.4)]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Perfil Header */}
                <div className="md:col-span-4 neo-raised rounded-neo-lg p-10 flex flex-col items-center text-center border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-linear-to-b from-accent-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <h2 className="text-3xl font-black text-neo-text mb-2 uppercase tracking-tighter">
                        {user?.displayName || 'Usuario'}
                    </h2>
                    <p className="text-sm font-bold text-accent-cyan break-all mb-4 uppercase tracking-widest opacity-80">
                        {user?.email}
                    </p>

                    <div className="inline-block px-4 py-1.5 neo-pressed text-neo-text-muted rounded-neo-sm text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-white/5">
                        {(user as any)?.role === 'admingod' ? '⭐ Admin Master' : `Rol: ${(user as any)?.role || 'Staff'}`}
                    </div>

                    <Button
                        variant="secondary"
                        className="w-full gap-2 py-6 text-sm uppercase tracking-widest"
                        onClick={() => {
                            setNewName(user?.displayName || '');
                            setNewEmail(user?.email || '');
                            setCurrentPassword('');
                            setNewPassword('');
                            setProfileDialogVisible(true);
                        }}
                    >
                        <Edit3 size={18} /> Editar Perfil
                    </Button>
                </div>

                <div className="md:col-span-8 space-y-8">
                    {/* Preferencias */}
                    <div className="neo-raised rounded-neo-lg overflow-hidden border border-white/5">
                        <div className="px-8 py-5 flex items-center gap-3 border-b border-white/5 bg-white/2">
                            <div className="p-2 neo-accent-bg rounded-neo-sm shadow-lg">
                                <Settings2 className="text-white" size={20} />
                            </div>
                            <h3 className="font-black text-neo-text uppercase tracking-widest text-sm">Preferencias de Sistema</h3>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between p-6 neo-pressed rounded-neo-lg border border-white/5">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-neo-sm ${isDark ? 'bg-accent-purple/20 text-accent-purple shadow-[0_0_15px_rgba(167,139,250,0.2)]' : 'bg-accent-orange/20 text-accent-orange'}`}>
                                        {isDark ? <Moon size={24} fill="currentColor" /> : <Sun size={24} fill="currentColor" />}
                                    </div>
                                    <div>
                                        <p className="font-black text-neo-text uppercase tracking-tight text-lg">Tema Visual</p>
                                        <p className="text-sm text-neo-text-muted font-bold mt-1 uppercase tracking-widest">{isDark ? 'Modo oscuro activado' : 'Modo claro activado'}</p>
                                    </div>
                                </div>
                                
                                {/* Neumorphic Switch Large */}
                                <button
                                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                                    className="relative w-20 h-10 rounded-neo-sm neo-pressed p-1.5 transition-all duration-500 focus:outline-none group shadow-inner"
                                >
                                    <div 
                                        className={`absolute top-1.5 left-1.5 w-7 h-7 rounded-neo-xs transition-all duration-500 flex items-center justify-center shadow-xl
                                            ${isDark 
                                                ? 'translate-x-10 bg-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.5)]' 
                                                : 'translate-x-0 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                                            }`}
                                    >
                                        {isDark ? (
                                            <Moon size={16} className="text-accent-blue fill-accent-blue" />
                                        ) : (
                                            <Sun size={16} className="text-accent-orange fill-accent-orange" />
                                        )}
                                    </div>
                                    <div className="flex justify-between px-2 items-center h-full w-full opacity-20 group-hover:opacity-40 transition-opacity">
                                        <Sun size={14} className={isDark ? 'text-white' : 'hidden'} />
                                        <Moon size={14} className={isDark ? 'hidden' : 'text-slate-600'} />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Seguridad y Sesion */}
                    <div className="neo-raised rounded-neo-lg overflow-hidden border border-white/5">
                        <div className="px-8 py-5 flex items-center gap-3 border-b border-white/5 bg-white/2">
                            <div className="p-2 bg-accent-orange rounded-neo-sm shadow-lg">
                                <Shield className="text-white" size={20} />
                            </div>
                            <h3 className="font-black text-neo-text uppercase tracking-widest text-sm">Seguridad y Acceso</h3>
                        </div>

                        <div className="p-8">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-between p-6 neo-convex hover:neo-pressed border border-red-500/10 text-red-500 rounded-neo-lg transition-all font-black group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="p-3 bg-red-500/10 rounded-neo-sm group-hover:scale-110 transition-transform">
                                        <LogOut size={22} strokeWidth={3} />
                                    </div>
                                    <span className="uppercase tracking-[0.1em] text-lg">Cerrar Sesión Global</span>
                                </div>
                                <ChevronRight size={20} className="relative z-10 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-[10px] text-neo-text-muted font-black uppercase tracking-widest opacity-40 py-4">Cuadra Admin PWA • Build v2.0.0</p>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {profileDialogVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border-0 flex flex-col max-h-[90vh]">
                        <CardContent className="p-0 flex flex-col overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Actualizar Perfil</h2>
                                <button onClick={() => setProfileDialogVisible(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
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

                                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                                        <h3 className="text-sm font-bold text-amber-600 dark:text-amber-500 flex items-center gap-2">
                                            <Shield size={16} /> Verificación de Seguridad
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Si deseas cambiar tu contraseña o correo, ingresa la actual.</p>

                                        <div className="relative">
                                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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

                            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                                <Button type="button" variant="ghost" onClick={() => setProfileDialogVisible(false)} disabled={updating}>
                                    Cancelar
                                </Button>
                                <Button type="submit" form="profile-form" isLoading={updating} className="px-6">
                                    Guardar Cambios
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

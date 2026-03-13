"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { UserService } from '@/services/user.service';
import { auth } from '@/config/firebaseConfig';
import { updateProfile, verifyBeforeUpdateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { User, LogOut, Moon, Sun, Shield, Settings2, Edit3, X, Mail, Lock } from 'lucide-react';
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
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración</h1>
                <p className="text-foreground/60 font-medium tracking-wide">Preferencias y Perfil de Usuario</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Perfil Header */}
                <Card className="md:col-span-1 shadow-sm border border-ios-separator/10">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-ios-blue/10 text-ios-blue rounded-full flex justify-center items-center text-3xl font-bold mb-4 mx-auto border-4 border-ios-secondary-bg shadow-md">
                            {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'US'}
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {user?.displayName || 'Usuario Cuadra'}
                        </h2>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 break-all mb-3">
                            {user?.email}
                        </p>

                        <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                            {(user as any)?.role === 'admingod' ? '⭐ AdminGod' : `Rol: ${(user as any)?.role || 'Vendedor'}`}
                        </span>

                        <Button
                            variant="outline"
                            className="w-full gap-2 border-dashed border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={() => {
                                setNewName(user?.displayName || '');
                                setNewEmail(user?.email || '');
                                setCurrentPassword('');
                                setNewPassword('');
                                setProfileDialogVisible(true);
                            }}
                        >
                            <Edit3 size={16} /> Editar Perfil
                        </Button>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 space-y-6">
                    {/* Preferencias */}
                    <Card className="shadow-sm border-0">
                        <CardContent className="p-0">
                            <div className="px-6 py-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
                                <Settings2 className="text-blue-500" size={20} />
                                <h3 className="font-bold text-gray-900 dark:text-white">Preferencias de Sistema</h3>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-xl mt-0.5 ${isDark ? 'bg-indigo-900/30 text-indigo-400' : 'bg-amber-100 text-amber-600'}`}>
                                            {isDark ? <Moon size={20} /> : <Sun size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">Tema Visual</p>
                                            <p className="text-sm text-gray-500 font-medium">{isDark ? 'Modo oscuro activado' : 'Modo claro activado'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-ios-gray/10 p-1 rounded-full border border-ios-separator/10">
                                        <button
                                            onClick={() => setTheme('light')}
                                            className={`p-2 rounded-full transition-all ${!isDark ? 'bg-ios-secondary-bg text-foreground shadow-sm font-bold' : 'text-foreground/40'}`}
                                        >
                                            <Sun size={16} />
                                        </button>
                                        <button
                                            onClick={() => setTheme('dark')}
                                            className={`p-2 rounded-full transition-all ${isDark ? 'bg-ios-gray/40 text-white shadow-sm font-bold' : 'text-foreground/40'}`}
                                        >
                                            <Moon size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Seguridad y Sesion */}
                    <Card className="shadow-sm border-0">
                        <CardContent className="p-0">
                            <div className="px-6 py-4 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
                                <Shield className="text-amber-500" size={20} />
                                <h3 className="font-bold text-gray-900 dark:text-white">Seguridad y Acceso</h3>
                            </div>

                            <div className="p-6">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl transition-colors font-bold group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                                            <LogOut size={20} />
                                        </div>
                                        Cerrar Sesión Global
                                    </div>
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    <p className="text-center text-xs text-gray-400 font-medium">Cuadra Admin PWA - Versión 1.1.0 (Web Build)</p>
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

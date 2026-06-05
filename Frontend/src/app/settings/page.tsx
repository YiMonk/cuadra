"use client";

import React, { useState } from 'react';
import { APP_VERSION } from '@/config/version';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { UserService } from '@/services/user.service';
import { AuthService } from '@/services/auth.service';
import { LegalModal } from '@/components/legal/LegalModal';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { User, LogOut, Moon, Sun, Shield, Settings2, Edit3, X, Mail, Lock, ChevronRight, Users, FileText, AlertCircle, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

const CountdownCircle = ({ seconds: initialSeconds }: { seconds: number }) => {
    const [timeLeft, setTimeLeft] = React.useState(initialSeconds);
    
    React.useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const percentage = (timeLeft / initialSeconds) * 100;
    const strokeDasharray = 150.8; // 2 * PI * 24
    const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;

    return (
        <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-14 h-14 -rotate-90">
                <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-ui-bg dark:text-white/5"
                />
                <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="text-red-500 transition-all duration-1000 ease-linear"
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute text-sm font-black text-ui-text">{timeLeft}</span>
        </div>
    );
};

export default function SettingsScreen() {
    const router = useRouter();
    const { user, signOut, isLoading, reloadUser } = useAuth();
    const { isDarkTheme, toggleTheme } = useAppTheme();

    const [profileDialogVisible, setProfileDialogVisible] = useState(false);
    const [newName, setNewName] = useState(user?.displayName || '');
    const [newEmail, setNewEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [updating, setUpdating] = useState(false);
    const [legalModalOpen, setLegalModalOpen] = useState(false);
    const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'disclaimer'>('terms');
    const [onboardingOpen, setOnboardingOpen] = useState(false);

    const handleLogout = () => {
        toast.custom((t) => (
            <div className={`${isDarkTheme ? 'dark' : ''} w-full`}>
                <div className="w-full max-w-[350px] bg-ui-surface backdrop-blur-2xl border border-ui-border rounded-[2rem] p-6 shadow-float animate-in fade-in slide-in-from-right-8 duration-500">
                    <div className="flex items-center gap-6">
                        {/* Circular Timer Component */}
                        <CountdownCircle seconds={5} />

                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-ui-text uppercase tracking-tight">¿Cerrar Sesión?</h4>
                            <p className="text-[10px] text-ui-text-muted font-bold uppercase tracking-widest mt-1 opacity-70">
                                Saliendo automáticamente...
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => toast.dismiss(t)}
                            className="flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-ui-bg hover:bg-ui-surface-hover transition-colors text-ui-text-muted border border-ui-border"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t);
                                signOut();
                            }}
                            className="flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all active:scale-95"
                        >
                            Salir Ahora
                        </button>
                    </div>
                </div>
            </div>
        ), {
            duration: 5000,
            onAutoClose: () => signOut()
        });
    };

    const validateEmail = (email: string) => {
        return String(email)
            .toLowerCase()
            .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (newEmail.trim() !== user.email && !validateEmail(newEmail.trim())) {
            toast.error('Por favor, ingresa un correo electrónico válido.');
            return;
        }

        setUpdating(true);

        try {
            // Update Name
            if (newName.trim() !== user.displayName) {
                await AuthService.updateCurrentUserProfile(null, newName.trim());
                await UserService.syncUserMetadata(user.uid, { displayName: newName.trim() });
            }

            // Update Password
            if (newPassword.trim()) {
                if (!currentPassword) {
                    toast.error('Para cambiar tu contraseña, debes ingresar tu contraseña actual.');
                    setUpdating(false);
                    return;
                }
                await AuthService.updateCurrentUserPassword(null, newPassword.trim(), currentPassword);
            }

            await reloadUser();
            toast.success('Perfil actualizado correctamente');

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

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
                {/* Left column: Wiki Button + Perfil */}
                <div className="md:col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col gap-4">

                {/* Wiki / Centro de Ayuda */}
                <Link href="/wiki">
                    <div className="ui-card border border-ui-border/50 p-5 flex items-center justify-between group cursor-pointer hover:border-blue-500/50 transition-all shadow-lg shadow-black/5 bg-ui-surface backdrop-blur-xl hover:-translate-y-0.5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/15 transition-colors duration-500" />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                                <BookOpen size={22} />
                            </div>
                            <div>
                                <p className="font-black text-ui-text uppercase tracking-tight text-sm">Centro de Ayuda</p>
                                <p className="text-[10px] text-ui-text-muted font-bold uppercase tracking-widest">Wiki · Tutoriales · FAQ</p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-ui-text-muted group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300 relative z-10" />
                    </div>
                </Link>

                {/* Perfil Header - Bento Style */}
                <div className="ui-card border border-ui-border/50 p-8 md:p-10 flex flex-col items-center text-center relative overflow-hidden group shadow-2xl shadow-black/5 bg-ui-surface backdrop-blur-xl">
                    <div className="absolute inset-0 bg-linear-to-b from-accent-primary/10 to-transparent opacity-50 pointer-events-none" />
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary shadow-[0_0_20px_rgba(124,58,237,0.5)]" />
                    
                    <div className="w-32 h-32 rounded-[2rem] bg-linear-to-tr from-accent-primary to-accent-secondary p-1 mb-6 shadow-2xl shadow-accent-primary/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500 relative z-10">
                        <div className="w-full h-full bg-ui-bg rounded-[30px] flex items-center justify-center overflow-hidden relative">
                            <div className="absolute inset-0 bg-linear-to-tr from-accent-primary/20 to-transparent" />
                            <span className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-tr from-accent-primary to-accent-secondary italic relative z-10">
                                {user?.displayName?.[0]?.toUpperCase() || 'U'}
                            </span>
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-ui-text mb-1 uppercase tracking-tighter relative z-10">
                        {user?.displayName || 'Usuario'}
                    </h2>
                    <p className="text-xs font-bold text-ui-text-muted mb-6 uppercase tracking-[0.2em] relative z-10 break-all">
                        {user?.email}
                    </p>

                    <div className="flex flex-wrap justify-center gap-2 mb-8 relative z-10">
                        {user?.role === 'admingod' ? (
                            <span className="px-4 py-1.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-amber-500/20">⭐ Master</span>
                        ) : user?.role === 'admin' ? (
                            <span className="px-4 py-1.5 bg-accent-primary text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-blue-500/20">Administrador</span>
                        ) : (
                            <span className="px-4 py-1.5 bg-accent-success text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full">Colaborador</span>
                        )}
                        <span className="px-4 py-1.5 bg-ui-bg/50 border border-ui-border text-ui-text-muted text-[9px] font-black uppercase tracking-[0.2em] rounded-full backdrop-blur-sm">Activo</span>
                    </div>

                    <button
                        className="w-full py-4 px-6 bg-ui-bg/50 hover:bg-accent-primary border border-ui-border hover:border-accent-primary text-ui-text hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 relative z-10 overflow-hidden group/btn"
                        onClick={() => {
                            setNewName(user?.displayName || '');
                            setNewEmail(user?.email || '');
                            setCurrentPassword('');
                            setNewPassword('');
                            setProfileDialogVisible(true);
                        }}
                    >
                        <Edit3 size={16} /> <span className="relative z-10">Gestionar Identidad</span>
                        <div className="absolute inset-0 bg-linear-to-r from-accent-primary to-accent-secondary opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 -z-10" />
                    </button>
                </div>
                </div>{/* end left column wrapper */}

                <div className="md:col-span-12 lg:col-span-7 xl:col-span-8 space-y-6">
                    {/* Preferencias */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        {/* Apariencia */}
                        <div 
                            className="ui-card border border-ui-border/50 p-6 md:p-8 flex flex-col justify-between group cursor-pointer hover:border-accent-primary/50 transition-all shadow-lg shadow-black/5 bg-ui-surface backdrop-blur-xl hover:-translate-y-1 relative overflow-hidden" 
                            onClick={toggleTheme}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent-primary/10 transition-colors duration-500" />
                            <div className="flex justify-between items-start mb-12 relative z-10">
                                <div className={`p-4 rounded-2xl ${isDarkTheme ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner`}>
                                    {isDarkTheme ? <Moon size={28} fill="currentColor" /> : <Sun size={28} fill="currentColor" />}
                                </div>
                                <div className={`w-14 h-7 rounded-full p-1 flex items-center transition-colors duration-300 shadow-inner ${isDarkTheme ? 'bg-accent-primary' : 'bg-ui-border/50'}`}>
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${isDarkTheme ? 'translate-x-7' : 'translate-x-0'}`} />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h3 className="font-black text-ui-text uppercase tracking-tight text-xl md:text-2xl mb-1">Apariencia</h3>
                                <p className="text-[10px] md:text-xs text-ui-text-muted font-bold uppercase tracking-widest">{isDarkTheme ? 'Modo Oscuro' : 'Modo Claro'} Activado</p>
                            </div>
                        </div>

                        {/* Finalizar Sesión */}
                        <div 
                            className="ui-card border border-ui-border/50 p-6 md:p-8 flex flex-col justify-between group hover:border-red-500/50 transition-all shadow-lg shadow-black/5 bg-ui-surface backdrop-blur-xl hover:-translate-y-1 cursor-pointer relative overflow-hidden" 
                            onClick={handleLogout}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-red-500/10 transition-colors duration-500" />
                            <div className="flex justify-between items-start mb-12 relative z-10">
                                <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500 shadow-inner">
                                    <LogOut size={28} />
                                </div>
                                <div className="w-10 h-10 rounded-full bg-red-500/5 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-red-500/10 transition-all duration-300">
                                    <ChevronRight size={20} className="text-red-500 translate-x-[-4px] group-hover:translate-x-0 transition-transform duration-300" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h3 className="font-black text-red-500 uppercase tracking-tight text-xl md:text-2xl mb-1">Finalizar Sesión</h3>
                                <p className="text-[10px] md:text-xs text-ui-text-muted font-bold uppercase tracking-widest group-hover:text-red-500/70 transition-colors">Desconectar cuenta actual</p>
                            </div>
                        </div>

                        {/* Administration Access - Mobile Shortcut */}
                        {(user?.role === 'admin' || user?.role === 'admingod' || (user?.uid && !user?.ownerId)) && (
                            <div className="sm:col-span-2 ui-card border border-ui-border/50 p-6 md:p-8 flex flex-col justify-between group hover:border-accent-primary/50 transition-all shadow-lg shadow-black/5 bg-linear-to-br from-accent-primary/5 to-transparent backdrop-blur-xl hover:-translate-y-1 cursor-pointer relative overflow-hidden" onClick={() => router.push('/team')}>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-accent-primary/10 transition-colors duration-500" />
                                <div className="flex justify-between items-start mb-8 relative z-10">
                                    <div className="p-4 bg-accent-primary/10 rounded-2xl text-accent-primary group-hover:scale-110 transition-all duration-500 shadow-inner">
                                        <Users size={28} />
                                    </div>
                                    <div className="flex items-center gap-3 bg-ui-bg/50 px-4 py-2 rounded-full border border-ui-border/50 group-hover:border-accent-primary/30 transition-colors">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ui-text group-hover:text-accent-primary transition-colors">Gestionar Equipo</span>
                                        <ChevronRight size={16} className="text-ui-text-muted group-hover:text-accent-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="font-black text-ui-text uppercase tracking-tight text-xl md:text-2xl mb-1">Administración de Equipo</h3>
                                    <p className="text-[10px] md:text-xs text-ui-text-muted font-bold uppercase tracking-widest">Sedes, Cajas y Personal Autorizado</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tutorial */}
                    <button
                        onClick={() => setOnboardingOpen(true)}
                        className="w-full py-4 px-6 bg-accent-primary/5 hover:bg-accent-primary/10 border border-accent-primary/30 text-accent-primary rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                    >
                        <Settings2 size={16} /> Repetir tutorial de bienvenida
                    </button>

                    {/* Legal Info */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center gap-3 mb-6">
                            <Shield className="text-accent-primary" size={20} />
                            <h3 className="text-sm font-black text-ui-text uppercase tracking-[0.2em]">Información Legal</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button
                                onClick={() => {
                                    setLegalModalTab('terms');
                                    setLegalModalOpen(true);
                                }}
                                className="ui-card border border-ui-border/50 p-6 md:p-8 group hover:border-blue-500/50 hover:bg-blue-500/5 transition-all shadow-sm bg-ui-surface backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden"
                            >
                                <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-500 mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                                    <FileText size={24} />
                                </div>
                                <h3 className="font-black text-ui-text uppercase tracking-tight text-lg mb-2">Términos</h3>
                                <p className="text-[9px] text-ui-text-muted font-bold uppercase tracking-[0.2em] opacity-80 line-clamp-2">Términos y Condiciones Generales</p>
                            </button>

                            <button
                                onClick={() => {
                                    setLegalModalTab('privacy');
                                    setLegalModalOpen(true);
                                }}
                                className="ui-card border border-ui-border/50 p-6 md:p-8 group hover:border-green-500/50 hover:bg-green-500/5 transition-all shadow-sm bg-ui-surface backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden"
                            >
                                <div className="p-4 bg-green-500/10 rounded-2xl text-green-500 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                    <Shield size={24} />
                                </div>
                                <h3 className="font-black text-ui-text uppercase tracking-tight text-lg mb-2">Privacidad</h3>
                                <p className="text-[9px] text-ui-text-muted font-bold uppercase tracking-[0.2em] opacity-80 line-clamp-2">Nuestra Política de Privacidad</p>
                            </button>

                            <button
                                onClick={() => {
                                    setLegalModalTab('disclaimer');
                                    setLegalModalOpen(true);
                                }}
                                className="ui-card border border-ui-border/50 p-6 md:p-8 group hover:border-amber-500/50 hover:bg-amber-500/5 transition-all shadow-sm bg-ui-surface backdrop-blur-xl flex flex-col items-center text-center relative overflow-hidden"
                            >
                                <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                                    <AlertCircle size={24} />
                                </div>
                                <h3 className="font-black text-ui-text uppercase tracking-tight text-lg mb-2">Aviso Legal</h3>
                                <p className="text-[9px] text-ui-text-muted font-bold uppercase tracking-[0.2em] opacity-80 line-clamp-2">Exención de Responsabilidad</p>
                            </button>
                        </div>
                    </div>

                    {/* Build Info */}
                    <div className="ui-card border border-ui-border/50 p-6 md:p-8 bg-ui-bg/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-inner mt-8 backdrop-blur-xl rounded-[2rem]">
                        <div className="flex items-center gap-4 text-center sm:text-left">
                            <div className="p-3 bg-accent-success/10 rounded-xl relative mx-auto sm:mx-0">
                                <div className="absolute inset-0 border border-accent-success/30 rounded-xl animate-ping opacity-20" />
                                <Shield className="text-accent-success" size={20} />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-ui-text uppercase tracking-widest mb-0.5">Estado de Seguridad</p>
                                <p className="text-[9px] text-accent-success font-bold uppercase tracking-[0.2em]">Protección en tiempo real activa</p>
                            </div>
                        </div>
                        <div className="px-4 py-2 bg-black/5 dark:bg-white/5 rounded-full border border-ui-border/50 mt-2 sm:mt-0">
                            <span className="text-[9px] font-black text-ui-text-muted uppercase tracking-[0.3em]">v{APP_VERSION}</span>
                        </div>
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

            {/* Legal Modal */}
            <LegalModal
                isOpen={legalModalOpen}
                onClose={() => setLegalModalOpen(false)}
                initialTab={legalModalTab}
                showAcceptButton={false}
            />

            {/* Onboarding (re-acceso) */}
            {onboardingOpen && (
                <OnboardingWizard onClose={() => setOnboardingOpen(false)} />
            )}
        </div>
    );
}

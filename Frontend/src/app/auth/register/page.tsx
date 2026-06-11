"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, CheckCircle2, Circle, Clock, PartyPopper, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BRAND_ASSETS } from '@/config/brand';
import { UserProfile } from '@/types/auth';

// ─── Password strength ────────────────────────────────────────────────────────
const checks = [
    { key: 'length',  label: 'Mínimo 6 caracteres',  test: (p: string) => p.length >= 6 },
    { key: 'upper',   label: 'Una mayúscula',          test: (p: string) => /[A-Z]/.test(p) },
    { key: 'number',  label: 'Un número',              test: (p: string) => /[0-9]/.test(p) },
    { key: 'special', label: 'Carácter especial',      test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password: string) {
    const passed = checks.filter(c => c.test(password)).length;
    if (!password) return { score: 0, label: '',           color: 'bg-white/10' };
    if (passed <= 1) return { score: 25,  label: 'Muy débil', color: 'bg-red-500' };
    if (passed === 2) return { score: 50,  label: 'Débil',     color: 'bg-orange-400' };
    if (passed === 3) return { score: 75,  label: 'Buena',     color: 'bg-yellow-400' };
    return               { score: 100, label: 'Fuerte',    color: 'bg-emerald-400' };
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ profile, onContinue }: { profile: UserProfile | null; onContinue: () => void }) {
    const daysLeft = profile?.subscriptionEndsAt
        ? Math.max(0, Math.ceil((profile.subscriptionEndsAt - Date.now()) / (1000 * 60 * 60 * 24)))
        : null;
    const endDate = profile?.subscriptionEndsAt
        ? new Date(profile.subscriptionEndsAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    return (
        <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-700 text-center space-y-8">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400/40 flex items-center justify-center animate-in zoom-in duration-500">
                        <CheckCircle2 size={52} className="text-emerald-400" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
                        <PartyPopper size={16} className="text-blue-400" />
                    </div>
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-4 delay-200 duration-700">
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">¡Cuenta creada!</h2>
                    <p className="text-gray-400 text-sm mt-2 font-medium">Bienvenido a CUADRA. Tu cuenta está lista.</p>
                </div>
            </div>

            {daysLeft !== null && (
                <div className="animate-in fade-in slide-in-from-bottom-4 delay-300 duration-700 p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-left space-y-3">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-blue-400" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Período de prueba</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-white leading-none">{daysLeft}</span>
                        <span className="text-sm font-bold text-gray-400 mb-1">días restantes</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-1000"
                            style={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%` }}
                        />
                    </div>
                    {endDate && <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Vence el {endDate}</p>}
                </div>
            )}

            <div className="animate-in fade-in slide-in-from-bottom-4 delay-500 duration-700">
                <button
                    onClick={onContinue}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/30 transition-all duration-300 active:scale-95"
                >
                    Ir al panel <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
    const router = useRouter();
    const { user, reloadUser } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [registered, setRegistered] = useState(false);
    const [registeredProfile, setRegisteredProfile] = useState<UserProfile | null>(null);

    const strength = useMemo(() => getStrength(password), [password]);
    const canSubmit = strength.score >= 50 && name.trim() && email.trim() && confirmPassword;

    React.useEffect(() => {
        if (user && !registered) {
            router.push(user.role === 'admingod' || user.role === 'admin' ? '/admin/dashboard' : '/pos');
        }
    }, [user, registered, router]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!name || !email || !password || !confirmPassword) {
            setErrorMsg('Todos los campos son obligatorios');
            return;
        }
        if (password !== confirmPassword) {
            setErrorMsg('Las contraseñas no coinciden');
            return;
        }
        if (strength.score < 50) {
            setErrorMsg('La contraseña debe ser al menos "Débil"');
            return;
        }

        setLoading(true);
        try {
            await AuthService.registerOwner({ email, password, displayName: name });
            await reloadUser();
            setRegisteredProfile(user);
            setRegistered(true);
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error?.message ?? 'Error en el registro');
            setLoading(false);
        }
    };

    const handleContinue = () => {
        setRegistered(false);
        router.push('/pos');
    };

    return (
        <div className="min-h-screen w-full bg-[#080808] relative overflow-hidden flex items-center justify-center">
            {/* Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
            </div>
            <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: 'linear-gradient(0deg,transparent 24%,rgba(59,130,246,.1) 25%,rgba(59,130,246,.1) 26%,transparent 27%,transparent 74%,rgba(59,130,246,.1) 75%,rgba(59,130,246,.1) 76%,transparent 77%,transparent),linear-gradient(90deg,transparent 24%,rgba(59,130,246,.1) 25%,rgba(59,130,246,.1) 26%,transparent 27%,transparent 74%,rgba(59,130,246,.1) 75%,rgba(59,130,246,.1) 76%,transparent 77%,transparent)',
                backgroundSize: '50px 50px'
            }} />

            <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8">
                {registered ? (
                    <SuccessScreen profile={registeredProfile} onContinue={handleContinue} />
                ) : (
                    <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="mb-8">
                            <Link href="/auth/login" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-gray-200 transition-colors group uppercase tracking-wider">
                                <ArrowLeft size={16} className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" />
                                Volver
                            </Link>
                        </div>

                        <div className="mb-10 animate-in fade-in slide-in-from-top duration-700">
                            <img src={BRAND_ASSETS.logo_icon} alt="Cuadra" className="brightness-0 invert w-[56px] h-auto" />
                            <h1 className="text-3xl font-black tracking-[0.05em] text-white mt-4 uppercase">Crear Cuenta</h1>
                            <p className="text-gray-400 mt-2 font-medium text-sm">Únete a CUADRA y gestiona tu negocio de forma inteligente</p>
                        </div>

                        <Card className="overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl rounded-[32px] shadow-2xl shadow-black/40 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            <CardContent className="pt-12 px-8 pb-10">
                                <form onSubmit={handleRegister} className="space-y-5">
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Registro</h2>
                                        <p className="text-gray-400 text-xs mt-2 font-medium uppercase tracking-widest">Completa tus datos para empezar</p>
                                    </div>

                                    <Input
                                        label="Nombre Completo"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Juan Pérez"
                                        required
                                        leftIcon={<User size={18} />}
                                    />

                                    <Input
                                        label="Correo Electrónico"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="ejemplo@correo.com"
                                        required
                                        leftIcon={<Mail size={18} />}
                                    />

                                    {/* Contraseña + barra de fuerza */}
                                    <div className="space-y-2">
                                        <Input
                                            label="Contraseña"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            leftIcon={<Lock size={18} />}
                                            rightIcon={
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none hover:text-white transition-colors">
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            }
                                        />

                                        {password && (
                                            <div className="space-y-2 animate-in fade-in duration-300">
                                                {/* Barra */}
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex gap-1 flex-1">
                                                        {[25, 50, 75, 100].map(t => (
                                                            <div key={t} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${strength.score >= t ? strength.color : 'bg-white/10'}`} />
                                                        ))}
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-wider shrink-0 transition-colors duration-300 ${
                                                        strength.score <= 25 ? 'text-red-400' :
                                                        strength.score <= 50 ? 'text-orange-400' :
                                                        strength.score <= 75 ? 'text-yellow-400' : 'text-emerald-400'
                                                    }`}>{strength.label}</span>
                                                </div>
                                                {/* Requisitos */}
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {checks.map(c => {
                                                        const ok = c.test(password);
                                                        return (
                                                            <div key={c.key} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all duration-300 ${ok ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
                                                                {ok
                                                                    ? <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                                                                    : <Circle size={12} className="text-white/20 shrink-0" />
                                                                }
                                                                <span className={`text-[10px] font-bold leading-tight transition-colors duration-300 ${ok ? 'text-emerald-300' : 'text-white/30'}`}>{c.label}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Input
                                        label="Confirmar Contraseña"
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        leftIcon={<Lock size={18} />}
                                        rightIcon={
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none hover:text-white transition-colors">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        }
                                    />

                                    {errorMsg && (
                                        <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider animate-in pulse duration-300">
                                            {errorMsg}
                                        </div>
                                    )}

                                    {/* Aviso de términos — registro implica aceptación */}
                                    <p className="text-[10px] text-gray-500 leading-relaxed text-center px-2">
                                        Al crear tu cuenta aceptas nuestros Términos y Condiciones.<br />
                                        Los revisarás al ingresar por primera vez.
                                    </p>

                                    <Button
                                        type="submit"
                                        disabled={!canSubmit}
                                        className="w-full mt-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                                        size="lg"
                                        isLoading={loading}
                                    >
                                        Crear Cuenta
                                    </Button>
                                </form>

                                <div className="mt-10">
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-white/10" />
                                        </div>
                                        <div className="relative flex justify-center text-[10px] font-black tracking-widest uppercase">
                                            <span className="px-4 bg-white/5 text-gray-500 rounded-full">¿Ya tienes una cuenta?</span>
                                        </div>
                                    </div>
                                    <div className="mt-6">
                                        <Link href="/auth/login" className="block">
                                            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 font-black text-sm uppercase tracking-widest" size="md">
                                                Inicia Sesión
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}

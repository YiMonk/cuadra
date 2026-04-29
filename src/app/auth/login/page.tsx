"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { UserService } from '@/services/user.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Zap, Shield, BarChart3 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'login' | 'forgot'>('login');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    React.useEffect(() => {
        if (user) {
            const isGlobalAdmin = user.role === 'admingod' || user.role === 'admin';
            router.push(isGlobalAdmin ? '/admin/dashboard' : '/pos');
        }
    }, [user, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!email || !password) {
            setErrorMsg('Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
            const userMeta = await UserService.getUserById(userCredential.user.uid);

            if (userMeta) {
                if (!userMeta.active) {
                    await auth.signOut();
                    setErrorMsg('La cuenta se encuentra inactiva, por favor comuníquese con el staff.');
                    setLoading(false);
                    return;
                }

                if (userMeta.role === 'owner' && userMeta.subscriptionEndsAt && userMeta.subscriptionEndsAt < Date.now()) {
                    await auth.signOut();
                    setErrorMsg('Tu suscripción ha vencido. Por favor comunícate con el staff de soporte.');
                    setLoading(false);
                    return;
                }

                if (userMeta.role === 'staff' && userMeta.ownerId) {
                    const owner = await UserService.getUserById(userMeta.ownerId);
                    if (owner && (!owner.active || (owner.subscriptionEndsAt && owner.subscriptionEndsAt < Date.now()))) {
                        await auth.signOut();
                        setErrorMsg('La cuenta principal de tu negocio está inactiva o vencida. Contacta a tu administrador.');
                        setLoading(false);
                        return;
                    }
                }
            }

            // router.push handles redirect due to the useEffect above
        } catch (error: any) {
            let message = 'Ocurrió un error al iniciar sesión';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'Correo o contraseña incorrectos';
            } else if (error.code === 'auth/invalid-email') {
                message = 'El formato del correo es inválido';
            }
            setErrorMsg(message);
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (!email) {
            setErrorMsg('Ingresa tu correo para enviarte instrucciones de recuperación.');
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email.trim());
            setSuccessMsg(`¡Hecho! Hemos enviado un enlace de recuperación a ${email}. No olvides revisar la bandeja de SPAM si no lo visualizas en la principal.`);
            setLoading(false);
        } catch (error: any) {
            let message = 'No se pudo enviar el correo de recuperación';
            if (error.code === 'auth/user-not-found') {
                // For security, some apps don't reveal if user exists.
                // But the user requested "if registered", so we can be explicit or followed standard.
                // However Firebase often returns success even if user not found to prevent user enumeration.
                message = 'Si el correo está registrado, recibirás las instrucciones en breve.';
            }
            setErrorMsg(message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#080808] relative overflow-hidden flex items-center justify-center">
            {/* Animated Background Gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-teal-500/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-400/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(59, 130, 246, .1) 25%, rgba(59, 130, 246, .1) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, .1) 75%, rgba(59, 130, 246, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(59, 130, 246, .1) 25%, rgba(59, 130, 246, .1) 26%, transparent 27%, transparent 74%, rgba(59, 130, 246, .1) 75%, rgba(59, 130, 246, .1) 76%, transparent 77%, transparent)',
                backgroundSize: '50px 50px'
            }} />

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Left Column - Brand & Features */}
                    <div className="hidden lg:flex flex-col justify-between h-full py-12">
                        <div className="animate-in fade-in slide-in-from-left duration-1000">
                            {/* Brand Logo & Name */}
                            <div className="mb-12">
                                <Image
                                    src="/Logotipo2.svg"
                                    alt="Cuadra"
                                    width={340}
                                    height={263}
                                    className="[filter:brightness(0)_invert(1)] w-full max-w-[340px]"
                                    priority
                                />
                                <p className="text-teal-400 font-bold uppercase tracking-[0.15em] text-sm mt-4">Punto de Venta Inteligente</p>
                            </div>

                            {/* Features */}
                            <div className="space-y-6">
                                <div className="flex gap-4 items-start group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center group-hover:bg-blue-500/30 transition-all duration-300">
                                        <Zap size={24} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Gestión Rápida</h3>
                                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">Procesa ventas y reportes en segundos</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center group-hover:bg-teal-500/30 transition-all duration-300">
                                        <Shield size={24} className="text-teal-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Seguridad Total</h3>
                                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">Protección empresarial para tus datos</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start group">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center group-hover:bg-purple-500/30 transition-all duration-300">
                                        <BarChart3 size={24} className="text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm uppercase tracking-wider">Análisis Profundo</h3>
                                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">Metricas en tiempo real de tu negocio</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Text */}
                        <div className="animate-in fade-in duration-1000 delay-500">
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-widest">
                                Confían en nosotros más de <span className="text-blue-400 font-bold">500 comerciantes</span> en Venezuela
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="w-full max-w-md mx-auto lg:mx-0 animate-in fade-in slide-in-from-right duration-1000">
                        {/* Mobile Brand - Only visible on mobile */}
                        <div className="lg:hidden text-center mb-8">
                            <Image
                                src="/Logotipo2.svg"
                                alt="Cuadra"
                                width={220}
                                height={170}
                                className="[filter:brightness(0)_invert(1)] mx-auto"
                                priority
                            />
                        </div>

                        {/* Glassmorphic Card */}
                        <Card className="overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl rounded-[32px] shadow-2xl shadow-black/40 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            <CardContent className="pt-12 px-8 pb-10">
                                {view === 'login' ? (
                                    <form onSubmit={handleLogin} className="space-y-5 animate-in slide-in-from-left duration-300">
                                        {/* Form Title */}
                                        <div className="mb-8">
                                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Inicia Sesión</h2>
                                            <p className="text-gray-400 text-xs mt-2 font-medium uppercase tracking-widest">Accede a tu punto de venta</p>
                                        </div>

                                        {/* Email Input */}
                                        <Input
                                            label="Correo Electrónico"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="ejemplo@correo.com"
                                            required
                                            leftIcon={<Mail size={18} />}
                                        />

                                        {/* Password Input */}
                                        <Input
                                            label="Contraseña"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            leftIcon={<Lock size={18} />}
                                            rightIcon={
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="focus:outline-none hover:text-white transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            }
                                        />

                                        {/* Error Message */}
                                        {errorMsg && (
                                            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider animate-in pulse duration-300">
                                                {errorMsg}
                                            </div>
                                        )}

                                        {/* Forgot Password Link */}
                                        <div className="flex justify-end pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setView('forgot')}
                                                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
                                            >
                                                ¿Olvidaste tu contraseña?
                                            </button>
                                        </div>

                                        {/* Submit Button */}
                                        <Button type="submit" className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300" size="lg" isLoading={loading}>
                                            Iniciar Sesión
                                        </Button>
                                    </form>
                                ) : (
                                    <form onSubmit={handleResetPassword} className="space-y-5 animate-in slide-in-from-right duration-300">
                                        {/* Form Title */}
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Recuperar Acceso</h2>
                                            <p className="text-gray-400 text-xs mt-2 font-medium uppercase tracking-widest">Te enviaremos instrucciones por correo</p>
                                        </div>

                                        {/* Email Input */}
                                        <Input
                                            label="Correo Electrónico"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="ejemplo@correo.com"
                                            required
                                            leftIcon={<Mail size={18} />}
                                        />

                                        {/* Error Message */}
                                        {errorMsg && (
                                            <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider">
                                                {errorMsg}
                                            </div>
                                        )}

                                        {/* Success Message */}
                                        {successMsg && (
                                            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider leading-relaxed">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    Éxito
                                                </div>
                                                {successMsg}
                                            </div>
                                        )}

                                        {/* Submit Button */}
                                        <Button type="submit" className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300" size="lg" isLoading={loading} disabled={!!successMsg}>
                                            Enviar Instrucciones
                                        </Button>

                                        {/* Back Button */}
                                        <button
                                            type="button"
                                            onClick={() => { setView('login'); setSuccessMsg(''); setErrorMsg(''); }}
                                            className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-300 transition-colors uppercase tracking-wider pt-2"
                                        >
                                            Volver al Inicio de Sesión
                                        </button>
                                    </form>
                                )}

                                {/* Divider */}
                                {view === 'login' && (
                                    <>
                                        <div className="mt-10">
                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-white/10" />
                                                </div>
                                                <div className="relative flex justify-center text-[10px] font-black tracking-widest uppercase">
                                                    <span className="px-4 bg-white/5 text-gray-500 rounded-full transition-colors">¿No tienes una cuenta?</span>
                                                </div>
                                            </div>

                                            {/* Register Link */}
                                            <div className="mt-6">
                                                <Link href="/auth/register" className="block">
                                                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 font-black text-sm uppercase tracking-widest" size="md">
                                                        Crear una Cuenta
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

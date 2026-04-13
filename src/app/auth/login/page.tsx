"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { UserService } from '@/services/user.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-[#050505] relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 dark:bg-blue-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/20 dark:bg-teal-500/10 blur-[120px] rounded-full" />
            
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-linear-to-tr from-blue-600 to-teal-400 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-500/20">
                        C
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Cuadra</h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona tus ventas de forma simple</p>
                </div>

                <Card className="overflow-hidden border border-black/5 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] bg-white/80 dark:bg-black/40 backdrop-blur-2xl rounded-[40px] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <CardContent className="pt-10 p-8">
                        {view === 'login' ? (
                            <form onSubmit={handleLogin} className="space-y-4 animate-in slide-in-from-left duration-300">
                                <Input
                                    label="Correo Electrónico"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                    required
                                />

                                <Input
                                    label="Contraseña"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />

                                {errorMsg && (
                                    <div className="p-4 rounded-2xl bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20 animate-shake">
                                        {errorMsg}
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setView('forgot')}
                                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>

                                <Button type="submit" className="w-full mt-2 bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-xl shadow-blue-500/20" size="lg" isLoading={loading}>
                                    Iniciar Sesión
                                </Button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-5 animate-in slide-in-from-right duration-300">
                                <div className="text-center mb-2">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recuperar Acceso</h2>
                                    <p className="text-sm text-gray-500 mt-1">Ingresa tu correo y te enviaremos instrucciones.</p>
                                </div>

                                <Input
                                    label="Correo Electrónico"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ejemplo@correo.com"
                                    required
                                />

                                {errorMsg && (
                                    <div className="p-4 rounded-2xl bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">
                                        {errorMsg}
                                    </div>
                                )}

                                {successMsg && (
                                    <div className="p-5 rounded-2xl bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20 leading-relaxed shadow-lg shadow-emerald-500/5 transition-all">
                                        <div className="flex items-center gap-2 mb-1 text-[10px] uppercase tracking-widest">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Enviado correctamente
                                        </div>
                                        {successMsg}
                                    </div>
                                )}

                                <Button type="submit" className="w-full" size="lg" isLoading={loading} disabled={!!successMsg}>
                                    Enviar Instrucciones
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => { setView('login'); setSuccessMsg(''); setErrorMsg(''); }}
                                    className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
                                >
                                    Volver al inicio de sesión
                                </button>
                            </form>
                        )}

                        <div className="mt-10">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/5" />
                                </div>
                                <div className="relative flex justify-center text-[10px] font-black tracking-widest uppercase">
                                    <span className="px-4 bg-white dark:bg-[#0a0a0a] text-gray-400/60 rounded-full transition-colors">¿No tienes una cuenta?</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link href="/auth/register" className="block">
                                    <Button variant="outline" className="w-full" size="md">
                                        Crear una cuenta
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

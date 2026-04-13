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
            router.push(user.role === 'admingod' ? '/admin/dashboard' : '/pos');
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
                    setErrorMsg('Tu cuenta ha sido deshabilitada.');
                    setLoading(false);
                    return;
                }

                if (userMeta.role === 'staff' && userMeta.ownerId) {
                    const owner = await UserService.getUserById(userMeta.ownerId);
                    if (owner && !owner.active) {
                        await auth.signOut();
                        setErrorMsg('La cuenta principal de tu negocio ha sido suspendida.');
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
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-linear-to-tr from-blue-600 to-teal-400 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-500/20">
                        C
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Cuadra</h1>
                    <p className="text-gray-500 mt-2 font-medium">Gestiona tus ventas de forma simple</p>
                </div>

                <Card className="overflow-hidden border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                    <CardContent className="pt-8 p-6">
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
                                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium border border-red-100 dark:border-red-900/50">
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

                                <Button type="submit" className="w-full mt-2" size="lg" isLoading={loading}>
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
                                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium border border-red-100 dark:border-red-900/50">
                                        {errorMsg}
                                    </div>
                                )}

                                {successMsg && (
                                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium border border-green-100 dark:border-green-900/50 leading-relaxed">
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

                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-gray-800" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-3 bg-white dark:bg-gray-900 text-gray-500">O</span>
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

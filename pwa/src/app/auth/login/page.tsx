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
    const [errorMsg, setErrorMsg] = useState('');

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

    const handleResetPassword = async () => {
        if (!email) {
            setErrorMsg('Ingresa tu correo para enviarte instrucciones de recuperación.');
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email.trim());
            alert('Revisa tu bandeja de entrada para restablecer tu contraseña.');
        } catch (error: any) {
            setErrorMsg('No se pudo enviar el correo de recuperación');
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

                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleLogin} className="space-y-4">
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
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/50">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleResetPassword}
                                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            <Button type="submit" className="w-full mt-2" size="lg" isLoading={loading}>
                                Iniciar Sesión
                            </Button>
                        </form>

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

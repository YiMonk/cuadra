"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { UserService } from '@/services/user.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    React.useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

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

        if (password.length < 6) {
            setErrorMsg('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            await updateProfile(userCredential.user, { displayName: name.trim() });

            await UserService.syncUserMetadata(userCredential.user.uid, {
                id: userCredential.user.uid,
                displayName: name.trim(),
                email: email.trim(),
                role: 'admin', // Default to Admin (Store Owner)
                ownerId: userCredential.user.uid, // Self-owned
                active: true,
                createdAt: Date.now()
            });

        } catch (error: any) {
            console.error(error);
            let message = 'Error en el registro';
            if (error.code === 'auth/email-already-in-use') {
                message = 'Este correo ya está registrado';
            }
            setErrorMsg(message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
            <div className="w-full max-w-md">

                <div className="mb-6">
                    <Link href="/auth/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition group">
                        <ArrowLeft size={16} className="mr-2 transform group-hover:-translate-x-1 transition" />
                        Volver
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Crear Cuenta</h1>
                    <p className="text-gray-500 mt-2 font-medium">Únete a la plataforma para gestionar tu negocio</p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleRegister} className="space-y-4">
                            <Input
                                label="Nombre Completo"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Juan Pérez"
                                required
                            />

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
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="focus:outline-none hover:text-ui-text transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                            />

                            <Input
                                label="Confirmar Contraseña"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="focus:outline-none hover:text-ui-text transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                            />

                            {errorMsg && (
                                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium border border-red-100 dark:border-red-900/50">
                                    {errorMsg}
                                </div>
                            )}

                            <Button type="submit" className="w-full mt-4" size="lg" isLoading={loading}>
                                Completar Registro
                            </Button>
                        </form>

                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-gray-800" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-3 bg-white dark:bg-gray-900 text-gray-500">O regístrate con</span>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <Button type="button" variant="outline" className="w-full" size="md">
                                    Google
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-8 text-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">¿Ya tienes una cuenta? </span>
                    <Link href="/auth/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition">
                        Iniciar Sesión
                    </Link>
                </div>

            </div>
        </div>
    );
}

"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { CheckCircle2, AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const oobCode = searchParams.get('oobCode');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [status, setStatus] = useState<'verifying' | 'input' | 'success' | 'error'>('verifying');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (!oobCode) {
            setStatus('error');
            setErrorMsg('El código de restablecimiento no es válido o ha expirado.');
            return;
        }

        verifyPasswordResetCode(auth, oobCode)
            .then((userEmail) => {
                setEmail(userEmail);
                setStatus('input');
            })
            .catch((error) => {
                console.error(error);
                setStatus('error');
                setErrorMsg('El enlace de recuperación no es válido o ya ha sido utilizado.');
            });
    }, [oobCode]);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (newPassword.length < 6) {
            setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        try {
            if (oobCode) {
                await confirmPasswordReset(auth, oobCode, newPassword);
                setStatus('success');
            }
        } catch (error: any) {
            setErrorMsg('Error al restablecer la contraseña. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (status === 'verifying') {
        return (
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 font-medium">Verificando código...</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto flex items-center justify-center text-green-600">
                    <CheckCircle2 size={40} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">¡Contraseña Actualizada!</h2>
                    <p className="text-gray-500 mt-2">Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión con tu nueva clave.</p>
                </div>
                <Button onClick={() => router.push('/auth/login')} className="w-full">
                    Ir al Inicio de Sesión
                </Button>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto flex items-center justify-center text-red-600">
                    <AlertCircle size={40} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Enlace Inválido</h2>
                    <p className="text-gray-500 mt-2">{errorMsg}</p>
                </div>
                <Button variant="outline" onClick={() => router.push('/auth/login')} className="w-full">
                    Volver al Inicio
                </Button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-linear-to-tr from-blue-600 to-teal-400 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white shadow-xl">
                    <Lock size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nueva Contraseña</h1>
                <p className="text-gray-500 text-sm mt-1">Estás restableciendo el acceso para <span className="font-bold text-gray-700 dark:text-gray-300">{email}</span></p>
            </div>

            <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl transition-all duration-300">
                <CardContent className="pt-8 p-6">
                    <form onSubmit={handleReset} className="space-y-4">
                        <div className="relative">
                            <Input
                                label="Nueva Contraseña"
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 transition"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <Input
                            label="Confirmar Contraseña"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite tu contraseña"
                            required
                        />

                        {errorMsg && (
                            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium border border-red-100 dark:border-red-900/50">
                                {errorMsg}
                            </div>
                        )}

                        <Button type="submit" className="w-full mt-2" size="lg" isLoading={loading}>
                            Actualizar Contraseña
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
            <div className="w-full max-w-md">
                <Suspense fallback={
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 font-medium">Cargando...</p>
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}

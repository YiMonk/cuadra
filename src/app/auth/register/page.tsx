"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { UserService } from '@/services/user.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { LegalModal } from '@/components/legal/LegalModal';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { BRAND_ASSETS } from '@/config/brand';

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
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [legalModalOpen, setLegalModalOpen] = useState(false);
    const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'disclaimer'>('terms');

    React.useEffect(() => {
        if (user) {
            const isGlobalAdmin = user.role === 'admingod' || user.role === 'admin';
            if (isGlobalAdmin) {
                router.push('/admin/dashboard');
            } else {
                router.push('/pos');
            }
        }
    }, [user, router]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!name || !email || !password || !confirmPassword) {
            setErrorMsg('Todos los campos son obligatorios');
            return;
        }

        if (!agreedToTerms) {
            setErrorMsg('Debes aceptar los términos y condiciones para continuar');
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
                createdAt: Date.now(),
                termsAcceptedAt: Date.now()
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

            <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-8">
                <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    {/* Back Button */}
                    <div className="mb-8">
                        <Link href="/auth/login" className="inline-flex items-center text-xs font-bold text-gray-400 hover:text-gray-200 transition-colors group uppercase tracking-wider">
                            <ArrowLeft size={16} className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" />
                            Volver
                        </Link>
                    </div>

                    {/* Brand Section */}
                    <div className="mb-10 animate-in fade-in slide-in-from-top duration-700">
                        <img
                            src={BRAND_ASSETS.logo_icon}
                            alt="Cuadra"
                            className="brightness-0 invert w-[56px] h-auto"
                        />
                        <h1 className="text-3xl font-black tracking-[0.05em] text-white mt-4 uppercase">Crear Cuenta</h1>
                        <p className="text-gray-400 mt-2 font-medium text-sm">Únete a CUADRA y gestiona tu negocio de forma inteligente</p>
                    </div>

                    {/* Glassmorphic Card */}
                    <Card className="overflow-hidden border border-white/10 bg-white/5 backdrop-blur-2xl rounded-[32px] shadow-2xl shadow-black/40 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                        <CardContent className="pt-12 px-8 pb-10">
                            <form onSubmit={handleRegister} className="space-y-5 animate-in slide-in-from-left duration-500">
                                {/* Form Title */}
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Registro</h2>
                                    <p className="text-gray-400 text-xs mt-2 font-medium uppercase tracking-widest">Completa tus datos para empezar</p>
                                </div>

                                {/* Name Input */}
                                <Input
                                    label="Nombre Completo"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Juan Pérez"
                                    required
                                    leftIcon={<User size={18} />}
                                />

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

                                {/* Confirm Password Input */}
                                <Input
                                    label="Confirmar Contraseña"
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
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

                                {/* Password Requirements */}
                                <div className="pt-2 pb-4 px-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider">
                                    Mínimo 6 caracteres para tu contraseña
                                </div>

                                {/* Terms Acceptance */}
                                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className="w-4 h-4 mt-1 rounded cursor-pointer accent-blue-500"
                                    />
                                    <label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer leading-relaxed">
                                        Acepto los{' '}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLegalModalTab('terms');
                                                setLegalModalOpen(true);
                                            }}
                                            className="text-blue-400 hover:text-blue-300 font-bold underline transition-colors"
                                        >
                                            Términos y Condiciones
                                        </button>
                                        , la{' '}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLegalModalTab('privacy');
                                                setLegalModalOpen(true);
                                            }}
                                            className="text-blue-400 hover:text-blue-300 font-bold underline transition-colors"
                                        >
                                            Política de Privacidad
                                        </button>
                                        {' '}y el{' '}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setLegalModalTab('disclaimer');
                                                setLegalModalOpen(true);
                                            }}
                                            className="text-blue-400 hover:text-blue-300 font-bold underline transition-colors"
                                        >
                                            Disclaimer
                                        </button>
                                    </label>
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={!agreedToTerms}
                                    className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    size="lg"
                                    isLoading={loading}
                                >
                                    Crear Cuenta
                                </Button>
                            </form>

                            {/* Divider */}
                            <div className="mt-10">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10" />
                                    </div>
                                    <div className="relative flex justify-center text-[10px] font-black tracking-widest uppercase">
                                        <span className="px-4 bg-white/5 text-gray-500 rounded-full transition-colors">¿Ya tienes una cuenta?</span>
                                    </div>
                                </div>

                                {/* Login Link */}
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
            </div>

            {/* Legal Modal */}
            <LegalModal
                isOpen={legalModalOpen}
                onClose={() => setLegalModalOpen(false)}
                initialTab={legalModalTab}
                showAcceptButton={false}
            />
        </div>
    );
}

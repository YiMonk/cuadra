"use client";

import React, { useState, useEffect } from 'react';
import { ConfigService } from '@/services/config.service';
import { APP_VERSION } from '@/config/version';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';

export function UpdateDetector() {
    const { signOut } = useAuth();
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [latestVersion, setLatestVersion] = useState('');

    useEffect(() => {
        // Monitor version in Firestore
        const unsubscribe = ConfigService.subscribeToVersion((latestVersion) => {
            setLatestVersion(latestVersion);
            if (latestVersion && latestVersion !== APP_VERSION) {
                console.log(`Update detected: Current(${APP_VERSION}) vs Latest(${latestVersion})`);
                triggerUpdateFlow();
            }
        });

        return () => unsubscribe();
    }, []);

    const triggerUpdateFlow = async () => {
        // 1. Show Modal first so they see what's happening
        setNeedsUpdate(true);
        // 2. Sign Out
        await signOut();
    };

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (needsUpdate && countdown > 0) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (needsUpdate && countdown === 0) {
            handleFinalRefresh();
        }

        return () => clearInterval(timer);
    }, [needsUpdate, countdown]);

    const handleFinalRefresh = async () => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        
        try {
            // 1. Clear local storage and session
            localStorage.clear();
            sessionStorage.clear();
            
            // 2. Clear all browser caches (Service Worker caches)
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }

            // 3. Force Service Worker to update if possible
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    registration.update();
                }
            }
        } catch (e) {
            console.error('Error clearing cache:', e);
        } finally {
            // 4. Force reload from server bypassing cache
            window.location.reload();
        }
    };

    if (!needsUpdate) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#0D0B1F]/90 backdrop-blur-xl animate-in fade-in duration-700">
            <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-[#1A1635]/50 flex flex-col shadow-[0_0_80px_rgba(124,58,237,0.3)] overflow-hidden animate-in zoom-in-95 duration-500 relative">
                
                {/* Decorative background glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent-primary/20 blur-[100px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent-secondary/20 blur-[100px] rounded-full" />

                <div className="p-10 text-center relative z-10">
                    <div className="relative mb-8 flex justify-center">
                        <div className="absolute inset-0 bg-accent-primary/30 blur-3xl rounded-full scale-150 animate-pulse" />
                        <div className="relative w-20 h-20 rounded-3xl bg-linear-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white shadow-2xl shadow-accent-primary/40">
                            <RefreshCw size={36} className={`${isRefreshing ? 'animate-spin' : 'animate-spin-slow'}`} />
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
                        Actualización <br/> Disponible
                    </h2>
                    
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">v{APP_VERSION}</span>
                        <div className="w-4 h-px bg-white/10" />
                        <span className="px-3 py-1 rounded-lg bg-accent-primary/20 border border-accent-primary/30 text-[10px] font-black text-accent-primary uppercase tracking-widest">v{latestVersion}</span>
                    </div>

                    <p className="text-white/60 font-medium text-sm leading-relaxed mb-8 px-4">
                        Hemos actualizado el sistema para mejorar tu experiencia. Tu sesión se ha cerrado para sincronizar los cambios de forma segura.
                    </p>

                    <div className="bg-black/20 p-6 rounded-3xl mb-8 relative overflow-hidden border border-white/5">
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                            <div 
                                className="h-full bg-linear-to-r from-accent-primary to-accent-secondary transition-all duration-1000 ease-linear"
                                style={{ width: `${(countdown / 5) * 100}%` }}
                            />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">Reiniciando en</p>
                        <span className="text-5xl font-black text-white tracking-tighter tabular-nums">
                            0{countdown}
                        </span>
                    </div>

                    <Button 
                        variant="primary" 
                        className="w-full !rounded-2xl h-16 bg-linear-to-r from-accent-primary to-accent-secondary border-0 shadow-xl shadow-accent-primary/20 active:scale-95 transition-all group"
                        onClick={handleFinalRefresh}
                        isLoading={isRefreshing}
                    >
                        <Sparkles size={20} className="mr-3 group-hover:scale-125 transition-transform" />
                        <span className="font-black uppercase tracking-widest text-xs">Actualizar Ahora</span>
                    </Button>
                </div>

                <div className="px-10 py-5 bg-black/40 text-center border-t border-white/5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">
                        Limpiando caché del sistema... por favor espera
                    </p>
                </div>
            </div>
        </div>
    );
}

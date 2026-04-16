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
    const [countdown, setCountdown] = useState(15);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        // Monitor version in Firestore
        const unsubscribe = ConfigService.subscribeToVersion((latestVersion) => {
            if (latestVersion !== APP_VERSION) {
                console.log(`Update detected: Current(${APP_VERSION}) vs Latest(${latestVersion})`);
                triggerUpdateFlow();
            }
        });

        return () => unsubscribe();
    }, []);

    const triggerUpdateFlow = async () => {
        // 1. Instantly Sign Out to prevent state corruption
        await signOut();
        
        // 2. Show Modal
        setNeedsUpdate(true);
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

    const handleFinalRefresh = () => {
        setIsRefreshing(true);
        
        // Clear caches and storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Force reload from server
        window.location.reload();
    };

    if (!needsUpdate) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
            <div className="ui-card w-full max-w-md border border-white/20 bg-white/10 dark:bg-black/40 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500">
                
                <div className="p-10 text-center">
                    <div className="relative mb-8 flex justify-center">
                        <div className="absolute inset-0 bg-accent-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                        <div className="relative p-6 rounded-3xl bg-black text-white dark:bg-white dark:text-black shadow-2xl">
                            <RefreshCw size={40} className={`animate-spin-slow ${isRefreshing ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-accent-danger p-2 rounded-full shadow-lg border-2 border-white dark:border-black">
                            <ShieldAlert size={16} className="text-white" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 leading-none">
                        Actualización Lista
                    </h2>
                    
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="h-1 w-8 bg-accent-primary rounded-full" />
                        <p className="text-white/60 font-black uppercase tracking-[0.2em] text-[10px]">Cuadra v{APP_VERSION} → v1.0.x</p>
                        <div className="h-1 w-8 bg-accent-primary rounded-full" />
                    </div>

                    <p className="text-white/80 font-medium text-sm leading-relaxed mb-8 px-4">
                        Hemos realizado mejoras críticas para tu experiencia. Tu sesión se ha cerrado automáticamente para sincronizar tus datos de forma segura.
                    </p>

                    <div className="ui-input-box bg-white/10 p-6 rounded-2xl mb-8 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
                            <div 
                                className="h-full bg-accent-primary transition-all duration-1000 ease-linear"
                                style={{ width: `${(countdown / 15) * 100}%` }}
                            />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Reiniciando en</p>
                        <span className="text-5xl font-black text-white tracking-tighter tabular-nums">
                            {countdown}s
                        </span>
                    </div>

                    <Button 
                        variant="primary" 
                        size="lg" 
                        className="w-full !rounded-2xl h-16 shadow-[0_8px_25px_rgba(255,255,255,0.1)] group"
                        onClick={handleFinalRefresh}
                        isLoading={isRefreshing}
                    >
                        <Sparkles size={20} className="mr-2 group-hover:rotate-12 transition-transform" />
                        Actualizar Ahora
                    </Button>
                </div>

                <div className="px-10 py-6 bg-black/20 text-center border-t border-white/10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">
                        No detengas el proceso para asegurar la integridad de tus datos
                    </p>
                </div>
            </div>
        </div>
    );
}

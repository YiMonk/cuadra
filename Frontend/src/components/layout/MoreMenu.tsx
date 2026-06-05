"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/hooks/useRole';
import { useAuth } from '@/context/AuthContext';
import {
    FileText,
    Users,
    Settings,
    LogOut,
    ChevronRight,
    Archive,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

interface MoreMenuProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { top: number; right: number };
}

export function MoreMenu({ isOpen, onClose, position }: MoreMenuProps) {
    const router = useRouter();
    const { signOut } = useAuth();
    const { isOwner, isStaff, isGlobalAdmin } = useRole();

    if (!isOpen) return null;

    const handleLogout = async () => {
        toast.custom((t) => (
            <div className="w-full max-w-[350px] bg-ui-surface backdrop-blur-2xl border border-ui-border rounded-[2rem] p-6 shadow-lg animate-in fade-in">
                <div className="space-y-4">
                    <h3 className="font-black uppercase text-sm">¿Cerrar sesión?</h3>
                    <div className="flex gap-3">
                        <button
                            onClick={() => toast.dismiss(t)}
                            className="flex-1 py-2 px-3 rounded-lg bg-ui-bg text-sm font-bold hover:bg-ui-surface-hover"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t);
                                signOut();
                            }}
                            className="flex-1 py-2 px-3 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600"
                        >
                            Salir
                        </button>
                    </div>
                </div>
            </div>
        ), { duration: 5000 });
    };

    const handleNavigation = (href: string) => {
        router.push(href);
        onClose();
    };

    const sections = isGlobalAdmin ? [
        {
            title: 'ADMIN',
            items: [
                { label: 'Panel de Control', icon: Archive, href: '/admin/dashboard' },
                { label: 'Usuarios', icon: Users, href: '/admin/users' },
            ]
        }
    ] : isOwner ? [
        {
            title: 'OPERACIONES',
            items: [
                { label: 'Reportes', icon: FileText, href: '/reports' },
                { label: 'Movimientos', icon: Archive, href: '/collections' },
            ]
        },
        {
            title: 'NEGOCIO',
            items: [
                { label: 'Mi Equipo', icon: Users, href: '/business/team' },
            ]
        },
        {
            title: 'CUENTA',
            items: [
                { label: 'Ajustes', icon: Settings, href: '/settings' },
            ]
        }
    ] : isStaff ? [
        {
            title: 'CUENTA',
            items: [
                { label: 'Ajustes', icon: Settings, href: '/settings' },
            ]
        }
    ] : [];

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Menu */}
            <div
                className="fixed z-50 bg-ui-surface border border-ui-border rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden w-64"
                style={position ? {
                    top: `${position.top}px`,
                    right: `${position.right}px`,
                } : {
                    top: '50%',
                    right: '50%',
                    transform: 'translate(50%, -50%)',
                }}
            >
                {/* Header with close button */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-ui-border">
                    <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Más opciones</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-ui-bg rounded-lg transition-colors"
                    >
                        <X size={18} className="text-foreground/60" />
                    </button>
                </div>

                {/* Menu content */}
                <div className="max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2 p-4">
                        {sections.map((section, idx) => (
                            <div key={idx}>
                                <h3 className="text-[11px] font-black uppercase tracking-[0.12em] text-foreground/50 px-3 mb-3 mt-2 first:mt-0">
                                    {section.title}
                                </h3>
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <button
                                                key={item.href}
                                                onClick={() => handleNavigation(item.href)}
                                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-ui-bg transition-all duration-150 active:scale-95 text-left group"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-ui-bg group-hover:bg-accent-primary/20 transition-colors flex-shrink-0">
                                                        <Icon size={16} className="text-foreground/70 group-hover:text-accent-primary transition-colors" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-foreground truncate">
                                                        {item.label}
                                                    </span>
                                                </div>
                                                <ChevronRight
                                                    size={16}
                                                    className="text-foreground/30 group-hover:text-foreground/50 flex-shrink-0 transition-colors"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Logout button */}
                    <div className="border-t border-ui-border px-4 py-3 space-y-1">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/15 text-red-600 dark:text-red-400 font-semibold text-sm transition-all duration-150 active:scale-95 group"
                        >
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors flex-shrink-0">
                                <LogOut size={16} />
                            </div>
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

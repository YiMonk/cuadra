"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    ShieldAlert,
    Users,
    Settings,
    FileText,
    History,
    DollarSign,
    Target,
    LogOut,
    ChevronRight
} from 'lucide-react';

export default function MenuPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/auth/login');
    };

    const admingodItems = [
        { title: 'AdminGod Panel', icon: ShieldAlert, route: '/admin/dashboard', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', description: 'Control Maestro del Sistema' },
        { title: 'Gestión de Usuarios', icon: Users, route: '/admin/users', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', description: 'Administrar todas las cuentas' },
        { title: 'Configuración', icon: Settings, route: '/settings', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20', description: 'Opciones de la app' }
    ];

    const standardItems = [
        { title: 'Reportes', icon: FileText, route: '/reports', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', description: 'Ventas y rendimientos' },
        { title: 'Historial', icon: History, route: '/history', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', description: 'Registro de transacciones' },
        { title: 'Cobranzas', icon: DollarSign, route: '/collections', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', description: 'Gestión de deudas' },
        { title: 'Categorías', icon: Target, route: '/categories', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', description: 'Gestionar catálogo' },
        ...(user?.role === 'admin' ? [
            { title: 'Mi Equipo', icon: Users, route: '/team', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', description: 'Gestionar usuarios y roles' }
        ] : []),
        { title: 'Configuración', icon: Settings, route: '/settings', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20', description: 'Opciones de la app' }
    ];

    const menuItems = user?.role === 'admingod' ? admingodItems : standardItems;

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Menú</h1>
            </div>

            <div className="flex items-center p-4 mb-8 bg-ios-secondary-bg rounded-ios-lg border border-ios-separator/10 shadow-sm transition-all hover:shadow-md">
                <div className="w-14 h-14 rounded-full bg-ios-blue/10 flex items-center justify-center text-ios-blue font-bold text-xl shadow-inner">
                    {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="ml-4 flex-1">
                    <h2 className="text-lg font-bold text-foreground">{user?.displayName || 'Usuario'}</h2>
                    <p className="text-sm text-foreground/60">{user?.email}</p>
                </div>
            </div>

            <div className="space-y-3">
                {menuItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={idx}
                            onClick={() => router.push(item.route)}
                            className="w-full flex items-center p-4 bg-ios-secondary-bg rounded-ios-lg border border-ios-separator/10 shadow-sm hover:shadow-md hover:border-ios-blue/30 transition-all text-left group"
                        >
                            <div className={`w-12 h-12 rounded-ios ${item.bg.includes('red') ? 'bg-ios-red/10' : item.bg.includes('green') ? 'bg-ios-green/10' : item.bg.includes('blue') ? 'bg-ios-blue/10' : item.bg.includes('amber') ? 'bg-orange-500/10' : item.bg.includes('orange') ? 'bg-orange-600/10' : item.bg.includes('purple') ? 'bg-purple-600/10' : 'bg-ios-gray/10'} flex items-center justify-center mr-4 group-hover:scale-105 transition-transform`}>
                                <Icon className={item.color.replace('text-red-500', 'text-ios-red').replace('text-green-500', 'text-ios-green').replace('text-blue-500', 'text-ios-blue').replace('text-amber-500', 'text-orange-500').replace('text-orange-500', 'text-orange-600').replace('text-purple-500', 'text-purple-600').replace('text-slate-500', 'text-ios-gray')} size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-foreground group-hover:text-ios-blue transition-colors">{item.title}</h3>
                                <p className="text-sm text-foreground/60 mt-0.5">{item.description}</p>
                            </div>
                            <ChevronRight className="text-ios-gray/40 group-hover:text-ios-blue transition-colors" />
                        </button>
                    )
                })}
            </div>

            <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 p-4 mt-8 text-ios-red font-bold bg-ios-red/10 rounded-ios-lg hover:bg-ios-red/20 transition-colors active:scale-95"
            >
                <LogOut size={20} />
                Cerrar Sesión
            </button>

            <div className="text-center mt-12 mb-8">
                <p className="text-xs text-gray-400 dark:text-gray-600 font-medium tracking-wide">Cuadra App v2.0.0 (PWA)</p>
            </div>
        </div>
    );
}

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

    const staffItems = [
        { title: 'Configuración', icon: Settings, route: '/settings', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20', description: 'Opciones de la app' }
    ];

    const menuItems = user?.role === 'admingod' ? admingodItems : user?.role === 'staff' ? staffItems : standardItems;

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Menú</h1>
            </div>

            {/* User card */}
            <div className="liquid-glass rounded-[22px] flex items-center gap-4 p-4 mb-6">
                <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white font-black text-lg"
                    style={{ background: 'linear-gradient(135deg,#1a8fff 0%,#005fcc 100%)', boxShadow: '0 3px 14px -3px rgba(0,122,255,0.5)' }}>
                    {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-[15px] font-bold text-foreground truncate">{user?.displayName || 'Usuario'}</h2>
                    <p className="text-[13px] text-foreground/50 truncate">{user?.email}</p>
                </div>
            </div>

            {/* Menu items */}
            <div className="space-y-2.5">
                {menuItems.map((item, idx) => {
                    const Icon = item.icon;
                    const iconColor = item.color
                        .replace('text-red-500','text-ios-red').replace('text-green-500','text-ios-green')
                        .replace('text-blue-500','text-ios-blue').replace('text-amber-500','text-orange-500')
                        .replace('text-orange-500','text-orange-500').replace('text-purple-500','text-purple-500')
                        .replace('text-slate-500','text-ios-gray');
                    return (
                        <button
                            key={idx}
                            onClick={() => router.push(item.route)}
                            className="liquid-glass w-full flex items-center gap-4 p-4 rounded-[22px] hover:scale-[1.01] active:scale-[0.99] transition-all text-left group"
                        >
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105
                                ${item.bg.includes('red') ? 'bg-ios-red/15' : item.bg.includes('green') ? 'bg-ios-green/15' : item.bg.includes('blue') ? 'bg-ios-blue/15' : item.bg.includes('amber') ? 'bg-orange-500/15' : item.bg.includes('orange') ? 'bg-orange-500/15' : item.bg.includes('purple') ? 'bg-purple-500/15' : 'bg-ios-gray/15'}`}>
                                <Icon className={iconColor} size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[15px] font-bold text-foreground group-hover:text-ios-blue transition-colors truncate">{item.title}</h3>
                                <p className="text-[13px] text-foreground/50 mt-0.5 truncate">{item.description}</p>
                            </div>
                            <ChevronRight size={18} className="text-foreground/25 group-hover:text-ios-blue transition-colors shrink-0" />
                        </button>
                    );
                })}
            </div>

            <button
                onClick={handleSignOut}
                className="liquid-glass w-full flex items-center justify-center gap-2 p-4 mt-6 text-ios-red font-bold rounded-[22px] hover:scale-[1.01] active:scale-[0.99] transition-all"
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

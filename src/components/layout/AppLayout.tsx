"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    ShoppingCart,
    Package,
    Users,
    Settings,
    FileText,
    DollarSign,
    Menu,
    ShieldAlert,
    Sun,
    Moon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();
    const { isDarkTheme, toggleTheme } = useAppTheme();

    const isAuthRoute = pathname.startsWith('/auth');

    if (isAuthRoute) {
        return <>{children}</>;
    }

    const isAdminGod = user?.role === 'admingod';

    const navItems = isAdminGod ? [
        { name: 'Control', href: '/admin/dashboard', icon: ShieldAlert },
        { name: 'Usuarios', href: '/admin/users', icon: Users },
        { name: 'Menú', href: '/admin/menu', icon: Menu },
    ] : [
        { name: 'Venta', href: '/pos', icon: ShoppingCart },
        { name: 'Inventario', href: '/inventory', icon: Package },
        { name: 'Clientes', href: '/clients', icon: Users },
        { name: 'Cobranzas', href: '/collections', icon: DollarSign },
        { name: 'Reportes', href: '/reports', icon: FileText },
        { name: 'Más', href: '/menu', icon: Menu },
    ];

    // For mobile bottom nav
    const mobileNavItems = navItems.slice(0, 4);

    return (
        <div className="flex h-screen transition-colors duration-300">

            {/* Desktop Sidebar - Bento Liquid Glass */}
            <aside className="hidden md:flex flex-col w-64 shrink-0 p-3 gap-2.5 overflow-y-auto">

                {/* Bento 1 — Logo Section */}
                <div className="ui-card px-6 py-6 mb-2 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-linear-to-br from-accent-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <h1 className="text-[28px] font-black tracking-[-0.05em] italic text-accent-primary">
                        Cookie
                    </h1>
                </div>

                {/* Bento 2 — Nav */}
                <div className="ui-card p-2.5 flex-1 shadow-none">
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 group relative active:scale-[0.96] hover:scale-[1.01]
                                        ${isActive
                                            ? 'ui-active-pill z-10'
                                            : 'text-ui-text-muted hover:text-ui-text hover:bg-black/5 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className={`flex items-center justify-center w-6 h-6 transition-all shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        <Icon size={20} strokeWidth={isActive ? 3 : 2} className="transition-transform duration-500" />
                                    </div>
                                    <span className={`text-[12px] font-black tracking-widest uppercase transition-all duration-300 ${isActive ? 'opacity-100 translate-x-1' : 'opacity-70 group-hover:opacity-100 group-hover:translate-x-1'}`}>
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bento 3 — User card */}
                <div className="ui-card px-4 py-5 mt-2 shadow-none cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all">
                    <div className="flex items-center justify-between">
                        <div className="overflow-hidden">
                            <p className="text-[15px] font-black text-ui-text truncate leading-tight uppercase tracking-widest">{user?.displayName || 'Usuario'}</p>
                            <p className="text-[11px] text-accent-primary truncate uppercase font-black tracking-widest mt-1.5">{user?.role || 'Staff'}</p>
                        </div>
                        
                        {/* Flat Theme Switch Toggle */}
                        <div
                            onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                            className="relative w-14 h-7 rounded-full bg-black/5 dark:bg-white/10 p-1 transition-all duration-500 focus:outline-none group flex items-center shadow-inner"
                        >
                            <div 
                                className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-all duration-500 flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm
                                    ${isDarkTheme ? 'translate-x-7' : 'translate-x-0'}`}
                            >
                                {isDarkTheme ? (
                                    <Moon size={12} className="text-accent-primary fill-accent-primary" />
                                ) : (
                                    <Sun size={12} className="text-amber-500 fill-amber-500" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative">
                <div className="h-full w-full max-w-7xl mx-auto px-4 md:px-8 py-4 sm:py-6 container-mobile-fix">
                    {children}
                </div>
            </main>

            {/* Floating Mobile Tab Pill */}
            <nav className="md:hidden fixed z-[90] transition-all duration-300 mobile-nav-pill left-0 right-0">
                <div className="flex justify-around items-center h-[56px]">
                    {mobileNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 active:scale-90 relative
                                    ${isActive ? 'mobile-tab-active' : 'opacity-40 text-ui-text'}
                                `}
                            >
                                <div className={`p-2 rounded-xl transition-all duration-500 ${isActive ? 'bg-accent-primary/10 scale-110' : ''}`}>
                                    <Icon size={22} strokeWidth={isActive ? 3 : 2} className="transition-transform duration-300" />
                                </div>
                                {isActive && (
                                    <div className="absolute -bottom-1 w-1 h-1 bg-accent-primary rounded-full animate-bounce" />
                                )}
                            </Link>
                        )
                    })}
                    {navItems.length > 4 && (
                        <Link
                            href="/menu"
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 active:scale-90 relative
                                ${pathname === '/menu' ? 'mobile-tab-active' : 'opacity-40 text-ui-text'}
                            `}
                        >
                            <div className={`p-2 rounded-xl transition-all duration-500 ${pathname === '/menu' ? 'bg-accent-primary/10 scale-110' : ''}`}>
                                <Menu size={22} strokeWidth={pathname === '/menu' ? 3 : 2} />
                            </div>
                            {pathname === '/menu' && (
                                <div className="absolute -bottom-1 w-1 h-1 bg-accent-primary rounded-full animate-bounce" />
                            )}
                        </Link>
                    )}
                </div>
            </nav>

        </div>
    );
}

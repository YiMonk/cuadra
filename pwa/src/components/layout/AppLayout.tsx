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
                <div className="neo-raised rounded-neo px-6 py-6 mb-2 flex items-center justify-center border border-white/5 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/10 to-accent-purple/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <h1 className="text-[28px] font-black tracking-[-0.05em] italic neo-accent-text"
                        style={{ filter: 'drop-shadow(0 0 15px rgba(22,200,242,0.4))' }}>
                        Cookie
                    </h1>
                </div>

                {/* Bento 2 — Nav */}
                <div className="neo-pressed rounded-neo-lg p-2.5 flex-1 border border-white/5 shadow-inner">
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3.5 py-3 rounded-neo transition-all duration-300 group relative
                                        active:scale-[0.96] hover:scale-[1.01]
                                        ${isActive
                                            ? 'neo-accent-bg text-white shadow-[0_4px_20px_rgba(22,200,242,0.4)] z-10'
                                            : 'text-neo-text-muted hover:text-neo-text hover:bg-white/5 active:neo-pressed'
                                        }`}
                                >
                                    <div className={`flex items-center justify-center w-6 h-6 transition-all shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                        <Icon size={20} strokeWidth={isActive ? 3 : 2} className="transition-transform duration-500" />
                                    </div>
                                    <span className={`text-[12px] font-black tracking-widest uppercase transition-all duration-300 ${isActive ? 'opacity-100 translate-x-1' : 'opacity-70 group-hover:opacity-100 group-hover:translate-x-1'}`}>
                                        {item.name}
                                    </span>
                                    {isActive && (
                                        <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-pulse" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bento 3 — User card */}
                <div className="neo-raised rounded-neo px-4 py-5 mt-2 border border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="overflow-hidden">
                            <p className="text-[15px] font-black text-neo-text truncate leading-tight uppercase tracking-widest">{user?.displayName || 'Usuario'}</p>
                            <p className="text-[11px] text-accent-cyan truncate uppercase font-black tracking-widest mt-1.5">{user?.role || 'Staff'}</p>
                        </div>
                        
                        {/* Neumorphic Theme Switch */}
                        <button
                            onClick={toggleTheme}
                            className="relative w-14 h-7 rounded-full neo-pressed p-1 transition-all duration-500 focus:outline-none group"
                        >
                            <div 
                                className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-all duration-500 flex items-center justify-center
                                    ${isDarkTheme 
                                        ? 'translate-x-7 bg-[#2D3238] shadow-[0_2px_8px_rgba(0,0,0,0.5)]' 
                                        : 'translate-x-0 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
                                    }`}
                            >
                                {isDarkTheme ? (
                                    <Moon size={12} className="text-blue-400 fill-blue-400" />
                                ) : (
                                    <Sun size={12} className="text-orange-400 fill-orange-400" />
                                )}
                            </div>
                            <div className="flex justify-between px-1.5 items-center h-full w-full opacity-30 group-hover:opacity-60 transition-opacity">
                                <Sun size={10} className={isDarkTheme ? 'text-white' : 'hidden'} />
                                <Moon size={10} className={isDarkTheme ? 'hidden' : 'text-slate-600'} />
                            </div>
                        </button>
                    </div>
                </div>

            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative">
                <div className="h-full w-full max-w-7xl mx-auto px-4 md:px-8 py-4 sm:py-6 container-mobile-fix">
                    {children}
                </div>
            </main>

            {/* Mobile Tab Bar (iOS Style) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-300">
                <div className="mobile-nav-glass border-t border-white/5 pb-(--safe-area-bottom) px-2 shadow-2xl">
                    <div className="flex justify-around items-center h-[64px]">
                        {mobileNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 active:scale-90 relative
                                        ${isActive ? 'mobile-tab-active' : 'opacity-40 text-neo-text'}
                                    `}
                                >
                                    <div className={`p-1.5 rounded-full transition-all duration-500 ${isActive ? 'neo-pressed scale-110 shadow-inner' : ''}`}>
                                        <Icon size={24} strokeWidth={isActive ? 3 : 2} className="transition-transform duration-300" />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                                        {item.name}
                                    </span>
                                    {isActive && (
                                        <div className="absolute -bottom-1 w-8 h-1 neo-accent-bg rounded-t-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                    )}
                                </Link>
                            )
                        })}
                        {navItems.length > 4 && (
                            <Link
                                href="/menu"
                                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 active:scale-90 relative
                                    ${pathname === '/menu' ? 'mobile-tab-active' : 'opacity-40 text-neo-text'}
                                `}
                            >
                                <div className={`p-1.5 rounded-full transition-all duration-500 ${pathname === '/menu' ? 'neo-pressed scale-110 shadow-inner' : ''}`}>
                                    <Menu size={24} strokeWidth={pathname === '/menu' ? 3 : 2} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${pathname === '/menu' ? 'opacity-100' : 'opacity-70'}`}>
                                    Más
                                </span>
                                {pathname === '/menu' && (
                                    <div className="absolute -bottom-1 w-8 h-1 neo-accent-bg rounded-t-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                                )}
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

        </div>
    );
}

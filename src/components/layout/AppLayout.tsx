"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
    Moon,
    LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading, signOut } = useAuth();
    const { isDarkTheme, toggleTheme } = useAppTheme();

    const isAuthRoute = pathname.startsWith('/auth');

    useEffect(() => {
        if (!isLoading && !user && !isAuthRoute) {
            router.push('/auth/login');
        }
    }, [isLoading, user, isAuthRoute, router]);

    if (isAuthRoute) {
        return <>{children}</>;
    }

    const isGlobalAdmin = user?.role === 'admingod' || user?.role === 'admin';
    const isStaff = user?.role === 'staff';
    const isOwner = user?.role === 'owner';

    const navItems = isGlobalAdmin ? [
        { name: 'Control', href: '/admin/dashboard', icon: ShieldAlert },
        { name: 'Usuarios', href: '/admin/users', icon: Users },
    ] : isStaff ? [
        { name: 'Venta', href: '/pos', icon: ShoppingCart },
        { name: 'Inventario', href: '/inventory', icon: Package },
        { name: 'Clientes', href: '/clients', icon: Users },
        { name: 'Menú', href: '/menu', icon: Menu },
    ] : [
        // Default Owner / Manager View
        { name: 'Venta', href: '/pos', icon: ShoppingCart },
        { name: 'Inventario', href: '/inventory', icon: Package },
        { name: 'Clientes', href: '/clients', icon: Users },
        { name: 'Reportes', href: '/reports', icon: FileText },
        { name: 'Equipo', href: '/team', icon: Users },
        { name: 'Config', href: '/settings', icon: Settings },
        { name: 'Menú', href: '/menu', icon: Menu },
    ];

    // For mobile bottom nav
    const mobileNavItems = (isGlobalAdmin || isStaff) ? navItems : navItems.slice(0, 5);

    return (
        <div className="flex h-screen bg-ui-bg transition-colors duration-500 font-sans overflow-hidden md:overflow-visible">

            {/* Desktop Floating Sidebar Pill */}
            <aside className="hidden md:flex flex-col h-full py-8 pl-8 shrink-0 z-50">
                <div className="ui-glass-sidebar w-20 flex flex-col h-full items-center py-6 shadow-float transition-all duration-700">
                    
                    {/* Logo Section */}
                    <div className="mb-10 relative group">
                        <div className="absolute -inset-2 bg-gradient-to-tr from-accent-primary to-accent-secondary opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700" />
                        <div className="relative w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-black shadow-lg">
                            <span className="text-xl font-black italic">C</span>
                        </div>
                    </div>

                    {/* Navigation Icons Only */}
                    <nav className="flex-1 flex flex-col items-center gap-6 w-full">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={item.name}
                                    className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-400 group active:scale-90
                                        ${isActive
                                            ? 'bg-white text-black shadow-[0_8px_30px_rgba(255,255,255,0.3)]'
                                            : 'text-white/40 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                                    {isActive && (
                                        <div className="absolute -right-1 w-1 h-4 bg-white rounded-full" />
                                    )}
                                    
                                    {/* Tooltip */}
                                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-black/90 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap shadow-2xl z-[100] border border-white/10">
                                        {item.name}
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom Actions - Theme Toggle */}
                    <div className="mt-auto flex flex-col items-center gap-6">
                        <button
                            onClick={toggleTheme}
                            className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                        >
                            {isDarkTheme ? <Moon size={22} /> : <Sun size={22} />}
                        </button>

                        <div className="w-10 h-10 rounded-full border-2 border-white/20 p-0.5 relative group cursor-pointer overflow-hidden" onClick={signOut}>
                            <div className="w-full h-full bg-accent-primary rounded-full flex items-center justify-center text-[10px] font-black italic group-hover:bg-red-500 transition-colors">
                                <LogOut size={16} className="text-white opacity-0 group-hover:opacity-100 absolute transition-opacity" />
                                <span className="group-hover:opacity-0 transition-opacity">{user?.displayName?.[0] || 'U'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area: The Bento Canvas */}
            <main className="flex-1 h-full overflow-y-auto relative custom-scrollbar overflow-x-hidden">
                <div className="w-full max-w-[1400px] mx-auto px-4 md:px-12 pt-8 md:pt-12 pb-32 md:pb-12 h-auto min-h-full">
                    {/* Page Header (Bento Style) */}
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-1000">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-ui-text">
                                {navItems.find(n => pathname.startsWith(n.href))?.name || 'Dashboard'}
                            </h2>
                            <p className="text-ui-text-muted font-bold mt-2 uppercase tracking-[0.2em] text-xs">
                                Gestiona tus operaciones diarias con Mermis 2025
                            </p>
                        </div>
                        
                        {!isGlobalAdmin && (
                            <div className="flex items-center gap-3">
                                <div className="ui-card px-6 py-3 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-accent-success animate-pulse" />
                                    <span className="text-xs font-black uppercase tracking-widest text-ui-text">Sistema Activo</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="animate-in fade-in zoom-in-95 duration-700">
                        {children}
                    </div>
                </div>
            </main>

            {/* Mobile Floating Bottom Pill */}
            <nav className="md:hidden fixed z-[90] left-4 right-4 bottom-6 transition-all duration-500 overflow-hidden">
                <div className="ui-card backdrop-blur-3xl bg-white/80 dark:bg-black/80 p-1 flex justify-around items-center h-[72px] rounded-[36px] border border-black/5 dark:border-white/10 shadow-float">
                    {mobileNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 active:scale-90 relative
                                    ${isActive ? 'text-white dark:text-black' : 'text-white/40 dark:text-black/40'}
                                `}
                            >
                                <div className={`p-2 rounded-2xl transition-all duration-500 ${isActive ? 'bg-white/10 dark:bg-black/10 scale-110' : ''}`}>
                                    <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                                </div>
                                {isActive && (
                                    <div className="absolute -bottom-1 w-1.5 h-1.5 bg-accent-primary rounded-full" />
                                )}
                            </Link>
                        )
                    })}
                </div>
            </nav>

        </div>
    );
}

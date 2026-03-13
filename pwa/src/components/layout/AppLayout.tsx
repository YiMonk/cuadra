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

            {/* Desktop Sidebar - iOS Inspired */}
            <aside className="hidden md:flex flex-col w-64 border-r border-ios-separator/30 bg-ios-secondary-bg">
                <div className="p-8">
                    <h1 className="text-2xl font-bold tracking-tight text-ios-blue">
                        Cookie
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-ios transition-all duration-200 ${isActive
                                    ? 'bg-ios-blue text-white'
                                    : 'text-foreground/70 hover:bg-foreground/5'
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="text-[15px] font-medium">{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-6 border-t border-ios-separator/20">
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 shrink-0 rounded-full bg-ios-blue/10 flex items-center justify-center text-ios-blue font-semibold border border-ios-blue/20">
                                {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="overflow-hidden flex-1">
                                <p className="text-[14px] font-semibold text-foreground truncate">{user?.displayName || 'Usuario'}</p>
                                <p className="text-[12px] text-foreground-secondary truncate uppercase">{user?.role || 'Staff'}</p>
                            </div>
                        </div>
                        <button onClick={toggleTheme} className="p-2.5 rounded-full hover:bg-foreground/5 text-foreground/60 transition-colors">
                            {isDarkTheme ? <Sun size={19} /> : <Moon size={19} />}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto pb-[calc(76px+var(--safe-area-bottom))] md:pb-0 relative">
                <div className="h-full w-full max-w-7xl mx-auto px-4 md:px-8 py-4">
                    {children}
                </div>
            </main>

            {/* Mobile Tab Bar (iOS Style) */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 transition-all duration-200">
                <div className="ios-glass border-t border-ios-separator/30 pb-(--safe-area-bottom)">
                    <div className="flex justify-around items-center h-[60px] px-2">
                        {mobileNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${isActive
                                        ? 'text-ios-blue'
                                        : 'text-ios-gray'
                                        }`}
                                >
                                    <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                                    <span className="text-[10px] font-medium leading-none">
                                        {item.name}
                                    </span>
                                </Link>
                            )
                        })}
                        {navItems.length > 4 && (
                            <Link
                                href="/menu"
                                className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${pathname === '/menu'
                                    ? 'text-ios-blue'
                                    : 'text-ios-gray'
                                    }`}
                            >
                                <Menu size={26} strokeWidth={pathname === '/menu' ? 2.5 : 2} />
                                <span className="text-[10px] font-medium leading-none">
                                    Más
                                </span>
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

        </div>
    );
}

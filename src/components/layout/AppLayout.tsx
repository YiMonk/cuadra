"use client";

import React, { useEffect, useState, useRef } from 'react';
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
    Bell,
    ShieldAlert,
    Sun,
    Moon,
    LogOut,
    User
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { ProductService } from '@/services/product.service';
import { SalesService } from '@/services/sales.service';
import { ClientService } from '@/services/client.service';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading, signOut } = useAuth();
    const { isDarkTheme, toggleTheme } = useAppTheme();

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [pendingCollectionsCount, setPendingCollectionsCount] = useState(0);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const isAuthRoute = pathname.startsWith('/auth');

    useEffect(() => {
        // Notification outside click handler
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!user || isAuthRoute) return;

        let items: any[] = [];

        // 1. Subscription Notification
        if (user.role === 'owner' && user.subscriptionEndsAt) {
            const timeDiff = user.subscriptionEndsAt - Date.now();
            if (timeDiff > 0 && timeDiff <= ONE_WEEK_MS) {
                const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                items.push({
                    id: 'sub',
                    type: 'alert',
                    title: 'Suscripción por Vencer',
                    desc: `Tu suscripción termina en ${daysLeft} día(s). Renueva para no perder el acceso.`,
                    icon: ShieldAlert
                });
            } else if (timeDiff <= 0) {
                items.push({
                    id: 'sub-exp',
                    type: 'danger',
                    title: 'Suscripción Vencida',
                    desc: 'Tu suscripción ha expirado. Contacta al administrador urgente.',
                    icon: ShieldAlert
                });
            }
        }

        // 2. Load low inventory and debts if Owner/Admin/Staff
        const loadOtherNotifications = async () => {
            let temp = [...items];
            
            // Check debters
            try {
                const pendingSales = await SalesService.getPendingSales();
                if (pendingSales.length > 0) {
                    const uniqueClients = new Set(pendingSales.map(s => s.clientId).filter(Boolean));
                    setPendingCollectionsCount(uniqueClients.size);
                    if (uniqueClients.size > 0) {
                        temp.push({
                            id: 'debts',
                            type: 'warning',
                            title: 'Cobros Pendientes',
                            desc: `Tienes deudas sin cobrar de ${uniqueClients.size} cliente(s).`,
                            icon: DollarSign,
                            link: '/collections'
                        });
                    }
                }
            } catch (e) { }

            setNotifications(temp);
        };

        loadOtherNotifications();
    }, [user, isAuthRoute]);

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
    ] : [
        // Default Owner / Manager View
        { name: 'Venta', href: '/pos', icon: ShoppingCart },
        { name: 'Inventario', href: '/inventory', icon: Package },
        { name: 'Clientes', href: '/clients', icon: Users },
        { name: 'Reportes', href: '/reports', icon: FileText },
        { name: 'Equipo', href: '/team', icon: Users },
        { name: 'Cobranzas', href: '/collections', icon: DollarSign },
    ];

    // For mobile bottom nav - Always append Profile
    const baseMobileItems = (isGlobalAdmin || isStaff) ? navItems : navItems.slice(0, 4);
    const mobileNavItems = [
        ...baseMobileItems,
        { name: 'Perfil', href: '/settings', icon: User }
    ];

    return (
        <div className="flex h-screen bg-ui-bg transition-colors duration-500 font-sans overflow-hidden md:overflow-visible">

            {/* Desktop Floating Sidebar Pill */}
            <aside className="hidden md:flex flex-col h-full py-8 pl-8 shrink-0 z-50">
                <div className="ui-glass-sidebar w-20 flex flex-col h-full items-center py-6 shadow-float transition-all duration-700">
                    
                    {/* Logo Section */}
                    <div className="mb-10 relative group">
                        <div className="absolute -inset-2 bg-gradient-to-tr from-accent-primary to-accent-secondary opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-700" />
                        <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${isDarkTheme ? 'bg-white text-black' : 'bg-black text-white'}`}>
                            <span className="text-xl font-black italic">C</span>
                        </div>
                    </div>

                    {/* Navigation Icons Only */}
                    <nav className="flex-1 flex flex-col items-center gap-6 w-full">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            // @ts-ignore
                            const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;

                            const content = (
                                <div className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-400 group active:scale-95
                                    ${isActive
                                        ? (isDarkTheme ? 'bg-white text-black shadow-[0_8px_30px_rgba(255,255,255,0.3)]' : 'bg-black text-white shadow-float')
                                        : (isDarkTheme ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-black hover:bg-black/5')
                                    }`}
                                >
                                    <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                                    {isActive && (
                                        <div className="absolute -right-1 w-1 h-4 bg-black dark:bg-white rounded-full" />
                                    )}
                                    {item.name === 'Cobranzas' && pendingCollectionsCount > 0 && (
                                        <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white z-10 shadow-md">
                                            {pendingCollectionsCount > 9 ? '9+' : pendingCollectionsCount}
                                        </div>
                                    )}
                                    
                                    {/* Tooltip */}
                                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-black/90 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap shadow-2xl z-[100] border border-white/10">
                                        {item.name}
                                    </div>
                                </div>
                            );

                            return (
                                // @ts-ignore
                                item.onClick ? (
                                    // @ts-ignore
                                    <button key={item.name} onClick={item.onClick} title={item.name} className="contents">
                                        {content}
                                    </button>
                                ) : (
                                    // @ts-ignore
                                    <Link key={item.name} href={item.href} title={item.name} className="contents">
                                        {content}
                                    </Link>
                                )
                            );
                        })}
                    </nav>

                    {/* Bottom Actions - Theme Toggle */}
                    <div className="mt-auto flex flex-col items-center gap-6">
                        <button
                            onClick={toggleTheme}
                            className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-90"
                        >
                            {isDarkTheme ? <Moon size={22} /> : <Sun size={22} />}
                        </button>

                        <div className="w-10 h-10 rounded-full border-2 border-white/20 p-0.5 relative group cursor-pointer overflow-hidden active:scale-95 transition-transform" onClick={() => router.push('/settings')}>
                            <div className="w-full h-full bg-accent-primary rounded-full flex items-center justify-center text-[10px] font-black italic group-hover:bg-accent-secondary transition-colors text-white">
                                {user?.displayName?.[0] || 'U'}
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
                            <div className="flex items-center gap-3 relative" ref={notificationsRef}>
                                <button 
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className={`relative w-12 h-12 rounded-2xl transition-colors border flex items-center justify-center group active:scale-95 shadow-sm ${notificationsOpen ? 'bg-white/10 dark:bg-black/10 border-accent-primary' : 'ui-card hover:bg-black/5 dark:hover:bg-white/5 border-ui-border'}`}
                                >
                                    <Bell size={22} className={`${notificationsOpen ? 'text-accent-primary' : 'text-ui-text-muted group-hover:text-accent-primary'} transition-colors`} />
                                    {notifications.length > 0 && (
                                        <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-ui-bg animate-pulse" />
                                    )}
                                </button>

                                {/* Notifications Dropdown */}
                                {notificationsOpen && (
                                    <div className="absolute top-16 right-0 w-80 max-w-[calc(100vw-2rem)] ui-card border border-ui-border backdrop-blur-xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 rounded-3xl">
                                        <div className="p-4 border-b border-ui-border/50 flex items-center justify-between bg-black/2 dark:bg-white/2">
                                            <h3 className="font-black text-ui-text uppercase tracking-widest text-xs">Notificaciones</h3>
                                            <span className="text-[10px] bg-accent-primary text-white px-2 py-0.5 rounded-full font-bold">{notifications.length}</span>
                                        </div>
                                        <div className="p-2 max-h-[60vh] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-ui-text-muted/40 flex flex-col items-center">
                                                    <Bell size={32} className="mb-2 opacity-30" />
                                                    <span className="font-bold text-xs uppercase tracking-widest">No hay alertas</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {notifications.map((notif) => {
                                                        const Icon = notif.icon;
                                                        const isDanger = notif.type === 'danger';
                                                        const isAlert = notif.type === 'alert';
                                                        
                                                        return (
                                                            <div 
                                                                key={notif.id} 
                                                                onClick={() => { if(notif.link) { router.push(notif.link); setNotificationsOpen(false); } }}
                                                                className={`p-3 rounded-2xl flex gap-3 transition-colors ${notif.link ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5' : ''} ${isDanger ? 'bg-red-500/10 border border-red-500/20' : isAlert ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-transparent'}`}
                                                            >
                                                                <div className={`mt-0.5 p-2 rounded-full h-fit flex shrink-0 ${isDanger ? 'bg-red-500 text-white' : isAlert ? 'bg-orange-500 text-white' : 'bg-accent-primary/10 text-accent-primary'}`}>
                                                                    <Icon size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className={`text-xs font-black uppercase mb-0.5 ${isDanger ? 'text-red-600 dark:text-red-400' : isAlert ? 'text-orange-600 dark:text-orange-400' : 'text-ui-text'}`}>
                                                                        {notif.title}
                                                                    </p>
                                                                    <p className="text-[11px] font-medium text-ui-text-muted leading-tight">{notif.desc}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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
                        // @ts-ignore
                        const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;

                        const content = (
                            <div className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 active:scale-90 relative
                                ${isActive ? 'text-white dark:text-black' : 'text-white/60 dark:text-black/60'}
                            `}>
                                <div className={`p-2 rounded-2xl transition-all duration-500 ${isActive ? 'bg-white/10 dark:bg-black/10 scale-110' : ''}`}>
                                    <Icon size={24} strokeWidth={isActive ? 3 : 2} />
                                </div>
                                {isActive && (
                                    <div className="absolute -bottom-1 w-1.5 h-1.5 bg-accent-primary rounded-full" />
                                )}
                                {item.name === 'Cobranzas' && pendingCollectionsCount > 0 && (
                                    <div className="absolute top-1 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-transparent flex items-center justify-center text-[8px] font-bold text-white shadow-md z-10">
                                        {pendingCollectionsCount > 9 ? '9+' : pendingCollectionsCount}
                                    </div>
                                )}
                            </div>
                        );

                        return (
                            // @ts-ignore
                            item.onClick ? (
                                <button key={item.name} onClick={item.onClick} className="flex-1 h-full">
                                    {content}
                                </button>
                            ) : (
                                <Link
                                    // @ts-ignore
                                    key={item.name}
                                    // @ts-ignore
                                    href={item.href}
                                    className="flex-1 h-full"
                                >
                                    {content}
                                </Link>
                            )
                        );
                    })}
                </div>
            </nav>

        </div>
    );
}

"use client";

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
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
    Archive,
    Bell,
    ShieldAlert,
    Sun,
    Moon,
    LogOut,
    User,
    Clock,
    ChevronLeft,
    ChevronRight,
    Plus,
    Minus,
    MoreHorizontal,
    Receipt,
    Truck
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useAppTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useNotifications } from '@/hooks/useNotifications';
import { UserService } from '@/services/user.service';
import { BRAND_ASSETS } from '@/config/brand';
import { DisclaimerBanner } from '@/components/DisclaimerBanner';
import { TermsAcceptanceModal } from '@/components/legal/TermsAcceptanceModal';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { WikiSearchModal } from '@/components/wiki/WikiSearchModal';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type NavSubItem = {
    name: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
};

type NavItem = {
    name: string;
    href?: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
    onClick?: (e: React.MouseEvent) => void;
    children?: NavSubItem[];
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoading, signOut, reloadUser, patchUser } = useAuth();
    const { isGlobalAdmin, isStaff, isOwner } = useRole();
    const { isDarkTheme, toggleTheme } = useAppTheme();
    const { items } = useCart();
    const { currency, exchangeRate, toggleCurrency, isLoading: currencyLoading } = useCurrency();
    const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

    const isAuthRoute = pathname.startsWith('/auth');
    const ownerId = (!isAuthRoute && user) ? (user.ownerId || user.uid) : null;
    const { pendingClientsCount: pendingCollectionsCount } = useNotifications(ownerId);

    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
    const [mobileSelectedMenu, setMobileSelectedMenu] = useState<string | null>(null);

    const toggleSubmenu = (name: string) => {
        if (!sidebarExpanded) {
            setSidebarExpanded(true);
            setExpandedItems(new Set([name]));
            return;
        }
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const handleLogout = () => {
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

        const notifItems: any[] = [];

        // Subscription Notification
        if (user.role === 'owner' && user.subscriptionEndsAt) {
            const timeDiff = user.subscriptionEndsAt - Date.now();
            if (timeDiff > 0 && timeDiff <= ONE_WEEK_MS) {
                const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                notifItems.push({
                    id: 'sub',
                    type: 'alert',
                    title: 'Suscripción por Vencer',
                    desc: `Tu suscripción termina en ${daysLeft} día(s). Renueva para no perder el acceso.`,
                    icon: ShieldAlert
                });
            } else if (timeDiff <= 0) {
                notifItems.push({
                    id: 'sub-exp',
                    type: 'danger',
                    title: 'Suscripción Vencida',
                    desc: 'Tu suscripción ha expirado. Contacta al administrador urgente.',
                    icon: ShieldAlert
                });
            }
        }

        setNotifications(notifItems);
    }, [user, isAuthRoute]);

    // Sync real-time pending collections into notifications list
    useEffect(() => {
        setNotifications(prev => {
            const withoutDebts = prev.filter(n => n.id !== 'debts');
            if (pendingCollectionsCount > 0) {
                return [...withoutDebts, {
                    id: 'debts',
                    type: 'warning',
                    title: 'Cobros Pendientes',
                    desc: `Tienes deudas sin cobrar de ${pendingCollectionsCount} cliente(s).`,
                    icon: DollarSign,
                    link: '/collections'
                }];
            }
            return withoutDebts;
        });
    }, [pendingCollectionsCount]);

    // Show/hide terms modal based on acceptance state
    useEffect(() => {
        if (!user || isAuthRoute) return;
        setShowTermsModal(!user.termsAccepted);
    }, [user, isAuthRoute]);

    // First-login onboarding (después de aceptar términos, solo owners no admin)
    useEffect(() => {
        if (
            user &&
            !isAuthRoute &&
            user.termsAccepted &&
            !user.onboardingCompletedAt &&
            user.role !== 'staff' &&
            user.role !== 'admin' &&
            user.role !== 'admingod'
        ) {
            setShowOnboarding(true);
        } else {
            setShowOnboarding(false);
        }
    }, [user, isAuthRoute]);

    const handleAcceptTerms = async () => {
        if (!user) return;
        try {
            await UserService.updateUser(user.uid, { termsAccepted: true });
            // Update state immediately to avoid race condition with reloadUser
            patchUser({ termsAccepted: true });
        } catch (error) {
            console.error('Error accepting terms:', error);
            throw error;
        }
    };

    useEffect(() => {
        if (!isLoading && !user && !isAuthRoute) {
            router.push('/auth/login');
        }
    }, [isLoading, user, isAuthRoute, router]);

    if (isAuthRoute) {
        return <>{children}</>;
    }

    const navItems: NavItem[] = isGlobalAdmin ? [
        { name: 'Control', href: '/admin/dashboard', icon: ShieldAlert },
        { name: 'Usuarios', href: '/admin/users', icon: Users },
        { name: 'Historial', href: '/admin/activities', icon: Clock },
    ] : isStaff ? [
        { name: 'Ventas', href: '/pos', icon: ShoppingCart },
        { name: 'Inventario', href: '/inventory', icon: Package },
        { name: 'Clientes', href: '/clients', icon: Users },
    ] : [
        // Default Owner / Manager View
        { name: 'Ventas', href: '/pos', icon: ShoppingCart },
        { name: 'Inventario', icon: Package, children: [
            { name: 'Gestión', icon: Package, href: '/inventory' },
            { name: 'Transferencias', icon: Truck, href: '/inventory/transfers' },
            { name: 'Importar', icon: Archive, href: '/inventory/import' },
        ]},
        { name: 'Clientes', href: '/clients', icon: Users },
        { name: 'Cierre de Caja', href: '/cash', icon: DollarSign },
        {
            name: 'Más',
            icon: MoreHorizontal,
            children: [
                { name: 'Reportes', icon: FileText, href: '/reports' },
                { name: 'Pricing & Promos', icon: DollarSign, href: '/business/pricing' },
                { name: 'Movimientos', icon: Archive, href: '/collections' },
                { name: 'Gastos', icon: Receipt, href: '/expenses' },
                { name: 'Proveedores', icon: Truck, href: '/suppliers' },
                { name: 'Mi Equipo', icon: Users, href: '/business/team' },
            ]
        },
    ];

    // For mobile bottom nav - Same as desktop for consistency
    const baseMobileItems = navItems;
    const mobileNavItems: NavItem[] = baseMobileItems.map(item => ({
        ...item,
        onClick: item.href === '/pos' ? (e: React.MouseEvent) => {
            if (pathname === '/pos') {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('toggle-cart'));
            } else {
                router.push('/pos');
            }
        } : undefined
    }));

    return (
        <div className="flex h-screen bg-ui-bg transition-colors duration-500 font-sans overflow-hidden md:overflow-visible">
            <WikiSearchModal />
            <TermsAcceptanceModal isOpen={showTermsModal} onAccept={handleAcceptTerms} />
            {showOnboarding && <OnboardingWizard onClose={() => setShowOnboarding(false)} forced />}

            {/* Desktop Expandable Sidebar */}
            <aside className={`hidden md:flex flex-col h-full py-6 pl-6 shrink-0 z-50 transition-all duration-500 ease-out ${sidebarExpanded ? 'w-72' : 'w-24'}`}>
                <div className={`ui-glass-sidebar flex flex-col h-full rounded-[2rem] py-5 shadow-float transition-all duration-500 ease-out border border-ui-border/30 ${sidebarExpanded ? 'px-4' : 'px-3'}`}>

                    {/* Header: Logo (clickable to toggle) + Title + Collapse Toggle */}
                    <div className={`flex items-center mb-6 ${sidebarExpanded ? 'justify-between px-2' : 'justify-center'}`}>
                        <button
                            onClick={() => {
                                if (sidebarExpanded) {
                                    setSidebarExpanded(false);
                                    setExpandedItems(new Set());
                                } else {
                                    setSidebarExpanded(true);
                                }
                            }}
                            className="flex items-center gap-3 group"
                            title={sidebarExpanded ? 'Contraer menú' : 'Expandir menú'}
                        >
                            <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105 ${isDarkTheme ? 'bg-white' : 'bg-black'}`}>
                                <img
                                    src={BRAND_ASSETS.logo_icon}
                                    alt="Cuadra"
                                    className={`w-6 h-auto ${isDarkTheme ? '' : 'brightness-0 invert'}`}
                                />
                            </div>
                            {sidebarExpanded && (
                                <span className="text-base font-black tracking-tight text-foreground">Menu</span>
                            )}
                        </button>

                        {sidebarExpanded && (
                            <button
                                onClick={() => {
                                    setSidebarExpanded(false);
                                    setExpandedItems(new Set());
                                }}
                                className="p-1.5 hover:bg-ui-bg rounded-lg transition-colors flex-shrink-0"
                                title="Contraer menú"
                            >
                                <ChevronLeft size={18} className="text-foreground/60" />
                            </button>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 flex flex-col gap-1 w-full overflow-y-auto overflow-x-hidden hide-scrollbar">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;
                            const hasChildren = !!item.children?.length;
                            const isSubmenuOpen = expandedItems.has(item.name);
                            const hasActiveChild = hasChildren && item.children!.some(c => pathname === c.href || pathname.startsWith(c.href + '/'));

                            const itemContent = (
                                <>
                                    <div className="relative flex-shrink-0 flex items-center justify-center w-6 h-6">
                                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                        {item.name === 'Ventas' && cartItemsCount > 0 && !sidebarExpanded && (
                                            <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg border-2 border-ui-bg">
                                                {cartItemsCount > 9 ? '9+' : cartItemsCount}
                                            </div>
                                        )}
                                        {item.name === 'Clientes' && pendingCollectionsCount > 0 && !sidebarExpanded && (
                                            <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg border-2 border-ui-bg animate-pulse">
                                                {pendingCollectionsCount > 9 ? '9+' : pendingCollectionsCount}
                                            </div>
                                        )}
                                    </div>
                                    {sidebarExpanded && (
                                        <span className="flex-1 text-sm font-semibold text-left whitespace-nowrap">{item.name}</span>
                                    )}
                                    {sidebarExpanded && item.name === 'Ventas' && cartItemsCount > 0 && (
                                        <div className={`min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                                            {cartItemsCount > 9 ? '9+' : cartItemsCount}
                                        </div>
                                    )}
                                    {sidebarExpanded && item.name === 'Clientes' && pendingCollectionsCount > 0 && (
                                        <div className={`min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black animate-pulse ${isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                                            {pendingCollectionsCount > 9 ? '9+' : pendingCollectionsCount}
                                        </div>
                                    )}
                                    {sidebarExpanded && hasChildren && (
                                        <div className={`flex items-center justify-center w-5 h-5 rounded-md ${isSubmenuOpen ? 'bg-foreground/10' : ''}`}>
                                            {isSubmenuOpen ? <Minus size={14} /> : <Plus size={14} />}
                                        </div>
                                    )}
                                </>
                            );

                            const baseClasses = `w-full flex items-center gap-3 rounded-xl transition-all duration-200 group ${sidebarExpanded ? 'px-3 py-2.5' : 'px-3 py-3 justify-center'}`;
                            const activeClasses = isActive || (hasActiveChild && !isSubmenuOpen)
                                ? 'bg-foreground text-background shadow-lg'
                                : 'text-foreground/70 hover:bg-ui-bg hover:text-foreground';

                            return (
                                <div key={item.name} className="w-full">
                                    {hasChildren ? (
                                        <button
                                            onClick={() => toggleSubmenu(item.name)}
                                            className={`${baseClasses} ${activeClasses}`}
                                            title={!sidebarExpanded ? item.name : undefined}
                                        >
                                            {itemContent}
                                        </button>
                                    ) : item.href ? (
                                        <Link
                                            href={item.href}
                                            className={`${baseClasses} ${activeClasses}`}
                                            title={!sidebarExpanded ? item.name : undefined}
                                        >
                                            {itemContent}
                                        </Link>
                                    ) : null}

                                    {/* Submenu (inline expandable) */}
                                    {hasChildren && sidebarExpanded && isSubmenuOpen && (
                                        <div className="mt-1 mb-2 ml-3 pl-3 border-l border-ui-border/40 space-y-0.5 animate-in slide-in-from-top-2 fade-in duration-200">
                                            {item.children!.map((sub) => {
                                                const SubIcon = sub.icon;
                                                const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                                                return (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${isSubActive ? 'bg-ui-surface border border-ui-border shadow-sm text-foreground' : 'text-foreground/60 hover:bg-ui-bg hover:text-foreground'}`}
                                                    >
                                                        <SubIcon size={16} className="flex-shrink-0" />
                                                        <span className="text-[13px] font-semibold whitespace-nowrap">{sub.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>

                    {/* Bottom: User Profile only */}
                    <div className="mt-4 pt-4 border-t border-ui-border/30 w-full">
                        <button
                            onClick={() => router.push('/settings')}
                            className={`w-full flex items-center gap-3 rounded-xl transition-all ${sidebarExpanded ? 'px-3 py-2.5 bg-ui-bg hover:bg-ui-surface' : 'px-3 py-3 justify-center hover:bg-ui-bg'}`}
                            title={user?.displayName || 'Perfil'}
                        >
                            <div className="w-7 h-7 rounded-full bg-accent-primary flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">
                                {user?.displayName?.[0] || 'U'}
                            </div>
                            {sidebarExpanded && (
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-xs font-bold text-foreground truncate">{user?.displayName || 'Usuario'}</p>
                                    <p className="text-[10px] text-foreground/50 uppercase tracking-wider font-bold">{isGlobalAdmin ? 'Admin' : isOwner ? 'Propietario' : 'Staff'}</p>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area: The Bento Canvas */}
            <main className="flex-1 h-full overflow-y-auto relative custom-scrollbar flex flex-col">
                
                {/* Global Sticky Header */}
                <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-ui-bg/80 border-b border-ui-border/30 transition-all duration-300">
                    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-12 h-20 md:h-24 flex items-center justify-between">
                        
                        {/* Left Side: Mobile Logo & Page Context */}
                        <div className="flex items-center gap-4">
                            {/* Mobile Logo (Hidden on Desktop because Sidebar has it) */}
                            <div className="md:hidden flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95 ${isDarkTheme ? 'bg-white' : 'bg-black'}`}>
                                    <img
                                        src={BRAND_ASSETS.logo_icon}
                                        alt="Cuadra"
                                        className={`w-7 h-auto ${isDarkTheme ? '' : 'brightness-0 invert'}`}
                                    />
                                </div>
                                <span className="font-black italic tracking-tighter text-lg bg-gradient-to-r from-ui-text to-ui-text-muted bg-clip-text text-transparent">CUADRA</span>
                            </div>

                            {/* Desktop Page Info (Optional: could show breadcrumbs or active page name) */}
                            <div className="hidden md:flex items-center gap-2">
                                <div className="h-1 w-8 bg-accent-primary rounded-full opacity-50" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-ui-text-muted">Sistema Operativo</span>
                            </div>
                        </div>

                        {/* Right Side: Actions & Profile */}
                        <div className="flex items-center gap-2 md:gap-4" ref={notificationsRef}>
                            {!isGlobalAdmin && (
                                <>
                                    {/* BCV Toggle Button */}
                                    <button
                                        onClick={toggleCurrency}
                                        className="relative h-11 md:h-12 px-3 md:px-4 rounded-xl md:rounded-2xl ui-glass-card border border-ui-border/50 hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all duration-300 active:scale-90 flex items-center gap-3 shadow-premium group overflow-hidden"
                                        title={`Cambiar a ${currency === 'USD' ? 'Bolívares (Bs.)' : 'Dólares ($)'}`}
                                    >
                                        <div className={`w-7 md:w-8 h-7 md:h-8 rounded-full flex items-center justify-center transition-all duration-500 font-black text-[10px] shrink-0 ${currency === 'USD' ? 'bg-accent-primary text-white shadow-glow-violet' : 'bg-orange-500 text-white rotate-[360deg] shadow-glow-orange'}`}>
                                            {currency === 'USD' ? '$' : 'Bs'}
                                        </div>
                                        {!currencyLoading && (
                                            <div className="hidden sm:flex flex-col items-start leading-none">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-ui-text opacity-40 mb-0.5">Tasa BCV</span>
                                                <span className="text-[12px] font-black text-ui-text">Bs. {exchangeRate.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </button>

                                    {/* Cart Toggle Button */}
                                    <button
                                        onClick={() => {
                                            if (pathname !== '/pos') {
                                                router.push('/pos');
                                            } else {
                                                window.dispatchEvent(new CustomEvent('toggle-cart'));
                                            }
                                        }}
                                        className="relative w-11 md:w-12 h-11 md:h-12 rounded-xl md:rounded-2xl ui-glass-card border border-ui-border/50 hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all duration-300 active:scale-90 flex items-center justify-center shadow-premium group"
                                        title="Ver Carrito"
                                    >
                                        <ShoppingCart size={20} className="text-ui-text-muted group-hover:text-accent-primary transition-colors relative z-10" />
                                        {cartItemsCount > 0 && (
                                            <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-accent-primary rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg border-2 border-ui-bg z-20">
                                                {cartItemsCount > 9 ? '9+' : cartItemsCount}
                                            </div>
                                        )}
                                    </button>

                                    {/* Notifications Button */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                                            className={`relative w-11 md:w-12 h-11 md:h-12 rounded-xl md:rounded-2xl transition-all duration-300 border flex items-center justify-center group active:scale-90 shadow-premium ${notificationsOpen ? 'bg-accent-primary/10 border-accent-primary text-accent-primary' : 'ui-glass-card border-ui-border/50 text-ui-text-muted hover:border-accent-primary/50 hover:text-accent-primary'}`}
                                        >
                                            <Bell size={20} className="transition-transform group-hover:rotate-12" />
                                            {notifications.length > 0 && (
                                                <div className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-ui-bg animate-pulse shadow-glow-red" />
                                            )}
                                        </button>

                                        {/* Notifications Dropdown */}
                                        {notificationsOpen && (
                                            <div className="absolute top-14 right-0 w-80 max-w-[calc(100vw-2rem)] ui-glass-card border border-ui-border/50 backdrop-blur-3xl shadow-float z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 rounded-[2rem]">
                                                <div className="p-5 border-b border-ui-border/30 flex items-center justify-between bg-white/5 dark:bg-black/5">
                                                    <h3 className="font-black text-ui-text uppercase tracking-[0.2em] text-[10px]">Notificaciones</h3>
                                                    <span className="text-[9px] bg-accent-primary text-white px-2.5 py-1 rounded-full font-black shadow-lg shadow-accent-primary/30">{notifications.length}</span>
                                                </div>
                                                <div className="p-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                                    {notifications.length === 0 ? (
                                                        <div className="py-12 text-center text-ui-text-muted/30 flex flex-col items-center">
                                                            <div className="w-16 h-16 rounded-full bg-ui-text-muted/5 flex items-center justify-center mb-4">
                                                                <Bell size={28} className="opacity-20" />
                                                            </div>
                                                            <span className="font-black text-[10px] uppercase tracking-widest">Bandeja vacía</span>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {notifications.map((notif) => {
                                                                const Icon = notif.icon;
                                                                const isDanger = notif.type === 'danger';
                                                                const isAlert = notif.type === 'alert';
                                                                
                                                                return (
                                                                    <div 
                                                                        key={notif.id} 
                                                                        onClick={() => { if(notif.link) { router.push(notif.link); setNotificationsOpen(false); } }}
                                                                        className={`p-4 rounded-2xl flex gap-4 transition-all duration-300 border ${notif.link ? 'cursor-pointer hover:translate-x-1 hover:bg-white/5 dark:hover:bg-black/5' : ''} ${isDanger ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' : isAlert ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40' : 'bg-transparent border-transparent'}`}
                                                                    >
                                                                        <div className={`p-2.5 rounded-xl h-fit flex shrink-0 shadow-lg ${isDanger ? 'bg-red-500 text-white' : isAlert ? 'bg-orange-500 text-white' : 'bg-accent-primary text-white'}`}>
                                                                            <Icon size={18} />
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className={`text-[11px] font-black uppercase mb-1 tracking-tight ${isDanger ? 'text-red-600 dark:text-red-400' : isAlert ? 'text-orange-600 dark:text-orange-400' : 'text-ui-text'}`}>
                                                                                {notif.title}
                                                                            </p>
                                                                            <p className="text-[11px] font-bold text-ui-text-muted leading-relaxed line-clamp-2">{notif.desc}</p>
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
                                </>
                            )}

                            {/* Status Pill - Role Indicator */}
                            <div className="hidden sm:flex ui-card h-11 md:h-12 px-5 items-center justify-center border-ui-border shadow-soft bg-white dark:bg-white/5 animate-in fade-in zoom-in duration-500">
                                <div className={`w-2 h-2 rounded-full mr-3 ${isGlobalAdmin ? 'bg-purple-500 shadow-glow-violet' : isOwner ? 'bg-blue-500 shadow-glow-blue' : 'bg-green-500 shadow-glow-green'}`} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-ui-text-muted">
                                    {isGlobalAdmin ? 'Admin God' : isOwner ? 'Propietario' : 'Staff'}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-12 py-8 md:py-12 pb-32 md:pb-12">
                    <div className="animate-in fade-in zoom-in-95 duration-700">
                        <DisclaimerBanner />
                        {children}
                    </div>
                </div>

            </main>

            {/* Mobile Floating Bottom Pill */}
            <nav className="md:hidden fixed z-[90] left-4 right-4 bottom-6 transition-all duration-500">
                <div className="ui-card backdrop-blur-3xl bg-white/80 dark:bg-black/80 px-2 flex justify-around items-center h-[72px] rounded-[36px] border border-black/5 dark:border-white/10 shadow-float">
                    {mobileNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;

                        const content = (
                            <div className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 active:scale-90 relative
                                ${isActive ? 'text-ui-text' : 'text-ui-text-muted'}
                            `}>
                                <div className={`p-1.5 md:p-2 rounded-2xl transition-all duration-500 ${isActive ? (isDarkTheme ? 'bg-accent-primary/20 text-accent-primary scale-110' : 'bg-black/5 scale-110') : ''}`}>
                                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                {isActive && (
                                    <div className="absolute -bottom-1 w-1.5 h-1.5 bg-accent-primary rounded-full animate-in zoom-in" />
                                )}
                                {item.name === 'Ventas' && cartItemsCount > 0 && (
                                    <div className="absolute top-2 right-2 w-4 h-4 bg-accent-primary rounded-full border-2 border-ui-bg flex items-center justify-center text-[8px] font-black text-white shadow-sm z-10 animate-in zoom-in">
                                        {cartItemsCount > 9 ? '9+' : cartItemsCount}
                                    </div>
                                )}
                                {item.name === 'Clientes' && pendingCollectionsCount > 0 && (
                                    <div className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-ui-bg flex items-center justify-center text-[8px] font-black text-white shadow-sm z-10 animate-pulse">
                                        {pendingCollectionsCount > 9 ? '9+' : pendingCollectionsCount}
                                    </div>
                                )}
                            </div>
                        );

                        return (
                            item.children ? (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        setMobileSelectedMenu(item.name);
                                        setMobileMoreOpen(true);
                                    }}
                                    aria-label={item.name}
                                    className="flex-1 h-full"
                                >
                                    {content}
                                </button>
                            ) : item.onClick ? (
                                <button key={item.name} onClick={item.onClick} aria-label={item.name} className="flex-1 h-full">
                                    {content}
                                </button>
                            ) : item.href ? (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    aria-label={item.name}
                                    className="flex-1 h-full"
                                >
                                    {content}
                                </Link>
                            ) : null
                        );
                    })}
                </div>
            </nav>

            {/* Mobile More Sheet */}
            {mobileMoreOpen && (
                <>
                    <div
                        className="md:hidden fixed inset-0 z-[95] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => {
                            setMobileMoreOpen(false);
                            setMobileSelectedMenu(null);
                        }}
                    />
                    <div className="md:hidden fixed z-[96] left-3 right-3 bottom-3 bg-ui-surface border border-ui-border rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-ui-border/50">
                            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                                {mobileSelectedMenu || 'Menú'}
                            </h2>
                            <button
                                onClick={() => {
                                    setMobileMoreOpen(false);
                                    setMobileSelectedMenu(null);
                                }}
                                className="p-1.5 hover:bg-ui-bg rounded-lg transition-colors"
                            >
                                <ChevronLeft size={18} className="text-foreground/60 rotate-90" />
                            </button>
                        </div>
                        <div className="p-3 max-h-[70vh] overflow-y-auto">
                            {navItems.find(i => i.name === mobileSelectedMenu)?.children?.map((sub) => {
                                const SubIcon = sub.icon;
                                const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                                return (
                                    <button
                                        key={sub.href}
                                        onClick={() => {
                                            router.push(sub.href);
                                            setMobileMoreOpen(false);
                                            setMobileSelectedMenu(null);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${isSubActive ? 'bg-foreground text-background' : 'text-foreground hover:bg-ui-bg'}`}
                                    >
                                        <div className={`w-9 h-9 flex items-center justify-center rounded-lg flex-shrink-0 ${isSubActive ? 'bg-white/20' : 'bg-ui-bg'}`}>
                                            <SubIcon size={18} />
                                        </div>
                                        <span className="text-sm font-semibold flex-1 text-left">{sub.name}</span>
                                        <ChevronRight size={16} className="opacity-50" />
                                    </button>
                                );
                            })}

                            <div className="mt-3 pt-3 border-t border-ui-border/50 space-y-1">
                                <button
                                    onClick={() => {
                                        toggleTheme();
                                        setMobileMoreOpen(false);
                                        setMobileSelectedMenu(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-foreground hover:bg-ui-bg"
                                >
                                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-ui-bg flex-shrink-0">
                                        {isDarkTheme ? <Moon size={18} /> : <Sun size={18} />}
                                    </div>
                                    <span className="text-sm font-semibold">{isDarkTheme ? 'Modo Claro' : 'Modo Oscuro'}</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setMobileMoreOpen(false);
                                        setMobileSelectedMenu(null);
                                        handleLogout();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-red-500 hover:bg-red-500/10"
                                >
                                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 flex-shrink-0">
                                        <LogOut size={18} />
                                    </div>
                                    <span className="text-sm font-semibold">Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

        </div>
    );
}

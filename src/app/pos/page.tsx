"use client";

import { useRouter } from 'next/navigation';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOwnerContext } from '@/hooks/useOwnerContext';
import { usePOSData } from '@/hooks/usePOSData';
import { useCart } from '@/context/CartContext';
import { ProductService } from '@/services/product.service';
import { ClientService } from '@/services/client.service';
import { SalesService } from '@/services/sales.service';
import { StorageService } from '@/services/storage.service';
import { Product } from '@/types/inventory';
import { Client } from '@/types/client';
import {
    Search, ShoppingCart, Minus, Plus, X, User as UserIcon, Camera, AlertCircle, ScanLine,
    ChevronDown, ChevronUp, Tag, Coffee, Shirt, Utensils, Zap, Package,
    Smartphone, Home, LayoutGrid, Pizza, Briefcase, Gift, Droplets, Shield,
    Edit2, MessageSquareWarning
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { toast } from 'sonner';
import { PlusCircle, Loader2, Contact2 } from 'lucide-react';
import { useContactPicker } from '@/hooks/useContactPicker';
import { useCurrency } from '@/context/CurrencyContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { BarcodeScannerModal } from '@/components/common/BarcodeScannerModal';
import { usePermissions } from '@/hooks/usePermission';
import { usePromotions, usePriceLists } from '@/hooks/usePricingData';
import { applyPricing } from '@/lib/applyPricing';
import { CouponService } from '@/services/promotion.service';
import type { Coupon } from '@/types/promotion';
import { getStockAtLocation, hasLocationStock } from '@/lib/stock';

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    'General': <LayoutGrid size={16} />,
    'Alimentos': <Utensils size={16} />,
    'Bebidas': <Coffee size={16} />,
    'Electrónica': <Smartphone size={16} />,
    'Ropa': <Shirt size={16} />,
    'Hogar': <Home size={16} />,
    'Servicios': <Zap size={16} />,
    'Artículos': <Package size={16} />,
    'Comida': <Pizza size={16} />,
    'Oficina': <Briefcase size={16} />,
    'Regalos': <Gift size={16} />,
    'Líquidos': <Droplets size={16} />,
};

const getCategoryIcon = (name: string) => {
    return CATEGORY_ICONS[name] || <Tag size={16} />;
};

function POSScreen() {
    const router = useRouter();
    const { user: currentUser, isLoading: authLoading } = useAuth();
    const { ownerId } = useOwnerContext();
    const { products, clients, locations, cashboxes, isLoading: posDataLoading } = usePOSData(ownerId);
    const { items, total, selectedClient, setSelectedClient, addToCart, updateQuantity, clearCart } = useCart();
    const { formatPrice, fromUSD, toUSD, currency, exchangeRate } = useCurrency();

    // Payment Currency State (for recording notes or visual only)
    const [paymentCurrency, setPaymentCurrency] = useState<'USD' | 'VES'>('USD');

    useEffect(() => {
        if (!authLoading && currentUser) {
            const isGlobalAdmin = currentUser.role === 'admin' || currentUser.role === 'admingod';
            if (isGlobalAdmin) {
                router.replace('/admin/dashboard');
            }
        }
    }, [currentUser, authLoading, router]);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [posScannerOpen, setPosScannerOpen] = useState(false);
    const permissions = usePermissions(['applyDiscount', 'viewCosts']);

    // Modals
    const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
    const [clientModalVisible, setClientModalVisible] = useState(false);

    // Checkout State
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'credit' | 'mobile_pay' | ''>('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentBank, setPaymentBank] = useState('');
    const [paymentDate, setPaymentDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Price override
    const [isPriceOverride, setIsPriceOverride] = useState(false);
    const [customTotalStr, setCustomTotalStr] = useState('');
    const [discountReason, setDiscountReason] = useState('');

    // Cupón
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

    // Promociones y listas de precios
    const { items: promotions } = usePromotions(ownerId);
    const { items: priceLists } = usePriceLists(ownerId);

    // Engine de pricing — se re-calcula cuando cambia carrito, cliente, promos o cupón
    const pricingResult = useMemo(() => applyPricing({
        items,
        client: selectedClient,
        promotions,
        priceLists,
        coupon: appliedCoupon,
    }), [items, selectedClient, promotions, priceLists, appliedCoupon]);

    const handleApplyCoupon = async () => {
        const code = couponInput.trim();
        if (!code) return;
        setIsValidatingCoupon(true);
        try {
            const c = await CouponService.findByCode(ownerId, code);
            if (!c) { toast.error('Cupón no encontrado'); return; }
            if (!c.active) { toast.error('Cupón inactivo'); return; }
            if (c.expiresAt && Date.now() > c.expiresAt) { toast.error('Cupón vencido'); return; }
            if (c.usageLimit != null && c.usedCount >= c.usageLimit) { toast.error('Cupón agotado'); return; }
            if (c.minCartTotal && total < c.minCartTotal) { toast.error(`Carrito mínimo: ${formatPrice(c.minCartTotal)}`); return; }
            setAppliedCoupon(c);
            toast.success(`Cupón ${c.code} aplicado`);
        } catch {
            toast.error('Error validando cupón');
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput('');
    };

    // Client search
    const [clientSearch, setClientSearch] = useState('');

    const [isCartMinimized, setIsCartMinimized] = useState(false);

    // New client state
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');
    const [isSavingClient, setIsSavingClient] = useState(false);

    const { isSupported, pickContact } = useContactPicker();

    const handlePickContact = async () => {
        const contact = await pickContact();
        if (contact) {
            setNewClientName(contact.name);
            setNewClientPhone(contact.phone);
        }
    };

    // Evidence (comprobante)
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
    const evidenceInputRef = useRef<HTMLInputElement>(null);

    // Context State
    const [selectedLocation, setSelectedLocation] = useState<string>('all');
    const [selectedCashbox, setSelectedCashbox] = useState<string>('default');

    // Auto-select de sucursal para el usuario que tiene una asignada por defecto
    useEffect(() => {
        if (currentUser?.defaultLocationId && selectedLocation === 'all') {
            setSelectedLocation(currentUser.defaultLocationId);
        }
    }, [currentUser?.defaultLocationId]);

    const isLocationLocked = !!currentUser?.defaultLocationId
        && currentUser.role !== 'owner'
        && currentUser.role !== 'admin'
        && currentUser.role !== 'admingod'
        && currentUser.role !== 'manager';

    const handleEvidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setEvidenceFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setEvidencePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (items.length > 0 && isCartMinimized) {
            setIsCartMinimized(false);
        }
    }, [items.length]);

    useEffect(() => {
        const handleToggleCart = () => {
            setIsCartMinimized(prev => !prev);
        };
        window.addEventListener('toggle-cart', handleToggleCart);
        return () => window.removeEventListener('toggle-cart', handleToggleCart);
    }, []);


    const categories = useMemo(() => {
        const cats = new Set<string>();
        products.forEach(p => { if (p.category) cats.add(p.category); });
        return Array.from(cats).sort();
    }, [products]);

    const [variantModal, setVariantModal] = useState<Product | null>(null);

    const hasAvailableStock = (p: Product) => {
        if (p.variants && p.variants.length > 0) {
            return p.variants.some(v => v.stock > 0);
        }
        if (hasLocationStock(p) && selectedLocation !== 'all') {
            return getStockAtLocation(p, selectedLocation) > 0;
        }
        return getStockAtLocation(p, selectedLocation) > 0 || p.stock > 0;
    };

    const handleProductClick = (product: Product) => {
        if (!hasAvailableStock(product)) return;
        if (product.variants && product.variants.length > 0) {
            setVariantModal(product);
        } else {
            addToCart(product);
        }
    };

    const filteredProducts = useMemo(() => {
        let result = products.filter(p => hasAvailableStock(p));
        if (searchQuery) result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        if (selectedCategory) result = result.filter(p => p.category === selectedCategory);
        result = ProductService.getByLocation(result, selectedLocation);
        return result;
    }, [products, searchQuery, selectedCategory, selectedLocation]);

    const filteredClients = useMemo(() => {
        if (!clientSearch) return clients;
        return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || (c.phone ?? '').includes(clientSearch));
    }, [clients, clientSearch]);

    const handleConfirmSale = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentMethod) {
            toast.error('Debes seleccionar un método de pago');
            return;
        }
        if (paymentMethod === 'credit' && !selectedClient) {
            toast.error('Se requiere un cliente para ventas a crédito/fiado.');
            return;
        }

        // Si hay override manual usa ese; si no, usa el total del engine (con promos/cupón/listas)
        const engineTotal = pricingResult.total;
        const finalTotal = isPriceOverride ? parseFloat(customTotalStr) : engineTotal;
        if (isPriceOverride) {
            if (isNaN(finalTotal) || finalTotal < 0) {
                toast.error('El monto ingresado no es válido');
                return;
            }
            if (Math.abs(finalTotal - engineTotal) > 0.001 && !discountReason.trim()) {
                toast.error('Debes indicar el motivo del ajuste de precio');
                return;
            }
        }

        setIsSaving(true);
        try {
            let evidenceUrl: string | null = null;
            if (evidenceFile && paymentMethod === 'transfer') {
                evidenceUrl = await StorageService.uploadComprobante(evidenceFile);
            }

            const finalNotes = paymentCurrency === 'VES'
                ? `[PAGO EN BS] Monto: Bs. ${(finalTotal * exchangeRate).toFixed(2)} (Tasa: ${exchangeRate}). ${paymentNotes}`
                : paymentNotes;

            const hasPriceAdjustment = isPriceOverride && Math.abs(finalTotal - engineTotal) > 0.001;

            const ownerId = currentUser?.ownerId || currentUser?.uid || '';
            await SalesService.createSale({
                items: pricingResult.items,
                total: finalTotal,
                paymentMethod,
                ownerId,
                clientId: selectedClient?.id || null,
                clientName: selectedClient?.name || null,
                evidenceUrl,
                notes: finalNotes || undefined,
                cashboxId: selectedCashbox === 'default' ? (currentUser?.uid || '') : selectedCashbox,
                cashboxName: cashboxes.find(c => c.id === selectedCashbox)?.name || currentUser?.displayName || 'Cajero',
                locationId: selectedLocation !== 'all' ? selectedLocation : null,
                locationName: selectedLocation !== 'all' ? (locations.find(l => l.id === selectedLocation)?.name ?? null) : null,
                exchangeRateAtSale: exchangeRate,
                paymentData: (paymentMethod === 'transfer' || paymentMethod === 'mobile_pay')
                    ? Object.fromEntries(Object.entries({ reference: paymentReference, bank: paymentBank, date: paymentDate }).filter(([, v]) => v))
                    : undefined,
                ...(pricingResult.appliedPromotions.length > 0 ? {
                    appliedPromotions: pricingResult.appliedPromotions,
                    promotionSavings: pricingResult.totalSavings,
                } : {}),
                ...(appliedCoupon ? { couponCode: appliedCoupon.code } : {}),
                ...(hasPriceAdjustment ? {
                    originalTotal: engineTotal,
                    discountAmount: engineTotal - finalTotal,
                    discountReason: discountReason.trim(),
                } : {}),
            }, currentUser ? {
                id: currentUser.uid,
                name: currentUser.displayName || currentUser.email || 'Usuario',
                commissionPct: currentUser.commissionPct,
            } : undefined);

            if (appliedCoupon) {
                CouponService.incrementUsage(appliedCoupon.id, appliedCoupon.usedCount).catch(err => {
                    console.error('No se pudo incrementar uso de cupón', err);
                });
            }

            clearCart();
            setPaymentNotes('');
            setPaymentReference('');
            setPaymentBank('');
            setPaymentDate('');
            setEvidenceFile(null);
            setEvidencePreview(null);
            setIsPriceOverride(false);
            setCustomTotalStr('');
            setDiscountReason('');
            setAppliedCoupon(null);
            setCouponInput('');
            setCheckoutModalVisible(false);
            toast.success('¡Venta registrada con éxito!');
        } catch (error: any) {
            toast.error(error.message || 'No se pudo registrar la venta');
        } finally {
            setIsSaving(false);
        }
    };

    const handleQuickCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClientName || !newClientPhone) {
            toast.warning('Completa los datos del cliente');
            return;
        }
        setIsSavingClient(true);
        try {
            const ownerId = currentUser?.ownerId || currentUser?.uid || '';
            const clientId = await ClientService.addClient({
                name: newClientName,
                phone: newClientPhone,
                active: true,
            }, ownerId);
            const newClient = { id: clientId, name: newClientName, phone: newClientPhone, active: true, createdAt: Date.now(), updatedAt: Date.now() };
            setSelectedClient(newClient);
            setIsCreatingClient(false);
            setNewClientName('');
            setNewClientPhone('');
            toast.success('Cliente creado y seleccionado');
        } catch (error) {
            toast.error('Error al crear cliente');
        } finally {
            setIsSavingClient(false);
        }
    };

    if (posDataLoading || authLoading || (currentUser?.role === 'admin' || currentUser?.role === 'admingod')) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500 font-medium tracking-wide">
                    {posDataLoading ? 'Iniciando Caja...' : 'Redirigiendo...'}
                </span>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col lg:flex-row gap-8 animate-in fade-in duration-1000">

            {/* Products Area (Left) — The Grid Canvas */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-8 space-y-4 shrink-0">
                    <div className="flex flex-col md:flex-row gap-4 w-full">
                        <div className="relative flex-1">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ui-text-muted">
                                <Search size={20} />
                            </div>
                            <input
                                placeholder="Buscar en el catálogo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-14 pl-12 pr-16 rounded-2xl bg-white/50 dark:bg-white/5 border border-ui-border focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-accent-primary/10 transition-all outline-none font-bold text-ui-text"
                            />
                            <button
                                type="button"
                                onClick={() => setPosScannerOpen(true)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-accent-primary/10 text-accent-primary hover:bg-accent-primary hover:text-white flex items-center justify-center transition-all"
                                aria-label="Escanear código de barras"
                            >
                                <ScanLine size={18} />
                            </button>
                        </div>

                        <div className="w-full md:w-64 shrink-0">
                            {isLocationLocked ? (
                                <div className="ui-input-box flex items-center gap-2 px-4 py-3 text-sm font-bold text-ui-text">
                                    <Home size={16} className="text-accent-primary" />
                                    <span className="truncate">{locations.find(l => l.id === selectedLocation)?.name || 'Tu sucursal'}</span>
                                </div>
                            ) : (
                                <Select
                                    options={[
                                        { value: 'all', label: 'Todas las Sedes' },
                                        ...locations.map(l => ({ value: l.id, label: l.name }))
                                    ]}
                                    value={selectedLocation}
                                    onChange={(val) => setSelectedLocation(val)}
                                    icon={<Home size={16} />}
                                />
                            )}
                        </div>
                    </div>

                    {categories.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar shrink-0 w-full">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`px-6 h-12 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 border whitespace-nowrap shrink-0 ${!selectedCategory ? 'bg-accent-primary text-white border-accent-primary shadow-lg shadow-accent-primary/30' : 'bg-white/50 dark:bg-white/5 border-ui-border text-ui-text-muted hover:border-ui-text hover:bg-white dark:hover:bg-white/10'}`}
                            >
                                <LayoutGrid size={18} />
                                Todo
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-6 h-12 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 border whitespace-nowrap shrink-0 ${selectedCategory === cat ? 'bg-accent-primary text-white border-accent-primary shadow-lg shadow-accent-primary/30' : 'bg-white/50 dark:bg-white/5 border-ui-border text-ui-text-muted hover:border-ui-text hover:bg-white dark:hover:bg-white/10'}`}
                                >
                                    {getCategoryIcon(cat)}
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pb-20 md:pb-12 px-4 -mx-4 custom-scrollbar">
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <ShoppingCart className="mx-auto mb-4 opacity-30" size={48} />
                            <p>No se encontraron productos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                            {filteredProducts.map(product => {
                                const hasVariants = !!(product.variants && product.variants.length > 0);
                                const isOutOfStock = !hasAvailableStock(product);
                                const cartItem = items.find(i => i.id === product.id);
                                const qtyInCart = cartItem ? cartItem.quantity : 0;
                                const stockDisplay = hasVariants
                                    ? `${product.variants!.reduce((s, v) => s + v.stock, 0)} un`
                                    : `${product.stock} un`;
                                return (
                                    <div key={product.id} onClick={() => handleProductClick(product)} className="ui-card ui-card-hover p-6 flex flex-col justify-between min-h-[220px] cursor-pointer group active:scale-95">
                                        <div className="relative">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-3 rounded-2xl ${isOutOfStock ? 'bg-red-500/10 text-red-500' : 'bg-accent-primary/5 text-accent-primary'}`}>
                                                    {getCategoryIcon(product.category || 'General')}
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    {hasVariants && (
                                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">
                                                            {product.variants!.length} vars
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${isOutOfStock ? 'bg-red-500 text-white' : 'bg-black/5 dark:bg-white/10 text-ui-text'}`}>
                                                        {isOutOfStock ? 'Agotado' : stockDisplay}
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="font-black text-xl text-ui-text tracking-tight leading-[1.1] mb-2">{product.name}</h3>
                                            <p className="text-ui-text-muted text-xs font-bold uppercase tracking-widest">{product.category}</p>
                                        </div>
                                        
                                        <div className="mt-6 flex items-end justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-ui-text-muted uppercase tracking-widest mb-1">Precio</span>
                                                <span className="font-black text-2xl text-ui-text tracking-tighter">
                                                    {formatPrice(product.price)}
                                                </span>
                                                {permissions.viewCosts && product.costPrice != null && product.costPrice > 0 && product.price > 0 && (
                                                    <span className="text-[9px] font-black uppercase tracking-widest mt-1">
                                                        <span className="text-ui-text-muted/70">M: </span>
                                                        <span className={product.price - product.costPrice >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                                                            {(((product.price - product.costPrice) / product.price) * 100).toFixed(0)}%
                                                        </span>
                                                    </span>
                                                )}
                                            </div>

                                            {qtyInCart > 0 && (
                                                <div className="w-10 h-10 rounded-full bg-accent-primary flex items-center justify-center text-white font-black text-sm animate-in zoom-in-50 duration-300">
                                                    {qtyInCart}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Summary Sidebar (Glass Bento Widget) */}
            <div className={`fixed inset-x-0 bottom-0 lg:relative lg:inset-x-auto lg:bottom-auto w-full lg:w-[450px] shrink-0 flex flex-col transition-all duration-700 z-50
                ${items.length > 0 ? (isCartMinimized ? 'translate-y-[calc(100%-80px)] lg:translate-y-0' : 'translate-y-0') : 'translate-y-[120%] lg:translate-y-0'} h-[75vh] lg:h-full`}>
                
                <div className="ui-card h-full flex flex-col p-4 border-ui-border shadow-float overflow-hidden relative bg-white dark:bg-slate-900">

                <div className="p-4 relative cursor-pointer md:cursor-default" onClick={() => window.innerWidth < 768 && setIsCartMinimized(!isCartMinimized)}>
                    <div className="w-12 h-1.5 bg-ui-border rounded-full mx-auto mb-4 md:hidden" />
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black tracking-wide flex items-center gap-3 text-ui-text">
                            <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center text-accent-primary">
                                <ShoppingCart size={20} className="animate-pulse" />
                            </div>
                            Ticket
                            {items.length > 0 && <span className="text-[11px] font-bold px-2.5 py-1 bg-accent-primary text-white rounded-md flex items-center justify-center min-w-[24px] shadow-sm">{items.reduce((s, i) => s + i.quantity, 0)}</span>}
                        </h2>
                        <div className="flex items-center gap-4">
                            {items.length > 0 && !isCartMinimized && (
                                <button onClick={(e) => { e.stopPropagation(); clearCart(); }} className="text-[#FF3B30] hover:bg-[#FF3B30]/10 text-[11px] font-bold uppercase tracking-wider transition-colors px-3 py-1.5 rounded-lg active:scale-95">
                                    Vaciar
                                </button>
                            )}
                            <div className="md:hidden text-accent-primary p-2 bg-black/5 dark:bg-white/5 rounded-full">
                                {isCartMinimized ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 px-2">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-ui-text-muted/40">
                            <div className="w-20 h-20 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4">
                                <ShoppingCart size={32} className="opacity-50" />
                            </div>
                            <p className="text-sm font-bold tracking-wide uppercase">El carrito está vacío</p>
                        </div>
                    ) : (
                        <ul className="space-y-2 pb-2 pt-2">
                            {items.map(item => (
                                <li key={item.id + (item.variantId || '')} className="py-2.5 px-3 flex gap-2 ui-card ui-card-hover border border-ui-border/60 mx-1">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[12px] font-black text-ui-text truncate tracking-tight uppercase leading-tight">{item.name}</h4>
                                        <p className="text-[10px] font-bold text-accent-primary mt-0.5">{formatPrice(item.price)}</p>
                                    </div>
                                    <div className="flex flex-col items-end justify-center gap-1">
                                        <span className="font-extrabold text-[12px] text-ui-text">{formatPrice(item.price * item.quantity)}</span>
                                        <div className="flex items-center ui-input-box p-0">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 text-ui-text-muted transition-colors rounded-md active:scale-95">
                                                <Minus size={10} strokeWidth={4} />
                                            </button>
                                            <span className="w-5 text-center text-[11px] font-black text-ui-text">{item.quantity}</span>
                                            <button onClick={() => addToCart(item)} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 text-ui-text-muted transition-colors rounded-md active:scale-95" disabled={item.quantity >= item.stock}>
                                                <Plus size={10} strokeWidth={4} />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="p-3 pb-[85px] md:pb-4 mt-auto bg-white/50 dark:bg-white/5 border-t border-ui-border shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                    <button onClick={() => setClientModalVisible(true)} className={`w-full p-2 rounded-xl flex items-center justify-between transition-all mb-2.5 ${selectedClient ? 'bg-accent-primary/5 border-accent-primary border shadow-sm' : 'ui-card hover:ui-card-hover border border-ui-border text-ui-text-muted'}`}>
                        <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedClient ? 'bg-accent-primary text-white shadow-md shadow-accent-primary/20' : 'bg-black/5 dark:bg-white/5 text-ui-text-muted'}`}>
                                <UserIcon size={12} strokeWidth={2.5} />
                            </div>
                            <div className="text-left min-w-0">
                                {selectedClient ? (
                                    <>
                                        <p className="text-[8px] font-black text-accent-primary uppercase tracking-[0.15em] mb-0.5">Cliente Seleccionado</p>
                                        <p className="font-extrabold text-ui-text text-[12px] truncate max-w-[170px] leading-none uppercase">{selectedClient.name}</p>
                                    </>
                                ) : (
                                    <p className="font-black uppercase tracking-widest text-[10px] text-ui-text-muted/60">Asignar Cliente</p>
                                )}
                            </div>
                        </div>
                        {selectedClient && <div onClick={(e) => { e.stopPropagation(); setSelectedClient(null); }} className="w-6 h-6 flex items-center justify-center text-[#FF3B30] bg-red-500/5 rounded-full hover:bg-red-500/10 active:scale-90 transition-all"><X size={12} strokeWidth={3} /></div>}
                    </button>

                    {pricingResult.totalSavings > 0 && (
                        <div className="flex justify-between items-center mb-1 px-1.5">
                            <span className="text-emerald-500 font-black tracking-[0.1em] uppercase text-[9px]">Ahorro</span>
                            <span className="text-sm font-black text-emerald-500 tracking-tighter">
                                −{formatPrice(pricingResult.totalSavings)}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between items-center mb-2.5 px-1.5">
                        <span className="text-ui-text-muted font-black tracking-[0.1em] uppercase text-[9px]">Total General</span>
                        <span className="text-xl md:text-2xl font-black text-ui-text tracking-tighter">
                            {formatPrice(pricingResult.total)}
                        </span>
                    </div>

                    <button onClick={() => { setIsPriceOverride(false); setCustomTotalStr(''); setDiscountReason(''); setPaymentMethod(''); setCheckoutModalVisible(true); }} disabled={items.length === 0} className="ui-btn ui-btn-primary w-full text-[13px] h-[44px] rounded-xl uppercase font-black tracking-widest leading-none disabled:opacity-50 shadow-lg shadow-accent-primary/20 active:scale-[0.98] transition-all">
                        Finalizar Cobro
                    </button>
                </div>
            </div></div>

            {/* Modal de Cobro */}
            {checkoutModalVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 transition-all animate-in fade-in duration-200">
                    <div className="ui-card w-full max-w-lg border border-ui-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black tracking-tight text-ui-text uppercase">Confirmar Cobro</h2>
                                <p className="text-accent-primary font-black uppercase tracking-[0.2em] text-[11px] mt-1">Completa los detalles de pago</p>
                            </div>

                            <form onSubmit={handleConfirmSale} className="space-y-8">
                                {/* Total / Price Override Block */}
                                <div className={`ui-input-box px-6 py-4 flex flex-col gap-3 relative overflow-hidden transition-colors ${isPriceOverride ? 'ring-2 ring-amber-500/40' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-ui-text-muted font-black uppercase tracking-widest text-[10px]">Total a Pagar</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentCurrency('USD')}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest transition-all ${paymentCurrency === 'USD' ? 'bg-accent-primary text-white' : 'bg-black/5 dark:bg-white/10 text-ui-text-muted'}`}
                                            >USD</button>
                                            <button
                                                type="button"
                                                onClick={() => setPaymentCurrency('VES')}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest transition-all ${paymentCurrency === 'VES' ? 'bg-orange-500 text-white' : 'bg-black/5 dark:bg-white/10 text-ui-text-muted'}`}
                                            >VES</button>
                                            {permissions.applyDiscount && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!isPriceOverride) {
                                                            setCustomTotalStr(pricingResult.total.toFixed(2));
                                                        }
                                                        setIsPriceOverride(p => !p);
                                                        setDiscountReason('');
                                                    }}
                                                    className={`p-1.5 rounded-lg text-[10px] font-black transition-all ${isPriceOverride ? 'bg-amber-500 text-white' : 'bg-black/5 dark:bg-white/10 text-ui-text-muted hover:text-amber-500'}`}
                                                    title="Modificar precio"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {pricingResult.totalSavings > 0 && !isPriceOverride && (
                                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest pb-1">
                                            <span className="text-ui-text-muted">Subtotal {formatPrice(pricingResult.baseTotal)}</span>
                                            <span className="text-emerald-500">Ahorro −{formatPrice(pricingResult.totalSavings)}</span>
                                        </div>
                                    )}

                                    {isPriceOverride ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-ui-text-muted text-sm font-bold">$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={customTotalStr}
                                                    onChange={e => setCustomTotalStr(e.target.value)}
                                                    className="flex-1 bg-transparent text-3xl font-black text-ui-text outline-none border-b-2 border-amber-500 pb-1 w-full"
                                                    autoFocus
                                                />
                                            </div>
                                            {parseFloat(customTotalStr) !== pricingResult.total && !isNaN(parseFloat(customTotalStr)) && (
                                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                                    <span className="text-ui-text-muted">Original: {formatPrice(pricingResult.total)}</span>
                                                    <span className={parseFloat(customTotalStr) < pricingResult.total ? 'text-green-500' : 'text-red-500'}>
                                                        {parseFloat(customTotalStr) < pricingResult.total ? '▼' : '▲'} {formatPrice(Math.abs(pricingResult.total - parseFloat(customTotalStr)))}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span className="text-3xl font-black text-ui-text">
                                                {paymentCurrency === 'USD'
                                                    ? `$ ${pricingResult.total.toFixed(2)}`
                                                    : `Bs. ${(pricingResult.total * exchangeRate).toFixed(2)}`}
                                            </span>
                                            {paymentCurrency === 'VES' && (
                                                <span className="text-[10px] font-black text-ui-text-muted opacity-50">Tasa: {exchangeRate}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Promociones aplicadas */}
                                {pricingResult.appliedPromotions.length > 0 && (
                                    <div className="ui-input-box px-4 py-3 space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Promos aplicadas</p>
                                        {pricingResult.appliedPromotions.map((ap, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs">
                                                <span className="text-ui-text font-bold truncate">{ap.name}</span>
                                                <span className="text-emerald-500 font-black ml-2 whitespace-nowrap">−{formatPrice(ap.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Cupón */}
                                <div className="ui-input-box px-4 py-3 space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">Cupón</p>
                                    {appliedCoupon ? (
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <span className="text-sm font-black text-accent-primary font-mono">{appliedCoupon.code}</span>
                                                <p className="text-[10px] text-ui-text-muted">
                                                    {appliedCoupon.type === 'PERCENT' ? `${appliedCoupon.value}% off` : `${formatPrice(appliedCoupon.value)} off`}
                                                </p>
                                            </div>
                                            <button type="button" onClick={handleRemoveCoupon} className="text-red-500 hover:underline text-[10px] font-black uppercase tracking-widest">
                                                Quitar
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={couponInput}
                                                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                                                placeholder="Ingresa código"
                                                className="flex-1 bg-transparent text-sm font-bold text-ui-text font-mono outline-none border-b border-ui-border focus:border-accent-primary pb-1"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                disabled={!couponInput.trim() || isValidatingCoupon}
                                                className="text-[10px] font-black uppercase tracking-widest text-accent-primary hover:underline disabled:opacity-30"
                                            >
                                                {isValidatingCoupon ? '...' : 'Aplicar'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Discount reason — required when price was modified */}
                                {isPriceOverride && Math.abs(parseFloat(customTotalStr || '0') - total) > 0.001 && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex items-center gap-2">
                                            <MessageSquareWarning size={14} className="text-amber-500 shrink-0" />
                                            <p className="text-[11px] font-black uppercase tracking-widest text-amber-500">
                                                Motivo del ajuste <span className="text-red-500">*</span>
                                            </p>
                                        </div>
                                        <textarea
                                            value={discountReason}
                                            onChange={e => setDiscountReason(e.target.value)}
                                            placeholder="Ej: Descuento por cliente frecuente, negociación especial, promoción acordada..."
                                            rows={3}
                                            required
                                            className="w-full rounded-xl ui-input-box px-4 py-3 text-sm font-medium text-ui-text resize-none outline-none focus:ring-2 focus:ring-amber-500/30 border border-amber-500/30 placeholder:text-ui-text-muted/40"
                                        />
                                        {!discountReason.trim() && (
                                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">
                                                Este campo es obligatorio para registrar el ajuste
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted">Medio de Pago</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {([
                                            { id: 'cash', emoji: '💵', label: 'Efectivo' },
                                            { id: 'transfer', emoji: '📲', label: 'Transferencia' }
                                        ] as const).map(opt => (
                                            <button key={opt.id} type="button" onClick={() => setPaymentMethod(opt.id)} className={`p-4 rounded-xl transition-all flex items-center justify-center gap-3 font-bold border-2 active:scale-95 ${paymentMethod === opt.id ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-transparent bg-black/5 dark:bg-white/5 text-ui-text-muted hover:bg-black/10 dark:hover:bg-white/10'}`}>
                                                <span className="text-xl">{opt.emoji}</span>
                                                <span className="uppercase tracking-wide text-xs">{opt.label}</span>
                                            </button>
                                        ))}
                                        <button type="button" onClick={() => setPaymentMethod('mobile_pay')} className={`col-span-2 p-4 rounded-xl transition-all flex items-center justify-center gap-3 font-bold border-2 active:scale-95 ${paymentMethod === 'mobile_pay' ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-transparent bg-black/5 dark:bg-white/5 text-ui-text-muted hover:bg-black/10 dark:hover:bg-white/10'}`}>
                                            <Smartphone size={20} />
                                            <span className="uppercase tracking-wide text-xs">Pago Móvil</span>
                                        </button>
                                        <button type="button" onClick={() => setPaymentMethod('credit')} className={`col-span-2 p-4 rounded-xl transition-all flex items-center justify-center gap-3 font-bold border-2 active:scale-95 ${paymentMethod === 'credit' ? 'border-[#FF3B30] bg-[#FF3B30]/10 text-[#FF3B30]' : 'border-transparent bg-black/5 dark:bg-white/5 text-[#FF3B30]/80 hover:bg-black/10 dark:hover:bg-white/10'}`}>
                                            <span className="text-xl">📝</span>
                                            <span className="uppercase tracking-wide text-xs">Fiado / A Crédito</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted">Caja Receptora</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setSelectedCashbox('default')} 
                                            className={`p-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 font-bold border-2 active:scale-95 ${selectedCashbox === 'default' ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-transparent bg-black/5 dark:bg-white/5 text-ui-text-muted opacity-60'}`}
                                        >
                                            <Shield size={16} />
                                            <span className="uppercase tracking-tight text-[10px] whitespace-nowrap">Personal</span>
                                        </button>
                                        {cashboxes.map(box => (
                                            <button 
                                                key={box.id} 
                                                type="button" 
                                                onClick={() => setSelectedCashbox(box.id)} 
                                                className={`p-3 rounded-xl transition-all flex flex-col items-center justify-center gap-1 font-bold border-2 active:scale-95 ${selectedCashbox === box.id ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-transparent bg-black/5 dark:bg-white/5 text-ui-text-muted opacity-60'}`}
                                            >
                                                <Smartphone size={16} />
                                                <span className="uppercase tracking-tight text-[10px] whitespace-nowrap">{box.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {(paymentMethod === 'transfer' || paymentMethod === 'mobile_pay') && (
                                    <div className="space-y-3">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted">Datos del Pago <span className="text-[10px] font-normal text-ui-text-muted/60">(Opcional)</span></p>
                                        <Input label="REFERENCIA" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Nro. de referencia o confirmación" />
                                        <Input label="BANCO" value={paymentBank} onChange={(e) => setPaymentBank(e.target.value)} placeholder="Banco emisor" />
                                        <Input label="FECHA DEL PAGO" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                                    </div>
                                )}

                                {paymentMethod === 'transfer' && (
                                    <div className="space-y-4">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted">Comprobante</p>
                                        <input ref={evidenceInputRef} type="file" accept="image/*" className="hidden" onChange={handleEvidenceChange} />
                                        {evidencePreview ? (
                                            <div className="relative rounded-2xl overflow-hidden aspect-video bg-black/5 dark:bg-white/5 border border-ui-border">
                                                <img src={evidencePreview} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => {setEvidenceFile(null); setEvidencePreview(null);}} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center"><X size={16}/></button>
                                            </div>
                                        ) : (
                                            <button type="button" onClick={() => evidenceInputRef.current?.click()} className="w-full py-8 rounded-2xl ui-input-box border border-dashed border-ui-border flex flex-col items-center gap-2 hover:border-accent-primary/50 transition-colors">
                                                <Camera size={32} className="text-accent-primary opacity-50" />
                                                <span className="text-[12px] font-bold text-ui-text mt-2">Cargar Comprobante</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                <Input label="NOTAS DE VENTA" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Ej: Pago pendiente..." />

                                {paymentMethod === 'credit' && !selectedClient && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="text-red-500" size={20} />
                                            <span className="text-sm font-bold text-red-500">Debes asignar un cliente</span>
                                        </div>
                                        <button type="button" onClick={() => setClientModalVisible(true)} className="px-4 py-2 bg-red-500 text-white text-xs font-black rounded-lg uppercase tracking-widest active:scale-95 transition-all">
                                            Asignar
                                        </button>
                                    </div>
                                )}
                                {paymentMethod === 'credit' && selectedClient && (
                                    <div className="p-4 bg-accent-primary/10 border border-accent-primary/20 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <UserIcon className="text-accent-primary" size={20} />
                                            <div>
                                                <p className="text-[10px] uppercase font-black tracking-widest text-accent-primary">Fiado a</p>
                                                <p className="text-sm font-bold text-ui-text">{selectedClient.name}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setClientModalVisible(true)} className="px-3 py-1.5 bg-black/10 dark:bg-white/10 text-ui-text text-xs font-bold rounded-lg uppercase">
                                            Cambiar
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button type="button" className="ui-btn ui-btn-secondary flex-1" onClick={() => setCheckoutModalVisible(false)} disabled={isSaving}>Cancelar</button>
                                    <button
                                        type="submit"
                                        className="ui-btn ui-btn-primary flex-1 disabled:opacity-50"
                                        disabled={
                                            isSaving
                                            || !paymentMethod
                                            || (paymentMethod === 'credit' && !selectedClient)
                                            || (isPriceOverride && Math.abs(parseFloat(customTotalStr || '0') - total) > 0.001 && !discountReason.trim())
                                        }
                                    >
                                        {isSaving ? 'Cobrando...' : 'Confirmar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Clientes */}
            {clientModalVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 transition-all animate-in fade-in duration-200">
                    <div className="ui-card w-full max-w-md border border-ui-border flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 pb-4">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black tracking-tight text-ui-text uppercase">
                                    {isCreatingClient ? 'Nuevo Cliente' : 'Seleccionar Cliente'}
                                </h2>
                                <button 
                                    onClick={() => { setIsCreatingClient(!isCreatingClient); }}
                                    className={`p-2 rounded-xl transition-all ${isCreatingClient ? 'bg-red-500/10 text-red-500' : 'bg-accent-primary/10 text-accent-primary'}`}
                                >
                                    {isCreatingClient ? <X size={20} /> : <PlusCircle size={20} />}
                                </button>
                            </div>
                            
                            {!isCreatingClient && (
                                <Input 
                                    placeholder="Buscar por nombre..." 
                                    value={clientSearch} 
                                    onChange={(e) => setClientSearch(e.target.value)} 
                                    autoFocus 
                                    leftIcon={<Search size={18} />} 
                                />
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 py-4">
                            {isCreatingClient ? (
                                <form onSubmit={handleQuickCreateClient} className="space-y-4 animate-in slide-in-from-right duration-300">
                                    <Input 
                                        label="NOMBRE COMPLETO" 
                                        value={newClientName} 
                                        onChange={(e) => setNewClientName(e.target.value)} 
                                        placeholder="Ej: Juan Pérez" 
                                        required 
                                    />
                                    <Input 
                                        label="TELÉFONO" 
                                        value={newClientPhone} 
                                        onChange={(e) => setNewClientPhone(e.target.value)} 
                                        placeholder="Ej: 04121234567" 
                                        required 
                                        type="tel"
                                        rightIcon={isSupported ? (
                                            <button 
                                                type="button" 
                                                onClick={handlePickContact}
                                                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-accent-primary"
                                                title="Importar de contactos"
                                            >
                                                <Contact2 size={18} />
                                            </button>
                                        ) : undefined}
                                    />
                                    <Button type="submit" className="w-full mt-2" isLoading={isSavingClient}>
                                        Guardar Cliente
                                    </Button>
                                </form>
                            ) : (
                                <div className="ui-input-box p-2">
                                    {filteredClients.length === 0 ? (
                                        <div className="p-8 text-center text-ui-text-muted/40 font-bold uppercase text-xs">No hay resultados</div>
                                    ) : (
                                        <ul className="space-y-2">
                                            {filteredClients.map(c => (
                                                <li key={c.id}>
                                                    <button onClick={() => { setSelectedClient(c); setClientModalVisible(false); }} className="w-full text-left p-4 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all outline-none group border border-transparent hover:border-accent-primary/20">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-bold text-ui-text tracking-wide uppercase text-[13px]">{c.name}</p>
                                                                <p className="text-[11px] font-bold text-accent-primary mt-1 tracking-widest">{c.phone}</p>
                                                            </div>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <PlusCircle size={16} className="text-accent-primary" />
                                                            </div>
                                                        </div>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-8 pt-0 mt-4 flex gap-3 border-t border-ui-border pt-6">
                            <button className="ui-btn ui-btn-secondary w-full" onClick={() => { setClientModalVisible(false); setIsCreatingClient(false); }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Variant Selector Modal */}
            {variantModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Seleccionar variante">
                    <div className="ui-card w-full max-w-sm border border-ui-border shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">{variantModal.name}</h2>
                                    <p className="text-[10px] font-bold text-ui-text-muted uppercase tracking-widest mt-0.5">Selecciona una variante</p>
                                </div>
                                <button onClick={() => setVariantModal(null)} className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ui-text-muted hover:text-ui-text transition-colors" aria-label="Cerrar">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-2">
                                {variantModal.variants!.map(variant => {
                                    const isVariantOut = variant.stock <= 0;
                                    const variantInCart = items.find(i => i.id === variantModal.id && i.variantId === variant.id);
                                    return (
                                        <button
                                            key={variant.id}
                                            onClick={() => {
                                                if (!isVariantOut) {
                                                    addToCart(variantModal, variant);
                                                    setVariantModal(null);
                                                }
                                            }}
                                            disabled={isVariantOut}
                                            className={`w-full p-4 rounded-xl flex items-center justify-between transition-all active:scale-95 border-2 ${isVariantOut ? 'border-transparent bg-black/5 dark:bg-white/5 opacity-40 cursor-not-allowed' : 'border-transparent bg-black/5 dark:bg-white/5 hover:border-accent-primary hover:bg-accent-primary/5 text-ui-text'}`}
                                        >
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="font-black text-sm uppercase tracking-wide">{variant.name}</span>
                                                <span className="text-[10px] font-bold text-ui-text-muted">{variant.stock} disponibles</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {variantInCart && (
                                                    <span className="w-6 h-6 rounded-full bg-accent-primary text-white text-[10px] font-black flex items-center justify-center">
                                                        {variantInCart.quantity}
                                                    </span>
                                                )}
                                                <span className="font-black text-lg text-ui-text">
                                                    {formatPrice(variantModal.price + (variant.priceModifier || 0))}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setVariantModal(null)}
                                className="w-full mt-4 h-11 rounded-xl bg-black/5 dark:bg-white/5 font-black text-sm uppercase tracking-widest text-ui-text-muted hover:text-ui-text transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Barcode Scanner — busca producto por código y lo agrega al carrito */}
            <BarcodeScannerModal
                open={posScannerOpen}
                onClose={() => setPosScannerOpen(false)}
                onDetect={(code) => {
                    const match = products.find(p => p.barcode === code);
                    if (!match) {
                        toast.error(`Sin producto con código ${code}`);
                        setSearchQuery(code);
                        return;
                    }
                    if (!hasAvailableStock(match)) {
                        toast.error(`"${match.name}" sin stock`);
                        return;
                    }
                    handleProductClick(match);
                    toast.success(`Agregado: ${match.name}`);
                }}
            />
        </div>
    );
}

export default function Page() {
    return (
        <ErrorBoundary label="Punto de Venta">
            <POSScreen />
        </ErrorBoundary>
    );
}

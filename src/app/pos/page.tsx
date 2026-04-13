"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ProductService } from '@/services/product.service';
import { ClientService } from '@/services/client.service';
import { SalesService } from '@/services/sales.service';
import { storage } from '@/config/firebaseConfig';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Product } from '@/types/inventory';
import { Client } from '@/types/client';
import { 
    Search, ShoppingCart, Minus, Plus, X, User as UserIcon, Camera, AlertCircle, 
    ChevronDown, ChevronUp, Tag, Coffee, Shirt, Utensils, Zap, Package, 
    Smartphone, Home, LayoutGrid, Pizza, Briefcase, Gift, Droplets 
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { PlusCircle, Loader2 } from 'lucide-react';

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

export default function POSScreen() {
    const router = useRouter();
    const { user: currentUser, isLoading: authLoading } = useAuth();
    const { items, total, selectedClient, setSelectedClient, addToCart, updateQuantity, clearCart } = useCart();

    useEffect(() => {
        if (!authLoading && currentUser) {
            const isGlobalAdmin = currentUser.role === 'admin' || currentUser.role === 'admingod';
            if (isGlobalAdmin) {
                router.replace('/admin/dashboard');
            }
        }
    }, [currentUser, authLoading, router]);

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Modals
    const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
    const [clientModalVisible, setClientModalVisible] = useState(false);

    // Checkout State
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'credit'>('cash');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Clients
    const [clients, setClients] = useState<Client[]>([]);
    const [clientSearch, setClientSearch] = useState('');

    const [isCartMinimized, setIsCartMinimized] = useState(false);

    // New client state
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');
    const [isSavingClient, setIsSavingClient] = useState(false);

    // Evidence (comprobante)
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [evidencePreview, setEvidencePreview] = useState<string | null>(null);
    const evidenceInputRef = useRef<HTMLInputElement>(null);

    const handleEvidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setEvidenceFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setEvidencePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        const unsubscribe = ProductService.subscribeToProducts((list) => {
            setProducts(list);
            setLoading(false);
        });
        const unsubscribeClients = ClientService.subscribeToClients((list) => {
            setClients(list);
        });

        return () => {
            unsubscribe();
            unsubscribeClients();
        };
    }, []);

    const categories = useMemo(() => {
        const cats = new Set<string>();
        products.forEach(p => { if (p.category) cats.add(p.category); });
        return Array.from(cats).sort();
    }, [products]);

    const filteredProducts = useMemo(() => {
        let result = products;
        if (searchQuery) result = result.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        if (selectedCategory) result = result.filter(p => p.category === selectedCategory);
        return result;
    }, [products, searchQuery, selectedCategory]);

    const filteredClients = useMemo(() => {
        if (!clientSearch) return clients;
        return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch));
    }, [clients, clientSearch]);

    const handleConfirmSale = async (e: React.FormEvent) => {
        e.preventDefault();
        if (paymentMethod === 'credit' && !selectedClient) {
            toast.error('Se requiere un cliente para ventas a crédito/fiado.');
            return;
        }
        setIsSaving(true);
        try {
            let evidenceUrl: string | null = null;
            if (evidenceFile && paymentMethod === 'transfer') {
                const fileRef = storageRef(storage, `comprobantes/${Date.now()}_${evidenceFile.name}`);
                await uploadBytes(fileRef, evidenceFile);
                evidenceUrl = await getDownloadURL(fileRef);
            }
            await SalesService.createSale({
                items: items as any,
                total,
                paymentMethod,
                clientId: selectedClient?.id || null,
                clientName: selectedClient?.name || null,
                evidenceUrl,
                notes: paymentNotes || undefined,
                cashboxId: currentUser?.uid,
                cashboxName: currentUser?.displayName || 'Cajero',
            });
            clearCart();
            setPaymentNotes('');
            setEvidenceFile(null);
            setEvidencePreview(null);
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
            const clientId = await ClientService.createClient({
                name: newClientName,
                phone: newClientPhone,
                active: true,
                createdAt: Date.now()
            });
            const newClient = { id: clientId, name: newClientName, phone: newClientPhone, active: true, createdAt: Date.now() };
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

    if (loading || authLoading || (currentUser?.role === 'admin' || currentUser?.role === 'admingod')) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500 font-medium tracking-wide">
                    {loading ? 'Iniciando Caja...' : 'Redirigiendo...'}
                </span>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col lg:flex-row gap-8 animate-in fade-in duration-1000">

            {/* Products Area (Left) — The Grid Canvas */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-8 space-y-6 shrink-0">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="relative flex-1 max-w-xl">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ui-text-muted">
                                <Search size={20} />
                            </div>
                            <input
                                placeholder="Buscar en el catálogo..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-14 pl-12 pr-6 rounded-2xl bg-white/50 dark:bg-white/5 border border-ui-border focus:bg-white dark:focus:bg-white/10 focus:ring-4 focus:ring-accent-primary/10 transition-all outline-none font-bold text-ui-text"
                            />
                        </div>

                        {categories.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar-hide shrink-0">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`px-6 h-14 rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 border ${!selectedCategory ? 'bg-black text-white border-black' : 'bg-white/50 dark:bg-white/5 border-ui-border text-ui-text-muted hover:border-ui-text'}`}
                                >
                                    <LayoutGrid size={18} />
                                    Todo
                                </button>
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-6 h-14 rounded-2xl text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 border ${selectedCategory === cat ? 'bg-black text-white border-black' : 'bg-white/50 dark:bg-white/5 border-ui-border text-ui-text-muted hover:border-ui-text'}`}
                                    >
                                        {getCategoryIcon(cat)}
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pb-20 md:pb-0 pr-2">
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <ShoppingCart className="mx-auto mb-4 opacity-30" size={48} />
                            <p>No se encontraron productos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max">
                            {filteredProducts.map(product => {
                                const isOutOfStock = product.stock === 0;
                                const cartItem = items.find(i => i.id === product.id);
                                const qtyInCart = cartItem ? cartItem.quantity : 0;
                                return (
                                    <div key={product.id} onClick={() => !isOutOfStock && addToCart(product)} className="ui-card ui-card-hover p-6 flex flex-col justify-between min-h-[220px] cursor-pointer group active:scale-95">
                                        <div className="relative">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-3 rounded-2xl ${isOutOfStock ? 'bg-red-500/10 text-red-500' : 'bg-accent-primary/5 text-accent-primary'}`}>
                                                    {getCategoryIcon(product.category || 'General')}
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${isOutOfStock ? 'bg-red-500 text-white' : 'bg-black/5 dark:bg-white/10 text-ui-text'}`}>
                                                    {isOutOfStock ? 'Agotado' : `${product.stock} un`}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-xl text-ui-text tracking-tight leading-[1.1] mb-2">{product.name}</h3>
                                            <p className="text-ui-text-muted text-xs font-bold uppercase tracking-widest">{product.category}</p>
                                        </div>
                                        
                                        <div className="mt-6 flex items-end justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-ui-text-muted uppercase tracking-widest mb-1">Precio</span>
                                                <span className="font-black text-3xl text-ui-text tracking-tighter">${product.price.toFixed(2)}</span>
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

            {/* Cart Invoice Sidebar (Glass Bento Widget) */}
            <div className={`fixed inset-x-0 bottom-0 lg:relative lg:inset-x-auto lg:bottom-auto w-full lg:w-[450px] shrink-0 flex flex-col transition-all duration-700 z-50
                ${items.length > 0 ? (isCartMinimized ? 'translate-y-[calc(100%-80px)] lg:translate-y-0' : 'translate-y-0') : 'translate-y-[120%] lg:translate-y-0 lg:opacity-50'} h-[75vh] lg:h-full`}>
                
                <div className="ui-card h-full flex flex-col p-4 border border-white/20 shadow-float">

                <div className="p-5 relative cursor-pointer md:cursor-default" onClick={() => window.innerWidth < 768 && setIsCartMinimized(!isCartMinimized)}>
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
                        <ul className="space-y-3 pb-2 pt-2">
                            {items.map(item => (
                                <li key={item.id + (item.variantId || '')} className="p-4 flex gap-3 ui-card ui-card-hover border border-ui-border mx-1">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[14px] font-black text-ui-text truncate tracking-wide uppercase">{item.name}</h4>
                                        <p className="text-[12px] font-bold text-accent-primary mt-1">${item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <span className="font-black text-[15px] text-ui-text">${(item.price * item.quantity).toFixed(2)}</span>
                                        <div className="flex items-center ui-input-box p-1">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 text-ui-text-muted transition-colors rounded-md active:scale-95">
                                                <Minus size={14} strokeWidth={3} />
                                            </button>
                                            <span className="w-7 text-center text-[13px] font-bold text-ui-text">{item.quantity}</span>
                                            <button onClick={() => addToCart(item)} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 text-ui-text-muted transition-colors rounded-md active:scale-95" disabled={item.quantity >= item.stock}>
                                                <Plus size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="p-5 mt-2 bg-ui-surface border-t border-ui-border">
                    <button onClick={() => setClientModalVisible(true)} className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all mb-5 ${selectedClient ? 'bg-accent-primary/5 border-accent-primary border' : 'ui-card hover:ui-card-hover border border-ui-border text-ui-text-muted'}`}>
                        <div className="flex items-center gap-3.5">
                            <div className={`p-2.5 rounded-full ${selectedClient ? 'bg-accent-primary text-white shadow-md' : 'bg-black/5 dark:bg-white/5 text-ui-text-muted'}`}>
                                <UserIcon size={18} />
                            </div>
                            <div className="text-left">
                                {selectedClient ? (
                                    <>
                                        <p className="text-[10px] font-black text-accent-primary uppercase tracking-widest">Cliente</p>
                                        <p className="font-bold text-ui-text text-[14px] truncate max-w-[150px]">{selectedClient.name}</p>
                                    </>
                                ) : (
                                    <p className="font-bold tracking-wide text-[13px]">Asignar Cliente</p>
                                )}
                            </div>
                        </div>
                        {selectedClient && <div onClick={(e) => { e.stopPropagation(); setSelectedClient(null); }} className="w-8 h-8 flex items-center justify-center text-[#FF3B30] bg-red-500/10 rounded-full hover:bg-red-500/20 active:scale-90 transition-all"><X size={14} strokeWidth={3} /></div>}
                    </button>

                    <div className="flex justify-between items-center mb-6 px-1">
                        <span className="text-ui-text-muted font-bold tracking-wide uppercase text-[12px]">Total</span>
                        <span className="text-[32px] font-black text-ui-text">${total.toFixed(2)}</span>
                    </div>

                    <button onClick={() => setCheckoutModalVisible(true)} disabled={items.length === 0} className="ui-btn ui-btn-primary w-full text-[16px] h-[56px] uppercase tracking-widest leading-none disabled:opacity-50">
                        Continuar
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
                                <div className="ui-input-box px-6 py-6 flex items-center justify-between">
                                    <span className="text-ui-text-muted font-black uppercase tracking-widest text-[12px]">Total a Pagar</span>
                                    <span className="text-3xl font-black text-ui-text">${total.toFixed(2)}</span>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted">Medio de Pago</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'cash', emoji: '💵', label: 'Efectivo' },
                                            { id: 'transfer', emoji: '📲', label: 'Transferencia' }
                                        ].map(opt => (
                                            <button key={opt.id} type="button" onClick={() => setPaymentMethod(opt.id as any)} className={`p-4 rounded-xl transition-all flex items-center justify-center gap-3 font-bold border-2 active:scale-95 ${paymentMethod === opt.id ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-transparent bg-black/5 dark:bg-white/5 text-ui-text-muted hover:bg-black/10 dark:hover:bg-white/10'}`}>
                                                <span className="text-xl">{opt.emoji}</span>
                                                <span className="uppercase tracking-wide text-xs">{opt.label}</span>
                                            </button>
                                        ))}
                                        <button type="button" onClick={() => setPaymentMethod('credit')} className={`col-span-2 p-4 rounded-xl transition-all flex items-center justify-center gap-3 font-bold border-2 active:scale-95 ${paymentMethod === 'credit' ? 'border-[#FF3B30] bg-[#FF3B30]/10 text-[#FF3B30]' : 'border-transparent bg-black/5 dark:bg-white/5 text-[#FF3B30]/80 hover:bg-black/10 dark:hover:bg-white/10'}`}>
                                            <span className="text-xl">📝</span>
                                            <span className="uppercase tracking-wide text-xs">Fiado / A Crédito</span>
                                        </button>
                                    </div>
                                </div>

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

                                <div className="flex gap-4 pt-4">
                                    <button type="button" className="ui-btn ui-btn-secondary flex-1" onClick={() => setCheckoutModalVisible(false)} disabled={isSaving}>Cancelar</button>
                                    <button type="submit" className="ui-btn ui-btn-primary flex-1" disabled={isSaving || (paymentMethod === 'credit' && !selectedClient)}>{isSaving ? 'Cobrando...' : 'Confirmar'}</button>
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
        </div>
    );
}

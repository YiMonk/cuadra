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
    const { user: currentUser } = useAuth();
    const { items, total, selectedClient, setSelectedClient, addToCart, updateQuantity, clearCart } = useCart();

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
            alert('Se requiere un cliente para ventas a crédito/fiado.');
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
            alert('¡Venta registrada con éxito!');
        } catch (error: any) {
            alert(error.message || 'No se pudo registrar la venta');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500 font-medium tracking-wide">Iniciando Caja...</span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 h-[calc(100vh-80px)] md:h-screen flex flex-col md:flex-row gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">

            {/* Products Area (Left) */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="mb-4 space-y-4 shrink-0">
                    <div>
                        <h1 className="text-3xl font-black tracking-widest text-neo-text uppercase">Punto de Venta</h1>
                        <p className="text-neo-text-muted/80 font-bold uppercase tracking-wide text-xs">Caja Principal y Catálogo</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Buscar productos..."
                                leftIcon={<Search size={18} />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {categories.length > 0 && (
                        <div className="flex gap-2.5 overflow-x-auto pb-4 pt-1 scrollbar-hide shrink-0 pl-1">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`px-5 py-2.5 rounded-neo-lg text-[13px] font-black tracking-wide whitespace-nowrap transition-all flex items-center gap-2 ${!selectedCategory ? 'neo-accent-bg text-white shadow-xl shadow-accent-blue/30 scale-[1.05]' : 'neo-convex text-neo-text-muted hover:text-neo-text active:neo-pressed'}`}
                            >
                                <LayoutGrid size={16} strokeWidth={!selectedCategory ? 3 : 2} />
                                TODAS
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-5 py-2.5 rounded-neo-lg text-[13px] font-black tracking-wide whitespace-nowrap transition-all flex items-center gap-2 ${selectedCategory === cat ? 'neo-accent-bg text-white shadow-xl shadow-accent-blue/30 scale-[1.05]' : 'neo-convex text-neo-text-muted hover:text-neo-text active:neo-pressed'}`}
                                >
                                    {getCategoryIcon(cat)}
                                    {cat.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pb-20 md:pb-0 pr-2">
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <ShoppingCart className="mx-auto mb-4 opacity-30" size={48} />
                            <p>No se encontraron productos.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-max p-1">
                            {filteredProducts.map(product => {
                                const isOutOfStock = product.stock === 0;
                                const cartItem = items.find(i => i.id === product.id);
                                const qtyInCart = cartItem ? cartItem.quantity : 0;
                                return (
                                    <div key={product.id} className="neo-raised-sm rounded-neo-lg p-5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[180px]">
                                        <div>
                                            <h3 className="font-black tracking-wide text-neo-text line-clamp-2 text-sm md:text-[15px] leading-snug">{product.name}</h3>
                                            <div className="flex justify-between items-center mt-3">
                                                <span className="font-black text-accent-cyan text-[22px]">${product.price.toFixed(2)}</span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-neo-sm ${isOutOfStock ? 'bg-[#FF3B30]/15 text-[#FF3B30] ring-1 ring-[#FF3B30]/30' : 'neo-pressed text-neo-text-muted'}`}>
                                                    {isOutOfStock ? 'Agotado' : `${product.stock} un`}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-4">
                                            {qtyInCart > 0 ? (
                                                <div className="flex items-center justify-between neo-pressed rounded-neo-lg p-1.5 border border-white/5">
                                                    <button onClick={() => updateQuantity(product.id!, qtyInCart - 1)} className="p-2 text-accent-cyan hover:text-white transition-colors rounded-neo hover:neo-raised-sm active:neo-pressed">
                                                        <Minus size={16} strokeWidth={3} />
                                                    </button>
                                                    <span className="font-bold text-white w-8 text-center text-[15px]">{qtyInCart}</span>
                                                    <button onClick={() => addToCart(product)} disabled={qtyInCart >= product.stock} className="p-2 text-accent-cyan hover:text-white transition-colors rounded-neo hover:neo-raised-sm active:neo-pressed disabled:opacity-30">
                                                        <Plus size={16} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <Button onClick={() => addToCart(product)} disabled={isOutOfStock} variant="secondary" className="w-full text-[13px] py-2 h-10 tracking-widest uppercase rounded-neo-lg">
                                                    Agregar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Invoice Sidebar */}
            <div className={`fixed inset-x-4 bottom-20 md:bottom-auto md:relative md:w-[400px] md:shrink-0 flex flex-col neo-raised rounded-neo-lg transition-all duration-500 z-40 p-2
                ${items.length > 0 ? (isCartMinimized ? 'translate-y-[calc(100%-72px)] md:translate-y-0' : 'translate-y-0') : 'translate-y-[120%] md:translate-y-0 md:opacity-100'} h-[50vh] md:h-full overflow-hidden`}>

                <div className="p-5 relative cursor-pointer md:cursor-default" onClick={() => window.innerWidth < 768 && setIsCartMinimized(!isCartMinimized)}>
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black tracking-wide flex items-center gap-3 text-neo-text">
                            <div className="w-10 h-10 rounded-neo-lg neo-pressed flex items-center justify-center text-accent-cyan">
                                <ShoppingCart size={20} className="animate-pulse" />
                            </div>
                            Ticket
                            {items.length > 0 && <span className="text-[11px] font-bold px-2.5 py-1 neo-accent-bg text-white rounded-neo-sm flex items-center justify-center min-w-[24px] shadow-lg">{items.reduce((s, i) => s + i.quantity, 0)}</span>}
                        </h2>
                        <div className="flex items-center gap-4">
                            {items.length > 0 && !isCartMinimized && (
                                <button onClick={(e) => { e.stopPropagation(); clearCart(); }} className="text-[#FF3B30] hover:text-[#FF3B30]/80 text-[11px] font-bold uppercase tracking-wider transition-colors neo-convex hover:neo-pressed px-3 py-1.5 rounded-neo">
                                    Vaciar
                                </button>
                            )}
                            <div className="md:hidden text-accent-cyan p-2 rounded-neo neo-convex">
                                {isCartMinimized ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 px-2">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-neo-text-muted/40">
                            <div className="w-20 h-20 rounded-full neo-pressed flex items-center justify-center mb-4">
                                <ShoppingCart size={32} className="opacity-30" />
                            </div>
                            <p className="text-sm font-bold tracking-wide uppercase">El carrito está vacío</p>
                        </div>
                    ) : (
                        <ul className="space-y-3 pb-2">
                            {items.map(item => (
                                <li key={item.id + (item.variantId || '')} className="p-4 flex gap-3 neo-convex rounded-neo-lg transition-all hover:scale-[1.01]">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[14px] font-black text-neo-text truncate tracking-wide uppercase">{item.name}</h4>
                                        <p className="text-[12px] font-bold text-accent-cyan mt-1">${item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-3">
                                        <span className="font-black text-[15px] text-neo-text">${(item.price * item.quantity).toFixed(2)}</span>
                                        <div className="flex items-center neo-pressed rounded-neo-lg p-1">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-white text-neo-text-muted transition-colors rounded-neo-sm">
                                                <Minus size={14} strokeWidth={3} />
                                            </button>
                                            <span className="w-7 text-center text-[13px] font-bold text-white">{item.quantity}</span>
                                            <button onClick={() => addToCart(item)} className="p-1 hover:text-white text-neo-text-muted transition-colors rounded-neo-sm" disabled={item.quantity >= item.stock}>
                                                <Plus size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="p-5 mt-2 rounded-neo-lg neo-convex">
                    <button onClick={() => setClientModalVisible(true)} className={`w-full p-3.5 rounded-neo-lg flex items-center justify-between transition-all mb-5 ${selectedClient ? 'neo-pressed ring-1 ring-accent-cyan/30' : 'neo-raised-sm hover:neo-pressed text-neo-text-muted'}`}>
                        <div className="flex items-center gap-3.5">
                            <div className={`p-2.5 rounded-full ${selectedClient ? 'neo-accent-bg text-white shadow-lg' : 'neo-pressed text-neo-text-muted'}`}>
                                <UserIcon size={18} />
                            </div>
                            <div className="text-left">
                                {selectedClient ? (
                                    <>
                                        <p className="text-[10px] font-black text-accent-cyan uppercase tracking-widest">Cliente</p>
                                        <p className="font-bold text-neo-text text-[14px] truncate max-w-[150px]">{selectedClient.name}</p>
                                    </>
                                ) : (
                                    <p className="font-bold tracking-wide text-[13px]">Asignar Cliente</p>
                                )}
                            </div>
                        </div>
                        {selectedClient && <div onClick={(e) => { e.stopPropagation(); setSelectedClient(null); }} className="w-8 h-8 flex items-center justify-center text-[#FF3B30] neo-convex rounded-full hover:neo-pressed transition-all"><X size={14} strokeWidth={3} /></div>}
                    </button>

                    <div className="flex justify-between items-center mb-6 px-1">
                        <span className="text-neo-text-muted font-bold tracking-wide uppercase text-[12px]">Total</span>
                        <span className="text-[32px] font-black text-white">${total.toFixed(2)}</span>
                    </div>

                    <Button onClick={() => setCheckoutModalVisible(true)} disabled={items.length === 0} className="w-full text-[16px] h-[56px] uppercase tracking-widest">
                        Continuar
                    </Button>
                </div>
            </div>

            {/* Modal de Cobro */}
            {checkoutModalVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 transition-all animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-neo-bg rounded-neo-lg border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8">
                            <div className="mb-8">
                                <h2 className="text-2xl font-black tracking-tight text-neo-text uppercase">Confirmar Cobro</h2>
                                <p className="text-accent-cyan font-black uppercase tracking-[0.2em] text-[11px] mt-1">Completa los detalles de pago</p>
                            </div>

                            <form onSubmit={handleConfirmSale} className="space-y-8">
                                <div className="neo-pressed rounded-neo-lg px-6 py-6 flex items-center justify-between border border-white/5">
                                    <span className="text-neo-text-muted font-black uppercase tracking-widest text-[12px]">Total a Pagar</span>
                                    <span className="text-3xl font-black text-white">${total.toFixed(2)}</span>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-neo-text-muted">Medio de Pago</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'cash', emoji: '💵', label: 'Efectivo' },
                                            { id: 'transfer', emoji: '📲', label: 'Transferencia' }
                                        ].map(opt => (
                                            <button key={opt.id} type="button" onClick={() => setPaymentMethod(opt.id as any)} className={`p-4 rounded-neo-lg transition-all flex items-center gap-3 font-bold ${paymentMethod === opt.id ? 'neo-accent-bg text-white shadow-lg' : 'neo-convex text-neo-text-muted hover:shadow-md'}`}>
                                                <span className="text-xl">{opt.emoji}</span>
                                                <span className="uppercase tracking-wide text-xs">{opt.label}</span>
                                            </button>
                                        ))}
                                        <button type="button" onClick={() => setPaymentMethod('credit')} className={`col-span-2 p-4 rounded-neo-lg transition-all flex items-center gap-3 font-bold ${paymentMethod === 'credit' ? 'bg-[#FF3B30] text-white shadow-lg' : 'neo-convex text-[#FF3B30]/80 hvoer:shadow-md'}`}>
                                            <span className="text-xl">📝</span>
                                            <span className="uppercase tracking-wide text-xs">Fiado / A Crédito</span>
                                        </button>
                                    </div>
                                </div>

                                {paymentMethod === 'transfer' && (
                                    <div className="space-y-4">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-neo-text-muted">Comprobante</p>
                                        <input ref={evidenceInputRef} type="file" accept="image/*" className="hidden" onChange={handleEvidenceChange} />
                                        {evidencePreview ? (
                                            <div className="relative rounded-neo-lg overflow-hidden aspect-video neo-pressed border border-white/5">
                                                <img src={evidencePreview} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => {setEvidenceFile(null); setEvidencePreview(null);}} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/80 text-white flex items-center justify-center"><X size={16}/></button>
                                            </div>
                                        ) : (
                                            <button type="button" onClick={() => evidenceInputRef.current?.click()} className="w-full py-8 rounded-neo-lg neo-pressed border border-dashed border-white/10 flex flex-col items-center gap-2">
                                                <Camera className="text-accent-cyan" />
                                                <span className="text-[12px] font-bold text-neo-text">Cargar Comprobante</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                <Input label="NOTAS DE VENTA" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Ej: Pago pendiente..." />

                                <div className="flex gap-4 pt-4">
                                    <Button type="button" variant="secondary" className="flex-1 py-6 uppercase tracking-widest text-xs" onClick={() => setCheckoutModalVisible(false)} disabled={isSaving}>Cancelar</Button>
                                    <Button type="submit" className="flex-1 py-6 uppercase tracking-widest text-xs shadow-lg" isLoading={isSaving} disabled={isSaving || (paymentMethod === 'credit' && !selectedClient)}>Confirmar</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Clientes */}
            {clientModalVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 transition-all animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-neo-bg rounded-neo-lg border border-white/10 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 pb-4">
                            <h2 className="text-2xl font-black tracking-tight text-neo-text uppercase mb-6">Seleccionar Cliente</h2>
                            <Input placeholder="Buscar por nombre..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} autoFocus leftIcon={<Search size={18} />} />
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 py-4">
                            <div className="neo-pressed rounded-neo-lg border border-white/5 p-2">
                                {filteredClients.length === 0 ? (
                                    <div className="p-8 text-center text-neo-text-muted/40 font-bold uppercase text-xs">No hay resultados</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {filteredClients.map(c => (
                                            <li key={c.id}>
                                                <button onClick={() => { setSelectedClient(c); setClientModalVisible(false); }} className="w-full text-left p-4 rounded-neo neo-convex hover:shadow-lg active:neo-pressed transition-all">
                                                    <p className="font-bold text-neo-text tracking-wide uppercase text-[13px]">{c.name}</p>
                                                    <p className="text-[11px] font-bold text-accent-cyan mt-1 tracking-widest">{c.phone}</p>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="p-8 pt-0">
                            <Button variant="secondary" className="w-full py-6 uppercase tracking-widest text-xs" onClick={() => setClientModalVisible(false)}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { ProductService } from '@/services/product.service';
import { ClientService } from '@/services/client.service';
import { SalesService } from '@/services/sales.service';
import { UserService } from '@/services/user.service';
import { Product, ProductVariant } from '@/types/inventory';
import { Client } from '@/types/client';
import { Search, ShoppingCart, Minus, Plus, Trash2, X, CheckCircle2, User as UserIcon, Camera, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

export default function POSScreen() {
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const { items, total, selectedClient, setSelectedClient, addToCart, updateQuantity, removeFromCart, clearCart } = useCart();

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
            await SalesService.createSale({
                items: items as any,
                total,
                paymentMethod,
                clientId: selectedClient?.id || null,
                clientName: selectedClient?.name || null,
                evidenceUrl: null, // Basic web flow assumes no local image picking for now. Can be added via URL later.
                notes: paymentNotes || undefined,
                cashboxId: currentUser?.uid,
                cashboxName: currentUser?.displayName || 'Cajero',
            });

            clearCart();
            setPaymentNotes('');
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
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Punto de Venta</h1>
                        <p className="text-foreground/60 font-medium">Caja Principal y Catálogo</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Buscar productos..."
                                className="h-12 ios-glass border border-white/20 dark:border-white/10 shadow-sm"
                                leftIcon={<Search size={18} />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {categories.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide shrink-0">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${!selectedCategory ? 'bg-ios-blue text-white shadow-md' : 'ios-glass text-foreground/60 border border-white/20 dark:border-white/10'}`}
                            >
                                Todas
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-ios-blue text-white shadow-md' : 'ios-glass text-foreground/60 border border-white/20 dark:border-white/10'}`}
                                >
                                    {cat}
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
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max">
                            {filteredProducts.map(product => {
                                const isOutOfStock = product.stock === 0;
                                const cartItem = items.find(i => i.id === product.id);
                                const qtyInCart = cartItem ? cartItem.quantity : 0;

                                return (
                                    <div key={product.id} className="ios-glass rounded-4xl p-4 border border-white/20 dark:border-white/10 shadow-sm hover:shadow-xl transition-all hover:scale-[1.02] flex flex-col justify-between h-40">
                                        <div>
                                            <h3 className="font-bold text-foreground line-clamp-2 text-sm md:text-base leading-snug" title={product.name}>{product.name}</h3>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="font-black text-ios-blue text-lg">${product.price.toFixed(2)}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-ios ${isOutOfStock ? 'bg-ios-red/10 text-ios-red' : 'bg-ios-gray/10 text-foreground/60'}`}>
                                                    {isOutOfStock ? 'Agotado' : `${product.stock} un`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3">
                                            {qtyInCart > 0 ? (
                                                <div className="flex items-center justify-between bg-ios-blue/10 rounded-ios p-1 border border-ios-blue/20">
                                                    <button onClick={() => updateQuantity(product.id!, qtyInCart - 1)} className="p-2 text-ios-blue hover:bg-ios-blue/10 rounded-ios">
                                                        <Minus size={16} strokeWidth={3} />
                                                    </button>
                                                    <span className="font-bold text-ios-blue w-8 text-center">{qtyInCart}</span>
                                                    <button
                                                        onClick={() => addToCart(product)}
                                                        disabled={qtyInCart >= product.stock}
                                                        className="p-2 text-ios-blue hover:bg-ios-blue/10 rounded-ios disabled:opacity-30"
                                                    >
                                                        <Plus size={16} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => {
                                                        if (product.variants && product.variants.length > 0) {
                                                            alert("La selección de variantes por web está en desarrollo. Seleccionando la base.");
                                                            // For now bypass it
                                                        }
                                                        addToCart(product);
                                                        setIsCartMinimized(false);
                                                    }}
                                                    disabled={isOutOfStock}
                                                    className="w-full text-sm py-2 h-10 shadow-sm"
                                                >
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

            {/* Cart Invoice Sidebar (Right) - Liquid Glass Design */}
            <div className={`fixed inset-x-4 bottom-20 md:bottom-auto md:relative md:w-96 md:shrink-0 flex flex-col ios-glass bg-white/40 dark:bg-black/40 rounded-4xl shadow-2xl transition-all duration-500 z-40 
                ${items.length > 0
                    ? (isCartMinimized ? 'translate-y-[calc(100%-72px)] md:translate-y-0' : 'translate-y-0 opacity-100')
                    : 'translate-y-[120%] opacity-0 pointer-events-none md:translate-y-0 md:opacity-100 md:pointer-events-auto'
                } h-[50vh] md:h-full overflow-hidden border border-white/30 dark:border-white/10`}>

                <div
                    onClick={() => window.innerWidth < 768 && setIsCartMinimized(!isCartMinimized)}
                    className="p-5 border-b border-ios-separator/10 bg-white/5 dark:bg-black/5 backdrop-blur-xl rounded-t-4xl relative cursor-pointer md:cursor-default"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                            <ShoppingCart size={22} className="text-ios-blue animate-pulse" /> Ticket
                            {items.length > 0 && <span className="text-xs px-2 py-0.5 bg-ios-blue text-white rounded-full flex items-center justify-center min-w-[20px] h-[20px]">{items.reduce((s, i) => s + i.quantity, 0)}</span>}
                        </h2>

                        <div className="flex items-center gap-4">
                            {items.length > 0 && !isCartMinimized && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); clearCart(); }}
                                    className="text-ios-red/80 hover:text-ios-red text-xs font-bold transition-colors bg-ios-red/10 px-3 py-1.5 rounded-full"
                                >
                                    Vaciar
                                </button>
                            )}
                            <div className="md:hidden text-ios-blue p-1 rounded-full bg-ios-blue/10">
                                {isCartMinimized ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 bg-ios-bg/20">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <ShoppingCart size={40} className="mb-3 opacity-20" />
                            <p className="text-sm font-medium">El carrito está vacío</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                            {items.map(item => (
                                <li key={item.id + (item.variantId || '')} className="p-4 flex gap-3 group">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-foreground truncate">{item.name}</h4>
                                        <p className="text-xs text-foreground/50 mt-0.5">${item.price.toFixed(2)} c/u</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className="font-bold text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                                        <div className="flex items-center bg-ios-gray/10 rounded-ios p-0.5 border border-ios-separator/20">
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:bg-ios-secondary-bg rounded-ios-sm text-foreground/70">
                                                <Minus size={14} strokeWidth={3} />
                                            </button>
                                            <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                                            <button onClick={() => addToCart(item)} className="p-1 hover:bg-ios-secondary-bg rounded-ios-sm text-foreground/70" disabled={item.quantity >= item.stock}>
                                                <Plus size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="p-5 border-t border-ios-separator/20 bg-white/5 dark:bg-black/5 backdrop-blur-xl rounded-b-4xl">
                    <button
                        onClick={() => setClientModalVisible(true)}
                        className={`w-full p-3 rounded-ios-lg border flex items-center justify-between transition-colors mb-4
                            ${selectedClient ? 'border-ios-blue bg-ios-blue/5' : 'border-dashed border-ios-separator/50 hover:border-ios-blue/50 hover:bg-ios-gray/5'}
                        `}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`p-2 rounded-full ${selectedClient ? 'bg-ios-blue text-white' : 'bg-ios-gray/10 text-ios-gray'}`}>
                                <UserIcon size={18} />
                            </div>
                            <div className="text-left truncate">
                                {selectedClient ? (
                                    <>
                                        <p className="text-xs font-bold text-ios-blue uppercase tracking-wider">Cliente Asignado</p>
                                        <p className="font-bold text-foreground truncate">{selectedClient.name}</p>
                                    </>
                                ) : (
                                    <p className="font-semibold text-foreground/50">Asignar Cliente (Opcional)</p>
                                )}
                            </div>
                        </div>
                        {selectedClient && (
                            <div onClick={(e) => { e.stopPropagation(); setSelectedClient(null); }} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors">
                                <X size={16} />
                            </div>
                        )}
                    </button>

                    <div className="flex justify-between items-center mb-5">
                        <span className="text-foreground/50 font-bold">Resumen de Venta</span>
                        <span className="text-3xl font-black text-ios-blue">${total.toFixed(2)}</span>
                    </div>

                    <Button
                        onClick={() => setCheckoutModalVisible(true)}
                        disabled={items.length === 0}
                        className="w-full text-lg h-14 shadow-xl shadow-blue-500/20"
                    >
                        Cobrar Total
                    </Button>
                </div>
            </div>

            {/* Checkout Confirmation Modal */}
            {checkoutModalVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 border-0">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-foreground">Confirmar Pago</h2>
                                <button onClick={() => setCheckoutModalVisible(false)} className="text-ios-gray hover:text-foreground"><X size={20} /></button>
                            </div>

                            <div className="bg-ios-gray/10 p-4 rounded-ios-lg mb-6 flex items-center justify-between border border-ios-separator/10">
                                <span className="font-medium text-foreground/70">Total a Pagar:</span>
                                <span className="text-3xl font-black text-ios-blue">${total.toFixed(2)}</span>
                            </div>

                            <form onSubmit={handleConfirmSale} className="space-y-5">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-foreground/70 uppercase tracking-wider">Medio de Pago</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <label className={`flex flex-col items-center justify-center p-3 border rounded-ios-lg cursor-pointer transition-all ${paymentMethod === 'cash' ? 'border-ios-blue bg-ios-blue/10 text-ios-blue font-bold' : 'border-ios-separator/30 hover:bg-ios-gray/10 text-foreground/60'}`}>
                                            <input type="radio" className="sr-only" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} />
                                            <span>💵 Efectivo</span>
                                        </label>
                                        <label className={`flex flex-col items-center justify-center p-3 border rounded-ios-lg cursor-pointer transition-all ${paymentMethod === 'transfer' ? 'border-ios-blue bg-ios-blue/10 text-ios-blue font-bold' : 'border-ios-separator/30 hover:bg-ios-gray/10 text-foreground/60'}`}>
                                            <input type="radio" className="sr-only" checked={paymentMethod === 'transfer'} onChange={() => setPaymentMethod('transfer')} />
                                            <span>📱 Transferencia</span>
                                        </label>
                                        <label className={`col-span-2 flex flex-col items-center justify-center p-3 border rounded-ios-lg cursor-pointer transition-all ${paymentMethod === 'credit' ? 'border-ios-red bg-ios-red/10 text-ios-red font-bold' : 'border-ios-separator/30 hover:bg-ios-gray/10 text-foreground/60'}`}>
                                            <input type="radio" className="sr-only" checked={paymentMethod === 'credit'} onChange={() => setPaymentMethod('credit')} />
                                            <span>📝 Fiado / A Crédito</span>
                                        </label>
                                    </div>
                                </div>

                                {paymentMethod === 'credit' && !selectedClient && (
                                    <div className="flex gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-semibold">
                                        <AlertCircle size={16} /> Necesitas asignar un cliente al ticket.
                                    </div>
                                )}

                                <Input
                                    label="Notas (Opcional)"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="Razón, referencia, vuelto pendiente..."
                                />

                                <div className="pt-2">
                                    <Button type="submit" className="w-full h-12 text-lg shadow-md" isLoading={isSaving} disabled={isSaving || (paymentMethod === 'credit' && !selectedClient)}>
                                        Procesar Factura
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Client Select Modal */}
            {clientModalVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500/10 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 border-0 flex flex-col max-h-[80vh]">
                        <CardContent className="p-6 flex flex-col overflow-hidden h-full ">
                            <div className="flex justify-between items-center mb-4 shrink-0">
                                <h2 className="text-xl font-bold text-foreground">Seleccionar Cliente</h2>
                                <button onClick={() => setClientModalVisible(false)} className="text-ios-gray hover:text-foreground"><X size={20} /></button>
                            </div>

                            <div className="mb-4 shrink-0">
                                <Input
                                    placeholder="Buscar por nombre o tlf..."
                                    value={clientSearch}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto min-h-0 border border-gray-100 dark:border-gray-800 rounded-xl">
                                {filteredClients.length === 0 ? (
                                    <p className="p-4 text-center text-gray-500">No hay clientes con ese nombre.</p>
                                ) : (
                                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {filteredClients.map(c => (
                                            <li key={c.id}>
                                                <button
                                                    className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                                    onClick={() => { setSelectedClient(c); setClientModalVisible(false); }}
                                                >
                                                    <p className="font-bold text-gray-900 dark:text-white">{c.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{c.phone}</p>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

        </div>
    );
}

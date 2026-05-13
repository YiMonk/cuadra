"use client";

import React, { useEffect, useState } from 'react';
import { ProductService } from '@/services/product.service';
import { useOwnerContext } from '@/hooks/useOwnerContext';
import { useInventory } from '@/hooks/useInventory';
import { CategoryService } from '@/services/category.service';
import { LocationService } from '@/services/location.service';
import { Product } from '@/types/inventory';
import { Category } from '@/types/category';
import { Search, Plus, PackageOpen, AlertCircle, XCircle, Edit, Trash2, PackagePlus, ArrowRightLeft, LayoutGrid, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Select } from '@/components/ui/Select';
import { CategoryModal } from '@/components/inventory/CategoryModal';
import { useCurrency } from '@/context/CurrencyContext';

export default function InventoryScreen() {
    const router = useRouter();
    const { user, isLoading: authLoading } = useAuth();
    const { ownerId } = useOwnerContext();
    const { products, isLoading: loading } = useInventory(ownerId);

    useEffect(() => {
        if (!authLoading && user) {
            const isGlobalAdmin = user.role === 'admin' || user.role === 'admingod';
            if (isGlobalAdmin) {
                router.replace('/admin/dashboard');
            }
        }
    }, [user, authLoading, router]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

    const [categories, setCategories] = useState<Category[]>([]);

    // Modal States
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [stockModalVisible, setStockModalVisible] = useState(false);
    const [stockAdjustmentProduct, setStockAdjustmentProduct] = useState<Product | null>(null);

    const [categoryModalVisible, setCategoryModalVisible] = useState(false);

    // Form State (Product)
    const { formatPrice, toUSD, currency: globalCurrency, fromUSD } = useCurrency();
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [priceCurrency, setPriceCurrency] = useState<'USD' | 'VES'>('USD');
    const [stock, setStock] = useState('');
    const [minStock, setMinStock] = useState('5');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [locations, setLocations] = useState<{id: string, name: string}[]>([]);
    
    useEffect(() => {
        if (!ownerId) return;
        const unsub = LocationService.subscribeToLocations(ownerId, data => {
            setLocations(data);
            if (data.length > 0 && !selectedLocation) {
                setSelectedLocation(data[0].id);
            }
        });
        return () => unsub();
    }, [ownerId]);

    // Form State (Stock Adjustment)
    const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState<'restock' | 'waste'>('restock');
    const [adjustmentNotes, setAdjustmentNotes] = useState('');
    const [isSavingStock, setIsSavingStock] = useState(false);

    useEffect(() => {
        if (!ownerId) return;
        loadCategories(ownerId);
    }, [ownerId]);

    const loadCategories = async (ownerId: string) => {
        try {
            const data = await CategoryService.getCategories(ownerId);
            setCategories(data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        let filtered = products;

        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterCategory) {
            filtered = filtered.filter(p => p.category === filterCategory);
        }

        if (stockFilter === 'low') {
            filtered = filtered.filter(p => p.stock > 0 && p.stock <= (p.minStockAlert || 5));
        } else if (stockFilter === 'out') {
            filtered = filtered.filter(p => p.stock <= 0);
        }

        setFilteredProducts(filtered);
    }, [searchQuery, stockFilter, filterCategory, products]);

    const openCreateModal = () => {
        setEditingProduct(null);
        setName('');
        setPrice('');
        setStock('');
        setMinStock('5');
        setSelectedCategory('');
        setSelectedLocation(locations.length > 0 ? locations[0].id : '');
        setProductModalVisible(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setName(product.name);
        setPrice(product.price.toString());
        setPriceCurrency('USD');
        setStock(product.stock.toString());
        setMinStock((product.minStockAlert || 5).toString());
        setSelectedCategory(product.category || '');
        setSelectedLocation(product.location || (locations.length > 0 ? locations[0].id : ''));
        setProductModalVisible(true);
    };

    const handleDelete = async (product: Product) => {
        if (!product.id) return;
        
        toast.error(`¿Eliminar "${product.name}"?`, {
            action: {
                label: 'Eliminar',
                onClick: async () => {
                    try {
                        await ProductService.deleteProduct(product.id!);
                        toast.success('Producto eliminado');
                    } catch (error) {
                        toast.error("Error eliminando producto");
                    }
                }
            },
            cancel: { label: 'Cancelar', onClick: () => {} }
        });
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || (!price && price !== '0')) return;
        
        const stockVal = parseInt(stock) || 0;
        const priceVal = parseFloat(price) || 0;
        
        if (stockVal < 0) {
            toast.error("El stock no puede ser negativo.");
            return;
        }
        if (priceVal < 0) {
            toast.error("El precio no puede ser negativo.");
            return;
        }

        setIsSaving(true);
        try {
            const priceNum = parseFloat(price);
            const priceInUSD = priceCurrency === 'VES' ? toUSD(priceNum, 'VES') : priceNum;

            if (editingProduct) {
                const updatePayload: any = {
                    name,
                    price: priceInUSD,
                    minStockAlert: parseInt(minStock) || 5,
                    category: selectedCategory || 'General',
                    location: selectedLocation
                };
                if (stock.trim() !== '') {
                    updatePayload.stock = stockVal;
                }
                await ProductService.updateProduct(editingProduct.id!, updatePayload);
            } else {
                await ProductService.addProduct({
                    name,
                    price: priceInUSD,
                    stock: stockVal,
                    minStockAlert: parseInt(minStock) || 5,
                    category: selectedCategory || 'General',
                    description: '',
                    location: selectedLocation
                }, ownerId);
            }
            setProductModalVisible(false);
            toast.success(`¡Producto ${editingProduct ? 'actualizado' : 'registrado'} con éxito!`);
        } catch (error: any) {
            console.error(error);
            toast.error("Error al guardar el producto: " + (error.message || "Error desconocido"));
        } finally {
            setIsSaving(false);
        }
    };

    const openStockModal = (product: Product) => {
        setStockAdjustmentProduct(product);
        setAdjustmentQuantity('');
        setAdjustmentNotes('');
        setAdjustmentReason('restock');
        setStockModalVisible(true);
    };

    const handleAdjustStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stockAdjustmentProduct || !adjustmentQuantity) return;
        setIsSavingStock(true);
        try {
            const adj = adjustmentReason === 'waste' ? -parseInt(adjustmentQuantity) : parseInt(adjustmentQuantity);
            await ProductService.adjustStock(stockAdjustmentProduct.id!, adj, adjustmentReason, adjustmentNotes);
            setStockModalVisible(false);
            toast.success('Stock actualizado');
        } catch (error) {
            toast.error('Error actualizando stock');
        } finally {
            setIsSavingStock(false);
        }
    };

    if (loading || authLoading || (user?.role === 'admin' || user?.role === 'admingod')) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500 font-medium tracking-wide">
                    {loading ? 'Cargando Inventario...' : 'Redirigiendo...'}
                </span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6">
                <div>
                    <h1 className="text-3xl md:text-[40px] font-black tracking-tighter text-ui-text uppercase leading-none">Inventario</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-1 w-8 bg-accent-primary rounded-full transition-all group-hover:w-12" />
                        <p className="text-ui-text-muted/80 font-black uppercase tracking-[0.2em] text-[10px]">Catálogo Global</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {user?.role !== 'staff' && (
                        <>
                            <button 
                                onClick={() => setCategoryModalVisible(true)} 
                                className="flex-1 md:flex-none ui-card hover:ui-card-hover border border-white/20 active:scale-95 transition-all duration-400 px-4 md:px-6 h-12 md:h-16 flex items-center justify-center gap-2 min-w-0 md:min-w-[140px] group shadow-premium"
                            >
                                <LayoutGrid size={18} className="text-ui-text-muted group-hover:text-accent-primary transition-colors" />
                                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-ui-text-muted group-hover:text-ui-text truncate">Categorías</span>
                            </button>
                            
                            <button 
                                onClick={openCreateModal} 
                                className="flex-1 md:flex-none bg-accent-primary text-white hover:scale-[1.03] active:scale-95 transition-all duration-400 rounded-xl md:rounded-2xl px-5 md:px-8 h-12 md:h-16 flex items-center justify-center gap-2 min-w-0 md:min-w-[180px] shadow-premium"
                            >
                                <Plus size={20} strokeWidth={3} />
                                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest truncate">Nuevo</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-4 mb-10">
                <div className="relative w-full lg:flex-1">
                    <Input
                        placeholder="BUSCAR EN EL INVENTARIO..."
                        leftIcon={<Search size={20} className="text-accent-primary" />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-14 !pl-12 !rounded-2xl shadow-premium border-white/20"
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="w-full sm:w-56 shrink-0 z-20">
                        <Select
                            options={[
                                { value: '', label: 'Toda Categoría' },
                                ...categories.map(c => ({ value: c.name, label: c.name }))
                            ]}
                            value={filterCategory}
                            onChange={(val) => setFilterCategory(val)}
                        />
                    </div>

                    <div className="ui-card p-1.5 flex shrink-0 gap-1.5 bg-black/2 tracking-tighter dark:bg-white/5 border-ui-border/50 rounded-2xl w-full sm:w-auto overflow-x-auto hide-scrollbar">
                        <button
                            onClick={() => setStockFilter('all')}
                            className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all ${stockFilter === 'all' ? 'bg-accent-primary text-white shadow-lg shadow-blue-500/20' : 'text-ui-text-muted hover:text-ui-text'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setStockFilter('low')}
                            className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${stockFilter === 'low' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-orange-500/60 hover:text-orange-500'}`}
                        >
                            <AlertCircle size={14} /> <span className="hidden sm:inline">Bajo</span>
                        </button>
                        <button
                            onClick={() => setStockFilter('out')}
                            className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${stockFilter === 'out' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-red-500/60 hover:text-red-500'}`}
                        >
                            <XCircle size={14} /> <span className="hidden sm:inline">Faltantes</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-24 text-ui-text-muted">
                        <PackageOpen className="mx-auto mb-6 opacity-20" size={80} />
                        <p className="text-xl font-black uppercase tracking-widest opacity-50">Inventario Vacío</p>
                    </div>
                ) : (
                    filteredProducts.map(item => {
                        const isLowStock = item.stock > 0 && item.stock <= (item.minStockAlert || 5);
                        const isOutOfStock = item.stock <= 0;

                        return (
                            <div key={item.id} className={`ui-card ui-card-hover p-6 md:p-8 flex flex-col h-full group relative min-h-[280px] md:min-h-[300px] transition-all ${isOutOfStock ? 'border-red-500/40 bg-red-500/5 shadow-premium' : 'border-ui-border/50'}`}>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-4 md:mb-6">
                                        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl shrink-0 ${isOutOfStock ? 'bg-red-500 text-white shadow-lg animate-pulse' : isLowStock ? 'bg-orange-500/10 text-orange-600' : 'bg-green-500/10 text-green-600'}`}>
                                            <PackageOpen size={22} strokeWidth={2.5} />
                                        </div>
                                        {item.category && (
                                            <span className="px-3 py-1.5 bg-black/5 dark:bg-white/10 text-ui-text-muted rounded-full text-[9px] md:text-[10px] font-black tracking-widest uppercase">
                                                {item.category}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <h3 className="text-xl md:text-2xl font-black text-ui-text tracking-tight mb-2 leading-none">{item.name}</h3>
                                    
                                    <div className="flex items-baseline gap-2 mb-6">
                                        <span className="text-3xl font-black text-ui-text tracking-tighter">
                                            {formatPrice(item.price)}
                                        </span>
                                    </div>

                                    <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest
                                        ${isOutOfStock ? 'bg-red-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)]'
                                            : isLowStock ? 'bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.3)]'
                                                : 'bg-black/5 dark:bg-white/10 text-ui-text'}`}
                                    >
                                        <span>Stock: {item.stock}</span>
                                        {isOutOfStock && <span>(Agotado)</span>}
                                        {isLowStock && <span>(Bajo)</span>}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-8 pt-6 border-t border-ui-border">
                                    {user?.role !== 'staff' ? (
                                        <>
                                            <button
                                                onClick={() => openStockModal(item)}
                                                className="text-[11px] font-black tracking-widest uppercase flex items-center gap-2 text-ui-text-muted hover:text-accent-primary transition-all active:scale-95"
                                            >
                                                <ArrowRightLeft size={16} strokeWidth={2.5} />
                                                Ajustar
                                            </button>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(item)}
                                                    className="w-10 h-10 flex items-center justify-center bg-black/5 dark:bg-white/5 text-ui-text-muted hover:text-ui-text hover:bg-white/10 rounded-xl transition-all active:scale-90"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-[#FF3B30] hover:bg-[#FF3B30] hover:text-white rounded-xl transition-all active:scale-90"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full text-center py-2 px-4 rounded-xl bg-black/5 text-ui-text-muted text-[10px] font-black uppercase tracking-widest">
                                            Solo Lectura
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Product Modal */}
            {productModalVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="ui-card w-full max-w-lg border border-ui-border flex flex-col max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-ui-text uppercase tracking-tight">
                                        {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                                    </h2>
                                    <div className="h-1 w-12 bg-accent-primary mt-1.5 rounded-full" />
                                </div>
                                <button 
                                    onClick={() => setProductModalVisible(false)} 
                                    className="w-10 h-10 flex items-center justify-center text-ui-text-muted hover:text-accent-danger active:scale-90 transition-all duration-200 bg-black/5 dark:bg-white/5 rounded-full group"
                                >
                                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>
                            <form onSubmit={handleSaveProduct} className="space-y-4">
                                <Input
                                    label="Nombre del Producto"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Franela Básica"
                                    required
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Input
                                            label={`Precio (${priceCurrency})`}
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            placeholder="0.00"
                                            type="number"
                                            step="0.01"
                                            required
                                            rightIcon={
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const currentVal = parseFloat(price) || 0;
                                                        if (priceCurrency === 'USD') {
                                                            setPriceCurrency('VES');
                                                            setPrice(fromUSD(currentVal, 'VES').toFixed(2));
                                                        } else {
                                                            setPriceCurrency('USD');
                                                            setPrice(toUSD(currentVal, 'VES').toFixed(2));
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-accent-primary/10 text-accent-primary rounded text-[10px] font-black uppercase tracking-widest hover:bg-accent-primary/20 transition-colors"
                                                >
                                                    {priceCurrency}
                                                </button>
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-black uppercase tracking-widest text-neo-text-muted">Categoría</p>
                                        <Select
                                            options={[
                                                { value: '', label: 'Ninguna' },
                                                ...categories.filter(c => !c.parentId).map(c => ({ value: c.name, label: c.name }))
                                            ]}
                                            value={selectedCategory}
                                            onChange={(val) => setSelectedCategory(val)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted">Ubicación / Sede</p>
                                    <Select
                                        options={locations.map(l => ({ value: l.id, label: l.name }))}
                                        value={selectedLocation}
                                        onChange={(val) => setSelectedLocation(val)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <Input
                                        label={editingProduct ? "Actualizar Stock (Opcional)" : "Stock Inicial"}
                                        value={stock}
                                        onChange={(e) => setStock(e.target.value)}
                                        placeholder="0"
                                        type="number"
                                    />
                                    <Input
                                        label="Alerta Mínima"
                                        value={minStock}
                                        onChange={(e) => setMinStock(e.target.value)}
                                        placeholder="5"
                                        type="number"
                                    />
                                </div>

                                <div className="flex gap-4 pt-8">
                                    <button type="button" className="ui-btn ui-btn-secondary flex-1" onClick={() => setProductModalVisible(false)} disabled={isSaving}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="ui-btn ui-btn-primary flex-1" disabled={isSaving}>
                                        {isSaving ? 'Guardando...' : editingProduct ? 'Guardar' : 'Registrar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {stockModalVisible && stockAdjustmentProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="ui-card w-full max-w-md border border-ui-border flex flex-col max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-ui-text uppercase tracking-tight">Ajustar Stock</h2>
                                    <p className="text-accent-primary font-black text-[10px] uppercase tracking-[0.2em] mt-1">
                                        {stockAdjustmentProduct.name} • Actual: {stockAdjustmentProduct.stock}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => setStockModalVisible(false)} 
                                    className="w-10 h-10 flex items-center justify-center text-ui-text-muted hover:text-accent-danger active:scale-90 transition-all duration-200 bg-black/5 dark:bg-white/5 rounded-full group"
                                >
                                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>

                            <form onSubmit={handleAdjustStock} className="space-y-5">

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentReason('restock')}
                                        className={`flex-1 py-5 px-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-95
                                            ${adjustmentReason === 'restock' ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-transparent bg-black/5 dark:bg-white/5 text-ui-text-muted hover:bg-black/10 dark:hover:bg-white/10'}
                                        `}
                                    >
                                        <PackagePlus size={24} strokeWidth={3} />
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">Entrada</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentReason('waste')}
                                        className={`flex-1 py-5 px-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 active:scale-95
                                            ${adjustmentReason === 'waste' ? 'border-accent-danger bg-accent-danger/10 text-accent-danger' : 'border-transparent bg-black/5 dark:bg-white/5 text-ui-text-muted hover:bg-black/10 dark:hover:bg-white/10'}
                                        `}
                                    >
                                        <Trash2 size={24} strokeWidth={3} />
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-1">Merma</span>
                                    </button>
                                </div>

                                <Input
                                    label="Cantidad"
                                    value={adjustmentQuantity}
                                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                                    placeholder="0"
                                    type="number"
                                    min="1"
                                    required
                                />

                                <Input
                                    label="Notas (Opcional)"
                                    value={adjustmentNotes}
                                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                                    placeholder="Razón del ajuste..."
                                />

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setStockModalVisible(false)}
                                        className="ui-btn ui-btn-secondary flex-1"
                                        disabled={isSavingStock}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className={`ui-btn flex-1 ${adjustmentReason === 'waste' ? 'ui-btn-danger' : 'ui-btn-primary'}`}
                                        disabled={isSavingStock}
                                    >
                                        {isSavingStock ? 'Guardando...' : 'Confirmar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {categoryModalVisible && (
                <CategoryModal onClose={() => setCategoryModalVisible(false)} />
            )}
        </div>
    );
}

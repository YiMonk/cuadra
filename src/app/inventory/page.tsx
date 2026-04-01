"use client";

import React, { useEffect, useState } from 'react';
import { ProductService } from '@/services/product.service';
import { CategoryService } from '@/services/category.service';
import { Product } from '@/types/inventory';
import { Category } from '@/types/category';
import { Search, Plus, PackageOpen, AlertCircle, XCircle, Edit, Trash2, PackagePlus, ArrowRightLeft, LayoutGrid, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui/Select';

export default function InventoryScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

    const [categories, setCategories] = useState<Category[]>([]);

    // Modal States
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const [stockModalVisible, setStockModalVisible] = useState(false);
    const [stockAdjustmentProduct, setStockAdjustmentProduct] = useState<Product | null>(null);

    // Form State (Product)
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [minStock, setMinStock] = useState('5');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Form State (Stock Adjustment)
    const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState<'restock' | 'waste'>('restock');
    const [adjustmentNotes, setAdjustmentNotes] = useState('');
    const [isSavingStock, setIsSavingStock] = useState(false);

    useEffect(() => {
        loadCategories();
        const unsubscribe = ProductService.subscribeToProducts((updatedProducts) => {
            setProducts(updatedProducts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await CategoryService.getCategories();
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

        if (stockFilter === 'low') {
            filtered = filtered.filter(p => p.stock > 0 && p.stock <= (p.minStockAlert || 5));
        } else if (stockFilter === 'out') {
            filtered = filtered.filter(p => p.stock === 0);
        }

        setFilteredProducts(filtered);
    }, [searchQuery, stockFilter, products]);

    const openCreateModal = () => {
        setEditingProduct(null);
        setName('');
        setPrice('');
        setStock('');
        setMinStock('5');
        setSelectedCategory('');
        setProductModalVisible(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setName(product.name);
        setPrice(product.price.toString());
        setStock(product.stock.toString());
        setMinStock((product.minStockAlert || 5).toString());
        setSelectedCategory(product.category || '');
        setProductModalVisible(true);
    };

    const handleDelete = async (product: Product) => {
        if (confirm(`¿Estás seguro de que deseas eliminar "${product.name}"?`)) {
            try {
                await ProductService.deleteProduct(product.id!);
            } catch (error) {
                alert("Error eliminando producto");
            }
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || (!price && price !== '0')) return;
        setIsSaving(true);
        try {
            if (editingProduct) {
                await ProductService.updateProduct(editingProduct.id!, {
                    name,
                    price: parseFloat(price),
                    stock: parseInt(stock) || editingProduct.stock,
                    minStockAlert: parseInt(minStock),
                    category: selectedCategory || 'General'
                });
            } else {
                if (!stock) {
                    alert("Debes establecer un stock inicial.");
                    setIsSaving(false);
                    return;
                }
                await ProductService.addProduct({
                    name,
                    price: parseFloat(price),
                    stock: parseInt(stock),
                    minStockAlert: parseInt(minStock),
                    category: selectedCategory || 'General',
                    description: '',
                });
            }
            setProductModalVisible(false);
        } catch (error) {
            alert("Error al guardar el producto");
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
        } catch (error) {
            alert('Error actualizando stock');
        } finally {
            setIsSavingStock(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-500 font-medium tracking-wide">Cargando Inventario...</span>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
                <div>
                    <h1 className="text-[32px] font-black tracking-tight text-ui-text uppercase leading-none">Inventario</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="h-1 w-8 bg-accent-primary rounded-full" />
                        <p className="text-ui-text-muted/80 font-black uppercase tracking-[0.2em] text-[10px]">Catálogo y Existencias</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => alert("Categories screen not implemented yet")} 
                        className="ui-card hover:ui-card-hover border border-ui-border active:scale-95 transition-all duration-300 px-6 py-4 flex flex-col items-center justify-center min-w-[120px] group shadow-sm bg-ui-surface"
                    >
                        <LayoutGrid size={22} className="text-ui-text-muted group-hover:text-accent-primary transition-colors mb-1" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted group-hover:text-ui-text">Categorías</span>
                    </button>
                    
                    <button 
                        onClick={openCreateModal} 
                        className="ui-btn-primary hover:scale-[1.03] active:scale-95 transition-all duration-300 rounded-2xl px-6 py-4 flex flex-col items-center justify-center min-w-[150px]"
                    >
                        <Plus size={24} strokeWidth={3} className="mb-1" />
                        <span className="text-[11px] font-black uppercase tracking-widest mt-1">Nuevo Producto</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="relative flex-1">
                    <Input
                        placeholder="BUSCAR PRODUCTO..."
                        leftIcon={<Search size={20} className="text-accent-cyan" />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="ui-input-box p-1.5 flex shrink-0 gap-1.5">
                    <button
                        onClick={() => setStockFilter('all')}
                        className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${stockFilter === 'all' ? 'ui-active-pill scale-[1.05]' : 'text-ui-text-muted hover:text-ui-text hover:bg-black/5 dark:hover:bg-white/5 active:scale-95'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setStockFilter('low')}
                        className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${stockFilter === 'low' ? 'bg-orange-500 text-white shadow-[0_4px_12px_rgba(249,115,22,0.3)] scale-[1.05]' : 'text-[#FF8A00] hover:bg-orange-500/10 active:scale-95'}`}
                    >
                        <AlertCircle size={16} /> Bajo
                    </button>
                    <button
                        onClick={() => setStockFilter('out')}
                        className={`px-6 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${stockFilter === 'out' ? 'bg-[#FF3B30] text-white shadow-[0_4px_12px_rgba(255,59,48,0.3)] scale-[1.05]' : 'text-[#FF3B30] hover:bg-red-500/10 active:scale-95'}`}
                    >
                        <XCircle size={16} /> Faltan
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-ios-gray">
                        <PackageOpen className="mx-auto mb-4 opacity-20" size={56} />
                        <p className="text-lg font-medium opacity-50">No se encontraron productos.</p>
                    </div>
                ) : (
                    filteredProducts.map(item => {
                        const isLowStock = item.stock > 0 && item.stock <= (item.minStockAlert || 5);
                        const isOutOfStock = item.stock === 0;

                        return (
                            <Card key={item.id} className="ui-card ui-card-hover border-none m-0 shadow-sm overflow-hidden group">
                                <CardContent className="p-5 flex flex-col h-full relative">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-foreground pr-10">{item.name}</h3>
                                        <p className="text-2xl font-black text-ios-blue mt-1 mb-3">${item.price.toFixed(2)}</p>

                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-ios text-sm font-bold w-fit
                                ${isOutOfStock ? 'bg-ios-red/10 text-ios-red'
                                                : isLowStock ? 'bg-orange-500/10 text-orange-600'
                                                    : 'bg-ios-green/10 text-ios-green'}`}
                                        >
                                            <PackageOpen size={16} />
                                            <span>Stock: {item.stock} {isOutOfStock ? '(Agotado)' : isLowStock ? '(Bajo)' : ''}</span>
                                        </div>

                                        {item.category && (
                                            <div className="mt-3">
                                                <span className="inline-block px-2 py-1 bg-ios-gray/10 text-foreground/60 rounded-ios-sm text-xs font-semibold uppercase tracking-wider">
                                                    {item.category}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-5 pt-4 border-t border-ios-separator/10">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openStockModal(item)}
                                            className="text-xs liquid-glass border-0"
                                        >
                                            <ArrowRightLeft size={14} className="mr-1.5 text-ios-gray" />
                                            Ajustar Stock
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditModal(item)}
                                                className="p-2 text-ios-gray hover:text-ios-blue hover:bg-ios-blue/10 rounded-ios transition-colors"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item)}
                                                className="p-2 text-ios-gray hover:text-ios-red hover:bg-ios-red/10 rounded-ios transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>

            {/* Product Modal */}
            {productModalVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
                    <div className="ui-card w-full max-w-lg border border-ui-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8">
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
                                    <Input
                                        label="Precio (USD)"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        type="number"
                                        step="0.01"
                                        required
                                    />
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
                    <div className="ui-card w-full max-w-md border border-ui-border overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-8">
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
        </div>
    );
}

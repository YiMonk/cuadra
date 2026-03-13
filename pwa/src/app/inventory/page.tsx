"use client";

import React, { useEffect, useState } from 'react';
import { ProductService } from '@/services/product.service';
import { CategoryService } from '@/services/category.service';
import { Product } from '@/types/inventory';
import { Category } from '@/types/category';
import { Search, Plus, PackageOpen, AlertCircle, XCircle, Edit, Trash2, PackagePlus, ArrowRightLeft, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

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

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventario</h1>
                    <p className="text-foreground/60 font-medium tracking-wide">Catálogo de Productos y Existencias</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => alert("Categories screen not implemented yet")} variant="outline" className="gap-2 shadow-sm bg-ios-secondary-bg border-ios-separator/20">
                        <LayoutGrid size={18} />
                        <span className="hidden sm:inline">Categorías</span>
                    </Button>
                    <Button onClick={openCreateModal} className="gap-2 shadow-md">
                        <Plus size={18} />
                        Nuevo Producto
                    </Button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                        placeholder="Buscar producto..."
                        className="pl-12 h-14 text-base rounded-ios-lg shadow-sm border-ios-separator/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex bg-ios-gray/10 rounded-ios-lg p-1 shrink-0 h-14">
                    <button
                        onClick={() => setStockFilter('all')}
                        className={`flex-1 px-4 py-2 rounded-ios text-sm font-bold transition-all ${stockFilter === 'all' ? 'bg-ios-secondary-bg text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground/70'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setStockFilter('low')}
                        className={`flex-1 px-4 py-2 rounded-ios text-sm font-bold transition-all flex items-center justify-center gap-1 ${stockFilter === 'low' ? 'bg-ios-secondary-bg text-orange-500 shadow-sm' : 'text-foreground/50 hover:text-orange-500'}`}
                    >
                        <AlertCircle size={16} /> Bajo Stock
                    </button>
                    <button
                        onClick={() => setStockFilter('out')}
                        className={`flex-1 px-4 py-2 rounded-ios text-sm font-bold transition-all flex items-center justify-center gap-1 ${stockFilter === 'out' ? 'bg-ios-secondary-bg text-ios-red shadow-sm' : 'text-foreground/50 hover:text-ios-red'}`}
                    >
                        <XCircle size={16} /> Agotados
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
                            <Card key={item.id} className="overflow-hidden group hover:shadow-md transition-shadow">
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
                                            className="text-xs bg-ios-secondary-bg border-ios-separator/20 shadow-sm"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border-0 overflow-y-auto max-h-[90vh]">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold text-foreground mb-6">
                                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
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
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-foreground/70">Categoría</label>
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full bg-ios-secondary-bg border border-ios-separator/20 rounded-ios px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ios-blue shadow-sm text-foreground"
                                        >
                                            <option value="">Ninguna</option>
                                            {categories.filter(c => !c.parentId).map(c => (
                                                <option key={c.id} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
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

                                <div className="flex gap-3 pt-6">
                                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setProductModalVisible(false)} disabled={isSaving}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="flex-1" isLoading={isSaving}>
                                        {editingProduct ? 'Guardar Cambios' : 'Registrar'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {stockModalVisible && stockAdjustmentProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 border-0">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold text-foreground mb-2">Ajustar Stock</h2>
                            <p className="text-foreground/60 text-sm mb-6">
                                {stockAdjustmentProduct.name} (Actual: <span className="font-bold text-foreground">{stockAdjustmentProduct.stock}</span>)
                            </p>

                            <form onSubmit={handleAdjustStock} className="space-y-5">

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentReason('restock')}
                                        className={`flex-1 py-3 px-2 rounded-ios border flex flex-col items-center justify-center gap-1 transition-all
                                            ${adjustmentReason === 'restock' ? 'border-ios-blue bg-ios-blue/10 text-ios-blue font-bold' : 'border-ios-separator/10 text-ios-gray hover:bg-ios-gray/5'}
                                        `}
                                    >
                                        <PackagePlus size={20} />
                                        <span className="text-xs font-bold uppercase">Entrada</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentReason('waste')}
                                        className={`flex-1 py-3 px-2 rounded-ios border flex flex-col items-center justify-center gap-1 transition-all
                                            ${adjustmentReason === 'waste' ? 'border-ios-red bg-ios-red/10 text-ios-red font-bold' : 'border-ios-separator/10 text-ios-gray hover:bg-ios-gray/5'}
                                        `}
                                    >
                                        <Trash2 size={20} />
                                        <span className="text-xs font-bold uppercase">Merma</span>
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

                                <div className="flex gap-3 pt-4">
                                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setStockModalVisible(false)} disabled={isSavingStock}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className={`flex-1 ${adjustmentReason === 'waste' ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''}`} isLoading={isSavingStock}>
                                        Confirmar
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { CartItem } from '@/types/sales';
import { Product, ProductVariant } from '@/types/inventory';
import { Client } from '@/types/client';

interface CartContextData {
    items: CartItem[];
    total: number;
    selectedClient: Client | null;
    setSelectedClient: (client: Client | null) => void;
    addToCart: (product: Product, variant?: ProductVariant) => void;
    updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
    removeFromCart: (productId: string, variantId?: string) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Calculate total with useMemo to avoid stale state on rapid updates
    const total = useMemo(
        () => items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0),
        [items]
    );

    const addToCart = useCallback((product: Product, variant?: ProductVariant) => {
        setItems(prev => {
            const existingIndex = prev.findIndex(i =>
                i.id === product.id && i.variantId === variant?.id
            );

            const stockLimit = variant ? variant.stock : product.stock;

            if (existingIndex >= 0) {
                if (prev[existingIndex].quantity >= stockLimit) return prev;
                const newItems = [...prev];
                newItems[existingIndex] = {
                    ...newItems[existingIndex],
                    quantity: newItems[existingIndex].quantity + 1,
                };
                return newItems;
            }

            if (stockLimit <= 0) return prev;

            const finalPrice = product.price + (variant?.priceModifier || 0);

            const newItem: CartItem = {
                ...product,
                quantity: 1,
                variantId: variant?.id,
                variantName: variant?.name,
                stock: stockLimit,
                finalPrice,
            };

            return [...prev, newItem];
        });
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
        setItems(prev => {
            if (quantity <= 0) {
                return prev.filter(i => !(i.id === productId && i.variantId === variantId));
            }
            return prev.map(i => {
                if (i.id === productId && i.variantId === variantId) {
                    const bounded = Math.max(1, Math.min(quantity, i.stock));
                    return { ...i, quantity: bounded };
                }
                return i;
            });
        });
    }, []);

    const removeFromCart = useCallback((productId: string, variantId?: string) => {
        setItems(prev => prev.filter(i => !(i.id === productId && i.variantId === variantId)));
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
        setSelectedClient(null);
    }, []);

    const value = useMemo(() => ({
        items,
        total,
        selectedClient,
        setSelectedClient,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
    }), [items, total, selectedClient, addToCart, updateQuantity, removeFromCart, clearCart]);

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);

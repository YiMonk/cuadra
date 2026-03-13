"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    stock: number;
    quantity: number;
    variantId?: string;
    variantName?: string;
}

interface CartContextData {
    items: CartItem[];
    total: number;
    selectedClient: any | null;
    setSelectedClient: (client: any | null) => void;
    addToCart: (product: any, variant?: any) => void;
    updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
    removeFromCart: (productId: string, variantId?: string) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [total, setTotal] = useState(0);
    const [selectedClient, setSelectedClient] = useState<any | null>(null);

    useEffect(() => {
        const newTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setTotal(newTotal);
    }, [items]);

    const addToCart = (product: any, variant?: any) => {
        setItems(prev => {
            const existingIndex = prev.findIndex(i =>
                i.id === product.id && i.variantId === variant?.id
            );

            if (existingIndex >= 0) {
                const newItems = [...prev];
                newItems[existingIndex].quantity += 1;
                return newItems;
            }

            return [...prev, {
                ...product,
                quantity: 1,
                variantId: variant?.id,
                variantName: variant?.name
            }];
        });
    };

    const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
        setItems(prev => {
            if (quantity <= 0) {
                return prev.filter(i => !(i.id === productId && i.variantId === variantId));
            }
            return prev.map(i => {
                if (i.id === productId && i.variantId === variantId) {
                    return { ...i, quantity };
                }
                return i;
            });
        });
    };

    const removeFromCart = (productId: string, variantId?: string) => {
        setItems(prev => prev.filter(i => !(i.id === productId && i.variantId === variantId)));
    };

    const clearCart = () => {
        setItems([]);
        setSelectedClient(null);
    };

    return (
        <CartContext.Provider value={{
            items,
            total,
            selectedClient,
            setSelectedClient,
            addToCart,
            updateQuantity,
            removeFromCart,
            clearCart
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);

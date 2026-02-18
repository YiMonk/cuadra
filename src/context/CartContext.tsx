import React, { createContext, useState, useContext, useEffect } from 'react';
import { Product } from '../types/inventory';
import { CartItem } from '../types/sales';

import { Client } from '../types/client';

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
    selectedClient: Client | null;
    setSelectedClient: (client: Client | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // Default
    const [total, setTotal] = useState(0);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Todo: Connect this state to UI later

    // In a real implementation, we would call the engine here
    // For now, simple total

    useEffect(() => {
        // For now, simple total
        const newTotal = items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
        setTotal(newTotal);
    }, [items, paymentMethod]);

    const addToCart = (product: Product) => {
        setItems(currentItems => {
            const existing = currentItems.find(i => i.id === product.id);
            if (existing) {
                return currentItems.map(i =>
                    i.id === product.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }
            return [...currentItems, { ...product, quantity: 1, finalPrice: product.price }];
        });
    };

    const removeFromCart = (productId: string) => {
        setItems(items.filter(i => i.id !== productId));
    };

    const updateQuantity = (productId: string, qty: number) => {
        if (qty <= 0) {
            removeFromCart(productId);
            return;
        }
        setItems(items.map(i => i.id === productId ? { ...i, quantity: qty } : i));
    };

    const clearCart = () => {
        setItems([]);
        setSelectedClient(null);
    };

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            total,
            selectedClient,
            setSelectedClient
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within a CartProvider');
    return context;
};

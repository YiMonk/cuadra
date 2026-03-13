import React, { createContext, useState, useContext, useEffect } from 'react';
import { Product } from '../types/inventory';
import { CartItem } from '../types/sales';

import { Client } from '../types/client';

interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, variant?: any) => void;
    removeFromCart: (productId: string, variantId?: string) => void;
    updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
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

    useEffect(() => {
        // For now, simple total
        const newTotal = items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
        setTotal(newTotal);
    }, [items, paymentMethod]);

    const addToCart = (product: Product, variant?: any) => {
        setItems(currentItems => {
            const variantId = variant?.id;
            const existing = currentItems.find(i => i.id === product.id && i.variantId === variantId);

            if (existing) {
                return currentItems.map(i =>
                    (i.id === product.id && i.variantId === variantId)
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }

            return [...currentItems, {
                ...product,
                quantity: 1,
                finalPrice: product.price + (variant?.priceModifier || 0),
                variantId: variant?.id,
                variantName: variant?.name
            }];
        });
    };

    const removeFromCart = (productId: string, variantId?: string) => {
        setItems(items.filter(i => !(i.id === productId && i.variantId === variantId)));
    };

    const updateQuantity = (productId: string, qty: number, variantId?: string) => {
        if (qty <= 0) {
            removeFromCart(productId, variantId);
            return;
        }
        setItems(items.map(i =>
            (i.id === productId && i.variantId === variantId)
                ? { ...i, quantity: qty }
                : i
        ));
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

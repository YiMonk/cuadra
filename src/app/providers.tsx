"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { CartProvider } from "@/context/CartContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { UpdateDetector } from "@/components/common/UpdateDetector";

import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <CurrencyProvider>
                <AuthProvider>
                    <CartProvider>
                        {children}
                        <UpdateDetector />
                        <Toaster position="top-right" richColors closeButton />
                    </CartProvider>
                </AuthProvider>
            </CurrencyProvider>
        </ThemeProvider>
    );
}

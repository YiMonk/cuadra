"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';

type ThemeContextType = {
    isDarkTheme: boolean;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
    isDarkTheme: false,
    toggleTheme: () => { },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
            <ThemeContextWrapper>{children}</ThemeContextWrapper>
        </NextThemesProvider>
    );
};

const ThemeContextWrapper = ({ children }: { children: React.ReactNode }) => {
    const { theme, setTheme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDarkTheme = mounted ? (theme === 'dark' || (theme === 'system' && systemTheme === 'dark')) : false;

    const toggleTheme = () => {
        setTheme(isDarkTheme ? 'light' : 'dark');
    };

    return (
        <ThemeContext.Provider value={{ isDarkTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useAppTheme = () => useContext(ThemeContext);

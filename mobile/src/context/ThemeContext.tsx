import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { MD3LightTheme, MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
import { LightTheme, DarkTheme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
    isDarkTheme: boolean;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
    isDarkTheme: false,
    toggleTheme: () => { },
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [isDarkTheme, setIsDarkTheme] = useState(systemScheme === 'dark');
    const [isSystemDefault, setIsSystemDefault] = useState(true);

    useEffect(() => {
        loadThemePreference();
    }, []);

    useEffect(() => {
        if (isSystemDefault) {
            setIsDarkTheme(systemScheme === 'dark');
        }
    }, [systemScheme, isSystemDefault]);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('themePreference');
            if (savedTheme !== null) {
                setIsDarkTheme(savedTheme === 'dark');
                setIsSystemDefault(false);
            } else {
                setIsDarkTheme(systemScheme === 'dark');
                setIsSystemDefault(true);
            }
        } catch (e) {
            console.log('Failed to load theme preference');
        }
    };

    const toggleTheme = async () => {
        const newTheme = !isDarkTheme;
        setIsDarkTheme(newTheme);
        setIsSystemDefault(false);
        try {
            await AsyncStorage.setItem('themePreference', newTheme ? 'dark' : 'light');
        } catch (e) {
            console.log('Failed to save theme preference');
        }
    };

    const theme = isDarkTheme ? DarkTheme : LightTheme;

    return (
        <ThemeContext.Provider value={{ isDarkTheme, toggleTheme }}>
            <PaperProvider theme={theme}>
                {children}
            </PaperProvider>
        </ThemeContext.Provider>
    );
};

export const useAppTheme = () => useContext(ThemeContext);

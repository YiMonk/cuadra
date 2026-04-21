"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

type Currency = 'USD' | 'VES';

interface CurrencyContextType {
  currency: Currency;
  exchangeRate: number;
  isLoading: boolean;
  toggleCurrency: () => void;
  setCurrency: (currency: Currency) => void;
  formatPrice: (amount: number, forceCurrency?: Currency) => string;
  toUSD: (amount: number, fromCurrency?: Currency) => number;
  fromUSD: (amount: number, toCurrency?: Currency) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('app-currency') as Currency;
    if (savedCurrency) {
      setCurrencyState(savedCurrency);
    }
    fetchRate();
  }, []);

  const fetchRate = async () => {
    try {
      const response = await fetch('/api/bcv');
      const data = await response.json();
      if (data.rate && typeof data.rate === 'number') {
        console.log('BCV Exchange rate loaded:', data.rate);
        setExchangeRate(data.rate);
      } else {
        console.error('Invalid rate received:', data);
        setExchangeRate(480.50); // Hardcoded fallback if API fails
      }
    } catch (error) {
      console.error('Error fetching rate:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCurrency = useCallback(() => {
    setCurrencyState(prev => {
      const next = prev === 'USD' ? 'VES' : 'USD';
      localStorage.setItem('app-currency', next);
      toast.info(`Cambiado a ${next === 'USD' ? 'Dólares' : 'Bolívares'}`);
      return next;
    });
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('app-currency', c);
  };

  const formatPrice = useCallback((amount: number, forceCurrency?: Currency) => {
    const targetCurrency = forceCurrency || currency;
    
    if (targetCurrency === 'VES') {
      const rate = Number(exchangeRate) || 1;
      const vesAmount = amount * rate;
      return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(vesAmount).replace('VES', 'Bs.').trim();
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }, [currency, exchangeRate]);

  const toUSD = useCallback((amount: number, fromCurrency?: Currency) => {
    const sourceCurrency = fromCurrency || currency;
    if (sourceCurrency === 'VES') {
      return amount / exchangeRate;
    }
    return amount;
  }, [currency, exchangeRate]);

  const fromUSD = useCallback((amount: number, toCurrency?: Currency) => {
    const targetCurrency = toCurrency || currency;
    if (targetCurrency === 'VES') {
      return amount * exchangeRate;
    }
    return amount;
  }, [currency, exchangeRate]);

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      exchangeRate, 
      isLoading,
      toggleCurrency, 
      setCurrency,
      formatPrice,
      toUSD,
      fromUSD
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

"use client";

import { useState, useEffect } from 'react';
import { SalesService } from '@/services/sales.service';
import { Sale } from '@/types/sales';

interface NotificationsData {
  pendingClientsCount: number;
  pendingSalesCount: number;
  isLoading: boolean;
}

export function useNotifications(ownerId: string | null): NotificationsData {
  const [pendingClientsCount, setPendingClientsCount] = useState(0);
  const [pendingSalesCount, setPendingSalesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = SalesService.subscribeToPendingSales(ownerId, (sales: Sale[]) => {
      const clientIds = new Set(sales.map(s => s.clientId).filter(Boolean));
      setPendingClientsCount(clientIds.size);
      setPendingSalesCount(sales.length);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [ownerId]);

  return { pendingClientsCount, pendingSalesCount, isLoading };
}

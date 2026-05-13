import { useState, useEffect } from 'react';
import { SalesService } from '@/services/sales.service';
import { Sale } from '@/types/sales';

export function useSales(ownerId: string) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;
    const unsub = SalesService.subscribeToPendingSales(ownerId, (data) => {
      setSales(data);
      setIsLoading(false);
    });
    return unsub;
  }, [ownerId]);

  return { sales, isLoading };
}

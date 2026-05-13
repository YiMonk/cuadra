import { useState, useEffect } from 'react';
import { CashboxService } from '@/services/cashbox.service';
import { Cashbox } from '@/types/cashbox';

export function useCashboxes(ownerId: string) {
  const [cashboxes, setCashboxes] = useState<Cashbox[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;
    const unsub = CashboxService.subscribeToCashboxes(ownerId, (data) => {
      setCashboxes(data);
      setIsLoading(false);
    });
    return unsub;
  }, [ownerId]);

  return { cashboxes, isLoading };
}

import { useState, useEffect } from 'react';
import { CashClosingService } from '@/services/cashClosing.service';
import { CashClosing } from '@/types/cashClosing';

export function useClosings(ownerId: string) {
  const [closings, setClosings] = useState<(CashClosing & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;
    const unsub = CashClosingService.subscribeToClosings(ownerId, (data) => {
      setClosings(data);
      setIsLoading(false);
    });
    return unsub;
  }, [ownerId]);

  return { closings, isLoading };
}

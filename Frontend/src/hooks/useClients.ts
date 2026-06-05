import { useState, useEffect } from 'react';
import { ClientService } from '@/services/client.service';
import { Client } from '@/types/client';

export function useClients(ownerId: string) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;
    const unsub = ClientService.subscribeToClients(ownerId, (data) => {
      setClients(data);
      setIsLoading(false);
    });
    return unsub;
  }, [ownerId]);

  return { clients, isLoading };
}

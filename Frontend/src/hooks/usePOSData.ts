import { useState, useEffect } from 'react';
import { ProductService } from '@/services/product.service';
import { ClientService } from '@/services/client.service';
import { LocationService } from '@/services/location.service';
import { CashboxService } from '@/services/cashbox.service';
import { Product } from '@/types/inventory';
import { Client } from '@/types/client';

interface POSData {
  products: Product[];
  clients: Client[];
  locations: { id: string; name: string }[];
  cashboxes: { id: string; name: string }[];
  isLoading: boolean;
}

export function usePOSData(ownerId: string): POSData {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [cashboxes, setCashboxes] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;

    const unsubProducts = ProductService.subscribeToProducts(ownerId, (list) => {
      setProducts(list);
      setIsLoading(false);
    });
    const unsubClients = ClientService.subscribeToClients(ownerId, (list) => {
      setClients(list);
    });
    const unsubLocations = LocationService.subscribeToLocations(ownerId, (data) => {
      setLocations(data);
    });
    const unsubCashboxes = CashboxService.subscribeToCashboxes(ownerId, (data) => {
      setCashboxes(data);
    });

    return () => {
      unsubProducts();
      unsubClients();
      unsubLocations();
      unsubCashboxes();
    };
  }, [ownerId]);

  return { products, clients, locations, cashboxes, isLoading };
}

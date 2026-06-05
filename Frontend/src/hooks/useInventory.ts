import { useState, useEffect } from 'react';
import { ProductService } from '@/services/product.service';
import { Product } from '@/types/inventory';

export function useInventory(ownerId: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ownerId) return;
    const unsub = ProductService.subscribeToProducts(ownerId, (data) => {
      setProducts(data);
      setIsLoading(false);
    });
    return unsub;
  }, [ownerId]);

  return { products, isLoading };
}

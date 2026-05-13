import { useEffect, useState } from 'react';
import { Promotion, PriceList, Coupon } from '@/types/promotion';
import { PromotionService, PriceListService, CouponService } from '@/services/promotion.service';

export function usePromotions(ownerId: string) {
  const [items, setItems] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!ownerId) return;
    const unsub = PromotionService.subscribe(ownerId, (data) => {
      setItems(data);
      setIsLoading(false);
    });
    return unsub;
  }, [ownerId]);
  return { items, isLoading };
}

export function usePriceLists(ownerId: string) {
  const [items, setItems] = useState<PriceList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!ownerId) return;
    const unsub = PriceListService.subscribe(ownerId, (data) => {
      setItems(data);
      setIsLoading(false);
    });
    return unsub;
  }, [ownerId]);
  return { items, isLoading };
}

export function useCoupons(ownerId: string) {
  const [items, setItems] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!ownerId) return;
    const unsub = CouponService.subscribe(ownerId, (data) => {
      setItems(data);
      setIsLoading(false);
    });
    return unsub;
  }, [ownerId]);
  return { items, isLoading };
}

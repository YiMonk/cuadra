import { CartItem, PromoRule } from '../types/sales';

// Define hardcoded promos for now (as requested in docs example)
const PROMOS: PromoRule[] = [
  {
    id: 'promo_chips_cash',
    name: '2 Chips x $5 (Efectivo)',
    description: 'Lleva 2 Galletas Chips por $5 si pagas en efectivo',
    condition: (cart, paymentMethod) => {
      const chips = cart.find(i => i.name.toLowerCase().includes('chips'));
      return !!chips && chips.quantity >= 2 && paymentMethod === 'cash';
    },
    effect: (cart) => {
      return cart.map(item => {
        if (item.name.toLowerCase().includes('chips') && item.quantity >= 2) {
          // Logic: 2 for 5 -> 2.50 each
          return { ...item, finalPrice: 2.50, discountApplied: '2x$5' };
        }
        return item;
      });
    }
  }
];

export const usePromoEngine = (items: CartItem[], paymentMethod: string) => {
  let processedItems = [...items];
  
  // Basic reset prices first
  processedItems = processedItems.map(i => ({ ...i, finalPrice: i.price, discountApplied: undefined }));

  PROMOS.forEach(promo => {
    if (promo.condition(processedItems, paymentMethod)) {
      processedItems = promo.effect(processedItems);
    }
  });

  return processedItems;
};

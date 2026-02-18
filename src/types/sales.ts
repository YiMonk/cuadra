import { Product } from './inventory';

export interface CartItem extends Product {
  quantity: number;
  finalPrice: number; // Price after promos
  discountApplied?: string;
}

export interface PromoRule {
  id: string;
  name: string;
  condition: (cart: CartItem[], paymentMethod: string) => boolean;
  effect: (cart: CartItem[]) => CartItem[];
  description: string;
}

export interface Sale {
  id?: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'transfer' | 'mobile_pay' | 'credit';
  clientId?: string | null;
  clientName?: string | null;
  createdAt: number;
  paidAt?: number | null;
  status: 'paid' | 'pending' | 'cancelled';
  createdBy?: string | null;
  creatorName?: string | null;
  cancellationReason?: string;
  cancelledAt?: number;
  evidenceUrl?: string | null;
  paymentData?: {
    reference?: string;
    bank?: string;
    date?: string;
  };
  notes?: string;
  cashboxId?: string | null;
  cashboxName?: string | null;
}

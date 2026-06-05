import { Product } from './inventory';
import { AppliedPromotion } from './promotion';

export interface CartItem extends Product {
  quantity: number;
  variantId?: string;
  variantName?: string;
  finalPrice: number; // Price after promos
  discountApplied?: string;
}

export interface Sale {
  id?: string;
  ownerId?: string;
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
  locationId?: string | null;
  locationName?: string | null;
  exchangeRateAtSale?: number;
  originalTotal?: number;
  discountAmount?: number;
  discountReason?: string;
  hasReturns?: boolean;
  closedInClosingId?: string | null;
  commissionPct?: number;
  commissionAmount?: number;
  appliedPromotions?: AppliedPromotion[];
  promotionSavings?: number;
  couponCode?: string;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  variantId?: string;
  variantName?: string;
}

export interface Return {
  id?: string;
  saleId: string;
  ownerId: string;
  items: ReturnItem[];
  totalRefund: number;
  reason: string;
  createdAt: number;
  createdBy?: string | null;
  creatorName?: string | null;
}

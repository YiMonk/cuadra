export interface StockTransferItem {
  productId: string;
  productName: string;
  quantity: number;
}

export interface StockTransfer {
  id: string;
  ownerId: string;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  items: StockTransferItem[];
  notes?: string;
  createdAt: number;
  createdBy?: string | null;
  createdByName?: string | null;
}

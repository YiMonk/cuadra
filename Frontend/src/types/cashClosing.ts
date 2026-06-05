export interface CashClosing {
  id?: string;
  ownerId: string;
  closedAt: number;
  closedBy: string;
  closedByName: string;
  cashboxIds: string[];
  cashboxNames: string[];
  includesUnassigned: boolean;
  saleIds: string[];
  dateRange: {
    from: number;
    to: number;
  };
  totalSales: number;
  totalByMethod: {
    cash: number;
    transfer: number;
    mobile_pay: number;
    credit: number;
  };
  paidAmount: number;
  pendingAmount: number;
  salesCount: number;
  notes?: string;
  parentClosingId?: string;
  childClosingIds?: string[];
}

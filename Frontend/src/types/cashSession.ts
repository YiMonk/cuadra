export interface CashSession {
  id?: string;
  ownerId: string;
  cashierId: string;
  cashierName: string;
  cashboxId?: string | null;
  cashboxName?: string | null;

  // Session timing
  openedAt: number;
  closedAt?: number | null;
  status: 'open' | 'closed';

  // Sales in this session
  saleIds: string[]; // IDs of all sales during this session

  // Financial summary
  totalSales: number;
  totalByMethod: {
    cash: number;
    transfer: number;
    mobile_pay: number;
    credit: number;
  };

  // Credit tracking
  debtCollected: number; // Amount collected from credit sales in this session
  debtPendingAtOpen: number; // Pending at start of session
  debtPendingAtClose: number; // Pending at end of session

  // Returns
  totalReturns: number;
  returnIds?: string[];

  // Notes
  notes?: string;
  discrepancies?: string; // Any differences between expected and actual
}

export interface SessionReport extends CashSession {
  salesDetails?: {
    id: string;
    clientName?: string;
    total: number;
    method: string;
    createdAt: number;
  }[];
}

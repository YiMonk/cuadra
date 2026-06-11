export interface AuditLogEntry {
  id: string;
  company_id: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  payload_before: string | null;
  payload_after: string | null;
  ip: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  from_date?: string;
  to_date?: string;
  user_id?: string;
  entity_type?: string;
  before_id?: string;
  page_size?: number;
}

export interface AuditLogResponse {
  entries: AuditLogEntry[];
  next_cursor: string | null;
}

export type EntityType = 'sale' | 'user' | 'product' | 'stock_adjustment' | 'expense' | 'cash_closing' | 'payment';

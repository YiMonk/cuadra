import { api } from '@/lib/api';
import { AuditLogEntry, AuditLogFilters, AuditLogResponse } from '@/types/audit-log';

export const AuditLogService = {
  async getAuditLog(filters: AuditLogFilters): Promise<AuditLogResponse> {
    const params = new URLSearchParams();

    if (filters.from_date) params.append('from_date', filters.from_date);
    if (filters.to_date) params.append('to_date', filters.to_date);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.entity_type) params.append('entity_type', filters.entity_type);
    if (filters.before_id) params.append('before_id', filters.before_id);
    if (filters.page_size) params.append('page_size', filters.page_size.toString());

    const queryString = params.toString();
    const path = `/api/v1/audit-log${queryString ? `?${queryString}` : ''}`;

    return api.get<AuditLogResponse>(path);
  },
};

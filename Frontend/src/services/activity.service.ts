import { api } from '@/lib/api';
import { ActivityLog } from '../types/activity';

interface ApiActivity {
  id: string;
  owner_id: string;
  user_id?: string | null;
  user_name?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

function toActivity(a: ApiActivity): ActivityLog {
  return {
    id: a.id,
    action: a.action as ActivityLog['action'],
    adminId: a.user_id ?? '',
    adminName: a.user_name ?? '',
    details: a.metadata ? JSON.stringify(a.metadata) : '',
    targetUserId: a.entity_id ?? undefined,
    metadata: a.metadata ?? undefined,
    createdAt: new Date(a.created_at).getTime(),
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export const ActivityService = {
  // Activities are logged server-side by the backend — no client POST endpoint.
  async logAction(_log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<void> {},

  async getAllActivities(): Promise<ActivityLog[]> {
    try {
      const list = await api.get<ApiActivity[]>('/api/v1/activity');
      return list.map(toActivity);
    } catch {
      return [];
    }
  },

  async getUserHistory(userId: string): Promise<ActivityLog[]> {
    try {
      const list = await api.get<ApiActivity[]>(`/api/v1/activity?user_id=${userId}`);
      return list.map(toActivity);
    } catch {
      return [];
    }
  },

  subscribeToGlobalLog(callback: (logs: ActivityLog[]) => void): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiActivity[]>('/api/v1/activity');
        callback(list.map(toActivity));
      } catch { /* silent */ }
    });
  },
};

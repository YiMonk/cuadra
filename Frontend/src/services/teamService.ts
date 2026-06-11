import { api } from '@/lib/api';
import { UserService } from './user.service';

interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: string;
  owner_id: string | null;
  active: boolean;
  archived?: boolean;
  commission_pct?: number | null;
  default_location_id?: string | null;
  subscription_ends_at?: string | null;
}

function toUserMetadata(u: ApiUser) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.name,
    role: u.role,
    active: u.active,
    archived: u.archived ?? false,
    ownerId: u.owner_id ?? u.id,
    createdAt: Date.now(),
    commissionPct: u.commission_pct ?? undefined,
    defaultLocationId: u.default_location_id ?? undefined,
    subscriptionEndsAt: u.subscription_ends_at ? new Date(u.subscription_ends_at).getTime() : undefined,
  };
}

export const TeamService = {
  async archiveUser(userId: string) {
    const response = await api.post<ApiUser>(`/api/v1/users/team/${userId}/archive`);
    return toUserMetadata(response);
  },

  async unarchiveUser(userId: string) {
    const response = await api.post<ApiUser>(`/api/v1/users/team/${userId}/unarchive`);
    return toUserMetadata(response);
  },

  async getTeamMembers(includeArchived: boolean = false) {
    const params = new URLSearchParams();
    if (includeArchived) params.append('include_archived', 'true');
    const queryString = params.toString();
    const path = `/api/v1/users/team${queryString ? `?${queryString}` : ''}`;
    const users = await api.get<ApiUser[]>(path);
    return users.map(toUserMetadata);
  },
};

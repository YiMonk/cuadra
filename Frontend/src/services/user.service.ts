import { api } from '@/lib/api';
import type { Role } from '@/types/auth';

export interface UserMetadata {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  active: boolean;
  ownerId?: string;
  createdAt: number;
  updatedAt?: number;
  commissionPct?: number;
  defaultLocationId?: string;
  // legacy Firestore fields kept for backwards compat
  subscriptionEndsAt?: number;
  subscriptionPrice?: number;
  termsAccepted?: boolean;
  onboardingCompletedAt?: number;
  businessName?: string;
}

interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  owner_id: string | null;
  active: boolean;
  commission_pct?: number | null;
  default_location_id?: string | null;
}

function toUserMetadata(u: ApiUser): UserMetadata {
  return {
    id: u.id,
    email: u.email,
    displayName: u.name,
    role: u.role,
    active: u.active,
    ownerId: u.owner_id ?? u.id,
    createdAt: Date.now(),
    commissionPct: u.commission_pct ?? undefined,
    defaultLocationId: u.default_location_id ?? undefined,
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export const UserService = {
  async syncUserMetadata(_uid: string, data: Partial<UserMetadata>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (data.displayName !== undefined) body.name = data.displayName;
    if (data.commissionPct !== undefined) body.commission_pct = data.commissionPct;
    if (data.defaultLocationId !== undefined) body.default_location_id = data.defaultLocationId;
    if (data.termsAccepted !== undefined) body.terms_accepted = data.termsAccepted;
    if (data.onboardingCompletedAt !== undefined) {
      body.onboarding_completed_at = data.onboardingCompletedAt
        ? new Date(data.onboardingCompletedAt).toISOString()
        : null;
    }
    if (Object.keys(body).length > 0) await api.put('/api/v1/users/me', body);
  },

  async getUserById(uid: string): Promise<UserMetadata | null> {
    try {
      const team = await api.get<ApiUser[]>('/api/v1/users/team');
      const found = team.find(u => u.id === uid);
      return found ? toUserMetadata(found) : null;
    } catch {
      return null;
    }
  },

  async getUsers(): Promise<UserMetadata[]> {
    try {
      const team = await api.get<ApiUser[]>('/api/v1/users/team');
      return team.map(toUserMetadata);
    } catch {
      return [];
    }
  },

  // Legacy paginated helpers — simplified to single-page for REST
  async getUsersPaginated(options: { pageSize?: number } = {}): Promise<{
    users: UserMetadata[];
    lastDoc: null;
  }> {
    const users = await UserService.getUsers();
    const sliced = options.pageSize ? users.slice(0, options.pageSize) : users;
    return { users: sliced, lastDoc: null };
  },

  subscribeToUsers(callback: (users: UserMetadata[]) => void): () => void {
    return poll(async () => {
      try {
        callback(await UserService.getUsers());
      } catch { /* silent */ }
    });
  },

  async updateUser(uid: string, updates: Partial<UserMetadata>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (updates.displayName !== undefined) body.name = updates.displayName;
    if (updates.role !== undefined) body.role = updates.role;
    if (updates.active !== undefined) body.active = updates.active;
    if (updates.commissionPct !== undefined) body.commission_pct = updates.commissionPct;
    if (updates.defaultLocationId !== undefined) body.default_location_id = updates.defaultLocationId;
    if (updates.termsAccepted !== undefined) body.terms_accepted = updates.termsAccepted;
    await api.put<ApiUser>(`/api/v1/users/team/${uid}`, body);
  },

  async getTeamMembers(_ownerId: string): Promise<UserMetadata[]> {
    return UserService.getUsers();
  },

  async deleteUserMetadata(uid: string): Promise<void> {
    await api.delete(`/api/v1/users/team/${uid}`);
  },

  subscribeToTeam(_ownerId: string, callback: (members: UserMetadata[]) => void): () => void {
    return poll(async () => {
      try {
        callback(await UserService.getUsers());
      } catch { /* silent */ }
    });
  },
};

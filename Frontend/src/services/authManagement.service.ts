import { api } from '@/lib/api';
import { UserService, UserMetadata } from './user.service';

interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: string;
  owner_id: string | null;
  active: boolean;
}

export const AuthManagementService = {
  async createUser(params: {
    email: string;
    password: string;
    displayName: string;
    subscriptionDays: number;
    subscriptionPrice: number;
  }): Promise<string> {
    // In the REST backend, owner accounts are created via /auth/register.
    // This method is used by super-admins; we call the team invite endpoint
    // which the backend can be extended to support owner creation.
    const member = await api.post<ApiUser>('/api/v1/users/team/invite', {
      email: params.email.trim(),
      password: params.password,
      name: params.displayName,
      role: 'owner',
    });
    return member.id;
  },

  async deleteUser(uid: string): Promise<void> {
    await UserService.deleteUserMetadata(uid);
  },
};

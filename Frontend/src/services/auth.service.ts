import { api, ApiError } from '@/lib/api';
import { AuthTokens } from '@/lib/auth-tokens';
import type { Role } from '@/types/auth';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface UserOut {
  id: string;
  email: string;
  name: string;
  role: Role;
  owner_id: string | null;
  active: boolean;
  commission_pct?: number | null;
  default_location_id?: string | null;
}

interface FullAuthResponse extends AuthResponse {
  user: UserOut;
}

export const AuthService = {
  async signIn(email: string, password: string): Promise<{ uid: string }> {
    const res = await api.post<FullAuthResponse>('/api/v1/auth/login', {
      email: email.trim(),
      password,
    }, { skipAuth: true } as any);
    AuthTokens.set(res.access_token, res.refresh_token);
    return { uid: res.user.id };
  },

  async signOut(): Promise<void> {
    AuthTokens.clear();
  },

  async registerOwner(params: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<string> {
    const res = await api.post<FullAuthResponse>('/api/v1/auth/register', {
      email: params.email.trim(),
      password: params.password,
      name: params.displayName.trim(),
    }, { skipAuth: true } as any);
    AuthTokens.set(res.access_token, res.refresh_token);
    return res.user.id;
  },

  async createStaffMember(params: {
    email: string;
    password: string;
    displayName: string;
    ownerId: string;
    role?: Role;
    commissionPct?: number;
    defaultLocationId?: string;
  }): Promise<string> {
    const member = await api.post<UserOut>('/api/v1/users/team/invite', {
      email: params.email.trim(),
      password: params.password,
      name: params.displayName,
      role: params.role ?? 'cashier',
      commission_pct: params.commissionPct ?? null,
      default_location_id: params.defaultLocationId ?? null,
    });
    return member.id;
  },

  async updateCurrentUserProfile(_currentUser: unknown, displayName: string): Promise<void> {
    await api.put('/api/v1/users/me', { name: displayName });
  },

  async updateCurrentUserPassword(
    _currentUser: unknown,
    newPassword: string,
    currentPassword?: string
  ): Promise<void> {
    await api.post('/api/v1/users/me/change-password', {
      current_password: currentPassword ?? '',
      new_password: newPassword,
    });
  },

  async reauthenticateWithPassword(_currentUser: unknown, password: string): Promise<void> {
    // Verify credentials by attempting a silent login
    const { email } = await api.get<{ email: string }>('/api/v1/users/me');
    await api.post('/api/v1/auth/login', { email, password }, { skipAuth: true } as any);
  },

  // These flows are not supported without the Firebase-hosted email templates.
  // Kept as stubs so callers compile; implement if a /forgot-password endpoint is added.
  async sendPasswordReset(_email: string): Promise<void> {
    throw new ApiError(501, 'Recuperación de contraseña no implementada en esta versión');
  },
  async verifyPasswordResetCode(_oobCode: string): Promise<string> {
    throw new ApiError(501, 'No implementado');
  },
  async confirmPasswordReset(_oobCode: string, _newPassword: string): Promise<void> {
    throw new ApiError(501, 'No implementado');
  },
  async verifyBeforeUpdateEmail(_currentUser: unknown, _newEmail: string): Promise<void> {
    throw new ApiError(501, 'No implementado');
  },
};

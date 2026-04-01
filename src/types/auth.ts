export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admingod' | 'admin' | 'staff'; // For future role-based access
  ownerId?: string; // The ID of the primary user who owns this account/team
  createdAt: number;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

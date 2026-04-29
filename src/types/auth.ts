export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admingod' | 'admin' | 'owner' | 'staff'; // For future role-based access
  ownerId?: string;
  createdAt: number;
  subscriptionEndsAt?: number;
  termsAcceptedAt?: number; // Timestamp when user accepted terms
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

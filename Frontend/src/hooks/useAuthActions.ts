import { useAuth } from '@/context/AuthContext';

export function useAuthActions() {
  const { signOut, reloadUser } = useAuth();
  return { signOut, reloadUser };
}

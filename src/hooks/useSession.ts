import { useAuth } from '@/context/AuthContext';

export function useSession() {
  const { user, isLoading, isAuthenticated } = useAuth();
  return { user, isLoading, isAuthenticated };
}

import { useAuth } from '@/context/AuthContext';

export function useOwnerContext() {
  const { user } = useAuth();
  const ownerId = user?.ownerId ?? user?.uid ?? '';
  return { ownerId, user };
}

import { useAuth } from '@/context/AuthContext';

export function useRole() {
  const { user } = useAuth();
  const role = user?.role ?? null;
  return {
    role,
    isOwner: role === 'owner',
    isStaff: role === 'staff',
    isAdmin: role === 'admin',
    isAdminGod: role === 'admingod',
    isGlobalAdmin: role === 'admin' || role === 'admingod',
  };
}

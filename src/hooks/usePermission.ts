import { useAuth } from '@/context/AuthContext';
import { can, type Action } from '@/lib/permissions';

/**
 * Hook que evalúa permisos del usuario actual.
 *
 * Uso:
 *   const canDiscount = usePermission('applyDiscount');
 *   if (!canDiscount) return null;
 *
 * También puedes pasar varias acciones y obtener un objeto:
 *   const perms = usePermissions(['applyDiscount', 'cancelSale']);
 *   perms.applyDiscount === true
 */
export function usePermission(action: Action): boolean {
  const { user } = useAuth();
  return can(user?.role, action);
}

export function usePermissions<T extends Action>(actions: T[]): Record<T, boolean> {
  const { user } = useAuth();
  const result = {} as Record<T, boolean>;
  for (const a of actions) {
    result[a] = can(user?.role, a);
  }
  return result;
}

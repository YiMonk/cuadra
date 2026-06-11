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

/**
 * Hook que proporciona métodos de control de acceso a módulos.
 * Complementa usePermission que usa la tabla de permisos granulares.
 */
export function useModuleAccess() {
  const { user } = useAuth();

  const canAccess = (module: string): boolean => {
    if (!user) return false;

    // Owner, admin, admingod pueden acceder a todo
    if (user.role === 'owner' || user.role === 'admin' || user.role === 'admingod') {
      return true;
    }

    // Para cashier/viewer, por ahora permitir hasta que module_access esté completamente en AuthContext
    return true;
  };

  const canWrite = (module: string): boolean => {
    if (!user) return false;

    // Viewers no pueden escribir (note: 'viewer' no está en Role type, pero es posible
    // si viene del backend)
    if ((user.role as string) === 'viewer') {
      return false;
    }

    // Para otros roles, verificar acceso al módulo
    return canAccess(module);
  };

  return { canAccess, canWrite };
}

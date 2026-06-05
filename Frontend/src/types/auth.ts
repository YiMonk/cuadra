/**
 * Roles del sistema. Los 4 originales (admingod, admin, owner, staff) se mantienen
 * por compatibilidad. Los nuevos sub-roles son refinamientos de staff con permisos
 * más granulares definidos en lib/permissions.ts.
 */
export type Role =
  | 'admingod'   // SaaS super-admin
  | 'admin'      // SaaS admin (legado/dueño con permisos globales)
  | 'owner'      // Dueño del negocio
  | 'manager'    // Gerente — todo menos team management
  | 'supervisor' // Supervisor — ventas, anulación, descuentos
  | 'cashier'    // Cajero — vende y procesa pagos
  | 'seller'     // Vendedor — solo vende
  | 'staff';     // Genérico legado (= cashier)

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: Role;
  ownerId?: string;
  createdAt: number;
  subscriptionEndsAt?: number;
  termsAccepted?: boolean; // Whether user has accepted terms and conditions
  onboardingCompletedAt?: number; // epoch ms — null/undefined = no completado
  businessName?: string;
  commissionPct?: number; // 0..100 — porcentaje de comisión sobre el total
  defaultLocationId?: string; // si está seteado, el usuario opera por defecto en esta sucursal
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

import type { Role } from '@/types/auth';

/**
 * Acciones del sistema sobre las que se aplica permission gating.
 * Las acciones de negocio (vender, ver reportes, etc.) son las relevantes;
 * gestión global del SaaS (wipeDatabase, etc.) se hace por rol directo.
 */
export type Action =
  | 'sell'              // crear ventas en POS
  | 'applyDiscount'     // sobrescribir precio o aplicar descuento manual
  | 'cancelSale'        // anular venta
  | 'processPayment'    // cobrar venta pendiente
  | 'viewReports'       // acceder a /reports
  | 'viewCosts'         // ver costos y márgenes de productos
  | 'viewExpenses'      // ver/registrar gastos
  | 'manageInventory'   // crear/editar/eliminar productos
  | 'manageSuppliers'   // CRUD de proveedores
  | 'manageTeam'        // gestionar miembros del equipo
  | 'manageBusiness'    // sedes, cajas, configuración
  | 'openCloseSession'  // abrir/cerrar sesiones de caja
  | 'makeCashClosing';  // realizar cierre de caja

const ALL: Action[] = [
  'sell',
  'applyDiscount',
  'cancelSale',
  'processPayment',
  'viewReports',
  'viewCosts',
  'viewExpenses',
  'manageInventory',
  'manageSuppliers',
  'manageTeam',
  'manageBusiness',
  'openCloseSession',
  'makeCashClosing',
];

const PERMISSIONS: Record<Role, Action[]> = {
  admingod: ALL,
  admin: ALL,
  owner: ALL,
  manager: [
    'sell',
    'applyDiscount',
    'cancelSale',
    'processPayment',
    'viewReports',
    'viewCosts',
    'viewExpenses',
    'manageInventory',
    'manageSuppliers',
    'manageBusiness',
    'openCloseSession',
    'makeCashClosing',
  ],
  supervisor: [
    'sell',
    'applyDiscount',
    'cancelSale',
    'processPayment',
    'viewReports',
    'manageInventory',
    'openCloseSession',
    'makeCashClosing',
  ],
  cashier: ['sell', 'processPayment', 'openCloseSession'],
  seller: ['sell'],
  // legado: equivalente a cashier para no romper cuentas existentes
  staff: ['sell', 'processPayment', 'openCloseSession'],
};

export function can(role: Role | null | undefined, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.includes(action) ?? false;
}

/**
 * Etiquetas legibles para mostrar el rol en UI. Mantiene los nombres en
 * español para los sub-roles.
 */
export const ROLE_LABEL: Record<Role, string> = {
  admingod: 'Master',
  admin: 'Administrador',
  owner: 'Dueño',
  manager: 'Gerente',
  supervisor: 'Supervisor',
  cashier: 'Cajero',
  seller: 'Vendedor',
  staff: 'Personal',
};

/**
 * Roles asignables a miembros del equipo desde la UI (excluye los del SaaS).
 */
export const ASSIGNABLE_TEAM_ROLES: Role[] = ['manager', 'supervisor', 'cashier', 'seller'];

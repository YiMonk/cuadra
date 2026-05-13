export type ExpenseCategory =
  | 'alquiler'
  | 'servicios'
  | 'sueldos'
  | 'inventario'
  | 'marketing'
  | 'otros';

export interface Expense {
  id?: string;
  ownerId: string;
  amount: number; // USD
  category: ExpenseCategory;
  description: string;
  paidAt: number; // epoch ms — fecha del gasto
  createdAt: number;
  createdBy?: string | null;
  creatorName?: string | null;
  notes?: string;
}

export const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; emoji: string }[] = [
  { id: 'alquiler', label: 'Alquiler', emoji: '🏠' },
  { id: 'servicios', label: 'Servicios', emoji: '💡' },
  { id: 'sueldos', label: 'Sueldos', emoji: '👥' },
  { id: 'inventario', label: 'Inventario', emoji: '📦' },
  { id: 'marketing', label: 'Marketing', emoji: '📣' },
  { id: 'otros', label: 'Otros', emoji: '📌' },
];

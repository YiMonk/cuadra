export interface Supplier {
  id?: string;
  ownerId: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  active: boolean;
  balanceOwed?: number; // saldo pendiente con el proveedor (USD), opcional
  createdAt: number;
  updatedAt?: number;
}

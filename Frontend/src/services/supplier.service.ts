import { api } from '@/lib/api';
import { Supplier } from '@/types/supplier';

interface ApiSupplier {
  id: string;
  owner_id: string;
  name: string;
  contact?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  active?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

function toSupplier(s: ApiSupplier): Supplier {
  return {
    id: s.id,
    ownerId: s.owner_id,
    name: s.name,
    contactName: s.contact ?? undefined,
    phone: s.phone ?? undefined,
    email: s.email ?? undefined,
    notes: s.notes ?? undefined,
    active: s.active ?? true,
    createdAt: s.created_at ? new Date(s.created_at).getTime() : Date.now(),
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export const SupplierService = {
  async createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Promise<string> {
    const created = await api.post<ApiSupplier>('/api/v1/suppliers', {
      name: supplier.name,
      contact: supplier.contactName ?? null,
      phone: supplier.phone ?? null,
      email: supplier.email ?? null,
      notes: supplier.notes ?? null,
    });
    return created.id;
  },

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.contactName !== undefined) body.contact = updates.contactName;
    if (updates.phone !== undefined) body.phone = updates.phone;
    if (updates.email !== undefined) body.email = updates.email;
    if (updates.notes !== undefined) body.notes = updates.notes;
    await api.patch(`/api/v1/suppliers/${id}`, body);
  },

  async deleteSupplier(id: string): Promise<void> {
    await api.delete(`/api/v1/suppliers/${id}`);
  },

  async getSuppliers(_ownerId: string): Promise<Supplier[]> {
    const list = await api.get<ApiSupplier[]>('/api/v1/suppliers');
    return list.map(toSupplier);
  },

  subscribeToSuppliers(
    _ownerId: string,
    callback: (suppliers: Supplier[]) => void
  ): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiSupplier[]>('/api/v1/suppliers');
        callback(list.map(toSupplier));
      } catch { /* silent */ }
    });
  },
};

import { api } from '@/lib/api';
import { Client } from '../types/client';

interface ApiClient {
  id: string;
  owner_id: string;
  name: string;
  phone?: string | null;
  notes?: string | null;
  active: boolean;
  total_debt?: number;
  tags?: string[] | null;
  created_at: string;
  updated_at?: string | null;
}

function toClient(c: ApiClient): Client {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone ?? '',
    notes: c.notes ?? undefined,
    active: c.active,
    tags: c.tags ?? undefined,
    createdAt: new Date(c.created_at).getTime(),
    updatedAt: c.updated_at ? new Date(c.updated_at).getTime() : Date.now(),
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export const ClientService = {
  async addClient(
    client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>,
    _ownerId: string
  ): Promise<string> {
    const created = await api.post<ApiClient>('/api/v1/clients', {
      name: client.name,
      phone: client.phone ?? null,
      notes: client.notes ?? null,
      tags: client.tags ?? null,
    });
    return created.id;
  },

  async updateClient(id: string, updates: Partial<Client>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if (updates.phone !== undefined) body.phone = updates.phone;
    if (updates.notes !== undefined) body.notes = updates.notes;
    if (updates.active !== undefined) body.active = updates.active;
    if (updates.tags !== undefined) body.tags = updates.tags;
    await api.patch(`/api/v1/clients/${id}`, body);
  },

  async deleteClient(id: string): Promise<void> {
    await api.delete(`/api/v1/clients/${id}`);
  },

  async getClientById(id: string): Promise<Client | null> {
    try {
      const c = await api.get<ApiClient>(`/api/v1/clients/${id}`);
      return toClient(c);
    } catch {
      return null;
    }
  },

  subscribeToClients(
    _ownerId: string,
    callback: (clients: Client[]) => void
  ): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiClient[]>('/api/v1/clients');
        callback(list.map(toClient).filter(c => c.active !== false));
      } catch { /* silent */ }
    });
  },
};

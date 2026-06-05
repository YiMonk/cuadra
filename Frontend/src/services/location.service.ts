import { api } from '@/lib/api';
import { Location } from '../types/location';

export type { Location };

interface ApiLocation {
  id: string;
  owner_id: string;
  name: string;
  address?: string | null;
  active?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

function toLocation(l: ApiLocation): Location {
  return {
    id: l.id,
    name: l.name,
    active: l.active ?? true,
    ownerId: l.owner_id,
    createdAt: l.created_at ? new Date(l.created_at).getTime() : Date.now(),
    updatedAt: l.updated_at ? new Date(l.updated_at).getTime() : Date.now(),
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export const LocationService = {
  async addLocation(name: string, _ownerId: string): Promise<string> {
    const created = await api.post<ApiLocation>('/api/v1/locations', { name });
    return created.id;
  },

  async updateLocation(id: string, updates: Partial<Location>): Promise<boolean> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    if ((updates as any).address !== undefined) body.address = (updates as any).address;
    await api.patch(`/api/v1/locations/${id}`, body);
    return true;
  },

  async deleteLocation(id: string): Promise<boolean> {
    await api.delete(`/api/v1/locations/${id}`);
    return true;
  },

  async getLocations(_ownerId: string): Promise<Location[]> {
    const list = await api.get<ApiLocation[]>('/api/v1/locations');
    return list.map(toLocation);
  },

  subscribeToLocations(
    _ownerId: string,
    callback: (locations: Location[]) => void
  ): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiLocation[]>('/api/v1/locations');
        callback(list.map(toLocation));
      } catch { /* silent */ }
    });
  },
};

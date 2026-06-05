import { api } from '@/lib/api';
import { Category } from '../types/category';

interface ApiCategory {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  active?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

function toCategory(c: ApiCategory): Category {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? undefined,
    createdAt: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
    updatedAt: c.updated_at ? new Date(c.updated_at).getTime() : Date.now(),
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export const CategoryService = {
  async addCategory(
    category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>,
    _ownerId: string
  ): Promise<string> {
    const created = await api.post<ApiCategory>('/api/v1/categories', {
      name: category.name,
      description: (category as any).description ?? null,
    });
    return created.id;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (updates.name !== undefined) body.name = updates.name;
    await api.patch(`/api/v1/categories/${id}`, body);
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/api/v1/categories/${id}`);
  },

  subscribeToCategories(
    _ownerId: string,
    callback: (categories: Category[]) => void
  ): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiCategory[]>('/api/v1/categories');
        callback(list.map(toCategory));
      } catch { /* silent */ }
    });
  },

  async getCategories(_ownerId: string): Promise<Category[]> {
    const list = await api.get<ApiCategory[]>('/api/v1/categories');
    return list.map(toCategory);
  },
};

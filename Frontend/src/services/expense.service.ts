import { api } from '@/lib/api';
import { Expense } from '@/types/expense';

interface ApiExpense {
  id: string;
  owner_id: string;
  amount: number;
  category?: string | null;
  description: string;
  paid_at?: string | null;
  created_at: string;
  created_by?: string | null;
  notes?: string | null;
}

function toExpense(e: ApiExpense): Expense {
  return {
    id: e.id,
    ownerId: e.owner_id,
    amount: e.amount,
    category: (e.category ?? 'otros') as Expense['category'],
    description: e.description,
    paidAt: e.paid_at ? new Date(e.paid_at).getTime() : new Date(e.created_at).getTime(),
    createdAt: new Date(e.created_at).getTime(),
    createdBy: e.created_by ?? null,
    notes: e.notes ?? undefined,
  };
}

function poll(fn: () => void, ms = 8000): () => void {
  fn();
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

export const ExpenseService = {
  async createExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<string> {
    const created = await api.post<ApiExpense>('/api/v1/expenses', {
      amount: expense.amount,
      description: expense.description,
      category: expense.category ?? null,
      notes: expense.notes ?? null,
    });
    return created.id;
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
    const body: Record<string, unknown> = {};
    if (updates.amount !== undefined) body.amount = updates.amount;
    if (updates.description !== undefined) body.description = updates.description;
    if (updates.category !== undefined) body.category = updates.category;
    if (updates.notes !== undefined) body.notes = updates.notes;
    await api.patch(`/api/v1/expenses/${id}`, body);
  },

  async deleteExpense(id: string): Promise<void> {
    await api.delete(`/api/v1/expenses/${id}`);
  },

  async getExpenses(
    _ownerId: string,
    options: { startDate?: number; endDate?: number } = {}
  ): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (options.startDate) params.set('start_date', new Date(options.startDate).toISOString());
    if (options.endDate) params.set('end_date', new Date(options.endDate).toISOString());
    const qs = params.toString() ? `?${params}` : '';
    const list = await api.get<ApiExpense[]>(`/api/v1/expenses${qs}`);
    return list.map(toExpense);
  },

  subscribeToExpenses(_ownerId: string, callback: (expenses: Expense[]) => void): () => void {
    return poll(async () => {
      try {
        const list = await api.get<ApiExpense[]>('/api/v1/expenses');
        callback(list.map(toExpense));
      } catch { /* silent */ }
    });
  },
};

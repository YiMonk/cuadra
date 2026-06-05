export interface Client {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

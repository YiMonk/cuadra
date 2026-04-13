export interface Client {
  id: string;
  name: string;
  phone: string; // Used as ID often, but we'll use Firestore ID and keep this as field
  notes?: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

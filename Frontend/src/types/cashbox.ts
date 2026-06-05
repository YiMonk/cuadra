export interface Cashbox {
  id: string;
  name: string;
  ownerId?: string;
  active: boolean;
  createdAt: number;
  updatedAt?: number;
}

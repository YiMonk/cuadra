export interface Category {
    id: string;
    name: string;
    description?: string;
    parentId?: string; // For subcategories
    createdAt: number;
    updatedAt: number;
}

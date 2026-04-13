"use client";

import React, { useState, useEffect } from 'react';
import { CategoryService } from '@/services/category.service';
import { Category } from '@/types/category';
import { X, Plus, Trash2, Edit } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface CategoryModalProps {
    onClose: () => void;
}

export function CategoryModal({ onClose }: CategoryModalProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = CategoryService.subscribeToCategories(setCategories);
        return () => unsubscribe();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            if (editingId) {
                await CategoryService.updateCategory(editingId, { name: name.trim() });
                setEditingId(null);
            } else {
                await CategoryService.addCategory({ name: name.trim() });
            }
            setName('');
        } catch (error) {
            alert("Error al guardar categoría");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro? Esto no eliminará los productos, pero se quedarán sin categoría.")) {
            try {
                await CategoryService.deleteCategory(id);
            } catch (error) {
                alert("Error al eliminar categoría");
            }
        }
    };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        setName(cat.name);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="ui-card w-full max-w-md border border-ui-border flex flex-col max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8 pb-4">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-ui-text uppercase tracking-tight">Categorías</h2>
                        <button onClick={onClose} className="text-ui-text-muted hover:text-accent-danger transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSave} className="flex gap-2">
                        <Input 
                            placeholder="Nueva categoría..." 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 !mb-0"
                        />
                        <Button type="submit" disabled={isSaving || !name.trim()} className="h-14">
                            {editingId ? <Edit size={20} /> : <Plus size={20} />}
                        </Button>
                    </form>
                    {editingId && (
                        <button 
                            onClick={() => { setEditingId(null); setName(''); }} 
                            className="text-[10px] font-black uppercase text-accent-danger mt-1 tracking-widest"
                        >
                            Cancelar Edición
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
                    {categories.length === 0 ? (
                        <p className="text-center py-8 text-ui-text-muted font-bold uppercase text-xs">No hay categorías aun</p>
                    ) : (
                        <ul className="space-y-2">
                            {categories.map(cat => (
                                <li key={cat.id} className="flex items-center justify-between p-4 ui-input-box bg-white/50 dark:bg-white/5 group">
                                    <span className="font-bold text-ui-text uppercase text-sm tracking-wide">{cat.name}</span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEdit(cat)} className="p-2 text-ui-text-muted hover:text-accent-primary transition-colors">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(cat.id)} className="p-2 text-ui-text-muted hover:text-accent-danger transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="p-8 pt-4">
                    <Button variant="outline" className="w-full" onClick={onClose}>Cerrar</Button>
                </div>
            </div>
        </div>
    );
}

"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOwnerContext } from '@/hooks/useOwnerContext';
import { useCurrency } from '@/context/CurrencyContext';
import { ExpenseService } from '@/services/expense.service';
import { Expense, EXPENSE_CATEGORIES, ExpenseCategory } from '@/types/expense';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Plus, Trash2, X, Receipt, TrendingDown, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/usePermission';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function ExpensesPage() {
    const { user } = useAuth();
    const { ownerId } = useOwnerContext();
    const { formatPrice, toUSD, currency } = useCurrency();
    const canView = usePermission('viewExpenses');

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [period, setPeriod] = useState<'month' | 'week' | 'all'>('month');
    const [modalOpen, setModalOpen] = useState(false);

    // Form
    const [amount, setAmount] = useState('');
    const [amountCurrency, setAmountCurrency] = useState<'USD' | 'VES'>('USD');
    const [category, setCategory] = useState<ExpenseCategory>('servicios');
    const [description, setDescription] = useState('');
    const [paidAtStr, setPaidAtStr] = useState(todayStr());
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!ownerId) return;
        const unsub = ExpenseService.subscribeToExpenses(ownerId, setExpenses);
        return () => unsub();
    }, [ownerId]);

    const filtered = useMemo(() => {
        const now = Date.now();
        const cutoff =
            period === 'all' ? 0
            : period === 'week' ? now - 86400000 * 7
            : now - 86400000 * 30;
        return expenses.filter(e => e.paidAt >= cutoff);
    }, [expenses, period]);

    const totalsByCategory = useMemo(() => {
        const map = new Map<ExpenseCategory, number>();
        filtered.forEach(e => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
        return map;
    }, [filtered]);

    const totalAll = filtered.reduce((s, e) => s + e.amount, 0);

    const resetForm = () => {
        setAmount('');
        setAmountCurrency('USD');
        setCategory('servicios');
        setDescription('');
        setPaidAtStr(todayStr());
        setNotes('');
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !ownerId) return;
        const amountNum = parseFloat(amount);
        if (!amountNum || amountNum <= 0) {
            toast.error('Monto inválido');
            return;
        }
        if (!description.trim()) {
            toast.error('La descripción es obligatoria');
            return;
        }
        setIsSaving(true);
        try {
            const amountUSD = amountCurrency === 'VES' ? toUSD(amountNum, 'VES') : amountNum;
            await ExpenseService.createExpense({
                ownerId,
                amount: amountUSD,
                category,
                description: description.trim(),
                paidAt: new Date(paidAtStr).getTime(),
                createdBy: user.uid,
                creatorName: user.displayName || user.email || 'Usuario',
                notes: notes.trim() || undefined,
            });
            toast.success('Gasto registrado');
            setModalOpen(false);
            resetForm();
        } catch {
            toast.error('Error al registrar gasto');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (expense: Expense) => {
        if (!expense.id) return;
        toast.error(`¿Eliminar gasto de ${formatPrice(expense.amount)}?`, {
            action: {
                label: 'Eliminar',
                onClick: async () => {
                    try {
                        await ExpenseService.deleteExpense(expense.id!);
                        toast.success('Gasto eliminado');
                    } catch {
                        toast.error('Error al eliminar');
                    }
                },
            },
            cancel: { label: 'Cancelar', onClick: () => {} },
        });
    };

    if (user && !canView) {
        return (
            <div className="p-8 max-w-3xl mx-auto">
                <p className="text-sm text-ui-text-muted">No tienes permiso para ver esta sección.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-ui-text uppercase tracking-tight">
                        Gastos
                    </h1>
                    <p className="text-ui-text-muted text-sm mt-1 font-medium">
                        Registra los costos operativos de tu negocio
                    </p>
                </div>
                <Button
                    onClick={() => setModalOpen(true)}
                    className="bg-accent-primary hover:bg-accent-primary/90"
                    size="lg"
                >
                    <Plus size={18} />
                    Nuevo Gasto
                </Button>
            </div>

            {/* Period selector + total */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex gap-1.5">
                    {(['week', 'month', 'all'] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-colors ${
                                period === p
                                    ? 'bg-accent-primary text-white'
                                    : 'bg-ui-bg border border-ui-border text-ui-text-muted hover:border-accent-primary'
                            }`}
                        >
                            {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Todo'}
                        </button>
                    ))}
                </div>
                <div className="text-sm font-black uppercase tracking-tight">
                    <span className="text-ui-text-muted">Total: </span>
                    <span className="text-red-500">{formatPrice(totalAll)}</span>
                </div>
            </div>

            {/* Categories breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {EXPENSE_CATEGORIES.map(cat => {
                    const total = totalsByCategory.get(cat.id) ?? 0;
                    return (
                        <div
                            key={cat.id}
                            className="p-3 rounded-xl bg-ui-bg/60 border border-ui-border/50"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span>{cat.emoji}</span>
                                <span className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest">
                                    {cat.label}
                                </span>
                            </div>
                            <p className="text-sm font-black text-ui-text">{formatPrice(total)}</p>
                        </div>
                    );
                })}
            </div>

            {/* Expenses list */}
            {filtered.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                        <Receipt size={32} className="mx-auto mb-3 text-ui-text-muted opacity-30" />
                        <p className="text-sm text-ui-text-muted">No hay gastos en este período</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filtered.map(expense => {
                        const cat = EXPENSE_CATEGORIES.find(c => c.id === expense.category);
                        return (
                            <Card key={expense.id} className="border-ui-border/50">
                                <CardContent className="p-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="p-2 rounded-xl bg-red-500/10 text-red-500 flex-shrink-0">
                                            <TrendingDown size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-black text-ui-text truncate">
                                                    {expense.description}
                                                </span>
                                                <span className="text-[9px] font-black bg-accent-primary/15 text-accent-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                    {cat?.emoji} {cat?.label ?? expense.category}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-ui-text-muted flex items-center gap-2 mt-1">
                                                <Calendar size={10} />
                                                {new Date(expense.paidAt).toLocaleDateString('es-VE', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })}
                                                {expense.creatorName && <span> · {expense.creatorName}</span>}
                                            </div>
                                            {expense.notes && (
                                                <p className="text-[10px] text-ui-text-muted/80 mt-1 italic truncate">
                                                    {expense.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-base font-black text-red-500">
                                            {formatPrice(expense.amount)}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(expense)}
                                            className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                                            aria-label="Eliminar gasto"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal Nuevo Gasto */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="ui-card w-full max-w-md border border-ui-border shadow-2xl p-6 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">
                                Nuevo Gasto
                            </h2>
                            <button
                                onClick={() => { setModalOpen(false); resetForm(); }}
                                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-ui-text-muted"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <Input
                                label={`Monto (${amountCurrency})`}
                                type="number"
                                step="0.01"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                rightIcon={
                                    <button
                                        type="button"
                                        onClick={() => setAmountCurrency(amountCurrency === 'USD' ? 'VES' : 'USD')}
                                        className="px-2 py-1 bg-accent-primary/10 text-accent-primary rounded text-[10px] font-black uppercase tracking-widest hover:bg-accent-primary/20"
                                    >
                                        {amountCurrency}
                                    </button>
                                }
                            />

                            <div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted mb-2">Categoría</p>
                                <Select
                                    options={EXPENSE_CATEGORIES.map(c => ({ value: c.id, label: `${c.emoji} ${c.label}` }))}
                                    value={category}
                                    onChange={val => setCategory(val as ExpenseCategory)}
                                />
                            </div>

                            <Input
                                label="Descripción"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Ej: Pago de electricidad"
                                required
                            />

                            <Input
                                label="Fecha"
                                type="date"
                                value={paidAtStr}
                                onChange={e => setPaidAtStr(e.target.value)}
                                required
                            />

                            <div>
                                <label className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted block mb-2">
                                    Notas (opcional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Observaciones..."
                                    className="w-full bg-ui-bg border border-ui-border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:border-accent-primary text-ui-text placeholder:text-ui-text-muted/40 min-h-[60px]"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setModalOpen(false); resetForm(); }}
                                    className="flex-1 h-11 rounded-xl bg-black/5 dark:bg-white/5 font-black text-xs uppercase tracking-widest text-ui-text-muted"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 h-11 rounded-xl bg-accent-primary text-white font-black text-xs uppercase tracking-widest hover:bg-accent-primary/90 disabled:opacity-50"
                                >
                                    {isSaving ? 'Guardando...' : 'Registrar Gasto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

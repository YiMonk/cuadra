"use client";

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useOwnerContext } from '@/hooks/useOwnerContext';
import { usePermission } from '@/hooks/usePermission';
import { ProductService } from '@/services/product.service';
import { Product } from '@/types/inventory';
import { parseCsv } from '@/lib/csv';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Upload, FileText, ArrowLeft, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';

type FieldKey = 'name' | 'price' | 'costPrice' | 'stock' | 'category' | 'barcode' | 'unit' | 'description';

const REQUIRED: FieldKey[] = ['name', 'price'];
const FIELD_LABELS: Record<FieldKey, string> = {
    name: 'Nombre',
    price: 'Precio (USD)',
    costPrice: 'Costo (USD)',
    stock: 'Stock',
    category: 'Categoría',
    barcode: 'Código de barras',
    unit: 'Unidad',
    description: 'Descripción',
};

const TEMPLATE_CSV =
    'name,price,costPrice,stock,category,barcode,unit,description\n' +
    'Franela Básica,8.50,5.00,30,Ropa,7591234567890,unidad,\n' +
    'Pantalón Jean,18.00,12.00,15,Ropa,7591234567891,unidad,\n';

function inferMapping(headers: string[]): Partial<Record<FieldKey, number>> {
    const mapping: Partial<Record<FieldKey, number>> = {};
    headers.forEach((h, idx) => {
        const norm = h.trim().toLowerCase();
        if (!mapping.name && /(^name$|nombre|producto)/i.test(norm)) mapping.name = idx;
        if (!mapping.price && /(^price$|precio venta|precio$|^pvp)/i.test(norm)) mapping.price = idx;
        if (!mapping.costPrice && /(cost|costo)/i.test(norm)) mapping.costPrice = idx;
        if (!mapping.stock && /(stock|existencia|cantidad|inventario)/i.test(norm)) mapping.stock = idx;
        if (!mapping.category && /(categor)/i.test(norm)) mapping.category = idx;
        if (!mapping.barcode && /(barcode|codigo|código)/i.test(norm)) mapping.barcode = idx;
        if (!mapping.unit && /(unidad|unit)/i.test(norm)) mapping.unit = idx;
        if (!mapping.description && /(descrip)/i.test(norm)) mapping.description = idx;
    });
    return mapping;
}

interface PreviewRow {
    lineNumber: number;
    raw: string[];
    parsed: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
    errors: string[];
}

export default function ImportProductsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { ownerId } = useOwnerContext();
    const canManage = usePermission('manageInventory');

    const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'importing' | 'done'>('upload');
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<string[][]>([]);
    const [mapping, setMapping] = useState<Partial<Record<FieldKey, number>>>({});
    const [progress, setProgress] = useState({ done: 0, total: 0 });
    const [insertedCount, setInsertedCount] = useState(0);

    const handleFile = async (file: File) => {
        const text = await file.text();
        const parsed = parseCsv(text);
        if (parsed.length < 2) {
            toast.error('El archivo está vacío o no tiene filas válidas');
            return;
        }
        const [headerRow, ...dataRows] = parsed;
        setHeaders(headerRow);
        setRows(dataRows);
        setMapping(inferMapping(headerRow));
        setStep('map');
    };

    const previewRows = useMemo<PreviewRow[]>(() => {
        if (step !== 'preview' && step !== 'importing') return [];
        return rows.map((row, idx) => {
            const errors: string[] = [];
            const get = (key: FieldKey) => {
                const col = mapping[key];
                return col != null ? (row[col] ?? '').trim() : '';
            };
            const name = get('name');
            const priceStr = get('price');
            const costStr = get('costPrice');
            const stockStr = get('stock');
            const category = get('category');
            const barcode = get('barcode');
            const unit = get('unit');
            const description = get('description');

            const price = parseFloat(priceStr.replace(',', '.'));
            const cost = costStr ? parseFloat(costStr.replace(',', '.')) : NaN;
            const stock = stockStr ? parseInt(stockStr, 10) : 0;

            if (!name) errors.push('Falta nombre');
            if (!priceStr || !Number.isFinite(price) || price < 0) errors.push('Precio inválido');
            if (costStr && (!Number.isFinite(cost) || cost < 0)) errors.push('Costo inválido');
            if (stockStr && (!Number.isInteger(stock) || stock < 0)) errors.push('Stock inválido');

            const parsedProduct: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> = {
                name,
                price: Number.isFinite(price) ? price : 0,
                stock: Number.isFinite(stock) ? stock : 0,
                minStockAlert: 5,
                ...(category ? { category } : {}),
                ...(barcode ? { barcode } : {}),
                ...(unit ? { unit } : {}),
                ...(description ? { description } : {}),
                ...(Number.isFinite(cost) ? { costPrice: cost } : {}),
            };

            return {
                lineNumber: idx + 2, // +2 = header + 1-indexed
                raw: row,
                parsed: parsedProduct,
                errors,
            };
        });
    }, [rows, mapping, step]);

    const validRows = useMemo(() => previewRows.filter(r => r.errors.length === 0), [previewRows]);
    const invalidRows = useMemo(() => previewRows.filter(r => r.errors.length > 0), [previewRows]);

    const missingRequired = REQUIRED.filter(k => mapping[k] == null);

    const handleStartImport = async () => {
        if (!ownerId) return;
        if (validRows.length === 0) {
            toast.error('No hay filas válidas para importar');
            return;
        }
        setStep('importing');
        setProgress({ done: 0, total: validRows.length });
        try {
            const result = await ProductService.bulkAddProducts(
                validRows.map(r => r.parsed),
                ownerId,
                (done, total) => setProgress({ done, total })
            );
            setInsertedCount(result.inserted);
            setStep('done');
            toast.success(`${result.inserted} producto(s) importado(s)`);
        } catch {
            toast.error('Error al importar productos');
            setStep('preview');
        }
    };

    const downloadTemplate = () => {
        const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla-productos.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (user && !canManage) {
        return (
            <div className="p-8 max-w-3xl mx-auto">
                <p className="text-sm text-ui-text-muted">No tienes permiso para importar.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
            <div className="flex items-center gap-3">
                <Link
                    href="/inventory"
                    className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-ui-text-muted hover:text-ui-text"
                >
                    <ArrowLeft size={14} />
                    Volver a Inventario
                </Link>
            </div>

            <div>
                <h1 className="text-2xl md:text-3xl font-black text-ui-text uppercase tracking-tight">
                    Importar Productos
                </h1>
                <p className="text-ui-text-muted text-sm mt-1 font-medium">
                    Sube un archivo CSV con tus productos. Soporta hasta cientos de filas por importación.
                </p>
            </div>

            {/* Steps indicator */}
            <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest">
                {(['upload', 'map', 'preview', 'done'] as const).map((s, i) => (
                    <div
                        key={s}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-center transition-colors ${
                            step === s || (step === 'importing' && s === 'preview')
                                ? 'bg-accent-primary text-white'
                                : 'bg-ui-bg border border-ui-border text-ui-text-muted'
                        }`}
                    >
                        {i + 1}. {s === 'upload' ? 'Subir' : s === 'map' ? 'Mapear' : s === 'preview' ? 'Revisar' : 'Listo'}
                    </div>
                ))}
            </div>

            {step === 'upload' && (
                <Card>
                    <CardContent className="p-8 text-center space-y-4">
                        <Upload size={40} className="mx-auto text-accent-primary" />
                        <div>
                            <p className="text-sm font-black uppercase tracking-tight text-ui-text">
                                Selecciona un archivo CSV
                            </p>
                            <p className="text-xs text-ui-text-muted mt-1">
                                Encabezados sugeridos: name, price, costPrice, stock, category, barcode
                            </p>
                        </div>
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleFile(file);
                            }}
                            className="block w-full text-sm text-ui-text file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-accent-primary file:text-white file:font-black file:uppercase file:text-xs file:tracking-widest hover:file:bg-accent-primary/90 cursor-pointer"
                        />
                        <button
                            onClick={downloadTemplate}
                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-accent-primary hover:underline"
                        >
                            <Download size={14} />
                            Descargar plantilla
                        </button>
                    </CardContent>
                </Card>
            )}

            {step === 'map' && (
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-tight text-ui-text">
                            Mapea las columnas
                        </h2>
                        <p className="text-xs text-ui-text-muted">
                            Asigna cada campo de Cuadra a una columna de tu archivo. Detectamos automáticamente las que coinciden por nombre.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(Object.keys(FIELD_LABELS) as FieldKey[]).map(field => (
                                <div key={field}>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted mb-1 block">
                                        {FIELD_LABELS[field]}
                                        {REQUIRED.includes(field) && <span className="text-red-500"> *</span>}
                                    </label>
                                    <Select
                                        options={[
                                            { value: '-1', label: '— Sin asignar —' },
                                            ...headers.map((h, idx) => ({ value: String(idx), label: `${h} (col ${idx + 1})` })),
                                        ]}
                                        value={mapping[field] != null ? String(mapping[field]) : '-1'}
                                        onChange={val => {
                                            const idx = parseInt(val, 10);
                                            setMapping(prev => ({ ...prev, [field]: idx >= 0 ? idx : undefined }));
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        {missingRequired.length > 0 && (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 text-xs flex items-center gap-2">
                                <AlertCircle size={14} />
                                Faltan campos obligatorios: {missingRequired.map(f => FIELD_LABELS[f]).join(', ')}
                            </div>
                        )}

                        <div className="flex justify-between">
                            <Button variant="outline" onClick={() => setStep('upload')}>Atrás</Button>
                            <Button
                                onClick={() => setStep('preview')}
                                disabled={missingRequired.length > 0}
                                className="bg-accent-primary hover:bg-accent-primary/90"
                            >
                                Revisar →
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {(step === 'preview' || step === 'importing') && (
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <h2 className="text-sm font-black uppercase tracking-tight text-ui-text">
                                Vista previa ({validRows.length} válidas · {invalidRows.length} con errores)
                            </h2>
                            {step === 'preview' && (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setStep('map')}>Atrás</Button>
                                    <Button
                                        onClick={handleStartImport}
                                        disabled={validRows.length === 0}
                                        className="bg-accent-primary hover:bg-accent-primary/90"
                                    >
                                        Importar {validRows.length}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {step === 'importing' && (
                            <div className="p-4 bg-accent-primary/10 border border-accent-primary/30 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-black uppercase tracking-widest text-accent-primary">
                                        Importando...
                                    </span>
                                    <span className="text-xs font-black text-accent-primary">
                                        {progress.done} / {progress.total}
                                    </span>
                                </div>
                                <div className="h-2 bg-ui-bg rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent-primary transition-all"
                                        style={{ width: progress.total > 0 ? `${(progress.done / progress.total) * 100}%` : '0%' }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-96 overflow-y-auto border border-ui-border rounded-xl">
                            <table className="w-full text-xs">
                                <thead className="bg-ui-bg/60 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-2 text-left font-black uppercase tracking-widest text-[10px]">L.</th>
                                        <th className="px-2 py-2 text-left font-black uppercase tracking-widest text-[10px]">Nombre</th>
                                        <th className="px-2 py-2 text-right font-black uppercase tracking-widest text-[10px]">Precio</th>
                                        <th className="px-2 py-2 text-right font-black uppercase tracking-widest text-[10px]">Stock</th>
                                        <th className="px-2 py-2 text-left font-black uppercase tracking-widest text-[10px]">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewRows.slice(0, 100).map(r => (
                                        <tr key={r.lineNumber} className="border-t border-ui-border/50">
                                            <td className="px-2 py-1.5 text-ui-text-muted">{r.lineNumber}</td>
                                            <td className="px-2 py-1.5 font-bold text-ui-text">{r.parsed.name || '—'}</td>
                                            <td className="px-2 py-1.5 text-right">${r.parsed.price.toFixed(2)}</td>
                                            <td className="px-2 py-1.5 text-right">{r.parsed.stock}</td>
                                            <td className="px-2 py-1.5">
                                                {r.errors.length === 0 ? (
                                                    <span className="text-emerald-600 font-black uppercase tracking-widest text-[10px]">OK</span>
                                                ) : (
                                                    <span className="text-red-500 text-[10px]">{r.errors.join(', ')}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {previewRows.length > 100 && (
                                <p className="text-center text-[10px] text-ui-text-muted py-2">
                                    Mostrando primeras 100 de {previewRows.length} filas
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 'done' && (
                <Card>
                    <CardContent className="p-8 text-center space-y-4">
                        <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
                        <h2 className="text-lg font-black uppercase tracking-tight text-ui-text">
                            Importación completada
                        </h2>
                        <p className="text-sm text-ui-text-muted">
                            {insertedCount} producto(s) se agregaron a tu inventario.
                        </p>
                        <div className="flex justify-center gap-3">
                            <Button onClick={() => router.push('/inventory')}>Ir al Inventario</Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setStep('upload');
                                    setHeaders([]);
                                    setRows([]);
                                    setMapping({});
                                    setInsertedCount(0);
                                }}
                            >
                                Importar Otro Archivo
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

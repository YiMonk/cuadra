"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useOwnerContext } from '@/hooks/useOwnerContext';
import { UserService } from '@/services/user.service';
import { ProductService } from '@/services/product.service';
import { CategoryService } from '@/services/category.service';
import { LocationService } from '@/services/location.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Category } from '@/types/category';
import { Sparkles, Store, DollarSign, Package, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

type Currency = 'USD' | 'VES';

interface Props {
  onClose: () => void;
  /** Si true, no permite cerrar sin completar (usado en primer login). */
  forced?: boolean;
}

export function OnboardingWizard({ onClose, forced = false }: Props) {
  const { user, reloadUser } = useAuth();
  const { ownerId } = useOwnerContext();
  const { currency: globalCurrency, setCurrency, toUSD, fromUSD } = useCurrency();

  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState(user?.businessName || user?.displayName || '');
  const [currencyChoice, setCurrencyChoice] = useState<Currency>(globalCurrency as Currency);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCostPrice, setProductCostPrice] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productStock, setProductStock] = useState('0');
  const [productMinStock, setProductMinStock] = useState('5');
  const [productBarcode, setProductBarcode] = useState('');
  const [productPriceCurrency, setProductPriceCurrency] = useState<'USD' | 'VES'>('USD');
  const [productLocation, setProductLocation] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);

  const steps = ['welcome', 'business', 'currency', 'product', 'done'] as const;
  const current = steps[step];

  const canCloseEarly = !forced;

  useEffect(() => {
    if (current !== 'product' || !ownerId) return;
    CategoryService.getCategories(ownerId).then(setCategories).catch(() => {});
    LocationService.getLocations(ownerId).then(locs => {
      setLocations(locs);
      if (locs.length > 0) setProductLocation(locs[0].id);
    }).catch(() => {});
  }, [current, ownerId]);

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleFinish = async () => {
    if (!user) return;
    setIsFinishing(true);
    try {
      setCurrency(currencyChoice);
      await UserService.syncUserMetadata(user.uid, {
        onboardingCompletedAt: Date.now(),
        businessName: businessName.trim() || undefined,
      });

      // Crear primer producto si el usuario lo ingresó
      const priceNum = parseFloat(productPrice);
      const priceInUSD = productPriceCurrency === 'VES' ? toUSD(priceNum) : priceNum;
      const costRaw = productCostPrice.trim() === '' ? null : parseFloat(productCostPrice);
      const costInUSD = costRaw == null || Number.isNaN(costRaw)
        ? null
        : productPriceCurrency === 'VES' ? toUSD(costRaw) : costRaw;

      if (ownerId && productName.trim() && Number.isFinite(priceInUSD) && priceInUSD > 0) {
        await ProductService.addProduct(
          {
            name: productName.trim(),
            price: priceInUSD,
            ...(costInUSD != null ? { costPrice: costInUSD } : {}),
            stock: parseInt(productStock) || 0,
            minStockAlert: parseInt(productMinStock) || 5,
            category: productCategory || 'General',
            description: '',
            ...(productLocation ? { location: productLocation } : {}),
            ...(productBarcode.trim() ? { barcode: productBarcode.trim() } : {}),
          },
          ownerId
        );
      }
      await reloadUser();
      toast.success('¡Listo! Bienvenido a Cuadra.');
      onClose();
    } catch {
      toast.error('Error al guardar configuración');
    } finally {
      setIsFinishing(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    try {
      await UserService.syncUserMetadata(user.uid, {
        onboardingCompletedAt: Date.now(),
      });
      await reloadUser();
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="ui-card w-full max-w-lg border border-ui-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ui-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-accent-primary" />
            <span className="text-sm font-black uppercase tracking-tight text-ui-text">
              Bienvenido a Cuadra
            </span>
          </div>
          {canCloseEarly && current !== 'done' && (
            <button
              onClick={handleSkip}
              className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted hover:text-ui-text"
            >
              Saltar
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="px-6 py-2 flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-accent-primary' : 'bg-ui-border'
              }`}
            />
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          {current === 'welcome' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-2xl bg-accent-primary/10 flex items-center justify-center mx-auto">
                <Sparkles size={32} className="text-accent-primary" />
              </div>
              <h2 className="text-2xl font-black text-ui-text uppercase tracking-tight">
                Hola{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
              </h2>
              <p className="text-sm text-ui-text-muted">
                En 3 pasos rápidos vas a tener Cuadra lista para gestionar tu negocio.
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted/70">
                ~ 1 minuto
              </p>
            </div>
          )}

          {current === 'business' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
                  <Store size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">
                    Nombre del negocio
                  </h2>
                  <p className="text-xs text-ui-text-muted">Aparece en los comprobantes que envías</p>
                </div>
              </div>
              <Input
                label="Nombre"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="Ej: Tienda La Esquina"
              />
            </div>
          )}

          {current === 'currency' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
                  <DollarSign size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">
                    Moneda principal
                  </h2>
                  <p className="text-xs text-ui-text-muted">
                    Puedes cambiarla cuando quieras desde el header.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(['USD', 'VES'] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrencyChoice(c)}
                    className={`p-4 rounded-2xl border-2 font-black uppercase tracking-widest text-sm transition-all ${
                      currencyChoice === c
                        ? 'border-accent-primary bg-accent-primary/10 text-accent-primary'
                        : 'border-ui-border text-ui-text-muted hover:border-accent-primary/50'
                    }`}
                  >
                    {c === 'USD' ? '🇺🇸 Dólar (USD)' : '🇻🇪 Bolívar (VES)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {current === 'product' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent-primary/10 text-accent-primary flex items-center justify-center">
                  <Package size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">Tu primer producto</h2>
                  <p className="text-xs text-ui-text-muted">Opcional — puedes agregar más en Inventario.</p>
                </div>
              </div>

              <Input
                label="Nombre del producto"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="Ej: Pan canilla"
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={`Precio (${productPriceCurrency})`}
                  type="number"
                  step="0.01"
                  value={productPrice}
                  onChange={e => setProductPrice(e.target.value)}
                  placeholder="0.00"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => {
                        const val = parseFloat(productPrice) || 0;
                        if (productPriceCurrency === 'USD') {
                          setProductPriceCurrency('VES');
                          setProductPrice(fromUSD(val).toFixed(2));
                        } else {
                          setProductPriceCurrency('USD');
                          setProductPrice(toUSD(val).toFixed(2));
                        }
                      }}
                      className="px-2 py-1 bg-accent-primary/10 text-accent-primary rounded text-[10px] font-black uppercase tracking-widest hover:bg-accent-primary/20 transition-colors"
                    >
                      {productPriceCurrency}
                    </button>
                  }
                />
                <div className="space-y-1.5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted">Categoría</p>
                  <Select
                    options={[
                      { value: '', label: 'General' },
                      ...categories.map(c => ({ value: c.name, label: c.name })),
                    ]}
                    value={productCategory}
                    onChange={setProductCategory}
                  />
                </div>
              </div>

              <Input
                label={`Costo unitario (${productPriceCurrency}) — opcional`}
                type="number"
                step="0.01"
                value={productCostPrice}
                onChange={e => setProductCostPrice(e.target.value)}
                placeholder="0.00"
              />

              {productPrice && productCostPrice && parseFloat(productPrice) > 0 && (
                <p className="text-[10px] font-black uppercase tracking-widest text-ui-text-muted">
                  Margen:{' '}
                  <span className={parseFloat(productPrice) - parseFloat(productCostPrice) >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                    {(parseFloat(productPrice) - parseFloat(productCostPrice)).toFixed(2)} {productPriceCurrency}
                  </span>
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Stock inicial"
                  type="number"
                  value={productStock}
                  onChange={e => setProductStock(e.target.value)}
                  placeholder="0"
                />
                <Input
                  label="Alerta mínima"
                  type="number"
                  value={productMinStock}
                  onChange={e => setProductMinStock(e.target.value)}
                  placeholder="5"
                />
              </div>

              {locations.length > 1 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-ui-text-muted">Ubicación / Sede</p>
                  <Select
                    options={locations.map(l => ({ value: l.id, label: l.name }))}
                    value={productLocation}
                    onChange={setProductLocation}
                  />
                </div>
              )}

              <Input
                label="Código de barras (opcional)"
                value={productBarcode}
                onChange={e => setProductBarcode(e.target.value)}
                placeholder="Escribe el código..."
              />
            </div>
          )}

          {current === 'done' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-black text-ui-text uppercase tracking-tight">
                ¡Todo listo!
              </h2>
              <p className="text-sm text-ui-text-muted">
                Cuadra está configurada. Empieza registrando tu primera venta.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ui-border flex justify-between gap-3">
          <button
            onClick={prev}
            disabled={step === 0}
            className="px-5 h-11 rounded-xl bg-black/5 dark:bg-white/5 font-black text-xs uppercase tracking-widest text-ui-text-muted hover:text-ui-text disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Atrás
          </button>

          {current === 'done' ? (
            <Button
              onClick={handleFinish}
              disabled={isFinishing}
              className="bg-accent-primary hover:bg-accent-primary/90"
            >
              {isFinishing ? 'Guardando...' : 'Empezar a usar Cuadra'}
            </Button>
          ) : (
            <Button onClick={next} className="bg-accent-primary hover:bg-accent-primary/90">
              {current === 'welcome' ? 'Comenzar' : 'Siguiente'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

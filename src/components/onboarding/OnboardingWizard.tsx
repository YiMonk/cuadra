"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useOwnerContext } from '@/hooks/useOwnerContext';
import { UserService } from '@/services/user.service';
import { ProductService } from '@/services/product.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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
  const { currency: globalCurrency, setCurrency } = useCurrency();

  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState(user?.businessName || user?.displayName || '');
  const [currencyChoice, setCurrencyChoice] = useState<Currency>(globalCurrency as Currency);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [isFinishing, setIsFinishing] = useState(false);

  const steps = ['welcome', 'business', 'currency', 'product', 'done'] as const;
  const current = steps[step];

  const canCloseEarly = !forced;

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
      if (ownerId && productName.trim() && Number.isFinite(priceNum) && priceNum > 0) {
        await ProductService.addProduct(
          {
            name: productName.trim(),
            price: priceNum,
            stock: 0,
            minStockAlert: 5,
            category: 'General',
            description: '',
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
                  <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">
                    Tu primer producto
                  </h2>
                  <p className="text-xs text-ui-text-muted">
                    Opcional — puedes agregar más en Inventario.
                  </p>
                </div>
              </div>
              <Input
                label="Nombre del producto"
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="Ej: Pan canilla"
              />
              <Input
                label="Precio (USD)"
                type="number"
                step="0.01"
                value={productPrice}
                onChange={e => setProductPrice(e.target.value)}
                placeholder="0.00"
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

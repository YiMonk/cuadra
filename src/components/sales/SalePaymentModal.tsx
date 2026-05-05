"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useCurrency } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { Clock, CheckCircle2, X, Copy, MessageCircle, Camera, DollarSign, RotateCcw, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface SalePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
  clientPhone?: string;
  onCollect?: (updates: any) => Promise<void>;
  onReturn?: () => void;
}

export const SalePaymentModal: React.FC<SalePaymentModalProps> = ({
  isOpen,
  onClose,
  sale,
  clientPhone,
  onCollect,
  onReturn,
}) => {
  const { formatPrice, exchangeRate } = useCurrency();
  const { user } = useAuth();
  const [isPayingPending, setIsPayingPending] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'mobile_pay'>('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentBank, setPaymentBank] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  if (!isOpen || !sale) return null;

  const isPending = sale.status === 'pending';
  const isPaid = sale.status === 'paid';
  const isCancelled = sale.status === 'cancelled';

  const handleCopyList = () => {
    let text = `Cliente: ${sale.clientName || 'Consumidor Final'}\n`;
    text += `📋 Lista de productos:\n`;

    sale.items?.forEach((item: any) => {
      const qty = item.quantity || 0;
      const price = item.finalPrice || item.price || 0;
      const variantText = item.variantName ? ` (${item.variantName})` : '';
      const subtotal = price * qty;

      text += `• ${qty}x ${item.name}${variantText} — $${price.toFixed(2)} c/u = $${subtotal.toFixed(2)}\n`;
      if (item.discountApplied) {
        text += `  └─ Nota: ${item.discountApplied}\n`;
      }
    });

    text += `\nTotal: ${formatPrice(sale.total)}\n`;
    text += `Bs. ${(sale.total * exchangeRate).toLocaleString('es-VE')} (Tasa BCV: Bs. ${exchangeRate.toFixed(2)})\n`;
    text += `\nCuadra POS`;

    navigator.clipboard.writeText(text);
    toast.success('Lista copiada al portapapeles');
  };

  const handleWhatsApp = () => {
    if (!clientPhone) {
      toast.error('No hay número de teléfono disponible');
      return;
    }

    let text = `Hola *${sale.clientName || 'cliente'}*,\n\n`;
    text += `Te envío el detalle de tu compra:\n\n`;
    text += `📋 *Productos:*\n`;

    sale.items?.forEach((item: any) => {
      const qty = item.quantity || 0;
      const price = item.finalPrice || item.price || 0;
      const variantText = item.variantName ? ` (${item.variantName})` : '';
      const subtotal = price * qty;

      text += `• ${qty}x ${item.name}${variantText} — $${price.toFixed(2)} c/u = $${subtotal.toFixed(2)}\n`;
      if (item.discountApplied) {
        text += `  └─ _${item.discountApplied}_\n`;
      }
    });

    text += `\n*Total:* ${formatPrice(sale.total)}\n`;
    text += `_Bs. ${(sale.total * exchangeRate).toLocaleString('es-VE')} (Tasa BCV: Bs. ${exchangeRate.toFixed(2)})_\n`;
    text += `\nQuedamos atentos. ¡Muchas gracias!`;

    const whatsappUrl = `https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const allItems = sale.items || [];
      const itemLineHeight = 35;
      const detailHeight = allItems.length * itemLineHeight;
      const baseHeight = 500;
      const totalHeight = Math.max(600, baseHeight + detailHeight);

      const scale = 2;
      canvas.width = 400 * scale;
      canvas.height = totalHeight * scale;
      ctx.scale(scale, scale);

      const radius = 40;
      const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, w, h, r);
        } else {
          ctx.rect(x, y, w, h);
        }
      };

      drawRoundedRect(0, 0, 400, totalHeight, radius);
      ctx.clip();
      ctx.fillStyle = '#0D0B1F';
      ctx.fillRect(0, 0, 400, totalHeight);

      ctx.strokeStyle = '#7C3AED';
      ctx.lineWidth = 14;
      drawRoundedRect(7, 7, 386, totalHeight - 14, radius);
      ctx.stroke();

      ctx.fillStyle = '#7C3AED';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CUADRA', 200, 50);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('DETALLE DE VENTA:', 45, 90);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 18px Inter, sans-serif';
      ctx.fillText((sale.clientName || 'Consumidor Final').toUpperCase(), 45, 115);

      let currentY = 150;

      if (allItems.length > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = 'black 10px Inter, sans-serif';
        ctx.fillText('PRODUCTOS', 45, 145);

        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(45, 155);
        ctx.lineTo(355, 155);
        ctx.stroke();

        currentY = 180;
        allItems.forEach((item: any) => {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Inter, sans-serif';
          const nameText = `${item.quantity}x ${item.name.substring(0, 24)}`;
          ctx.fillText(nameText, 45, currentY);

          ctx.textAlign = 'right';
          ctx.fillText(formatPrice(item.finalPrice || item.price), 355, currentY);
          ctx.textAlign = 'left';

          if (item.discountApplied) {
            currentY += 15;
            ctx.fillStyle = '#C026D3';
            ctx.font = 'italic 10px Inter, sans-serif';
            ctx.fillText(`└─ ${item.discountApplied.substring(0, 30)}`, 55, currentY);
          }
          currentY += itemLineHeight;
        });
        currentY += 20;
      }

      const summaryY = Math.max(currentY, totalHeight - 150);
      ctx.strokeStyle = '#7C3AED';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(45, summaryY);
      ctx.lineTo(355, summaryY);
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px Inter, sans-serif';
      ctx.fillText(`Total: ${formatPrice(sale.total)}`, 45, summaryY + 45);

      const vesY = summaryY + 80;
      ctx.fillStyle = '#C026D3';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.fillText(`Bs. ${(sale.total * exchangeRate).toLocaleString('es-VE')}`, 45, vesY);

      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText(`TASA BCV: Bs. ${exchangeRate.toFixed(2)}`, 45, vesY + 20);

      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.textAlign = 'center';
      ctx.font = '900 10px Inter, sans-serif';
      ctx.fillText('cuadra.vercel.app', 200, totalHeight - 30);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], 'venta-cuadra.png', { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Detalle de Venta', text: `Detalle de compra de ${sale.clientName}` });
        } else {
          try {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            toast.success('Imagen copiada. Pégala en WhatsApp.');
          } catch (e) {
            toast.error('Error al compartir');
          }
        }
      }, 'image/png');

    } catch (error: any) {
      console.error(error);
      toast.error('Error al generar imagen');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!onCollect) return;
    if (!paymentMethod) {
      toast.error('Selecciona un método de pago');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const updates: any = {
        status: 'paid',
        paymentMethod,
        exchangeRateAtSale: exchangeRate,
      };

      if ((paymentMethod === 'transfer' || paymentMethod === 'mobile_pay') && (paymentReference || paymentBank || paymentDate)) {
        updates.paymentData = {
          ...(paymentReference && { reference: paymentReference }),
          ...(paymentBank && { bank: paymentBank }),
          ...(paymentDate && { date: paymentDate }),
        };
      }

      await onCollect(updates);
      toast.success('Venta cobrada exitosamente');
      setIsPayingPending(false);
      setPaymentMethod('cash');
      setPaymentReference('');
      setPaymentBank('');
      setPaymentDate('');
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al cobrar');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="ui-card w-full max-w-2xl border border-ui-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-ui-border flex items-start justify-between bg-ui-bg/50">
          <div className="flex items-start gap-4 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isPending ? 'bg-amber-500/10 text-amber-600' : isPaid ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
            }`}>
              {isPending ? <Clock size={20} /> : isPaid ? <CheckCircle2 size={20} /> : <X size={20} />}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-ui-text uppercase tracking-tight">
                {isPending ? 'Venta Fiada' : 'Detalle de Venta'}
              </h2>
              <p className="text-[9px] text-ui-text-muted font-bold uppercase tracking-[0.2em] mt-1">
                {new Date(sale.createdAt).toLocaleDateString()} • {new Date(sale.createdAt).toLocaleTimeString()} • {sale.creatorName || 'N/A'}
              </p>
              <div className="mt-2 inline-block">
                {isPending && <span className="text-[9px] font-black text-amber-600 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 uppercase tracking-wider">⏱ Pendiente</span>}
                {isPaid && <span className="text-[9px] font-black text-green-600 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 uppercase tracking-wider">✓ Pagado</span>}
                {isCancelled && <span className="text-[9px] font-black text-red-600 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 uppercase tracking-wider">✗ Cancelado</span>}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-ui-bg border border-ui-border flex items-center justify-center text-ui-text-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-all shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Client Name */}
          <div className="bg-ui-bg/50 p-4 rounded-lg border border-ui-border/50">
            <p className="text-[8px] font-black text-ui-text-muted uppercase tracking-widest mb-2">Cliente</p>
            <p className="text-lg font-black text-ui-text">{sale.clientName || 'Consumidor Final'}</p>
          </div>

          {/* Productos */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-ui-text-muted uppercase tracking-[0.2em]">Productos Comprados</h3>
            <div className="space-y-2">
              {sale.items?.map((item: any, idx: number) => {
                const hasSpecialPrice = item.finalPrice && item.price && item.finalPrice !== item.price;
                return (
                  <div key={idx} className="bg-ui-bg/50 p-4 rounded-lg border border-ui-border/50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-ui-text uppercase tracking-tight">{item.name}</p>
                        {item.variantName && (
                          <p className="text-[9px] text-ui-text-muted font-bold mt-1">Variante: {item.variantName}</p>
                        )}
                        {hasSpecialPrice && (
                          <div className="mt-2 inline-block bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">
                            <p className="text-[8px] font-black text-blue-600 uppercase tracking-wider">Precio Ajustado</p>
                            <p className="text-[9px] font-bold text-ui-text-muted line-through">${(item.price || 0).toFixed(2)}</p>
                            <p className="text-[9px] font-bold text-blue-600">${(item.finalPrice || 0).toFixed(2)}</p>
                          </div>
                        )}
                        {item.discountApplied && (
                          <div className="mt-2 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2 py-1 rounded inline-block">
                            <p className="text-[8px] font-bold text-fuchsia-600">{item.discountApplied}</p>
                          </div>
                        )}
                        <p className="text-[9px] text-ui-text-muted font-bold mt-2">
                          {item.quantity} × ${(item.finalPrice || item.price || 0).toFixed(2)} = ${((item.finalPrice || item.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-accent-primary">
                          ${((item.finalPrice || item.price || 0) * (item.quantity || 0)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-ui-text-muted uppercase tracking-[0.2em]">Notas</p>
              <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-lg">
                <p className="text-xs text-ui-text italic">{sale.notes}</p>
              </div>
            </div>
          )}

          {/* Discount Reason */}
          {sale.discountReason && (
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
              <p className="text-[8px] font-black text-amber-600 uppercase tracking-wider">Descuento</p>
              <p className="text-xs font-bold text-ui-text">{sale.discountReason}</p>
            </div>
          )}

          {/* Total */}
          <div className="space-y-2 bg-ui-bg/50 p-4 rounded-lg border border-ui-border/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-ui-text-muted uppercase tracking-widest">Total USD</span>
              <p className="text-2xl font-black text-accent-primary">{formatPrice(sale.total)}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-ui-text-muted uppercase tracking-widest">Total Bs.</span>
              <p className="text-xl font-black text-accent-secondary">{formatPrice(sale.total, 'VES')}</p>
            </div>
            <div className="text-[9px] font-bold text-ui-text-muted mt-2">
              Tasa BCV Actual: Bs. {exchangeRate.toFixed(2)}
              {sale.exchangeRateAtSale && sale.exchangeRateAtSale !== exchangeRate && (
                <div className="mt-1 text-[8px] text-amber-600">
                  Tasa al momento de la venta: Bs. {sale.exchangeRateAtSale.toFixed(2)}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons (Compartir) */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleCopyList}
              disabled={isProcessingPayment}
              className="py-3 px-2 bg-ui-bg border border-ui-border rounded-lg text-ui-text hover:bg-ui-bg/75 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex flex-col items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Copy size={16} />
              Copiar
            </button>
            {clientPhone && (
              <button
                onClick={handleWhatsApp}
                disabled={isProcessingPayment}
                className="py-3 px-2 bg-[#25D366] text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-[#20bd5a] flex flex-col items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <MessageCircle size={16} />
                WhatsApp
              </button>
            )}
            <button
              onClick={handleGenerateImage}
              disabled={isGeneratingImage || isProcessingPayment}
              className="py-3 px-2 bg-accent-primary/10 text-accent-primary border border-accent-primary/20 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 hover:bg-accent-primary/20 flex flex-col items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Camera size={16} />
              {isGeneratingImage ? '...' : 'Imagen'}
            </button>
          </div>

          {/* Payment Panel (only if pending and onCollect available) */}
          {isPending && onCollect && (
            <div className="space-y-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
              <button
                onClick={() => setIsPayingPending(!isPayingPending)}
                className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <DollarSign size={18} />
                {isPayingPending ? '◀ Cancelar Cobro' : '▶ Cobrar esta Venta'}
              </button>

              {isPayingPending && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-ui-text-muted uppercase tracking-widest">Método de Pago</p>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'cash', emoji: '💵', label: 'Efectivo' },
                        { id: 'transfer', emoji: '📲', label: 'Transfer' },
                        { id: 'mobile_pay', emoji: '📱', label: 'Pago Móvil' },
                      ] as const).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setPaymentMethod(opt.id)}
                          className={`py-2.5 px-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 border ${
                            paymentMethod === opt.id
                              ? 'border-green-600 bg-green-600/10 text-green-600'
                              : 'border-ui-border bg-ui-bg text-ui-text-muted hover:text-ui-text'
                          }`}
                        >
                          <div className="text-sm mb-1">{opt.emoji}</div>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(paymentMethod === 'transfer' || paymentMethod === 'mobile_pay') && (
                    <div className="space-y-3 pt-2">
                      <Input
                        label="Referencia (opcional)"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Ej: 12345678"
                        className="text-sm"
                      />
                      <Input
                        label="Banco (opcional)"
                        value={paymentBank}
                        onChange={(e) => setPaymentBank(e.target.value)}
                        placeholder="Ej: Banesco"
                        className="text-sm"
                      />
                      <Input
                        label="Fecha (opcional)"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessingPayment}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Zap size={18} />
                    {isProcessingPayment ? 'Cobrando...' : 'Confirmar Cobro'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isPaid && (
          <div className="p-4 border-t border-ui-border bg-ui-bg/50 space-y-2">
            {onReturn && (
              <button
                onClick={onReturn}
                className="w-full py-2.5 px-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Registrar Devolución
              </button>
            )}
            {sale.hasReturns && (
              <div className="py-2 px-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 dark:text-green-400 text-[9px] font-black uppercase tracking-widest text-center">
                ✓ Tiene devoluciones registradas
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale } from '@/types/sales';

const FISCAL_DISCLAIMER = 'DOCUMENTO INTERNO SIN VALOR FISCAL';

const methodLabel = (m: string): string => {
  switch (m) {
    case 'cash': return 'Efectivo';
    case 'transfer': return 'Transferencia';
    case 'mobile_pay': return 'Pago Móvil';
    case 'credit': return 'Crédito';
    default: return m;
  }
};

const statusLabel = (s: Sale['status']): string => {
  switch (s) {
    case 'paid': return 'Pagada';
    case 'pending': return 'Pendiente';
    case 'cancelled': return 'Cancelada';
    default: return s;
  }
};

export interface BusinessInfo {
  name?: string;
  phone?: string;
}

/**
 * Genera un PDF de comprobante interno para una venta. Marca cada página con la
 * leyenda fiscal para que no pueda usarse como factura fiscal.
 */
export function generateReceiptPdf(sale: Sale, business: BusinessInfo = {}): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(business.name || 'Comprobante de Venta', margin, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  if (business.phone) doc.text(business.phone, margin, 24);

  // ID & date
  doc.setFontSize(8);
  doc.setTextColor(110);
  const dateStr = new Date(sale.createdAt).toLocaleString('es-VE');
  doc.text(`Nº ${(sale.id || '').slice(0, 8)} · ${dateStr}`, margin, 30);

  // Client + meta
  doc.setTextColor(20);
  doc.setFontSize(9);
  let y = 38;
  if (sale.clientName) {
    doc.text(`Cliente: ${sale.clientName}`, margin, y);
    y += 5;
  }
  doc.text(`Método: ${methodLabel(sale.paymentMethod)}`, margin, y);
  doc.text(`Estado: ${statusLabel(sale.status)}`, pageWidth - margin, y, { align: 'right' });
  y += 4;

  // Items table
  const body = (sale.items || []).map(item => [
    `${item.name}${item.variantName ? ` (${item.variantName})` : ''}`,
    String(item.quantity),
    (item.finalPrice ?? item.price ?? 0).toFixed(2),
    ((item.finalPrice ?? item.price ?? 0) * item.quantity).toFixed(2),
  ]);

  autoTable(doc, {
    startY: y + 2,
    head: [['Producto', 'Cant.', 'Precio', 'Subtotal']],
    body,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: 30 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  const afterTableY =
    (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y + 30;

  // Totals
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Total:', pageWidth - margin - 35, afterTableY + 10);
  doc.text(`$ ${sale.total.toFixed(2)}`, pageWidth - margin, afterTableY + 10, { align: 'right' });

  if (sale.originalTotal && sale.discountAmount) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(
      `Original: $${sale.originalTotal.toFixed(2)}  ·  Descuento: $${sale.discountAmount.toFixed(2)}`,
      pageWidth - margin,
      afterTableY + 15,
      { align: 'right' }
    );
  }

  // Disclaimer (footer)
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(180, 40, 40);
  doc.text(FISCAL_DISCLAIMER, pageWidth / 2, footerY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(140);
  doc.text(
    'Generado por Cuadra — herramienta de gestión interna. No reemplaza factura fiscal.',
    pageWidth / 2,
    footerY + 4,
    { align: 'center' }
  );

  return doc;
}

/**
 * Construye un mensaje de WhatsApp listo para anteponer al envío del PDF.
 * El mensaje no contiene términos fiscales y aclara que el comprobante adjunto
 * es interno.
 */
export function buildWhatsAppMessage(sale: Sale, business: BusinessInfo = {}): string {
  const greeting = sale.clientName ? `Hola ${sale.clientName},` : 'Hola,';
  const body =
    `${greeting} aquí está el resumen de tu compra` +
    (business.name ? ` en ${business.name}` : '') +
    `:%0A%0A` +
    (sale.items || [])
      .map(i => `• ${i.quantity}× ${i.name}${i.variantName ? ` (${i.variantName})` : ''} — $${((i.finalPrice ?? i.price ?? 0) * i.quantity).toFixed(2)}`)
      .join('%0A') +
    `%0A%0ATotal: $${sale.total.toFixed(2)}` +
    `%0A%0A_Comprobante interno sin valor fiscal._`;
  return body;
}

/**
 * Construye la URL wa.me para abrir WhatsApp con mensaje pre-escrito.
 * Si no hay teléfono, retorna URL genérica para selección manual.
 */
export function buildWhatsAppUrl(phone: string | undefined | null, message: string): string {
  // Limpia el teléfono dejando solo dígitos (wa.me no acepta +).
  const cleaned = (phone || '').replace(/\D/g, '');
  return cleaned
    ? `https://wa.me/${cleaned}?text=${message}`
    : `https://wa.me/?text=${message}`;
}

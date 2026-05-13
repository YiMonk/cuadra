/**
 * dailyDigest — Resumen diario por email para owners.
 *
 * NO está exportado desde index.ts mientras el proyecto esté en plan Spark.
 * Para activar:
 *   1. Upgrade del proyecto a Blaze (https://console.firebase.google.com/project/cuadra-bf832/usage/details)
 *   2. Subir el secret:
 *        printf "TU_APP_PASSWORD" | firebase functions:secrets:set GMAIL_APP_PASSWORD --data-file -
 *   3. Descomentar el export en functions/src/index.ts
 *   4. Deploy:
 *        firebase deploy --only functions:dailyDigest
 *
 * Trigger: scheduled diariamente 08:00 America/Caracas (UTC-4).
 * Itera cada owner activo, computa digest con datos del día anterior y envía
 * un email vía Gmail SMTP (nodemailer).
 */
import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions/v2';
import * as nodemailer from 'nodemailer';

const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');
const GMAIL_USER = 'yimonk.shop@gmail.com';
const FROM_NAME = 'Cuadra';
const DAY_MS = 86400000;

// ---- Tipos mínimos (espejos de src/types) ----
interface UserDoc {
  id?: string;
  email?: string;
  displayName?: string;
  role?: 'admingod' | 'admin' | 'owner' | 'staff';
  active?: boolean;
  ownerId?: string;
  businessName?: string;
  subscriptionEndsAt?: number;
}

interface SaleDoc {
  id?: string;
  ownerId?: string;
  total: number;
  status: 'paid' | 'pending' | 'cancelled';
  createdAt: number;
  clientId?: string | null;
  clientName?: string | null;
  items?: Array<{ id: string; name: string; quantity: number; finalPrice?: number; price?: number }>;
}

interface ProductDoc {
  id?: string;
  name: string;
  stock?: number;
  minStockAlert?: number;
  active?: boolean;
  costPrice?: number;
}

interface DigestData {
  owner: UserDoc;
  yesterdayDate: Date;
  totalYesterday: number;
  countYesterday: number;
  totalDayBefore: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  pendingDebtTotal: number;
  pendingDebtOldCount: number;
  stockOutCount: number;
  stockLowCount: number;
  outStockNames: string[];
}

async function fetchOwnerDigest(owner: UserDoc, now: number): Promise<DigestData | null> {
  if (!owner.id) return null;
  const db = admin.firestore();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const todayStart = startOfToday.getTime();
  const yesterdayStart = todayStart - DAY_MS;
  const dayBeforeStart = todayStart - 2 * DAY_MS;

  const salesSnap = await db
    .collection('sales')
    .where('ownerId', '==', owner.id)
    .where('createdAt', '>=', dayBeforeStart)
    .get();

  let totalYesterday = 0;
  let countYesterday = 0;
  let totalDayBefore = 0;
  const productAgg = new Map<string, { name: string; quantity: number; revenue: number }>();

  salesSnap.forEach(doc => {
    const sale = doc.data() as SaleDoc;
    if (sale.status === 'cancelled') return;
    if (sale.createdAt >= yesterdayStart && sale.createdAt < todayStart) {
      totalYesterday += sale.total || 0;
      countYesterday += 1;
      for (const item of sale.items || []) {
        const entry = productAgg.get(item.id) ?? { name: item.name, quantity: 0, revenue: 0 };
        entry.quantity += item.quantity;
        entry.revenue += (item.finalPrice ?? item.price ?? 0) * item.quantity;
        productAgg.set(item.id, entry);
      }
    } else if (sale.createdAt >= dayBeforeStart && sale.createdAt < yesterdayStart) {
      totalDayBefore += sale.total || 0;
    }
  });

  // Deudas pendientes globales (no limitadas a ayer)
  const pendingSnap = await db
    .collection('sales')
    .where('ownerId', '==', owner.id)
    .where('status', '==', 'pending')
    .get();
  let pendingDebtTotal = 0;
  let pendingDebtOldCount = 0;
  pendingSnap.forEach(doc => {
    const sale = doc.data() as SaleDoc;
    pendingDebtTotal += sale.total || 0;
    if (now - sale.createdAt > 30 * DAY_MS) pendingDebtOldCount += 1;
  });

  // Stock
  const productsSnap = await db
    .collection('products')
    .where('ownerId', '==', owner.id)
    .get();
  let stockOutCount = 0;
  let stockLowCount = 0;
  const outStockNames: string[] = [];
  productsSnap.forEach(doc => {
    const p = doc.data() as ProductDoc;
    if (p.active === false) return;
    const stock = p.stock ?? 0;
    const min = p.minStockAlert ?? 5;
    if (stock <= 0) {
      stockOutCount += 1;
      if (outStockNames.length < 5) outStockNames.push(p.name);
    } else if (stock <= min) {
      stockLowCount += 1;
    }
  });

  const topProducts = Array.from(productAgg.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    owner,
    yesterdayDate: new Date(yesterdayStart),
    totalYesterday,
    countYesterday,
    totalDayBefore,
    topProducts,
    pendingDebtTotal,
    pendingDebtOldCount,
    stockOutCount,
    stockLowCount,
    outStockNames,
  };
}

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function deltaPct(current: number, previous: number): string {
  if (previous <= 0) return '—';
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(0)}%`;
}

function renderHtml(d: DigestData): string {
  const dateStr = d.yesterdayDate.toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const businessName = d.owner.businessName || d.owner.displayName || 'Tu negocio';
  const delta = deltaPct(d.totalYesterday, d.totalDayBefore);
  const deltaColor =
    d.totalDayBefore <= 0
      ? '#888'
      : d.totalYesterday >= d.totalDayBefore
      ? '#059669'
      : '#dc2626';

  const topRows = d.topProducts.length
    ? d.topProducts
        .map(
          (p, i) =>
            `<tr><td style="padding:6px 10px;color:#666">${i + 1}</td>` +
            `<td style="padding:6px 10px;font-weight:600">${escapeHtml(p.name)}</td>` +
            `<td style="padding:6px 10px;color:#666;text-align:right">${p.quantity} und.</td>` +
            `<td style="padding:6px 10px;text-align:right;font-weight:700">${fmt(p.revenue)}</td></tr>`
        )
        .join('')
    : '<tr><td colspan="4" style="padding:12px;color:#888;text-align:center">Sin ventas ayer</td></tr>';

  const alerts: string[] = [];
  if (d.stockOutCount > 0) {
    alerts.push(
      `🔴 ${d.stockOutCount} producto(s) sin stock` +
        (d.outStockNames.length
          ? ` <span style="color:#888">(${d.outStockNames.map(escapeHtml).join(', ')})</span>`
          : '')
    );
  }
  if (d.stockLowCount > 0) {
    alerts.push(`🟡 ${d.stockLowCount} producto(s) con stock bajo`);
  }
  if (d.pendingDebtOldCount > 0) {
    alerts.push(`🟡 ${d.pendingDebtOldCount} venta(s) con deuda > 30 días`);
  }
  const alertsHtml = alerts.length
    ? `<ul style="padding:0;margin:0;list-style:none">${alerts
        .map(a => `<li style="padding:6px 0;border-bottom:1px solid #eee">${a}</li>`)
        .join('')}</ul>`
    : '<p style="color:#888;margin:0">Sin alertas hoy ✅</p>';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Resumen diario Cuadra</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f5f5;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px">
        <tr><td style="background:#7c3aed;padding:20px 24px;color:#fff">
          <h1 style="margin:0;font-size:18px;font-weight:800;letter-spacing:.5px">CUADRA</h1>
          <p style="margin:4px 0 0;font-size:12px;opacity:.85">Resumen de ${escapeHtml(dateStr)}</p>
        </td></tr>

        <tr><td style="padding:24px">
          <h2 style="margin:0 0 4px;font-size:20px">Hola${
            d.owner.displayName ? `, ${escapeHtml(d.owner.displayName.split(' ')[0])}` : ''
          }</h2>
          <p style="margin:0 0 20px;color:#666;font-size:14px">Aquí está tu resumen de ${escapeHtml(businessName)}.</p>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px">
            <tr>
              <td style="padding:14px;background:#f9fafb;border-radius:8px;width:50%" valign="top">
                <p style="margin:0 0 4px;font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:700">Ventas ayer</p>
                <p style="margin:0;font-size:24px;font-weight:800;color:#111">${fmt(d.totalYesterday)}</p>
                <p style="margin:4px 0 0;font-size:11px;color:${deltaColor};font-weight:700">${delta} vs antier</p>
                <p style="margin:2px 0 0;font-size:11px;color:#888">${d.countYesterday} transacc.</p>
              </td>
              <td style="width:8px"></td>
              <td style="padding:14px;background:#fef3c7;border-radius:8px;width:50%" valign="top">
                <p style="margin:0 0 4px;font-size:10px;color:#92400e;text-transform:uppercase;letter-spacing:1px;font-weight:700">Por cobrar</p>
                <p style="margin:0;font-size:24px;font-weight:800;color:#92400e">${fmt(d.pendingDebtTotal)}</p>
                <p style="margin:4px 0 0;font-size:11px;color:#92400e">${d.pendingDebtOldCount} con &gt; 30 días</p>
              </td>
            </tr>
          </table>

          <h3 style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#666">Top productos ayer</h3>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;margin-bottom:20px">
            ${topRows}
          </table>

          <h3 style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#666">Alertas</h3>
          <div style="padding:12px;background:#f9fafb;border-radius:8px;font-size:13px">
            ${alertsHtml}
          </div>
        </td></tr>

        <tr><td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #eee;color:#888;font-size:11px;text-align:center">
          Recibes este correo porque tienes una cuenta activa en Cuadra.<br>
          Cuadra es una herramienta de gestión interna — los importes mostrados no constituyen documentos fiscales.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shouldSendTo(owner: UserDoc, now: number): boolean {
  if (!owner.email) return false;
  if (owner.active === false) return false;
  if (owner.role !== 'owner' && owner.role !== 'admin') return false;
  // Solo admins NO globales (admin global del SaaS no necesita digest comercial)
  if (owner.role === 'admin' && !owner.ownerId) {
    // admin sin ownerId = admin global del SaaS, no es dueño de negocio
    return false;
  }
  if (owner.subscriptionEndsAt && owner.subscriptionEndsAt < now) return false;
  return true;
}

export const dailyDigest = onSchedule(
  {
    schedule: '0 8 * * *',
    timeZone: 'America/Caracas',
    secrets: [GMAIL_APP_PASSWORD],
    region: 'us-central1',
  },
  async () => {
    const now = Date.now();
    const db = admin.firestore();

    // Solo owners (no staff, no admin global)
    const ownersSnap = await db.collection('users').where('role', 'in', ['owner', 'admin']).get();

    if (ownersSnap.empty) {
      logger.info('dailyDigest: no owners to send to');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD.value(),
      },
    });

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const doc of ownersSnap.docs) {
      const owner = { id: doc.id, ...(doc.data() as UserDoc) };
      if (!shouldSendTo(owner, now)) {
        skipped += 1;
        continue;
      }
      try {
        const digest = await fetchOwnerDigest(owner, now);
        if (!digest) {
          skipped += 1;
          continue;
        }
        // No enviar si el owner no tuvo absolutamente ninguna actividad ayer y
        // tampoco tiene alertas — evita spam a cuentas inactivas.
        if (
          digest.totalYesterday === 0 &&
          digest.pendingDebtTotal === 0 &&
          digest.stockOutCount === 0 &&
          digest.stockLowCount === 0
        ) {
          skipped += 1;
          continue;
        }
        const html = renderHtml(digest);
        await transporter.sendMail({
          from: `"${FROM_NAME}" <${GMAIL_USER}>`,
          to: owner.email,
          subject: `Resumen ${digest.yesterdayDate.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })} — ${owner.businessName || 'Cuadra'}`,
          html,
        });
        sent += 1;
      } catch (err) {
        failed += 1;
        logger.error(`Failed to send digest to ${owner.email}`, err);
      }
    }

    logger.info(`dailyDigest done: sent=${sent} skipped=${skipped} failed=${failed}`);
  }
);

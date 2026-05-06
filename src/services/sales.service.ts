import {
  collection,
  doc,
  updateDoc,
  runTransaction,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
  onSnapshot,
  writeBatch,
  limit,
  startAfter,
  QueryConstraint,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Sale } from '../types/sales';
import { ProductVariant } from '../types/inventory';

const SALES_COLLECTION = 'sales';
const PRODUCTS_COLLECTION = 'products';
const STOCK_MOVEMENTS_COLLECTION = 'stock_movements';

type InventoryUpdate = { ref: ReturnType<typeof doc>; data: Record<string, unknown> };
type MovementLog = { ref: ReturnType<typeof doc>; data: Record<string, unknown> };

export const SalesService = {
  createSale: async (sale: Omit<Sale, 'id' | 'createdAt' | 'status'>, creator?: { id: string; name: string }) => {
    if (!sale.items || sale.items.length === 0) {
      throw new Error('No hay productos en la venta');
    }
    try {
      await runTransaction(db, async (transaction) => {
        // 1. READS — collect all product refs first
        const productRefs = sale.items.map(item => doc(db, PRODUCTS_COLLECTION, item.id));
        const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        // 2. VALIDATE STOCK AND PREPARE UPDATES
        const inventoryUpdates: InventoryUpdate[] = [];
        const movementLogs: MovementLog[] = [];

        for (let i = 0; i < sale.items.length; i++) {
          const item = sale.items[i];
          const productDoc = productDocs[i];

          if (!productDoc.exists()) {
            throw new Error(`El producto "${item.name}" ya no existe en el inventario`);
          }

          const productData = productDoc.data();

          if (item.variantId) {
            // Handle variant stock
            const variants = (productData.variants || []) as ProductVariant[];
            const variantIdx = variants.findIndex(v => v.id === item.variantId);
            if (variantIdx === -1) {
              throw new Error(`Variante "${item.variantName}" no encontrada para "${item.name}"`);
            }
            const variantStock = variants[variantIdx].stock;
            if (variantStock < item.quantity) {
              throw new Error(
                `Stock insuficiente para variante "${item.variantName}" de "${item.name}". Disponible: ${variantStock}`
              );
            }
            const updatedVariants = variants.map((v, idx) =>
              idx === variantIdx ? { ...v, stock: v.stock - item.quantity } : v
            );
            inventoryUpdates.push({
              ref: productRefs[i],
              data: { variants: updatedVariants, updatedAt: Date.now() },
            });
          } else {
            // Handle root stock
            const currentStock = productData.stock || 0;
            if (currentStock < item.quantity) {
              throw new Error(
                `Stock insuficiente para "${item.name}". Disponible: ${currentStock}`
              );
            }
            inventoryUpdates.push({
              ref: productRefs[i],
              data: { stock: currentStock - item.quantity, updatedAt: Date.now() },
            });
          }

          // Log stock movement for traceability
          const movRef = doc(collection(db, STOCK_MOVEMENTS_COLLECTION));
          movementLogs.push({
            ref: movRef,
            data: {
              productId: item.id,
              productName: item.name,
              adjustment: -item.quantity,
              reason: 'sale',
              variantId: item.variantId || null,
              variantName: item.variantName || null,
              createdAt: Date.now(),
            },
          });
        }

        // 3. EXECUTE WRITES
        for (const update of inventoryUpdates) {
          transaction.update(update.ref as any, update.data as any);
        }
        for (const mov of movementLogs) {
          transaction.set(mov.ref as any, mov.data);
        }

        // Create sale document
        const newSaleRef = doc(collection(db, SALES_COLLECTION));
        const sanitizedItems = sale.items.map(item =>
          Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined))
        );
        const saleData = Object.fromEntries(
          Object.entries(sale).filter(([key, v]) => v !== undefined && key !== 'items')
        );
        const isPaid = sale.paymentMethod !== 'credit';

        transaction.set(newSaleRef, {
          ...saleData,
          items: sanitizedItems,
          createdAt: Date.now(),
          status: isPaid ? 'paid' : 'pending',
          createdBy: creator?.id || null,
          creatorName: creator?.name || null,
          cashboxId: isPaid ? (sale.cashboxId || null) : null,
          cashboxName: isPaid ? (sale.cashboxName || null) : null,
          paidAt: isPaid ? Date.now() : null,
        });
      });

      return true;
    } catch (error) {
      console.error('Error creating sale: ', error);
      throw error;
    }
  },

  getPendingSales: async (ownerId: string) => {
    try {
      const q = query(
        collection(db, SALES_COLLECTION),
        where('ownerId', '==', ownerId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
    } catch (error) {
      console.error('Error getting pending sales: ', error);
      return [];
    }
  },

  getDailySales: async (ownerId: string, startOfDay: number, endOfDay: number) => {
    try {
      const q = query(
        collection(db, SALES_COLLECTION),
        where('ownerId', '==', ownerId),
        where('createdAt', '>=', startOfDay),
        where('createdAt', '<=', endOfDay)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
    } catch (error) {
      console.error('Error getting daily sales: ', error);
      return [];
    }
  },

  // F2-05: use getDoc instead of getDocs + where(__name__)
  getSaleById: async (id: string): Promise<Sale | null> => {
    try {
      const docSnap = await getDoc(doc(db, SALES_COLLECTION, id));
      return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Sale) : null;
    } catch (error) {
      console.error('Error getting sale by ID: ', error);
      return null;
    }
  },

  getSalesByClient: async (clientId: string) => {
    try {
      const q = query(collection(db, SALES_COLLECTION), where('clientId', '==', clientId));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Sale))
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error getting sales for client: ', error);
      return [];
    }
  },

  getAllSales: async (options: {
    ownerId?: string;
    startDate?: number;
    endDate?: number;
    pageSize?: number;
  } | string = {}): Promise<Sale[]> => {
    const ownerId = typeof options === 'string' ? options : options.ownerId;
    const startDate = typeof options === 'object' ? options.startDate : undefined;
    const endDate = typeof options === 'object' ? options.endDate : undefined;
    const pageSize = typeof options === 'object' ? (options.pageSize ?? 500) : 500;

    try {
      const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(pageSize)];
      if (ownerId) constraints.unshift(where('ownerId', '==', ownerId));
      if (startDate !== undefined) constraints.push(where('createdAt', '>=', startDate));
      if (endDate !== undefined) constraints.push(where('createdAt', '<=', endDate));

      const snapshot = await getDocs(query(collection(db, SALES_COLLECTION), ...constraints));
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
    } catch (error) {
      console.error('Error getting all sales: ', error);
      return [];
    }
  },

  /**
   * F4-03 — getAllSalesPaginated
   * Versión con cursor para paginación real. Devuelve las ventas y el último
   * DocumentSnapshot para usarse como cursor en la siguiente llamada.
   */
  getAllSalesPaginated: async (options: {
    ownerId?: string;
    startDate?: number;
    endDate?: number;
    pageSize?: number;
    startAfterDoc?: DocumentSnapshot;
  } = {}): Promise<{ sales: Sale[]; lastDoc: DocumentSnapshot | null }> => {
    const { ownerId, startDate, endDate, pageSize = 50, startAfterDoc } = options;

    try {
      const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
      if (ownerId) constraints.push(where('ownerId', '==', ownerId));
      if (startDate !== undefined) constraints.push(where('createdAt', '>=', startDate));
      if (endDate !== undefined) constraints.push(where('createdAt', '<=', endDate));
      if (startAfterDoc) constraints.push(startAfter(startAfterDoc));
      constraints.push(limit(pageSize));

      const snapshot = await getDocs(query(collection(db, SALES_COLLECTION), ...constraints));
      const sales = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
      const lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;

      return { sales, lastDoc };
    } catch (error) {
      console.error('Error getting paginated sales:', error);
      return { sales: [], lastDoc: null };
    }
  },

  /**
   * F5-06 — getSalesSummary
   * Convenience method: fetches + computes metrics in one call.
   * Replaces the pattern of getAllSales() + computeSummary() in pages.
   */
  getSalesSummary: async (ownerId: string, startDate?: number, endDate?: number) => {
    const sales = await SalesService.getAllSales({ ownerId, startDate, endDate });
    return SalesService.computeSummary(sales);
  },

  updateSaleStatus: async (saleId: string, updates: Partial<Sale>) => {
    try {
      const docRef = doc(db, SALES_COLLECTION, saleId);
      const finalUpdates: Record<string, unknown> = { ...updates, updatedAt: Date.now() };
      if (updates.status === 'paid') {
        finalUpdates.paidAt = Date.now();
      }
      await updateDoc(docRef, finalUpdates);
      return true;
    } catch (error) {
      console.error('Error updating sale status: ', error);
      throw error;
    }
  },

  updateSale: async (saleId: string, updates: Partial<Sale>) => {
    try {
      const docRef = doc(db, SALES_COLLECTION, saleId);
      await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
      return true;
    } catch (error) {
      console.error('Error updating sale: ', error);
      throw error;
    }
  },

  // F2-03: use writeBatch for atomicity
  payAllDebts: async (clientId: string, updates: Partial<Sale>) => {
    try {
      const q = query(
        collection(db, SALES_COLLECTION),
        where('clientId', '==', clientId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      const now = Date.now();
      snapshot.docs.forEach(d => {
        batch.update(d.ref, { ...updates, status: 'paid', paidAt: now, updatedAt: now });
      });
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error paying all debts: ', error);
      throw error;
    }
  },

  // F2-03: use writeBatch for atomicity
  paySpecificDebts: async (saleIds: string[], updates: Partial<Sale>) => {
    try {
      const batch = writeBatch(db);
      const now = Date.now();
      saleIds.forEach(saleId => {
        batch.update(doc(db, SALES_COLLECTION, saleId), {
          ...updates,
          status: 'paid',
          paidAt: now,
          updatedAt: now,
        });
      });
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error paying specific debts: ', error);
      throw error;
    }
  },

  subscribeToPendingSales: (ownerId: string, callback: (sales: Sale[]) => void) => {
    const q = query(
      collection(db, SALES_COLLECTION),
      where('ownerId', '==', ownerId),
      where('status', '==', 'pending')
    );
    return onSnapshot(
      q,
      snapshot => {
        const sales = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Sale));
        callback(sales);
      },
      error => {
        console.error('Error en subscribeToPendingSales:', error);
      }
    );
  },

  cancelSale: async (saleId: string, reason: string) => {
    try {
      await runTransaction(db, async (transaction) => {
        const saleRef = doc(db, SALES_COLLECTION, saleId);
        const saleDoc = await transaction.get(saleRef);

        if (!saleDoc.exists()) throw new Error('La venta no existe');
        const saleData = saleDoc.data() as Sale;
        if (saleData.status === 'cancelled') throw new Error('La venta ya fue cancelada');

        // Read all products
        const productRefs = saleData.items.map(item => doc(db, PRODUCTS_COLLECTION, item.id));
        const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        // Prepare inventory restoration (including variant stock)
        const inventoryUpdates: InventoryUpdate[] = [];
        const movementLogs: MovementLog[] = [];

        for (let i = 0; i < saleData.items.length; i++) {
          const item = saleData.items[i];
          const productDoc = productDocs[i];

          if (!productDoc.exists()) continue;

          const productData = productDoc.data();

          if (item.variantId) {
            const variants = (productData.variants || []) as ProductVariant[];
            const variantIdx = variants.findIndex(v => v.id === item.variantId);
            if (variantIdx !== -1) {
              const updatedVariants = variants.map((v, idx) =>
                idx === variantIdx ? { ...v, stock: v.stock + item.quantity } : v
              );
              inventoryUpdates.push({
                ref: productRefs[i],
                data: { variants: updatedVariants, updatedAt: Date.now() },
              });
            }
          } else {
            const currentStock = productData.stock || 0;
            inventoryUpdates.push({
              ref: productRefs[i],
              data: { stock: currentStock + item.quantity, updatedAt: Date.now() },
            });
          }

          // Log restoration movement
          const movRef = doc(collection(db, STOCK_MOVEMENTS_COLLECTION));
          movementLogs.push({
            ref: movRef,
            data: {
              productId: item.id,
              productName: item.name,
              adjustment: item.quantity,
              reason: 'correction',
              notes: `Cancelación de venta ${saleId}`,
              variantId: item.variantId || null,
              createdAt: Date.now(),
            },
          });
        }

        for (const update of inventoryUpdates) {
          transaction.update(update.ref as any, update.data as any);
        }
        for (const mov of movementLogs) {
          transaction.set(mov.ref as any, mov.data);
        }

        transaction.update(saleRef, {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: Date.now(),
          updatedAt: Date.now(),
        });
      });
      return true;
    } catch (error) {
      console.error('Error cancelling sale: ', error);
      throw error;
    }
  },

  computeSummary: (sales: Sale[]) => {
    const revenue = sales.filter(s => s.status === 'paid').reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const pending = sales.filter(s => s.status === 'pending').reduce((sum, s) => sum + (Number(s.total) || 0), 0);
    const count = sales.filter(s => s.status !== 'cancelled').length;
    const average = count > 0 ? revenue / count : 0;

    const byPaymentMethod: Record<string, number> = {};
    sales.forEach(s => {
      if (s.status !== 'cancelled') {
        byPaymentMethod[s.paymentMethod] = (byPaymentMethod[s.paymentMethod] || 0) + (Number(s.total) || 0);
      }
    });

    const byCashbox: Record<string, { id: string; name: string; real: number; teorico: number; salesCount: number }> = {};
    sales.forEach(s => {
      if (s.status === 'cancelled') return;
      const cId = s.createdBy || 'unknown';
      const cName = s.creatorName || 'Desconocido';
      const amount = Number(s.total) || 0;
      if (!byCashbox[cId]) byCashbox[cId] = { id: cId, name: cName, real: 0, teorico: 0, salesCount: 0 };
      byCashbox[cId].teorico += amount;
      byCashbox[cId].salesCount += 1;
      if (s.status === 'paid') {
        const bId = s.cashboxId || 'sincaja';
        const bName = s.cashboxName || 'Sin Caja Asignada';
        if (!byCashbox[bId]) byCashbox[bId] = { id: bId, name: bName, real: 0, teorico: 0, salesCount: 0 };
        byCashbox[bId].real += amount;
      }
    });

    return {
      revenue,
      pending,
      count,
      average,
      byPaymentMethod,
      byCashbox: Object.values(byCashbox).sort((a, b) => b.real - a.real || b.teorico - a.teorico),
    };
  },

  getSalesWithoutCashbox: async (ownerId: string): Promise<Sale[]> => {
    try {
      const sales = await SalesService.getAllSales(ownerId);
      return sales.filter(s => !s.cashboxId && s.status !== 'cancelled' && !s.closedInClosingId);
    } catch (error) {
      console.error('Error getting sales without cashbox:', error);
      return [];
    }
  },

  updateMultipleSales: async (saleIds: string[], updates: Partial<Sale>) => {
    try {
      const updatePromises = saleIds.map((saleId) =>
        updateDoc(doc(db, SALES_COLLECTION, saleId), updates)
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating multiple sales:', error);
      throw error;
    }
  },
};

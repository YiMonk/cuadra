import {
  collection,
  doc,
  runTransaction,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  limit,
} from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { toServiceError } from '@/lib/errors';
import { StockTransfer, StockTransferItem } from '@/types/stockTransfer';
import { Product } from '@/types/inventory';
import { hasLocationStock } from '@/lib/stock';

const COLLECTION = 'stock_transfers';
const PRODUCTS = 'products';
const MOVEMENTS = 'stock_movements';

export const StockTransferService = {
  /**
   * Crea una transferencia atómica: deduce stock de origen, suma en destino,
   * registra movimientos. Falla completa si algún producto no tiene stock suficiente.
   */
  async create(params: {
    ownerId: string;
    fromLocationId: string;
    fromLocationName: string;
    toLocationId: string;
    toLocationName: string;
    items: StockTransferItem[];
    notes?: string;
    createdBy?: { id: string; name: string };
  }): Promise<string> {
    if (params.fromLocationId === params.toLocationId) {
      throw new Error('Origen y destino no pueden ser la misma sucursal');
    }
    if (!params.items || params.items.length === 0) {
      throw new Error('Selecciona al menos un producto a transferir');
    }
    try {
      let newTransferId = '';
      await runTransaction(db, async (tx) => {
        const productRefs = params.items.map(it => doc(db, PRODUCTS, it.productId));
        const productDocs = await Promise.all(productRefs.map(ref => tx.get(ref)));

        const updates: Array<{ ref: any; data: Partial<Product> }> = [];
        for (let i = 0; i < params.items.length; i++) {
          const item = params.items[i];
          const snap = productDocs[i];
          if (!snap.exists()) throw new Error(`El producto "${item.productName}" no existe`);
          const p = snap.data() as Product;
          const map = { ...(p.stockByLocation || {}) };
          // Si no había stockByLocation, migrar el stock legacy a la sucursal del producto (o origen)
          if (!hasLocationStock(p)) {
            const seedLocation = p.location || params.fromLocationId;
            map[seedLocation] = Number(p.stock) || 0;
          }
          const current = Number(map[params.fromLocationId]) || 0;
          if (current < item.quantity) {
            throw new Error(`Stock insuficiente en origen para "${item.productName}". Disponible: ${current}`);
          }
          map[params.fromLocationId] = current - item.quantity;
          map[params.toLocationId] = (Number(map[params.toLocationId]) || 0) + item.quantity;
          const newTotal = Object.values(map).reduce((s, v) => s + (Number(v) || 0), 0);
          updates.push({
            ref: productRefs[i],
            data: { stockByLocation: map, stock: newTotal, updatedAt: Date.now() },
          });
        }

        const transferRef = doc(collection(db, COLLECTION));
        newTransferId = transferRef.id;
        tx.set(transferRef, {
          ownerId: params.ownerId,
          fromLocationId: params.fromLocationId,
          fromLocationName: params.fromLocationName,
          toLocationId: params.toLocationId,
          toLocationName: params.toLocationName,
          items: params.items,
          notes: params.notes || null,
          createdAt: Date.now(),
          createdBy: params.createdBy?.id || null,
          createdByName: params.createdBy?.name || null,
        });

        for (const u of updates) {
          tx.update(u.ref, u.data);
        }

        // Movimientos: uno por producto y dirección
        for (const item of params.items) {
          const outRef = doc(collection(db, MOVEMENTS));
          tx.set(outRef, {
            productId: item.productId,
            productName: item.productName,
            adjustment: -item.quantity,
            reason: 'transfer_out',
            locationId: params.fromLocationId,
            transferId: transferRef.id,
            createdAt: Date.now(),
          });
          const inRef = doc(collection(db, MOVEMENTS));
          tx.set(inRef, {
            productId: item.productId,
            productName: item.productName,
            adjustment: item.quantity,
            reason: 'transfer_in',
            locationId: params.toLocationId,
            transferId: transferRef.id,
            createdAt: Date.now(),
          });
        }
      });
      return newTransferId;
    } catch (error) {
      throw toServiceError(error);
    }
  },

  async list(ownerId: string, max = 100): Promise<StockTransfer[]> {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('ownerId', '==', ownerId),
        orderBy('createdAt', 'desc'),
        limit(max),
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as StockTransfer));
    } catch (error) {
      console.error('Error listing transfers', error);
      return [];
    }
  },

  subscribe(ownerId: string, cb: (items: StockTransfer[]) => void, max = 100): () => void {
    const q = query(
      collection(db, COLLECTION),
      where('ownerId', '==', ownerId),
      orderBy('createdAt', 'desc'),
      limit(max),
    );
    return onSnapshot(q, snap => {
      cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as StockTransfer)));
    });
  },
};

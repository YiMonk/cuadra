import {
  collection,
  doc,
  getDoc,
  runTransaction,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { toServiceError } from '@/lib/errors';
import { Return, ReturnItem, Sale } from '../types/sales';
import { Product, ProductVariant } from '../types/inventory';

const RETURNS_COLLECTION = 'returns';
const SALES_COLLECTION = 'sales';
const PRODUCTS_COLLECTION = 'products';
const STOCK_MOVEMENTS_COLLECTION = 'stock_movements';

type InventoryUpdate = { ref: DocumentReference; data: Partial<Product> };
type MovementLog = { ref: DocumentReference; data: Record<string, unknown> };

export const ReturnService = {
  createReturn: async (
    saleId: string,
    returnItems: ReturnItem[],
    reason: string,
    creator?: { id: string; name: string }
  ) => {
    if (!returnItems || returnItems.length === 0) {
      throw new Error('No hay productos para devolver');
    }
    if (!reason || !reason.trim()) {
      throw new Error('Se requiere un motivo para la devolución');
    }

    try {
      await runTransaction(db, async (transaction) => {
        // 1. READ — Get the original sale
        const saleRef = doc(db, SALES_COLLECTION, saleId);
        const saleDoc = await transaction.get(saleRef);

        if (!saleDoc.exists()) {
          throw new Error('La venta no existe');
        }

        const saleData = saleDoc.data() as Sale;
        if (saleData.status !== 'paid') {
          throw new Error('Solo se pueden devolver ventas pagadas');
        }

        // 2. VALIDATE RETURN ITEMS
        const inventoryUpdates: InventoryUpdate[] = [];
        const movementLogs: MovementLog[] = [];
        let totalRefund = 0;

        // Get all product docs
        const productRefs = returnItems.map(item => doc(db, PRODUCTS_COLLECTION, item.productId));
        const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        for (let i = 0; i < returnItems.length; i++) {
          const returnItem = returnItems[i];
          const productDoc = productDocs[i];

          if (!productDoc.exists()) {
            throw new Error(`El producto "${returnItem.productName}" no existe`);
          }

          // Validate that the item exists in the original sale
          const originalItem = saleData.items.find(
            item => item.id === returnItem.productId && (!returnItem.variantId || item.variantId === returnItem.variantId)
          );

          if (!originalItem) {
            throw new Error(`"${returnItem.productName}" no está en esta venta`);
          }

          if (returnItem.quantity > originalItem.quantity) {
            throw new Error(`No puedes devolver ${returnItem.quantity} de "${returnItem.productName}" (vendidos: ${originalItem.quantity})`);
          }

          const productData = productDoc.data();
          totalRefund += returnItem.price * returnItem.quantity;

          // Restore stock
          if (returnItem.variantId) {
            const variants = (productData.variants || []) as ProductVariant[];
            const variantIdx = variants.findIndex(v => v.id === returnItem.variantId);
            if (variantIdx !== -1) {
              const updatedVariants = variants.map((v, idx) =>
                idx === variantIdx ? { ...v, stock: v.stock + returnItem.quantity } : v
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
              data: { stock: currentStock + returnItem.quantity, updatedAt: Date.now() },
            });
          }

          // Log stock movement
          const movRef = doc(collection(db, STOCK_MOVEMENTS_COLLECTION));
          const movData: Record<string, any> = {
            productId: returnItem.productId,
            productName: returnItem.productName,
            adjustment: returnItem.quantity,
            reason: 'return',
            notes: `Devolución de venta ${saleId}: ${reason}`,
            createdAt: Date.now(),
          };
          if (returnItem.variantId) movData.variantId = returnItem.variantId;
          if (returnItem.variantName) movData.variantName = returnItem.variantName;
          movementLogs.push({
            ref: movRef,
            data: movData,
          });
        }

        // 3. EXECUTE WRITES
        for (const update of inventoryUpdates) {
          transaction.update(update.ref, update.data);
        }
        for (const mov of movementLogs) {
          transaction.set(mov.ref, mov.data);
        }

        // Create return document
        const newReturnRef = doc(collection(db, RETURNS_COLLECTION));
        const cleanedItems = returnItems.map(item => {
          const cleaned: Record<string, any> = {
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
          };
          if (item.variantId) cleaned.variantId = item.variantId;
          if (item.variantName) cleaned.variantName = item.variantName;
          return cleaned;
        });

        const returnData: Record<string, any> = {
          saleId,
          items: cleanedItems,
          totalRefund,
          reason: reason.trim(),
          createdAt: Date.now(),
        };
        if (saleData.ownerId) returnData.ownerId = saleData.ownerId;
        if (creator?.id) returnData.createdBy = creator.id;
        if (creator?.name) returnData.creatorName = creator.name;
        transaction.set(newReturnRef, returnData);

        // Update sale to mark it has returns
        transaction.update(saleRef, {
          hasReturns: true,
          updatedAt: Date.now(),
        });
      });

      return true;
    } catch (error) {
      console.error('Error creating return:', error);
      throw toServiceError(error);
    }
  },

  getReturnsBySale: async (saleId: string): Promise<Return[]> => {
    try {
      const docRef = doc(db, SALES_COLLECTION, saleId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists() || !docSnap.data().hasReturns) {
        return [];
      }

      // Since we don't have a direct returns query, fetch from collection
      // In a real app, you'd add a subcollection or query by saleId
      return [];
    } catch (error) {
      console.error('Error getting returns for sale:', error);
      return [];
    }
  },
};

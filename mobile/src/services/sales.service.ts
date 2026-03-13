import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  runTransaction,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Sale, CartItem } from '../types/sales';

const SALES_COLLECTION = 'sales';
const PRODUCTS_COLLECTION = 'products';

export const SalesService = {
  // Create a new sale and update inventory in a transaction
  createSale: async (sale: Omit<Sale, 'id' | 'createdAt' | 'status'>, creator?: { id: string, name: string }) => {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. PREPARE READS: Get all product references first
        const productRefs = sale.items.map(item => doc(db, PRODUCTS_COLLECTION, item.id));
        const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        // 2. CHECK STOCK: Validate all items before writing anything
        const inventoryUpdates: { ref: any, newStock: number }[] = [];

        for (let i = 0; i < sale.items.length; i++) {
            const item = sale.items[i];
            const productDoc = productDocs[i];

            if (!productDoc.exists()) {
                throw new Error(`Product ${item.name} does not exist!`);
            }

            const currentStock = productDoc.data().stock;
            if (currentStock < item.quantity) {
                throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}`);
            }

            inventoryUpdates.push({
                ref: productRefs[i],
                newStock: currentStock - item.quantity
            });
        }

        // 3. EXECUTE WRITES: Perform all updates and creates
        
        // Update inventory
        for (const update of inventoryUpdates) {
            transaction.update(update.ref, { 
                stock: update.newStock,
                updatedAt: Date.now()
            });
        }

        // Create Sale Record
        const newSaleRef = doc(collection(db, SALES_COLLECTION));
        
        // Sanitize undefined fields for Firestore
        const saleData = Object.fromEntries(
          Object.entries(sale).filter(([_, v]) => v !== undefined)
        );

        const isPaid = sale.paymentMethod !== 'credit';
        
        transaction.set(newSaleRef, {
          ...saleData,
          createdAt: Date.now(),
          status: isPaid ? 'paid' : 'pending',
          createdBy: creator?.id || null,
          creatorName: creator?.name || null,
          // Only set cashbox if it was paid now
          cashboxId: isPaid ? (sale.cashboxId || null) : null,
          cashboxName: isPaid ? (sale.cashboxName || null) : null,
          paidAt: isPaid ? Date.now() : null,
        });
      });

      return true;
    } catch (error) {
      console.error("Error creating sale: ", error);
      throw error;
    }
  },

  // Get all sales with status 'pending'
  getPendingSales: async () => {
      try {
          const q = query(collection(db, SALES_COLLECTION), where('status', '==', 'pending'));
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      } catch (error) {
          console.error("Error getting pending sales: ", error);
          return [];
      }
  },

  // Get sales for a specific range (e.g., today)
  getDailySales: async (startOfDay: number, endOfDay: number) => {
      try {
          const q = query(
              collection(db, SALES_COLLECTION), 
              where('createdAt', '>=', startOfDay),
              where('createdAt', '<=', endOfDay)
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      } catch (error) {
          console.error("Error getting daily sales: ", error);
          return [];
      }
   },
   
   // Get a single sale by ID
   getSaleById: async (id: string) => {
       try {
           const docSnap = await getDocs(query(collection(db, SALES_COLLECTION), where('__name__', '==', id)));
           if (!docSnap.empty) {
               const doc = docSnap.docs[0];
               return { id: doc.id, ...doc.data() } as Sale;
           }
           return null;
       } catch (error) {
           console.error("Error getting sale by ID: ", error);
           return null;
       }
   },

    // Get all sales for a specific client
    getSalesByClient: async (clientId: string) => {
        try {
            const q = query(
                collection(db, SALES_COLLECTION), 
                where('clientId', '==', clientId)
            );
            const snapshot = await getDocs(q);
            const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
            return sales.sort((a, b) => b.createdAt - a.createdAt);
        } catch (error) {
            console.error("Error getting sales for client: ", error);
            return [];
        }
    },

  // Get all sales for reporting
  getAllSales: async () => {
      try {
          const q = query(collection(db, SALES_COLLECTION));
          const snapshot = await getDocs(q);
          const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
          return sales.sort((a, b) => b.createdAt - a.createdAt);
      } catch (error) {
           console.error("Error getting all sales: ", error);
           return [];
      }
  },

   // Update sale status and payment details
   updateSaleStatus: async (saleId: string, updates: Partial<Sale>) => {
       try {
           const docRef = doc(db, SALES_COLLECTION, saleId);
           const finalUpdates: any = {
               ...updates,
               updatedAt: Date.now()
           };
           if (updates.status === 'paid') {
               finalUpdates.paidAt = Date.now();
           }
           await updateDoc(docRef, finalUpdates);
           return true;
       } catch (error) {
           console.error("Error updating sale status: ", error);
           throw error;
       }
   },
 
   // Pay all debts for a specific client
   payAllDebts: async (clientId: string, updates: Partial<Sale>) => {
     try {
       const q = query(
         collection(db, SALES_COLLECTION),
         where('clientId', '==', clientId),
         where('status', '==', 'pending')
       );
       const snapshot = await getDocs(q);
       
       const promises = snapshot.docs.map(doc => 
         updateDoc(doc.ref, { 
           ...updates,
           status: 'paid',
           paidAt: Date.now(),
           updatedAt: Date.now() 
         })
       );
       
       await Promise.all(promises);
       return true;
     } catch (error) {
       console.error("Error paying all debts: ", error);
       throw error;
     }
   },
 
   // Subscribe to pending sales for real-time updates in Collections
   subscribeToPendingSales: (callback: (sales: Sale[]) => void) => {
     const q = query(collection(db, SALES_COLLECTION), where('status', '==', 'pending'));
     return onSnapshot(q, (snapshot) => {
       const sales = snapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data()
       } as Sale));
       callback(sales);
     });
   },

   // Cancel a sale and restore stock
   cancelSale: async (saleId: string, reason: string) => {
     try {
        await runTransaction(db, async (transaction) => {
          const saleRef = doc(db, SALES_COLLECTION, saleId);
          const saleDoc = await transaction.get(saleRef);
          
          if (!saleDoc.exists()) {
            throw new Error("Sale does not exist!");
          }
          
          const saleData = saleDoc.data() as Sale;
          if (saleData.status === 'cancelled') {
            throw new Error("Sale is already cancelled!");
          }

          // 1. READ ALL PRODUCTS
          const productRefs = saleData.items.map(item => doc(db, PRODUCTS_COLLECTION, item.id));
          const productDocs = await Promise.all(productRefs.map(ref => transaction.get(ref)));

          // 2. PREPARE INVENTORY RESTORATION
          const inventoryUpdates: { ref: any, newStock: number }[] = [];

          for (let i = 0; i < saleData.items.length; i++) {
              const item = saleData.items[i];
              const productDoc = productDocs[i];

              if (productDoc.exists()) {
                  const currentStock = productDoc.data().stock;
                  inventoryUpdates.push({
                      ref: productRefs[i],
                      newStock: currentStock + item.quantity
                  });
              }
          }

          // 3. EXECUTE WRITES

          // Restore stock
          for (const update of inventoryUpdates) {
             transaction.update(update.ref, { 
                stock: update.newStock,
                updatedAt: Date.now()
             });
          }

          // Mark sale as cancelled with reason
          transaction.update(saleRef, {
            status: 'cancelled',
            cancellationReason: reason,
            cancelledAt: Date.now(),
            updatedAt: Date.now()
          });
        });
        return true;
     } catch (error) {
       console.error("Error cancelling sale: ", error);
       throw error;
     }
   }
};

import { db } from '@/config/firebaseConfig';
import { toServiceError } from '@/lib/errors';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';
import { CashSession, SessionReport } from '@/types/cashSession';
import { SalesService } from './sales.service';

export class CashSessionService {
  private static COLLECTION = 'cashSessions';

  static async openSession(
    ownerId: string,
    cashierId: string,
    cashierName: string,
    cashboxId?: string,
    cashboxName?: string
  ): Promise<string> {
    try {
      const existing = await this.getOpenSessionForCashbox(ownerId, cashboxId ?? null);
      if (existing) {
        throw new Error(
          cashboxId
            ? `Ya hay una sesión abierta para esta caja por ${existing.cashierName}`
            : 'Ya hay una sesión abierta sin caja asignada'
        );
      }

      const allSales = await SalesService.getAllSales(ownerId);
      const pendingSales = allSales.filter(s => s.status === 'pending');
      const debtPending = pendingSales.reduce((sum, s) => sum + s.total, 0);

      const session: Omit<CashSession, 'id'> = {
        ownerId,
        cashierId,
        cashierName,
        cashboxId: cashboxId || null,
        cashboxName: cashboxName || null,
        openedAt: Date.now(),
        closedAt: null,
        status: 'open',
        saleIds: [],
        totalSales: 0,
        totalByMethod: { cash: 0, transfer: 0, mobile_pay: 0, credit: 0 },
        debtCollected: 0,
        debtPendingAtOpen: debtPending,
        debtPendingAtClose: debtPending,
        totalReturns: 0,
        returnIds: [],
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), session);
      return docRef.id;
    } catch (error) {
      console.error('Error opening cash session:', error);
      throw toServiceError(error);
    }
  }

  static async closeSession(sessionId: string, notes?: string, discrepancies?: string): Promise<void> {
    try {
      const sessionRef = doc(db, this.COLLECTION, sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) throw new Error('Session not found');
      const sessionData = sessionSnap.data() as CashSession;

      const allSales = await SalesService.getAllSales(sessionData.ownerId);
      const sessionCashboxId = sessionData.cashboxId ?? null;
      const sessionSales = allSales.filter(s => {
        if (s.createdAt < sessionData.openedAt) return false;
        return (s.cashboxId ?? null) === sessionCashboxId;
      });

      let totalSales = 0;
      const totalByMethod = { cash: 0, transfer: 0, mobile_pay: 0, credit: 0 };
      let debtCollected = 0;

      sessionSales.forEach(sale => {
        if (sale.status !== 'cancelled') {
          totalSales += sale.total;
          if (sale.paymentMethod in totalByMethod) {
            totalByMethod[sale.paymentMethod as keyof typeof totalByMethod] += sale.total;
          }
        }

        // Track debt collected (was pending, now paid in this session)
        if (sale.status === 'paid' && sale.paidAt && sale.paidAt >= sessionData.openedAt) {
          debtCollected += sale.total;
        }
      });

      // Get current pending debts
      const pendingSales = allSales.filter(s => s.status === 'pending');
      const debtPendingAtClose = pendingSales.reduce((sum, s) => sum + s.total, 0);

      await updateDoc(sessionRef, {
        closedAt: Date.now(),
        status: 'closed',
        saleIds: sessionSales.filter(s => s.status !== 'cancelled').map(s => s.id),
        totalSales,
        totalByMethod,
        debtCollected,
        debtPendingAtClose,
        notes: notes || '',
        discrepancies: discrepancies || '',
      });
    } catch (error) {
      console.error('Error closing cash session:', error);
      throw toServiceError(error);
    }
  }

  static async getOpenSession(ownerId: string): Promise<(CashSession & { id: string }) | null> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('ownerId', '==', ownerId),
        where('status', '==', 'open'),
        orderBy('openedAt', 'desc')
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return {
        ...snap.docs[0].data(),
        id: snap.docs[0].id,
      } as CashSession & { id: string };
    } catch (error) {
      console.error('Error getting open session:', error);
      return null;
    }
  }

  static async getOpenSessions(ownerId: string): Promise<(CashSession & { id: string })[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('ownerId', '==', ownerId),
        where('status', '==', 'open'),
        orderBy('openedAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id })) as (CashSession & { id: string })[];
    } catch (error) {
      console.error('Error getting open sessions:', error);
      return [];
    }
  }

  static async getOpenSessionForCashbox(
    ownerId: string,
    cashboxId: string | null
  ): Promise<(CashSession & { id: string }) | null> {
    const open = await this.getOpenSessions(ownerId);
    return open.find(s => (s.cashboxId ?? null) === (cashboxId ?? null)) || null;
  }

  static async getSessionReport(sessionId: string): Promise<(SessionReport & { id: string }) | null> {
    try {
      const sessionSnap = await getDoc(doc(db, this.COLLECTION, sessionId));
      if (!sessionSnap.exists()) return null;

      const sessionData = sessionSnap.data() as CashSession;
      const allSales = await SalesService.getAllSales(sessionData.ownerId);

      const salesDetails = sessionData.saleIds
        .map(saleId => {
          const sale = allSales.find(s => s.id === saleId);
          if (!sale) return null;
          return {
            id: sale.id || '',
            clientName: sale.clientName,
            total: sale.total,
            method: sale.paymentMethod,
            createdAt: sale.createdAt,
          };
        })
        .filter(Boolean);

      return {
        ...sessionData,
        id: sessionId,
        salesDetails,
      } as SessionReport & { id: string };
    } catch (error) {
      console.error('Error getting session report:', error);
      return null;
    }
  }

  static subscribeToSessions(
    ownerId: string,
    callback: (sessions: (CashSession & { id: string })[]) => void
  ): () => void {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('ownerId', '==', ownerId),
        orderBy('openedAt', 'desc')
      );

      return onSnapshot(q, snap => {
        const sessions = snap.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        })) as (CashSession & { id: string })[];
        callback(sessions);
      });
    } catch (error) {
      console.error('Error subscribing to sessions:', error);
      return () => {};
    }
  }

  static async getCurrentSessionStats(sessionId: string, ownerId: string) {
    try {
      const sessionSnap = await getDoc(doc(db, this.COLLECTION, sessionId));
      if (!sessionSnap.exists()) return null;

      const session = sessionSnap.data() as CashSession;
      const allSales = await SalesService.getAllSales(ownerId);
      const sessionCashboxId = session.cashboxId ?? null;

      const sessionSales = allSales.filter(
        s => s.createdAt >= session.openedAt
          && s.status !== 'cancelled'
          && (s.cashboxId ?? null) === sessionCashboxId
      );

      let totalSales = 0;
      const totalByMethod = { cash: 0, transfer: 0, mobile_pay: 0, credit: 0 };

      sessionSales.forEach(sale => {
        totalSales += sale.total;
        if (sale.paymentMethod in totalByMethod) {
          totalByMethod[sale.paymentMethod as keyof typeof totalByMethod] += sale.total;
        }
      });

      const pendingSales = sessionSales.filter(s => s.status === 'pending');
      const paidSales = sessionSales.filter(s => s.status === 'paid');

      return {
        totalSales,
        totalByMethod,
        salesCount: sessionSales.length,
        pendingCount: pendingSales.length,
        pendingAmount: pendingSales.reduce((sum, s) => sum + s.total, 0),
        paidCount: paidSales.length,
        paidAmount: paidSales.reduce((sum, s) => sum + s.total, 0),
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return null;
    }
  }
}

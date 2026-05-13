import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { toServiceError } from '@/lib/errors';
import { Promotion, PriceList, Coupon } from '@/types/promotion';

const stripUndefined = <T extends object>(obj: T): Partial<T> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;

const PROMOTIONS = 'promotions';
const PRICE_LISTS = 'priceLists';
const COUPONS = 'coupons';

export const PromotionService = {
  async add(ownerId: string, data: Omit<Promotion, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const ref = await addDoc(collection(db, PROMOTIONS), stripUndefined({
        ...data,
        ownerId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
      return ref.id;
    } catch (error) {
      throw toServiceError(error);
    }
  },

  async update(id: string, updates: Partial<Promotion>): Promise<void> {
    try {
      await updateDoc(doc(db, PROMOTIONS, id), stripUndefined({ ...updates, updatedAt: Date.now() }));
    } catch (error) {
      throw toServiceError(error);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, PROMOTIONS, id));
    } catch (error) {
      throw toServiceError(error);
    }
  },

  async list(ownerId: string): Promise<Promotion[]> {
    try {
      const q = query(collection(db, PROMOTIONS), where('ownerId', '==', ownerId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Promotion));
    } catch (error) {
      console.error('Error listing promotions', error);
      return [];
    }
  },

  subscribe(ownerId: string, cb: (items: Promotion[]) => void): () => void {
    const q = query(collection(db, PROMOTIONS), where('ownerId', '==', ownerId));
    return onSnapshot(q, snap => {
      cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Promotion)));
    });
  },
};

export const PriceListService = {
  async add(ownerId: string, data: Omit<PriceList, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const ref = await addDoc(collection(db, PRICE_LISTS), stripUndefined({
        ...data,
        ownerId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
      return ref.id;
    } catch (error) {
      throw toServiceError(error);
    }
  },

  async update(id: string, updates: Partial<PriceList>): Promise<void> {
    try {
      await updateDoc(doc(db, PRICE_LISTS, id), stripUndefined({ ...updates, updatedAt: Date.now() }));
    } catch (error) {
      throw toServiceError(error);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, PRICE_LISTS, id));
    } catch (error) {
      throw toServiceError(error);
    }
  },

  async list(ownerId: string): Promise<PriceList[]> {
    try {
      const q = query(collection(db, PRICE_LISTS), where('ownerId', '==', ownerId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as PriceList));
    } catch (error) {
      console.error('Error listing price lists', error);
      return [];
    }
  },

  subscribe(ownerId: string, cb: (items: PriceList[]) => void): () => void {
    const q = query(collection(db, PRICE_LISTS), where('ownerId', '==', ownerId));
    return onSnapshot(q, snap => {
      cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as PriceList)));
    });
  },
};

export const CouponService = {
  /** Normaliza el código: trim + uppercase. */
  normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  },

  async add(ownerId: string, data: Omit<Coupon, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'usedCount'>): Promise<string> {
    try {
      const ref = await addDoc(collection(db, COUPONS), stripUndefined({
        ...data,
        code: this.normalizeCode(data.code),
        ownerId,
        usedCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
      return ref.id;
    } catch (error) {
      throw toServiceError(error);
    }
  },

  async update(id: string, updates: Partial<Coupon>): Promise<void> {
    try {
      const patch: Partial<Coupon> = { ...updates, updatedAt: Date.now() };
      if (typeof updates.code === 'string') patch.code = this.normalizeCode(updates.code);
      await updateDoc(doc(db, COUPONS, id), stripUndefined(patch));
    } catch (error) {
      throw toServiceError(error);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COUPONS, id));
    } catch (error) {
      throw toServiceError(error);
    }
  },

  async list(ownerId: string): Promise<Coupon[]> {
    try {
      const q = query(collection(db, COUPONS), where('ownerId', '==', ownerId));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
    } catch (error) {
      console.error('Error listing coupons', error);
      return [];
    }
  },

  /** Busca cupón por código (case-insensitive). Devuelve null si no existe. */
  async findByCode(ownerId: string, code: string): Promise<Coupon | null> {
    const normalized = this.normalizeCode(code);
    try {
      const q = query(
        collection(db, COUPONS),
        where('ownerId', '==', ownerId),
        where('code', '==', normalized),
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as Coupon;
    } catch (error) {
      console.error('Error finding coupon', error);
      return null;
    }
  },

  /** Atómico-ish: incrementa usedCount tras venta exitosa. */
  async incrementUsage(id: string, currentUsed: number): Promise<void> {
    try {
      await updateDoc(doc(db, COUPONS, id), { usedCount: currentUsed + 1, updatedAt: Date.now() });
    } catch (error) {
      throw toServiceError(error);
    }
  },

  subscribe(ownerId: string, cb: (items: Coupon[]) => void): () => void {
    const q = query(collection(db, COUPONS), where('ownerId', '==', ownerId));
    return onSnapshot(q, snap => {
      cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon)));
    });
  },
};

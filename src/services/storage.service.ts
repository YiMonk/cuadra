import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebaseConfig';

export const StorageService = {
  async uploadComprobante(file: File): Promise<string> {
    if (!storage) throw new Error('Firebase Storage not initialized');
    const fileRef = storageRef(storage, `comprobantes/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  },

  async uploadSaleEvidence(file: File, saleId: string): Promise<string> {
    if (!storage) throw new Error('Firebase Storage not initialized');
    const fileRef = storageRef(storage, `evidence/${saleId}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    return getDownloadURL(fileRef);
  },
};

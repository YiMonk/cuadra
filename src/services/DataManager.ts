import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * DataManager — operaciones destructivas de base de datos.
 *
 * F1-03: wipeDatabase se ejecuta como Cloud Function (firebase-admin) para que
 * la autorización ocurra server-side y no pueda ser invocada desde la consola
 * del navegador por usuarios no autorizados.
 */
export const DataManager = {
  /**
   * Borra completamente la base de datos (excepto el AdminGod que hace la llamada).
   * La Cloud Function verifica que el caller tenga role = 'admingod' via Custom Claims.
   */
  wipeDatabase: async () => {
    const functions = getFunctions();
    const wipeFn = httpsCallable(functions, 'wipeDatabase');
    const result = await wipeFn();
    return result.data;
  },
};

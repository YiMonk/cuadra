// Database wipe is a destructive admin operation.
// Requires a backend endpoint (/api/v1/admin/wipe) that does not exist yet.
// Stubbed to prevent crashes; implement the endpoint when needed.
export const DataManager = {
  wipeDatabase: async (_callerUid: string): Promise<void> => {
    throw new Error('Wipe de base de datos no implementado en este backend. Contacta al administrador del servidor.');
  },
};

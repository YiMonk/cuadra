// File upload via Firebase Storage has been removed.
// Upload functionality requires a backend file endpoint.
export const StorageService = {
  async uploadComprobante(_file: File): Promise<string> {
    throw new Error('File upload not yet implemented in backend');
  },

  async uploadSaleEvidence(_file: File, _saleId: string): Promise<string> {
    throw new Error('File upload not yet implemented in backend');
  },
};

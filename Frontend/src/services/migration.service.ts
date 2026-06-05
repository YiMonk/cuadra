// Firestore migration helper — no longer needed with the REST backend.
// Kept as a stub so any callers compile without errors.

export type MigrationResult = {
  collection: string;
  stamped: number;
};

export async function stampLegacyDocuments(
  _ownerId: string
): Promise<MigrationResult[]> {
  return [];
}

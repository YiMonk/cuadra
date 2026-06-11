/**
 * Decodifica el payload de un JWT sin verificar la firma.
 * Solo para uso cliente — la verificación es responsabilidad del backend.
 */
export function decodeJwtPayload(token: string): { sub: string; cid?: string; type: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decodificar el payload (segunda parte)
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    return payload;
  } catch {
    return null;
  }
}

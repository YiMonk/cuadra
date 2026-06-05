export type ServiceErrorCode =
  | 'not-found'
  | 'permission-denied'
  | 'unavailable'
  | 'already-exists'
  | 'invalid-argument'
  | 'unknown';

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: ServiceErrorCode,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function toServiceError(error: unknown, context?: Record<string, unknown>): ServiceError {
  if (error instanceof ServiceError) return error;

  const msg = error instanceof Error ? error.message : String(error);

  // Map Firebase error codes to ServiceErrorCode
  if (msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) {
    return new ServiceError(msg, 'permission-denied', context);
  }
  if (msg.includes('not-found') || msg.includes('NOT_FOUND')) {
    return new ServiceError(msg, 'not-found', context);
  }
  if (msg.includes('already-exists') || msg.includes('ALREADY_EXISTS')) {
    return new ServiceError(msg, 'already-exists', context);
  }
  if (msg.includes('unavailable') || msg.includes('UNAVAILABLE')) {
    return new ServiceError(msg, 'unavailable', context);
  }

  return new ServiceError(msg, 'unknown', context);
}

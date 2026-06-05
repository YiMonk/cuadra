// Version check is no longer served from Firestore.
// Stub kept for backwards compatibility with any callers.
export const ConfigService = {
  subscribeToVersion: (_callback: (latestVersion: string) => void): (() => void) => {
    return () => {};
  },
};

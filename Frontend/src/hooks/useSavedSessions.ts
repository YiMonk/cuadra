"use client";

import { useState, useCallback } from 'react';

export interface SavedSession {
  email: string;
  displayName: string;
  lastUsed: number;
}

const STORAGE_KEY = 'cuadra_saved_sessions';
const MAX_SESSIONS = 3;

function readSessions(): SavedSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedSession[];
  } catch {
    return [];
  }
}

function writeSessions(sessions: SavedSession[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function useSavedSessions() {
  const [sessions, setSessionsState] = useState<SavedSession[]>(() => readSessions());

  const addSession = useCallback((email: string, displayName: string) => {
    setSessionsState(prev => {
      const withoutCurrent = prev.filter(s => s.email !== email);
      const updated: SavedSession[] = [
        { email, displayName, lastUsed: Date.now() },
        ...withoutCurrent,
      ].slice(0, MAX_SESSIONS);
      writeSessions(updated);
      return updated;
    });
  }, []);

  const removeSession = useCallback((email: string) => {
    setSessionsState(prev => {
      const updated = prev.filter(s => s.email !== email);
      writeSessions(updated);
      return updated;
    });
  }, []);

  return { sessions, addSession, removeSession };
}

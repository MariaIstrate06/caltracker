import { Injectable } from '@angular/core';

/**
 * Thin persistence boundary. Stage 1 backs it with localStorage only; Stage 2 slots
 * a real sync layer (e.g. GitHub-backed storage) behind the same get/set interface
 * without any caller needing to change.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

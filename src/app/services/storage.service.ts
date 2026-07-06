import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Thin persistence boundary. Backed by localStorage as the fast local cache; the
 * GitHub sync layer (Stage 2) listens on `changes$` to know when to push, without
 * the get/set interface itself changing for any caller.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly changes = new Subject<string>();

  /** Emits the key whenever it's written via `set`. */
  readonly changes$ = this.changes.asObservable();

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
    this.changes.next(key);
  }
}

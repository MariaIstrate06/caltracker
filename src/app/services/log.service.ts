import { Injectable } from '@angular/core';
import { DailyLogEntry } from '../models';
import { STORAGE_KEYS } from './storage-keys';
import { StorageService } from './storage.service';

const STORAGE_KEY = STORAGE_KEYS.logEntries;

@Injectable({ providedIn: 'root' })
export class LogService {
  constructor(private storage: StorageService) {}

  getAll(): DailyLogEntry[] {
    return this.storage.get<DailyLogEntry[]>(STORAGE_KEY) ?? [];
  }

  getForProfile(profileId: string): DailyLogEntry[] {
    return this.getAll().filter((entry) => entry.profileId === profileId);
  }

  getForProfileAndDate(profileId: string, date: string): DailyLogEntry[] {
    return this.getForProfile(profileId).filter((entry) => entry.date === date);
  }

  addEntry(entry: Omit<DailyLogEntry, 'id' | 'updatedAt'>): DailyLogEntry {
    const logEntry: DailyLogEntry = { ...entry, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
    this.saveAll([...this.getAll(), logEntry]);
    return logEntry;
  }

  /** Updates a log entry in place (e.g. editing its logged quantity) — never touches the underlying meal/drink definition. */
  update(id: string, patch: Partial<Omit<DailyLogEntry, 'id' | 'profileId'>>): DailyLogEntry | undefined {
    let updated: DailyLogEntry | undefined;
    const all = this.getAll().map((entry) => {
      if (entry.id !== id) {
        return entry;
      }
      updated = { ...entry, ...patch, id, updatedAt: new Date().toISOString() };
      return updated;
    });
    if (updated) {
      this.saveAll(all);
    }
    return updated;
  }

  deleteEntry(id: string): void {
    this.saveAll(this.getAll().filter((entry) => entry.id !== id));
  }

  private saveAll(entries: DailyLogEntry[]): void {
    this.storage.set(STORAGE_KEY, entries);
  }
}

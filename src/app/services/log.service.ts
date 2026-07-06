import { Injectable } from '@angular/core';
import { DailyLogEntry } from '../models';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'caltrack.logEntries';

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

  addEntry(entry: Omit<DailyLogEntry, 'id'>): DailyLogEntry {
    const logEntry: DailyLogEntry = { ...entry, id: crypto.randomUUID() };
    this.saveAll([...this.getAll(), logEntry]);
    return logEntry;
  }

  deleteEntry(id: string): void {
    this.saveAll(this.getAll().filter((entry) => entry.id !== id));
  }

  private saveAll(entries: DailyLogEntry[]): void {
    this.storage.set(STORAGE_KEY, entries);
  }
}

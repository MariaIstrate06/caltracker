import { Injectable } from '@angular/core';
import { Profile } from '../models';
import { STORAGE_KEYS } from './storage-keys';
import { StorageService } from './storage.service';

const STORAGE_KEY = STORAGE_KEYS.profiles;
const ACTIVE_PROFILE_KEY = STORAGE_KEYS.activeProfileId;

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  constructor(private storage: StorageService) {}

  getAll(): Profile[] {
    return this.storage.get<Profile[]>(STORAGE_KEY) ?? [];
  }

  getById(id: string): Profile | undefined {
    return this.getAll().find((profile) => profile.id === id);
  }

  create(input: Omit<Profile, 'id' | 'updatedAt'>): Profile {
    const profile: Profile = { ...input, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
    this.saveAll([...this.getAll(), profile]);
    if (!this.getActiveProfileId()) {
      this.setActiveProfileId(profile.id);
    }
    return profile;
  }

  rename(id: string, name: string): Profile | undefined {
    return this.update(id, { name });
  }

  update(id: string, patch: Partial<Omit<Profile, 'id'>>): Profile | undefined {
    let updated: Profile | undefined;
    const all = this.getAll().map((profile) => {
      if (profile.id !== id) {
        return profile;
      }
      updated = { ...profile, ...patch, id, updatedAt: new Date().toISOString() };
      return updated;
    });
    if (updated) {
      this.saveAll(all);
    }
    return updated;
  }

  delete(id: string): void {
    this.saveAll(this.getAll().filter((profile) => profile.id !== id));
    if (this.getActiveProfileId() === id) {
      const remaining = this.getAll();
      this.setActiveProfileId(remaining[0]?.id ?? null);
    }
  }

  getActiveProfileId(): string | null {
    return this.storage.get<string>(ACTIVE_PROFILE_KEY);
  }

  getActiveProfile(): Profile | undefined {
    const id = this.getActiveProfileId();
    return id ? this.getById(id) : undefined;
  }

  setActiveProfileId(id: string | null): void {
    this.storage.set(ACTIVE_PROFILE_KEY, id);
  }

  private saveAll(profiles: Profile[]): void {
    this.storage.set(STORAGE_KEY, profiles);
  }
}

import { Injectable } from '@angular/core';
import { STORAGE_KEYS } from './storage-keys';
import { StorageService } from './storage.service';

const TOKEN_KEY = STORAGE_KEYS.githubToken;

/**
 * Holds the GitHub Personal Access Token in localStorage only. Deliberately excluded
 * from SyncService's syncable-key list, so it's never included in the pushed document,
 * logged, or committed.
 */
@Injectable({ providedIn: 'root' })
export class GithubTokenService {
  constructor(private storage: StorageService) {}

  getToken(): string | null {
    return this.storage.get<string>(TOKEN_KEY);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  setToken(token: string): void {
    const trimmed = token.trim();
    if (!trimmed) {
      this.clearToken();
      return;
    }
    this.storage.set<string>(TOKEN_KEY, trimmed);
  }

  clearToken(): void {
    this.storage.set<string | null>(TOKEN_KEY, null);
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DailyLogEntry, Drink, Ingredient, Meal, Profile } from '../models';
import { SyncDocument, SyncStatus } from '../models/sync.model';
import { diffDeletedIds, emptySyncDocument, mergeSyncDocuments } from '../utils/sync-merge.util';
import { GithubApiError, GithubApiService } from './github-api.service';
import { GithubTokenService } from './github-token.service';
import { STORAGE_KEYS, SYNCABLE_KEYS } from './storage-keys';
import { StorageService } from './storage.service';

const DEBOUNCE_MS = 4000;
const MAX_CONFLICT_RETRIES = 3;

/**
 * Reconciles local data with store.json on the `data` branch. Every reconcile is a full
 * bidirectional merge (pull + union-by-updatedAt + push) rather than an incremental diff —
 * simplest correct approach for a single small JSON document. Tombstones track deletions
 * across the merge since a plain "newest updatedAt wins" rule can't otherwise tell a
 * deletion apart from "the other side just doesn't have it yet".
 */
@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly statusSubject: BehaviorSubject<SyncStatus>;
  readonly status$;

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private syncing = false;
  private pendingRerun = false;
  private applyingRemote = false;

  constructor(
    private storage: StorageService,
    private github: GithubApiService,
    private tokenService: GithubTokenService
  ) {
    this.statusSubject = new BehaviorSubject<SyncStatus>({
      state: this.tokenService.hasToken() ? 'syncing' : 'offline',
      lastSyncedAt: this.storage.get<string>(STORAGE_KEYS.syncLastSyncedAt),
      error: null,
    });
    this.status$ = this.statusSubject.asObservable();

    this.storage.changes$.subscribe((key) => this.onLocalChange(key));

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flushSoon();
      } else {
        void this.reconcile();
      }
    });
    window.addEventListener('beforeunload', () => this.flushSoon());
    window.addEventListener('online', () => void this.reconcile());
  }

  /** Called once at app bootstrap. No-ops silently if no token is set. */
  async initialLoad(): Promise<void> {
    if (!this.tokenService.hasToken()) {
      this.statusSubject.next({ state: 'offline', lastSyncedAt: this.statusSubject.value.lastSyncedAt, error: null });
      return;
    }
    await this.reconcile();
  }

  async connect(token: string): Promise<void> {
    this.tokenService.setToken(token);
    await this.reconcile();
  }

  disconnect(): void {
    this.tokenService.clearToken();
    this.statusSubject.next({ state: 'offline', lastSyncedAt: this.statusSubject.value.lastSyncedAt, error: null });
  }

  retryNow(): void {
    void this.reconcile();
  }

  private onLocalChange(key: string): void {
    if (this.applyingRemote || !SYNCABLE_KEYS.includes(key)) {
      return;
    }
    this.setDirty(true);
    this.scheduleDebouncedReconcile();
  }

  private scheduleDebouncedReconcile(): void {
    if (!this.tokenService.hasToken()) {
      return;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.reconcile();
    }, DEBOUNCE_MS);
  }

  private flushSoon(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    void this.reconcile();
  }

  private async reconcile(): Promise<void> {
    if (!this.tokenService.hasToken()) {
      this.statusSubject.next({ state: 'offline', lastSyncedAt: this.statusSubject.value.lastSyncedAt, error: null });
      return;
    }
    if (this.syncing) {
      this.pendingRerun = true;
      return;
    }

    this.syncing = true;
    this.statusSubject.next({ ...this.statusSubject.value, state: 'syncing', error: null });

    try {
      await this.runReconcile();
      this.setDirty(false);
      const lastSyncedAt = new Date().toISOString();
      this.storage.set<string>(STORAGE_KEYS.syncLastSyncedAt, lastSyncedAt);
      this.statusSubject.next({ state: 'synced', lastSyncedAt, error: null });
    } catch (error) {
      this.statusSubject.next({
        state: 'error',
        lastSyncedAt: this.statusSubject.value.lastSyncedAt,
        error: this.describeError(error),
      });
    } finally {
      this.syncing = false;
      if (this.pendingRerun) {
        this.pendingRerun = false;
        void this.reconcile();
      }
    }
  }

  private async runReconcile(): Promise<void> {
    await this.github.ensureDataBranch();

    const baseline = this.readBaseline();
    const localDoc = this.composeLocalDoc(baseline);

    for (let attempt = 1; attempt <= MAX_CONFLICT_RETRIES; attempt++) {
      const remoteFile = await this.github.getFile();
      const remoteDoc = remoteFile?.doc ?? emptySyncDocument();
      const merged = mergeSyncDocuments(localDoc, remoteDoc);

      try {
        await this.github.putFile(merged, remoteFile?.sha ?? null);
        this.applyMergedToLocal(merged);
        this.saveBaseline(merged);
        return;
      } catch (error) {
        const isConflict = error instanceof GithubApiError && (error.status === 409 || error.status === 422);
        if (isConflict && attempt < MAX_CONFLICT_RETRIES) {
          continue;
        }
        throw error;
      }
    }
  }

  private composeLocalDoc(baseline: SyncDocument): SyncDocument {
    const profiles = this.storage.get<Profile[]>(STORAGE_KEYS.profiles) ?? [];
    const ingredients = this.storage.get<Ingredient[]>(STORAGE_KEYS.ingredients) ?? [];
    const meals = this.storage.get<Meal[]>(STORAGE_KEYS.meals) ?? [];
    const drinks = this.storage.get<Drink[]>(STORAGE_KEYS.drinks) ?? [];
    const logEntries = this.storage.get<DailyLogEntry[]>(STORAGE_KEYS.logEntries) ?? [];

    const now = new Date().toISOString();
    const tombstones = { ...baseline.tombstones };
    const markDeleted = (baselineItems: { id: string }[], currentItems: { id: string }[]) => {
      for (const id of diffDeletedIds(baselineItems, currentItems)) {
        if (!tombstones[id]) {
          tombstones[id] = now;
        }
      }
    };
    markDeleted(baseline.profiles, profiles);
    markDeleted(baseline.ingredients, ingredients);
    markDeleted(baseline.meals, meals);
    markDeleted(baseline.drinks, drinks);
    markDeleted(baseline.logEntries, logEntries);

    return { profiles, ingredients, meals, drinks, logEntries, tombstones };
  }

  /** Writes the merged result back to the syncable keys. Guarded so it doesn't re-trigger its own sync. */
  private applyMergedToLocal(merged: SyncDocument): void {
    this.applyingRemote = true;
    try {
      this.storage.set(STORAGE_KEYS.profiles, merged.profiles);
      this.storage.set(STORAGE_KEYS.ingredients, merged.ingredients);
      this.storage.set(STORAGE_KEYS.meals, merged.meals);
      this.storage.set(STORAGE_KEYS.drinks, merged.drinks);
      this.storage.set(STORAGE_KEYS.logEntries, merged.logEntries);
    } finally {
      this.applyingRemote = false;
    }
  }

  private readBaseline(): SyncDocument {
    return this.storage.get<SyncDocument>(STORAGE_KEYS.syncBaseline) ?? emptySyncDocument();
  }

  private saveBaseline(doc: SyncDocument): void {
    this.storage.set<SyncDocument>(STORAGE_KEYS.syncBaseline, doc);
  }

  private setDirty(dirty: boolean): void {
    this.storage.set<boolean>(STORAGE_KEYS.syncDirty, dirty);
  }

  private describeError(error: unknown): string {
    if (error instanceof GithubApiError) {
      return `GitHub API error (${error.status}): ${error.message}`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown sync error';
  }
}

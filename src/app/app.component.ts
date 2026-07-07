import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SyncStatus } from './models/sync.model';
import { SyncService } from './services/sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell">
      <header class="top-bar">
        <span class="brand">CalTrack</span>
        <div class="top-bar-actions">
          <span
            class="sync-dot"
            *ngIf="sync.status$ | async as status"
            [class]="'sync-dot sync-' + status.state"
            [title]="statusTitle(status)"
            (click)="status.state === 'error' && sync.retryNow()"
          >
            {{ statusIcon(status.state) }}
          </span>
          <a routerLink="/manage" routerLinkActive="active" class="icon-btn" title="Manage library">📚</a>
          <a routerLink="/settings" routerLinkActive="active" class="icon-btn" title="Settings">⚙️</a>
        </div>
      </header>

      <main class="page">
        <router-outlet />
      </main>

      <nav class="bottom-tabs">
        <a routerLink="/home" routerLinkActive="active"><span class="tab-icon">🏠</span>Home</a>
        <a routerLink="/today" routerLinkActive="active"><span class="tab-icon">📅</span>Today</a>
        <a routerLink="/browse" routerLinkActive="active"><span class="tab-icon">📖</span>Browse</a>
        <a routerLink="/drinks" routerLinkActive="active"><span class="tab-icon">🥤</span>Drinks</a>
        <a routerLink="/stats" routerLinkActive="active"><span class="tab-icon">📊</span>Stats</a>
      </nav>
    </div>
  `,
})
export class AppComponent {
  constructor(public sync: SyncService) {}

  statusIcon(state: SyncStatus['state']): string {
    switch (state) {
      case 'synced':
        return '✓';
      case 'syncing':
        return '↻';
      case 'error':
        return '!';
      default:
        return '○';
    }
  }

  statusTitle(status: SyncStatus): string {
    switch (status.state) {
      case 'synced':
        return status.lastSyncedAt ? `Synced at ${new Date(status.lastSyncedAt).toLocaleTimeString()}` : 'Synced';
      case 'syncing':
        return 'Syncing…';
      case 'error':
        return `Sync error: ${status.error ?? 'unknown'} — tap to retry`;
      default:
        return 'Not connected — local only';
    }
  }
}

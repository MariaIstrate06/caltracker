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
    <nav class="nav">
      <a routerLink="/home" routerLinkActive="active">Home</a>
      <a routerLink="/today" routerLinkActive="active">Today</a>
      <a routerLink="/browse" routerLinkActive="active">Browse</a>
      <a routerLink="/drinks" routerLinkActive="active">Drinks</a>
      <a routerLink="/manage" routerLinkActive="active">Manage</a>
      <a routerLink="/stats" routerLinkActive="active">Stats</a>
      <a routerLink="/settings" routerLinkActive="active">Settings</a>
      <span
        *ngIf="sync.status$ | async as status"
        [title]="statusTitle(status)"
        [style.cursor]="status.state === 'error' ? 'pointer' : 'default'"
        (click)="status.state === 'error' && sync.retryNow()"
      >
        {{ statusIcon(status.state) }}
      </span>
    </nav>
    <main class="page">
      <router-outlet />
    </main>
  `,
})
export class AppComponent {
  constructor(public sync: SyncService) {}

  statusIcon(state: SyncStatus['state']): string {
    switch (state) {
      case 'synced':
        return '🟢';
      case 'syncing':
        return '🟡';
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
  }

  statusTitle(status: SyncStatus): string {
    switch (status.state) {
      case 'synced':
        return status.lastSyncedAt ? `Synced at ${new Date(status.lastSyncedAt).toLocaleTimeString()}` : 'Synced';
      case 'syncing':
        return 'Syncing…';
      case 'error':
        return `Sync error: ${status.error ?? 'unknown'} — click to retry`;
      default:
        return 'Not connected — local only';
    }
  }
}

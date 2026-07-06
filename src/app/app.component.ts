import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SyncStatus } from './models/sync.model';
import { SyncService } from './services/sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <nav>
      <a routerLink="/home">Home</a> | <a routerLink="/today">Today</a> |
      <a routerLink="/browse">Browse</a> | <a routerLink="/drinks">Drinks</a> |
      <a routerLink="/stats">Stats</a> | <a routerLink="/settings">Settings</a>
      <span
        *ngIf="sync.status$ | async as status"
        [title]="statusTitle(status)"
        [style.cursor]="status.state === 'error' ? 'pointer' : 'default'"
        (click)="status.state === 'error' && sync.retryNow()"
      >
        {{ statusIcon(status.state) }}
      </span>
    </nav>
    <router-outlet />
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

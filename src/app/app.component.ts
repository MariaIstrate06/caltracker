import { CommonModule } from '@angular/common';
import { Component, computed, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { AuthService } from './services/auth.service';
import { ProfilesService } from './services/profiles.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ConfirmDialogComponent],
  template: `
    <div class="app-shell">
      <header class="top-bar" *ngIf="showAppShell()">
        <a routerLink="/home" class="brand">CalTrack</a>
        <div class="top-bar-actions">
          <a routerLink="/manage" routerLinkActive="active" class="icon-btn" title="Manage library">📚</a>
          <a routerLink="/settings" routerLinkActive="active" class="icon-btn" title="Settings">⚙️</a>
        </div>
      </header>

      <main class="page">
        <router-outlet />
      </main>

      <nav class="bottom-tabs" *ngIf="showAppShell()">
        <a routerLink="/home" routerLinkActive="active"><span class="tab-icon">🏠</span>Home</a>
        <a routerLink="/today" routerLinkActive="active"><span class="tab-icon">📅</span>Today</a>
        <a routerLink="/browse" routerLinkActive="active"><span class="tab-icon">📖</span>Browse</a>
        <a routerLink="/log-drink" routerLinkActive="active"><span class="tab-icon">🥤</span>Drinks</a>
        <a routerLink="/stats" routerLinkActive="active"><span class="tab-icon">📊</span>Stats</a>
      </nav>
    </div>

    <app-confirm-dialog />
  `,
})
export class AppComponent {
  readonly showAppShell = computed(() => !!this.auth.currentUser() && !this.auth.needsPasswordSetup());

  constructor(
    public auth: AuthService,
    private profilesService: ProfilesService,
    private themeService: ThemeService
  ) {
    effect(() => {
      if (this.showAppShell()) {
        void this.applyTheme();
      }
    });
  }

  private async applyTheme(): Promise<void> {
    try {
      const profile = await this.profilesService.getMine();
      this.themeService.apply(profile.theme);
    } catch (error) {
      console.error('Failed to load theme', error);
    }
  }
}

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/** Sign-in only — no signup form. Accounts are provisioned via the Supabase Dashboard invite flow. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-shell">
      <h2>🥗 CalTrack</h2>
      <p class="muted">Sign in with the account you were invited with.</p>

      <input
        class="search-input"
        type="email"
        autocomplete="email"
        placeholder="Email"
        [(ngModel)]="email"
        (keyup.enter)="submit()"
      />
      <input
        class="search-input"
        type="password"
        autocomplete="current-password"
        placeholder="Password"
        [(ngModel)]="password"
        (keyup.enter)="submit()"
      />

      <button class="btn btn-primary" (click)="submit()" [disabled]="submitting || !email.trim() || !password">
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </button>

      <p class="login-error" *ngIf="error">{{ error }}</p>

      <p class="muted" style="margin-top: 14px">
        <a routerLink="/forgot-password">Forgot password?</a>
      </p>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  submitting = false;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async submit(): Promise<void> {
    if (!this.email.trim() || !this.password || this.submitting) {
      return;
    }
    this.submitting = true;
    this.error = null;
    try {
      const { error } = await this.auth.signIn(this.email.trim(), this.password);
      if (error) {
        this.error = error;
        return;
      }
      this.router.navigateByUrl('/home');
    } finally {
      // Guaranteed to run even if signIn threw instead of resolving with an error, so the
      // button never gets stuck on "Signing in…" with no explanation.
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }
}

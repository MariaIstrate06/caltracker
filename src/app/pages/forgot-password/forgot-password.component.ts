import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/** Requests a password-reset email — the link it sends lands on /set-password via the recovery-hash flow. */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-shell">
      <h2>Reset your password</h2>

      <ng-container *ngIf="!sent">
        <p class="muted">Enter your account email and we'll send you a link to set a new password.</p>

        <input
          class="search-input"
          type="email"
          autocomplete="email"
          placeholder="Email"
          [(ngModel)]="email"
          (keyup.enter)="submit()"
        />

        <button class="btn btn-primary" (click)="submit()" [disabled]="submitting || !email.trim()">
          {{ submitting ? 'Sending…' : 'Send reset link' }}
        </button>

        <p class="login-error" *ngIf="error">{{ error }}</p>
      </ng-container>

      <p class="muted" *ngIf="sent">
        If an account exists for {{ email }}, a reset link is on its way — check your inbox.
      </p>

      <p class="muted" style="margin-top: 14px">
        <a routerLink="/login">Back to sign in</a>
      </p>
    </div>
  `,
})
export class ForgotPasswordComponent {
  email = '';
  submitting = false;
  sent = false;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  async submit(): Promise<void> {
    if (!this.email.trim() || this.submitting) {
      return;
    }
    this.submitting = true;
    this.error = null;
    try {
      const { error } = await this.auth.requestPasswordReset(this.email.trim());
      if (error) {
        this.error = error;
        return;
      }
      this.sent = true;
    } finally {
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/** Shown once after an invite (or password-reset) link signs someone in with no password set yet. */
@Component({
  selector: 'app-set-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-shell">
      <h2>🥗 Welcome to CalTrack</h2>
      <p class="muted">Set a password for your account to finish signing in.</p>

      <input class="search-input" type="password" autocomplete="new-password" placeholder="New password" [(ngModel)]="password" />
      <input
        class="search-input"
        type="password"
        autocomplete="new-password"
        placeholder="Confirm password"
        [(ngModel)]="confirmPassword"
        (keyup.enter)="submit()"
      />

      <button class="btn btn-primary" (click)="submit()" [disabled]="submitting || !canSubmit">
        {{ submitting ? 'Saving…' : 'Set password & continue' }}
      </button>

      <p class="login-error" *ngIf="mismatchError">Passwords don't match.</p>
      <p class="login-error" *ngIf="error">{{ error }}</p>
    </div>
  `,
})
export class SetPasswordComponent {
  password = '';
  confirmPassword = '';
  submitting = false;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  get mismatchError(): boolean {
    return this.confirmPassword.length > 0 && this.password !== this.confirmPassword;
  }

  get canSubmit(): boolean {
    return this.password.length >= 6 && this.password === this.confirmPassword;
  }

  async submit(): Promise<void> {
    if (!this.canSubmit || this.submitting) {
      return;
    }
    this.submitting = true;
    this.error = null;
    const { error } = await this.auth.setPassword(this.password);
    this.submitting = false;
    if (error) {
      this.error = error;
      return;
    }
    this.router.navigateByUrl('/home');
  }
}

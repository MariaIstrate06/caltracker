import { Injectable, NgZone, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../core/supabase.client';

/** Signup is disabled app-side by design — accounts are provisioned via the Supabase Dashboard invite flow. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly ngZone = inject(NgZone);

  readonly currentUser = signal<User | null>(null);
  /**
   * An invite (or password-reset) link signs the user in via a one-time link, with no
   * password set yet. Detected synchronously from the URL fragment before Supabase's own
   * async hash handling strips it, so the guard can route to /set-password before anything
   * else renders.
   */
  readonly needsPasswordSetup = signal(false);

  constructor() {
    const hash = window.location.hash;
    if (hash.includes('type=invite') || hash.includes('type=recovery')) {
      this.needsPasswordSetup.set(true);
    }

    // supabase-js dispatches this from its own internal listeners, outside Angular's zone —
    // without ngZone.run, the signal updates correctly but Angular never schedules a
    // re-render for it, leaving the UI stuck until some unrelated zone-tracked event (a
    // click) happens to trigger change detection.
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.ngZone.run(() => {
        this.currentUser.set(session?.user ?? null);
      });
    });
  }

  /** Called once at app bootstrap so the auth guard's first check reflects any existing session. */
  async restoreSession(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this.currentUser.set(data.session?.user ?? null);
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  /** Completes the invite/recovery flow — requires the one-time session from that link to already be active. */
  async setPassword(password: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.auth.updateUser({ password });
    if (!error) {
      this.needsPasswordSetup.set(false);
    }
    return { error: error?.message ?? null };
  }

  requireUserId(): string {
    const user = this.currentUser();
    if (!user) {
      throw new Error('Not signed in');
    }
    return user.id;
  }
}

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Guards the main app routes: requires a session, and requires the invite/recovery password step to be done. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.currentUser()) {
    return router.parseUrl('/login');
  }
  if (auth.needsPasswordSetup()) {
    return router.parseUrl('/set-password');
  }
  return true;
};

/** Guards /set-password: only requires the one-time invite/recovery session, not that the password step is already done. */
export const sessionGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.currentUser() ? true : router.parseUrl('/login');
};

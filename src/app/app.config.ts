import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Restores any existing Supabase session before the first route/guard check runs, so a
    // signed-in user doesn't briefly flash the login page on reload.
    provideAppInitializer(() => inject(AuthService).restoreSession()),
  ],
};

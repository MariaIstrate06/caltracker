import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { SeedService } from './services/seed.service';
import { SyncService } from './services/sync.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAppInitializer(() => {
      // inject() must run synchronously in this callback, before any `await` —
      // capture both services up front, then do the async work.
      const sync = inject(SyncService);
      const seed = inject(SeedService);
      // Pull/merge from GitHub first (no-ops if no token is set), so seeding only fills
      // genuine gaps and never races a freshly-synced copy of real data.
      return sync.initialLoad().then(() => seed.seedIfNeeded());
    }),
  ],
};

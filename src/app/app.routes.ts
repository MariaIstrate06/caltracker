import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent) },
  { path: 'today', loadComponent: () => import('./pages/today/today.component').then((m) => m.TodayComponent) },
  { path: 'browse', loadComponent: () => import('./pages/browse/browse.component').then((m) => m.BrowseComponent) },
  { path: 'drinks', loadComponent: () => import('./pages/drinks/drinks.component').then((m) => m.DrinksComponent) },
  {
    path: 'log-new-meal',
    loadComponent: () => import('./pages/log-new-meal/log-new-meal.component').then((m) => m.LogNewMealComponent),
  },
  {
    path: 'log-existing-meal',
    loadComponent: () =>
      import('./pages/log-existing-meal/log-existing-meal.component').then((m) => m.LogExistingMealComponent),
  },
  { path: 'manage', loadComponent: () => import('./pages/manage/manage.component').then((m) => m.ManageComponent) },
  { path: 'stats', loadComponent: () => import('./pages/stats/stats.component').then((m) => m.StatsComponent) },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
  },
  { path: '**', redirectTo: 'home' },
];

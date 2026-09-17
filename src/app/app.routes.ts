import { Routes } from '@angular/router';
import { authGuard, sessionGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent) },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'set-password',
    canActivate: [sessionGuard],
    loadComponent: () => import('./pages/set-password/set-password.component').then((m) => m.SetPasswordComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent) },
      { path: 'today', loadComponent: () => import('./pages/today/today.component').then((m) => m.TodayComponent) },
      { path: 'browse', loadComponent: () => import('./pages/browse/browse.component').then((m) => m.BrowseComponent) },
      {
        path: 'log-meal',
        loadComponent: () => import('./pages/log-meal/log-meal.component').then((m) => m.LogMealComponent),
      },
      {
        path: 'log-drink',
        loadComponent: () => import('./pages/log-drink/log-drink.component').then((m) => m.LogDrinkComponent),
      },
      { path: 'manage', loadComponent: () => import('./pages/manage/manage.component').then((m) => m.ManageComponent) },
      { path: 'stats', loadComponent: () => import('./pages/stats/stats.component').then((m) => m.StatsComponent) },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then((m) => m.SettingsComponent),
      },
      { path: '**', redirectTo: 'home' },
    ],
  },
];

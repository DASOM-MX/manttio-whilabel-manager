import { Routes } from '@angular/router';

import { superadminGuard } from './core/guards/superadmin-guard';
import { Shell } from './layout/shell/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'tenants',
        loadComponent: () => import('./tenants/tenant-list/tenant-list').then((m) => m.TenantList),
      },
      {
        path: 'tenants/:slug',
        loadComponent: () =>
          import('./tenants/tenant-detail/tenant-detail').then((m) => m.TenantDetail),
      },
      {
        path: 'users',
        canActivate: [superadminGuard],
        loadComponent: () => import('./users/users').then((m) => m.Users),
      },
      {
        path: 'billing',
        loadComponent: () => import('./billing/billing').then((m) => m.Billing),
      },
      {
        path: 'blacklist',
        loadComponent: () => import('./blacklist/blacklist').then((m) => m.Blacklist),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];

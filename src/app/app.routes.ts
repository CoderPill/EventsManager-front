import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/events-list/events-list-page.component').then(c => c.EventsListPageComponent)
  },
  {
    path: 'MyReservations',
    loadComponent: () => import('./features/public/my-reservations/my-reservations-page.component').then(c => c.MyReservationsPageComponent)
  },
  {
    path: 'AllReservations',
    loadComponent: () => import('./features/admin/reservations/all-reservations.component').then(c => c.AllReservationsComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];
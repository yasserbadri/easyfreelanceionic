import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage) },
  { path: 'dashboard-client', loadComponent: () => import('./pages/dashboard-client/dashboard-client.page').then(m => m.DashboardClientPage) },
  { path: 'dashboard-freelancer', loadComponent: () => import('./pages/dashboard-freelancer/dashboard-freelancer.page').then(m => m.DashboardFreelancerPage) },
  { path: 'projects', loadComponent: () => import('./pages/projects/projects.page').then(m => m.ProjectsPage) },
  {
    path: 'view-proposals/:projectId',
    loadComponent: () => import('./pages/view-proposals/view-proposals.page').then( m => m.ViewProposalsPage)
  },
];

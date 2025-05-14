import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import {InstructorDashboardComponent} from './pages/instructor-dashboard/instructor-dashboard.component';
import { CoursePageComponent } from './pages/course-page/course-page.component';


export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'home', loadComponent: () => import('./components/search-bar/search-bar.component').then(m => m.SearchBarComponent) },
  { path: 'instructor', loadComponent: () => import('./pages/instructor-dashboard/instructor-dashboard.component').then(m => m.InstructorDashboardComponent) },
  { path: 'courses/:courseId', loadComponent: () => import('./pages/course-page/course-page.component').then(m => m.CoursePageComponent) },
  { path: '**', redirectTo: 'login' }  // <- wildcard fallback
];

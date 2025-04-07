import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import {InstructorDashboardComponent} from './pages/instructor-dashboard/instructor-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: SearchBarComponent },
  { path: 'instructor', component: InstructorDashboardComponent}
]
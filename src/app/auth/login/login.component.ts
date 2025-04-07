
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  error: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin() {
    this.authService.login(this.email, this.password).subscribe({
      next: (response: any) => {
        console.log('Login response:', response);
        
        const token = response.token;
        if (token) {
          this.authService.saveToken(token);
  
          // Extract role from token; navigate to dashboard depending on role
          const payload = JSON.parse(atob(token.split('.')[1]));
          const role = payload.role || payload.roles || payload.authorities;
  
          console.log('User role:', role);
  
          if (role.includes('INSTRUCTOR')) {
            this.router.navigate(['/instructor']);
          } else if (role.includes('STUDENT')) {
            this.router.navigate(['/home']);
          } else {
            this.error = 'Unrecognized role in token.';
          }
        } else {
          this.error = 'Login succeeded, but no token received.';
        }
      },
      error: (err: any) => {
        console.error('Login failed:', err);
        this.error = 'Invalid email or password.';
      },
    });
  }
}
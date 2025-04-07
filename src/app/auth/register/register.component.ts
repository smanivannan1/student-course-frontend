import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  formData = {
    name: '',
    username: '',
    email: '',
    password: '',
    role: ''
  };

  constructor(private http: HttpClient, private router: Router) {}

  register() {
    this.http.post<any>(`${environment.apiGatewayUrl}/auth/register`, this.formData).subscribe({
      next: (res) => {
        localStorage.setItem('jwtToken', res.token);
        this.router.navigate(['/']); // redirect after successful registration
      },
      error: (err) => {
        console.error('Registration failed:', err);
        alert('Something went wrong, try again.');
      }
    });
  }
  goToLogin() {
    this.router.navigate(['/login']);
  }
  
}
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent {
  searchQuery: string = '';
  courses: any[] = [];
  selectedCourse: any = null;
  username: string = '';
  showSearchResults: boolean = false;
  user: any = null;
  enrollmentSuccessMessage: string = '';
  enrolledCourses: any[] = [];
  showEnrolledCourses = false;

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserName();
    this.getUserProfile();
  }

  searchCourses() {
    const token = localStorage.getItem('jwtToken');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any[]>(`${environment.apiGatewayUrl}/courses/search?query=${this.searchQuery}`, { headers })
      .subscribe({
        next: (data) => {
          this.courses = data;
          this.showSearchResults = true;
        },
        error: (err) => {
          console.error('Error fetching courses:', err);
          this.showSearchResults = true;
        }
      });
  }

  selectCourse(course: any) {
    this.selectedCourse = (this.selectedCourse === course) ? null : course;
  }

  enrollInCourse(courseId: string): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) return alert('You must be logged in to enroll.');

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    const headers = { Authorization: `Bearer ${token}` };

    const url = `${environment.apiGatewayUrl}/enrollments/${userId}/${courseId}`;
    const selectedCourse = this.courses.find(course => course.id === courseId);
    const courseName = selectedCourse?.courseName || 'the course';

    this.http.post(url, null, { headers }).subscribe({
      next: () => {
        this.enrollmentSuccessMessage = `🎉 You have been successfully enrolled in ${courseName}.`;
        setTimeout(() => this.enrollmentSuccessMessage = '', 5000);
      },
      error: (err) => {
        console.error('Enrollment failed:', err);
        alert('Enrollment failed. You may already be enrolled in this course.');
      }
    });
  }

  getMyCourses() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any[]>(`${environment.apiGatewayUrl}/enrollments/${userId}`, { headers })
      .subscribe({
        next: (courses) => {
          this.enrolledCourses = courses;
          this.showEnrolledCourses = true;
        },
        error: (err) => {
          console.error('Failed to fetch enrolled courses:', err);
          this.showEnrolledCourses = false;
        }
      });
  }

  getAllCourses() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any[]>(`${environment.apiGatewayUrl}/courses`, { headers })
      .subscribe({
        next: (courses) => {
          this.courses = courses;
          this.showSearchResults = true;
        },
        error: (err) => {
          console.error('Failed to fetch courses:', err);
          this.showSearchResults = true;
        }
      });
  }

  hideEnrolledCourses() {
    this.showEnrolledCourses = false;
  }

  unenrollFromCourse(courseId: number): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    const headers = { Authorization: `Bearer ${token}` };

    const url = `${environment.apiGatewayUrl}/enrollments/${userId}/${courseId}`;

    this.http.delete(url, { headers, responseType: 'text' }).subscribe({
      next: (message) => {
        alert(message);
        this.enrolledCourses = this.enrolledCourses.filter(c => c.id !== courseId);
      },
      error: (err) => {
        console.error('Unenrollment failed:', err);
        alert('Failed to unenroll. Please try again.');
      }
    });
  }

  logout() {
    localStorage.removeItem('jwtToken');
    this.router.navigate(['/login']);
  }

  loadUserName() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any>(`${environment.apiGatewayUrl}/users/${userId}`, { headers })
      .subscribe({
        next: (user) => {
          this.username = user.name;
        },
        error: (err) => {
          console.error('Failed to fetch user:', err);
        }
      });
  }

  getUserProfile() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.userId;
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get(`${environment.apiGatewayUrl}/users/${userId}`, { headers })
      .subscribe({
        next: (userData) => this.user = userData,
        error: (err) => console.error('Failed to fetch user profile:', err)
      });
  }

  hideSearchResults() {
    this.showSearchResults = false;
  }
}

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment'; 
import { RouterModule } from '@angular/router';  

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [FormsModule, HttpClientModule, CommonModule],
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.css']
})
export class InstructorDashboardComponent {
  userId: string = '';
  instructorName: string = '';
  user: any = null;
  searchQuery: string = '';
  showSearchResults: boolean = false;
  editingCourseId: string | null = null;
  selectedCourse: any = null;
  studentQuery: string = '';
  searchedStudent: any = null;
  searchedStudentCourses: any[] = [];
  selectedCourseForEnrollment: any = null;
  studentToEnrollQuery: string = '';
  searchedStudentForEnrollment: any = null;
  enrollmentSuccessMessage: string = '';
  courses: any[] = [];
  newCourse = {
    courseName: '',
    courseDescription: '',
    courseCode: '',
    courseSubject: ''
  };

  private api = environment.apiGatewayUrl;
  private usersUrl = `${this.api}/users`;
  private coursesUrl = `${this.api}/courses`;
  private enrollmentsUrl = `${this.api}/enrollments`;

  constructor(private http: HttpClient, private router: Router) {
    this.loadUser();
  }

  selectCourseForEnrollment(course: any): void {
    this.selectedCourseForEnrollment =
      this.selectedCourseForEnrollment === course ? null : course;
    this.searchedStudentForEnrollment = null;
    this.studentToEnrollQuery = '';
  }


  searchStudentForEnrollment(): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    const url = `${this.usersUrl}/search?query=${encodeURIComponent(this.studentToEnrollQuery.trim())}`;

    this.http.get<any>(url, { headers }).subscribe({
      next: (student) => {
        this.searchedStudentForEnrollment = student;
      },
      error: () => {
        alert('Student not found.');
        this.searchedStudentForEnrollment = null;
      }
    });
  }

  enrollSearchedStudent(): void {
    const token = localStorage.getItem('jwtToken');
    const courseId = this.selectedCourseForEnrollment?.id;
    const studentId = this.searchedStudentForEnrollment?.id;
    if (!token || !courseId || !studentId) return;

    const headers = { Authorization: `Bearer ${token}` };
    const url = `${this.enrollmentsUrl}/${studentId}/${courseId}`;
    const studentName = this.searchedStudentForEnrollment?.name;
    const courseName = this.selectedCourseForEnrollment?.courseName;

    this.http.post(url, null, { headers }).subscribe({
      next: () => {
        this.enrollmentSuccessMessage = `${studentName ?? 'Student'} has been successfully enrolled in ${courseName ?? 'the course'}.`;
        this.selectedCourseForEnrollment = null;
        this.searchedStudentForEnrollment = null;
        this.studentToEnrollQuery = '';
        setTimeout(() => this.enrollmentSuccessMessage = '', 5000);
      },
      error: () => {
        alert('❌ Enrollment failed. The student might already be enrolled.');
      }
    });
  }

  searchCourses() {
    const token = localStorage.getItem('jwtToken');
    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any[]>(`${this.coursesUrl}/search?query=${this.searchQuery}`, { headers })
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

  hideStudentInfo(): void {
    this.searchedStudent = null;
    this.searchedStudentCourses = [];
    this.studentQuery = '';
  }

  getAllCourses() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any[]>(this.coursesUrl, { headers }).subscribe({
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

  hideAllResults(): void {
    this.showSearchResults = false;
    this.courses = [];
    this.selectedCourse = null;
    this.searchQuery = '';
  }

  loadUser() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    this.userId = payload.userId;

    const headers = { Authorization: `Bearer ${token}` };
    const url = `${this.usersUrl}/${this.userId}`;

    this.http.get<any>(url, { headers }).subscribe({
      next: (user) => {
        this.user = user;
        this.instructorName = user.name;
      },
      error: (err) => {
        console.error('Failed to fetch Instructor:', err);
      }
    });
  }

  createCourse(): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) return alert('You must be logged in.');

    const headers = { Authorization: `Bearer ${token}` };

    this.http.post(this.coursesUrl, this.newCourse, { headers }).subscribe({
      next: () => {
        alert('Course created successfully!');
        this.resetForm();
      },
      error: (err) => {
        console.error('Course creation failed:', err);
        alert('Failed to create course.');
      }
    });
  }

  deleteCourse(courseId: string): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    this.http.delete(`${this.coursesUrl}/${courseId}`, { headers, responseType: 'text' })
      .subscribe({
        next: () => {
          alert('Course deleted!');
          this.courses = this.courses.filter(course => course.id !== courseId);
        },
        error: (err) => {
          console.error('Failed to delete course:', err);
          alert('Failed to delete course.');
        }
      });
  }

  editCourse(course: any): void {
    this.newCourse = {
      courseName: course.courseName,
      courseDescription: course.courseDescription,
      courseCode: course.courseCode,
      courseSubject: course.courseSubject
    };
    this.editingCourseId = course.id;
  }

  logout(): void {
    localStorage.removeItem('jwtToken');
    this.router.navigate(['/login']);
  }

  submitCourse(): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    if (this.editingCourseId) {
      this.http.put(`${this.coursesUrl}/${this.editingCourseId}`, this.newCourse, { headers })
        .subscribe({
          next: () => {
            alert('Course updated!');
            this.resetForm();
          },
          error: (err) => {
            console.error('Update failed:', err);
            alert('Failed to update course.');
          }
        });
    } else {
      this.http.post(this.coursesUrl, this.newCourse, { headers })
        .subscribe({
          next: () => {
            alert('Course created!');
            this.resetForm();
          },
          error: (err) => {
            console.error('Creation failed:', err);
            alert('Failed to create course.');
          }
        });
    }
  }

  resetForm(): void {
    this.newCourse = {
      courseName: '',
      courseDescription: '',
      courseCode: '',
      courseSubject: ''
    };
    this.editingCourseId = null;
  }

  selectCourse(course: any): void {
    this.selectedCourse = (this.selectedCourse === course) ? null : course;
  }

  searchStudent(): void {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    const userUrl = `${this.usersUrl}/search?query=${encodeURIComponent(this.studentQuery)}`;

    this.http.get<any>(userUrl, { headers }).subscribe({
      next: (user) => {
        this.searchedStudent = user;
        const enrollUrl = `${this.enrollmentsUrl}/${user.id}`;
        this.http.get<any[]>(enrollUrl, { headers }).subscribe({
          next: (courses) => {
            this.searchedStudentCourses = courses;
          },
          error: (err) => {
            console.error('Failed to fetch enrolled courses:', err);
            this.searchedStudentCourses = [];
          }
        });
      },
      error: (err) => {
        console.error('Student search failed:', err);
        alert('No student found with that name, username, or email.');
        this.searchedStudent = null;
        this.searchedStudentCourses = [];
      }
    });
  }

  goToCoursePage(courseId: string): void {
    this.router.navigate(['/courses', courseId]);
  }

  unenrollStudent(courseId: number): void {
    const token = localStorage.getItem('jwtToken');
    if (!token || !this.searchedStudent?.id) return;

    const studentId = this.searchedStudent.id;
    const headers = { Authorization: `Bearer ${token}` };

    const url = `${this.enrollmentsUrl}/${studentId}/${courseId}`;

    this.http.delete<string>(url, { headers, responseType: 'text' as 'json' }).subscribe({
      next: (message: string) => {
        alert(message);
        this.searchedStudentCourses = this.searchedStudentCourses.filter(c => c.id !== courseId);
      },
      error: (err) => {
        console.error('Unenroll failed:', err);
        alert('Failed to unenroll student.');
      }
    });
  }
}

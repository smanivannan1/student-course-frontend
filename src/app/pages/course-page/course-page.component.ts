import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../services/course.service'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';





@Component({
  selector: 'app-course-page',
  standalone: true, 
  imports: [CommonModule, FormsModule], 
  templateUrl: './course-page.component.html',
  styleUrls: ['./course-page.component.css']
})
export class CoursePageComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private http: HttpClient,
    private router: Router
  ) {}

  courseId: string | null = null;
  course: any = null;
  assignments: any[] = [];

  activeTab: string | null = null;

newAssignment = {
  title: '',
  instructions: '',
  dueDate: '',
  maxPoints: null
};

students: any[] = [];
userRole: string | null = null;

submissionInputs: { [assignmentId: number]: { content: string; file: File | null } } = {};

studentSubmissions: { [assignmentId: number]: any } = {};

gradingInputs: { [submissionId: number]: { score: number; feedback: string } } = {};

allSubmissions: { [assignmentId: number]: any[] } = {};

userMap: { [userId: number]: string } = {};

gradebook: any;



loadGradebook(): void {
  const token = localStorage.getItem('jwtToken');
  if (!token) return;

  const payload = JSON.parse(atob(token.split('.')[1]));
  const userId = payload.userId;

  const headers = { Authorization: `Bearer ${token}` };

  console.log('Loading gradebook for user:', userId, 'course:', this.courseId); // ✅ debug line

  this.http.get<any>(`${environment.apiGatewayUrl}/gradebook/${userId}/course/${this.courseId}`, { headers })
    .subscribe({
      next: (data) => {
        console.log('✅ Gradebook loaded:', data); // ✅ debug line
        this.gradebook = data;
      },
      error: (err) => {
        console.error('❌ Failed to load gradebook:', err);
        this.gradebook = null;
      }
    });
}





getUserName(userId: number): void {
  const token = localStorage.getItem('jwtToken');
  if (!token || this.userMap[userId]) return;

  const headers = { Authorization: `Bearer ${token}` };
  const url = `${environment.apiGatewayUrl}/users/${userId}`;

  this.http.get<any>(url, { headers }).subscribe({
    next: (user) => {
      this.userMap[userId] = user.name;
    },
    error: (err) => {
      console.error(`Failed to fetch user ${userId}`, err);
    }
  });
}




hasSubmissions(assignmentId: number): boolean {
  return Array.isArray(this.allSubmissions[assignmentId]) && this.allSubmissions[assignmentId].length > 0;
}

loadSubmissionsForAssignment(assignmentId: number): void {
  const token = localStorage.getItem('jwtToken');
  if (!token) return;

  const headers = { Authorization: `Bearer ${token}` };

  this.http.get<any[]>(`${environment.apiGatewayUrl}/submissions/assignments/${assignmentId}`, { headers })
    .subscribe({
      next: (data) => {
        this.allSubmissions[assignmentId] = data;

        // Optional: Initialize gradingInputs for new submissions
        data.forEach(sub => {
          this.getUserName(sub.userId);
          if (!this.gradingInputs[sub.id]) {
            this.gradingInputs[sub.id] = { score: 0, feedback: '' };
          }

         // 🔁 Fetch student name for each userId
         if (!this.userMap[sub.userId]) {
          this.http.get<any>(`${environment.apiGatewayUrl}/users/${sub.userId}`, { headers })
            .subscribe({
              next: (user) => {
                this.userMap[sub.userId] = user.name;
              },
              error: (err) => {
                console.error(`Failed to fetch user ${sub.userId}`, err);
              }
            });
        }
      });
    },
      error: (err) => {
        console.error(`Failed to load submissions for assignment ${assignmentId}`, err);
      }
    });
}



gradeSubmission(submissionId: number, score: number, feedback: string): void {
  const token = localStorage.getItem('jwtToken');
  if (!token) return;

  const headers = { Authorization: `Bearer ${token}` };
  const params = new HttpParams()
    .set('score', score.toString())
    .set('feedback', feedback || '');

  this.http.put(`${environment.apiGatewayUrl}/submissions/${submissionId}/grade`, null, { headers, params })
    .subscribe({
      next: () => {
        alert('✅ Submission graded.');
        this.loadAssignments(); // optional: refresh
      },
      error: (err) => {
        console.error('❌ Grading failed:', err);
        alert('Failed to grade submission.');
      }
    });
}



handleFileUpload(event: any, assignmentId: number): void {
  const file = event.target.files[0];
  if (file) {
    this.submissionInputs[assignmentId].file = file;
  }
}


submitAssignment(assignmentId: number): void {
  const token = localStorage.getItem('jwtToken');
  if (!token) return;

  const headers = { Authorization: `Bearer ${token}` };
  const input = this.submissionInputs[assignmentId];
  const formData = new FormData();

  if (input.content) formData.append('content', input.content);
  if (input.file) formData.append('file', input.file);

  this.http.post(`${environment.apiGatewayUrl}/submissions/assignments/${assignmentId}`, formData, { headers })
    .subscribe({
      next: () => {
        alert('✅ Submission successful!');
        this.submissionInputs[assignmentId] = { content: '', file: null };

        // 🔁 Refresh student submission
        this.http.get(`${environment.apiGatewayUrl}/submissions/assignments/${assignmentId}/me`, { headers })
          .subscribe({
            next: (submission) => {
              this.studentSubmissions[assignmentId] = submission;
            }
          });
      },
      error: (err) => {
        console.error('❌ Submission failed:', err);
        alert('Submission failed. Please try again.');
      }
    });
}




goToHomepage() {
  const token = localStorage.getItem('jwtToken');
  if (!token) {
    this.router.navigateByUrl('/login');
    return;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role;

    setTimeout(() => {
      if (role === 'INSTRUCTOR') {
        this.router.navigateByUrl('/instructor');
      } else {
        this.router.navigateByUrl('/home');  // ✅ <- This is your student dashboard route
      }
    }, 0);
  } catch (e) {
    console.error('Invalid JWT token payload', e);
    this.router.navigateByUrl('/login');
  }
}

loadEnrolledStudents() {
  this.activeTab = 'students'; // ✅ this ensures the view switches

  const token = localStorage.getItem('jwtToken');
  if (!token || !this.courseId) return;

  const headers = { Authorization: `Bearer ${token}` };
  const url = `${environment.apiGatewayUrl}/enrollments/course/${this.courseId}/students`;

  this.http.get<any[]>(url, { headers }).subscribe({
    next: (data) => {
      this.students = data;
    },
    error: (err) => {
      console.error('❌ Failed to load enrolled students:', err);
    }
  });
}


loadStudents() {
  const token = localStorage.getItem('jwtToken');
  if (!token) return;

  const headers = { Authorization: `Bearer ${token}` };
  const url = `${environment.apiGatewayUrl}/users`;

  this.http.get<any[]>(url, { headers }).subscribe({
    next: (data) => {
      this.students = data.filter(user => user.role == 'STUDENT');
    },
    error: (err) => {
      console.error('Failed to fetch students:', err);
    }
  });
}


getTabStyle(tab: string): { [key: string]: string } {
  return {
    padding: '8px 16px',
    border: 'none',
    background: this.activeTab === tab ? '#1976d2' : '#f0f0f0',
    color: this.activeTab === tab ? '#fff' : '#333',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: this.activeTab === tab ? 'bold' : 'normal'
  };
}

loadAssignments() {
  const token = localStorage.getItem('jwtToken');
  if (!token || !this.courseId) return;

  const headers = { Authorization: `Bearer ${token}` };

  this.http.get<any[]>(`${environment.apiGatewayUrl}/assignments/course/${this.courseId}`, { headers })
    .subscribe({
      next: (data) => {
        this.assignments = data;

        this.assignments.forEach(a => {
          // Student-specific submission input
          this.submissionInputs[a.id] = { content: '', file: null };

          // 🧑‍🎓 Student: Load their own submission
          this.http.get(`${environment.apiGatewayUrl}/submissions/assignments/${a.id}/me`, { headers })
            .subscribe({
              next: (submission) => {
                this.studentSubmissions[a.id] = submission;
              },
              error: (err) => {
                if (err.status !== 404) {
                  console.error(`Failed to fetch submission for assignment ${a.id}`, err);
                }
              }
            });
        });
      },
      error: (err) => {
        console.error('Failed to load assignments:', err);
      }
    });
}



createAssignment() {
  const token = localStorage.getItem('jwtToken');
  if (!token || !this.courseId) {
    alert('Missing token or course ID.');
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`
  };

  const body = {
    courseId: this.courseId,
    title: this.newAssignment.title,
    instructions: this.newAssignment.instructions,
    dueDate: this.newAssignment.dueDate,
    maxPoints: this.newAssignment.maxPoints
  };

  this.http.post(`${environment.apiGatewayUrl}/assignments`, body, { headers }).subscribe({
    next: (res) => {
      alert('✅ Assignment created successfully!');
      console.log('Created assignment:', res);
      this.newAssignment = {
        title: '',
        instructions: '',
        dueDate: '',
        maxPoints: null
      };
    },
    error: (err) => {
      console.error('❌ Failed to create assignment:', err);
      alert('Failed to create assignment.');
    }
  });
}

ngOnInit() {
  this.courseId = this.route.snapshot.paramMap.get('courseId');

  const token = localStorage.getItem('jwtToken');
  if (!token || !this.courseId) return;

  // ✅ Set userRole before any async logic
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    this.userRole = payload.role;
  } catch (e) {
    console.error('Invalid token payload', e);
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };

  // ✅ Load course
  this.courseService.getCourseById(this.courseId).subscribe({
    next: (data) => {
      this.course = data;
    },
    error: (err) => {
      console.error('Failed to fetch course:', err);
    }
  });

  // ✅ Load assignments
  this.http.get<any[]>(`${environment.apiGatewayUrl}/assignments/course/${this.courseId}`, { headers })
    .subscribe({
      next: (data) => {
        this.assignments = data;

        this.assignments.forEach(a => {
          // Initialize blank submission inputs
          this.submissionInputs[a.id] = { content: '', file: null };

          // 🧑‍🎓 Load student submission (but only for students)
          if (this.userRole === 'STUDENT') {
            this.http.get(`${environment.apiGatewayUrl}/submissions/assignments/${a.id}/me`, { headers })
              .subscribe({
                next: (submission) => {
                  this.studentSubmissions[a.id] = submission;
                },
                error: (err) => {
                  if (err.status !== 404) {
                    console.error(`Failed to fetch submission for assignment ${a.id}`, err);
                  }
                }
              });
          }
        });
      },
      error: (err) => {
        console.error('Failed to load assignments:', err);
      }
    });
}}
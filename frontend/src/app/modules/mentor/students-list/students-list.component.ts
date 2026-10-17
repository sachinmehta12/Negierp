import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StudentProfile, Stream, Subject } from '../../../core/models/entities';

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.scss'
})
export class StudentsListComponent implements OnInit {
  protected readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  students = signal<StudentProfile[]>([]);
  streams = signal<Stream[]>([]);
  allSubjects = signal<Subject[]>([]);
  mentorSubjects = signal<any[]>([]);
  isMentorScoped = signal<boolean>(false);

  searchQuery = '';
  selectedClass: number | null = null;
  selectedStream: number | null = null;
  selectedSubject: number | null = null;
  selectedStatus = 'active';

  ngOnInit() {
    this.loadStreams();
    this.loadSubjects();
    this.loadStudents();
  }

  loadStreams() {
    this.apiService.getStreams().subscribe({
      next: (res) => {
        if (res.success) {
          this.streams.set(res.streams);
        }
      }
    });
  }

  loadSubjects() {
    this.apiService.getSubjects().subscribe({
      next: (res) => {
        if (res.success) {
          this.allSubjects.set(res.subjects);
        }
      }
    });
  }

  loadStudents() {
    this.isLoading.set(true);
    this.apiService.getStudents({
      class: this.selectedClass || undefined,
      stream: this.selectedStream || undefined,
      subjectId: this.selectedSubject || undefined,
      status: this.selectedStatus,
      q: this.searchQuery || undefined
    }).subscribe({
      next: (res) => {
        if (res.success) {
          this.students.set(res.students || []);
          if (res.mentorSubjects) {
            this.mentorSubjects.set(res.mentorSubjects);
          }
          this.isMentorScoped.set(Boolean(res.isMentor));
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange() {
    this.loadStudents();
  }

  toggleActive(student: StudentProfile) {
    this.apiService.toggleStudentActive(student.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.info(res.message);
          this.loadStudents();
        }
      }
    });
  }

  deleteStudent(student: StudentProfile) {
    if (confirm(`Are you sure you want to delete student ${student.firstName} ${student.lastName} (${student.enrollmentNo})? This will permanently delete their records.`)) {
      this.apiService.deleteStudent(student.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success(res.message);
            this.loadStudents();
          }
        }
      });
    }
  }
}

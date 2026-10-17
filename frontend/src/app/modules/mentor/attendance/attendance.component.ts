import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Subject, StudentProfile } from '../../../core/models/entities';

interface AttendanceRow {
  studentId: number;
  enrollmentNo: string;
  name: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss'
})
export class AttendanceComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  selectedClass = signal<number>(10);
  selectedSubjectId = signal<number | null>(null);
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  subjects = signal<Subject[]>([]);
  students = signal<StudentProfile[]>([]);
  attendanceRecords = signal<AttendanceRow[]>([]);

  // Computed stats
  totalCount = computed(() => this.attendanceRecords().length);
  presentCount = computed(() => this.attendanceRecords().filter(r => r.status === 'Present').length);
  lateCount = computed(() => this.attendanceRecords().filter(r => r.status === 'Late').length);
  absentCount = computed(() => this.attendanceRecords().filter(r => r.status === 'Absent').length);
  excusedCount = computed(() => this.attendanceRecords().filter(r => r.status === 'Excused').length);

  attendancePercentage = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 100;
    const effective = this.presentCount() + this.lateCount();
    return Math.round((effective / total) * 100 * 10) / 10;
  });

  ngOnInit() {
    this.loadSubjects();
  }

  loadSubjects() {
    this.apiService.getSubjects({ class: this.selectedClass() }).subscribe({
      next: (res) => {
        if (res.success) {
          this.subjects.set(res.subjects);
          if (res.subjects.length > 0) {
            this.selectedSubjectId.set(res.subjects[0].id);
          } else {
            this.selectedSubjectId.set(null);
          }
          this.loadRegister();
        }
      }
    });
  }

  onClassChange(cls: number) {
    this.selectedClass.set(cls);
    this.loadSubjects();
  }

  loadRegister() {
    this.isLoading.set(true);
    this.apiService.getAttendanceRegister(
      this.selectedClass(),
      this.selectedDate(),
      this.selectedSubjectId() || undefined
    ).subscribe({
      next: (res) => {
        if (res.success) {
          const recordsMap = res.recordsMap || {};
          const rows: AttendanceRow[] = (res.students || []).map((st: any) => {
            const existing = recordsMap[st.id];
            return {
              studentId: st.id,
              enrollmentNo: st.enrollmentNo,
              name: `${st.firstName} ${st.lastName}`,
              status: existing ? (existing.status as any) : 'Present',
              remarks: existing?.remarks || ''
            };
          });
          this.attendanceRecords.set(rows);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  setStatus(row: AttendanceRow, status: 'Present' | 'Absent' | 'Late' | 'Excused') {
    row.status = status;
    this.attendanceRecords.set([...this.attendanceRecords()]);
  }

  markAll(status: 'Present' | 'Absent') {
    const updated = this.attendanceRecords().map(r => ({ ...r, status }));
    this.attendanceRecords.set(updated);
  }

  saveAttendance() {
    if (this.attendanceRecords().length === 0) {
      this.notification.warning('No student records to save.');
      return;
    }

    this.isSaving.set(true);
    const payload = {
      targetClass: this.selectedClass(),
      date: this.selectedDate(),
      subjectId: this.selectedSubjectId() || null,
      entries: this.attendanceRecords().map(r => ({
        studentId: r.studentId,
        status: r.status,
        remarks: r.remarks
      }))
    };

    this.apiService.recordAttendance(payload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.notification.success(res.message || 'Attendance saved successfully');
        }
      },
      error: () => this.isSaving.set(false)
    });
  }
}

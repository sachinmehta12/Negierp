import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Exam, StudentProfile } from '../../../core/models/entities';

interface MarkEntryRow {
  studentId: number;
  enrollmentNo: string;
  name: string;
  marksObtained: number | null;
  isAbsent: boolean;
  grade: string;
  remarks: string;
}

@Component({
  selector: 'app-exam-marks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './exam-marks.component.html',
  styleUrl: './exam-marks.component.scss'
})
export class ExamMarksComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  exam = signal<Exam | null>(null);
  entries = signal<MarkEntryRow[]>([]);

  // Computed KPIs
  totalCount = computed(() => this.entries().length);
  absentCount = computed(() => this.entries().filter(e => e.isAbsent).length);
  appearedCount = computed(() => this.entries().filter(e => !e.isAbsent).length);
  
  passedCount = computed(() => {
    const ex = this.exam();
    if (!ex) return 0;
    return this.entries().filter(e => !e.isAbsent && (e.marksObtained ?? 0) >= ex.passingMarks).length;
  });

  averageScore = computed(() => {
    const appeared = this.entries().filter(e => !e.isAbsent && e.marksObtained !== null);
    if (appeared.length === 0) return 0;
    const sum = appeared.reduce((acc, e) => acc + (e.marksObtained as number), 0);
    return Math.round((sum / appeared.length) * 10) / 10;
  });

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.notification.error('Invalid Exam ID');
      this.goBack();
      return;
    }
    this.loadMarksheet(id);
  }

  loadMarksheet(examId: number) {
    this.isLoading.set(true);
    this.apiService.getExamMarksheet(examId).subscribe({
      next: (res) => {
        if (res.success) {
          this.exam.set(res.exam);
          const maxMarks = res.exam.maxMarks || 100;
          const marksMap = res.marksMap || {};

          const rows: MarkEntryRow[] = (res.students || []).map((st: StudentProfile) => {
            const existing = marksMap[st.id];
            const isAbsent = existing ? Boolean(existing.isAbsent) : false;
            const marks = existing?.marksObtained !== undefined && existing?.marksObtained !== null ? Number(existing.marksObtained) : null;
            const grade = existing?.grade || this.computeGrade(marks, maxMarks, isAbsent);

            return {
              studentId: st.id,
              enrollmentNo: st.enrollmentNo,
              name: `${st.firstName} ${st.lastName}`,
              marksObtained: marks,
              isAbsent,
              grade,
              remarks: existing?.remarks || ''
            };
          });

          this.entries.set(rows);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load marksheet');
        this.isLoading.set(false);
        this.goBack();
      }
    });
  }

  computeGrade(marks: number | null, maxMarks: number, isAbsent: boolean): string {
    if (isAbsent) return 'Ab';
    if (marks === null || marks === undefined || maxMarks <= 0) return '—';

    const pct = (marks / maxMarks) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B';
    if (pct >= 50) return 'C';
    if (pct >= 33) return 'D';
    return 'F';
  }

  onMarksChange(row: MarkEntryRow) {
    const maxMarks = this.exam()?.maxMarks || 100;
    if (row.marksObtained !== null && row.marksObtained > maxMarks) {
      row.marksObtained = maxMarks;
    }
    if (row.marksObtained !== null && row.marksObtained < 0) {
      row.marksObtained = 0;
    }
    row.grade = this.computeGrade(row.marksObtained, maxMarks, row.isAbsent);
    this.entries.set([...this.entries()]);
  }

  onAbsentToggle(row: MarkEntryRow) {
    const maxMarks = this.exam()?.maxMarks || 100;
    if (row.isAbsent) {
      row.marksObtained = null;
    } else {
      row.marksObtained = 0;
    }
    row.grade = this.computeGrade(row.marksObtained, maxMarks, row.isAbsent);
    this.entries.set([...this.entries()]);
  }

  saveMarks() {
    const ex = this.exam();
    if (!ex) return;

    this.isSaving.set(true);
    const marksEntries = this.entries().map(e => ({
      studentId: e.studentId,
      marksObtained: e.isAbsent ? null : e.marksObtained,
      isAbsent: e.isAbsent,
      remarks: e.remarks
    }));

    this.apiService.recordExamMarks(ex.id, marksEntries).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.notification.success(res.message || 'Marks saved successfully');
        }
      },
      error: () => this.isSaving.set(false)
    });
  }

  goBack() {
    this.router.navigate(['/mentor/exams']);
  }
}

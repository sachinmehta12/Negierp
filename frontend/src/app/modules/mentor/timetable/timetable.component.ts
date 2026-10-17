import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Subject, Timetable } from '../../../core/models/entities';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ModalComponent],
  templateUrl: './timetable.component.html',
  styleUrl: './timetable.component.scss'
})
export class TimetableComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);

  isLoading = signal<boolean>(true);
  selectedClass = signal<number>(10);
  subjects = signal<Subject[]>([]);
  days: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  timetableByDay = signal<Record<string, Timetable[]>>({});

  isModalOpen = signal<boolean>(false);
  slotForm = this.fb.group({
    targetClass: [10, [Validators.required]],
    dayOfWeek: ['Monday', [Validators.required]],
    subjectId: [0, [Validators.required, Validators.min(1)]],
    startTime: ['09:00 AM', [Validators.required]],
    endTime: ['10:30 AM', [Validators.required]],
    roomNo: ['Room 101', [Validators.required]],
    mentorName: ['Dr. S. Negi', [Validators.required]]
  });

  ngOnInit() {
    this.loadSubjects();
    this.loadTimetable();
  }

  loadSubjects() {
    this.apiService.getSubjects().subscribe({
      next: (res) => {
        if (res.success) this.subjects.set(res.subjects);
      }
    });
  }

  loadTimetable() {
    this.isLoading.set(true);
    this.apiService.getTimetable({ class: this.selectedClass(), view: 'class' }).subscribe({
      next: (res) => {
        if (res.success) {
          this.timetableByDay.set(res.timetableByDay || {});
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onClassChange(cls: number) {
    this.selectedClass.set(cls);
    this.loadTimetable();
  }

  openAddSlot(day?: string) {
    this.slotForm.reset({
      targetClass: this.selectedClass(),
      dayOfWeek: day || 'Monday',
      subjectId: this.subjects().length > 0 ? this.subjects()[0].id : 0,
      startTime: '09:00 AM',
      endTime: '10:30 AM',
      roomNo: 'Room 101',
      mentorName: 'Dr. S. Negi'
    });
    this.isModalOpen.set(true);
  }

  saveSlot() {
    if (this.slotForm.invalid) {
      this.slotForm.markAllAsTouched();
      return;
    }

    this.apiService.createTimetableSlot(this.slotForm.value).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('Timetable slot created successfully');
          this.isModalOpen.set(false);
          this.loadTimetable();
        }
      }
    });
  }

  deleteSlot(slot: Timetable) {
    if (confirm(`Remove ${slot.subject?.name} on ${slot.dayOfWeek}?`)) {
      this.apiService.deleteTimetableSlot(slot.id).subscribe({
        next: (res) => {
          if (res.success) {
            this.notification.success('Slot removed');
            this.loadTimetable();
          }
        }
      });
    }
  }
}

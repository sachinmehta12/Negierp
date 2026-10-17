import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Stream, Subject } from '../../../core/models/entities';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly apiService = inject(ApiService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  activeTab = signal<'student' | 'mentor'>('student');
  isLoading = false;
  streams = signal<Stream[]>([]);
  allSubjects = signal<Subject[]>([]);
  mentorAvailableSubjects = signal<Subject[]>([]);

  get isHigherSecondary(): boolean {
    const val = this.studentForm.get('targetClass')?.value;
    return val !== null && val !== undefined && Number(val) !== 10;
  }

  studentForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    gender: ['Male'],
    contactNumber: [''],
    parentName: [''],
    parentContact: [''],
    address: [''],
    targetClass: [10, [Validators.required]],
    streamId: [0]
  });

  mentorForm = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    streamId: [0, [Validators.required]],
    designation: [''],
    subjectIds: [[] as number[]]
  });

  ngOnInit() {
    this.loadStreams();
    this.loadSubjects();
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
          this.allSubjects.set(res.subjects || []);
        }
      }
    });
  }

  setTab(tab: 'student' | 'mentor') {
    this.activeTab.set(tab);
  }

  onMentorStreamChange() {
    const rawVal = this.mentorForm.get('streamId')?.value;
    const streamId = Number(rawVal);
    const all = this.allSubjects();

    if (!streamId || streamId === 0) {
      this.mentorAvailableSubjects.set([]);
      this.mentorForm.patchValue({ subjectIds: [] });
      return;
    }

    let filtered: Subject[] = [];
    if (streamId === -1) {
      // Foundation Class 10
      filtered = all.filter(s => s.targetClass === 10);
    } else {
      const selectedStream = this.streams().find(s => s.id === streamId);
      const code = selectedStream?.code;

      if (code === 'PCM') {
        // Physics, Chem, Math in Class 11, 12, plus Class 10 Math & Science
        filtered = all.filter(s =>
          (s.streamId === streamId) ||
          (s.streamId === null && (s.name.includes('Physics') || s.name.includes('Chemistry'))) ||
          (s.targetClass === 10 && (s.name.includes('Mathematics') || s.name.includes('Science')))
        );
      } else if (code === 'PCB') {
        // Physics, Chem, Bio in Class 11, 12, plus Class 10 Science
        filtered = all.filter(s =>
          (s.streamId === streamId) ||
          (s.streamId === null && (s.name.includes('Physics') || s.name.includes('Chemistry'))) ||
          (s.targetClass === 10 && s.name.includes('Science'))
        );
      } else if (code === 'COMM') {
        // Commerce subjects
        filtered = all.filter(s =>
          (s.streamId === streamId) ||
          (s.targetClass === 10 && s.name.includes('Social Science'))
        );
      } else {
        // Arts / Humanities or other
        filtered = all.filter(s =>
          (s.streamId === streamId) ||
          (s.targetClass === 10 && (s.name.includes('English') || s.name.includes('Social Science')))
        );
      }
    }

    this.mentorAvailableSubjects.set(filtered);
    // Auto-select all relevant subjects by default so mentor starts with subjects assigned
    this.mentorForm.patchValue({ subjectIds: filtered.map(s => s.id) });
  }

  isSubjectSelected(id: number): boolean {
    const selected = this.mentorForm.get('subjectIds')?.value || [];
    return selected.includes(id);
  }

  toggleMentorSubject(id: number) {
    const current = this.mentorForm.get('subjectIds')?.value || [];
    if (current.includes(id)) {
      this.mentorForm.patchValue({ subjectIds: current.filter(x => x !== id) });
    } else {
      this.mentorForm.patchValue({ subjectIds: [...current, id] });
    }
  }

  selectAllMentorSubjects() {
    const all = this.mentorAvailableSubjects().map(s => s.id);
    this.mentorForm.patchValue({ subjectIds: all });
  }

  onStudentSubmit() {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      this.notification.warning('Please fill in all required fields correctly.');
      return;
    }

    const val = this.studentForm.value;
    const targetClass = Number(val.targetClass);
    const streamId = val.streamId ? Number(val.streamId) : 0;

    if (targetClass !== 10 && streamId === 0) {
      this.notification.warning('Please select an Academic Stream for Class ' + targetClass + '.');
      return;
    }

    this.isLoading = true;
    this.authService.registerStudent({
      ...val,
      targetClass,
      streamId
    }).subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(err.error?.message || 'Student registration failed.');
      }
    });
  }

  onMentorSubmit() {
    if (this.mentorForm.invalid) {
      this.mentorForm.markAllAsTouched();
      this.notification.warning('Please fill in all required fields correctly.');
      return;
    }

    const val = this.mentorForm.value;
    const streamId = Number(val.streamId);

    if (!streamId || streamId === 0) {
      this.notification.warning('Please choose your Teaching Academic Stream.');
      return;
    }

    this.isLoading = true;
    this.authService.registerMentor({
      username: val.username,
      email: val.email,
      password: val.password,
      streamId: streamId === -1 ? null : streamId,
      designation: val.designation,
      subjectIds: val.subjectIds
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(err.error?.message || 'Mentor registration failed.');
      }
    });
  }
}

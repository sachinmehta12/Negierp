import { Component, OnInit, AfterViewInit, inject, signal, computed, PLATFORM_ID, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Stream, Subject, User, Testimonial } from '../../../core/models/entities';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(ApiService);
  protected readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  // Scroll Animations & Shining State
  scrollProgress = signal<number>(0);
  isScrolled = signal<boolean>(false);
  showBackToTop = signal<boolean>(false);
  activeSection = signal<string>('courses');
  isMobileMenuOpen = signal<boolean>(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  // Dynamic Data
  streams = signal<Stream[]>([]);
  subjects = signal<Subject[]>([]);
  isLoadingStreams = signal<boolean>(true);

  // Dynamic Mentors & Student Results
  mentors = signal<User[]>([]);
  isLoadingMentors = signal<boolean>(true);

  testimonials = signal<Testimonial[]>([]);
  isLoadingTestimonials = signal<boolean>(true);

  // Active Tab for Course Explorer
  activeTab = signal<'class10' | 'pcm' | 'pcb' | 'comm' | 'arts'>('class10');

  // Dynamic Fee Calculator State
  calculatorClass = signal<number>(10);
  selectedSubjectIds = signal<number[]>([]);

  // Computed Calculator Figures
  availableCalculatorSubjects = computed(() => {
    const cls = this.calculatorClass();
    return this.subjects().filter(s => s.targetClass === cls && s.isActive);
  });

  monthlyFeeTotal = computed(() => {
    const selectedIds = this.selectedSubjectIds();
    return this.availableCalculatorSubjects()
      .filter(s => selectedIds.includes(s.id))
      .reduce((sum, s) => sum + (s.monthlyFee || 1500), 0);
  });

  annualGrossFee = computed(() => this.monthlyFeeTotal() * 10);

  scholarshipDiscountPercent = computed(() => {
    const count = this.selectedSubjectIds().length;
    if (count >= 4) return 15;
    if (count >= 3) return 10;
    if (count >= 2) return 5;
    return 0;
  });

  scholarshipSavings = computed(() => {
    return Math.round((this.annualGrossFee() * this.scholarshipDiscountPercent()) / 100);
  });

  annualNetFee = computed(() => {
    return this.annualGrossFee() - this.scholarshipSavings();
  });

  // Admission Enquiry Form
  isSubmittingEnquiry = signal<boolean>(false);
  enquirySubmitted = signal<boolean>(false);
  enquiryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s-]{10,15}$/)]],
    email: ['', [Validators.email]],
    targetClass: [10, [Validators.required]],
    stream: ['General'],
    message: ['']
  });

  ngOnInit() {
    this.loadCatalog();
    this.loadPublicMentors();
    this.loadPublicTestimonials();
  }

  loadPublicMentors() {
    this.isLoadingMentors.set(true);
    this.apiService.getPublicFaculty().subscribe({
      next: (res) => {
        if (res.success) {
          this.mentors.set(res.faculty || []);
        }
        this.isLoadingMentors.set(false);
      },
      error: () => this.isLoadingMentors.set(false)
    });
  }

  loadPublicTestimonials() {
    this.isLoadingTestimonials.set(true);
    this.apiService.getPublicTestimonials().subscribe({
      next: (res) => {
        if (res.success) {
          this.testimonials.set(res.testimonials || []);
        }
        this.isLoadingTestimonials.set(false);
      },
      error: () => this.isLoadingTestimonials.set(false)
    });
  }

  getInitials(name: string): string {
    if (!name) return 'NT';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getMentorDesignation(m: User): string {
    if (m.designation && m.designation.trim()) return m.designation;
    if (m.role === 'owner') return 'Institute Director & Mentor';
    return 'Faculty Mentor';
  }

  getMentorBio(m: User): string {
    if (m.bio && m.bio.trim()) return m.bio;
    if (m.assignedSubjects && m.assignedSubjects.length) {
      return `Specialized mentor for ${m.assignedSubjects.map(s => s.name).join(', ')}.`;
    }
    return 'Dedicated educator focused on conceptual clarity, student motivation, and exam success.';
  }

  loadCatalog() {
    this.isLoadingStreams.set(true);
    this.apiService.getStreams().subscribe({
      next: (res) => {
        if (res.success) {
          this.streams.set(res.streams || []);
        }
      }
    });

    this.apiService.getSubjects().subscribe({
      next: (res) => {
        if (res.success) {
          this.subjects.set(res.subjects || []);
          // Auto select first 2 subjects for initial calculation preview
          const initialSubjects = (res.subjects || [])
            .filter((s: Subject) => s.targetClass === 10)
            .slice(0, 2)
            .map((s: Subject) => s.id);
          this.selectedSubjectIds.set(initialSubjects);
        }
        this.isLoadingStreams.set(false);
      },
      error: () => this.isLoadingStreams.set(false)
    });
  }

  setCalculatorClass(cls: number) {
    this.calculatorClass.set(cls);
    const subjs = this.subjects().filter(s => s.targetClass === cls && s.isActive);
    if (subjs.length > 0) {
      this.selectedSubjectIds.set(subjs.slice(0, 3).map(s => s.id));
    } else {
      this.selectedSubjectIds.set([]);
    }
  }

  toggleSubject(subjectId: number) {
    const current = [...this.selectedSubjectIds()];
    const index = current.indexOf(subjectId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(subjectId);
    }
    this.selectedSubjectIds.set(current);
  }

  isSubjectSelected(subjectId: number): boolean {
    return this.selectedSubjectIds().includes(subjectId);
  }

  submitEnquiry() {
    if (this.enquiryForm.invalid) {
      this.enquiryForm.markAllAsTouched();
      return;
    }

    this.isSubmittingEnquiry.set(true);
    const val = this.enquiryForm.value;

    this.apiService.submitAdmissionEnquiry({
      name: val.name!,
      phone: val.phone!,
      email: val.email || undefined,
      targetClass: Number(val.targetClass),
      stream: val.stream || undefined,
      message: val.message || undefined
    }).subscribe({
      next: (res) => {
        this.isSubmittingEnquiry.set(false);
        this.enquirySubmitted.set(true);
        this.notification.success(res.message || 'Admission inquiry submitted successfully!');
        this.enquiryForm.reset({ targetClass: 10, stream: 'General' });
      },
      error: (err) => {
        this.isSubmittingEnquiry.set(false);
        this.notification.error(err.error?.message || 'Failed to submit inquiry.');
      }
    });
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // 1. Intersection Observer for Scroll Reveals
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    // Register elements for scroll reveal
    setTimeout(() => {
      const elements = document.querySelectorAll('.reveal-on-scroll');
      elements.forEach(el => observer.observe(el));
    }, 120);

    // 2. Window Scroll Tracker (Progress Bar, Sticky Elevation & ScrollSpy)
    const handleScroll = () => {
      const winScroll = window.scrollY || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? Math.min(100, Math.max(0, (winScroll / height) * 100)) : 0;

      this.scrollProgress.set(Math.round(scrolled * 10) / 10);
      this.isScrolled.set(winScroll > 25);
      this.showBackToTop.set(winScroll > 320);

      // Dynamic Section ScrollSpy
      const sections = ['courses', 'fee-calculator', 'enquiry', 'results', 'faculty'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            this.activeSection.set(id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    });
  }

  scrollToTop() {
    if (isPlatformBrowser(this.platformId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  scrollTo(elementId: string) {
    this.closeMobileMenu();
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById(elementId);
      if (el) {
        const navOffset = 78;
        const elementPosition = el.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        this.activeSection.set(elementId);
      }
    }
  }
}

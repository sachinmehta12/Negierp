import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StudentTimetableComponent } from './timetable.component';

describe('StudentTimetableComponent', () => {
  let component: StudentTimetableComponent;
  let fixture: ComponentFixture<StudentTimetableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentTimetableComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentTimetableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

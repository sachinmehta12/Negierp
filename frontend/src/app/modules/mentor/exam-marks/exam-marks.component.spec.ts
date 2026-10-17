import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ExamMarksComponent } from './exam-marks.component';

describe('ExamMarksComponent', () => {
  let component: ExamMarksComponent;
  let fixture: ComponentFixture<ExamMarksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamMarksComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExamMarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

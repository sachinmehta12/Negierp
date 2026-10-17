import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StudentMarksComponent } from './marks.component';

describe('StudentMarksComponent', () => {
  let component: StudentMarksComponent;
  let fixture: ComponentFixture<StudentMarksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentMarksComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentMarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

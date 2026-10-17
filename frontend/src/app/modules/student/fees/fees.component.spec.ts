import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { StudentFeesComponent } from './fees.component';

describe('StudentFeesComponent', () => {
  let component: StudentFeesComponent;
  let fixture: ComponentFixture<StudentFeesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentFeesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentFeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

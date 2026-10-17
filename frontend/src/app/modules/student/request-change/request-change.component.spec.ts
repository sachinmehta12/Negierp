import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StudentRequestChangeComponent } from './request-change.component';

describe('StudentRequestChangeComponent', () => {
  let component: StudentRequestChangeComponent;
  let fixture: ComponentFixture<StudentRequestChangeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentRequestChangeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentRequestChangeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

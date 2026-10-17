import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StudentHomeworkComponent } from './homework.component';

describe('StudentHomeworkComponent', () => {
  let component: StudentHomeworkComponent;
  let fixture: ComponentFixture<StudentHomeworkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentHomeworkComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentHomeworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

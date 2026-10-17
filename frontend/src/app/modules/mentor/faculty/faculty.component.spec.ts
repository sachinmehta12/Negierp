import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FacultyComponent } from './faculty.component';

describe('FacultyComponent', () => {
  let component: FacultyComponent;
  let fixture: ComponentFixture<FacultyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FacultyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

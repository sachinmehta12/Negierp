import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SubjectSelectionComponent } from './subject-selection.component';

describe('SubjectSelectionComponent', () => {
  let component: SubjectSelectionComponent;
  let fixture: ComponentFixture<SubjectSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectSelectionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

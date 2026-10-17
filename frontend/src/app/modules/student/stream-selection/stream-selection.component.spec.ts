import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { StreamSelectionComponent } from './stream-selection.component';

describe('StreamSelectionComponent', () => {
  let component: StreamSelectionComponent;
  let fixture: ComponentFixture<StreamSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreamSelectionComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StreamSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

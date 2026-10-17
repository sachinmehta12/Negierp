import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StreamRequestsComponent } from './stream-requests.component';

describe('StreamRequestsComponent', () => {
  let component: StreamRequestsComponent;
  let fixture: ComponentFixture<StreamRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreamRequestsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StreamRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

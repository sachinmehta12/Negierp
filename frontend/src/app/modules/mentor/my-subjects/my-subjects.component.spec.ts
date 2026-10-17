import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MySubjectsComponent } from './my-subjects.component';

describe('MySubjectsComponent', () => {
  let component: MySubjectsComponent;
  let fixture: ComponentFixture<MySubjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MySubjectsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MySubjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { FeeReceiptComponent } from './fee-receipt.component';

describe('FeeReceiptComponent', () => {
  let component: FeeReceiptComponent;
  let fixture: ComponentFixture<FeeReceiptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeeReceiptComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FeeReceiptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicesIssuedRegisterComponent } from './invoices-issued-register.component';

describe('InvoicesIssuedRegisterComponent', () => {
  let component: InvoicesIssuedRegisterComponent;
  let fixture: ComponentFixture<InvoicesIssuedRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesIssuedRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoicesIssuedRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

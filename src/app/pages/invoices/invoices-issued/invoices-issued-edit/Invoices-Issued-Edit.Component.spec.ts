import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicesIssuedEditComponent } from './Invoices-Issued-Edit.Component';

describe('InvoicesIssuedEditComponent', () => {
  let component: InvoicesIssuedEditComponent;
  let fixture: ComponentFixture<InvoicesIssuedEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesIssuedEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoicesIssuedEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

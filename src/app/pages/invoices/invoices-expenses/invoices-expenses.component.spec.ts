import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicesExpensesComponent } from './invoices-expenses.component';

describe('InvoicesExpensesComponent', () => {
  let component: InvoicesExpensesComponent;
  let fixture: ComponentFixture<InvoicesExpensesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesExpensesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoicesExpensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicesIssuedListComponent } from './invoices-issued-list.component';

describe('BillsListComponent', () => {
  let component: InvoicesIssuedListComponent;
  let fixture: ComponentFixture<InvoicesIssuedListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesIssuedListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoicesIssuedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

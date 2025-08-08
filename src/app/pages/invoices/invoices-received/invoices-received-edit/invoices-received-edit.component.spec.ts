import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicesReceivedEditComponent } from './invoices-received-edit.component';

describe('InvoicesReceivedEditComponent', () => {
  let component: InvoicesReceivedEditComponent;
  let fixture: ComponentFixture<InvoicesReceivedEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesReceivedEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoicesReceivedEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

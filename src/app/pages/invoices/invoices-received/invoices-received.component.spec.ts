import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoicesReceivedComponent } from './invoices-received.component';

describe('InvoicesReceivedComponent', () => {
  let component: InvoicesReceivedComponent;
  let fixture: ComponentFixture<InvoicesReceivedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoicesReceivedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoicesReceivedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

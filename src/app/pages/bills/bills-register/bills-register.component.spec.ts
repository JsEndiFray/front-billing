import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillsRegisterComponent } from './bills-register.component';

describe('BillsRegisterComponent', () => {
  let component: BillsRegisterComponent;
  let fixture: ComponentFixture<BillsRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillsRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillsRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

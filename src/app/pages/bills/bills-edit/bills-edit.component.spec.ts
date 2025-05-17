import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillsEditComponent } from './bills-edit.component';

describe('BillsEditComponent', () => {
  let component: BillsEditComponent;
  let fixture: ComponentFixture<BillsEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillsEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillsEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

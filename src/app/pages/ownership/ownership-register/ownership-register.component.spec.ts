import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnershipRegisterComponent } from './ownership-register.component';

describe('OwnershipRegisterComponent', () => {
  let component: OwnershipRegisterComponent;
  let fixture: ComponentFixture<OwnershipRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnershipRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnershipRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

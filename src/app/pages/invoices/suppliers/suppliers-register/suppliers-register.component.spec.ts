import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuppliersRegisterComponent } from './suppliers-register.component';

describe('SuppliersRegisterComponent', () => {
  let component: SuppliersRegisterComponent;
  let fixture: ComponentFixture<SuppliersRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuppliersRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuppliersRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstateOwnersRegisterComponent } from './estate-owners-register.component';

describe('EstateOwnersRegisterComponent', () => {
  let component: EstateOwnersRegisterComponent;
  let fixture: ComponentFixture<EstateOwnersRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstateOwnersRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstateOwnersRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

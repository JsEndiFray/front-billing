import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersRegisterComponent } from './owners-register.component';

describe('OwnersRegisterComponent', () => {
  let component: OwnersRegisterComponent;
  let fixture: ComponentFixture<OwnersRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnersRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnersRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

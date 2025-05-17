import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstatesRegisterComponent } from './estates-register.component';

describe('EstatesRegisterComponent', () => {
  let component: EstatesRegisterComponent;
  let fixture: ComponentFixture<EstatesRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstatesRegisterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstatesRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

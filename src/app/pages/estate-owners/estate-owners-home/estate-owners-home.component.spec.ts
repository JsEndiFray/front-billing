import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstateOwnersHomeComponent } from './estate-owners-home.component';

describe('EstateOwnersHomeComponent', () => {
  let component: EstateOwnersHomeComponent;
  let fixture: ComponentFixture<EstateOwnersHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstateOwnersHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstateOwnersHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

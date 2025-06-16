import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstateOwnersEditComponent } from './estate-owners-edit.component';

describe('EstateOwnersEditComponent', () => {
  let component: EstateOwnersEditComponent;
  let fixture: ComponentFixture<EstateOwnersEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstateOwnersEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstateOwnersEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

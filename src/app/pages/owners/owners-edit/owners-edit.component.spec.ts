import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersEditComponent } from './owners-edit.component';

describe('OwnersEditComponent', () => {
  let component: OwnersEditComponent;
  let fixture: ComponentFixture<OwnersEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnersEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnersEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

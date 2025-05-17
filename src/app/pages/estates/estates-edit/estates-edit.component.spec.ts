import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstatesEditComponent } from './estates-edit.component';

describe('EstatesEditComponent', () => {
  let component: EstatesEditComponent;
  let fixture: ComponentFixture<EstatesEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstatesEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstatesEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

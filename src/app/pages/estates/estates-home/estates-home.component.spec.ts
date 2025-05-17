import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstatesHomeComponent } from './estates-home.component';

describe('EstatesHomeComponent', () => {
  let component: EstatesHomeComponent;
  let fixture: ComponentFixture<EstatesHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstatesHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstatesHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

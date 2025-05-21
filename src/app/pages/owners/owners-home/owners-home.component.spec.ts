import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnersHomeComponent } from './owners-home.component';

describe('OwnersHomeComponent', () => {
  let component: OwnersHomeComponent;
  let fixture: ComponentFixture<OwnersHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnersHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnersHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnershipHomeComponent } from './ownership-home.component';

describe('OwnershipHomeComponent', () => {
  let component: OwnershipHomeComponent;
  let fixture: ComponentFixture<OwnershipHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnershipHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnershipHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

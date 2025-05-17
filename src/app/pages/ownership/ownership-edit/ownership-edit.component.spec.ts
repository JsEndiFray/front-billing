import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnershipEditComponent } from './ownership-edit.component';

describe('OwnershipEditComponent', () => {
  let component: OwnershipEditComponent;
  let fixture: ComponentFixture<OwnershipEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnershipEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnershipEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

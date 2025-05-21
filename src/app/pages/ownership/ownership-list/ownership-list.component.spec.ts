import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnershipListComponent } from './ownership-list.component';

describe('OwnershipListComponent', () => {
  let component: OwnershipListComponent;
  let fixture: ComponentFixture<OwnershipListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnershipListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnershipListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

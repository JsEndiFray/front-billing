import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstateOwnersListComponent } from './estate-owners-list.component';

describe('EstateOwnersListComponent', () => {
  let component: EstateOwnersListComponent;
  let fixture: ComponentFixture<EstateOwnersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstateOwnersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstateOwnersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

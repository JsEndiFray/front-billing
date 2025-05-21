import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientsEditComponent } from './clients-edit.component';

describe('ClientsEditComponent', () => {
  let component: ClientsEditComponent;
  let fixture: ComponentFixture<ClientsEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientsEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientsEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

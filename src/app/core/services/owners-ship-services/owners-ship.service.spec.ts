import { TestBed } from '@angular/core/testing';

import { OwnersShipService } from './owners-ship.service';

describe('OwnersShipService', () => {
  let service: OwnersShipService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OwnersShipService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { OwnersService } from './owners.service';

describe('OwnersValidatorService', () => {
  let service: OwnersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OwnersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

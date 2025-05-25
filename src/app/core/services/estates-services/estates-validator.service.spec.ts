import { TestBed } from '@angular/core/testing';

import { EstatesValidatorService } from './estates-validator.service';

describe('EstatesValidatorService', () => {
  let service: EstatesValidatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstatesValidatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

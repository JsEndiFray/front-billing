import { TestBed } from '@angular/core/testing';

import { PaymentUtilService } from './payment-util.service';

describe('PaymentUtilService', () => {
  let service: PaymentUtilService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymentUtilService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

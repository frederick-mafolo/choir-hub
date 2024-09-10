import { TestBed } from '@angular/core/testing';

import { PianoService } from './piano.service';

describe('PianoService', () => {
  let service: PianoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PianoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

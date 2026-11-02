import { TestBed } from '@angular/core/testing';

import { KeyTechnologiesService } from './key-technologies-service';

describe('KeyTechnologiesService', () => {
  let service: KeyTechnologiesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KeyTechnologiesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

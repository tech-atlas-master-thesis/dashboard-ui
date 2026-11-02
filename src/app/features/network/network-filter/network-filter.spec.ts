import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkFilter } from './network-filter';

describe('NetworkFilter', () => {
  let component: NetworkFilter;
  let fixture: ComponentFixture<NetworkFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetworkFilter],
    }).compileComponents();

    fixture = TestBed.createComponent(NetworkFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

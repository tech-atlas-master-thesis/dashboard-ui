import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Network } from './network';

describe('BipartiteNetwork', () => {
  let component: Network;
  let fixture: ComponentFixture<Network>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Network],
    }).compileComponents();

    fixture = TestBed.createComponent(Network);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

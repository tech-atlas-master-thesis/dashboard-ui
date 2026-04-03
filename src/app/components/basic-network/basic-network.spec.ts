import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicNetwork } from './basic-network';

describe('BasicNetwork', () => {
  let component: BasicNetwork;
  let fixture: ComponentFixture<BasicNetwork>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicNetwork],
    }).compileComponents();

    fixture = TestBed.createComponent(BasicNetwork);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

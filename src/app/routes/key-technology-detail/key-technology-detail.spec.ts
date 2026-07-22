import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyTechnologyDetail } from './key-technology-detail';

describe('KeyTechnologyDetail', () => {
  let component: KeyTechnologyDetail;
  let fixture: ComponentFixture<KeyTechnologyDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyTechnologyDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(KeyTechnologyDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

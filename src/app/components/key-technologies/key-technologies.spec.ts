import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyTechnologies } from './key-technologies';

describe('KeyTechnologies', () => {
  let component: KeyTechnologies;
  let fixture: ComponentFixture<KeyTechnologies>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyTechnologies],
    }).compileComponents();

    fixture = TestBed.createComponent(KeyTechnologies);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

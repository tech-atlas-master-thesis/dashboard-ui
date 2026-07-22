import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeyTechnologiesFieldNetwork } from './key-technologies-field-network';

describe('KeyTechnologies', () => {
  let component: KeyTechnologiesFieldNetwork;
  let fixture: ComponentFixture<KeyTechnologiesFieldNetwork>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KeyTechnologiesFieldNetwork],
    }).compileComponents();

    fixture = TestBed.createComponent(KeyTechnologiesFieldNetwork);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

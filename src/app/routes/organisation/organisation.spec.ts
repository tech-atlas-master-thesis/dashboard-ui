import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Organisation } from './organisation';

describe('Organisation', () => {
  let component: Organisation;
  let fixture: ComponentFixture<Organisation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Organisation],
    }).compileComponents();

    fixture = TestBed.createComponent(Organisation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

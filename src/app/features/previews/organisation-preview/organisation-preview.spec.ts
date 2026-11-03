import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganisationPreview } from './organisation-preview';

describe('OrganisationDetail', () => {
  let component: OrganisationPreview;
  let fixture: ComponentFixture<OrganisationPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganisationPreview],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganisationPreview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

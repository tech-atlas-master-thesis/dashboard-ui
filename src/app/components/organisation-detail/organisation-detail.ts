import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import {
  Organisation,
  organisationColor,
  organisationTypeName,
} from '@shared/backend/models/network.model';

@Component({
  selector: 'app-organisation-detail',
  imports: [],
  templateUrl: './organisation-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationDetail {
  @Input({ required: true }) organisation!: Organisation;
  @Input() projectCount: number | null = null;
  @Input() cooperationCount: number | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() detailsRequested = new EventEmitter<string>();

  get typeColor(): string {
    return organisationColor(this.organisation.type);
  }

  openDetails(): void {
    this.detailsRequested.emit(this.organisation._id.$oid);
  }

  protected readonly organisationTypeName = organisationTypeName;
}

import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Organisation, organisationColor, organisationTypeName } from '@shared/models/network.model';
import { PreviewCard } from '../../../ui/preview-card/preview-card';

@Component({
  selector: 'app-organisation-preview',
  imports: [PreviewCard],
  templateUrl: './organisation-preview.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationPreview {
  readonly organisation = input.required<Organisation>();
  readonly projectCount = input<number | null>(null);
  readonly cooperationCount = input<number | null>(null);
  readonly closed = output<void>();
  readonly detailsRequested = output<string>();

  protected readonly typeColor = computed(() => organisationColor(this.organisation().type));
  protected readonly typeName = computed(() => organisationTypeName(this.organisation().type));

  openDetails(): void {
    this.detailsRequested.emit(this.organisation()._id.$oid);
  }
}

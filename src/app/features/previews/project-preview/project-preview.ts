import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toTime } from '@shared/utils/network-filter.utils';
import { PROJECT_COLOR, ProjectSelection, projectStatusName } from '@shared/models/network.model';
import { PreviewCard } from '../../../ui/preview-card/preview-card';

@Component({
  selector: 'app-project-preview',
  imports: [PreviewCard, DatePipe],
  templateUrl: './project-preview.html',
  styleUrl: './project-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPreview {
  readonly selection = input.required<ProjectSelection>();
  readonly closed = output<void>();
  readonly detailsRequested = output<string>();

  protected readonly typeColor = PROJECT_COLOR;
  protected readonly project = computed(() => this.selection().project);
  protected readonly title = computed(() => this.project().title || this.project().short);
  protected readonly start = computed(() => toTime(this.project().start));
  protected readonly end = computed(() => toTime(this.project().end));
  protected readonly statusName = computed(() => projectStatusName(this.project().status!));
  protected readonly partnerCount = computed(() => this.selection().organisations.length);

  openDetails(): void {
    this.detailsRequested.emit(this.project()._id);
  }
}

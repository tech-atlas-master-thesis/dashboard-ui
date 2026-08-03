import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toTime } from '@shared/backend/utils/network-filter.utils';
import { ProjectSelection, projectStatusName } from '@shared/backend/models/network.model';

@Component({
  selector: 'app-project-detail',
  imports: [DatePipe],
  templateUrl: './project-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetail {
  @Input({ required: true }) selection!: ProjectSelection;
  @Output() closed = new EventEmitter<void>();

  readonly typeColor = '#475569';

  get start(): number | null {
    return toTime(this.selection.project.start);
  }
  get end(): number | null {
    return toTime(this.selection.project.end);
  }

  protected readonly projectStatusName = projectStatusName;
}

import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toTime } from '@shared/backend/utils/network-filter.utils';
import {
  PROJECT_COLOR,
  ProjectSelection,
  projectStatusName,
} from '@shared/backend/models/network.model';

@Component({
  selector: 'app-project-detail',
  imports: [DatePipe],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetail {
  @Input({ required: true }) selection!: ProjectSelection;
  @Output() closed = new EventEmitter<void>();
  @Output() detailsRequested = new EventEmitter<string>();

  readonly typeColor = PROJECT_COLOR;

  get start(): number | null {
    return toTime(this.selection.project.start);
  }
  get end(): number | null {
    return toTime(this.selection.project.end);
  }

  openDetails(): void {
    this.detailsRequested.emit(this.selection.project._id);
  }

  protected readonly projectStatusName = projectStatusName;
}

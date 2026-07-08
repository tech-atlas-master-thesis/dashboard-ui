import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatasetsState } from '../../state/datasets/datasets.state';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dataset-select',
  imports: [FormsModule, DatePipe],
  templateUrl: './dataset-select.html',
  styleUrl: './dataset-select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetSelect {
  datasetState = inject(DatasetsState);
}

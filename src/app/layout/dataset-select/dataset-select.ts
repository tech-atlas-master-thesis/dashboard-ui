import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DatasetsState } from '../../state/datasets/datasets.state';
import { DataSetModel } from '@shared/models/datasets.model';
import { Icon } from '../../ui/icon/icon';
import { ClickOutside } from '../../ui/click-outside/click-outside';

@Component({
  selector: 'app-dataset-select',
  imports: [DatePipe, Icon, ClickOutside],
  templateUrl: './dataset-select.html',
  styleUrl: './dataset-select.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatasetSelect {
  datasetState = inject(DatasetsState);

  readonly open = signal(false);
  readonly peeked = signal<string | null>(null);
  readonly datasets = computed<DataSetModel[]>(() => this.datasetState.datasets.value() ?? []);
  readonly current = computed(() => this.datasets().find((d) => d._id === this.datasetState.selectedDataset()) ?? null);

  private readonly shown = computed(() => {
    const peeked = this.peeked();
    return peeked ? (this.datasets().find((d) => d._id === peeked) ?? null) : this.current();
  });

  readonly kpis = computed<{ label: string; value: string }[]>(() => {
    const int = (n: number | null | undefined) => (typeof n === 'number' ? n.toLocaleString('de-AT') : '?');
    const dataset = this.shown();

    return [
      { label: 'Projekte', value: int(dataset?.projects) },
      { label: 'Organisationen', value: int(dataset?.organisations) },
      { label: 'Projekte ab', value: this.month(dataset?.from) },
    ];
  });

  private month(value: string | null | undefined): string {
    if (!value) return '?';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '?';

    return date.toLocaleDateString('de-AT', { month: '2-digit', year: 'numeric' });
  }

  toggle(): void {
    const open = !this.open();
    this.open.set(open);
    if (!open) this.peeked.set(null);
  }

  close(): void {
    this.open.set(false);
    this.peeked.set(null);
  }

  pickPipeline(pipeline: string): void {
    if (pipeline === this.datasetState.selectedPipeline()) return;
    this.peeked.set(null);
    this.datasetState.selectedPipeline.set(pipeline);
  }

  pickDataset(id: string): void {
    this.datasetState.selectedDataset.set(id);
    this.close();
  }
}

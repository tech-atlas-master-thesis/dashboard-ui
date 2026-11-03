import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DatasetsState } from '../../state/datasets/datasets.state';
import { Icon } from '../../ui/icon/icon';
import { ClickOutside } from '../../ui/click-outside/click-outside';

interface DatasetStats {
  projects?: number | null;
  organisations?: number | null;
  from?: number | string | null;
  to?: number | string | null;
}

interface DatasetEntry { _id: string; pipeline: string; created: { at: string }; stats?: DatasetStats }

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
  readonly datasets = computed(() => (this.datasetState.datasets.value() ?? []) as DatasetEntry[]);
  readonly current = computed(() => this.datasets().find((d) => d._id === this.datasetState.selectedDataset()) ?? null);

  private readonly shown = computed(() => {
    const peeked = this.peeked();
    return peeked ? (this.datasets().find((d) => d._id === peeked) ?? null) : this.current();
  });

  readonly kpis = computed<{ label: string; value: string }[]>(() => {
    const int = (n: number | null | undefined) => (typeof n === 'number' ? n.toLocaleString('de-AT') : '?');
    const stats = this.shown()?.stats;
    const from = stats?.from ?? null;
    const to = stats?.to ?? null;

    return [
      { label: 'Projekte', value: int(stats?.projects) },
      { label: 'Organisationen', value: int(stats?.organisations) },
      { label: 'Zeitraum', value: from || to ? `${from ?? '?'}–${to ?? '?'}` : '?' },
    ];
  });

  toggle(): void {
    this.open.update((open) => !open);
    if (!this.open()) this.peeked.set(null);
  }

  close(): void {
    this.open.set(false);
    this.peeked.set(null);
  }

  pickPipeline(pipeline: string): void {
    this.datasetState.selectedPipeline.set(pipeline);
  }

  pickDataset(id: string): void {
    this.datasetState.selectedDataset.set(id);
    this.close();
  }

  countFor(pipeline: string): number {
    return this.datasets().filter((d) => d.pipeline === pipeline).length;
  }
}

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DatasetsState } from '../../state/datasets/datasets.state';
import { DataSetModel } from '@shared/models/datasets.model';

@Component({
  selector: 'app-print-header',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: none;
    }

    @media print {
      :host {
        display: block;
      }
    }
  `,
  template: `
    <div class="mb-4 flex items-baseline justify-between gap-6 border-b border-gray-300 pb-2 text-[10px] text-gray-500">
      <p class="font-semibold text-gray-900">Austrian TechAtlas</p>

      @if (dataset(); as d) {
        <p>{{ d.pipelineName }} · Stand {{ d.created.at | date: 'dd.MM.yyyy HH:mm' }}</p>
        <p class="tabular-nums">{{ int(d.projects) }} Projekte · {{ int(d.organisations) }} Organisationen · ab {{ month(d.from) }}</p>
      }

      <p class="tabular-nums">Gedruckt {{ today | date: 'dd.MM.yyyy' }}</p>
    </div>
  `,
})
export class PrintHeader {
  private readonly state = inject(DatasetsState);

  protected readonly today = new Date();

  protected readonly dataset = computed<DataSetModel | null>(() => {
    const id = this.state.selectedDataset();
    return (this.state.datasets.value() ?? []).find((d) => d._id === id) ?? null;
  });

  protected int(value: number | null | undefined): string {
    return typeof value === 'number' ? value.toLocaleString('de-AT') : '?';
  }

  protected month(value: string | null | undefined): string {
    if (!value) return '?';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '?' : date.toLocaleDateString('de-AT', { month: '2-digit', year: 'numeric' });
  }
}

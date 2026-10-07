import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Output,
  signal,
} from '@angular/core';
import { AnalysisService } from '@shared/backend/services/analysis-service';
import { FieldMetricsRow } from '@shared/backend/models/analysis.model';

type SortKey =
  | 'label'
  | 'projects'
  | 'organisations'
  | 'cooperations'
  | 'degreeMean'
  | 'projectsWithoutPartnerShare'
  | 'componentsFromTwo'
  | 'isolatedShare'
  | 'academicLeadShare';

@Component({
  selector: 'app-metrics',
  imports: [],
  templateUrl: './metrics.html',
  styleUrl: './metrics.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Metrics {
  public service = inject(AnalysisService);

  @Output() fieldSelected = new EventEmitter<string>();

  sortKey = signal<SortKey>('projects');
  sortDir = signal<'asc' | 'desc'>('desc');

  rows = computed<FieldMetricsRow[]>(() => {
    const data = this.service.fields.value();
    if (!data?.fields?.length) return [];

    const key = this.sortKey();
    const dir = this.sortDir();

    return [...data.fields].sort((a, b) => {
      if (key === 'label') {
        return dir === 'asc'
          ? a.label.localeCompare(b.label, 'de')
          : b.label.localeCompare(a.label, 'de');
      }
      return dir === 'asc'
        ? (a[key] as number) - (b[key] as number)
        : (b[key] as number) - (a[key] as number);
    });
  });

  total = computed(() => this.service.fields.value()?.total ?? null);

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set(key === 'label' ? 'asc' : 'desc');
    }
  }

  isSorted(key: SortKey): boolean {
    return this.sortKey() === key;
  }

  caret(key: SortKey): string {
    if (this.sortKey() !== key) return '';
    return this.sortDir() === 'desc' ? '↓' : '↑';
  }

  openField(row: FieldMetricsRow): void {
    this.fieldSelected.emit(row._id);
  }

  int(n: number): string {
    return (n ?? 0).toLocaleString('de-AT');
  }

  dec(n: number, d = 1): string {
    return (n ?? 0).toFixed(d).replace('.', ',');
  }

  pct(n: number, d = 1): string {
    return ((n ?? 0) * 100).toFixed(d).replace('.', ',') + ' %';
  }
}

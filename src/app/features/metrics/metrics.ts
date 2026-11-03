import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { AnalysisService } from '@shared/services/analysis-service';
import { FieldMetricsRow } from '@shared/models/analysis.model';
import { Spinner } from '../../ui/spinner/spinner';

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

interface MetricColumn {
  key: Exclude<SortKey, 'label'>;
  label: string;
  value: (row: FieldMetricsRow) => string;
  hint: string;
}

@Component({
  selector: 'app-metrics',
  imports: [Spinner],
  templateUrl: './metrics.html',
  styleUrl: './metrics.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Metrics {
  public service = inject(AnalysisService);

  readonly fieldSelected = output<string>();

  sortKey = signal<SortKey>('projects');
  sortDir = signal<'asc' | 'desc'>('desc');

  readonly columns: readonly MetricColumn[] = [
    {
      key: 'projects',
      label: 'Projekte',
      value: (row) => this.int(row.projects),
      hint: 'Geförderte Projekte, die mindestens einer Technologie dieses Felds zugeordnet sind.',
    },
    {
      key: 'organisations',
      label: 'Organisationen',
      value: (row) => this.int(row.organisations),
      hint: 'Beteiligte Organisationen, jede einmal gezählt — egal an wie vielen Projekten sie mitarbeitet.',
    },
    {
      key: 'cooperations',
      label: 'Kooperationen',
      value: (row) => this.int(row.cooperations),
      hint:
        'Paare von Organisationen, die mindestens einmal gemeinsam in einem Projekt sitzen. ' +
        'Ein Paar zählt einmal, auch wenn es mehrfach zusammenarbeitet.',
    },
    {
      key: 'degreeMean',
      label: 'Ø Partner',
      value: (row) => this.dec(row.degreeMean),
      hint: 'Mit wie vielen verschiedenen Organisationen eine Organisation im Schnitt zusammenarbeitet.',
    },
    {
      key: 'projectsWithoutPartnerShare',
      label: 'Einzelprojekte',
      value: (row) => this.pct(row.projectsWithoutPartnerShare, 0),
      hint: 'Anteil der Projekte mit nur einem Beteiligten. Dort entsteht keine Zusammenarbeit.',
    },
    {
      key: 'componentsFromTwo',
      label: 'Teilnetze',
      value: (row) => this.int(row.componentsFromTwo),
      hint:
        'Gruppen von Organisationen, die über gemeinsame Projekte untereinander verbunden sind, ' +
        'aber keine Verbindung zu den übrigen Gruppen haben. Gezählt ab zwei Organisationen.',
    },
    {
      key: 'isolatedShare',
      label: 'Isoliert',
      value: (row) => this.pct(row.isolatedShare),
      hint: 'Anteil der Organisationen, die in diesem Feld mit niemandem zusammenarbeiten. ' + 'In einem anderen Feld können sie gut vernetzt sein.',
    },
    {
      key: 'academicLeadShare',
      label: 'Wiss. Leitung',
      value: (row) => this.pct(row.academicLeadShare, 0),
      hint: 'Anteil der Projekte, deren Konsortialführer eine Universität, Fachhochschule oder außeruniversitäre Forschungseinrichtung ist.',
    },
  ];

  rows = computed<FieldMetricsRow[]>(() => {
    const data = this.service.fields.value();
    if (!data?.fields?.length) return [];

    const key = this.sortKey();
    const dir = this.sortDir();

    return [...data.fields].sort((a, b) => {
      if (key === 'label') {
        return dir === 'asc' ? a.label.localeCompare(b.label, 'de') : b.label.localeCompare(a.label, 'de');
      }
      return dir === 'asc' ? (a[key] as number) - (b[key] as number) : (b[key] as number) - (a[key] as number);
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

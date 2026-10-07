import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProjectService } from '@shared/backend/services/project-service';
import {
  ParticipantRow,
  RecurringProjectRow,
  TechnologyField,
  TechnologyRef,
} from '@shared/backend/models/project.model';
import {
  organisationColor,
  organisationTypeName,
  PROJECT_COLOR,
  projectStatusName,
} from '@shared/backend/models/network.model';
import {
  cityOnly,
  cleanKeywords,
  isRunning,
  oid,
  toDate,
  toParagraphs,
} from '@shared/backend/utils/details.utils';

@Component({
  selector: 'app-project',
  imports: [],
  templateUrl: './project.html',
  styleUrl: './project.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Project {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly service = inject(ProjectService);

  private readonly origin = signal<{ url: string | null; label: string | null }>({
    url: null,
    label: null,
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.service.selectedId.set(params.get('id') ?? '');
      this.abstractOpen.set(false);
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.origin.set({ url: params.get('from'), label: params.get('fromLabel') });
    });
  }

  readonly project = computed(() => this.service.data.value()?.project ?? null);
  readonly metrics = computed(() => this.service.data.value()?.metrics ?? null);
  readonly participants = computed(() => this.service.data.value()?.participants ?? []);
  readonly technologyFields = computed(() => this.service.data.value()?.technologyFields ?? []);
  readonly recurring = computed(() => this.service.data.value()?.recurring ?? []);

  protected readonly projectColor = PROJECT_COLOR;

  readonly running = computed(() => isRunning(this.project()?.status));

  readonly keywords = computed(() => cleanKeywords(this.project()?.keywords));

  readonly abstractOpen = signal(false);

  readonly paragraphs = computed(() => toParagraphs(this.project()?.abstract));

  readonly hasAbstract = computed(() => this.paragraphs().length > 0);

  readonly abstractTruncated = computed(() => {
    const characters = this.paragraphs().join(' ').length;
    return this.paragraphs().length > 1 || characters > 320;
  });

  readonly typeMix = computed(() => {
    const metrics = this.metrics();
    if (!metrics) return [];
    const total = Object.values(metrics.types).reduce((sum, value) => sum + value, 0) || 1;
    return Object.entries(metrics.types)
      .map(([type, count]) => ({
        type,
        name: type === 'Unbekannt' ? type : organisationTypeName(type),
        count,
        share: (count / total) * 100,
        color: type === 'Unbekannt' ? '#d1d5db' : organisationColor(type),
      }))
      .sort((a, b) => {
        if (a.type === 'Unbekannt') return 1;
        if (b.type === 'Unbekannt') return -1;
        return b.count - a.count;
      });
  });

  readonly withoutType = computed(
    () => this.participants().filter((participant) => !participant.type).length,
  );

  readonly backLabel = computed(() => this.origin().label ?? 'Zurück zur Übersicht');

  toggleAbstract(): void {
    this.abstractOpen.update((open) => !open);
  }

  colorOfType(type: string | null | undefined): string {
    return type ? organisationColor(type) : '#d1d5db';
  }

  typeName(type: string | null | undefined): string {
    return type ? organisationTypeName(type) : '';
  }

  goBack(): void {
    const url = this.origin().url;
    if (url) {
      this.router.navigateByUrl(url);
      return;
    }
    this.router.navigate(['/key-technologies']);
  }

  openOrganisation(participant: ParticipantRow): void {
    this.router.navigate(['/organisation', oid(participant._id)], {
      queryParams: this.handover(),
    });
  }

  openProject(row: RecurringProjectRow): void {
    this.router.navigate(['/project', row._id], { queryParams: this.handover() });
  }

  openField(group: TechnologyField): void {
    if (!group._id) return;
    this.router.navigate(['/key-technologies'], {
      queryParams: { field: group._id, mode: 'network' },
    });
  }

  openTechnology(technology: TechnologyRef): void {
    const id = technology.short || technology.label;
    if (!id) return;
    this.router.navigate(['/key-technologies', id], { queryParams: this.handover() });
  }

  private handover() {
    return { from: this.router.url, fromLabel: `Zurück zu ${this.label()}` };
  }

  label(): string {
    const project = this.project();
    return project?.short || project?.title || 'Projekt';
  }

  statusName(status: string | null | undefined): string {
    return status ? projectStatusName(status) : '';
  }

  shortLabel(row: { short: string | null; title: string | null }): string {
    return row.short || row.title || 'Ohne Titel';
  }

  location(participant: ParticipantRow): string {
    return cityOnly(participant.address?.city) || participant.address?.country || '—';
  }

  int(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('de-AT');
  }

  month(value: unknown): string {
    const date = toDate(value as never);
    if (!date) return '—';
    return date.toLocaleDateString('de-AT', { month: '2-digit', year: 'numeric' });
  }

  duration(): string {
    const project = this.project();
    if (!project) return '—';
    return `${this.month(project.start)} – ${this.month(project.end)}`;
  }

  years(row: { start: unknown; end: unknown }): string {
    const from = toDate(row.start as never);
    const to = toDate(row.end as never);
    if (!from && !to) return '—';
    const start = from ? from.getFullYear() : '?';
    const end = to ? to.getFullYear() : '?';
    return start === end ? String(start) : `${start}–${end}`;
  }

  protected readonly oid = oid;
}

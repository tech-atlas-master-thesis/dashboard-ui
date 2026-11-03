import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { useOrigin } from '@shared/navigation/origin';
import { ProjectService } from '@shared/services/project-service';
import { ParticipantRow, RecurringProjectRow, TechnologyField, TechnologyRef } from '@shared/models/project.model';
import { organisationColor, organisationTypeName, PROJECT_COLOR, projectStatusName } from '@shared/models/network.model';
import { cityOnly, cleanKeywords, isRunning, oid, toDate, toParagraphs } from '@shared/utils/details.utils';
import { Spinner } from '../../ui/spinner/spinner';
import { Section } from '../../ui/section/section';
import { Field } from '../../ui/field/field';
import { StatCard } from '../../ui/stat-card/stat-card';

@Component({
  selector: 'app-project',
  imports: [Spinner, Section, Field, StatCard],
  templateUrl: './project.html',
  styleUrl: './project.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Project {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly service = inject(ProjectService);
  protected readonly nav = useOrigin({ title: () => this.label() });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.service.selectedId.set(params.get('id') ?? '');
      this.abstractOpen.set(false);
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

  readonly withoutType = computed(() => this.participants().filter((participant) => !participant.type).length);

  toggleAbstract(): void {
    this.abstractOpen.update((open) => !open);
  }

  colorOfType(type: string | null | undefined): string {
    return type ? organisationColor(type) : '#d1d5db';
  }

  typeName(type: string | null | undefined): string {
    return type ? organisationTypeName(type) : '';
  }

  openOrganisation(participant: ParticipantRow): void {
    this.router.navigate(['/organisation', oid(participant._id)], this.nav.handover());
  }

  openProject(row: RecurringProjectRow): void {
    this.router.navigate(['/project', row._id], this.nav.handover());
  }

  openField(group: TechnologyField): void {
    if (!group._id) return;
    this.router.navigate(['/key-technologies'], {
      queryParams: { field: group._id, mode: 'network' },
    });
  }

  openTechnology(group: TechnologyField, technology: TechnologyRef): void {
    const id = technology.short;
    if (!id) return;
    this.router.navigate(['/key-technologies', group._id, id], this.nav.handover());
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

  int(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('de-AT');
  }
}

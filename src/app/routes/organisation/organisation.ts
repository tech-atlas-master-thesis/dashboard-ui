import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { useOrigin } from '@shared/navigation/origin';
import { OrganisationService } from '@shared/services/organisation-service';
import { FieldProfileRow, OrganisationProjectRow } from '@shared/models/organisation.model';
import { organisationColor, organisationTypeName } from '@shared/models/network.model';
import { cityOnly, countRunning, oid, titleCase, toDate } from '@shared/utils/details.utils';
import { Spinner } from '../../ui/spinner/spinner';
import { Section } from '../../ui/section/section';
import { Field } from '../../ui/field/field';
import { StatCard } from '../../ui/stat-card/stat-card';

@Component({
  selector: 'app-organisation',
  imports: [Spinner, Section, Field, StatCard],
  templateUrl: './organisation.html',
  styleUrl: './organisation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Organisation {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly service = inject(OrganisationService);
  protected readonly nav = useOrigin({ title: () => this.organisation()?.name ?? 'Organisation' });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => this.service.selectedId.set(params.get('id') ?? ''));
  }

  readonly organisation = computed(() => this.service.data.value()?.organisation ?? null);
  readonly metrics = computed(() => this.service.data.value()?.metrics ?? null);
  readonly fields = computed(() => this.service.data.value()?.fields ?? []);
  readonly partners = computed(() => this.service.data.value()?.partners ?? []);
  readonly programmes = computed(() => this.service.data.value()?.fundingLines ?? []);
  readonly projects = computed(() => this.service.data.value()?.projects ?? []);
  readonly typeColor = computed(() => organisationColor(this.organisation()?.type));

  readonly addressLines = computed(() => {
    const address = this.organisation()?.address;
    if (!address) return [];
    const street = [address.street, address.house_number].filter(Boolean).join(' ');
    const city = [address.postal_code, cityOnly(address.city)].filter(Boolean).join(' ');
    const country = address.country_code ? [titleCase(address.country), `(${address.country_code})`].filter(Boolean).join(' ') : titleCase(address.country);
    return [street, city, country].filter((line) => line.trim().length > 0);
  });

  readonly running = computed(() => {
    const status = this.metrics()?.status;
    return status ? countRunning(status) : 0;
  });

  private readonly maxFieldCount = computed(() => Math.max(1, ...this.fields().map((field) => field.projects)));

  private readonly maxProgrammeCount = computed(() => Math.max(1, ...this.programmes().map((programme) => programme.projects)));

  readonly fieldCount = computed(() => {
    const metrics = this.metrics();
    return metrics ? `(${metrics.fields} von ${metrics.fieldsTotal})` : '';
  });

  barWidth(count: number): string {
    return `${Math.round((count / this.maxFieldCount()) * 100)}%`;
  }

  programmeBarWidth(count: number): string {
    return `${Math.round((count / this.maxProgrammeCount()) * 100)}%`;
  }

  fieldShare(field: FieldProfileRow): string {
    return `${Math.round(field.share * 100)} %`;
  }

  fieldColor(field: FieldProfileRow): string {
    return field.style?.color ?? '#94a3b8';
  }

  colorOfType(type: string | null | undefined): string {
    return organisationColor(type);
  }

  typeName(type: string | null | undefined): string {
    return type ? organisationTypeName(type) : '';
  }

  openProject(row: OrganisationProjectRow): void {
    this.router.navigate(['/project', row._id], { queryParams: this.nav.handover() });
  }

  openField(field: FieldProfileRow): void {
    this.router.navigate(['/key-technologies'], {
      queryParams: { field: field._id, mode: 'network' },
    });
  }

  openPartner(id: string): void {
    this.router.navigate(['/organisation', id], { queryParams: this.nav.handover() });
  }

  label(row: { short: string | null; title: string | null }): string {
    return row.short || row.title || 'Ohne Titel';
  }

  int(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('de-AT');
  }

  dec(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('de-AT', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  }

  year(value: unknown): string {
    const date = toDate(value as never);
    return date ? String(date.getFullYear()) : '—';
  }

  period(row: { start: unknown; end: unknown }): string {
    const from = this.year(row.start);
    const to = this.year(row.end);
    return from === to ? from : `${from}–${to}`;
  }

  protected readonly oid = oid;
}

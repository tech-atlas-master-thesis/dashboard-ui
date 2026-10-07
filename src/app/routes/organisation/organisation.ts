import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrganisationService } from '@shared/backend/services/organisation-service';
import { FieldProfileRow, OrganisationProjectRow } from '@shared/backend/models/organisation.model';
import { organisationColor, organisationTypeName } from '@shared/backend/models/network.model';
import {
  cityOnly,
  countRunning,
  oid,
  titleCase,
  toDate,
} from '@shared/backend/utils/details.utils';

@Component({
  selector: 'app-organisation',
  imports: [],
  templateUrl: './organisation.html',
  styleUrl: './organisation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Organisation {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly service = inject(OrganisationService);

  private readonly origin = signal<{ url: string | null; label: string | null }>({
    url: null,
    label: null,
  });

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe((params) => this.service.selectedId.set(params.get('id') ?? ''));

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.origin.set({ url: params.get('from'), label: params.get('fromLabel') });
    });
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
    const country = address.country_code
      ? [titleCase(address.country), `(${address.country_code})`].filter(Boolean).join(' ')
      : titleCase(address.country);
    return [street, city, country].filter((line) => line.trim().length > 0);
  });

  readonly running = computed(() => {
    const status = this.metrics()?.status;
    return status ? countRunning(status) : 0;
  });

  private readonly maxFieldCount = computed(() =>
    Math.max(1, ...this.fields().map((field) => field.projects)),
  );

  private readonly maxProgrammeCount = computed(() =>
    Math.max(1, ...this.programmes().map((programme) => programme.projects)),
  );

  readonly fieldSum = computed(() => this.metrics()?.fieldAssignments ?? 0);

  readonly multiField = computed(() => this.fieldSum() > (this.metrics()?.projects ?? 0));

  readonly backLabel = computed(() => this.origin().label ?? 'Zurück zur Übersicht');

  barWidth(count: number): string {
    return `${Math.round((count / this.maxFieldCount()) * 100)}%`;
  }

  programmeBarWidth(count: number): string {
    return `${Math.round((count / this.maxProgrammeCount()) * 100)}%`;
  }

  markerLeft(): string {
    return `${Math.round((this.metrics()?.specialisation ?? 0) * 100)}%`;
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

  goBack(): void {
    const url = this.origin().url;
    if (url) {
      this.router.navigateByUrl(url);
      return;
    }
    this.router.navigate(['/key-technologies']);
  }

  openProject(row: OrganisationProjectRow): void {
    this.router.navigate(['/project', row._id], { queryParams: this.handover() });
  }

  openField(field: FieldProfileRow): void {
    this.router.navigate(['/key-technologies'], {
      queryParams: { field: field._id, mode: 'network' },
    });
  }

  openPartner(id: string): void {
    this.router.navigate(['/organisation', id], { queryParams: this.handover() });
  }

  private handover() {
    return {
      from: this.router.url,
      fromLabel: `Zurück zu ${this.organisation()?.name ?? 'Organisation'}`,
    };
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

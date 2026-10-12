import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import {
  NetworkData,
  NetworkFilters,
  emptyFilters,
  organisationColor,
  projectStatusName,
  organisationTypeName,
} from '@shared/backend/models/network.model';
import { NO_VALUE, matchesFilters } from '@shared/backend/utils/network-filter.utils';

export type Facet = 'date' | 'statuses' | 'organisationTypes' | 'programmes';

type ListFacet = 'statuses' | 'organisationTypes' | 'programmes';

type ProjectFacet = Parameters<typeof matchesFilters>[2];

type CountFacet = NonNullable<ProjectFacet> | 'organisationTypes';

const NO_VALUE_LABEL: Record<ListFacet, string> = {
  statuses: 'Ohne Status',
  organisationTypes: 'Ohne Typ',
  programmes: 'Ohne Programmlinie',
};

const byCount = (a: { count: number }, b: { count: number }) => b.count - a.count;

@Component({
  selector: 'app-network-filter',
  imports: [],
  templateUrl: './network-filter.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkFilter {
  @Input({ required: true }) set data(d: NetworkData | null) {
    this._data.set(d);
  }
  @Input({ required: true }) set filters(f: NetworkFilters) {
    this._filters.set(f);
  }
  @Output() filtersChange = new EventEmitter<NetworkFilters>();

  private _data = signal<NetworkData | null>(null);
  private _filters = signal<NetworkFilters>(emptyFilters());

  current = computed(() => this._filters());

  private readonly allowedOrgIds = computed(() => {
    const types = this._filters().organisationTypes;
    if (!types.length) return null;
    return new Set(
      (this._data()?.nodes ?? [])
        .filter((n) => types.includes(n.type || NO_VALUE))
        .map((n) => n._id.$oid),
    );
  });

  private survivingProjects(except?: CountFacet) {
    const projects = this._data()?.projects ?? [];
    const f = this._filters();

    const projectFacet: ProjectFacet = except === 'organisationTypes' ? undefined : except;
    const base = projects.filter((p) => matchesFilters(p, f, projectFacet));

    if (except === 'organisationTypes') return base;

    const allowed = this.allowedOrgIds();
    if (!allowed) return base;

    return base.filter((p) => p.organisations.some((id) => allowed.has(id)));
  }

  readonly openFacet = signal<Facet | null>(null);

  toggleFacet(facet: Facet): void {
    this.openFacet.update((open) => (open === facet ? null : facet));
  }

  closeMenu(): void {
    this.openFacet.set(null);
  }

  private readonly activeCount = computed(() => {
    const f = this._filters();
    return (
      (f.programmes.length ? 1 : 0) +
      (f.statuses.length ? 1 : 0) +
      (f.organisationTypes.length ? 1 : 0) +
      (f.dateFrom || f.dateTo ? 1 : 0)
    );
  });

  readonly filtered = computed(() => this.activeCount() > 0);

  private readonly matched = computed(() => this.survivingProjects());

  readonly matchedProjects = computed(() => this.matched().length);

  readonly totalProjects = computed(() => this._data()?.projects.length ?? 0);

  programmes = computed(() => {
    const names = new Map<string, string>();
    const counts = new Map<string, number>();

    for (const project of this.survivingProjects('programmes')) {
      const id = project.programme?._id ?? NO_VALUE;
      names.set(id, project.programme?.name ?? NO_VALUE_LABEL.programmes);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    for (const id of this._filters().programmes) {
      if (counts.has(id)) continue;
      const name = (this._data()?.projects ?? []).find((p) => p.programme?._id === id)?.programme
        ?.name;
      names.set(id, name ?? NO_VALUE_LABEL.programmes);
      counts.set(id, 0);
    }

    return [...names]
      .map(([key, name]) => ({ id: key, key, name, count: counts.get(key) ?? 0 }))
      .sort((a, b) => byCount(a, b) || a.name.localeCompare(b.name));
  });

  statuses = computed(() => {
    const counts = new Map<string, number>();

    for (const project of this.survivingProjects('statuses')) {
      const key = project.status || NO_VALUE;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const status of this._filters().statuses) {
      if (!counts.has(status)) counts.set(status, 0);
    }

    return [...counts]
      .map(([key, count]) => ({
        key,
        label: key === NO_VALUE ? NO_VALUE_LABEL.statuses : projectStatusName(key),
        count,
      }))
      .sort((a, b) => byCount(a, b) || a.label.localeCompare(b.label));
  });

  organisationTypes = computed(() => {
    const active = new Set<string>();
    for (const project of this.survivingProjects('organisationTypes')) {
      for (const id of project.organisations) active.add(id);
    }

    const counts = new Map<string, number>();
    for (const node of this._data()?.nodes ?? []) {
      if (!active.has(node._id.$oid)) continue;
      const key = node.type || NO_VALUE;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (const type of this._filters().organisationTypes) {
      if (!counts.has(type)) counts.set(type, 0);
    }

    return [...counts]
      .map(([key, count]) => ({
        key,
        label: key === NO_VALUE ? NO_VALUE_LABEL.organisationTypes : organisationTypeName(key),
        color: key === NO_VALUE ? '#d1d5db' : organisationColor(key),
        count,
      }))
      .sort((a, b) => byCount(a, b) || a.label.localeCompare(b.label));
  });

  private readonly maxProgramme = computed(() =>
    Math.max(1, ...this.programmes().map((p) => p.count)),
  );

  private readonly maxStatus = computed(() => Math.max(1, ...this.statuses().map((s) => s.count)));

  private readonly maxType = computed(() =>
    Math.max(1, ...this.organisationTypes().map((t) => t.count)),
  );

  programmeWidth(count: number): string {
    return `${Math.round((count / this.maxProgramme()) * 100)}%`;
  }

  statusWidth(count: number): string {
    return `${Math.round((count / this.maxStatus()) * 100)}%`;
  }

  typeWidth(count: number): string {
    return `${Math.round((count / this.maxType()) * 100)}%`;
  }

  facetSummary(facet: Facet): string {
    const f = this._filters();

    if (facet === 'date') return this.dateLabel();

    const chosen = f[facet];
    if (!chosen.length) return '';

    const total = this.optionCount(facet);
    if (chosen.length === 1) return this.nameOf(facet, chosen[0]);
    return `${chosen.length} von ${total}`;
  }

  private optionCount(facet: ListFacet): number {
    if (facet === 'statuses') return this.statuses().length;
    if (facet === 'organisationTypes') return this.organisationTypes().length;
    return this.programmes().length;
  }

  private nameOf(facet: ListFacet, value: string): string {
    if (value === NO_VALUE) return NO_VALUE_LABEL[facet];
    if (facet === 'statuses') return projectStatusName(value);
    if (facet === 'organisationTypes') return organisationTypeName(value);
    return this.programmes().find((p) => p.id === value)?.name ?? value;
  }

  readonly chosenTypeColors = computed(() =>
    this._filters()
      .organisationTypes.slice(0, 3)
      .map((type) => (type === NO_VALUE ? '#d1d5db' : organisationColor(type))),
  );

  isSet(facet: Facet): boolean {
    const f = this._filters();
    if (facet === 'date') return !!(f.dateFrom || f.dateTo);
    return f[facet].length > 0;
  }

  private readonly dateLabel = computed(() => {
    const f = this._filters();
    const from = f.dateFrom ? f.dateFrom.slice(0, 4) : null;
    const to = f.dateTo ? f.dateTo.slice(0, 4) : null;
    if (from && to) return `${from} – ${to}`;
    if (from) return `ab ${from}`;
    if (to) return `bis ${to}`;
    return '';
  });

  clear(facet: Facet): void {
    if (facet === 'date') {
      this.clearDates();
      return;
    }
    this.clearFacet(facet);
  }

  private toggleIn(list: string[], all: string[], value: string): string[] {
    const next = new Set(list.length === 0 ? all : list);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    return next.size === all.length ? [] : [...next];
  }

  isActive(list: string[], value: string): boolean {
    return list.length === 0 || list.includes(value);
  }

  toggleProgramme(id: string): void {
    const f = this._filters();
    this.filtersChange.emit({
      ...f,
      programmes: this.toggleIn(
        f.programmes,
        this.programmes().map((p) => p.id),
        id,
      ),
    });
  }

  toggleStatus(s: string): void {
    const f = this._filters();
    this.filtersChange.emit({
      ...f,
      statuses: this.toggleIn(
        f.statuses,
        this.statuses().map((st) => st.key),
        s,
      ),
    });
  }

  toggleType(t: string): void {
    const f = this._filters();
    this.filtersChange.emit({
      ...f,
      organisationTypes: this.toggleIn(
        f.organisationTypes,
        this.organisationTypes().map((x) => x.key),
        t,
      ),
    });
  }

  only(facet: ListFacet, value: string): void {
    this.filtersChange.emit({ ...this._filters(), [facet]: [value] });
  }

  clearFacet(facet: ListFacet): void {
    this.filtersChange.emit({ ...this._filters(), [facet]: [] });
  }

  setDateFrom(value: string): void {
    this.filtersChange.emit({ ...this._filters(), dateFrom: value || null });
  }

  setDateTo(value: string): void {
    this.filtersChange.emit({ ...this._filters(), dateTo: value || null });
  }

  private clearDates(): void {
    this.filtersChange.emit({ ...this._filters(), dateFrom: null, dateTo: null });
  }

  reset(): void {
    this.closeMenu();
    this.filtersChange.emit(emptyFilters());
  }

  int(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('de-AT');
  }
}

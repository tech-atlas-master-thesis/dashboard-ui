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
import { matchesFilters } from '@shared/backend/utils/network-filter.utils';

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

  private projectsExcept(facet: Parameters<typeof matchesFilters>[2]) {
    const projects = this._data()?.projects ?? [];
    const f = this._filters();
    return projects.filter((p) => matchesFilters(p, f, facet));
  }

  open = signal(false);

  toggleOpen(): void {
    this.open.update((v) => !v);
  }

  activeCount = computed(() => {
    const f = this._filters();
    return (
      (f.programmes.length ? 1 : 0) +
      (f.statuses.length ? 1 : 0) +
      (f.organisationTypes.length ? 1 : 0) +
      (f.dateFrom || f.dateTo ? 1 : 0)
    );
  });

  programmes = computed(() => {
    const map = new Map<string, string>();
    this.projectsExcept('programmes').forEach((p) => {
      if (p.programme) map.set(p.programme._id, p.programme.name);
    });
    this._data()?.projects.forEach((p) => {
      if (p.programme && this._filters().programmes.includes(p.programme._id)) {
        map.set(p.programme._id, p.programme.name);
      }
    });
    return [...map]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  statuses = computed(() => {
    const set = new Set<string>();
    this.projectsExcept('statuses').forEach((p) => {
      if (p.status) set.add(p.status);
    });
    this._filters().statuses.forEach((s) => set.add(s));
    return [...set].sort().map((t) => ({ key: t, label: projectStatusName(t) }));
  });

  organisationTypes = computed(() => {
    const active = new Set<string>();
    this.projectsExcept(undefined).forEach((p) => p.organisations.forEach((id) => active.add(id)));

    const set = new Set<string>();
    this._data()?.nodes.forEach((n) => {
      if (n.type && active.has(n._id.$oid)) set.add(n.type);
    });
    this._filters().organisationTypes.forEach((t) => set.add(t));

    return [...set]
      .sort()
      .map((t) => ({ key: t, label: organisationTypeName(t), color: organisationColor(t) }));
  });

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

  setDateFrom(value: string): void {
    this.filtersChange.emit({ ...this._filters(), dateFrom: value || null });
  }

  setDateTo(value: string): void {
    this.filtersChange.emit({ ...this._filters(), dateTo: value || null });
  }

  reset(): void {
    this.filtersChange.emit(emptyFilters());
  }

  protected readonly projectStatusName = projectStatusName;
  protected readonly organisationTypeName = organisationTypeName;
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { DatasetsState } from '../../../state/datasets/datasets.state';
import { SearchResponse, SearchService } from '@shared/services/search-service';
import { MIN_SEARCH_LENGTH, SearchHit, createMatcher, toHits } from '@shared/utils/search.utils';
import { organisationColor, organisationTypeName } from '@shared/models/network.model';

interface Target {
  kind: 'organisation' | 'project';
  id: string;
}

@Component({
  selector: 'app-search',
  imports: [],
  templateUrl: './search.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Search {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly datasets = inject(DatasetsState);
  private readonly service = inject(SearchService);
  private readonly initial = this.route.snapshot.queryParamMap.get('q') ?? '';
  private readonly debounced = signal(this.initial);
  private readonly active = signal(0);

  readonly minLength = MIN_SEARCH_LENGTH;
  readonly term = signal(this.initial);

  private timer: any;

  setTerm(value: string): void {
    this.term.set(value);
    this.active.set(0);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.debounced.set(value), 200);
  }

  clear(): void {
    clearTimeout(this.timer);
    this.term.set('');
    this.debounced.set('');
    this.active.set(0);
    document.getElementById('dataset-search')?.focus();
  }

  private readonly response = httpResource<SearchResponse>(
    () => {
      const matcher = createMatcher(this.debounced());
      const dataset = this.datasets.selectedDataset();
      if (!matcher.active || !dataset) return undefined;
      return this.service.url(dataset, matcher.term);
    },
    { defaultValue: { organisations: [], projects: [], term: '' } },
  );

  readonly loading = computed(() => this.response.isLoading());
  readonly searching = computed(() => createMatcher(this.debounced()).active);
  readonly pending = computed(() => this.term().trim() !== this.debounced().trim());

  readonly results = computed(() => {
    const matcher = createMatcher(this.debounced());
    const data = this.response.value();

    const organisations = toHits(data.organisations, matcher, (o) =>
      matcher.matches(o.name)
        ? {
            id: o._id,
            label: o.name,
            hint: organisationTypeName(o.type),
            color: organisationColor(o.type),
          }
        : null,
    );

    const projects = toHits(data.projects, matcher, (p) => {
      if (![p.short, p.title, p.externalId].some((v) => matcher.matches(v))) return null;
      return {
        id: p._id,
        label: p.short || p.title || p.externalId || '—',
        hint: p.short && p.title && p.short !== p.title ? p.title : '',
      };
    });

    return { organisations, projects, total: organisations.length + projects.length };
  });

  private readonly targets = computed<Target[]>(() => {
    const { organisations, projects } = this.results();
    return [
      ...organisations.map((o: SearchHit) => ({ kind: 'organisation' as const, id: o.id })),
      ...projects.map((p: SearchHit) => ({ kind: 'project' as const, id: p.id })),
    ];
  });

  readonly activeId = computed(() => this.targets()[this.active()]?.id ?? null);

  open(kind: Target['kind'], id: string): void {
    this.router.navigate([`/${kind}`, id], {
      queryParams: { from: this.backUrl(), fromLabel: 'Zurück zur Suche' },
    });
  }

  private backUrl(): string {
    const tree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: { q: this.term().trim() || null },
      queryParamsHandling: 'merge',
    });
    return this.router.serializeUrl(tree);
  }

  onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.clear();
      return;
    }

    const targets = this.targets();
    if (!targets.length) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      const target = targets[this.active()];
      if (target) this.open(target.kind, target.id);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

    event.preventDefault();
    const next =
      (this.active() + (event.key === 'ArrowDown' ? 1 : -1) + targets.length) % targets.length;
    this.active.set(next);
    setTimeout(() =>
      document.getElementById(`hit-${targets[next].id}`)?.scrollIntoView({ block: 'nearest' }),
    );
  }

  int(value: number | null | undefined): string {
    return (value ?? 0).toLocaleString('de-AT');
  }
}

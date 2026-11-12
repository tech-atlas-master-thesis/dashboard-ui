import { effect, inject, Injectable, resource, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import environment from '../../environments/environment';
import { DatasetsState } from '../../state/datasets/datasets.state';
import { createMatcher } from '@shared/utils/search.utils';

export interface SearchOrganisation {
  _id: string;
  name: string;
  type: string;
}

export interface SearchProject {
  _id: string;
  short: string;
  title: string;
  externalId: string;
}

export interface SearchResponse {
  organisations: SearchOrganisation[];
  projects: SearchProject[];
  term: string;
}

const EMPTY: SearchResponse = { organisations: [], projects: [], term: '' };
const DEBOUNCE_MS = 200;

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly datasetState = inject(DatasetsState);
  private readonly http = inject(HttpClient);

  readonly term = signal('');

  private readonly _settled = signal('');

  readonly settled = this._settled.asReadonly();

  constructor() {
    effect((onCleanup) => {
      const value = this.term();
      const handle = setTimeout(() => this._settled.set(value), DEBOUNCE_MS);
      onCleanup(() => clearTimeout(handle));
    });
  }

  readonly data = resource({
    params: () => ({ dataset: this.datasetState.selectedDataset(), term: this.settled() }),
    loader: ({ params }) => {
      const url = this.getApiUrl(params.dataset, params.term);
      return url ? firstValueFrom(this.http.get<SearchResponse>(url)) : Promise.resolve(EMPTY);
    },
    defaultValue: EMPTY,
  });

  apply(value: string): void {
    this.term.set(value);
    this._settled.set(value);
  }

  clear(): void {
    this.apply('');
  }

  private getApiUrl(dataset: string, term: string): string | null {
    const matcher = createMatcher(term);
    if (!dataset || !matcher.active) return null;
    return `${environment.baseUrl}${environment.apiUrl}/data/${dataset}/search?q=${encodeURIComponent(matcher.term)}`;
  }
}

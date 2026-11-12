import { inject, Injectable, resource, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NetworkData } from '../models/network.model';
import environment from '../../environments/environment';
import { DatasetsState } from '../../state/datasets/datasets.state';

type Target = { kind: 'all' } | { kind: 'field'; id: string } | { kind: 'technology'; id: string };

const EMPTY: NetworkData = { nodes: [], projects: [] };

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private readonly datasetState = inject(DatasetsState);
  private readonly http = inject(HttpClient);
  private readonly target = signal<Target | null>(null);

  readonly data = resource({
    params: () => ({ dataset: this.datasetState.selectedDataset(), target: this.target() }),
    loader: ({ params }) => {
      const url = this.getApiUrl(params.dataset, params.target);
      return url ? firstValueFrom(this.http.get<NetworkData>(url)) : Promise.resolve(EMPTY);
    },
    defaultValue: EMPTY,
  });

  private getApiUrl(dataset: string, target: Target | null): string | null {
    if (!dataset || !target) return null;

    const base = `${environment.baseUrl}${environment.apiUrl}/data/${dataset}/network`;
    switch (target.kind) {
      case 'field':
        return `${base}/field/${target.id}`;
      case 'technology':
        return `${base}/${target.id}`;
      default:
        return base;
    }
  }

  loadByTechnology(technologyId: string): void {
    this.target.set({ kind: 'technology', id: technologyId });
  }

  loadByField(fieldId: string): void {
    this.target.set({ kind: 'field', id: fieldId });
  }

  loadAll(): void {
    this.target.set({ kind: 'all' });
  }

  clear(): void {
    this.target.set(null);
  }
}

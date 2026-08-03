import { inject, Injectable, resource, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { NetworkData } from '../models/network.model';
import environment from '../../../environment/environment';
import { DatasetsState } from '../../../state/datasets/datasets.state';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private readonly datasetState = inject(DatasetsState);
  private readonly http = inject(HttpClient);

  apiUrl = signal('');

  readonly data = resource({
    params: () => this.apiUrl(),
    loader: ({ params }) =>
      firstValueFrom(
        params === ''
          ? of({ nodes: [], projects: [] } as NetworkData)
          : this.http.get<NetworkData>(params),
      ),
  });

  private base(): string {
    return `${environment.baseUrl}${environment.apiUrl}/data/${this.datasetState.selectedDataset()}/network`;
  }

  loadByTechnology(technologyID: string): void {
    this.apiUrl.set(`${this.base()}/${technologyID}`);
  }

  loadByField(fieldID: string): void {
    this.apiUrl.set(`${this.base()}/field/${fieldID}`);
  }

  loadAll(): void {
    this.apiUrl.set(this.base());
  }
}

import { inject, Injectable, resource, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { NetworkData } from '../models/network.model';
import environment from '../../../environment/environment';
import { DatasetsState } from '../../../state/datasets/datasets.state';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private readonly datasetState = inject(DatasetsState);
  private readonly http = inject(HttpClient);

  apiUrl = signal('');

  readonly data = resource({
    params: () => this.apiUrl(),
    loader: ({ params }) => {
      return firstValueFrom(
        params === '' ? of({ nodes: [], links: [] }) : this.http.get<NetworkData>(params),
      );
    },
  });

  loadByTechnology(technologyID: string): void {
    this.apiUrl.set(
      `${environment.baseUrl}${environment.apiUrl}/data/${this.datasetState.selectedDataset()}/network/${technologyID}`,
    );
  }

  loadByField(fieldID: string): void {
    this.apiUrl.set(
      `${environment.baseUrl}${environment.apiUrl}/data/${this.datasetState.selectedDataset()}/network/field/${fieldID}`,
    );
  }

  loadAll(): void {
    this.apiUrl.set(
      `${environment.baseUrl}${environment.apiUrl}/data/${this.datasetState.selectedDataset()}/network`,
    );
  }
}

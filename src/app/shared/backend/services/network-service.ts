import { inject, Injectable, resource } from '@angular/core';
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

  readonly data = resource({
    params: () => this.datasetState.selectedDataset(),
    loader: ({ params }) => {
      return firstValueFrom(
        params === ''
          ? of({ nodes: [], links: [] })
          : this.http.get<NetworkData>(this.getApiUrl(params)),
      );
    },
  });

  private getApiUrl(dataset: string) {
    return `${environment.baseUrl}${environment.apiUrl}/data/${dataset}/network`;
  }

  private loadByTechnology(dataset: string, technologyID: string) {
    return `${environment.baseUrl}${environment.apiUrl}/data/${dataset}/network/${technologyID}`;
  }

  private loadByField(dataset: string, fieldID: string) {
    return `${environment.baseUrl}${environment.apiUrl}/data/${dataset}/network/field/${fieldID}`;
  }
}

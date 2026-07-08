import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { TechnologyField } from '../models/key-technologies.model';
import environment from '../../../environment/environment';
import { DatasetsState } from '../../../state/datasets/datasets.state';

@Injectable({
  providedIn: 'root',
})
export class KeyTechnologyService {
  private readonly datasetState = inject(DatasetsState);
  private readonly http = inject(HttpClient);

  readonly data = resource({
    params: () => this.datasetState.selectedDataset(),
    loader: ({ params }) => {
      return firstValueFrom(
        params === '' ? of([]) : this.http.get<TechnologyField[]>(this.getApiUrl(params)),
      );
    },
  });

  private getApiUrl(dataset: string) {
    return `${environment.baseUrl}${environment.apiUrl}/data/${dataset}/key-technologies`;
  }
}

import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TechnologyField } from '../models/key-technologies.model';
import environment from '../../environments/environment';
import { DatasetsState } from '../../state/datasets/datasets.state';

@Injectable({
  providedIn: 'root',
})
export class KeyTechnologyService {
  private readonly datasetState = inject(DatasetsState);
  private readonly http = inject(HttpClient);

  readonly data = resource({
    params: () => this.datasetState.selectedDataset(),
    loader: ({ params }) => {
      const url = this.getApiUrl(params);
      return url ? firstValueFrom(this.http.get<TechnologyField[]>(url)) : Promise.resolve([] as TechnologyField[]);
    },
    defaultValue: [] as TechnologyField[],
  });

  private getApiUrl(dataset: string): string | null {
    if (!dataset) return null;
    return `${environment.baseUrl}${environment.apiUrl}/data/${dataset}/key-technologies`;
  }
}

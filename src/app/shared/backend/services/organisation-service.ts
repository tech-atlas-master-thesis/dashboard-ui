import { inject, Injectable, resource, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { OrganisationDetail, emptyOrganisationDetail } from '../models/organisation.model';
import environment from '../../../environment/environment';
import { DatasetsState } from '../../../state/datasets/datasets.state';

@Injectable({ providedIn: 'root' })
export class OrganisationService {
  private readonly datasetState = inject(DatasetsState);
  private readonly http = inject(HttpClient);
  readonly selectedId = signal('');

  readonly data = resource({
    params: () => ({
      dataset: this.datasetState.selectedDataset(),
      id: this.selectedId(),
    }),
    loader: ({ params }) =>
      firstValueFrom(
        params.dataset === '' || params.id === ''
          ? of(emptyOrganisationDetail())
          : this.http.get<OrganisationDetail>(this.getApiUrl(params.dataset, params.id)),
      ),
  });

  private getApiUrl(dataset: string, id: string) {
    return `${environment.baseUrl}${environment.apiUrl}/data/${dataset}/organisation/${id}`;
  }
}

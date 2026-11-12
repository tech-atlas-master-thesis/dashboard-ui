import { inject, Injectable, resource, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProjectDetail, emptyProjectDetail } from '../models/project.model';
import environment from '../../environments/environment';
import { DatasetsState } from '../../state/datasets/datasets.state';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly datasetState = inject(DatasetsState);
  private readonly http = inject(HttpClient);

  readonly selectedId = signal('');

  readonly data = resource({
    params: () => ({ dataset: this.datasetState.selectedDataset(), id: this.selectedId() }),
    loader: ({ params }) => {
      const url = this.getApiUrl(params.dataset, params.id);
      return url ? firstValueFrom(this.http.get<ProjectDetail>(url)) : Promise.resolve(emptyProjectDetail());
    },
    defaultValue: emptyProjectDetail(),
  });

  private getApiUrl(dataset: string, id: string): string | null {
    if (!dataset || !id) return null;
    return `${environment.baseUrl}${environment.apiUrl}/data/${dataset}/project/${id}`;
  }
}

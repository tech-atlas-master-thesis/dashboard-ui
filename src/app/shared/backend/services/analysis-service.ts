import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { FieldAnalysis, emptyAnalysis } from '../models/analysis.model';
import environment from '../../../environment/environment';
import { DatasetsState } from '../../../state/datasets/datasets.state';

@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private readonly datasetState = inject(DatasetsState);
  private readonly http = inject(HttpClient);

  readonly fields = resource({
    params: () => this.datasetState.selectedDataset(),
    loader: ({ params }) =>
      firstValueFrom(
        params === ''
          ? of(emptyAnalysis())
          : this.http.get<FieldAnalysis>(
              `${environment.baseUrl}${environment.apiUrl}/data/${params}/analysis/fields`,
            ),
      ),
  });
}

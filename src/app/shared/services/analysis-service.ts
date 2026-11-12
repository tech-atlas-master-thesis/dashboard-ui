import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FieldAnalysis, emptyAnalysis } from '../models/analysis.model';
import environment from '../../environments/environment';
import { DatasetsState } from '../../state/datasets/datasets.state';

@Injectable({ providedIn: 'root' })
export class AnalysisService {
  private readonly datasetState = inject(DatasetsState);
  private readonly http = inject(HttpClient);

  readonly fields = resource({
    params: () => this.datasetState.selectedDataset(),
    loader: ({ params }) => {
      const url = this.getApiUrl(params);
      return url ? firstValueFrom(this.http.get<FieldAnalysis>(url)) : Promise.resolve(emptyAnalysis());
    },
    defaultValue: emptyAnalysis(),
  });

  private getApiUrl(dataset: string): string | null {
    if (!dataset) return null;
    return `${environment.baseUrl}${environment.apiUrl}/data/${dataset}/analysis/fields`;
  }
}

import { Injectable } from '@angular/core';
import environment from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DatasetApi {
  getPipelinesUrl(): string {
    return `${environment.baseUrl}${environment.apiUrl}/pipelines`;
  }

  getDataSetsUrl(pipeline: string): string | undefined {
    if (pipeline === '') {
      return undefined;
    }
    return `${environment.baseUrl}${environment.apiUrl}/datasets/${encodeURIComponent(pipeline)}`;
  }
}

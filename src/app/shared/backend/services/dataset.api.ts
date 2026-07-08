import { Injectable } from '@angular/core';
import environment from '../../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class DatasetApi {
  getPipelinesUrl() {
    return `${environment.apiUrl}/pipelines`;
  }

  getDataSetsUrl(pipeline: string) {
    if (pipeline === '') {
      return undefined;
    }
    return `${environment.apiUrl}/datasets/${pipeline}`;
  }
}

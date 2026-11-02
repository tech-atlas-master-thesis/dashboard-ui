import { Injectable } from '@angular/core';
import environment from '../../environments/environment';

export interface SearchOrganisation {
  _id: string;
  name: string;
  type: string;
}

export interface SearchProject {
  _id: string;
  short: string;
  title: string;
  externalId: string;
}

export interface SearchResponse {
  organisations: SearchOrganisation[];
  projects: SearchProject[];
  term: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private get base(): string {
    return `${environment.baseUrl}${environment.apiUrl}`;
  }

  url(dataset: string, term: string): string {
    return `${this.base}/data/${dataset}/search?q=${encodeURIComponent(term)}`;
  }
}

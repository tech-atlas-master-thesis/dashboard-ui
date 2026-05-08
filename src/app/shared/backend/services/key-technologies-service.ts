import { computed, inject, Injectable, resource, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map, Observable } from 'rxjs';
import { TechnologyField } from '../models/key-technologies.model';

@Injectable({
  providedIn: 'root',
})
export class KeyTechnologyService {
  private apiUrl = signal<string>('http://127.0.0.1:8000/api/key-technologies');
  private readonly http = inject(HttpClient);

  readonly data = resource({
    params: () => ({ api: this.apiUrl() }),
    loader: ({ params }) => {
      return firstValueFrom(this.http.get<TechnologyField>(params.api));
    },
  });
}

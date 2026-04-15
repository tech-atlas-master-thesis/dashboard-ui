import { computed, inject, Injectable, resource, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map, Observable } from 'rxjs';
import { NetworkNode, NetworkLink, NetworkData } from '../models/network';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private apiUrl = signal<string>('http://127.0.0.1:8000/api/network');
  private readonly http = inject(HttpClient);

  readonly data = resource({
    params: () => ({ api: this.apiUrl() }),
    loader: ({ params }) => {
      return firstValueFrom(this.http.get<NetworkData>(params.api));
    },
  });
}

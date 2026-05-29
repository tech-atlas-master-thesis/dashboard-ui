import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NetworkData } from '../models/network.model';
import environment from '../../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private readonly apiUrl = `${environment.baseUrl}${environment.apiUrl}/network`;
  private readonly http = inject(HttpClient);

  readonly data = resource({
    loader: () => {
      return firstValueFrom(this.http.get<NetworkData>(this.apiUrl));
    },
  });
}

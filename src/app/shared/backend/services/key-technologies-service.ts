import { inject, Injectable, resource } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TechnologyField } from '../models/key-technologies.model';
import environment from '../../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class KeyTechnologyService {
  private readonly apiUrl = `${environment.baseUrl}${environment.apiUrl}/key-technologies`;
  private readonly http = inject(HttpClient);

  readonly data = resource({
    loader: () => {
      return firstValueFrom(this.http.get<TechnologyField>(this.apiUrl));
    },
  });
}

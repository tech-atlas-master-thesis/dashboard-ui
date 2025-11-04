import { inject, Injectable } from '@angular/core';
import {
  HttpClient,
  httpResource,
  HttpResourceOptions,
  HttpResourceRef,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Backend {
  private readonly httpClient = inject(HttpClient);

  public getAsResource<T>(
    url: () => string,
    options: HttpResourceOptions<T, unknown> & { defaultValue: NoInfer<T> },
  ): HttpResourceRef<T> {
    return httpResource(url, options);
  }

  public get<T>(url: string): Observable<T> {
    return this.httpClient.get<T>(url);
  }

  public post<T, R>(url: string, body: R): Observable<T> {
    return this.httpClient.post<T>(url, body);
  }
}

import { inject, Injectable, linkedSignal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { DatasetApi } from '@shared/backend/services/dataset.api';
import { DataSetModel } from '@shared/backend/models/data-set.model';

@Injectable({
  providedIn: 'root',
})
export class DatasetsState {
  datasetsApi = inject(DatasetApi);

  pipelines = httpResource<string[]>(() => this.datasetsApi.getPipelinesUrl(), {
    defaultValue: [],
  });

  selectedPipeline = linkedSignal<string>(
    () => this.getDefaultPipeline(this.pipelines.value()) ?? '',
  );

  datasets = httpResource<DataSetModel[]>(() =>
    this.datasetsApi.getDataSetsUrl(this.selectedPipeline()),
  );

  selectedDataset = linkedSignal<string>(() => this.datasets.value()?.at(0)?._id ?? '');

  private getDefaultPipeline(pipelines: string[]): string | undefined {
    return pipelines.length === 1 ? pipelines.at(0) : undefined;
  }
}

import { inject, Injectable, linkedSignal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { DatasetApi } from '@shared/backend/services/dataset.api';
import { DataSetModel } from '@shared/backend/models/data-set.model';

@Injectable({
  providedIn: 'root',
})
export class DatasetsState {
  private readonly DEFAULT_PIPELINE = 'Datensatz - Alle Projekte';
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
    if (pipelines.length === 1) {
      return pipelines.at(0);
    }
    return pipelines.includes(this.DEFAULT_PIPELINE) ? this.DEFAULT_PIPELINE : undefined;
  }
}

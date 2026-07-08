import { effect, inject, Injectable, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { DatasetApi } from '@shared/backend/services/dataset.api';
import { DataSetModel, PipelineModel } from '@shared/backend/models/data-set.model';

@Injectable({
  providedIn: 'root',
})
export class DatasetsState {
  datasetsApi = inject(DatasetApi);

  pipelines = httpResource<PipelineModel[]>(() => this.datasetsApi.getPipelinesUrl(), {
    defaultValue: [],
  });

  selectedPipeline = signal<string>('');

  datasets = httpResource<DataSetModel[]>(() =>
    this.datasetsApi.getDataSetsUrl(this.selectedPipeline()),
  );

  selectedDataset = signal<string>('');

  constructor() {
    effect(() => {
      const pipelines = this.pipelines.value();

      if (pipelines.length === 1) {
        this.selectedPipeline.set(pipelines.at(0)?.pipeline ?? '');
      }
    });

    effect(() => {
      this.selectedDataset.set(this.datasets.value()?.at(0)?._id ?? '');
    });
  }
}

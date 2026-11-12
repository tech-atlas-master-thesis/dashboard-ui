import { computed, inject, Injectable, linkedSignal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { DatasetApi } from '@shared/services/dataset.api';
import { DataSetModel } from '@shared/models/datasets.model';

@Injectable({
  providedIn: 'root',
})
export class DatasetsState {
  private readonly DEFAULT_PIPELINE = 'Datensatz - Alle Projekte';
  datasetsApi = inject(DatasetApi);

  pipelines = httpResource<string[]>(() => this.datasetsApi.getPipelinesUrl(), {
    defaultValue: [],
  });

  selectedPipeline = linkedSignal<string[], string>({
    source: () => this.pipelines.value(),
    computation: (pipelines, previous) => {
      const vorher = previous?.value;
      if (vorher && pipelines.includes(vorher)) return vorher;
      return this.getDefaultPipeline(pipelines) ?? '';
    },
  });

  datasets = httpResource<DataSetModel[]>(() => (this.selectedPipeline() === '' ? undefined : this.datasetsApi.getDataSetsUrl(this.selectedPipeline())), {
    defaultValue: [],
  });

  selectedDataset = linkedSignal<DataSetModel[], string>({
    source: () => this.datasets.value(),
    computation: (datasets, previous) => {
      const vorher = previous?.value;
      if (vorher && datasets.some((d) => d._id === vorher)) return vorher;
      return datasets.at(0)?._id ?? '';
    },
  });

  readonly ready = computed(() => this.selectedDataset() !== '');

  private getDefaultPipeline(pipelines: string[]): string | undefined {
    if (pipelines.length === 0) {
      return undefined;
    }
    return pipelines.includes(this.DEFAULT_PIPELINE) ? this.DEFAULT_PIPELINE : pipelines.at(0);
  }
}

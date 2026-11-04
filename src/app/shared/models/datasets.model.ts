export interface DataSetModel extends PipelineModel {
  _id: string;
  created: {
    at: string;
  };

  projects?: number;
  organisations?: number;
  /** Frühester Projektstart im Datensatz */
  from?: string | null;
}

export interface PipelineModel {
  pipeline: string;
  pipelineName: string;
  pipelineType: string;
}

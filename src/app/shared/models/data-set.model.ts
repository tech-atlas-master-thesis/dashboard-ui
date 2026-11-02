export interface DataSetModel extends PipelineModel {
  _id: string;
  created: {
    at: string;
  };
}

export interface PipelineModel {
  pipeline: string;
  pipelineName: string;
  pipelineType: string;
}

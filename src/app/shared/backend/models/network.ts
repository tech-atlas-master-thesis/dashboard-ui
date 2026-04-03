export interface NetworkNodes {
  id: number;
  name: string;
  coordinates: string;
  type: string;
}

export interface NetworkLinks {
  source: number;
  target: number;
  projects: string[];
}

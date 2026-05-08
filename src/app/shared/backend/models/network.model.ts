import { Point } from 'geojson';

export interface NetworkNode {
  _id: { $oid: string };
  name: string;
  type: string;
  coordinates: Point;
}

export interface NetworkLink {
  source: string;
  target: string;
  projects: string[];
}

export interface NetworkData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

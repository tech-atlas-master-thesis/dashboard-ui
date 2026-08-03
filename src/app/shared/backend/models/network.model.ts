import { Point } from 'geojson';

export interface Organisation {
  _id: { $oid: string };
  name: string;
  type: string;
  website: string;
  coordinates: Point;
}

export interface Project {
  _id: string;
  externalId: string;
  short: string;
  title: string;
  abstract: string;
  start: { $date: string };
  end: { $date: string };
  status: string;
  keywords: string[];
  organisations: string[];
  projectLeader: string;
  grant: Grant;
  programme: Programme;
}

export interface NetworkData {
  nodes: Organisation[];
  projects: Project[];
}

export interface OrganisationSelection {
  organisation: Organisation;
  projectCount: number;
  cooperationCount: number;
  projects: Project[];
}

export interface ProjectSelection {
  project: Project;
  organisations: Organisation[];
}

export interface Grant {
  _id: string;
  name: string;
}

export interface Programme {
  _id: string;
  name: string;
}

export type NetworkNodeType = 'org' | 'project';

export const ORGANISATION_TYPE_COLORS: Record<string, string> = {
  'Außeruniversitäre Forschungseinrichtung': '#159d18',
  RESEARCH_INSTITUTE: '#159d18',
  Universität: '#2f58e0',
  UNIVERSITY: '#2f58e0',
  'unternehmerisch tätig': '#e7761a',
  COMPANY: '#e7761a',
  Fachhochschule: '#7f259c',
  FACHHOCHSCHULE: '#7f259c',
  Sonstige: '#b3bf2c',
  OTHER: '#b3bf2c',
  'Bund, Länder, Gemeinden': '#3d3330',
  PUBLIC_INSTITUTION: '#3d3330',
  'Gemeinnützige Organisation': '#e80a58',
  NON_PROFIT: '#e80a58',
  SINGLE_RESEARCHER: '#94a3b8',
  LOBBY: '#94a3b8',
};

export const organisationColor = (type: string | null | undefined): string =>
  ORGANISATION_TYPE_COLORS[type ?? ''] ?? '#94a3b8';

export const PROJECT_STATUS_NAME: Record<string, string> = {
  ENDED: 'Beendet',
  ONGOING: 'Laufend',
  TERMINATED: 'Frühzeitig beendet',
  PENDING: 'Noch nicht gestartet',
};

export const projectStatusName = (type: string): string => PROJECT_STATUS_NAME[type] ?? type;

export const ORGANISATION_TYPE_NAME: Record<string, string> = {
  RESEARCH_INSTITUTE: 'Außeruniversitäre Forschungseinrichtung',
  UNIVERSITY: 'Universität',
  COMPANY: 'unternehmerisch tätig',
  FACHHOCHSCHULE: 'Fachhochschule',
  OTHER: 'Sonstige',
  PUBLIC_INSTITUTION: 'Bund, Länder, Gemeinden',
  NON_PROFIT: 'Gemeinnützige Organisation',
  SINGLE_RESEARCHER: 'Einzelforscher',
  LOBBY: 'Interessensvertretung',
};

export const organisationTypeName = (type: string): string => ORGANISATION_TYPE_NAME[type] ?? type;

export interface NetworkNode {
  id: string;
  nodeType: NetworkNodeType;
  name: string;
  type?: string;
  organisation?: Organisation;
  project?: Project;
  count: number;
  r: number;
  x: number;
  y: number;
  fanned?: boolean;
  ringRadius?: number;
}

export interface NetworkLink {
  source: NetworkNode;
  target: NetworkNode;
}

export interface NetworkFilters {
  programmes: string[];
  statuses: string[];
  organisationTypes: string[];
  dateFrom: string | null;
  dateTo: string | null;
}

export const emptyFilters = (): NetworkFilters => ({
  programmes: [],
  statuses: [],
  organisationTypes: [],
  dateFrom: null,
  dateTo: null,
});

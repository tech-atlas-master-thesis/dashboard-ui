import { Style } from './key-technologies.model';
import { Grant, Programme } from './network.model';
import { OrganisationDoc } from './organisation.model';
import { BsonDate, Oid } from '../utils/details.utils';

export interface ProjectHead {
  _id: string;
  externalId: string | null;
  short: string | null;
  title: string | null;
  abstract: string | null;
  keywords: string[];
  start: BsonDate | null;
  end: BsonDate | null;
  status: string | null;
  fundingLine: string | null;
  grant: Grant | null;
  programme: Programme | null;
}

export interface ProjectMetrics {
  participants: number;
  cooperations: number;
  types: Record<string, number>;
  withoutLeader: boolean;
}

export interface ParticipantRow extends OrganisationDoc {
  leading: boolean;
}

export interface TechnologyRef {
  _id: Oid;
  label: string;
  short: string | null;
  style: Style;
}

export interface TechnologyField {
  _id: string | null;
  label: string | null;
  short: string | null;
  style: Style | null;
  technologies: TechnologyRef[];
}

export interface RecurringProjectRow {
  _id: string;
  short: string | null;
  title: string | null;
  start: BsonDate | null;
  end: BsonDate | null;
  status: string | null;
  fundingLine: string | null;
  shared: number;
}

export interface ProjectDetail {
  project: ProjectHead | null;
  metrics: ProjectMetrics;
  participants: ParticipantRow[];
  technologyFields: TechnologyField[];
  recurring: RecurringProjectRow[];
}

export const emptyProjectDetail = (): ProjectDetail => ({
  project: null,
  metrics: {
    participants: 0,
    cooperations: 0,
    types: {},
    withoutLeader: false,
  },
  participants: [],
  technologyFields: [],
  recurring: [],
});

import { Style } from './key-technologies.model';
import { Organisation } from './network.model';
import { BsonDate } from '../utils/details.utils';

export interface Address {
  country: string;
  country_code: string | null;
  state: string | null;
  city: string | null;
  postal_code: string | null;
  street: string | null;
  house_number: string | null;
}

export interface OrganisationDoc extends Omit<Organisation, 'type' | 'website'> {
  type: string | null;
  website: string | null;
  address: Address | null;
}

export interface OrganisationMetrics {
  projects: number;
  leadingProjects: number;
  partnersTotal: number;
  partnersMean: number;
  fields: number;
  fieldsTotal: number;
  fieldAssignments: number;
  specialisation: number;
  status: Record<string, number>;
}

export interface FieldProfileRow {
  _id: string;
  label: string;
  short: string | null;
  style: Style;
  projects: number;
  share: number;
}

export interface PartnerRow extends OrganisationDoc {
  sharedProjects: number;
}

export interface OrganisationProjectRow {
  _id: string;
  short: string | null;
  title: string | null;
  status: string | null;
  start: BsonDate | null;
  end: BsonDate | null;
  fundingLine: string | null;
  partners: number;
  leading: boolean;
  fields: string[];
}

export interface FundingLineRow {
  name: string;
  projects: number;
}

export interface OrganisationDetail {
  organisation: OrganisationDoc | null;
  metrics: OrganisationMetrics;
  fields: FieldProfileRow[];
  partners: PartnerRow[];
  fundingLines: FundingLineRow[];
  projects: OrganisationProjectRow[];
}

export const emptyOrganisationDetail = (): OrganisationDetail => ({
  organisation: null,
  metrics: {
    projects: 0,
    leadingProjects: 0,
    partnersTotal: 0,
    partnersMean: 0,
    fields: 0,
    fieldsTotal: 0,
    fieldAssignments: 0,
    specialisation: 0,
    status: {},
  },
  fields: [],
  partners: [],
  fundingLines: [],
  projects: [],
});

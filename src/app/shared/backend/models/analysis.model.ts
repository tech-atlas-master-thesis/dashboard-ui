import { Style } from './key-technologies.model';

export interface StructuralMetrics {
  projects: number;
  projectsWithoutLeader: number;
  projectsWithoutPartner: number;
  projectsWithoutPartnerShare: number;
  organisations: number;
  cooperations: number;
  degreeMean: number;
  isolated: number;
  isolatedShare: number;
  components: number;
  componentsFromTwo: number;
  largestComponent: number;
  largestComponentShare: number;
  density: number;
  academicLead: number;
  academicLeadShare: number;
}

export interface FieldMetricsRow extends StructuralMetrics {
  _id: string;
  label: string;
  short: string | null;
  style: Style;
}

export interface FieldAnalysis {
  fields: FieldMetricsRow[];
  total: StructuralMetrics;
}

export const emptyAnalysis = (): FieldAnalysis => ({
  fields: [],
  total: {
    projects: 0,
    projectsWithoutLeader: 0,
    projectsWithoutPartner: 0,
    projectsWithoutPartnerShare: 0,
    organisations: 0,
    cooperations: 0,
    degreeMean: 0,
    isolated: 0,
    isolatedShare: 0,
    components: 0,
    componentsFromTwo: 0,
    largestComponent: 0,
    largestComponentShare: 0,
    density: 0,
    academicLead: 0,
    academicLeadShare: 0,
  },
});

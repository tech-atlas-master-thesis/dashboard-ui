export interface Style {
  color: string;
  accent: string;
}

export interface KeyTechnology {
  _id: string;
  label: string;
  short: string;
  field: string;
  dataset: string;
  projects: number;
}

export interface TechnologyField {
  _id: string;
  label: string;
  short: string;
  dataset: string;
  projects: number;
  style: Style;
  technologies: KeyTechnology[];
}

export interface TechnologyViewModel {
  label: string;
  projects: number;
  value?: number;
  color?: string;
  accentColor?: string;
  fieldID?: string;
  techID?: string;
  children?: TechnologyViewModel[];
}

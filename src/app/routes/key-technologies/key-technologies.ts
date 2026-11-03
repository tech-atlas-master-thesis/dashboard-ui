import { ChangeDetectionStrategy, Component, computed, effect, ElementRef, signal, untracked, viewChild } from '@angular/core';
import * as d3 from 'd3';
import { KeyTechnologyService } from '@shared/services/key-technologies-service';
import { NetworkService } from '@shared/services/network-service';
import { TechnologyField, KeyTechnology } from '@shared/models/key-technologies.model';
import { NetworkFilters, OrganisationSelection, ProjectSelection, emptyFilters } from '@shared/models/network.model';
import { ActivatedRoute, Router } from '@angular/router';
import { Network } from '../../features/network/network/network';
import { NetworkFilter } from '../../features/network/network-filter/network-filter';
import { OrganisationPreview } from '../../features/previews/organisation-preview/organisation-preview';
import { ProjectPreview } from '../../features/previews/project-preview/project-preview';
import { Metrics } from '../../features/metrics/metrics';
import { Search } from '../../features/search/search/search';
import { Spinner } from '../../ui/spinner/spinner';
import { Toggle, ToggleOption } from '../../ui/toggle/toggle';
import { PageHead } from '../../ui/page-head/page-head';
import { originState } from '@shared/navigation/origin';

type Mode = 'technologies' | 'network';
type FieldMode = 'tiles' | 'metrics' | 'search';

interface TileItem {
  id: string;
  label: string;
  projects: number;
  color: string;
  accent: string;
  children?: TileItem[];
}

interface Tile extends TileItem {
  count: string;
  share: string;
  bar: number;
  x: number;
  y: number;
  w: number;
  h: number;
  light: boolean;
  pad: number;
  labelSize: number;
  countSize: number;
  lines: 1 | 2 | 3;
  icon: boolean;
  showBar: boolean;
  showShare: boolean;
}

const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

function isLight(hex: string): boolean {
  const value = hex.replace('#', '');
  if (value.length !== 6) return false;

  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b) > 0.45;
}

@Component({
  selector: 'app-key-technologies',
  imports: [Network, NetworkFilter, OrganisationPreview, ProjectPreview, Metrics, Search, Spinner, Toggle, PageHead],
  templateUrl: './key-technologies.html',
  styleUrls: ['./key-technologies.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyTechnologies {
  readonly modes: readonly ToggleOption<Mode>[] = [
    { value: 'technologies', label: 'Technologien' },
    { value: 'network', label: 'Netzwerk' },
  ];

  readonly fieldModes: readonly ToggleOption<FieldMode>[] = [
    { value: 'tiles', label: 'Verteilung' },
    { value: 'metrics', label: 'Kennzahlen' },
    { value: 'search', label: 'Suche' },
  ];

  selectedField = signal<TechnologyField | null>(null);
  mode = signal<Mode>('technologies');
  showNetwork = computed(() => this.mode() === 'network' && !!this.selectedField());
  fieldMode = signal<FieldMode>('tiles');
  showMetrics = computed(() => this.fieldMode() === 'metrics' && !this.selectedField());
  showSearch = computed(() => this.fieldMode() === 'search' && !this.selectedField());

  filters = signal<NetworkFilters>(emptyFilters());
  selectedOrganisation = signal<OrganisationSelection | null>(null);
  selectedProject = signal<ProjectSelection | null>(null);
  selectRequest = signal<{ id: string } | null>(null);

  hovered = signal<string | null>(null);

  private readonly chart = viewChild<ElementRef<HTMLDivElement>>('chart');
  private readonly size = signal({ width: 0, height: 0 });

  private readonly items = computed<TileItem[]>(() => {
    const field = this.selectedField();

    if (field) {
      return field.technologies.map((t: KeyTechnology) => ({
        id: t.short || t.label,
        label: t.label,
        projects: t.projects,
        color: field.style.color,
        accent: field.style.accent,
      }));
    }

    return (this.keyTechnologyService.data.value() ?? []).map((f) => ({
      id: f._id.$oid,
      label: f.label,
      projects: f.projects,
      color: f.style.color,
      accent: f.style.accent,
    }));
  });

  readonly tiles = computed<Tile[]>(() => {
    const { width, height } = this.size();
    const items = this.items();
    if (!width || !height || !items.length) return [];

    const total = items.reduce((sum, i) => sum + i.projects, 0);
    const int = (n: number) => n.toLocaleString('de-AT');
    const pct = (n: number) => `${((n / total) * 100).toLocaleString('de-AT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
    const withIcons = !this.selectedField();

    const root = d3
      .hierarchy<TileItem>({ id: 'root', label: 'root', projects: 0, color: '', accent: '', children: items })
      .sum((d) => (d.children ? 0 : Math.max(Math.sqrt(d.projects || 1), 3)))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    d3.treemap<TileItem>().size([width, height]).paddingInner(8).round(true).tile(d3.treemapSquarify.ratio(1))(root);

    return (root.leaves() as d3.HierarchyRectangularNode<TileItem>[]).map((node) => {
      const w = node.x1 - node.x0;
      const h = node.y1 - node.y0;
      const pad = h < 52 ? 6 : h < 84 ? 10 : 16;
      const labelSize = clamp(Math.round(Math.min(h * 0.2, (w - 2 * pad) * 0.1)), 9, 15);
      const countSize = clamp(labelSize - 1, 9, 14);
      const lines = h >= 112 ? 3 : h >= 74 ? 2 : 1;

      return {
        ...node.data,
        count: int(node.data.projects),
        share: total ? pct(node.data.projects) : '',
        bar: total ? (node.data.projects / total) * 100 : 0,
        x: node.x0,
        y: node.y0,
        w,
        h,
        light: isLight(node.data.color),
        pad,
        labelSize,
        countSize,
        lines: lines as 1 | 2 | 3,
        icon: withIcons && h >= 112 && w >= 150,
        showBar: h >= 46 && w >= 112,
        showShare: w >= 150 && h >= 40,
      };
    });
  });

  constructor(
    public keyTechnologyService: KeyTechnologyService,
    public networkService: NetworkService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    effect(() => {
      const fields = this.keyTechnologyService.data.value();
      if (!fields) return;

      untracked(() => {
        const params = this.route.snapshot.queryParamMap;
        const fieldID = params.get('field');
        const field = fieldID ? (fields.find((f) => f._id.$oid === fieldID) ?? null) : null;

        const view = params.get('view');
        this.fieldMode.set(view === 'metrics' || view === 'search' ? view : 'tiles');

        this.selectedField.set(field);
        this.mode.set(field && params.get('mode') === 'network' ? 'network' : 'technologies');
      });
    });

    effect((onCleanup) => {
      const el = this.chart()?.nativeElement;
      if (!el) {
        this.size.set({ width: 0, height: 0 });
        return;
      }

      const observer = new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        this.size.set({ width: Math.round(width), height: Math.round(height) });
      });

      observer.observe(el);
      onCleanup(() => observer.disconnect());
    });
  }

  backToFields(): void {
    this.mode.set('technologies');
    this.selectedField.set(null);
    this.closePanels();
    this.syncQueryParams();
  }

  setMode(next: Mode): void {
    if (this.mode() === next) return;

    this.mode.set(next);
    this.closePanels();
    this.syncQueryParams();
  }

  setFieldMode(next: FieldMode): void {
    if (this.fieldMode() === next) return;

    this.fieldMode.set(next);
    this.syncQueryParams();
  }

  onFieldSelected(id: string): void {
    const field = (this.keyTechnologyService.data.value() ?? []).find((f) => f._id.$oid === id);
    if (!field) return;

    this.mode.set('technologies');
    this.selectedField.set(field);
    this.syncQueryParams();
  }

  open(entry: TileItem): void {
    const field = this.selectedField();
    if (!field) {
      this.onFieldSelected(entry.id);
      return;
    }

    this.router.navigate(['/key-technologies', field._id.$oid, entry.id], {
      queryParams: { view: this.fieldMode() === 'tiles' ? null : this.fieldMode() },
    });
  }

  private syncQueryParams(): void {
    const field = this.selectedField();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        field: field?._id.$oid ?? null,
        mode: field && this.mode() === 'network' ? 'network' : null,
        view: this.fieldMode() === 'tiles' ? null : this.fieldMode(),
      },
      replaceUrl: true,
    });
  }

  onNodeSelected(sel: OrganisationSelection | null): void {
    this.selectedOrganisation.set(sel);
    if (sel) this.selectedProject.set(null);
  }

  onProjectSelected(sel: ProjectSelection | null): void {
    this.selectedProject.set(sel);
    if (sel) this.selectedOrganisation.set(null);
  }

  closePanels(): void {
    this.selectedOrganisation.set(null);
    this.selectedProject.set(null);
  }

  openOrganisation(id: string): void {
    this.router.navigate(['/organisation', id], originState(this.router.url, 'Zurück zum Netzwerk'));
  }

  openProject(id: string): void {
    this.router.navigate(['/project', id], originState(this.router.url, 'Zurück zum Netzwerk'));
  }
}

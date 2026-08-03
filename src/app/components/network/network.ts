import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  effect,
  signal,
} from '@angular/core';
import {
  NetworkData,
  NetworkFilters,
  NetworkLink,
  NetworkNode,
  OrganisationSelection,
  Project,
  ProjectSelection,
  emptyFilters,
  organisationColor,
} from '@shared/backend/models/network.model';
import { NetworkService } from '@shared/backend/services/network-service';
import * as d3 from 'd3';
import { matchesFilters } from '@shared/backend/utils/network-filter.utils';

@Component({
  selector: 'app-network',
  imports: [],
  templateUrl: './network.html',
  styleUrl: './network.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Network implements OnDestroy {
  @Input() set filterByTechnology(id: string | null) {
    if (id) this.networkservice.loadByTechnology(id);
  }
  @Input() set filterByField(id: string | null) {
    if (id) this.networkservice.loadByField(id);
  }
  @Input() set filters(f: NetworkFilters | null) {
    this._filters.set(f ?? emptyFilters());
  }

  @Output() nodeSelected = new EventEmitter<OrganisationSelection | null>();
  @Output() projectSelected = new EventEmitter<ProjectSelection | null>();

  selected = signal<NetworkNode | null>(null);

  private _filters = signal<NetworkFilters>(emptyFilters());

  private nodes: NetworkNode[] = [];
  private links: NetworkLink[] = [];
  private byId = new Map<string, NetworkNode>();
  private neighbors = new Map<string, Set<string>>();
  private orgLabelMin = 0;
  private projectLabelMin = 0;

  private svgRoot: any;
  private layer: any;
  private zoomBehavior: any;
  private linkSel: any;
  private nodeSel: any;
  private labelSel: any;
  private margin = 20;
  private width = 0;
  private height = 0;
  private resizeObserver!: ResizeObserver;

  private readonly fanThreshold = 4;
  private readonly fanSpacing = 46;
  private readonly componentGap = 16;
  private readonly isolatedStep = 26;
  private readonly isolatedOffset = 56;
  private readonly projectColor = '#475569';

  private color = (n: NetworkNode) =>
    n.nodeType === 'project' ? this.projectColor : organisationColor(n.type);

  constructor(public networkservice: NetworkService) {
    effect(() => {
      const data = this.networkservice.data.value();
      const filters = this._filters();
      if (!data) return;
      setTimeout(() => {
        const el = document.getElementById('network');
        if (!el) return;
        this.width = el.clientWidth - this.margin * 2;
        this.height = el.clientHeight - this.margin * 2;
        this.buildGraph(data, filters);
        this.computeLayout();
        this.render();
        this.fitToView();
        this.attachResizeObserver();
      });
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private attachResizeObserver(): void {
    this.resizeObserver?.disconnect();
    const el = document.getElementById('network');
    if (!el) return;
    this.resizeObserver = new ResizeObserver(() => {
      this.width = el.clientWidth - this.margin * 2;
      this.height = el.clientHeight - this.margin * 2;
      this.svgRoot
        ?.attr('width', this.width + this.margin * 2)
        .attr('height', this.height + this.margin * 2);
      this.fitToView();
    });
    this.resizeObserver.observe(el);
  }

  private buildGraph(data: NetworkData, filters: NetworkFilters): void {
    const projects = (data.projects ?? []).filter((p) => matchesFilters(p, filters));
    const projectsByOrg = new Map<string, Project[]>();

    projects.forEach((p) =>
      p.organisations.forEach((id) => {
        if (!projectsByOrg.has(id)) projectsByOrg.set(id, []);
        projectsByOrg.get(id)!.push(p);
      }),
    );

    const orgCounts = data.nodes.map((n) => projectsByOrg.get(n._id.$oid)?.length ?? 0);
    const orgRadius = d3
      .scaleSqrt()
      .domain([1, d3.max(orgCounts) || 1])
      .range([5, 24])
      .clamp(true);

    const orgNodes: NetworkNode[] = data.nodes.map((n) => {
      const count = projectsByOrg.get(n._id.$oid)?.length ?? 0;
      return {
        id: n._id.$oid,
        nodeType: 'org',
        name: n.name,
        type: n.type,
        organisation: n,
        count,
        r: orgRadius(count),
        x: 0,
        y: 0,
      };
    });

    orgNodes.forEach((n) => {
      n.count = projectsByOrg.get(n.id)?.length ?? 0;
      n.r = orgRadius(n.count);
    });

    const activeOrgs = orgNodes.filter((n) => n.count > 0);
    const sizes = projects.map((p) => p.organisations.length);
    const projRadius = d3
      .scaleSqrt()
      .domain([2, d3.max(sizes) || 2])
      .range([6, 22])
      .clamp(true);

    const projectNodes: NetworkNode[] = projects.map((p) => ({
      id: `p:${p._id}`,
      nodeType: 'project',
      name: p.short || p.title || p.externalId || '—',
      project: p,
      count: p.organisations.length,
      r: projRadius(p.organisations.length),
      x: 0,
      y: 0,
    }));

    this.nodes = [...activeOrgs, ...projectNodes];
    this.byId = new Map(this.nodes.map((n) => [n.id, n]));

    this.links = [];
    projects.forEach((p) => {
      const project = this.byId.get(`p:${p._id}`)!;
      p.organisations.forEach((orgId) => {
        const org = this.byId.get(orgId);
        if (org) this.links.push({ source: org, target: project });
      });
    });

    this.neighbors.clear();
    this.links.forEach((l) => {
      if (!this.neighbors.has(l.source.id)) this.neighbors.set(l.source.id, new Set());
      if (!this.neighbors.has(l.target.id)) this.neighbors.set(l.target.id, new Set());
      this.neighbors.get(l.source.id)!.add(l.target.id);
      this.neighbors.get(l.target.id)!.add(l.source.id);
    });

    const topOrgs = activeOrgs.map((n) => n.count).sort((a, b) => b - a);
    const topProjects = projectNodes.map((n) => n.count).sort((a, b) => b - a);
    this.orgLabelMin = topOrgs[Math.min(9, topOrgs.length - 1)] ?? 0;
    this.projectLabelMin = topProjects[Math.min(7, topProjects.length - 1)] ?? 0;

    this.selected.set(null);
  }

  private computeLayout(): void {
    const fans = this.planFans();
    const seen = new Set<string>();
    const components: NetworkNode[][] = [];

    this.nodes.forEach((start) => {
      if (seen.has(start.id)) return;
      const group: NetworkNode[] = [];
      const queue = [start.id];
      seen.add(start.id);
      while (queue.length) {
        const id = queue.pop()!;
        group.push(this.byId.get(id)!);
        (this.neighbors.get(id) ?? new Set<string>()).forEach((nb) => {
          if (!seen.has(nb)) {
            seen.add(nb);
            queue.push(nb);
          }
        });
      }
      components.push(group);
    });

    components.forEach((group) => this.layoutComponent(group));
    this.placeFans(fans);
    this.packComponents();
    this.nodes.forEach((n: any) => {
      n.fx = n.x;
      n.fy = n.y;
    });
  }

  private layoutComponent(group: NetworkNode[]): void {
    const core = group.filter((n) => !n.fanned);
    if (core.length < 2) {
      core.forEach((n) => {
        n.x = 0;
        n.y = 0;
      });
      return;
    }

    const coreIds = new Set(core.map((n) => n.id));
    const coreLinks = this.links
      .filter((l) => coreIds.has(l.source.id) && coreIds.has(l.target.id))
      .map((l) => ({ source: l.source.id, target: l.target.id }));

    const spread = Math.sqrt(core.length) * 26;
    core.forEach((n, i) => {
      const a = (i / core.length) * 2 * Math.PI;
      n.x = Math.cos(a) * spread;
      n.y = Math.sin(a) * spread;
    });

    const pull = 0.25 / Math.sqrt(core.length);
    const sim = d3
      .forceSimulation(core as any)
      .force(
        'link',
        d3
          .forceLink(coreLinks as any)
          .id((d: any) => d.id)
          .distance(80)
          .strength(0.5),
      )
      .force('charge', d3.forceManyBody().strength(-160).distanceMax(320))
      .force('collide', d3.forceCollide((d: any) => (d.ringRadius ?? d.r) + 8).iterations(3))
      .force('x', d3.forceX(0).strength(pull))
      .force('y', d3.forceY(0).strength(pull))
      .stop();

    for (let i = 0; i < 300; i++) sim.tick();
  }

  private planFans(): Map<string, NetworkNode[]> {
    const fans = new Map<string, NetworkNode[]>();
    this.nodes
      .filter((n) => n.nodeType === 'project')
      .forEach((project) => {
        const leaves = [...(this.neighbors.get(project.id) ?? [])]
          .map((id) => this.byId.get(id)!)
          .filter((o) => (this.neighbors.get(o.id)?.size ?? 0) === 1);

        if (leaves.length < this.fanThreshold) return;

        leaves.sort((a, b) => a.name.localeCompare(b.name));
        leaves.forEach((l) => (l.fanned = true));
        fans.set(project.id, leaves);

        let placed = 0,
          ring = 0,
          outer = project.r;
        while (placed < leaves.length) {
          const radius = project.r + 58 + ring * 46;
          const perRing = Math.max(6, Math.floor((2 * Math.PI * radius) / this.fanSpacing));
          placed += Math.min(perRing, leaves.length - placed);
          outer = radius;
          ring++;
        }
        project.ringRadius = outer + 20;
      });

    return fans;
  }

  private placeFans(fans: Map<string, NetworkNode[]>): void {
    fans.forEach((leaves, hubId) => {
      const hub = this.byId.get(hubId)!;
      let placed = 0,
        ring = 0;
      while (placed < leaves.length) {
        const radius = hub.r + 58 + ring * 46;
        const perRing = Math.max(6, Math.floor((2 * Math.PI * radius) / this.fanSpacing));
        const count = Math.min(perRing, leaves.length - placed);
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * 2 * Math.PI + ring * 0.45;
          const n = leaves[placed + i];
          n.x = hub.x + Math.cos(angle) * radius;
          n.y = hub.y + Math.sin(angle) * radius;
        }
        placed += count;
        ring++;
      }
    });
  }

  private packComponents(): void {
    const seen = new Set<string>();
    const groups: NetworkNode[][] = [];

    this.nodes.forEach((start) => {
      if (seen.has(start.id)) return;
      const group: NetworkNode[] = [];
      const queue = [start.id];
      seen.add(start.id);
      while (queue.length) {
        const id = queue.pop()!;
        group.push(this.byId.get(id)!);
        (this.neighbors.get(id) ?? new Set<string>()).forEach((nb) => {
          if (!seen.has(nb)) {
            seen.add(nb);
            queue.push(nb);
          }
        });
      }
      groups.push(group);
    });

    const singles = groups.filter((g) => g.length === 1).map((g) => g[0]);
    const clusters = groups.filter((g) => g.length > 1);
    const gap = this.componentGap;
    let targetW = 0,
      bottom = 0;

    if (clusters.length) {
      const boxes = clusters
        .map((nodes) => {
          const minX = d3.min(nodes, (n) => n.x - n.r)!;
          const minY = d3.min(nodes, (n) => n.y - n.r)!;
          const maxX = d3.max(nodes, (n) => n.x + n.r)!;
          const maxY = d3.max(nodes, (n) => n.y + n.r)!;
          return { nodes, minX, minY, w: maxX - minX, h: maxY - minY };
        })
        .sort((a, b) => b.h - a.h);

      const area = boxes.reduce((s, b) => s + (b.w + gap) * (b.h + gap), 0);
      const aspect = (this.width || 1) / (this.height || 1);
      targetW = Math.max(Math.sqrt(area * aspect), d3.max(boxes, (b) => b.w)!);

      let cx = 0,
        cy = 0,
        rowH = 0;
      for (const b of boxes) {
        if (cx > 0 && cx + b.w > targetW) {
          cx = 0;
          cy += rowH + gap;
          rowH = 0;
        }
        const dx = cx - b.minX,
          dy = cy - b.minY;
        b.nodes.forEach((n) => {
          n.x += dx;
          n.y += dy;
        });
        cx += b.w + gap;
        rowH = Math.max(rowH, b.h);
      }
      bottom = cy + rowH;
    }

    if (!singles.length) return;
    const step = this.isolatedStep;

    if (!targetW)
      targetW = Math.sqrt(singles.length) * step * ((this.width || 1) / (this.height || 1));

    const perRow = Math.max(1, Math.round(targetW / step));
    const startY = clusters.length ? bottom + this.isolatedOffset : 0;

    singles.sort((a, b) => a.name.localeCompare(b.name));
    singles.forEach((n, i) => {
      n.x = (i % perRow) * step + n.r;
      n.y = startY + Math.floor(i / perRow) * step + n.r;
    });
  }

  private symbolPath(n: NetworkNode): string {
    const gen = d3
      .symbol()
      .type(n.nodeType === 'project' ? d3.symbolSquare : d3.symbolCircle)
      .size(n.nodeType === 'project' ? Math.pow(n.r * 1.85, 2) : Math.PI * n.r * n.r);
    return gen() ?? '';
  }

  private render(): void {
    d3.select('div#network').select('svg').remove();

    this.svgRoot = d3
      .select('div#network')
      .append('svg')
      .attr('width', this.width + this.margin * 2)
      .attr('height', this.height + this.margin * 2)
      .on('click', () => this.clearSelection());

    this.layer = this.svgRoot.append('g');
    this.zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (e: any) => this.layer.attr('transform', e.transform));
    this.svgRoot.call(this.zoomBehavior);

    const [lg, ng, tg] = [this.layer.append('g'), this.layer.append('g'), this.layer.append('g')];

    this.linkSel = lg
      .selectAll('line')
      .data(this.links)
      .join('line')
      .attr('x1', (d: NetworkLink) => d.source.x)
      .attr('y1', (d: NetworkLink) => d.source.y)
      .attr('x2', (d: NetworkLink) => d.target.x)
      .attr('y2', (d: NetworkLink) => d.target.y)
      .attr('stroke', '#64748b')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.16)
      .style('pointer-events', 'none');

    this.nodeSel = ng
      .selectAll('path')
      .data(this.nodes)
      .join('path')
      .attr('d', (d: NetworkNode) => this.symbolPath(d))
      .attr('transform', (d: NetworkNode) => `translate(${d.x},${d.y})`)
      .attr('fill', (d: NetworkNode) => this.color(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.4)
      .attr('fill-opacity', (d: NetworkNode) => (d.nodeType === 'org' && d.count === 0 ? 0.75 : 1))
      .style('cursor', 'pointer')
      .on('mouseenter', (_: MouseEvent, d: NetworkNode) => this.highlight(d))
      .on('mouseleave', () => this.restore())
      .on('click', (e: MouseEvent, d: NetworkNode) => {
        e.stopPropagation();
        this.select(d);
      });

    this.labelSel = tg
      .selectAll('g')
      .data(this.nodes)
      .join('g')
      .attr(
        'transform',
        (d: NetworkNode) => `translate(${d.x + d.r + (d.nodeType === 'project' ? 14 : 5)},${d.y})`,
      )
      .style('pointer-events', 'none')
      .attr('opacity', (d: NetworkNode) => (this.labelVisible(d) ? 1 : 0));

    this.labelSel
      .filter((d: NetworkNode) => d.nodeType === 'project')
      .append('rect')
      .attr('rx', 3)
      .attr('fill', '#fff')
      .attr('fill-opacity', 0.9)
      .attr('stroke', this.projectColor)
      .attr('stroke-width', 1);

    this.labelSel
      .append('text')
      .text((d: NetworkNode) => d.name)
      .attr('font-size', 10)
      .attr('fill', (d: NetworkNode) => (d.nodeType === 'project' ? '#0f172a' : '#334155'))
      .attr('font-weight', (d: NetworkNode) => (d.nodeType === 'project' ? 600 : 400))
      .attr('dominant-baseline', 'middle');

    this.sizeProjectLabels();
    (document as any).fonts?.ready?.then(() => this.sizeProjectLabels());
    requestAnimationFrame(() => this.sizeProjectLabels());

    this.applyFilter();
  }

  private sizeProjectLabels(): void {
    if (!this.labelSel) return;
    const padX = 7,
      padY = 3.5;

    this.labelSel.each(function (this: SVGGElement, d: NetworkNode) {
      if (d.nodeType !== 'project') return;
      const g = d3.select(this);
      const text = g.select<SVGTextElement>('text').node();
      if (!text) return;

      const bb = text.getBBox();
      if (!bb.width) return;

      g.select('rect')
        .attr('x', bb.x - padX)
        .attr('y', bb.y - padY)
        .attr('width', bb.width + padX * 2)
        .attr('height', bb.height + padY * 2);
    });
  }

  private labelVisible(d: NetworkNode): boolean {
    return d.nodeType === 'project' ? d.count >= this.projectLabelMin : d.count >= this.orgLabelMin;
  }

  private egoSet(d: NetworkNode): Set<string> {
    const set = new Set<string>([d.id]);
    const first = this.neighbors.get(d.id) ?? new Set<string>();
    first.forEach((id) => set.add(id));
    if (d.nodeType === 'org') {
      first.forEach((projectId) =>
        (this.neighbors.get(projectId) ?? new Set<string>()).forEach((id) => set.add(id)),
      );
    }
    return set;
  }

  private highlight(d: NetworkNode): void {
    const ego = this.egoSet(d);
    const relevant = (l: NetworkLink) =>
      d.nodeType === 'org'
        ? (this.neighbors.get(d.id)?.has(l.target.id) ?? false)
        : l.target.id === d.id;

    const selectedId = this.selected()?.id;

    this.nodeSel.attr('opacity', (n: NetworkNode) => (ego.has(n.id) ? 1 : 0.1));
    this.linkSel
      .attr('stroke-opacity', (l: NetworkLink) => (relevant(l) ? 0.75 : 0.03))
      .attr('stroke', (l: NetworkLink) => (relevant(l) ? '#0f172a' : '#64748b'));

    this.labelSel.attr('opacity', (n: NetworkNode) =>
      n.id === d.id || n.id === selectedId ? 1 : 0,
    );
  }

  private restore(): void {
    const sel = this.selected();
    if (sel) {
      this.highlight(sel);
      return;
    }

    this.nodeSel.attr('opacity', 1);
    this.linkSel.attr('stroke-opacity', 0.16).attr('stroke', '#64748b');
    this.labelSel.attr('opacity', (n: NetworkNode) => (this.labelVisible(n) ? 1 : 0));
    this.applyFilter();
  }

  private select(d: NetworkNode): void {
    this.selected.set(d);

    if (d.nodeType === 'org') {
      this.projectSelected.emit(null);

      const projectIds = this.neighbors.get(d.id) ?? new Set<string>();

      const projects = [...projectIds]
        .map((id) => this.byId.get(id)!)
        .filter((n) => n?.nodeType === 'project')
        .map((n) => n.project!)
        .sort((a, b) => (a.short ?? '').localeCompare(b.short ?? ''));

      const partners = new Set<string>();
      projectIds.forEach((pid) =>
        (this.neighbors.get(pid) ?? new Set<string>()).forEach((orgId) => {
          if (orgId !== d.id) partners.add(orgId);
        }),
      );

      this.nodeSelected.emit({
        organisation: d.organisation!,
        projectCount: d.count,
        cooperationCount: partners.size,
        projects,
      });
    } else {
      this.nodeSelected.emit(null);
      const orgs = [...(this.neighbors.get(d.id) ?? [])]
        .map((id) => this.byId.get(id)!)
        .filter((n) => n?.organisation)
        .map((n) => n.organisation!)
        .sort((a, b) => a.name.localeCompare(b.name));
      this.projectSelected.emit({ project: d.project!, organisations: orgs });
    }

    this.highlight(d);
  }

  private clearSelection(): void {
    this.selected.set(null);
    this.nodeSelected.emit(null);
    this.projectSelected.emit(null);
    this.restore();
  }

  private applyFilter(): void {
    if (!this.nodeSel) return;
    const types = this._filters().organisationTypes;
    const ok = (n: NetworkNode) =>
      n.nodeType === 'project' || types.length === 0 || types.includes(n.type ?? '');

    this.nodeSel.style('display', (n: NetworkNode) => (ok(n) ? null : 'none'));
    this.labelSel.style('display', (n: NetworkNode) => (ok(n) ? null : 'none'));
    this.linkSel.style('display', (l: NetworkLink) =>
      ok(l.source) && ok(l.target) ? null : 'none',
    );
  }

  private fitToView(): void {
    if (!this.nodes.length || !this.svgRoot) return;
    const pad = 16;
    const minX = d3.min(this.nodes, (n) => n.x - n.r)! - pad;
    const maxX = d3.max(this.nodes, (n) => n.x + n.r)! + pad;
    const minY = d3.min(this.nodes, (n) => n.y - n.r)! - pad;
    const maxY = d3.max(this.nodes, (n) => n.y + n.r)! + pad;

    const bw = Math.max(maxX - minX, 1),
      bh = Math.max(maxY - minY, 1);
    const fw = this.width + this.margin * 2,
      fh = this.height + this.margin * 2;
    const scale = Math.min(fw / bw, fh / bh, 2.5);

    this.svgRoot.call(
      this.zoomBehavior.transform,
      d3.zoomIdentity
        .translate(fw / 2 - scale * (minX + bw / 2), fh / 2 - scale * (minY + bh / 2))
        .scale(scale),
    );
  }
}

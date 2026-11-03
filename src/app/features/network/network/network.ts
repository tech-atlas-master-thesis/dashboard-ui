import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, effect, signal } from '@angular/core';
import {
  NetworkData,
  NetworkFilters,
  NetworkLink,
  NetworkNode,
  Organisation,
  OrganisationSelection,
  Project,
  ProjectSelection,
  DEFAULT_BUNDLE_FROM,
  emptyFilters,
  organisationColor,
} from '@shared/models/network.model';
import { NetworkService } from '@shared/services/network-service';
import * as d3 from 'd3';
import { NO_VALUE, matchesFilters } from '@shared/utils/network-filter.utils';
import { Spinner, SPINNER_CLASS } from '@ui/spinner/spinner';

@Component({
  selector: 'app-network',
  imports: [Spinner],
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
  @Input() set selectNode(request: { id: string } | null) {
    if (request?.id) this.selectById(request.id);
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

  private expandedBundles = new Set<string>();
  private selectedMember: string | null = null;

  private fringeGroups: NetworkNode[][] = [];
  private fringeOpen = true;
  private fringeProjects = 0;
  private fringeOrganisations = 0;
  private fringeHidden = 0;
  private bandHeight = 0;

  private svgRoot: any;
  private layer: any;
  private overlayLayer: any;
  private resizeTimer: any;
  private busyEl: HTMLDivElement | null = null;
  private pendingTimer: any;
  private zoomBehavior: any;
  private linkSel: any;
  private nodeSel: any;
  private labelSel: any;
  private margin = 20;
  private width = 0;
  private height = 0;
  private resizeObserver!: ResizeObserver;

  private readonly fanThreshold = 4;
  private readonly fanSpacing = 42;
  private readonly fanInner = 50;
  private readonly fanRing = 40;
  private readonly componentGap = 16;
  private readonly projectColor = '#475569';
  private readonly leadColor = '#1e293b';

  private readonly bandPad = 14;
  private readonly bandCaption = 22;
  private readonly fringeMaxSize = 1;

  private readonly bundleFill = '#f1f3f6';
  private readonly bundleStroke = '#9ca3af';
  private readonly fringeFill = '#fafafa';

  private linkWidth = (l: NetworkLink) => (l.lead ? 2.5 : 1);
  private linkColor = (l: NetworkLink) => (l.lead ? this.leadColor : '#64748b');
  private linkOpacity = (l: NetworkLink) => (l.lead ? 0.5 : 0.2);

  private color = (n: NetworkNode) => {
    if (n.nodeType === 'project') return this.projectColor;
    if (n.nodeType === 'bundle') return this.bundleFill;
    return organisationColor(n.type);
  };

  constructor(public networkservice: NetworkService) {
    effect(() => {
      const data = this.networkservice.data.value();
      const filters = this._filters();
      if (!data) return;
      this.expandedBundles.clear();
      this.selectedMember = null;
      this.run(() => {
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
    clearTimeout(this.resizeTimer);
    clearTimeout(this.pendingTimer);
    this.setBusy(false);
  }

  private run(work: () => void): void {
    clearTimeout(this.pendingTimer);
    this.setBusy(true);
    this.pendingTimer = setTimeout(() =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          try {
            work();
          } finally {
            this.setBusy(false);
          }
        }),
      ),
    );
  }

  private setBusy(on: boolean): void {
    if (!on) {
      this.busyEl?.remove();
      this.busyEl = null;
      return;
    }
    if (this.busyEl) return;

    const host = document.getElementById('network');
    if (!host) return;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

    const el = document.createElement('div');
    el.setAttribute('aria-busy', 'true');
    el.className = 'absolute inset-0 z-30 flex items-center justify-center bg-white/60 cursor-wait';
    el.innerHTML = `<div class="w-10 h-10 ${SPINNER_CLASS}"></div>`;
    host.append(el);
    this.busyEl = el;
  }

  private rebuild(): void {
    const data = this.networkservice.data.value();
    if (!data) return;
    this.buildGraph(data, this._filters());
    this.computeLayout();
    this.render();
  }

  private toggleFringe(): void {
    this.fringeOpen = !this.fringeOpen;
    this.nodes.forEach((n) => {
      if (n.fringe) n.hidden = !this.fringeOpen;
    });
    this.layoutBand(this.fringeGroups);
    this.render();
  }

  private attachResizeObserver(): void {
    this.resizeObserver?.disconnect();
    const el = document.getElementById('network');
    if (!el) return;
    this.resizeObserver = new ResizeObserver(() => {
      this.width = el.clientWidth - this.margin * 2;
      this.height = el.clientHeight - this.margin * 2;
      this.svgRoot?.attr('width', this.width + this.margin * 2).attr('height', this.height + this.margin * 2);
      this.fitToView();

      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(
        () =>
          this.run(() => {
            this.rebuild();
            this.fitToView();
          }),
        220,
      );
    });
    this.resizeObserver.observe(el);
  }

  private buildGraph(data: NetworkData, filters: NetworkFilters): void {
    const types = filters.organisationTypes;
    const allowed = new Set(data.nodes.filter((n) => types.length === 0 || types.includes(n.type || NO_VALUE)).map((n) => n._id.$oid));

    const entries = (data.projects ?? [])
      .filter((p) => matchesFilters(p, filters))
      .map((p) => ({ project: p, members: p.organisations.filter((id) => allowed.has(id)) }))
      .filter((e) => types.length === 0 || e.members.length > 0);

    const projectsByOrg = new Map<string, Project[]>();
    entries.forEach((e) =>
      e.members.forEach((id) => {
        if (!projectsByOrg.has(id)) projectsByOrg.set(id, []);
        projectsByOrg.get(id)!.push(e.project);
      }),
    );

    const orgDocById = new Map<string, Organisation>(data.nodes.map((n) => [n._id.$oid, n]));

    const fold = filters.bundling === true;
    const foldFrom = Math.max(2, filters.bundleFrom ?? DEFAULT_BUNDLE_FROM);
    const folded = new Set<string>();
    const orgBundles: { projectId: string; members: Organisation[] }[] = [];

    for (const e of fold ? entries : []) {
      const leaves = e.members.filter((id) => (projectsByOrg.get(id)?.length ?? 0) === 1);
      if (leaves.length < foldFrom) continue;
      leaves.forEach((id) => folded.add(id));
      orgBundles.push({
        projectId: e.project._id,
        members: leaves.map((id) => orgDocById.get(id)).filter((o): o is Organisation => !!o),
      });
    }

    const soloByOrg = new Map<string, Project[]>();
    for (const e of fold ? entries : []) {
      if (e.members.length !== 1) continue;
      const list = soloByOrg.get(e.members[0]) ?? [];
      list.push(e.project);
      soloByOrg.set(e.members[0], list);
    }

    const foldedProjects = new Set<string>();
    const projectBundles: { orgId: string; projects: Project[] }[] = [];

    soloByOrg.forEach((projects, orgId) => {
      if (projects.length < foldFrom) return;
      projects.forEach((p) => foldedProjects.add(p._id));
      projectBundles.push({ orgId, projects });
    });

    const orgCounts = [...allowed].map((id) => projectsByOrg.get(id)?.length ?? 0);
    const orgRadius = d3
      .scaleSqrt()
      .domain([1, d3.max(orgCounts) || 1])
      .range([5, 24])
      .clamp(true);

    const activeOrgs: NetworkNode[] = data.nodes
      .filter((n) => allowed.has(n._id.$oid) && !folded.has(n._id.$oid) && (projectsByOrg.get(n._id.$oid)?.length ?? 0) > 0)
      .map((n) => {
        const count = projectsByOrg.get(n._id.$oid)!.length;
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

    const sizes = entries.map((e) => e.members.length);
    const projRadius = d3
      .scaleSqrt()
      .domain([2, d3.max(sizes) || 2])
      .range([6, 22])
      .clamp(true);

    const projectNodes: NetworkNode[] = entries
      .filter((e) => !foldedProjects.has(e.project._id))
      .map((e) => ({
        id: `p:${e.project._id}`,
        nodeType: 'project',
        name: e.project.short || e.project.title || e.project.externalId || '—',
        project: e.project,
        count: e.members.length,
        r: projRadius(e.members.length),
        x: 0,
        y: 0,
      }));

    const bundleRadius = d3
      .scaleSqrt()
      .domain([foldFrom, Math.max(d3.max(orgBundles, (b) => b.members.length) ?? foldFrom, d3.max(projectBundles, (b) => b.projects.length) ?? foldFrom)])
      .range([12, 30])
      .clamp(true);

    const orgBundleNodes: NetworkNode[] = orgBundles.map((b) => {
      const leaders = new Set(entries.find((e) => e.project._id === b.projectId)?.project.projectLeader ?? []);
      return {
        id: `b:${b.projectId}`,
        nodeType: 'bundle',
        bundleOf: 'org',
        name: `+${b.members.length}`,
        members: b.members,
        leadIds: b.members.filter((o) => leaders.has(o._id.$oid)).map((o) => o._id.$oid),
        count: b.members.length,
        r: bundleRadius(b.members.length),
        x: 0,
        y: 0,
      };
    });

    const projectBundleNodes: NetworkNode[] = projectBundles.map((b) => ({
      id: `bp:${b.orgId}`,
      nodeType: 'bundle',
      bundleOf: 'project',
      name: `+${b.projects.length}`,
      bundledProjects: b.projects,
      leadIds: b.projects.filter((p) => (p.projectLeader ?? []).includes(b.orgId)).map((p) => p._id),
      count: b.projects.length,
      r: bundleRadius(b.projects.length),
      x: 0,
      y: 0,
    }));

    this.nodes = [...activeOrgs, ...projectNodes, ...orgBundleNodes, ...projectBundleNodes];
    this.byId = new Map(this.nodes.map((n) => [n.id, n]));

    this.links = [];
    entries.forEach((e) => {
      const project = this.byId.get(`p:${e.project._id}`);
      if (!project) return;

      const leaders = new Set(e.project.projectLeader ?? []);

      e.members.forEach((orgId) => {
        const org = this.byId.get(orgId);
        if (org) this.links.push({ source: org, target: project, lead: leaders.has(orgId) });
      });

      const bundle = this.byId.get(`b:${e.project._id}`);
      if (bundle) {
        this.links.push({ source: bundle, target: project, lead: !!bundle.leadIds?.length });
      }
    });

    projectBundleNodes.forEach((bundle) => {
      const org = this.byId.get(bundle.id.slice(3));
      if (org) this.links.push({ source: org, target: bundle, lead: !!bundle.leadIds?.length });
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

    const fringe: NetworkNode[][] = [];
    const clusters: NetworkNode[][] = [];
    this.components().forEach((g) => (this.isFringe(g) ? fringe : clusters).push(g));

    const fringeNodes = fringe.flat();
    this.nodes.forEach((n) => {
      n.fringe = false;
      n.hidden = false;
    });
    fringeNodes.forEach((n) => {
      n.fringe = true;
      n.hidden = !this.fringeOpen;
    });

    this.fringeProjects = fringeNodes.filter((n) => n.nodeType === 'project').length;
    this.fringeOrganisations = fringeNodes.filter((n) => n.nodeType !== 'project').length;
    this.fringeGroups = fringe;
    this.layoutBand(fringe);

    clusters.forEach((group) => this.layoutComponent(group));
    this.placeFans(fans);
    this.packComponents(clusters);

    this.nodes.forEach((n: any) => {
      n.fx = n.x;
      n.fy = n.y;
    });
  }

  private layoutAspect(): number {
    const h = Math.max((this.height || 1) - this.bandHeight, 1);
    return Math.min(Math.max((this.width || 1) / h, 0.6), 3);
  }

  private isFringe(group: NetworkNode[]): boolean {
    let participants = 0;
    let projects = 0;

    group.forEach((n) => {
      if (n.nodeType === 'org') participants++;
      else if (n.nodeType === 'project') projects++;
      else if (n.bundleOf === 'org') participants += n.count;
      else projects += n.count;
    });

    return participants <= this.fringeMaxSize && projects <= 1;
  }

  private components(): NetworkNode[][] {
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

    return groups;
  }

  private layoutFringeGroup(group: NetworkNode[]): void {
    const ordered = [...group].sort((a, b) => (a.nodeType === 'project' ? -1 : 1));
    let x = 0;
    ordered.forEach((n) => {
      n.x = x + n.r;
      n.y = 0;
      x += n.r * 2 + 8;
    });
  }

  private layoutBand(groups: NetworkNode[][]): void {
    this.fringeHidden = 0;
    this.bandHeight = 0;

    if (!groups.length) return;

    if (!this.fringeOpen) {
      this.bandHeight = this.bandCaption + this.bandPad;
      return;
    }

    groups.forEach((g) => this.layoutFringeGroup(g));

    const boxes = groups
      .map((nodes) => {
        const minX = d3.min(nodes, (n) => n.x - n.r)!;
        const maxX = d3.max(nodes, (n) => n.x + n.r)!;
        const h = d3.max(nodes, (n) => n.r * 2)!;
        return { nodes, minX, w: maxX - minX, h };
      })
      .sort((a, b) => b.h - a.h || b.w - a.w);

    const avail = Math.max(this.width - this.bandPad * 2, 160);
    const gapX = 16,
      gapY = 10;

    let cx = 0,
      cy = 0,
      rowH = 0;

    for (const b of boxes) {
      if (cx > 0 && cx + b.w > avail) {
        cx = 0;
        cy += rowH + gapY;
        rowH = 0;
      }

      if (!cx) rowH = b.h;

      const dx = this.bandPad + cx - b.minX;
      b.nodes.forEach((n) => {
        n.x += dx;
        n.y = cy + rowH / 2;
      });
      cx += b.w + gapX;
    }

    let content = cy + rowH;

    const limit = Math.max(72, (this.height || 0) - this.bandCaption - this.bandPad - 40);
    if (content > limit) {
      let kept = 0;
      this.nodes.forEach((n) => {
        if (!n.fringe) return;
        if (n.y + n.r > limit) {
          n.hidden = true;
          this.fringeHidden++;
        } else {
          kept = Math.max(kept, n.y + n.r);
        }
      });
      content = kept;
    }

    this.bandHeight = this.bandCaption + content + this.bandPad;
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
    const coreLinks = this.links.filter((l) => coreIds.has(l.source.id) && coreIds.has(l.target.id)).map((l) => ({ source: l.source.id, target: l.target.id }));

    const stretch = Math.sqrt(this.layoutAspect());

    const spread = Math.sqrt(core.length) * 26;
    core.forEach((n, i) => {
      const a = (i / core.length) * 2 * Math.PI;
      n.x = Math.cos(a) * spread * stretch;
      n.y = (Math.sin(a) * spread) / stretch;
    });

    const pull = 0.25 / Math.sqrt(core.length);
    const sim = d3
      .forceSimulation(core as any)
      .force(
        'link',
        d3
          .forceLink(coreLinks as any)
          .id((d: any) => d.id)
          .distance(68)
          .strength(0.5),
      )
      .force('charge', d3.forceManyBody().strength(-150).distanceMax(320))
      .force('collide', d3.forceCollide((d: any) => (d.ringRadius ?? d.r) + 7).iterations(3))
      .force('x', d3.forceX(0).strength(pull / stretch))
      .force('y', d3.forceY(0).strength(pull * stretch))
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
          .filter((o) => o.nodeType === 'org' && (this.neighbors.get(o.id)?.size ?? 0) === 1);

        if (leaves.length < this.fanThreshold) return;

        leaves.sort((a, b) => a.name.localeCompare(b.name));
        leaves.forEach((l) => (l.fanned = true));
        fans.set(project.id, leaves);

        let placed = 0,
          ring = 0,
          outer = project.r;
        while (placed < leaves.length) {
          const radius = project.r + this.fanInner + ring * this.fanRing;
          const perRing = Math.max(6, Math.floor((2 * Math.PI * radius) / this.fanSpacing));
          placed += Math.min(perRing, leaves.length - placed);
          outer = radius;
          ring++;
        }
        project.ringRadius = outer + 16;
      });

    return fans;
  }

  private placeFans(fans: Map<string, NetworkNode[]>): void {
    fans.forEach((leaves, hubId) => {
      const hub = this.byId.get(hubId)!;
      let placed = 0,
        ring = 0;
      while (placed < leaves.length) {
        const radius = hub.r + this.fanInner + ring * this.fanRing;
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

  private packComponents(clusters: NetworkNode[][]): void {
    if (!clusters.length) return;

    const gap = this.componentGap;
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
    const targetW = Math.max(Math.sqrt(area * this.layoutAspect()), d3.max(boxes, (b) => b.w)!);

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
  }

  private isSquare(n: NetworkNode): boolean {
    return n.nodeType === 'project' || n.bundleOf === 'project';
  }

  private symbolPath(n: NetworkNode): string {
    const square = this.isSquare(n);
    const gen = d3
      .symbol()
      .type(square ? d3.symbolSquare : d3.symbolCircle)
      .size(square ? Math.pow(n.r * 1.85, 2) : Math.PI * n.r * n.r);
    return gen() ?? '';
  }

  private visibleNodes(): NetworkNode[] {
    return this.nodes.filter((n) => !n.hidden && !n.fringe);
  }

  private visibleLinks(): NetworkLink[] {
    return this.links.filter((l) => !l.source.hidden && !l.target.hidden && !l.source.fringe);
  }

  private bandNodes(): NetworkNode[] {
    return this.nodes.filter((n) => !n.hidden && n.fringe);
  }

  private bandLinks(): NetworkLink[] {
    return this.links.filter((l) => !l.source.hidden && !l.target.hidden && l.source.fringe);
  }

  private render(): void {
    d3.select('div#network').select('svg').remove();

    const totalW = this.width + this.margin * 2;
    const totalH = this.height + this.margin * 2;

    this.svgRoot = d3
      .select('div#network')
      .append('svg')
      .attr('width', totalW)
      .attr('height', totalH)
      .on('click', () => this.clearSelection());

    this.layer = this.svgRoot.append('g');
    this.zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (e: any) => this.layer.attr('transform', e.transform));
    this.svgRoot.call(this.zoomBehavior);

    const [lg, ng, tg] = [this.layer.append('g'), this.layer.append('g'), this.layer.append('g')];

    this.drawLinks(lg, this.visibleLinks());
    this.drawNodes(ng, this.visibleNodes());
    this.drawLabels(tg, this.visibleNodes());

    this.overlayLayer = this.layer.append('g');

    this.renderBand(totalW, totalH);

    this.linkSel = this.svgRoot.selectAll('line.link');
    this.nodeSel = this.svgRoot.selectAll('path.node');
    this.labelSel = this.svgRoot.selectAll('g.label');

    this.sizeLabelPlates();
    (document as any).fonts?.ready?.then(() => this.sizeLabelPlates());
    requestAnimationFrame(() => this.sizeLabelPlates());

    this.renderOverlays();
  }

  private drawLinks(group: any, links: NetworkLink[]): void {
    group
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .attr('x1', (d: NetworkLink) => d.source.x)
      .attr('y1', (d: NetworkLink) => d.source.y)
      .attr('x2', (d: NetworkLink) => d.target.x)
      .attr('y2', (d: NetworkLink) => d.target.y)
      .attr('stroke', (d: NetworkLink) => this.linkColor(d))
      .attr('stroke-width', (d: NetworkLink) => this.linkWidth(d))
      .attr('stroke-opacity', (d: NetworkLink) => this.linkOpacity(d))
      .style('pointer-events', 'none');
  }

  private drawNodes(group: any, nodes: NetworkNode[]): void {
    group
      .selectAll('path')
      .data(nodes)
      .join('path')
      .attr('class', 'node')
      .attr('d', (d: NetworkNode) => this.symbolPath(d))
      .attr('transform', (d: NetworkNode) => `translate(${d.x},${d.y})`)
      .attr('fill', (d: NetworkNode) => this.color(d))
      .attr('stroke', (d: NetworkNode) => (d.nodeType === 'bundle' ? (d.leadIds?.length ? this.leadColor : this.bundleStroke) : '#fff'))
      .attr('stroke-width', (d: NetworkNode) => (d.leadIds?.length ? 1.8 : 1.4))
      .attr('stroke-dasharray', (d: NetworkNode) => (d.nodeType === 'bundle' && !d.leadIds?.length ? '3 2' : null))
      .attr('fill-opacity', (d: NetworkNode) => (d.nodeType === 'org' && d.count === 0 ? 0.75 : 1))
      .style('cursor', 'pointer')
      .on('mouseenter', (_: MouseEvent, d: NetworkNode) => this.highlight(d))
      .on('mouseleave', () => this.restore())
      .on('click', (e: MouseEvent, d: NetworkNode) => {
        e.stopPropagation();
        this.select(d);
      });
  }

  private drawLabels(group: any, nodes: NetworkNode[]): void {
    const sel = group
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'label')
      .attr('transform', (d: NetworkNode) =>
        d.nodeType === 'bundle' ? `translate(${d.x},${d.y})` : `translate(${d.x + d.r + (d.nodeType === 'project' ? 14 : 9)},${d.y})`,
      )
      .style('pointer-events', 'none')
      .attr('opacity', (d: NetworkNode) => (this.labelVisible(d) ? 1 : 0));

    sel
      .filter((d: NetworkNode) => d.nodeType !== 'bundle')
      .append('rect')
      .attr('class', 'plate')
      .attr('rx', 3)
      .attr('fill', '#fff')
      .attr('fill-opacity', 0.92)
      .attr('stroke', (d: NetworkNode) => (d.nodeType === 'project' ? this.projectColor : organisationColor(d.type)))
      .attr('stroke-width', 1);

    sel
      .append('text')
      .text((d: NetworkNode) => d.name)
      .attr('font-size', 10)
      .attr('text-anchor', (d: NetworkNode) => (d.nodeType === 'bundle' ? 'middle' : 'start'))
      .attr('fill', (d: NetworkNode) => {
        if (d.nodeType === 'project') return '#0f172a';
        if (d.nodeType === 'bundle') return '#475569';
        return '#334155';
      })
      .attr('font-weight', (d: NetworkNode) => (d.nodeType === 'org' ? 400 : 600))
      .attr('dominant-baseline', 'middle');
  }

  private renderBand(totalW: number, totalH: number): void {
    if (!this.fringeProjects && !this.fringeOrganisations) return;

    const band = this.svgRoot.append('g').attr('transform', `translate(0,${totalH - this.bandHeight})`);

    band.append('rect').attr('width', totalW).attr('height', this.bandHeight).attr('fill', this.fringeFill).style('pointer-events', 'none');

    band.append('line').attr('x1', 0).attr('x2', totalW).attr('y1', 0.5).attr('y2', 0.5).attr('stroke', '#e5e7eb').style('pointer-events', 'none');

    const parts: string[] = [];
    if (this.fringeProjects) parts.push(`${this.fringeProjects} Projekte ohne Verbindung`);
    if (this.fringeHidden) parts.push(`${this.fringeHidden} davon kein Platz`);

    band
      .append('text')
      .attr('x', this.bandPad)
      .attr('y', 14)
      .attr('font-size', 10)
      .attr('fill', '#6b7280')
      .style('cursor', 'pointer')
      .text(`${this.fringeOpen ? '▾' : '▸'} ${parts.join(' · ')}`)
      .on('click', (e: MouseEvent) => {
        e.stopPropagation();
        this.toggleFringe();
      });

    if (!this.fringeOpen) return;

    const content = band.append('g').attr('transform', `translate(0,${this.bandCaption})`);
    this.drawLinks(content.append('g'), this.bandLinks());
    this.drawNodes(content.append('g'), this.bandNodes());
    this.drawLabels(content.append('g'), this.bandNodes());
  }

  private isOpen(n: NetworkNode): boolean {
    return n.nodeType === 'bundle' && this.expandedBundles.has(n.id);
  }

  private updateBundleHits(): void {
    this.nodeSel?.style('pointer-events', (n: NetworkNode) => (this.isOpen(n) ? 'none' : 'auto'));
  }

  private overlayItems(bundle: NetworkNode): { id: string; name: string; color: string; lead: boolean }[] {
    const leads = new Set(bundle.leadIds ?? []);

    if (bundle.bundleOf === 'project') {
      return (bundle.bundledProjects ?? [])
        .map((p) => ({
          id: p._id,
          name: p.short || p.title || p.externalId || '—',
          color: this.projectColor,
          lead: leads.has(p._id),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return (bundle.members ?? [])
      .map((o) => ({
        id: o._id.$oid,
        name: o.name,
        color: organisationColor(o.type),
        lead: leads.has(o._id.$oid),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private openOverlay(bundle: NetworkNode): void {
    if (this.isOpen(bundle)) return;

    this.expandedBundles.add(bundle.id);
    this.selected.set(null);
    this.selectedMember = null;
    this.nodeSelected.emit(null);
    this.projectSelected.emit(null);

    this.restore();
    this.renderOverlay(bundle, true);
  }

  private syncOverlays(d: NetworkNode): void {
    this.selectedMember = null;

    const attached = [...this.egoSet(d)].map((id) => this.byId.get(id)!).filter((n) => n?.nodeType === 'bundle');

    const keep = new Set(attached.map((n) => n.id));

    [...this.expandedBundles].forEach((id) => {
      if (keep.has(id)) return;
      const bundle = this.byId.get(id);
      if (bundle) this.closeOverlay(bundle);
    });

    attached.forEach((bundle) => {
      const wasOpen = this.isOpen(bundle);
      if (wasOpen) this.overlayLayer?.selectAll(`g[data-bundle="${bundle.id}"]`).remove();
      else this.expandedBundles.add(bundle.id);
      this.renderOverlay(bundle, !wasOpen);
    });
  }

  private closeAllOverlays(): void {
    [...this.expandedBundles].forEach((id) => {
      const bundle = this.byId.get(id);
      if (bundle) this.closeOverlay(bundle);
    });
    this.expandedBundles.clear();
  }

  private closeOverlay(bundle: NetworkNode): void {
    this.expandedBundles.delete(bundle.id);
    this.selectedMember = null;
    this.restore();
    this.updateBundleHits();

    this.overlayLayer
      ?.selectAll(`g[data-bundle="${bundle.id}"]`)
      .transition()
      .duration(130)
      .ease(d3.easeCubicIn)
      .attr('opacity', 0)
      .attr('transform', this.overlayTransform(bundle, 1, 1, 0.3))
      .remove();
  }

  private overlayTransform(bundle: NetworkNode, w: number, h: number, scale: number): string {
    return `translate(${bundle.x},${bundle.y}) scale(${scale}) translate(${-w / 2},${-h / 2})`;
  }

  private renderOverlays(): void {
    if (!this.overlayLayer) return;
    this.overlayLayer.selectAll('*').remove();

    this.updateBundleHits();
    this.restore();

    this.nodes.filter((n) => this.isOpen(n)).forEach((b) => this.renderOverlay(b, false));
  }

  private renderOverlay(bundle: NetworkNode, animate: boolean): void {
    const items = this.overlayItems(bundle);
    if (!items.length || !this.overlayLayer) return;

    const cell = 18,
      pad = 10,
      top = 10,
      dot = 5;

    const cols = Math.max(2, Math.round(Math.sqrt(items.length * 1.8)));
    const rows = Math.ceil(items.length / cols);
    const w = cols * cell + pad * 2;
    const h = top + rows * cell + 8;

    const g = this.overlayLayer
      .append('g')
      .attr('data-bundle', bundle.id)
      .attr('transform', this.overlayTransform(bundle, w, h, animate ? 0.3 : 1))
      .attr('opacity', animate ? 0 : 1);

    this.updateBundleHits();

    if (animate) {
      g.transition()
        .duration(220)
        .ease(d3.easeCubicOut)
        .attr('transform', this.overlayTransform(bundle, w, h, 1))
        .attr('opacity', 1);
    }

    g.append('rect')
      .attr('width', w)
      .attr('height', h)
      .attr('rx', 8)
      .attr('fill', this.bundleFill)
      .attr('stroke', bundle.leadIds?.length ? this.leadColor : this.bundleStroke)
      .attr('stroke-width', 1)
      .on('click', (e: MouseEvent) => e.stopPropagation());

    const close = g
      .append('g')
      .attr('transform', `translate(${w - 9},9)`)
      .style('cursor', 'pointer')
      .on('click', (e: MouseEvent) => {
        e.stopPropagation();
        this.closeOverlay(bundle);
      });

    close.append('circle').attr('r', 7).attr('fill', 'transparent');

    [
      [-3.2, -3.2, 3.2, 3.2],
      [3.2, -3.2, -3.2, 3.2],
    ].forEach(([x1, y1, x2, y2]) =>
      close
        .append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', '#6b7280')
        .attr('stroke-width', 1.4)
        .attr('stroke-linecap', 'round'),
    );

    const square = bundle.bundleOf === 'project';
    const marks: { mark: any; item: (typeof items)[0]; cx: number; cy: number }[] = [];

    items.forEach((item, i) => {
      const cx = pad + (i % cols) * cell + cell / 2;
      const cy = top + Math.floor(i / cols) * cell + cell / 2;

      if (item.lead || this.selectedMember === item.id) {
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', dot + 2.5)
          .attr('fill', 'none')
          .attr('stroke', item.lead ? this.leadColor : '#94a3b8')
          .attr('stroke-width', this.selectedMember === item.id ? 1.6 : 1.1)
          .style('pointer-events', 'none');
      }

      const mark = square
        ? g
            .append('rect')
            .attr('x', cx - dot)
            .attr('y', cy - dot)
            .attr('width', dot * 2)
            .attr('height', dot * 2)
            .attr('rx', 1)
        : g.append('circle').attr('cx', cx).attr('cy', cy).attr('r', dot);

      mark
        .attr('fill', item.color)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('click', (e: MouseEvent) => {
          e.stopPropagation();
          this.selectItem(item.id, bundle);
        });

      marks.push({ mark, item, cx, cy });
    });

    const hover = g.append('g').attr('opacity', 0).style('pointer-events', 'none');

    const plate = hover.append('rect').attr('class', 'plate').attr('rx', 3).attr('fill', '#fff').attr('fill-opacity', 0.92).attr('stroke-width', 1);

    const text = hover.append('text').attr('font-size', 10).attr('fill', '#0f172a').attr('dominant-baseline', 'middle');

    marks.forEach(({ mark, item, cx, cy }) => {
      mark
        .on('mouseenter', () => {
          const flip = cx > w / 2;
          text.text(item.lead ? `${item.name} · Führung` : item.name).attr('text-anchor', flip ? 'end' : 'start');
          hover.attr('transform', `translate(${cx + (flip ? -(dot + 6) : dot + 6)},${cy})`);

          const bb = (text.node() as SVGTextElement).getBBox();
          plate
            .attr('x', bb.x - 6)
            .attr('y', bb.y - 3)
            .attr('width', bb.width + 12)
            .attr('height', bb.height + 6)
            .attr('stroke', item.lead ? this.leadColor : item.color);

          hover.attr('opacity', 1);
        })
        .on('mouseleave', () => hover.attr('opacity', 0));
    });
  }

  private selectItem(id: string, bundle: NetworkNode): void {
    const anchorId = [...(this.neighbors.get(bundle.id) ?? [])][0];
    const anchor = anchorId ? this.byId.get(anchorId) : undefined;
    if (!anchor) return;

    this.selected.set(null);
    this.selectedMember = id;

    if (bundle.bundleOf === 'project') {
      const project = (bundle.bundledProjects ?? []).find((p) => p._id === id);
      if (!project || !anchor.organisation) return;
      this.nodeSelected.emit(null);
      this.projectSelected.emit({ project, organisations: [anchor.organisation] });
    } else {
      const org = (bundle.members ?? []).find((o) => o._id.$oid === id);
      if (!org || !anchor.project) return;

      const partners =
        [...(this.neighbors.get(anchor.id) ?? [])].map((nid) => this.byId.get(nid)!).reduce((sum, n) => sum + (n?.nodeType === 'bundle' ? n.count : 1), 0) - 1;

      this.projectSelected.emit(null);
      this.nodeSelected.emit({
        organisation: org,
        projectCount: 1,
        cooperationCount: Math.max(partners, 0),
        projects: [anchor.project],
      });
    }

    this.restore();
    this.overlayLayer?.selectAll(`g[data-bundle="${bundle.id}"]`).remove();
    this.renderOverlay(bundle, false);
  }

  private sizeLabelPlates(): void {
    if (!this.labelSel) return;
    const padX = 7,
      padY = 3.5;

    this.labelSel.each(function (this: SVGGElement, d: NetworkNode) {
      if (d.nodeType === 'bundle') return;
      const g = d3.select(this);
      const text = g.select<SVGTextElement>('text').node();
      if (!text) return;

      const bb = text.getBBox();
      if (!bb.width) return;

      g.select('rect.plate')
        .attr('x', bb.x - padX)
        .attr('y', bb.y - padY)
        .attr('width', bb.width + padX * 2)
        .attr('height', bb.height + padY * 2);
    });
  }

  private labelVisible(d: NetworkNode): boolean {
    if (d.nodeType === 'bundle') return true;
    if (d.fringe) return false;
    return d.nodeType === 'project' ? d.count >= this.projectLabelMin : d.count >= this.orgLabelMin;
  }

  private egoSet(d: NetworkNode): Set<string> {
    const set = new Set<string>([d.id]);
    const first = this.neighbors.get(d.id) ?? new Set<string>();
    first.forEach((id) => set.add(id));
    if (d.nodeType === 'org') {
      first.forEach((projectId) => (this.neighbors.get(projectId) ?? new Set<string>()).forEach((id) => set.add(id)));
    }
    return set;
  }

  private highlight(d: NetworkNode): void {
    const ego = this.egoSet(d);
    const relevant = (l: NetworkLink) =>
      l.source.id === d.id || l.target.id === d.id || (d.nodeType === 'org' && (this.neighbors.get(d.id)?.has(l.target.id) ?? false));

    const selectedId = this.selected()?.id;

    this.linkSel
      .attr('stroke-opacity', (l: NetworkLink) => (relevant(l) ? (l.lead ? 0.95 : 0.7) : 0.03))
      .attr('stroke', (l: NetworkLink) => (relevant(l) ? (l.lead ? this.leadColor : '#0f172a') : '#64748b'));

    this.applyOpacity(
      (n) => (this.isOpen(n) ? 0 : ego.has(n.id) ? 1 : 0.1),
      (n) => n.id === d.id || n.id === selectedId,
    );
  }

  private applyOpacity(nodeAlpha: (n: NetworkNode) => number, labelShown: (n: NetworkNode) => boolean): void {
    this.nodeSel.attr('opacity', nodeAlpha);
    this.labelSel.attr('opacity', (n: NetworkNode) => (n.nodeType === 'bundle' ? nodeAlpha(n) : labelShown(n) ? 1 : 0));
  }

  private focusIds(): { ids: Set<string>; anchors: Set<string> } | null {
    if (!this.expandedBundles.size) return null;

    const ids = new Set<string>();
    const anchors = new Set<string>();

    this.expandedBundles.forEach((id) => {
      const bundle = this.byId.get(id);
      if (!bundle) return;
      ids.add(bundle.id);
      (this.neighbors.get(bundle.id) ?? new Set<string>()).forEach((anchor) => {
        ids.add(anchor);
        anchors.add(anchor);
        (this.neighbors.get(anchor) ?? new Set<string>()).forEach((x) => ids.add(x));
      });
    });

    return { ids, anchors };
  }

  private restore(): void {
    const sel = this.selected();
    if (sel) {
      this.highlight(sel);
      return;
    }

    const focus = this.focusIds();
    if (focus) {
      const { ids, anchors } = focus;
      const inside = (l: NetworkLink) => ids.has(l.source.id) && ids.has(l.target.id);

      this.linkSel
        .attr('stroke-opacity', (l: NetworkLink) => (inside(l) ? (l.lead ? 0.9 : 0.6) : 0.03))
        .attr('stroke', (l: NetworkLink) => (inside(l) ? (l.lead ? this.leadColor : '#0f172a') : '#64748b'));
      this.applyOpacity(
        (n) => (this.isOpen(n) ? 0 : ids.has(n.id) ? 1 : 0.12),
        (n) => anchors.has(n.id) || (ids.has(n.id) && this.labelVisible(n)),
      );
      return;
    }

    this.linkSel.attr('stroke-opacity', (l: NetworkLink) => this.linkOpacity(l)).attr('stroke', (l: NetworkLink) => this.linkColor(l));
    this.applyOpacity(
      (n) => (this.isOpen(n) ? 0 : 1),
      (n) => this.labelVisible(n),
    );
  }

  private select(d: NetworkNode): void {
    if (d.nodeType === 'bundle') {
      this.openOverlay(d);
      return;
    }

    this.selected.set(d);
    this.syncOverlays(d);

    if (d.nodeType === 'org') {
      this.projectSelected.emit(null);

      const projectIds = this.neighbors.get(d.id) ?? new Set<string>();

      const projects = [...projectIds]
        .map((id) => this.byId.get(id)!)
        .flatMap((n) => (n?.nodeType === 'project' ? [n.project!] : (n?.bundledProjects ?? [])))
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
        .flatMap((n) => (n?.nodeType === 'bundle' ? (n.members ?? []) : n?.organisation ? [n.organisation] : []))
        .sort((a, b) => a.name.localeCompare(b.name));
      this.projectSelected.emit({ project: d.project!, organisations: orgs });
    }

    this.highlight(d);
  }

  private selectById(id: string): void {
    const node = this.byId.get(id);

    if (node) {
      if (node.fringe && !this.fringeOpen) this.toggleFringe();
      this.select(node);
      this.centerOn(node);
      return;
    }

    const raw = id.startsWith('p:') ? id.slice(2) : id;
    const bundle = this.nodes.find(
      (n) => n.nodeType === 'bundle' && ((n.members ?? []).some((o) => o._id.$oid === raw) || (n.bundledProjects ?? []).some((p) => p._id === raw)),
    );
    if (!bundle) return;

    this.openOverlay(bundle);
    this.centerOn(bundle);
    this.selectItem(raw, bundle);
  }

  private centerOn(n: NetworkNode): void {
    if (!this.svgRoot || n.fringe) return;

    const fw = this.width + this.margin * 2;
    const fh = Math.max(this.height + this.margin * 2 - this.bandHeight, 80);
    const k = Math.max(d3.zoomTransform(this.svgRoot.node()).k, 1);

    this.svgRoot
      .transition()
      .duration(350)
      .call(this.zoomBehavior.transform, d3.zoomIdentity.translate(fw / 2 - k * n.x, fh / 2 - k * n.y).scale(k));
  }

  private clearSelection(): void {
    this.selected.set(null);
    this.nodeSelected.emit(null);
    this.projectSelected.emit(null);
    this.selectedMember = null;
    this.closeAllOverlays();
    this.restore();
  }

  private fitToView(): void {
    const nodes = this.visibleNodes();
    if (!nodes.length || !this.svgRoot) return;
    const pad = 16;
    const minX = d3.min(nodes, (n) => n.x - n.r)! - pad;
    const maxX = d3.max(nodes, (n) => n.x + n.r)! + pad;
    const minY = d3.min(nodes, (n) => n.y - n.r)! - pad;
    const maxY = d3.max(nodes, (n) => n.y + n.r)! + pad;

    const bw = Math.max(maxX - minX, 1),
      bh = Math.max(maxY - minY, 1);
    const fw = this.width + this.margin * 2,
      fh = Math.max(this.height + this.margin * 2 - this.bandHeight, 80);
    const scale = Math.min(fw / bw, fh / bh, 2.5);

    this.svgRoot.call(this.zoomBehavior.transform, d3.zoomIdentity.translate(fw / 2 - scale * (minX + bw / 2), fh / 2 - scale * (minY + bh / 2)).scale(scale));
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  effect,
  Input,
  OnDestroy,
  signal,
} from '@angular/core';
import { NetworkData, NetworkLink, NetworkNode } from '@shared/backend/models/network.model';
import { NetworkService } from '@shared/backend/services/network-service';
import * as d3 from 'd3';

@Component({
  selector: 'app-basic-network',
  imports: [],
  templateUrl: './basic-network.html',
  styleUrl: './basic-network.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicNetwork implements OnDestroy {
  @Input() set filterByTechnology(id: string | null) {
    if (id) {
      this.networkservice.loadByTechnology(id);
    } else {
      this.networkservice.loadAll();
    }
  }

  @Input() set filterByField(id: string | null) {
    if (id) {
      this.networkservice.loadByField(id);
    }
  }

  selectedNode = signal<NetworkNode | null>(null);
  selectedLink = signal<NetworkLink | null>(null);
  private readonly typeColors: Record<string, string> = {
    'Außeruniversitäre Forschungseinrichtung': '#159d18',
    Universität: '#2f58e0',
    'unternehmerisch tätig': '#e7761a',
    Fachhochschule: '#7f259c',
    Sonstige: '#b3bf2c',
    'Bund, Länder, Gemeinden': '#3d3330',
    'Gemeinnützige Organisation': '#e80a58',
  };
  private getColor(type: string): string {
    return this.typeColors[type] ?? '#94a3b8';
  }

  private svg: any;
  private margin = 20;
  private width = 0;
  private height = 0;
  private resizeObserver!: ResizeObserver;

  constructor(public networkservice: NetworkService) {
    effect(() => {
      const value = this.networkservice.data.value();
      if (value) {
        setTimeout(() => {
          console.log(value);
          const el = document.getElementById('basic-network');
          if (!el) return;
          this.width = el.clientWidth - this.margin * 2;
          this.height = el.clientHeight - this.margin * 2;
          this.createSVG();
          this.createBasicNetwork(value);
          this.attachResizeObserver();
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private attachResizeObserver(): void {
    this.resizeObserver?.disconnect();
    const el = document.getElementById('basic-network');
    if (!el) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.width = el.clientWidth - this.margin * 2;
      this.height = el.clientHeight - this.margin * 2;
      d3.select('div#basic-network').select('svg').remove();
      this.createSVG();
      const data = this.networkservice.data.value();
      if (data) this.createBasicNetwork(data);
    });

    this.resizeObserver.observe(el);
  }

  private createSVG(): void {
    d3.select('div#basic-network').select('svg').remove();

    const svgRoot = d3
      .select('div#basic-network')
      .append('svg')
      .attr('width', this.width + this.margin * 2)
      .attr('height', this.height + this.margin * 2);

    this.svg = svgRoot.append('g').attr('transform', `translate(${this.margin}, ${this.margin})`);

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4]) // min/max Zoom-Level
      .on('zoom', (event) => {
        this.svg.attr('transform', event.transform);
      });

    svgRoot.call(zoom);
  }

  private createBasicNetwork(data: NetworkData): void {
    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force(
        'link',
        d3
          .forceLink(data.links)
          .id((d: any) => d._id.$oid)
          .distance(100),
      )
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .alphaDecay(0.05)
      .on('end', () => simulation.stop());

    const link = this.svg
      .append('g')
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: NetworkLink) => Math.sqrt(d.projects.length));

    const node = this.svg
      .append('g')
      .selectAll('circle')
      .data(data.nodes)
      .join('circle')
      .attr('r', 8)
      .attr('fill', (d: NetworkNode) => this.getColor(d.type))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .call(
        d3
          .drag<any, any>()
          .on('start', (event, d) => this.dragStarted(event, d, simulation))
          .on('drag', (event, d) => this.dragged(event, d))
          .on('end', (event, d) => this.dragEnded(event, d, simulation)),
      );

    node.on('click', (_: MouseEvent, d: NetworkNode) => this.selectedNode.set(d));
    link.on('click', (_: MouseEvent, d: NetworkLink) => this.selectedLink.set(d));

    const label = this.svg
      .append('g')
      .selectAll('text')
      .data(data.nodes)
      .join('text')
      .text((d: NetworkNode) => d.name)
      .attr('dx', 10)
      .attr('dy', 4)
      .attr('font-size', 10);

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });
  }

  private dragStarted(event: any, d: any, simulation: any): void {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  private dragged(event: any, d: any): void {
    d.fx = event.x;
    d.fy = event.y;
  }

  private dragEnded(event: any, d: any, simulation: any): void {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

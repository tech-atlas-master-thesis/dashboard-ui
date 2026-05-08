import {
  ChangeDetectionStrategy,
  Component,
  effect,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { NetworkData, NetworkLink, NetworkNode } from '@shared/backend/models/network.model';
import { KeyTechnologyService } from '@shared/backend/services/key-technologies-service';
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
  selectedNode = signal<NetworkNode | null>(null);
  selectedLink = signal<NetworkLink | null>(null);

  constructor(public networkservice: NetworkService) {
    effect(() => {
      const value = this.networkservice.data.value();
      if (value) {
        setTimeout(() => {
          const el = document.getElementById('basic-network')!;
          this.width = el.clientWidth - this.margin * 2;
          this.height = el.clientHeight - this.margin * 2;
          this.createSVG();
          this.createBasicNetwork(value);
          this.attachResizeObserver();
        });
      }
    });
  }

  private svg: any;
  private margin = 20;
  private width = 0;
  private height = 0;
  private color = d3.scaleOrdinal(d3.schemeCategory10);
  private resizeObserver!: ResizeObserver;

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private attachResizeObserver(): void {
    this.resizeObserver?.disconnect();
    const el = document.getElementById('basic-network')!;

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
    this.svg = d3
      .select('div#basic-network')
      .append('svg')
      .attr('width', this.width + this.margin * 2)
      .attr('height', this.height + this.margin * 2)
      .append('g')
      .attr('transform', `translate(${this.margin}, ${this.margin})`);
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
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6);

    const node = this.svg
      .append('g')
      .selectAll('circle')
      .data(data.nodes)
      .enter()
      .append('circle')
      .attr('r', 8)
      .attr('fill', (d: any) => this.color(d.type))
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .call(
        d3
          .drag<any, any>()
          .on('start', (event, d) => this.dragStarted(event, d, simulation))
          .on('drag', (event, d) => this.dragged(event, d))
          .on('end', (event, d) => this.dragEnded(event, d, simulation)),
      );

    node.on('click', (event: MouseEvent, d: any) => {
      this.selectedNode.set(d);
    });

    link.on('click', (event: MouseEvent, d: any) => {
      this.selectedLink.set(d);
    });

    const label = this.svg
      .append('g')
      .selectAll('text')
      .data(data.nodes)
      .enter()
      .append('text')
      .text((d: any) => d.name)
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

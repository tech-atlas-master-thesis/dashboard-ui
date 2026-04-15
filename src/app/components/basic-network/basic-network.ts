import { ChangeDetectionStrategy, Component, effect, OnInit, signal } from '@angular/core';
import { NetworkData, NetworkLink, NetworkNode } from '@shared/backend/models/network';
import { NetworkService } from '@shared/backend/services/network-service';
import * as d3 from 'd3';

@Component({
  selector: 'app-basic-network',
  imports: [],
  templateUrl: './basic-network.html',
  styleUrl: './basic-network.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicNetwork implements OnInit {
  // nodes: NetworkNodes[] = [
  //   { oid: '1', name: 'A', coordinates: {type: 'Point', coordinates: [15.4477, 47.059]}, type: 'Research' },
  //   { oid: '2', name: 'B', coordinates: {type: 'Point', coordinates: [15.4477, 47.059]}, type: 'Research' },
  // ];

  // links: NetworkLinks[] = [
  //   { source: '1', target: '2', projects: ['Sample AB'] },
  // ];

  selectedNode = signal<NetworkNode | null>(null);
  selectedLink = signal<NetworkLink | null>(null);

  constructor(public networkservice: NetworkService) {
    effect(() => {
      const value = this.networkservice.data.value();
      if (value) {
        this.createBasicNetwork(value);
      }
    });
  }

  private svg: any;
  private margin = 20;
  private width = 800 - this.margin * 2;
  private height = 500 - this.margin * 2;
  private color = d3.scaleOrdinal(d3.schemeCategory10);

  ngOnInit(): void {
    this.createSVG();
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
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

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

    console.log(this.selectedLink());

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

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NetworkNodes, NetworkLinks } from '@shared/backend/models/network';
import * as d3 from 'd3';

@Component({
  selector: 'app-basic-network',
  imports: [],
  templateUrl: './basic-network.html',
  styleUrl: './basic-network.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicNetwork implements OnInit {
  nodes: NetworkNodes[] = [
    { id: 1, name: 'A', coordinates: '1,2', type: 'Research' },
    { id: 2, name: 'B', coordinates: '1,2', type: 'Research' },
    { id: 3, name: 'C', coordinates: '1,2', type: 'Research' },
    { id: 4, name: 'D', coordinates: '1,2', type: 'Company' },
    { id: 5, name: 'E', coordinates: '1,2', type: 'Research' },
    { id: 6, name: 'F', coordinates: '1,2', type: 'Company' },
  ];

  links: NetworkLinks[] = [
    { source: 1, target: 2, projects: ['Sample AB'] },
    { source: 2, target: 3, projects: ['Sample BC'] },
    { source: 1, target: 3, projects: ['Sample AC'] },
    { source: 3, target: 4, projects: ['Sample CD'] },
    { source: 5, target: 6, projects: ['Sample EF'] },
    { source: 6, target: 5, projects: ['Sample FE'] },
  ];

  private svg: any;
  private margin = 20;
  private width = 800 - this.margin * 2;
  private height = 500 - this.margin * 2;
  private color = d3.scaleOrdinal(d3.schemeCategory10);

  ngOnInit(): void {
    this.createSVG();
    this.createBasicNetwork();
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

  private createBasicNetwork(): void {
    const simulation = d3
      .forceSimulation(this.nodes as any)
      .force(
        'link',
        d3
          .forceLink(this.links)
          .id((d: any) => d.id)
          .distance(100),
      )
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    const link = this.svg
      .append('g')
      .selectAll('line')
      .data(this.links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6);

    const node = this.svg
      .append('g')
      .selectAll('circle')
      .data(this.nodes)
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

    const label = this.svg
      .append('g')
      .selectAll('text')
      .data(this.nodes)
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

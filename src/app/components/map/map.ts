import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-map',
  templateUrl: './map.html',
  styleUrls: ['./map.css'],
})
export class Map implements OnInit {
  private svg: any;
  private margin = 20;
  private width = 800 - this.margin * 2;
  private height = 500 - this.margin * 2;

  url = 'assets/austria.json';
  map: any;

  ngOnInit(): void {
    this.createSVG();
    this.createMap();
  }

  private async createMap() {
    const mapData = (await d3.json('assets/austria.json')) as any;
    const projection = d3.geoMercator().fitSize([this.width, this.height], mapData);
    const geoGenerator = d3.geoPath().projection(projection);

    this.svg
      .selectAll('path')
      .data(mapData.features)
      .enter()
      .append('path')
      .attr('d', geoGenerator)
      .attr('stroke', '#000')
      .attr('fill', 'transparent')
      .on('mouseover', function (this: SVGPathElement, event: any, d: any) {
        d3.select(this).attr('fill', '#000');
      })
      .on('mouseout', function (this: SVGPathElement, event: any, d: any) {
        d3.select(this).attr('fill', 'transparent');
      });
  }

  private createSVG(): void {
    this.svg = d3
      .select('div#map')
      .append('svg')
      .attr('width', this.width + this.margin * 2)
      .attr('height', this.height + this.margin * 2)
      .append('g')
      .attr('transform', `translate(${this.margin}, ${this.margin})`);
  }
}

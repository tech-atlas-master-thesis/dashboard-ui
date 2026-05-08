import { ChangeDetectionStrategy, Component, effect, OnDestroy, signal } from '@angular/core';
import * as d3 from 'd3';
import { KeyTechnologyService } from '@shared/backend/services/key-technologies-service';
import {
  TechnologyField,
  KeyTechnology,
  TechnologyViewModel,
} from '@shared/backend/models/key-technologies.model';

type D3Node = d3.HierarchyRectangularNode<TechnologyViewModel>;

@Component({
  selector: 'app-key-technologies',
  templateUrl: './key-technologies.html',
  styleUrls: ['./key-technologies.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyTechnologies implements OnDestroy {
  selectedField = signal<TechnologyField | null>(null);

  private width = 0;
  private height = 0;
  private allFields: TechnologyField[] = [];
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private g!: d3.Selection<SVGGElement, unknown, null, undefined>;

  private readonly fieldHeaderHeight = 30;
  private resizeObserver!: ResizeObserver;

  constructor(public keyTechnologyService: KeyTechnologyService) {
    effect(() => {
      const fields = this.keyTechnologyService.data.value() as TechnologyField[] | undefined;
      if (fields) {
        setTimeout(() => {
          const el = document.getElementById('key-technologies')!;
          if (!el) return;
          this.width = el.clientWidth;
          this.height = el.clientHeight;
          this.allFields = fields;
          this.initChart();
          this.renderFields(fields);
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
    const el = document.getElementById('key-technologies')!;
    if (!el) return;

    this.resizeObserver = new ResizeObserver(() => {
      this.width = el.clientWidth;
      this.height = el.clientHeight;
      this.svg.attr('width', this.width).attr('height', this.height);

      const currentField = this.selectedField();
      if (currentField) {
        this.renderTechnologies(currentField);
      } else {
        this.renderFields(this.allFields);
      }
    });
    this.resizeObserver.observe(el);
  }

  private initChart(): void {
    const el = document.getElementById('key-technologies')!;
    el.innerHTML = '';

    this.svg = d3.select(el).append('svg').attr('width', this.width).attr('height', this.height);

    const defs = this.svg.append('defs');
    const filter = defs
      .append('filter')
      .attr('id', 'cell-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter
      .append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '4')
      .attr('stdDeviation', '8')
      .attr('flood-color', 'rgba(0,0,0,0.35)');

    this.g = this.svg.append('g');
  }

  private wrapText(
    selection: d3.Selection<SVGTextElement, D3Node, SVGGElement, unknown>,
    maxWidth: (d: D3Node) => number,
    lineHeight: number,
  ): void {
    selection.each(function (d) {
      const text = d3.select(this);
      const words = (text.text() || '').split(/\s+/).reverse();
      const x = +text.attr('x');
      const y = +text.attr('y');
      text.text(null);

      let line: string[] = [];
      let lineNumber = 0;
      let tspan = text.append('tspan').attr('x', x).attr('y', y);
      let word: string | undefined;

      while ((word = words.pop()) !== undefined) {
        line.push(word);
        tspan.text(line.join(' '));

        if ((tspan.node()?.getComputedTextLength() ?? 0) > maxWidth(d)) {
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = text
            .append('tspan')
            .attr('x', x)
            .attr('y', y)
            .attr('dy', `${++lineNumber * lineHeight}px`)
            .text(word);
        }
      }
    });
  }

  private renderSquares(leaves: D3Node[], onClick: (d: D3Node) => void): void {
    const nodes = this.g
      .selectAll<SVGGElement, D3Node>('g')
      .data(leaves)
      .join('g')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`)
      .style('cursor', 'pointer')
      // .attr('filter', 'url(#cell-shadow)')
      .on('click', (_, d) => onClick(d));

    nodes
      .append('rect')
      .attr('width', (d) => d.x1 - d.x0)
      .attr('height', (d) => d.y1 - d.y0)
      .attr('rx', 6)
      .attr('stroke', (d) => d.data.color ?? '#ccc')
      .style('stroke-width', '2px')
      .style('fill', (d) => d.data.accentColor ?? '#fff')
      .style('transition', 'fill 0.08s ease, stroke 0.08s ease')
      .on('mouseover', function (_, d) {
        d3.select(this).attr('stroke', d.data.color ?? '#ccc');
        d3.select(this).style('fill', d.data.color ?? '#ccc');
      })
      .on('mouseout', function (_, d) {
        d3.select(this).attr('stroke', d.data.color ?? '#ccc');
        d3.select(this).style('fill', d.data.accentColor ?? '#fff');
      });

    nodes
      .append('text')
      .attr('x', 8)
      .attr('y', 20)
      .attr('fill', '#000')
      .style('font-size', '14px')
      .style('font-weight', '600')
      .style('pointer-events', 'none')
      .text((d) => d.data.label)
      .call((sel) =>
        this.wrapText(
          sel as d3.Selection<SVGTextElement, D3Node, SVGGElement, unknown>,
          (d) => d.x1 - d.x0 - 16,
          15,
        ),
      );

    nodes
      .append('text')
      .attr('x', 8)
      .attr('y', (d) => d.y1 - d.y0 - 8)
      .attr('fill', '#000')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .text((d) => `${d.data.projects} Projekte`);
  }

  private buildFieldHierachy(fields: TechnologyField[]): TechnologyViewModel {
    return {
      label: 'root',
      projects: fields.reduce((sum, f) => sum + f.projects, 0),
      children: fields.map((f) => ({
        label: f.label,
        projects: f.projects,
        color: f.style.color,
        accentColor: f.style.accent,
        fieldID: f._id,
        value: Math.max(Math.sqrt(f.projects ?? 1), 1),
      })),
    };
  }

  private renderFields(fields: TechnologyField[]): void {
    this.selectedField.set(null);
    this.svg.selectAll('text.back-btn').remove();
    this.g.selectAll('*').remove();

    const root = d3
      .hierarchy<TechnologyViewModel>(this.buildFieldHierachy(fields))
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    d3
      .treemap<TechnologyViewModel>()
      .size([this.width, this.height - this.fieldHeaderHeight])
      .paddingInner(8)
      .paddingOuter(12)
      .tile(d3.treemapSquarify.ratio(1))(root);

    this.g.attr('transform', `translate(0, ${this.fieldHeaderHeight})`);

    this.renderSquares(root.leaves() as D3Node[], (d) => {
      const field = fields.find((f) => f._id === d.data.fieldID);
      if (field) this.renderTechnologies(field);
    });
  }

  private buildTechHierachy(field: TechnologyField): TechnologyViewModel {
    return {
      label: 'root',
      projects: field.projects,
      children: field.technologies.map((t: KeyTechnology) => ({
        label: t.label,
        projects: t.projects,
        color: field.style.color,
        accentColor: field.style.accent,
        techID: t._id,
        value: Math.max(Math.sqrt(t.projects ?? 1), 1),
      })),
    };
  }

  private renderTechnologies(field: TechnologyField): void {
    this.selectedField.set(field);
    this.svg.selectAll('text.back-btn').remove();
    this.g.selectAll('*').remove();

    const root = d3
      .hierarchy<TechnologyViewModel>(this.buildTechHierachy(field))
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    d3
      .treemap<TechnologyViewModel>()
      .size([this.width, this.height - this.fieldHeaderHeight])
      .paddingInner(8)
      .paddingOuter(12)
      .tile(d3.treemapSquarify.ratio(1))(root);

    this.g.attr('transform', `translate(0, ${this.fieldHeaderHeight})`);

    this.renderSquares(root.leaves() as D3Node[], (d) => {
      console.log('technology clicked', d.data);
    });

    this.svg
      .append('text')
      .attr('class', 'back-btn')
      .attr('x', 12)
      .attr('y', 28)
      .attr('fill', '#000')
      .style('font-size', '14px')
      .style('cursor', 'pointer')
      .text('← Alle Felder')
      .on('click', () => this.renderFields(this.allFields));
  }
}

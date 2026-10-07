import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyTechnologyService } from '@shared/backend/services/key-technologies-service';
import { NetworkService } from '@shared/backend/services/network-service';
import { KeyTechnology, TechnologyField } from '@shared/backend/models/key-technologies.model';
import {
  NetworkFilters,
  OrganisationSelection,
  ProjectSelection,
  emptyFilters,
} from '@shared/backend/models/network.model';
import { Network } from '../../components/network/network';
import { NetworkFilter } from '../../components/network-filter/network-filter';
import { OrganisationDetail } from '../../components/organisation-detail/organisation-detail';
import { ProjectDetail } from '../../components/project-detail/project-detail';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-key-technology-detail',
  imports: [Network, NetworkFilter, OrganisationDetail, ProjectDetail],
  templateUrl: './key-technology-detail.html',
  styleUrl: './key-technology-detail.css',
})
export class KeyTechnologyDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public service = inject(KeyTechnologyService);
  public networkService = inject(NetworkService);

  technology = signal<KeyTechnology | null>(null);
  field = signal<TechnologyField | null>(null);
  filters = signal<NetworkFilters>(emptyFilters());
  selectedOrganisation = signal<OrganisationSelection | null>(null);
  selectedProject = signal<ProjectSelection | null>(null);

  private readonly origin = signal<{ url: string | null; label: string | null }>({
    url: null,
    label: null,
  });

  readonly backLabel = computed(() => this.origin().label ?? 'Zurück');

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.origin.set({ url: params.get('from'), label: params.get('fromLabel') });
    });
    effect(() => {
      const fields = this.service.data.value() as TechnologyField[] | undefined;
      const id = this.route.snapshot.paramMap.get('id');
      if (fields && id) {
        for (const f of fields) {
          const tech = f.technologies.find((t) => t.short === id || t.label === id);
          if (tech) {
            this.technology.set(tech);
            this.field.set(f);
            break;
          }
        }
      }
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
    this.router.navigate(['/organisation', id], { queryParams: this.handover() });
  }

  openProject(id: string): void {
    this.router.navigate(['/project', id], { queryParams: this.handover() });
  }

  private handover() {
    return {
      from: this.router.url,
      fromLabel: `Zurück zu ${this.technology()?.label ?? 'Technologie'}`,
    };
  }

  goBack(): void {
    const url = this.origin().url;
    if (url) {
      this.router.navigateByUrl(url);
      return;
    }
    this.router.navigate(['/key-technologies'], {
      queryParams: {
        field: this.field()?._id.$oid ?? null,
        view: this.route.snapshot.queryParamMap.get('view'),
      },
    });
  }
}

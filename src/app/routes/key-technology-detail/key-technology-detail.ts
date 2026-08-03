import { Component, effect, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-key-technology-detail',
  imports: [Network, NetworkFilter, OrganisationDetail, ProjectDetail],
  templateUrl: './key-technology-detail.html',
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

  constructor() {
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

  goBack(): void {
    this.router.navigate(['/key-technologies'], {
      queryParams: { field: this.field()?.short },
    });
  }
}

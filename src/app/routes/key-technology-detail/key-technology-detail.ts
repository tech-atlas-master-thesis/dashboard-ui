import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyTechnologyService } from '@shared/services/key-technologies-service';
import { NetworkService } from '@shared/services/network-service';
import { KeyTechnology, TechnologyField } from '@shared/models/key-technologies.model';
import { NetworkFilters, OrganisationSelection, ProjectSelection, emptyFilters } from '@shared/models/network.model';
import { Network } from '../../features/network/network/network';
import { NetworkFilter } from '../../features/network/network-filter/network-filter';
import { OrganisationPreview } from '../../features/previews/organisation-preview/organisation-preview';
import { ProjectPreview } from '../../features/previews/project-preview/project-preview';
import { Spinner } from '../../ui/spinner/spinner';
import { useOrigin } from '@shared/navigation/origin';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-key-technology-detail',
  imports: [Network, NetworkFilter, OrganisationPreview, ProjectPreview, Spinner],
  templateUrl: './key-technology-detail.html',
  styleUrl: './key-technology-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  selectRequest = signal<{ id: string } | null>(null);

  protected readonly nav = useOrigin({
    title: () => this.technology()?.label ?? 'Technologie',
    fallbackLabel: 'Zurück',
    home: () =>
      this.router.navigate(['/key-technologies'], {
        queryParams: {
          field: this.field()?._id.$oid ?? null,
          view: this.route.snapshot.queryParamMap.get('view'),
        },
      }),
  });

  private readonly params = toSignal(this.route.paramMap);

  constructor() {
    effect(() => {
      const fields = this.service.data.value() as TechnologyField[] | undefined;
      const params = this.params();
      const id = params?.get('id');
      if (!fields || !id) return;

      const fieldId = params?.get('field');
      const preferred = fieldId ? fields.filter((f) => f._id.$oid === fieldId) : [];

      for (const f of [...preferred, ...fields]) {
        const tech = f.technologies.find((t) => t.short === id);
        if (tech) {
          this.technology.set(tech);
          this.field.set(f);
          return;
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
    this.router.navigate(['/organisation', id], this.nav.handover());
  }

  openProject(id: string): void {
    this.router.navigate(['/project', id], this.nav.handover());
  }
}

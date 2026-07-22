import { Component, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KeyTechnologyService } from '@shared/backend/services/key-technologies-service';
import { KeyTechnology, TechnologyField } from '@shared/backend/models/key-technologies.model';
import { BasicNetwork } from '../../components/basic-network/basic-network';

@Component({
  imports: [BasicNetwork],
  selector: 'app-key-technology-detail',
  templateUrl: './key-technology-detail.html',
})
export class KeyTechnologyDetail {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public service = inject(KeyTechnologyService);

  technology = signal<KeyTechnology | null>(null);
  field = signal<TechnologyField | null>(null);

  constructor() {
    effect(() => {
      const fields = this.service.data.value() as TechnologyField[] | undefined;
      const id = this.route.snapshot.paramMap.get('id');
      if (fields && id) {
        for (const f of fields) {
          const tech = f.technologies.find((t) => t.short === id);
          if (tech) {
            this.technology.set(tech);
            this.field.set(f);
            break;
          }
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/key-technologies'], {
      queryParams: { field: this.field()?._id.$oid },
    });
  }
}

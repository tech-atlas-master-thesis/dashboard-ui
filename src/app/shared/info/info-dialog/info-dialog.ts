import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ClickOutside } from '@ui/click-outside/click-outside';
import { Icon } from '@ui/icon/icon';
import { Toggle, ToggleOption } from '@ui/toggle/toggle';
import { InfoState, InfoTab } from '../info-state/info-state';
import { organisationColor, organisationTypeName, PROJECT_COLOR } from '@shared/models/network.model';

@Component({
  selector: 'app-info-dialog',
  imports: [ClickOutside, Icon, Toggle],
  templateUrl: './info-dialog.html',
  styleUrl: './info-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'info.hide()',
  },
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class InfoDialog {
  protected readonly info = inject(InfoState);

  protected readonly projectColor = PROJECT_COLOR;

  protected readonly tabs: readonly ToggleOption<InfoTab>[] = [
    { value: 'erklaerung', label: 'Erklärung' },
    { value: 'daten', label: 'Datenherkunft' },
    { value: 'impressum', label: 'Impressum' },
    { value: 'datenschutz', label: 'Datenschutz' },
  ];

  protected readonly organisationTypes: readonly string[] = [
    'UNIVERSITY',
    'FACHHOCHSCHULE',
    'RESEARCH_INSTITUTE',
    'COMPANY',
    'NON_PROFIT',
    'PUBLIC_INSTITUTION',
    'SINGLE_RESEARCHER',
    'LOBBY',
    'OTHER',
  ];

  protected color(type: string): string {
    return organisationColor(type);
  }

  protected name(type: string): string {
    return organisationTypeName(type);
  }
}

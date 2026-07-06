import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { select } from '@ngxs/store';
import { ProgressBarModule } from 'primeng/progressbar';

import { TenantsState } from '../state/tenants/tenants.state';

interface ActivityEntry {
  icon: string;
  text: string;
  when: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, ProgressBarModule],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  protected readonly stats = select(TenantsState.stats);

  protected readonly activePct = computed(() => {
    const { total, active } = this.stats();
    return total === 0 ? 0 : Math.round((active / total) * 100);
  });

  protected readonly suspendedPct = computed(() => {
    const { total } = this.stats();
    return total === 0 ? 0 : 100 - this.activePct();
  });

  // Placeholder feed until the manager backend exposes an activity log.
  protected readonly recentActivity: ActivityEntry[] = [
    {
      icon: 'pi pi-cloud-upload',
      text: 'Branding push to Northwind Realty',
      when: '2026-06-30T09:15:00Z',
    },
    {
      icon: 'pi pi-cloud-upload',
      text: 'CMS push to Acme Property Group',
      when: '2026-06-28T14:32:00Z',
    },
    {
      icon: 'pi pi-pause-circle',
      text: 'Globex Estates suspended (non-payment)',
      when: '2026-06-01T10:00:00Z',
    },
  ];
}

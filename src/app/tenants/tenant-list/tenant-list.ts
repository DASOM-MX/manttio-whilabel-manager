import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { select } from '@ngxs/store';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { StatusSeverityPipe } from '../../pipes/status-severity-pipe';
import { TenantsState } from '../../state/tenants/tenants.state';
import { RegisterTenantDrawer } from '../components/register-tenant-drawer/register-tenant-drawer';

@Component({
  selector: 'app-tenant-list',
  imports: [DatePipe, RouterLink, TableModule, TagModule, RegisterTenantDrawer, StatusSeverityPipe],
  templateUrl: './tenant-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantList {
  protected readonly tenants = select(TenantsState.tenants);
}

import { Pipe, PipeTransform } from '@angular/core';

import { TenantStatus } from '../core/models/tenant';
import { statusSeverity } from '../data/utils';

/** `tenant.status | statusSeverity` → PrimeNG tag severity. */
@Pipe({ name: 'statusSeverity' })
export class StatusSeverityPipe implements PipeTransform {
  transform(status: TenantStatus): 'success' | 'danger' {
    return statusSeverity(status);
  }
}

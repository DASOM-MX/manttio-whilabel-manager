import { Pipe, PipeTransform } from '@angular/core';

import { Role } from '../core/models/session';

/** `user.role | roleSeverity` → PrimeNG tag severity. */
@Pipe({ name: 'roleSeverity' })
export class RoleSeverityPipe implements PipeTransform {
  transform(role: Role): 'info' | 'secondary' {
    return role === 'superadmin' ? 'info' : 'secondary';
  }
}

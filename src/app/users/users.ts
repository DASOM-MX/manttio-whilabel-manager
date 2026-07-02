import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { InternalUser, Role } from '../core/models/session';
import { RegisterUserDrawer } from './components/register-user-drawer/register-user-drawer';

@Component({
  selector: 'app-users',
  imports: [DatePipe, TitleCasePipe, TableModule, TagModule, RegisterUserDrawer],
  templateUrl: './users.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Users {
  // Placeholder until the manager backend exposes internal user management.
  protected readonly users = signal<InternalUser[]>([
    {
      name: 'Eduardo Mata',
      email: 'eduardo.matanavarro1998@gmail.com',
      role: 'superadmin',
      last_login: '2026-07-01T08:12:00Z',
    },
    {
      name: 'Ops Bot',
      email: 'ops@manttio.app',
      role: 'operator',
      last_login: '2026-06-29T22:40:00Z',
    },
  ]);

  protected onRegistered(user: InternalUser): void {
    this.users.update((users) => [...users, user]);
  }

  protected roleSeverity(role: Role): 'info' | 'secondary' {
    return role === 'superadmin' ? 'info' : 'secondary';
  }
}

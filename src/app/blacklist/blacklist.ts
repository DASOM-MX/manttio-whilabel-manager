import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TableModule } from 'primeng/table';

import { BlacklistEntry } from '../core/models/blacklist';
import { RegisterBlacklistDrawer } from './components/register-blacklist-drawer/register-blacklist-drawer';

@Component({
  selector: 'app-blacklist',
  imports: [DatePipe, TableModule, RegisterBlacklistDrawer],
  templateUrl: './blacklist.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Blacklist {
  // Local placeholder store until the manager backend exposes blacklist CRUD.
  protected readonly entries = signal<BlacklistEntry[]>([
    {
      value: 'spam-domain.com',
      reason: 'Fraudulent signups across two instances',
      added_at: '2026-05-19T11:30:00Z',
    },
    {
      value: 'abuse@mailinator.com',
      reason: 'Abusive listing content',
      added_at: '2026-06-11T15:22:00Z',
    },
  ]);

  protected onRegistered(entry: BlacklistEntry): void {
    this.entries.update((entries) => [entry, ...entries]);
  }

  protected removeEntry(value: string): void {
    this.entries.update((entries) => entries.filter((entry) => entry.value !== value));
  }
}

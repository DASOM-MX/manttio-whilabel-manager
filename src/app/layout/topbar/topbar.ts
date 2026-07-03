import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { select, Store } from '@ngxs/store';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';

import { SetDarkMode } from '../../state/app/app.actions';
import { AppState } from '../../state/app/app.state';
import { SessionState } from '../../state/session/session.state';
import { SelectTenant } from '../../state/tenants/tenants.actions';
import { TenantsState } from '../../state/tenants/tenants.state';

@Component({
  selector: 'app-topbar',
  imports: [ReactiveFormsModule, AvatarModule, InputTextModule, SelectModule],
  templateUrl: './topbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topbar {
  private readonly store = inject(Store);

  protected readonly tenants = select(TenantsState.tenants);
  protected readonly darkMode = select(AppState.darkMode);
  protected readonly user = select(SessionState.user);
  private readonly selectedEnvId = select(TenantsState.selectedEnvId);

  protected readonly tenantControl = new FormControl<string | null>(null);

  protected readonly userInitials = computed(() =>
    this.user()
      .name.split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );

  constructor() {
    this.tenantControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((envId) => this.store.dispatch(new SelectTenant(envId ?? null)));
    effect(() => this.tenantControl.setValue(this.selectedEnvId(), { emitEvent: false }));
  }

  protected toggleDarkMode(): void {
    this.store.dispatch(new SetDarkMode(!this.darkMode()));
  }
}

import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';

import { BlacklistEntry } from '../../../core/models/blacklist';

@Component({
  selector: 'app-register-blacklist-drawer',
  imports: [ReactiveFormsModule, DrawerModule],
  templateUrl: './register-blacklist-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterBlacklistDrawer {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly registered = output<BlacklistEntry>();

  protected readonly visible = signal(false);

  protected readonly form = this.fb.group({
    value: ['', Validators.required],
    reason: [''],
  });

  open(): void {
    this.form.reset();
    this.visible.set(true);
  }

  protected submit(): void {
    this.registered.emit({ ...this.form.getRawValue(), added_at: new Date().toISOString() });
    this.visible.set(false);
  }
}

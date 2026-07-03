import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DrawerModule } from 'primeng/drawer';
import { SelectModule } from 'primeng/select';

import { InternalUser, Role, ROLE_OPTIONS } from '../../../core/models/session';

@Component({
  selector: 'app-register-user-drawer',
  imports: [ReactiveFormsModule, DrawerModule, SelectModule],
  templateUrl: './register-user-drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterUserDrawer {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly registered = output<InternalUser>();

  protected readonly visible = signal(false);
  protected readonly roleOptions = ROLE_OPTIONS;

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: ['operator' as Role, Validators.required],
  });

  open(): void {
    this.form.reset();
    this.visible.set(true);
  }

  protected submit(): void {
    this.registered.emit({ ...this.form.getRawValue(), last_login: null });
    this.visible.set(false);
  }
}

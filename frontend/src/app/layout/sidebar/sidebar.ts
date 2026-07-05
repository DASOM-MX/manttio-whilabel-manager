import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { select } from '@ngxs/store';

import { NAV_ITEMS } from '../../core/nav/nav-items';
import { SessionState } from '../../state/session/session.state';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  private readonly role = select(SessionState.role);

  protected readonly navItems = computed(() =>
    NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(this.role())),
  );
}

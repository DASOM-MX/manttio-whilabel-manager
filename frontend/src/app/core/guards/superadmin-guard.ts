import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngxs/store';

import { SessionState } from '../../state/session/session.state';

export const superadminGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);
  return store.selectSnapshot(SessionState.isSuperadmin)
    ? true
    : router.createUrlTree(['/dashboard']);
};

import { Injectable } from '@angular/core';
import { Selector, State } from '@ngxs/store';

import { Role, SessionUser } from '../../core/models/session';

export interface SessionStateModel {
  user: SessionUser;
}

// Placeholder session until the manager backend auth is wired in.
const MOCK_USER: SessionUser = {
  name: 'Eduardo Mata',
  email: 'eduardo.matanavarro1998@gmail.com',
  role: 'superadmin',
};

@State<SessionStateModel>({
  name: 'session',
  defaults: { user: MOCK_USER },
})
@Injectable()
export class SessionState {
  @Selector()
  static user(state: SessionStateModel): SessionUser {
    return state.user;
  }

  @Selector()
  static role(state: SessionStateModel): Role {
    return state.user.role;
  }

  @Selector()
  static isSuperadmin(state: SessionStateModel): boolean {
    return state.user.role === 'superadmin';
  }
}

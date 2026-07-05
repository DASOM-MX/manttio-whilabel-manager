import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';

import { SetDarkMode } from './app.actions';

export interface AppStateModel {
  darkMode: boolean;
}

// TODO: persist via @ngxs/storage-plugin once an SSR-safe storage engine is wired in.
@State<AppStateModel>({
  name: 'app',
  defaults: { darkMode: false },
})
@Injectable()
export class AppState {
  @Selector()
  static darkMode(state: AppStateModel): boolean {
    return state.darkMode;
  }

  @Action(SetDarkMode)
  setDarkMode(ctx: StateContext<AppStateModel>, { darkMode }: SetDarkMode) {
    ctx.patchState({ darkMode });
  }
}

import { ChangeDetectionStrategy, Component, DOCUMENT, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { select } from '@ngxs/store';

import { AppState } from './state/app/app.state';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly darkMode = select(AppState.darkMode);

  constructor() {
    // <html>.app-dark is the single source of truth for Tailwind + PrimeNG.
    effect(() => {
      this.document.documentElement.classList.toggle('app-dark', this.darkMode());
    });
  }
}

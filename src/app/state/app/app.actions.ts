export class SetDarkMode {
  static readonly type = '[App] Set Dark Mode';
  constructor(readonly darkMode: boolean) {}
}

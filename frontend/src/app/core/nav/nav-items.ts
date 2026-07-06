import { Role } from '../models/session';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  /** When set, only these roles see the item. */
  roles?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
  { label: 'Tenants', icon: 'pi pi-building', route: '/tenants' },
  { label: 'Users', icon: 'pi pi-users', route: '/users', roles: ['superadmin'] },
  { label: 'Billing', icon: 'pi pi-credit-card', route: '/billing' },
  { label: 'Blacklist', icon: 'pi pi-ban', route: '/blacklist' },
];

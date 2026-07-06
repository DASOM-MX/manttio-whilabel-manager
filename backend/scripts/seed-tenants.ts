// Dev-only: seed the registry with the three tenants the frontend mocks use, so the
// list screen has data the moment it switches from local mocks to this API.
// Run after `pnpm db:migrate`. Reads DATABASE_URL from `.dev.vars` (or process env).
//
// usage: pnpm seed:tenants

import { config } from 'dotenv';
config({ path: '.dev.vars' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/modules/database/schema';
import type { NewTenant } from '../src/modules/tenants/types/tenants.types';

const DEV_TENANTS: NewTenant[] = [
  {
    envId: '3f2c8a1e-9d4b-4e7a-b6c3-1a5d8e2f7c90',
    slug: 'acme',
    publicName: 'Acme Property Group',
    apiBaseUrl: 'https://api.acme.manttio.app',
    neonProjectRef: 'proj-acme-8f3k2',
    status: 'active',
    plan: 'monthly',
    billingEmail: 'owner@acme.example',
    paymentType: 'bank_transfer',
    billingAnchor: '2026-01-15',
    lastPushAt: new Date('2026-06-28T14:32:00Z'),
  },
  {
    envId: '7b9e4d2a-1c6f-4a83-9e5d-4f8b2c7a1d36',
    slug: 'northwind',
    publicName: 'Northwind Realty',
    apiBaseUrl: 'https://api.northwind.manttio.app',
    neonProjectRef: 'proj-northwind-2c9d1',
    status: 'active',
    plan: 'full',
    billingEmail: 'owner@northwind.example',
    paymentType: 'stripe',
    billingAnchor: '2026-03-01',
    lastPushAt: new Date('2026-06-30T09:15:00Z'),
  },
  {
    envId: 'c4a1f7d9-8e2b-4c5f-a7d1-9b3e6c8f2a54',
    slug: 'globex',
    publicName: 'Globex Estates',
    apiBaseUrl: 'https://api.globex.manttio.app',
    neonProjectRef: 'proj-globex-5t7m4',
    status: 'suspended',
    plan: 'monthly',
    billingEmail: 'owner@globex.example',
    paymentType: 'cash',
    billingAnchor: '2025-11-20',
    lastPushAt: new Date('2026-05-12T18:03:00Z'),
  },
];

const main = async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set (check `.dev.vars`).');
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql, { schema });

  const inserted = await db
    .insert(schema.tenantRegistry)
    .values(DEV_TENANTS)
    .onConflictDoNothing({ target: schema.tenantRegistry.envId })
    .returning({ slug: schema.tenantRegistry.slug });

  const skipped = DEV_TENANTS.length - inserted.length;
  console.log(
    `Seeded ${inserted.length} tenant(s): ${inserted.map((r) => r.slug).join(', ') || '—'}` +
      (skipped ? ` (${skipped} already present, skipped)` : ''),
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

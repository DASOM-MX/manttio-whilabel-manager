import type { Env } from '../../../env';
import type { Db } from '../../database/client';
import { sendEmail } from '../../email/services/email.service';
import { buildSetupEmail } from '../helpers/setup-email.helpers';
import { findTenantByEnvId } from '../repository/tenants.repository';

// Instance setup-info email, triggered by the superadmin after registering a
// tenant. Stamps nothing critical — safe to re-send anytime. Recipient is always
// `tenant_registry.billing_email` (the tenant owner, never end customers).

export type SendSetupEmailResult =
  | { ok: true; recipient: string }
  | { ok: false; error: 'tenant_not_found' | 'send_failed' };

export const sendSetupEmail = async (
  db: Db,
  env: Env,
  envId: string,
): Promise<SendSetupEmailResult> => {
  const tenant = await findTenantByEnvId(db, envId);
  if (!tenant) return { ok: false, error: 'tenant_not_found' };

  const { subject, html, text } = buildSetupEmail(tenant, env, new Date().getUTCFullYear());
  try {
    await sendEmail({
      apiKey: env.RESEND_API_KEY,
      from: env.RESEND_FROM,
      to: tenant.billingEmail,
      subject,
      html,
      text,
    });
  } catch (err) {
    console.error(`setup email failed for tenant ${tenant.slug}:`, err);
    return { ok: false, error: 'send_failed' };
  }
  return { ok: true, recipient: tenant.billingEmail };
};

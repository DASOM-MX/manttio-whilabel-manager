import type { Env } from '../../../env';
import type { TenantStatus } from '../enums/tenants.enum';
import type { TenantRow } from '../types/tenants.types';
import { setupEmailHtml } from '../templates/setup-email.template';

// Fills the setup-email template from a registry row. Rendering only — the
// service owns tenant lookup and the transport call.

const STATUS_LABELS: Record<TenantStatus, string> = {
  active: 'Activa',
  suspended: 'Suspendida',
  provisioning: 'En puesta en marcha',
};

// The instance app URL shown to the owner. Registry stores the API base
// (`https://api.<tenant-domain>`); the app lives at the same domain without
// the `api.` prefix. Falls back to the API base if the shape is unexpected.
export const appUrlFromApiBaseUrl = (apiBaseUrl: string): string => {
  try {
    const url = new URL(apiBaseUrl);
    if (url.hostname.startsWith('api.')) {
      url.hostname = url.hostname.slice('api.'.length);
    }
    return url.origin;
  } catch {
    return apiBaseUrl;
  }
};

export const buildSetupEmail = (
  tenant: TenantRow,
  env: Env,
  year: number,
): { subject: string; html: string; text: string } => {
  const appUrl = appUrlFromApiBaseUrl(tenant.apiBaseUrl);
  const statusLabel = STATUS_LABELS[tenant.status];

  const html = setupEmailHtml({
    publicName: tenant.publicName,
    slug: tenant.slug,
    appUrl,
    statusLabel,
    recipientEmail: tenant.billingEmail,
    year,
    brand: {
      name: env.BRAND_NAME,
      siteUrl: env.BRAND_SITE_URL,
      logoUrl: env.BRAND_LOGO_URL,
    },
  });

  const text = [
    `Su plataforma ${tenant.publicName} está lista.`,
    '',
    `Nombre: ${tenant.publicName}`,
    `Identificador: ${tenant.slug}`,
    `Dirección de la plataforma: ${appUrl}`,
    `Estado: ${statusLabel}`,
    '',
    'Primeros pasos:',
    '1. Ingrese a la plataforma con la cuenta de administrador que le entregamos por separado.',
    '2. Cambie la contraseña del administrador en su primer inicio de sesión.',
    '3. Registre a su equipo desde la sección de usuarios.',
    '4. Comience a registrar servicios — los reportes en PDF se generan y envían automáticamente.',
    '',
    'Si tiene alguna duda, responda a este correo.',
    `— ${env.BRAND_NAME}`,
  ].join('\n');

  return {
    subject: `Su plataforma ${tenant.publicName} está lista`,
    html,
    text,
  };
};

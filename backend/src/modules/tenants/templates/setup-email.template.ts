// HTML markup for the instance setup-info email. Template asset only (sibling
// convention: markup never lives inline in a renderer) — the display values are
// computed in ../helpers/setup-email.helpers.ts and handed here. Named
// `.template.ts` (the sibling uses `.html.ts`) because wrangler v4 treats
// `.html`-suffixed import specifiers as text modules and drops the exports. Spanish copy;
// CSS inlined and table-based layout for Outlook/Gmail/Apple Mail compatibility.
//
// Contents are deliberately limited to what the tenant owner already knows or
// needs: public name, slug, app URL, status, onboarding steps. NEVER include
// neon_project_ref, tokens, or billing_reference data beyond the greeting.

export type SetupEmailHtmlView = {
  publicName: string;
  slug: string;
  appUrl: string;
  statusLabel: string;
  recipientEmail: string;
  year: number;
  brand: {
    name: string;
    siteUrl: string;
    logoUrl: string;
  };
};

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const setupEmailHtml = (v: SetupEmailHtmlView): string => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(`Su plataforma ${v.publicName} está lista`)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1a2233;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f4f6f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:32px 32px 16px;border-bottom:1px solid #e5e9ef;" align="center">
              <img src="${escapeHtml(v.brand.logoUrl)}" alt="${escapeHtml(v.brand.name)}" width="180" height="auto" style="display:block;max-width:180px;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:22px;color:#0c3a5e;font-weight:600;">Su plataforma está lista</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.5;">
                Le compartimos los datos de acceso de la plataforma de <strong>${escapeHtml(v.publicName)}</strong>.
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f7f9fc;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;font-size:14px;line-height:1.7;color:#1a2233;">
                    <strong style="color:#0c3a5e;">Nombre:</strong> ${escapeHtml(v.publicName)}<br>
                    <strong style="color:#0c3a5e;">Identificador:</strong> ${escapeHtml(v.slug)}<br>
                    <strong style="color:#0c3a5e;">Dirección de la plataforma:</strong> <a href="${escapeHtml(v.appUrl)}" target="_blank" rel="noopener" style="color:#0c3a5e;text-decoration:underline;">${escapeHtml(v.appUrl)}</a><br>
                    <strong style="color:#0c3a5e;">Estado:</strong> ${escapeHtml(v.statusLabel)}
                  </td>
                </tr>
              </table>

              <h2 style="margin:0 0 12px;font-size:16px;color:#0c3a5e;font-weight:600;">Primeros pasos</h2>
              <ol style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:1.8;color:#1a2233;">
                <li>Ingrese a la plataforma desde la dirección de arriba con la cuenta de administrador que le entregamos por separado.</li>
                <li>Cambie la contraseña del administrador en su primer inicio de sesión.</li>
                <li>Registre a su equipo (técnicos y personal de oficina) desde la sección de usuarios.</li>
                <li>Comience a registrar servicios — los reportes en PDF se generan y envían automáticamente.</li>
              </ol>

              <p style="margin:0;font-size:13px;line-height:1.5;color:#5a6878;">
                Si tiene alguna duda durante la puesta en marcha, responda a este correo y con gusto le apoyamos.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;background-color:#0c3a5e;color:#c8d4e1;font-size:12px;line-height:1.5;" align="center">
              <strong style="color:#ffffff;">${escapeHtml(v.brand.name)}</strong><br>
              <a href="${escapeHtml(v.brand.siteUrl)}" style="color:#ffffff;text-decoration:none;">${escapeHtml(v.brand.siteUrl.replace(/^https?:\/\//, ''))}</a>
            </td>
          </tr>
        </table>

        <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;text-align:center;">
          © ${v.year} ${escapeHtml(v.brand.name)}. Este correo fue enviado a ${escapeHtml(v.recipientEmail)}.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

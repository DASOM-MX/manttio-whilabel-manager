// HTML markup for the billing reminder email (one email per tenant per sweep —
// records grouped). Template asset only (sibling convention: markup never lives
// inline in a renderer) — display values are formatted es-MX in
// ../helpers/billing-email.helpers.ts and handed here. Named `.template.ts`
// (the sibling uses `.html.ts`) because wrangler v4 treats `.html`-suffixed
// import specifiers as text modules and drops the exports. Spanish copy; CSS
// inlined and table-based layout for Outlook/Gmail/Apple Mail compatibility.

export type BillingReminderRecordView = {
  concept: string;
  amountLabel: string;
  dueDateLabel: string;
  statusLabel: string;
  cfdiFolio: string | null;
};

export type BillingReminderEmailHtmlView = {
  publicName: string;
  records: BillingReminderRecordView[];
  paymentInstructions: string;
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

const recordRow = (r: BillingReminderRecordView): string => {
  const folioRow = r.cfdiFolio
    ? `<br><strong style="color:#0c3a5e;">Folio CFDI:</strong> ${escapeHtml(r.cfdiFolio)}`
    : '';
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f7f9fc;border-radius:6px;margin-bottom:12px;">
                <tr>
                  <td style="padding:16px 20px;font-size:14px;line-height:1.7;color:#1a2233;">
                    <strong style="color:#0c3a5e;">Concepto:</strong> ${escapeHtml(r.concept)}<br>
                    <strong style="color:#0c3a5e;">Monto:</strong> ${escapeHtml(r.amountLabel)}<br>
                    <strong style="color:#0c3a5e;">Fecha límite:</strong> ${escapeHtml(r.dueDateLabel)}<br>
                    <strong style="color:#0c3a5e;">Estado:</strong> ${escapeHtml(r.statusLabel)}${folioRow}
                  </td>
                </tr>
              </table>`;
};

export const billingReminderEmailHtml = (v: BillingReminderEmailHtmlView): string => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de pago</title>
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
              <h1 style="margin:0 0 16px;font-size:22px;color:#0c3a5e;font-weight:600;">Recordatorio de pago</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.5;">
                Estimado cliente de <strong>${escapeHtml(v.publicName)}</strong>, le recordamos que ${v.records.length === 1 ? 'tiene un pago próximo o pendiente' : 'tiene pagos próximos o pendientes'}:
              </p>

              ${v.records.map(recordRow).join('\n')}

              <p style="margin:24px 0 0;font-size:14px;line-height:1.6;color:#1a2233;">
                ${escapeHtml(v.paymentInstructions)}
              </p>
              <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#5a6878;">
                Si ya realizó su pago, haga caso omiso de este mensaje o responda con su comprobante para actualizar su estado de cuenta.
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

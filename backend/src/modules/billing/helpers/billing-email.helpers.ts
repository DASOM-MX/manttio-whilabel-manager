import type { Env } from '../../../env';
import type { TenantRow } from '../../tenants/types/tenants.types';
import type { BillingRecordStatus } from '../enums/billing.enum';
import {
  billingReminderEmailHtml,
  type BillingReminderRecordView,
} from '../templates/billing-reminder-email.template';
import type { BillingRecordRow } from '../types/billing.types';

// Amounts/dates formatted es-MX for the reminder template. Rendering only —
// the reminder service owns record selection and the transport call.

const mxCurrency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

// `YYYY-MM-DD` date-column strings; parsed as UTC midnight and formatted in UTC
// so the label never slips a day.
const mxDate = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const mxMonthYear = new Intl.DateTimeFormat('es-MX', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatMxCurrency = (amount: string): string => mxCurrency.format(Number(amount));

export const formatMxDate = (isoDate: string): string =>
  mxDate.format(new Date(`${isoDate}T00:00:00Z`));

// Concept label for sweep-issued monthly records, keyed by the cycle's due
// date: "julio de 2026" → concept "Mensualidad julio de 2026".
export const formatMxMonthYear = (isoDate: string): string =>
  mxMonthYear.format(new Date(`${isoDate}T00:00:00Z`));

const STATUS_LABELS: Record<BillingRecordStatus, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  overdue: 'Vencido',
};

const toRecordView = (record: BillingRecordRow): BillingReminderRecordView => ({
  concept: record.concept,
  amountLabel: `${formatMxCurrency(record.amount)} ${record.currency}`,
  dueDateLabel: formatMxDate(record.dueDate),
  statusLabel: STATUS_LABELS[record.status],
  cfdiFolio: record.cfdiFolio,
});

export const buildBillingReminderEmail = (
  tenant: TenantRow,
  records: BillingRecordRow[],
  env: Env,
  year: number,
): { subject: string; html: string; text: string } => {
  const views = records.map(toRecordView);

  const html = billingReminderEmailHtml({
    publicName: tenant.publicName,
    records: views,
    paymentInstructions: env.BRAND_PAYMENT_INSTRUCTIONS,
    recipientEmail: tenant.billingEmail,
    year,
    brand: {
      name: env.BRAND_NAME,
      siteUrl: env.BRAND_SITE_URL,
      logoUrl: env.BRAND_LOGO_URL,
    },
  });

  const text = [
    `Recordatorio de pago — ${tenant.publicName}`,
    '',
    ...views.flatMap((r) => [
      `Concepto: ${r.concept}`,
      `Monto: ${r.amountLabel}`,
      `Fecha límite: ${r.dueDateLabel}`,
      `Estado: ${r.statusLabel}`,
      ...(r.cfdiFolio ? [`Folio CFDI: ${r.cfdiFolio}`] : []),
      '',
    ]),
    env.BRAND_PAYMENT_INSTRUCTIONS,
    '',
    'Si ya realizó su pago, haga caso omiso de este mensaje.',
    `— ${env.BRAND_NAME}`,
  ].join('\n');

  const subject =
    views.length === 1
      ? `Recordatorio de pago: ${views[0]?.concept ?? ''}`
      : `Recordatorio de pago: ${views.length} conceptos pendientes`;

  return { subject, html, text };
};

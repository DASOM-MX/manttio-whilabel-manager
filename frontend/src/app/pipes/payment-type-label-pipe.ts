import { Pipe, PipeTransform } from '@angular/core';

import { PAYMENT_TYPE_LABELS, PaymentType } from '../core/models/tenant';

/** `tenant.billing.payment_type | paymentTypeLabel` → display label. */
@Pipe({ name: 'paymentTypeLabel' })
export class PaymentTypeLabelPipe implements PipeTransform {
  transform(type: PaymentType): string {
    return PAYMENT_TYPE_LABELS[type];
  }
}

import { Pipe, PipeTransform } from '@angular/core';

import { BillingRecordStatus } from '../core/models/billing-record';
import { billingRecordStatusSeverity } from '../data/utils';

/** `record.status | billingStatusSeverity` → PrimeNG tag severity. */
@Pipe({ name: 'billingStatusSeverity' })
export class BillingStatusSeverityPipe implements PipeTransform {
  transform(status: BillingRecordStatus): 'success' | 'warn' | 'danger' {
    return billingRecordStatusSeverity(status);
  }
}

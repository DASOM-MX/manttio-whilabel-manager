import { Pipe, PipeTransform } from '@angular/core';

import { REGIMEN_FISCAL_LABELS, RegimenFiscal } from '../core/models/tenant';

/** `tax.regimen_fiscal | regimenFiscalLabel` → SAT code + description. */
@Pipe({ name: 'regimenFiscalLabel' })
export class RegimenFiscalLabelPipe implements PipeTransform {
  transform(regimen: RegimenFiscal): string {
    return REGIMEN_FISCAL_LABELS[regimen];
  }
}

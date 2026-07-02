import { Pipe, PipeTransform } from '@angular/core';

import { USO_CFDI_LABELS, UsoCfdi } from '../core/models/tenant';

/** `tax.uso_cfdi | usoCfdiLabel` → CFDI code + description. */
@Pipe({ name: 'usoCfdiLabel' })
export class UsoCfdiLabelPipe implements PipeTransform {
  transform(uso: UsoCfdi): string {
    return USO_CFDI_LABELS[uso];
  }
}

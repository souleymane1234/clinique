/** Marqueur dans observations d'une analyse labo pour lier la facture billing */
export const BILLING_INVOICE_ID_REGEX = /\[BILLING_INVOICE_ID\]:([0-9a-fA-F-]{36})/;

export function extractBillingInvoiceIdFromObservations(observations) {
  if (!observations || typeof observations !== 'string') return null;
  const m = observations.match(BILLING_INVOICE_ID_REGEX);
  return m ? m[1] : null;
}

export function appendBillingInvoiceTag(observations, invoiceId) {
  if (!invoiceId) return observations || '';
  const base = (observations || '').replace(BILLING_INVOICE_ID_REGEX, '').trim();
  const tag = `[BILLING_INVOICE_ID]:${invoiceId}`;
  return base ? `${base}\n${tag}` : tag;
}

/**
 * Facture considérée comme payée (API billing : paidAmount, status, paiements VALIDEE).
 */
export function isBillingInvoicePaid(invoice) {
  if (!invoice) return false;
  const total = Number(invoice.totalAmount ?? 0);
  const paid = Number(invoice.paidAmount ?? 0);
  if (total > 0 && paid >= total) return true;
  const st = String(invoice.status || '').toUpperCase();
  if (['PAYEE', 'PAID', 'REGLEE', 'REGLE', 'ACQUITTEE', 'ACQUITTÉE'].includes(st)) return true;
  const payments = Array.isArray(invoice.payments) ? invoice.payments : [];
  if (total > 0 && payments.length) {
    const sumValidated = payments
      .filter((p) => String(p?.status || '').toUpperCase() === 'VALIDEE')
      .reduce((s, p) => s + Number(p?.amount ?? 0), 0);
    if (sumValidated >= total) return true;
  }
  return false;
}

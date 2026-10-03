/* Fixed precision money and accounting calculations. Stored values remain in rupees for v1 backup compatibility. */
const Finance = (() => {
  const SCALE = 100;
  const minor = value => {
    const text = String(value == null ? '' : value).replace(/,/g, '').trim();
    const number = Number(text);
    if (!Number.isFinite(number)) return 0;
    return Math.round((number + Math.sign(number) * Number.EPSILON) * SCALE);
  };
  const major = value => Math.trunc(Number(value) || 0) / SCALE;
  const sum = values => values.reduce((total, value) => total + minor(value), 0);
  const add = (...values) => major(values.reduce((total, value) => total + minor(value), 0));
  const multiply = (quantity, unitPrice) => major(Math.round((Number(quantity) || 0) * minor(unitPrice)));
  const nonNegative = value => Math.max(0, Math.trunc(Number(value) || 0));

  function invoiceTotal(lines, options) {
    const opts = options || {};
    const subtotal = lines.reduce((total, line) => total + Math.round((Number(line.qty) || 0) * minor(line.rate)), 0);
    return major(Math.max(0, subtotal - minor(opts.discount) + minor(opts.tax) + minor(opts.charges)));
  }

  function invoiceDue(invoice) {
    return major(Math.max(0, minor(invoice.total) - minor(invoice.paid) - minor(invoice.advanceApplied) - minor(invoice.returned)));
  }

  function allocateFIFO(amount, invoices) {
    let remaining = Math.max(0, minor(amount));
    const allocations = [];
    const sorted = invoices.slice().sort((a, b) => (a.day || a.date || '').localeCompare(b.day || b.date || '') || String(a.no || '').localeCompare(String(b.no || '')));
    for (const invoice of sorted) {
      const balance = Math.max(0, minor(invoice.balance != null ? invoice.balance : invoiceDue(invoice)));
      const allocation = Math.min(balance, remaining);
      if (allocation > 0) allocations.push({ invoiceId: invoice.id, amount: major(allocation) });
      remaining -= allocation;
      if (!remaining) break;
    }
    return { allocations, advance: major(remaining) };
  }

  function customerBalance(opening, invoices, payments, credits, adjustments) {
    const debit = minor(opening) + invoices.reduce((n, value) => n + minor(value), 0) + adjustments.reduce((n, value) => n + minor(value), 0);
    const credit = payments.reduce((n, value) => n + minor(value), 0) + credits.reduce((n, value) => n + minor(value), 0);
    return major(debit - credit);
  }

  function weightedAverage(oldQty, oldAverage, newQty, newRate) {
    const oldQ = Number(oldQty) || 0, newQ = Number(newQty) || 0;
    const total = oldQ + newQ;
    if (total <= 0) return major(minor(newRate || oldAverage));
    const weightedMinor = oldQ * minor(oldAverage) + newQ * minor(newRate);
    return major(Math.round(weightedMinor / total));
  }

  function stockValue(quantity, unitPrice) { return multiply(quantity, unitPrice); }

  return { SCALE, minor, major, sum, add, multiply, invoiceTotal, invoiceDue, allocateFIFO, customerBalance, weightedAverage, stockValue };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = Finance;

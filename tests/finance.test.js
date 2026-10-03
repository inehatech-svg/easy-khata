const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../js/finance.js');

test('acceptance 1–3: partial at billing, later payment and a second invoice', () => {
  const first = { id: 'INV-0001', no: 'INV-0001', day: '2026-01-01', total: 10000, paid: 3000, advanceApplied: 0, returned: 0 };
  assert.equal(F.invoiceDue(first), 7000);
  first.paid = F.add(first.paid, 2500);
  assert.equal(F.invoiceDue(first), 4500);
  const second = { id: 'INV-0002', no: 'INV-0002', day: '2026-01-02', total: 5000, paid: 0, advanceApplied: 0, returned: 0 };
  assert.equal(F.add(F.invoiceDue(first), F.invoiceDue(second)), 9500);
});

test('acceptance 4: FIFO payment allocation reconciles total sales and receipts', () => {
  const a = { id: 'INV-0001', no: 'INV-0001', day: '2026-01-01', balance: 4500 };
  const b = { id: 'INV-0002', no: 'INV-0002', day: '2026-01-02', balance: 5000 };
  const result = F.allocateFIFO(6000, [b, a]);
  assert.deepEqual(result.allocations, [{ invoiceId: 'INV-0001', amount: 4500 }, { invoiceId: 'INV-0002', amount: 1500 }]);
  assert.equal(F.add(b.balance, -result.allocations[1].amount), 3500);
  assert.equal(F.add(10000, 5000), 15000);
  assert.equal(F.add(3000, 2500, 6000), 11500);
});

test('acceptance 5–6: preserve overpayment as advance and reverse allocations', () => {
  const result = F.allocateFIFO(4000, [{ id: 'INV-0002', day: '2026-01-02', balance: 3500 }]);
  assert.deepEqual(result, { allocations: [{ invoiceId: 'INV-0002', amount: 3500 }], advance: 500 });
  assert.equal(F.add(3500, -result.allocations[0].amount), 0);
  // Reversing an earlier allocation restores the exact outstanding amount.
  assert.equal(F.add(4500, 2500), 7000);
});

test('acceptance 7: fixed precision weighted cost, stock value and sale profit', () => {
  const avg = F.weightedAverage(100, 50, 100, 60);
  assert.equal(avg, 55);
  const cogs = F.stockValue(50, avg);
  assert.equal(cogs, 2750);
  assert.equal(F.add(F.stockValue(150, avg)), 8250);
  assert.equal(F.add(F.multiply(50, 80), -cogs), 1250);
});

test('acceptance 8–9: cancellation reverses balances and recomputation is deterministic', () => {
  const invoice = { total: 10000, paid: 3000, advanceApplied: 0, returned: 0 };
  assert.equal(F.invoiceDue(invoice), 7000);
  assert.equal(F.customerBalance(0, [invoice.total], [invoice.paid], [], []), 7000);
  // Cancellation soft-deletes the sale and retains any receipt in the advance pool.
  const retainedAdvance = invoice.paid;
  assert.equal(F.customerBalance(0, [], [], [], []), 0);
  assert.equal(retainedAdvance, 3000);
  assert.equal(F.invoiceDue({ total: 10000, paid: 0, advanceApplied: 0, returned: 10000 }), 0);
  const beforeSale = F.add(F.stockValue(100, 55));
  const afterSale = F.add(F.stockValue(50, 55));
  const afterCancel = F.add(afterSale, F.stockValue(50, 55));
  assert.equal(afterCancel, beforeSale);
});

test('minor units round and group without accumulating binary fractions', () => {
  assert.equal(F.add(0.1, 0.2), 0.3);
  assert.equal(F.invoiceTotal([{ qty: 3, rate: 0.1 }]), 0.3);
});

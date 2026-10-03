/* Offline reports derived from invoices, ledger entries and stock movements. */
const Reports = {
  csvDownload(name, rows) {
    const csv = rows.map(row => row.map(value => '"' + String(value == null ? '' : value).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },

  async page(params) {
    const today = U.day(), monthStart = today.slice(0, 7) + '-01';
    const from = params.from || monthStart, to = params.to || today;
    const [entries, invoices, customers, items, moves] = await Promise.all([
      DB.all('entries'), DB.all('invoices'), DB.all('customers'), DB.all('items'), DB.all('moves')
    ]);
    const inRange = row => (row.day || '') >= from && (row.day || '') <= to;
    const periodEntries = entries.filter(inRange);
    const periodInvoices = invoices.filter(inRange);
    const periodMoves = moves.filter(inRange);
    const collections = periodEntries.filter(e => ['payment', 'advance'].includes(e.type));
    const supplierPayments = periodEntries.filter(e => e.type === 'supplier_payment');
    const expenses = periodEntries.filter(e => e.type === 'expense');
    const sales = periodInvoices.reduce((sum, inv) => Finance.add(sum, inv.total), 0);
    const received = collections.reduce((sum, e) => Finance.add(sum, e.amount), 0);
    const paidSuppliers = supplierPayments.reduce((sum, e) => Finance.add(sum, e.amount), 0);
    const expenseTotal = expenses.reduce((sum, e) => Finance.add(sum, e.amount), 0);
    const profit = periodInvoices.reduce((sum, inv) => {
      const cogs = inv.costOfGoods != null ? inv.costOfGoods : (inv.lines || []).reduce((n, line) => Finance.add(n, Finance.multiply(line.qty, line.costAtSale || 0)), 0);
      return Finance.add(sum, Finance.add(inv.total, -cogs));
    }, 0);
    const stockValueCost = items.filter(i => !i.archived).reduce((sum, i) => Finance.add(sum, Finance.multiply(i.qty, i.avgCost != null ? i.avgCost : i.costPrice)), 0);
    const stockValueSale = items.filter(i => !i.archived).reduce((sum, i) => Finance.add(sum, Finance.multiply(i.qty, i.salePrice)), 0);
    const receivables = customers.filter(c => c.isCustomer !== false && !c.archived).map(customer => {
      const ledger = entries.filter(e => e.customerId === customer.id);
      const balance = Khata.balanceOf(ledger);
      const dueInvoices = invoices.filter(inv => inv.customerId === customer.id && Invoices.dueOf(inv) > 0);
      return { customer, balance, dueInvoices };
    }).filter(row => row.balance > 0).sort((a, b) => b.balance - a.balance);
    const payables = customers.filter(c => c.isSupplier && !c.archived).map(supplier => ({
      supplier, balance: Math.max(0, Khata.balanceOf(entries.filter(e => e.customerId === supplier.id)))
    })).filter(row => row.balance > 0).sort((a, b) => b.balance - a.balance);

    const aging = [0, 0, 0, 0, 0];
    invoices.filter(inv => Invoices.dueOf(inv) > 0).forEach(inv => {
      const dueOn = inv.dueDate || inv.day || today;
      const daysLate = Math.max(0, Math.floor((Date.parse(today) - Date.parse(dueOn)) / 86400000));
      const bucket = daysLate === 0 ? 0 : daysLate <= 30 ? 1 : daysLate <= 60 ? 2 : daysLate <= 90 ? 3 : 4;
      aging[bucket] = Finance.add(aging[bucket], Invoices.dueOf(inv));
    });
    const itemSales = {};
    periodInvoices.forEach(inv => (inv.lines || []).forEach(line => {
      const key = line.itemId || line.name || 'Other';
      if (!itemSales[key]) itemSales[key] = { name: line.name || 'Other', qty: 0, sales: 0, cost: 0 };
      itemSales[key].qty += U.num(line.qty);
      itemSales[key].sales = Finance.add(itemSales[key].sales, Finance.multiply(line.qty, line.rate));
      itemSales[key].cost = Finance.add(itemSales[key].cost, Finance.multiply(line.qty, line.costAtSale || 0));
    }));
    const topItems = Object.values(itemSales).sort((a, b) => b.sales - a.sales);
    const methods = {};
    collections.forEach(e => { const method = e.method || 'Unspecified'; methods[method] = Finance.add(methods[method] || 0, e.amount); });

    const html = '<div class="page">' + UI.pageHead('Reports', U.fmtDay(from) + ' to ' + U.fmtDay(to)) +
      '<div class="page-body">' +
      '<div class="card"><div class="field-row"><div class="field"><label>From</label><input id="report_from" type="date" value="' + U.esc(from) + '"></div><div class="field"><label>To</label><input id="report_to" type="date" value="' + U.esc(to) + '"></div></div>' +
      '<div class="row"><button class="btn btn-sm" onclick="Reports.preset(\'today\')">Today</button><button class="btn btn-sm" onclick="Reports.preset(\'week\')">7 days</button><button class="btn btn-sm" onclick="Reports.preset(\'month\')">Month</button><button class="btn btn-pri btn-sm" onclick="Reports.applyRange()">Apply range</button><button class="btn btn-sm" onclick="Reports.exportRange(\'' + U.esc(from) + '\',\'' + U.esc(to) + '\')">Export CSV</button></div></div>' +
      '<div class="stats"><div class="stat"><div class="s-label">Sales</div><div class="s-val">' + U.money(sales) + '</div></div><div class="stat"><div class="s-label">Received</div><div class="s-val green">' + U.money(received) + '</div></div><div class="stat"><div class="s-label">Supplier payments</div><div class="s-val">' + U.money(paidSuppliers) + '</div></div><div class="stat"><div class="s-label">Expenses</div><div class="s-val red">' + U.money(expenseTotal) + '</div></div><div class="stat"><div class="s-label">Gross profit</div><div class="s-val">' + U.money(profit) + '</div></div><div class="stat"><div class="s-label">Profit after expenses</div><div class="s-val">' + U.money(Finance.add(profit, -expenseTotal)) + '</div></div></div>' +
      '<div class="card"><div class="row-between"><div class="card-title">Receivables</div><div><button class="btn btn-sm" onclick="Reports.exportReceivables()">Export receivables</button><button class="btn btn-sm" onclick="Reminders.bulk()">Overdue reminders</button></div></div>' +
      (receivables.length ? '<div class="list">' + receivables.map(row => '<div class="lrow" onclick="App.nav(\'person?id=' + row.customer.id + '\')"><div class="l-main"><div class="l-title">' + U.esc(row.customer.name) + '</div><div class="l-sub">' + row.dueInvoices.length + ' open invoices</div></div><div class="l-amt red">' + U.money(row.balance) + '</div></div>').join('') + '</div>' : UI.empty('check', 'No receivables')) + '</div>' +
      '<div class="card"><div class="card-title">Receivable aging</div><div class="list">' + ['Current','1–30 days','31–60 days','61–90 days','90+ days'].map((label, i) => '<div class="kv"><span class="k">' + label + '</span><span class="v">' + U.money(aging[i]) + '</span></div>').join('') + '</div></div>' +
      '<div class="card"><div class="card-title">Supplier payables</div>' + (payables.length ? '<div class="list">' + payables.map(row => '<div class="lrow" onclick="App.nav(\'person?id=' + row.supplier.id + '\')"><div class="l-main"><div class="l-title">' + U.esc(row.supplier.name) + '</div></div><div class="l-amt red">' + U.money(row.balance) + '</div></div>').join('') + '</div>' : UI.empty('check', 'No supplier dues')) + '</div>' +
      '<div class="card"><div class="card-title">Collections by method</div>' + (Object.keys(methods).length ? '<div class="list">' + Object.keys(methods).sort().map(method => '<div class="kv"><span class="k">' + U.esc(method) + '</span><span class="v green">' + U.money(methods[method]) + '</span></div>').join('') + '</div>' : UI.empty('cash', 'No collections in this range')) + '</div>' +
      '<div class="card"><div class="card-title">Top items sold</div>' + (topItems.length ? '<div class="list">' + topItems.slice(0, 20).map(item => '<div class="lrow"><div class="l-main"><div class="l-title">' + U.esc(item.name) + '</div><div class="l-sub">Qty ' + U.fmtQty(item.qty) + ' · cost ' + U.money(item.cost) + '</div></div><div class="l-amt">' + U.money(item.sales) + '</div></div>').join('') + '</div>' : UI.empty('box', 'No item sales in this range')) + '</div>' +
      '<div class="card"><div class="card-title">Invoices in range</div>' + (periodInvoices.length ? '<div class="list">' + periodInvoices.map(inv => '<div class="lrow" onclick="App.nav(\'bill?id=' + inv.id + '\')"><div class="l-main"><div class="l-title">' + U.esc(inv.no) + ' · ' + U.esc(inv.customerName || 'Walk-in') + '</div><div class="l-sub">' + U.fmtDay(inv.day) + ' · ' + Invoices.statusChip(inv) + '</div></div><div class="l-amt">' + U.money(inv.total) + '</div></div>').join('') + '</div>' : UI.empty('receipt', 'No invoices in this range')) + '</div>' +
      '<div class="card"><div class="card-title">Stock movements in range</div>' + (periodMoves.length ? '<div class="list">' + periodMoves.slice().sort((a,b) => (b.day || '').localeCompare(a.day || '')).map(move => { const item = items.find(row => row.id === move.itemId); return '<div class="lrow"><div class="l-main"><div class="l-title">' + U.esc(item ? item.name : 'Removed item') + ' · ' + U.esc(move.type) + '</div><div class="l-sub">' + U.fmtDay(move.day) + ' · ' + U.esc(move.note || move.refNo || '') + '</div></div><div class="l-amt">' + (move.type === 'out' ? '−' : '+') + U.fmtQty(move.qty) + '</div></div>'; }).join('') + '</div>' : UI.empty('box', 'No stock movement in this range')) + '</div>' +
      '<div class="card"><div class="card-title">Current stock valuation</div><div class="kv"><span class="k">At average cost</span><span class="v">' + U.money(stockValueCost) + '</span></div><div class="kv"><span class="k">At sale price</span><span class="v">' + U.money(stockValueSale) + '</span></div><div class="kv"><span class="k">Potential margin</span><span class="v">' + U.money(Finance.add(stockValueSale, -stockValueCost)) + '</span></div></div>' +
      '</div></div>';
    return html;
  },

  applyRange() {
    const from = U.q('#report_from').value, to = U.q('#report_to').value;
    if (!from || !to || from > to) return UI.toast('Choose a valid date range', 'err');
    App.nav('reports?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to));
  },
  preset(type) { const to = U.day(), from = type === 'today' ? to : type === 'week' ? U.addDays(to, -6) : to.slice(0, 7) + '-01'; App.nav('reports?from=' + from + '&to=' + to); },
  async exportRange(from, to) {
    const [entries, invoices, items, moves] = await Promise.all([DB.all('entries'), DB.all('invoices'), DB.all('items'), DB.all('moves')]);
    const rows = [['Type','Date','Reference','Party / Item','Details','Amount','Quantity']];
    entries.filter(e => (e.day || '') >= from && (e.day || '') <= to).forEach(e => rows.push(['Ledger ' + e.type, e.day, e.invoiceNo || e.billNo || e.refNo || '', e.customerName || '', e.note || '', e.amount, '']));
    invoices.filter(i => (i.day || '') >= from && (i.day || '') <= to).forEach(i => rows.push(['Invoice', i.day, i.no, i.customerName || 'Walk-in', 'Paid ' + U.money(i.paid) + ', due ' + U.money(Invoices.dueOf(i)), i.total, '']));
    moves.filter(m => (m.day || '') >= from && (m.day || '') <= to).forEach(m => { const item = items.find(i => i.id === m.itemId); rows.push(['Stock ' + m.type, m.day, m.refNo || '', item ? item.name : '', m.note || '', m.unitCost || '', m.delta != null ? m.delta : m.qty]); });
    Reports.csvDownload('khata-report-' + from + '-to-' + to + '.csv', rows);
  },
  async exportReceivables() {
    const [customers, entries, invoices] = await Promise.all([DB.all('customers'), DB.all('entries'), DB.all('invoices')]);
    const rows = [['Customer','Phone','Balance','Open invoices','Oldest due date']];
    customers.filter(c => c.isCustomer !== false && !c.archived).forEach(c => {
      const balance = Khata.balanceOf(entries.filter(e => e.customerId === c.id));
      if (balance <= 0) return;
      const due = invoices.filter(inv => inv.customerId === c.id && Invoices.dueOf(inv) > 0).sort((a,b) => (a.dueDate || a.day || '').localeCompare(b.dueDate || b.day || ''));
      rows.push([c.name, c.phone || '', balance, due.length, due[0] ? (due[0].dueDate || due[0].day) : '']);
    });
    Reports.csvDownload('receivables-' + U.day() + '.csv', rows);
  }
};

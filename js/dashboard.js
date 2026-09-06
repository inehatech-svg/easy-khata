/* Dashboard: today's numbers, low-stock alarms, weekly chart, quick actions */
const Dash = {
  async page() {
    const s = App.s;
    const day = U.day();
    const [entries, items, customers, allEntries] = await Promise.all([
      DB.idx('entries', 'day', day), DB.all('items'), DB.all('customers'), DB.all('entries')
    ]);
    const sales = U.sumType(entries, ['invoice']);
    const received = U.sumType(entries, ['payment']) + U.sumType(entries, ['advance']);
    const stockValue = U.sum(items.filter(i => !i.archived), i => U.num(i.qty) * U.num(i.costPrice));

    const byCust = {};
    allEntries.forEach(e => { if (e.customerId) (byCust[e.customerId] = byCust[e.customerId] || []).push(e); });
    let receivable = 0;
    const debtors = customers.map(c => {
      const bal = Khata.balanceOf(byCust[c.id] || []);
      if (bal > 0) receivable += bal;
      return { c, bal };
    }).filter(r => r.bal > 0).sort((a, b) => b.bal - a.bal);

    const low = Stock.lowList(items);
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    // last 7 days sales for the chart
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = U.addDays(day, -i);
      days.push({ d, v: U.sumType(allEntries.filter(e => e.day === d), ['invoice']) });
    }
    const maxV = Math.max(1, ...days.map(x => x.v));

    const recent = allEntries.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 8);
    recent.forEach(e => { if (!e.customerName && e.customerId) { const c = customers.find(x => x.id === e.customerId); e.customerName = c ? c.name : ''; } });

    const online = navigator.onLine;

    return '<div class="page">' +
      '<div class="page-head"><div class="ph-row">' +
      '<div style="flex:1"><div class="ph-sub">' + greet + ' 👋</div><div class="ph-title">' + U.esc(s.shopName) + '</div></div>' +
      '<span class="offline-pill">' + (online ? UI.icon('cloud', 12) + ' synced device' : UI.icon('wifiOff', 12) + ' offline mode') + '</span>' +
      '</div></div>' +
      '<div class="page-body">' +
      '<div class="stats">' +
      '<div class="stat"><span class="s-label"><span class="s-icon i-pri">' + UI.icon('cart', 15) + '</span> Today sales</span><div class="s-val">' + U.money(sales) + '</div></div>' +
      '<div class="stat"><span class="s-label"><span class="s-icon i-green">' + UI.icon('cash', 15) + '</span> Today received</span><div class="s-val green">' + U.money(received) + '</div></div>' +
      '<div class="stat"><span class="s-label"><span class="s-icon i-red">' + UI.icon('alert', 15) + '</span> Receivable</span><div class="s-val ' + (receivable > 0 ? 'red' : '') + '">' + U.money(receivable) + '</div></div>' +
      '<div class="stat"><span class="s-label"><span class="s-icon i-amber">' + UI.icon('box', 15) + '</span> Stock value</span><div class="s-val">' + U.money(stockValue) + '</div></div>' +
      '</div>' +

      (low.length ?
        '<div class="alert-card"><div class="row-between" style="margin-bottom:6px"><span class="bold small red">' + UI.icon('bell', 15) + ' Smart alarm — ' + low.length + ' item' + (low.length > 1 ? 's' : '') + ' low on stock</span></div>' +
        low.slice(0, 5).map(i =>
          '<div class="row-between" style="padding:7px 0;border-bottom:1px dashed var(--line);cursor:pointer" onclick="App.nav(\'item?id=' + i.id + '\')">' +
          '<span class="small bold">' + U.esc(i.name) + '</span><span class="chip red">' + U.fmtQty(i.qty) + ' / alarm ' + U.fmtQty(i.lowStockAt) + '</span></div>').join('') +
        (low.length > 5 ? '<div class="tiny muted mt6">' + (low.length - 5) + ' more… open Inventory</div>' : '') +
        '</div>' : '') +

      '<div class="card"><div class="card-title">' + UI.icon('zap', 16) + ' Quick actions</div>' +
      '<div class="qact">' +
      '<button onclick="App.nav(\'bform\')"><span class="qa-ic i-red">' + UI.icon('receipt', 16) + '</span>New bill</button>' +
      '<button onclick="Khata.addEntry(null,\'payment\')"><span class="qa-ic i-green">' + UI.icon('cash', 16) + '</span>Payment</button>' +
      '<button onclick="Khata.addEntry(null,\'advance\')"><span class="qa-ic i-green">' + UI.icon('wallet', 16) + '</span>Advance</button>' +
      '<button onclick="Khata.customerForm()"><span class="qa-ic i-pri">' + UI.icon('user', 16) + '</span>Customer</button>' +
      '</div></div>' +

      '<div class="card"><div class="card-title">' + UI.icon('chart', 16) + ' Last 7 days sales</div>' +
      '<div class="bars">' + days.map(x =>
        '<div class="bar-wrap"><div class="bar" style="height:' + Math.max(4, Math.round(x.v / maxV * 100)) + '%;opacity:' + (x.v > 0 ? 1 : .25) + '" title="' + U.money(x.v) + '"></div>' +
        '<span class="bar-label">' + (x.d === day ? 'today' : Number(x.d.slice(8, 10)) + '/' + Number(x.d.slice(5, 7))) + '</span></div>').join('') +
      '</div></div>' +

      (debtors.length ? '<div class="card"><div class="card-title">' + UI.icon('alert', 16) + ' Top dues — tap to collect</div>' +
        '<div class="wrap">' + debtors.slice(0, 6).map(r =>
          '<button class="btn btn-sm" style="margin:0 6px 8px 0" onclick="App.nav(\'person?id=' + r.c.id + '\')">' + U.esc(r.c.name.split(' ')[0]) + ' <span class="red">' + U.money(r.bal) + '</span></button>').join('') +
        '</div></div>' : '') +

      '<div class="section-label">Recent activity</div>' +
      (recent.length ? '<div class="list">' + recent.map(e => Khata.entryRow(e, false)).join('') + '</div>'
        : UI.empty('book', 'No activity yet', 'Create your first bill or khata entry')) +
      '</div></div>';
  },

  bind() { }
};

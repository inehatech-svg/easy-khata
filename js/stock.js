/* Inventory: solar panels, inverters, batteries… with per-item low stock alarms */
const Stock = {
  search: '',
  cat: 'all',

  async page() {
    const items = await DB.all('items');
    const active = items.filter(i => !i.archived);
    const cats = Array.from(new Set(active.map(i => (i.category || 'Uncategorized').trim()).filter(Boolean))).sort();
    const value = U.sum(active, i => i.qty * i.costPrice);
    const low = Stock.lowList(active);
    return '<div class="page">' +
      UI.pageHead('Inventory', active.length + ' items • Stock value ' + U.money(value),
        '<button class="ph-btn" onclick="Stock.itemForm()">' + UI.icon('plus', 19) + '</button>') +
      '<div class="page-body">' +
      '<div class="stats">' +
      '<div class="stat"><div class="row-between"><span class="s-label">' + UI.icon('box', 15) + ' Items</span></div><div class="s-val">' + active.length + '</div></div>' +
      '<div class="stat"><div class="row-between"><span class="s-label">' + UI.icon('alert', 15) + ' Low stock</span></div><div class="s-val ' + (low.length ? 'red' : '') + '">' + low.length + '</div></div>' +
      '</div>' +
      (low.length ? '<div class="alert-card"><div class="row-between"><span class="bold small red">' + UI.icon('bell', 15) + ' Smart stock alarms</span></div>' +
        low.slice(0, 4).map(i =>
          '<div class="lrow" style="padding:9px 0;border-bottom:1px solid var(--line);background:none" onclick="App.nav(\'item?id=' + i.id + '\')">' +
          '<div class="l-main"><div class="l-title">' + U.esc(i.name) + '</div><div class="l-sub">Alarm at ' + U.fmtQty(i.lowStockAt) + ' ' + U.esc(i.unit || 'pcs') + '</div></div>' +
          '<span class="chip red">' + U.fmtQty(i.qty) + ' left</span></div>').join('') +
        (low.length > 4 ? '<div class="tiny muted mt6">' + (low.length - 4) + ' more low items…</div>' : '') +
        '</div>' : '') +
      '<div class="searchbar mt10">' + UI.icon('search', 18) +
      '<input id="stk_q" placeholder="Search items, SKU, category…" value="' + U.esc(Stock.search) + '" oninput="Stock.search=this.value;Stock.refresh()"></div>' +
      '<div class="chiprow">' +
      '<button class="filter-chip ' + (Stock.cat === 'all' ? 'on' : '') + '" onclick="Stock.cat=\'all\';Stock.refresh()">All</button>' +
      cats.map(c => '<button class="filter-chip ' + (Stock.cat === c ? 'on' : '') + '" onclick="Stock.cat=\'' + U.esc(c).replace(/'/g, "\\'") + '\';Stock.refresh()">' + U.esc(c) + '</button>').join('') +
      '</div>' +
      '<div id="stk_list"></div>' +
      '<div class="section-label">Archived</div><div id="stk_arch"></div>' +
      '</div></div>';
  },

  async bind() {
    Stock.renderLists();
  },

  async refresh() {
    const q = U.q('#stk_q'); const v = q ? q.value : '';
    const pos = q ? q.selectionStart : 0;
    await App.rerender();
    const nq = U.q('#stk_q');
    if (nq) { nq.value = v; nq.focus(); nq.setSelectionRange(pos, pos); }
  },

  lowList(items) {
    return (items || null) && items.filter ? items.filter(i => !i.archived && U.num(i.qty) <= U.num(i.lowStockAt)) : [];
  },

  async lowItems() { return Stock.lowList(await DB.all('items')); },

  itemRow(i) {
    const isLow = U.num(i.qty) <= U.num(i.lowStockAt);
    return '<div class="lrow" onclick="App.nav(\'item?id=' + i.id + '\')">' +
      '<div class="avatar sm ' + U.avatarHue(i.category || i.name) + '">' + U.esc(U.initials(i.name)) + '</div>' +
      '<div class="l-main"><div class="l-title">' + U.esc(i.name) + '</div>' +
      '<div class="l-sub">' + U.esc(i.category || 'Uncategorized') + (i.sku ? ' • ' + U.esc(i.sku) : '') + ' • ' + U.money(i.salePrice) + '/' + U.esc(i.unit || 'pc') + '</div></div>' +
      '<div class="l-right"><div class="l-amt ' + (isLow ? 'red' : '') + '">' + U.fmtQty(i.qty) + '</div>' +
      '<div class="l-tag">' + (isLow ? '⚠ low' : U.esc(i.unit || 'pcs')) + '</div></div></div>';
  },

  async renderLists() {
    const items = await DB.all('items');
    let list = items.filter(i => !i.archived);
    if (Stock.cat !== 'all') list = list.filter(i => (i.category || 'Uncategorized') === Stock.cat);
    if (Stock.search) {
      const s = Stock.search.toLowerCase();
      list = list.filter(i => (i.name + ' ' + (i.sku || '') + ' ' + (i.category || '')).toLowerCase().includes(s));
    }
    list.sort((a, b) => a.name.localeCompare(b.name));
    const arch = items.filter(i => i.archived);
    const lEl = U.q('#stk_list');
    if (lEl) lEl.innerHTML = list.length
      ? '<div class="list">' + list.map(Stock.itemRow).join('') + '</div>'
      : UI.empty('box', 'No items found', 'Add your panels, inverters, batteries…');
    const aEl = U.q('#stk_arch');
    if (aEl) aEl.innerHTML = arch.length
      ? '<div class="list">' + arch.map(Stock.itemRow).join('') + '</div>'
      : '<div class="tiny muted" style="padding:2px 4px">Nothing archived</div>';
  },

  /* ---------- item form ---------- */
  itemForm(id) {
    DB.get('items', id).then(item => {
      const it = item || { lowStockAt: App.s.lowStockDefault, unit: 'pcs' };
      UI.sheet({
        title: item ? 'Edit item' : 'New inventory item',
        body:
        '<div class="field"><label>Item name *</label><input id="it_name" value="' + U.esc(it.name || '') + '" placeholder="e.g. Longi 550W Solar Panel"></div>' +
        '<div class="field-row">' +
        '<div class="field"><label>Category</label><input id="it_cat" list="catList" value="' + U.esc(it.category || '') + '" placeholder="Panels"><datalist id="catList"><option>Panels</option><option>Inverters</option><option>Batteries</option><option>Structure</option><option>Cables</option><option>Accessories</option></datalist></div>' +
        '<div class="field"><label>SKU / code</label><input id="it_sku" value="' + U.esc(it.sku || '') + '" placeholder="optional"></div>' +
        '</div>' +
        '<div class="field-row">' +
        '<div class="field"><label>Cost price</label><input id="it_cost" inputmode="decimal" value="' + (it.costPrice != null ? it.costPrice : '') + '"></div>' +
        '<div class="field"><label>Sale price *</label><input id="it_sale" inputmode="decimal" value="' + (it.salePrice != null ? it.salePrice : '') + '"></div>' +
        '</div>' +
        '<div class="field-row">' +
        '<div class="field"><label>Unit</label><input id="it_unit" value="' + U.esc(it.unit || 'pcs') + '" placeholder="pcs"></div>' +
        '<div class="field"><label>Low stock alarm at *</label><input id="it_low" inputmode="decimal" value="' + (it.lowStockAt != null ? it.lowStockAt : App.s.lowStockDefault) + '"><div class="hint">Alert when qty ≤ this</div></div>' +
        '</div>' +
        (item ? '' : '<div class="field"><label>Opening stock qty</label><input id="it_qty" inputmode="decimal" placeholder="0"></div>') +
        '<button class="btn btn-pri btn-block" onclick="Stock.saveItem(\'' + (id || '') + '\')">' + UI.icon('save', 17) + ' Save item</button>'
      });
    });
  },

  async saveItem(id) {
    const name = U.q('#it_name').value.trim();
    const sale = U.num(U.q('#it_sale').value);
    if (!name || sale <= 0) return UI.toast('Name and sale price are required', 'err');
    const patch = {
      name, category: U.q('#it_cat').value.trim() || 'Uncategorized',
      sku: U.q('#it_sku').value.trim(), costPrice: U.num(U.q('#it_cost').value),
      salePrice: sale, unit: U.q('#it_unit').value.trim() || 'pcs',
      lowStockAt: U.num(U.q('#it_low').value), archived: false
    };
    if (id) {
      const it = await DB.get('items', id);
      Object.assign(it, patch);
      await DB.put('items', it);
      UI.toast('Item updated', 'ok');
    } else {
      const it = Object.assign({ qty: 0 }, patch);
      await DB.put('items', it);
      const qty = U.num(U.q('#it_qty').value);
      if (qty > 0) {
        await Stock.addMove(it.id, 'in', qty, { note: 'Opening stock', unitCost: it.costPrice, day: U.day() });
        await Stock.recalc(it.id);
      }
      UI.toast('Item added', 'ok');
    }
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    App.rerender();
  },

  /* ---------- item detail ---------- */
  async itemPage(id) {
    const it = await DB.get('items', id);
    if (!it) return '<div class="page">' + UI.backHead('Item') + '<div class="page-body">' + UI.empty('box', 'Item not found') + '</div></div>';
    const moves = (await DB.idx('moves', 'itemId', id)).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const isLow = U.num(it.qty) <= U.num(it.lowStockAt);
    return '<div class="page">' +
      UI.backHead(U.esc(it.name), U.esc(it.category || '') + (it.sku ? ' • ' + U.esc(it.sku) : ''),
        '<button class="ph-btn" onclick="Stock.itemForm(\'' + it.id + '\')">' + UI.icon('edit', 18) + '</button>') +
      '<div class="page-body">' +
      '<div class="card"><div class="stats" style="margin:0">' +
      '<div class="stat" style="box-shadow:none;border:none;padding:0"><div class="s-label">' + UI.icon('box', 15) + ' In stock</div><div class="s-val ' + (isLow ? 'red' : '') + '">' + U.fmtQty(it.qty) + ' <span class="small muted">' + U.esc(it.unit || '') + '</span></div>' + (isLow ? '<span class="chip red mt6">' + UI.icon('bell', 13) + ' Low — alarm at ' + U.fmtQty(it.lowStockAt) + '</span>' : '<span class="chip green mt6">Healthy stock</span>') + '</div>' +
      '<div class="stat" style="box-shadow:none;border:none;padding:0"><div class="s-label">' + UI.icon('tag', 15) + ' Prices</div><div class="s-val">' + U.money(it.salePrice) + '</div><div class="tiny muted">Cost ' + U.money(it.costPrice) + ' • Value ' + U.money(it.qty * it.costPrice) + '</div></div>' +
      '</div>' +
      '<div class="grid3 mt10">' +
      '<button class="btn btn-green btn-sm" onclick="Stock.addStock(\'' + it.id + '\')">' + UI.icon('plus', 15) + ' Add stock</button>' +
      '<button class="btn btn-sm" onclick="Stock.adjust(\'' + it.id + '\')">' + UI.icon('sliders', 15) + ' Adjust</button>' +
      '<button class="btn btn-sm ' + (it.archived ? '' : '') + '" onclick="Stock.archive(\'' + it.id + '\',' + (it.archived ? 'false' : 'true') + ')">' + UI.icon('archive', 15) + (it.archived ? ' Unarchive' : ' Archive') + '</button>' +
      '</div></div>' +
      '<div class="section-label">Stock movement history</div>' +
      (moves.length ? '<div class="list">' + moves.map(m => Stock.moveRow(m)).join('') + '</div>'
        : UI.empty('clock', 'No movements yet', 'Add stock or make a sale first')) +
      '</div></div>';
  },

  moveRow(m) {
    const map = {
      in: ['arrowDown', 'green', 'Stock in'], out: ['arrowUp', 'red', 'Sale out'],
      return: ['undo', 'green', 'Return in'], adjust: ['sliders', 'amber', 'Adjustment'],
      open: ['box', 'pri', 'Opening']
    };
    const [ic, cls, label] = map[m.type] || ['box', 'pri', m.type];
    const qtyTxt = m.type === 'adjust' && m.delta != null
      ? (m.delta >= 0 ? '+' : '') + U.fmtQty(m.delta)
      : (m.type === 'out' ? '-' : '+') + U.fmtQty(m.qty);
    return '<div class="entry">' +
      '<div class="e-ic i-' + cls + '">' + UI.icon(ic, 17) + '</div>' +
      '<div class="e-main"><div class="e-title">' + label + (m.note ? ' — ' + U.esc(m.note) : '') + '</div>' +
      '<div class="e-sub">' + U.fmtDateTime(m.date) + (m.refType === 'invoice' ? ' • ' + U.esc(m.refNo || 'invoice') : '') + '</div></div>' +
      '<div class="e-right"><div class="e-amt ' + (cls === 'red' ? 'dr' : 'cr') + '">' + qtyTxt + '</div>' +
      (m.unitCost ? '<div class="e-bal">@ ' + U.money(m.unitCost) + '</div>' : '') + '</div></div>';
  },

  /* ---------- stock movements ---------- */
  async addMove(itemId, type, qty, opts) {
    const o = opts || {};
    await DB.put('moves', {
      itemId, type, qty: Math.abs(U.num(qty)),
      unitCost: o.unitCost || 0, note: o.note || '',
      refType: o.refType || '', refId: o.refId || '', refNo: o.refNo || '',
      day: o.day || U.day(), date: U.nowISO()
    });
  },

  // qty is recomputed from the full movement log — keeps stock drift-proof
  async recalc(itemId) {
    const moves = await DB.idx('moves', 'itemId', itemId);
    let qty = 0;
    moves.forEach(m => {
      if (m.type === 'out') qty -= U.num(m.qty);
      else if (m.type === 'adjust') qty += U.num(m.delta != null ? m.delta : m.qty);
      else qty += U.num(m.qty);
    });
    const it = await DB.get('items', itemId);
    if (it) { it.qty = qty; await DB.put('items', it); }
    return qty;
  },

  async recalcMany(ids) {
    for (const id of Array.from(new Set(ids))) await Stock.recalc(id);
  },

  addStock(id) {
    UI.sheet({
      title: 'Add stock (purchase)',
      body:
      '<div class="field"><label>Quantity *</label><input id="ms_qty" inputmode="decimal" placeholder="e.g. 10"></div>' +
      '<div class="field"><label>Unit cost (purchase price)</label><input id="ms_cost" inputmode="decimal" placeholder="per unit"></div>' +
      '<div class="field"><label>Note</label><input id="ms_note" placeholder="e.g. supplier, bill no."></div>' +
      '<button class="btn btn-green btn-block" onclick="Stock.saveMove(\'' + id + '\',\'in\')">' + UI.icon('plus', 17) + ' Add to inventory</button>'
    });
  },

  adjust(id) {
    UI.sheet({
      title: 'Adjust stock',
      body: '<div class="hint" style="margin-bottom:10px">Use for damage, loss, recount or corrections.</div>' +
      '<div class="field"><label>Change (+/-)</label><input id="ms_qty" inputmode="decimal" placeholder="e.g. -2 or 3"></div>' +
      '<div class="field"><label>Reason</label><input id="ms_note" placeholder="e.g. 1 panel broken"></div>' +
      '<button class="btn btn-pri btn-block" onclick="Stock.saveMove(\'' + id + '\',\'adjust\')">' + UI.icon('save', 17) + ' Save adjustment</button>'
    });
  },

  async saveMove(id, type) {
    const raw = U.q('#ms_qty').value;
    const qty = U.num(raw);
    if (!qty && type === 'in') return UI.toast('Enter a quantity', 'err');
    if (!qty) return UI.toast('Enter a non-zero change', 'err');
    const it = await DB.get('items', id);
    if (type === 'in') {
      const cost = U.num(U.q('#ms_cost').value);
      await Stock.addMove(id, 'in', qty, { note: U.q('#ms_note').value.trim() || 'Purchase', unitCost: cost });
      if (cost > 0) { it.costPrice = cost; await DB.put('items', it); }
    } else {
      await DB.put('moves', {
        itemId: id, type: 'adjust', qty: Math.abs(qty), delta: qty,
        note: U.q('#ms_note').value.trim() || 'Manual adjustment',
        day: U.day(), date: U.nowISO()
      });
    }
    await Stock.recalc(id);
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    UI.toast(type === 'in' ? 'Stock added' : 'Stock adjusted', 'ok');
    const newQty = (await DB.get('items', id)).qty;
    if (newQty <= it.lowStockAt) UI.toast('⚠ ' + it.name + ' is low: ' + U.fmtQty(newQty) + ' left', 'err');
    App.rerender();
  },

  async archive(id, val) {
    const it = await DB.get('items', id);
    it.archived = !!val;
    await DB.put('items', it);
    UI.toast(val ? 'Archived — hidden from billing' : 'Unarchived', 'ok');
    App.rerender();
  },

  async removeItemIfUnused(id) {
    const moves = await DB.idx('moves', 'itemId', id);
    if (moves.length > 0) return UI.toast('This item has stock history — archive it instead', 'err');
    await DB.del('items', id);
    UI.toast('Item deleted', 'ok');
    history.back();
  }
};

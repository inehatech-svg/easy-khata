/* Data Import: migrate customers & inventory from Digi Khata / Udhaar Book etc.
   Sources: CSV, Excel (.xlsx via SheetJS), PDF (best-effort via pdf.js), pasted text */
const Importer = {
  target: 'customers',          // customers | items
  state: null,                  // { headers, rows, sourceName }
  map: {},

  /* ============ page ============ */
  page() {
    return '<div class="page">' +
      UI.backHead('Import data', 'From Digi Khata, Udhaar Book or any spreadsheet') +
      '<div class="page-body">' +
      '<div class="card"><div class="card-title">' + UI.icon('download', 16) + ' What are you importing?</div>' +
      '<div class="segmented">' +
      '<button id="imp_t_cust" class="' + (Importer.target === 'customers' ? 'on' : '') + '" onclick="Importer.setTarget(\'customers\')">' + UI.icon('users', 15) + ' Customers</button>' +
      '<button id="imp_t_items" class="' + (Importer.target === 'items' ? 'on' : '') + '" onclick="Importer.setTarget(\'items\')">' + UI.icon('box', 15) + ' Inventory</button>' +
      '</div>' +
      '<div class="hint mt10">' + (Importer.target === 'customers'
        ? 'Names, phone numbers, addresses and khata balances (dues/advances) become customer khatas.'
        : 'Item names, category, stock qty, cost & sale prices become inventory items.') + '</div></div>' +

      '<div class="card"><div class="card-title">' + UI.icon('upload', 16) + ' Choose a source</div>' +
      '<div class="grid2">' +
      '<button class="btn btn-sm" onclick="Importer.chooseFile(\'csv\')">' + UI.icon('upload', 15) + ' CSV / Excel</button>' +
      '<button class="btn btn-sm" onclick="Importer.chooseFile(\'pdf\')">' + UI.icon('receipt', 15) + ' PDF report</button>' +
      '</div>' +
      '<button class="btn btn-block mt10" onclick="Importer.showPaste()">' + UI.icon('edit', 15) + ' Paste rows from Excel</button>' +
      '<div class="hint mt10">📲 <b>From Digi Khata:</b> open the report (Customers / Items) → Share → save as <b>Excel or PDF</b>, then upload it here. Excel/CSV is the most accurate; PDF is best-effort.</div>' +
      '<div id="imp_paste"></div>' +
      '</div>' +

      '<div id="imp_body"></div>' +

      '<div class="card"><div class="card-title">' + UI.icon('book', 16) + ' Need the format?</div>' +
      '<div class="grid2">' +
      '<button class="btn btn-sm" onclick="Importer.template(\'customers\')">Customer template</button>' +
      '<button class="btn btn-sm" onclick="Importer.template(\'items\')">Inventory template</button>' +
      '</div></div>' +
      '</div></div>';
  },

  bind() {},

  setTarget(t) {
    Importer.target = t;
    Importer.state = null;
    Importer.map = {};
    App.rerender();
  },

  /* ============ template downloads ============ */
  template(kind) {
    let csv;
    if (kind === 'customers') {
      csv = 'Name,Phone,Address,Balance,Notes\n' +
        'Haji Iqbal,03001234567,Model Town,15000,pays monthly\n' +
        'Sardar Solar,03019876543,Bank Road,-5000,bought inverter\n' +
        '(Balance: positive = customer owes you, negative = advance you hold)';
    } else {
      csv = 'Item Name,Category,SKU,Qty,Unit,Cost Price,Sale Price,Low Stock\n' +
        'Longi 550W Solar Panel,Panels,LG550,10,pcs,24000,28000,5\n' +
        'Inverex Nitro 6kW,Inverters,IVX6K,2,pcs,170000,185000,2\n' +
        'Osram 100Ah Battery,Batteries,OSR100,6,pcs,32000,36500,3';
    }
    U.download('solar-khata-' + kind + '-template.csv', csv);
    UI.toast('Template downloaded', 'ok');
  },

  /* ============ file pickers ============ */
  chooseFile(kind) {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = kind === 'pdf' ? '.pdf,application/pdf' : '.csv,.xlsx,.xls,.txt,text/csv';
    inp.onchange = () => {
      const f = inp.files[0];
      if (!f) return;
      if (kind === 'pdf') Importer.fromPdf(f);
      else Importer.fromSpreadsheet(f);
    };
    inp.click();
  },

  showPaste() {
    const el = U.q('#imp_paste');
    if (U.q('#imp_pt_area')) { el.innerHTML = ''; return; }
    el.innerHTML =
      '<div class="field mt10"><label>Paste rows (first line = column names)</label>' +
      '<textarea id="imp_pt_area" placeholder="Name,Phone,Balance&#10;Haji Iqbal,03001234567,15000"></textarea>' +
      '<button class="btn btn-pri btn-block mt6" onclick="Importer.fromPaste()">Parse pasted rows</button></div>';
  },

  fromPaste() {
    const txt = U.q('#imp_pt_area').value.trim();
    if (!txt) return UI.toast('Paste some rows first', 'err');
    const parsed = Importer.parseDelimited(txt);
    if (!parsed.rows.length) return UI.toast('Could not read any rows', 'err');
    Importer.state = { headers: parsed.headers, rows: parsed.rows, sourceName: 'pasted rows' };
    Importer.autoMap();
    Importer.renderMapping();
  },

  /* ============ CSV / TSV / Excel ============ */
  async fromSpreadsheet(file) {
    try {
      const name = file.name.toLowerCase();
      let parsed;
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        if (!window.XLSX) await Importer.loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'Excel reader');
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const arr = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
        const rows = arr.map(r => r.map(c => String(c == null ? '' : c).trim()));
        const headers = rows.shift() || [];
        parsed = { headers, rows: rows.filter(r => r.some(c => c !== '')) };
      } else {
        const text = await file.text();
        parsed = Importer.parseDelimited(text);
      }
      if (!parsed || !parsed.rows.length) return UI.toast('No data rows found in this file', 'err');
      Importer.state = { headers: parsed.headers, rows: parsed.rows, sourceName: file.name };
      Importer.autoMap();
      Importer.renderMapping();
    } catch (e) {
      UI.toast('Could not read file: ' + (e.message || e), 'err');
    }
  },

  parseDelimited(text) {
    text = String(text).replace(/^\uFEFF/, '');
    const first = text.split('\n')[0] || '';
    const delim = ((first.match(/\t/g) || []).length > (first.match(/,/g) || []).length) ? '\t' : ',';
    const rows = []; let row = [], cur = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
        else cur += ch;
      } else {
        if (ch === '"') inQ = true;
        else if (ch === delim) { row.push(cur); cur = ''; }
        else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
        else if (ch !== '\r') cur += ch;
      }
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    const clean = rows.filter(r => r.some(c => String(c).trim() !== ''));
    const headers = (clean.shift() || []).map(h => h.trim());
    return { headers, rows: clean };
  },

  /* ============ PDF (best effort) ============ */
  async fromPdf(file) {
    UI.toast('Reading PDF…');
    try {
      if (!window.pdfjsLib) await Importer.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'PDF reader');
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const buf = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buf }).promise;
      let lines = [];
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const tc = await page.getTextContent();
        const byY = {};
        tc.items.forEach(it => {
          const y = Math.round(it.transform[5]);
          (byY[y] = byY[y] || []).push({ x: it.transform[4], s: it.str });
        });
        Object.keys(byY).sort((a, b) => b - a).forEach(y => {
          const line = byY[y].sort((a, b) => a.x - b.x).map(o => o.s).join(' ').replace(/\s+/g, ' ').trim();
          if (line) lines.push(line);
        });
      }
      const parsed = Importer.target === 'customers'
        ? Importer.linesToCustomerRows(lines)
        : Importer.linesToItemRows(lines);
      if (!parsed.rows.length) {
        return UI.toast('PDF readable but no records found — try the Excel export instead', 'err');
      }
      Importer.state = { headers: parsed.headers, rows: parsed.rows, sourceName: file.name + ' (best effort)' };
      Importer.map = { name: 0, phone: 1, balance: 2 };
      if (Importer.target === 'items') Importer.map = { name: 0, qty: 1, salePrice: 2 };
      Importer.renderMapping();
    } catch (e) {
      UI.toast('PDF needs internet for the reader, or failed: ' + (e.message || e), 'err');
    }
  },

  linesToCustomerRows(lines) {
    const rows = [];
    lines.forEach(l => {
      if (/total|page\s*\d|report|summary|printed|www\.|com\b/i.test(l)) return;
      const phoneM = l.match(/(\+?\d[\d\- ]{7,12}\d)/);
      const nums = l.match(/-?[\d,]+\.?\d*/g) || [];
      if (!phoneM && !nums.length) return;
      let name = l;
      if (phoneM) name = name.replace(phoneM[1], ' ');
      name = name.replace(/-?[\d,]+\.?\d*/g, ' ')
        .replace(/[^\w\u0600-\u06FF\u0900-\u097F .'_\-]/g, ' ')
        .replace(/\s+/g, ' ').trim();
      if (!name) return;
      const bal = nums.length ? U.num(nums[nums.length - 1]) * (/cr\b|credit/i.test(l) && !/dr\b|debit/i.test(l) ? -1 : 1) : 0;
      rows.push([name, phoneM ? phoneM[1].replace(/[^\d+]/g, '') : '', bal]);
    });
    return { headers: ['Name', 'Phone', 'Balance'], rows };
  },

  linesToItemRows(lines) {
    const rows = [];
    lines.forEach(l => {
      if (/total|page\s*\d|report|summary|printed|www\./i.test(l)) return;
      const nums = l.match(/-?[\d,]+\.?\d*/g) || [];
      if (!nums.length) return;
      let name = l.replace(/-?[\d,]+\.?\d*/g, ' ').replace(/[^\w\u0600-\u06FF .'\-]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!name) return;
      const qty = nums.length > 1 ? U.num(nums[0]) : 1;
      const price = U.num(nums[nums.length - 1]);
      if (!price) return;
      rows.push([name, qty, price]);
    });
    return { headers: ['Item', 'Qty', 'Price'], rows };
  },

  /* ============ column mapping ============ */
  FIELDS: {
    customers: [
      ['name', 'Name *', ['name', 'customer', 'customername', 'party', 'partyname', 'client', 'khataname', 'nam']],
      ['phone', 'Phone', ['phone', 'mobile', 'number', 'contact', 'phoneno', 'mobileno', 'cell', 'whatsapp']],
      ['address', 'Address', ['address', 'city', 'area', 'village', 'street', 'town']],
      ['balance', 'Khata balance', ['balance', 'totalbalance', 'khabatabalance', 'netbalance', 'due', 'amount', 'udhaar', 'youwillget', 'lena', 'remaining']],
      ['notes', 'Notes', ['note', 'notes', 'remark', 'remarks', 'info', 'detail']]
    ],
    items: [
      ['name', 'Item name *', ['item', 'itemname', 'product', 'productname', 'description', 'particulars', 'equipment', 'item']],
      ['sku', 'SKU / code', ['sku', 'code', 'itemcode', 'productcode', 'model', 'partno']],
      ['category', 'Category', ['category', 'type', 'group', 'brand', 'kind']],
      ['qty', 'Stock qty', ['qty', 'quantity', 'stock', 'instock', 'available', 'pieces', 'no']],
      ['unit', 'Unit', ['unit', 'uom']],
      ['costPrice', 'Cost price', ['cost', 'costprice', 'purchaseprice', 'purchase', 'buyprice', 'wholesale']],
      ['salePrice', 'Sale price', ['price', 'saleprice', 'sellingprice', 'rate', 'retail', 'mrp', 'unitprice', 'salesprice', 'amount']],
      ['lowStockAt', 'Low stock alarm', ['low', 'lowstock', 'alarm', 'minimum', 'min', 'reorder']]
    ]
  },

  norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ''); },

  cleanNum(s) {
    let t = String(s == null ? '' : s).trim();
    let neg = /^\(.*\)$/.test(t) || /-$/.test(t) || /^-/.test(t);
    t = t.replace(/[^\d.]/g, '');
    const n = U.num(t);
    return neg ? -n : n;
  },

  autoMap() {
    const { headers } = Importer.state;
    const fields = Importer.FIELDS[Importer.target];
    const map = {};
    fields.forEach(([key,, syn]) => {
      let idx = -1;
      headers.forEach((h, i) => {
        const n = Importer.norm(h);
        if (idx >= 0) return;
        if (syn.some(s => n === s)) idx = i;
      });
      if (idx < 0) headers.forEach((h, i) => {
        const n = Importer.norm(h);
        if (idx >= 0 || key === 'name') return;
        if (syn.some(s => n.includes(s))) idx = i;
      });
      if (idx < 0 && key === 'name') idx = 0;  // fall back to first column
      map[key] = idx;
    });
    Importer.map = map;
  },

  setMap(field, v) { Importer.map[field] = Number(v); },

  sampleValue(colIdx) {
    if (colIdx < 0) return '';
    for (const r of Importer.state.rows) {
      const v = (r[colIdx] || '').trim();
      if (v) return v;
    }
    return '';
  },

  renderMapping() {
    const { headers, rows, sourceName } = Importer.state;
    const fields = Importer.FIELDS[Importer.target];
    const isCust = Importer.target === 'customers';
    const body = U.q('#imp_body');
    let sel = (key) => {
      const opts = ['<option value="-1">— ignore —</option>'].concat(
        headers.map((h, i) => '<option value="' + i + '" ' + (Importer.map[key] === i ? 'selected' : '') + '>' + U.esc(h || ('col ' + (i + 1))) + '</option>')
      ).join('');
      return '<select onchange="Importer.setMap(\'' + key + '\',this.value)">' + opts + '</select>';
    };
    body.innerHTML =
      '<div class="card"><div class="card-title">' + UI.icon('check', 16) + ' Found ' + rows.length + ' rows in ' + U.esc(sourceName) + '</div>' +
      '<div class="hint" style="margin-bottom:10px">Check the columns we detected — tap a dropdown to change.</div>' +
      fields.map(([key, label]) => {
        const sv = Importer.sampleValue(Importer.map[key]);
        return '<div class="field" style="margin-bottom:10px"><label>' + label + '</label>' + sel(key) +
          (sv ? '<div class="hint">e.g. ' + U.esc(sv.slice(0, 40)) + '</div>' : '') + '</div>';
      }).join('') +
      (isCust ? '<div class="hint">Balance: positive = customer owes you, negative = advance. "Cr" suffixes are treated as advance.</div>' : '<div class="hint">Qty becomes stock; prices are used for billing.</div>') +
      '<button class="btn btn-pri btn-block mt10" onclick="Importer.doImport()">' + UI.icon('download', 17) + ' Import ' + rows.length + ' ' + (isCust ? 'customers' : 'items') + '</button>' +
      '<button class="btn btn-block mt10" onclick="Importer.state=null;Importer.renderMapping();U.q(\'#imp_body\').innerHTML=\'\'">Cancel</button>' +
      '</div>' +
      '<div class="section-label">Preview (first 4)</div><div class="card">' +
      rows.slice(0, 4).map(r => '<div class="kv"><span class="k">' +
        U.esc(String(Importer.map.name >= 0 ? r[Importer.map.name] : '').slice(0, 22) || '?') + '</span><span class="v small">' +
        (isCust
          ? U.esc((Importer.map.phone >= 0 ? (r[Importer.map.phone] || '') : '') + '  ' + (Importer.map.balance >= 0 ? Importer.cleanNum(r[Importer.map.balance]) : ''))
          : U.esc((Importer.map.qty >= 0 ? (r[Importer.map.qty] || 0) + ' × ' : '') + (Importer.map.salePrice >= 0 ? Importer.cleanNum(r[Importer.map.salePrice]) : ''))) +
        '</span></div>').join('') + '</div>';
    body.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  /* ============ do the import ============ */
  async doImport() {
    if (!Importer.state) return;
    const m = Importer.map;
    const get = (r, f) => (m[f] != null && m[f] >= 0) ? String(r[m[f]] == null ? '' : r[m[f]]).trim() : '';
    let created = 0, skipped = 0;
    if (Importer.target === 'customers') {
      const existing = await DB.all('customers');
      for (const r of Importer.state.rows) {
        const name = get(r, 'name');
        if (!name || /^unknown$/i.test(name)) { skipped++; continue; }
        const phone = get(r, 'phone').replace(/[^\d+]/g, '');
        const dup = existing.find(c =>
          (phone && c.phone === phone) ||
          (!phone && c.name.toLowerCase() === name.toLowerCase()));
        if (dup) { skipped++; continue; }
        const c = { id: U.uid(), name, phone, address: get(r, 'address'), notes: get(r, 'notes'), createdAt: U.nowISO() };
        await DB.put('customers', c);
        existing.push(c);
        const bal = Importer.cleanNum(get(r, 'balance'));
        if (bal) {
          await DB.put('entries', {
            customerId: c.id, customerName: c.name, type: 'opening', amount: bal,
            day: U.day(), date: U.nowISO(), note: 'Opening balance (imported)'
          });
        }
        created++;
      }
    } else {
      const existing = await DB.all('items');
      for (const r of Importer.state.rows) {
        const name = get(r, 'name');
        if (!name || /^unknown$/i.test(name)) { skipped++; continue; }
        const dup = existing.find(i => i.name.toLowerCase() === name.toLowerCase() && !i.archived);
        if (dup) { skipped++; continue; }
        const salePrice = Importer.cleanNum(get(r, 'salePrice'));
        const it = {
          id: U.uid(), name, sku: get(r, 'sku'),
          category: get(r, 'category') || 'Imported', unit: get(r, 'unit') || 'pcs',
          costPrice: Importer.cleanNum(get(r, 'costPrice')),
          salePrice: salePrice > 0 ? salePrice : 0,
          lowStockAt: Importer.cleanNum(get(r, 'lowStockAt')) || App.s.lowStockDefault,
          qty: 0, archived: false, createdAt: U.nowISO()
        };
        if (it.salePrice <= 0) it.salePrice = Math.max(it.costPrice, 1);
        await DB.put('items', it);
        const qty = Importer.cleanNum(get(r, 'qty'));
        if (qty > 0) {
          await Stock.addMove(it.id, 'in', qty, { note: 'Imported stock', unitCost: it.costPrice, day: U.day() });
          await Stock.recalc(it.id);
        }
        existing.push(it);
        created++;
      }
    }
    App.updateBadges();
    const body = U.q('#imp_body');
    if (body) body.innerHTML =
      '<div class="card" style="text-align:center"><div style="font-size:40px">✅</div>' +
      '<div class="big mt6">' + created + ' ' + (Importer.target === 'customers' ? 'customers' : 'items') + ' imported</div>' +
      (skipped ? '<div class="small muted mt6">' + skipped + ' skipped (empty or already exists)</div>' : '') +
      '<button class="btn btn-pri btn-block mt14" onclick="App.nav(\'' + (Importer.target === 'customers' ? 'khata' : 'stock') + '\')">View ' + (Importer.target === 'customers' ? 'khatas' : 'inventory') + '</button>' +
      '</div>';
    UI.toast(created + ' imported, ' + skipped + ' skipped', created ? 'ok' : 'err');
    Importer.state = null;
  },

  loadScript(src, label) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error((label || 'file reader') + ' needs internet — connect once and retry'));
      document.head.appendChild(s);
    });
  }
};

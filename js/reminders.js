/* Customer payment reminders via user-triggered WhatsApp share links. */
const Reminders = {
  templates: {
    en: 'Assalam-o-alaikum {name}, your remaining balance with {shop} is {balance}. Please let us know when you can pay. Thank you.',
    roman: 'Assalam o alaikum {name}, {shop} ke paas aapka baqi balance {balance} hai. Bara-e-karam payment ki date bata dein. Shukriya.',
    ur: 'السلام علیکم {name}، {shop} کے حساب میں آپ کا بقایا {balance} ہے۔ براہ کرم ادائیگی کی تاریخ بتا دیں۔ شکریہ۔'
  },
  queue: [],
  phone(party) {
    let digits = String(party.phone || '').replace(/\D/g, '');
    if (digits.startsWith('0')) digits = '92' + digits.slice(1);
    if (digits && !digits.startsWith('92')) digits = '92' + digits;
    return digits;
  },
  async compose(customerId) {
    const customer = await DB.get('customers', customerId);
    if (!customer || !customer.phone) return UI.toast('Add a phone number before sending a reminder', 'err');
    const balance = Khata.balanceOf(await DB.idx('entries', 'customerId', customerId));
    if (balance <= 0) return UI.toast('This customer has no outstanding balance', 'err');
    const logs = await DB.idx('reminders', 'customerId', customerId);
    const last = logs.sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
    const gap = Math.max(0, U.num(App.s.minReminderGapDays || 0));
    if (last && gap && (Date.now() - Date.parse(last.date)) / 86400000 < gap) {
      const ok = await UI.confirm({ title: 'Reminder sent recently', message: 'A reminder was sent within the ' + gap + '-day minimum gap. Send another now?', ok: 'Send anyway' });
      if (!ok) return;
    }
    const message = Reminders.fill(Reminders.templates.en, customer, balance);
    const href = 'https://wa.me/' + Reminders.phone(customer) + '?text=' + encodeURIComponent(message);
    UI.sheet({ title: 'Payment reminder', body:
      '<div class="field"><label>Language</label><select id="rem_lang" onchange="Reminders.changeLanguage(\'' + customerId + '\')"><option value="en">English</option><option value="roman">Roman Urdu</option><option value="ur">Urdu</option></select></div>' +
      '<div class="field"><label>Message</label><textarea id="rem_message" oninput="Reminders.updateLink()">' + U.esc(message) + '</textarea></div>' +
      '<div class="hint">Balance: ' + U.money(balance) + ' · Last reminder: ' + (last ? U.fmtDateTime(last.date) : 'Never') + '</div>' +
      '<a id="rem_send" class="btn btn-green btn-block mt10" target="_blank" rel="noopener" href="' + href + '" onclick="Reminders.log(\'' + customerId + '\')">' + UI.icon('chat', 17) + ' Open WhatsApp</a>' +
      (Reminders.queue.length ? '<button class="btn btn-block mt10" onclick="Reminders.nextBulk()">Next selected customer (' + Reminders.queue.length + ' left)</button>' : '')
    });
    Reminders.pending = { customer, balance, customerId };
  },
  fill(template, customer, balance) {
    return template.replace(/\{name\}/g, customer.name || '').replace(/\{shop\}/g, App.s.shopName || 'My Shop').replace(/\{balance\}/g, U.money(balance));
  },
  changeLanguage(customerId) {
    const lang=U.q('#rem_lang').value, {customer,balance}=Reminders.pending;
    U.q('#rem_message').value=Reminders.fill(Reminders.templates[lang],customer,balance);
    Reminders.updateLink();
  },
  updateLink() {
    if (!Reminders.pending) return;
    U.q('#rem_send').href='https://wa.me/'+Reminders.phone(Reminders.pending.customer)+'?text='+encodeURIComponent(U.q('#rem_message').value);
  },
  async log(customerId) {
    if (!Reminders.pending) return;
    const {customer,balance}=Reminders.pending;
    await DB.put('reminders',{customerId,customerName:customer.name,phone:customer.phone,balance,message:U.q('#rem_message').value,channel:'whatsapp',day:U.day(),date:U.nowISO()});
  },
  async bulk() {
    const [customers,invoices]=await Promise.all([DB.all('customers'),DB.all('invoices')]);
    const ids=Array.from(new Set(invoices.filter(invoice=>Invoices.dueOf(invoice)>0&&invoice.dueDate&&U.day()>invoice.dueDate).map(invoice=>invoice.customerId).filter(Boolean)));
    const dueCustomers=customers.filter(customer=>ids.includes(customer.id)&&customer.isCustomer!==false&&customer.phone);
    UI.sheet({title:'Bulk overdue reminders',body:dueCustomers.length
      ? '<div class="list">'+dueCustomers.map(customer=>'<label class="lrow"><input type="checkbox" class="rem_bulk" value="'+customer.id+'" checked><div class="l-main"><div class="l-title">'+U.esc(customer.name)+'</div><div class="l-sub">'+U.esc(customer.phone)+'</div></div></label>').join('')+'</div><button class="btn btn-pri btn-block mt10" onclick="Reminders.beginBulk()">Start selected reminders</button>'
      : UI.empty('check','No overdue customers with phone numbers')});
  },
  beginBulk() {
    Reminders.queue=Array.from(document.querySelectorAll('.rem_bulk:checked')).map(input=>input.value);
    if (!Reminders.queue.length) return UI.toast('Select at least one customer','err');
    Reminders.nextBulk();
  },
  nextBulk() {
    const id=Reminders.queue.shift();
    U.q('.sheet-overlay')&&U.q('.sheet-overlay').remove();
    if (!id) { Reminders.queue=[]; return UI.toast('Bulk reminders complete','ok'); }
    Reminders.compose(id);
  }
};

/* English/Urdu UI translations for the Khata app. */
const I18n = {
  language: 'en',
  originals: new WeakMap(),
  words: {
    'Home':'ہوم','Khata':'کھاتہ','Stock':'اسٹاک','Bills':'بل','Orders':'آرڈرز','Reports':'رپورٹس','Settings':'ترتیبات','More':'مزید',
    'Settings & Management':'ترتیبات اور انتظام','Control Solis website CMS & Khata app':'سولس ویب سائٹ اور کھاتہ ایپ کا انتظام کریں',
    'Solis Website Settings':'سولس ویب سائٹ کی ترتیبات','Khata & Shop Preferences':'کھاتہ اور دکان کی ترجیحات','Shop profile':'دکان کی معلومات',
    'Shop name':'دکان کا نام','Phone':'فون','Currency':'کرنسی','Address':'پتہ','Invoice footer':'انوائس کا آخری پیغام','Invoice paper size':'انوائس کا سائز',
    'Language / direction':'زبان / سمت','English · LTR':'انگریزی · بائیں سے دائیں','اردو · RTL':'اردو · دائیں سے بائیں','Save profile':'پروفائل محفوظ کریں',
    'Khata & inventory preferences':'کھاتہ اور انوینٹری کی ترجیحات','Auto-adjust advance':'ایڈوانس خودکار طور پر منہا کریں','New bills automatically use customer advance':'نئے بلوں میں گاہک کا ایڈوانس خودکار طور پر شامل کریں',
    'Default low-stock alarm':'کم اسٹاک کی حد','Used for new items (editable per item)':'نئی اشیا کے لیے (ہر شے کے لیے تبدیل ہو سکتی ہے)','Invoice number prefix':'انوائس نمبر کا سابقہ','Default credit days':'ادھار کے دن',
    'Negative stock':'منفی اسٹاک','Warn and allow':'تنبیہ کریں اور جاری رکھیں','Block sale':'فروخت روکیں','Reminder gap (days)':'یاددہانی کا وقفہ (دن)',
    'Stock alarm notifications':'کم اسٹاک کی اطلاع','System notification when items go low':'اسٹاک کم ہونے پر اطلاع دیں','Auto-lock':'خودکار لاک','Lock app after inactivity':'غیرفعال رہنے پر ایپ لاک کریں',
    'Security — smart login':'سیکیورٹی — محفوظ لاگ اِن','Sign in with Google':'گوگل سے سائن اِن','Change password':'پاس ورڈ تبدیل کریں','Set quick PIN':'فوری پن بنائیں','Change / remove PIN':'پن تبدیل یا ہٹائیں',
    'Fingerprint quick unlock':'فنگر پرنٹ سے فوری کھولیں','Lock now':'ابھی لاک کریں','Log out':'لاگ آؤٹ','Migrate from another app':'دوسری ایپ سے ڈیٹا لائیں',
    'Import customers & inventory':'گاہک اور انوینٹری درآمد کریں','Backup & global sync':'بیک اپ اور ہم وقت سازی','Export file':'فائل برآمد کریں','Import file':'فائل درآمد کریں',
    'Google Drive sync':'گوگل ڈرائیو ہم وقت سازی','Connect Google':'گوگل سے منسلک کریں','Backup to Drive':'ڈرائیو پر بیک اپ','Restore from Drive':'ڈرائیو سے بحال کریں',
    'Audit & data integrity':'ریکارڈ اور ڈیٹا کی جانچ','Audit history':'تبدیلیوں کی تاریخ','Integrity check':'ڈیٹا کی درستگی جانچیں','Danger zone':'خطرناک کارروائیاں','Erase all data & restart':'تمام ڈیٹا مٹا کر دوبارہ شروع کریں',
    'Website Estimate Orders':'ویب سائٹ کے تخمینی آرڈرز','Track, trace & convert website leads into Khata invoices':'ویب سائٹ کے آرڈرز دیکھیں اور کھاتہ بل بنائیں','Orders (':'آرڈرز (','All (':'تمام (','Pending (':'زیرِ التوا (',
    'Website Settings':'ویب سائٹ کی ترتیبات','View Website':'ویب سائٹ دیکھیں','Refresh orders':'آرڈرز تازہ کریں','New Pending Orders':'نئے زیرِ التوا آرڈرز','In Discussion':'زیرِ گفتگو','Closed / Invoiced':'مکمل / بل شدہ',
    'All':'تمام','Pending':'زیرِ التوا','Contacted':'رابطہ ہو گیا','In Progress':'جاری ہے','Completed':'مکمل','Survey scheduled':'سروے طے شدہ','Invoiced':'بل بن گیا','Cancelled':'منسوخ',
    'Search order, customer or phone':'آرڈر، گاہک یا فون تلاش کریں','No orders found in this filter':'اس فہرست میں کوئی آرڈر نہیں','System Size:':'سسٹم کا سائز:','Recommended:':'تجویز کردہ:','Monthly Bill:':'ماہانہ بل:','Battery Type:':'بیٹری کی قسم:','Est. Cost:':'تخمینی قیمت:','Customer Note:':'گاہک کا نوٹ:',
    'Call':'کال کریں','WhatsApp':'واٹس ایپ','Convert to Bill':'بل بنائیں','Save & Publish Website':'محفوظ کریں اور شائع کریں','Preview Site':'ویب سائٹ کا پیش منظر',
    'Order Form Builder':'آرڈر فارم بنائیں','Build your order form':'آرڈر فارم ترتیب دیں','Solar systems customers can select':'گاہک کے لیے سولر سسٹم کے انتخاب','Save Order Form':'آرڈر فارم محفوظ کریں',
    'Inverter Catalog':'انورٹر کی فہرست','Hero Carousel Slides':'مرکزی بینر','Estimate Orders':'تخمینی آرڈرز','Website Editor Guide':'ویب سائٹ ترمیم کی رہنمائی',
    'Customer Information':'گاہک کی معلومات','Full Name':'پورا نام','Save':'محفوظ کریں','Cancel':'منسوخ','Delete':'حذف کریں','Edit':'ترمیم کریں','Add':'شامل کریں','Search':'تلاش','Filter':'فلٹر',
    'Name':'نام','Date':'تاریخ','Amount':'رقم','Total':'کل رقم','Paid':'ادا شدہ','Due':'بقایا','Balance':'بقیہ','Quantity':'مقدار','Price':'قیمت','Item':'شے','Customer':'گاہک',
    'Add customer':'گاہک شامل کریں','Add item':'شے شامل کریں','New bill':'نیا بل','Create bill':'بل بنائیں','Payment':'ادائیگی','Receive payment':'رقم وصول کریں','Give payment':'رقم ادا کریں',
    'Income':'آمدنی','Expense':'خرچ','Profit':'منافع','Loss':'نقصان','Today':'آج','This month':'اس ماہ','From':'سے','To':'تک','Notes':'نوٹس','Note':'نوٹ','Status':'حالت',
    'Low stock':'کم اسٹاک','In stock':'اسٹاک میں','Out of stock':'اسٹاک ختم','Customer ledger':'گاہک کا کھاتہ','Inventory':'انوینٹری','Dashboard':'ڈیش بورڈ','Overview':'جائزہ',
    'Change theme':'رنگ تھیم تبدیل کریں','Theme':'رنگ تھیم','Light':'روشن','Dark':'گہرا','Connected':'منسلک','Disconnect':'منقطع کریں','Export':'برآمد کریں','Import':'درآمد کریں',
    'Username':'صارف نام','Password':'پاس ورڈ','Login':'لاگ اِن','Log in':'لاگ اِن','Sign in':'سائن اِن','Sign up':'اکاؤنٹ بنائیں','Create account':'اکاؤنٹ بنائیں','Unlock':'کھولیں','Continue':'جاری رکھیں','Welcome':'خوش آمدید',
    'Inventory':'انوینٹری','Invoices':'انوائسز','Item name':'شے کا نام','Category':'قسم','SKU / code':'SKU / کوڈ','Cost price':'خرید قیمت','Sale price':'فروخت قیمت','Unit':'اکائی','Low stock alarm at':'کم اسٹاک کی حد','Opening stock qty':'ابتدائی اسٹاک کی مقدار','Quantity':'مقدار','Unit cost (purchase price)':'فی اکائی خرید قیمت','Supplier':'سپلائر','Bill no.':'بل نمبر','Paid now':'ابھی ادا کریں','Change (+/-)':'تبدیلی (+/-)','Reason':'وجہ',
    'No activity yet':'ابھی کوئی سرگرمی نہیں','Create your first bill or khata entry':'اپنا پہلا بل یا کھاتہ اندراج بنائیں','No items yet':'ابھی کوئی اشیا نہیں','Create an item first, then receive its stock':'پہلے شے بنائیں، پھر اسٹاک درج کریں','Create inventory item':'انوینٹری کی شے بنائیں','No items found':'کوئی شے نہیں ملی','Add your panels, inverters, batteries…':'اپنے پینل، انورٹر اور بیٹریاں شامل کریں','Item not found':'شے نہیں ملی','No movements yet':'ابھی کوئی اسٹاک حرکت نہیں','Add stock or make a sale first':'پہلے اسٹاک شامل کریں یا فروخت کریں',
    'No invoices':'کوئی انوائس نہیں','Tap + to create your first bill':'پہلا بل بنانے کے لیے + دبائیں','Edit':'ترمیم کریں','New Invoice':'نئی انوائس','Changes recompute stock & ledger':'تبدیلی سے اسٹاک اور کھاتہ دوبارہ شمار ہوگا','Walk-in customer name (optional)':'عام گاہک کا نام (اختیاری)','Received now':'ابھی وصول شدہ','Payment method':'ادائیگی کا طریقہ','Reference no.':'حوالہ نمبر','Due date (optional)':'آخری تاریخ (اختیاری)','Discount note':'رعایت کی وجہ','Delivery / other charge':'ڈیلیوری / دیگر خرچ','No items match':'کوئی شے مطابقت نہیں رکھتی','Tap “Add item” to build the bill':'بل بنانے کے لیے “شے شامل کریں” دبائیں',
    'No payments yet':'ابھی کوئی ادائیگی نہیں','No outstanding invoices':'کوئی بقایا انوائس نہیں','No item history':'شے کی کوئی تاریخ نہیں','Add customer first':'پہلے گاہک شامل کریں','Customer ledger':'گاہک کا کھاتہ','No customers yet':'ابھی کوئی گاہک نہیں',
    '7 days':'7 دن','Month':'مہینہ','Apply range':'مدت لاگو کریں','Export CSV':'CSV برآمد کریں','No receivables':'کوئی وصولی باقی نہیں','Supplier payables':'سپلائر کے بقایا جات','Collections by method':'طریقہ وار وصولیاں','No collections in this range':'اس مدت میں کوئی وصولی نہیں','Top items sold':'زیادہ فروخت ہونے والی اشیا','No item sales in this range':'اس مدت میں کوئی فروخت نہیں','Invoices in range':'مدت کی انوائسز','No invoices in this range':'اس مدت میں کوئی انوائس نہیں','Stock movements in range':'مدت میں اسٹاک کی تبدیلیاں','No stock movement in this range':'اس مدت میں اسٹاک کی کوئی تبدیلی نہیں','open invoices':'کھلی انوائسز','Walk-in':'عام گاہک',
    'Cash':'نقد','Bank':'بینک','Cheque':'چیک','Other':'دیگر','Rent':'کرایہ','Electricity':'بجلی','Salaries':'تنخواہیں','Transport':'ٹرانسپورٹ','Purchase':'خریداری','Panels':'پینل','Inverters':'انورٹر','Batteries':'بیٹریاں','Structure':'ڈھانچہ','Cables':'کیبلز','Accessories':'لوازمات','No supplier':'کوئی سپلائر نہیں',
    'Customer added':'گاہک شامل ہوگیا','Back online':'انٹرنیٹ بحال ہوگیا','Offline':'آف لائن','Back':'واپس','Close':'بند کریں','Done':'مکمل','Apply':'لاگو کریں','Create':'بنائیں','Update':'تازہ کریں','Remove':'ہٹائیں','Select':'منتخب کریں','Optional':'اختیاری','Required':'لازمی','Never':'کبھی نہیں','Off':'بند',
    'Toggle Theme':'رنگ تھیم تبدیل کریں','View Live Website':'براہِ راست ویب سائٹ دیکھیں','Add':'شامل کریں','Edit':'ترمیم کریں','Delete':'حذف کریں','Print':'پرنٹ','Share':'شیئر','Notifications':'اطلاعات','Search':'تلاش','Lock':'لاک','Unlock':'کھولیں','Menu':'مینو','Language':'زبان','Calendar':'کیلنڈر','Settings and preferences':'ترتیبات اور ترجیحات'
  },

  decodeMojibake(value) {
    const cp1252 = { 0x20ac:0x80,0x201a:0x82,0x0192:0x83,0x201e:0x84,0x2026:0x85,0x2020:0x86,0x2021:0x87,0x02c6:0x88,0x2030:0x89,0x0160:0x8a,0x2039:0x8b,0x0152:0x8c,0x017d:0x8e,0x2018:0x91,0x2019:0x92,0x201c:0x93,0x201d:0x94,0x2022:0x95,0x2013:0x96,0x2014:0x97,0x02dc:0x98,0x2122:0x99,0x0161:0x9a,0x203a:0x9b,0x0153:0x9c,0x017e:0x9e,0x0178:0x9f };
    const bytes = [];
    for (const char of String(value)) {
      const code = char.codePointAt(0);
      const byte = cp1252[code] === undefined ? code : cp1252[code];
      if (byte <= 255) bytes.push(byte);
      else return value;
    }
    try { return new TextDecoder('utf-8').decode(new Uint8Array(bytes)); }
    catch (error) { return value; }
  },

  normalizeDictionary() {
    const decoded = {};
    Object.entries(this.words).forEach(([key, value]) => { decoded[this.decodeMojibake(key)] = this.decodeMojibake(value); });
    this.words = decoded;
  },

  sourceFor(node) {
    if (!this.originals.has(node)) this.originals.set(node, node.nodeValue);
    return this.originals.get(node);
  },

  translate(value) {
    if (this.language !== 'ur') return value;
    let result = value;
    for (const [english, urdu] of Object.entries(this.words).sort((a, b) => b[0].length - a[0].length)) {
      if (!/\s/.test(english) && value.trim().toLowerCase() !== english.toLowerCase()) continue;
      const escaped = english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const endBoundary = /[\p{L}\p{N}]$/u.test(english) ? '(?=$|[^\\p{L}\\p{N}])' : '';
      result = result.replace(new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}${endBoundary}`, 'giu'), `$1${urdu}`);
    }
    return result;
  },

  apply(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!node.parentElement || ['SCRIPT','STYLE'].includes(node.parentElement.tagName)) return;
      const original = this.sourceFor(node);
      const value = this.translate(original);
      if (node.nodeValue !== value) node.nodeValue = value;
    });
    root.querySelectorAll?.('[placeholder],[title],[aria-label]').forEach(el => {
      let state = this.originals.get(el);
      if (!state || !state.attrs) { state = { attrs: {} }; this.originals.set(el, state); }
      ['placeholder','title','aria-label'].forEach(attr => {
        if (!Object.prototype.hasOwnProperty.call(state.attrs, attr)) state.attrs[attr] = el.getAttribute(attr);
        const original = state.attrs[attr];
        if (original) el.setAttribute(attr, this.translate(original));
      });
    });
  },

  setLanguage(language) {
    this.language = language === 'ur' ? 'ur' : 'en';
    document.documentElement.lang = this.language;
    document.documentElement.dir = this.language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.classList.toggle('rtl', this.language === 'ur');
    this.apply(document.body);
  }
};

I18n.normalizeDictionary();

if (typeof MutationObserver !== 'undefined') {
  new MutationObserver(records => records.forEach(record => {
    if (record.type === 'childList') record.addedNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        const original = I18n.sourceFor(node);
        const translated = I18n.translate(original);
        if (node.nodeValue !== translated) node.nodeValue = translated;
      } else if (node.nodeType === Node.ELEMENT_NODE) I18n.apply(node);
    });
  })).observe(document.body, { childList: true, subtree: true });
}

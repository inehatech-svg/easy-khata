/* Settings: Solis Pakistan Website Settings & CMS, Shop profile, preferences, security, backup & sync */
const SettingsPage = {
  activeTab: 'website', // default to 'website' as requested by user
  activeSubtab: 'sec-company',
  lastCreatedAccountId: '',
  lastCreatedAccountPassword: '',

  async page(params = {}) {
    if (params && params.tab) {
      this.activeTab = params.tab;
    }
    if (params && params.subtab) {
      this.activeSubtab = params.subtab;
    }

    if (typeof KhataWebAdmin !== 'undefined') {
      await KhataWebAdmin.fetchWebData();
      await KhataWebAdmin.fetchOrders();
    }

    const s = App.s;
    const isWebTab = this.activeTab === 'website';

    const section = isWebTab ? this.renderWebsiteSection() : await this.renderShopSection();
    return '<div class="page">' +
      UI.backHead('Settings & Management', 'Control Solis website CMS & Khata app',
        '<button class="ph-btn" onclick="App.toggleTheme()" title="Toggle Theme">' + UI.icon(s.theme === 'dark' ? 'sun' : 'moon', 18) + '</button>') +
      '<div class="page-body settings-page-body">' +

      '<!-- Main Tab Switcher -->' +
      '<div class="wa-main-tabs">' +
      '<button class="btn btn-sm ' + (isWebTab ? 'btn-pri' : 'btn-outline') + '" style="flex:1; border:none; ' + (isWebTab ? 'background:#F15A29; color:#fff; font-weight:700;' : 'color:var(--text);') + '" onclick="SettingsPage.switchMainTab(\'website\')">' +
      UI.icon('globe', 16) + ' Solis Website Settings' +
      '</button>' +
      '<button class="btn btn-sm ' + (!isWebTab ? 'btn-pri' : 'btn-outline') + '" style="flex:1; border:none; ' + (!isWebTab ? 'background:var(--pri); color:#fff; font-weight:700;' : 'color:var(--text);') + '" onclick="SettingsPage.switchMainTab(\'shop\')">' +
      UI.icon('sliders', 16) + ' Khata & Shop Preferences' +
      '</button>' +
      '</div>' +

      section +

      '</div></div>';
  },

  /* ========================================================
     WEBSITE SETTINGS & CMS SECTION
     ======================================================== */
  renderWebsiteSection() {
    const d = (typeof KhataWebAdmin !== 'undefined' && KhataWebAdmin.webData) ? KhataWebAdmin.webData : (window.DEFAULT_SOLIS_DATA || {});
    const orders = (typeof KhataWebAdmin !== 'undefined' && KhataWebAdmin.orders) ? KhataWebAdmin.orders : [];
    const comp = d.company || {};
    const orderConfig = d.orderSettings || {};
    const slides = d.heroSlides || [];
    const products = d.featuredProducts || [];
    const activeSub = this.activeSubtab || 'sec-company';

    const pendingCount = orders.filter(o => (o.status || 'Pending') === 'Pending').length;
    const inProgressCount = orders.filter(o => ['In Progress', 'Contacted', 'Survey Scheduled'].includes(o.status)).length;
    const invoicedCount = orders.filter(o => ['Completed', 'Invoiced in Khata'].includes(o.status)).length;

    return `
      <!-- Top Action Banner -->
      <div class="card" style="background:linear-gradient(135deg, #FFF1EB 0%, #FFFFFF 100%); border-left:4px solid #F15A29; padding:16px; margin-bottom:14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <div style="font-size:16px; font-weight:800; color:#F15A29; display:flex; align-items:center; gap:8px;">
              <span>â˜€ï¸</span> Solis Pakistan (Karachi) Live Website Settings
            </div>
            <div style="font-size:12px; color:#6B7280; margin-top:2px;">
              Manage models, PKR pricing, hero banners &amp; Karachi hotline directly on this address
            </div>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button class="btn btn-sm" style="background:#F15A29; color:#fff; border:none; font-weight:700; padding:8px 16px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(241,90,41,0.3);" onclick="KhataWebAdmin.saveAndSyncWebsite()">
              ðŸ’¾ Save &amp; Publish Website
            </button>
            <a href="/" target="_blank" class="btn btn-sm btn-outline" style="font-weight:600; padding:8px 14px; display:inline-flex; align-items:center; gap:4px; border-color:#D1D5DB; color:#374151;">
              ðŸ‘ï¸ Preview Site â†—
            </a>
          </div>
        </div>
      </div>

      <!-- Sub-Navigation Pills -->
      <div class="wa-subtab-nav">
        <button class="btn btn-sm wa-subtab-btn" data-target="sec-company" style="font-size:12.5px; padding:6px 14px; border-radius:20px; ${activeSub === 'sec-company' ? 'background:#F15A29; color:#fff; border-color:#F15A29;' : 'background:var(--card); color:var(--text); border:1px solid var(--line);'}" onclick="SettingsPage.switchSubtab('sec-company')">
          ðŸ¢ Karachi Hub &amp; Contact
        </button>
        <button class="btn btn-sm wa-subtab-btn" data-target="sec-order-builder" style="font-size:12.5px; padding:6px 14px; border-radius:20px; ${activeSub === 'sec-order-builder' ? 'background:#F15A29; color:#fff; border-color:#F15A29;' : 'background:var(--card); color:var(--text); border:1px solid var(--line);'}" onclick="SettingsPage.switchSubtab('sec-order-builder')">Order Form Builder</button>
        <button class="btn btn-sm wa-subtab-btn" data-target="sec-products" style="font-size:12.5px; padding:6px 14px; border-radius:20px; ${activeSub === 'sec-products' ? 'background:#F15A29; color:#fff; border-color:#F15A29;' : 'background:var(--card); color:var(--text); border:1px solid var(--line);'}" onclick="SettingsPage.switchSubtab('sec-products')">
          âš¡ Inverter Catalog (${products.length})
        </button>
        <button class="btn btn-sm wa-subtab-btn" data-target="sec-slides" style="font-size:12.5px; padding:6px 14px; border-radius:20px; ${activeSub === 'sec-slides' ? 'background:#F15A29; color:#fff; border-color:#F15A29;' : 'background:var(--card); color:var(--text); border:1px solid var(--line);'}" onclick="SettingsPage.switchSubtab('sec-slides')">
          ðŸ–¼ï¸ Hero Slider (${slides.length})
        </button>
        <button class="btn btn-sm wa-subtab-btn" data-target="sec-orders" style="font-size:12.5px; padding:6px 14px; border-radius:20px; ${activeSub === 'sec-orders' ? 'background:#F15A29; color:#fff; border-color:#F15A29;' : 'background:var(--card); color:var(--text); border:1px solid var(--line);'}" onclick="SettingsPage.switchSubtab('sec-orders')">
          ðŸ“¦ Estimate Orders (${orders.length})
        </button>
        <button class="btn btn-sm wa-subtab-btn" data-target="sec-content" style="font-size:12.5px; padding:6px 14px; border-radius:20px; ${activeSub === 'sec-content' ? 'background:#F15A29; color:#fff; border-color:#F15A29;' : 'background:var(--card); color:var(--text); border:1px solid var(--line);'}" onclick="SettingsPage.switchSubtab('sec-content')">
          Website Editor Guide
        </button>
      </div>

      <!-- Subtab 1: Karachi Regional Hub & Contact -->
      <div id="sec-company" class="wa-subtab-pane" style="${activeSub === 'sec-company' ? 'display:block;' : 'display:none;'}">
        <div class="card" style="padding:18px; margin-bottom:16px;">
          <div class="card-title" style="color:#111827; font-size:15px; margin-bottom:12px;">
            <span>ðŸ¢</span> Karachi Regional Headquarters Information
          </div>
          <div class="field"><label>Company Name (Shown in Footer &amp; Branding)</label><input id="wa_comp_name" value="${U.esc(comp.name || 'Solis Pakistan')}"></div>
          <div class="field"><label>Brand Slogan / Tagline</label><input id="wa_comp_slogan" value="${U.esc(comp.slogan || 'Bankable, Reliable, Local')}"></div>
          <div class="grid2">
            <div class="field"><label>Karachi Landline Hotline</label><input id="wa_comp_hotline" value="${U.esc(comp.hotline || '+92 21 3456 7890')}"></div>
          <div class="field"><label>Official WhatsApp Number</label><input id="wa_comp_wa" value="${U.esc(comp.whatsapp || '+92 300 123 4567')}"></div>
          </div>
          <div class="grid2">
            <div class="field"><label>Support &amp; Warranty Email</label><input id="wa_comp_email" value="${U.esc(comp.email || 'pakistan@ginlong.com')}"></div>
            <div class="field"><label>Sales &amp; Inquiry Email</label><input id="wa_comp_sales" value="${U.esc(comp.salesEmail || 'sales.pk@ginlong.com')}"></div>
          </div>
          <div class="field"><label>Website and app theme color</label><div style="display:flex;gap:10px;align-items:center"><input id="wa_comp_primary_color" type="color" value="${U.esc(/^#[0-9a-f]{6}$/i.test(comp.primaryColor || '') ? comp.primaryColor : '#F15A29')}" style="width:56px;height:42px;padding:3px"><span class="hint">This color is shared by the public website and the Khata app.</span></div></div>
        <div class="field"><label>Karachi Office Address</label><input id="wa_comp_addr" value="${U.esc(comp.address || 'Suite 402, Business Avenue, Main Shahrah-e-Faisal, Karachi 75400, Pakistan')}"></div>
          <div class="field"><label>Mobile number for invoices</label><input id="wa_comp_mobile" value="${U.esc(comp.mobile || comp.whatsapp || '')}" placeholder="+92 300 1234567"></div>
          <div class="field"><label>Company logo (website header, footer &amp; invoices)</label><input id="wa_comp_logo" value="${U.esc(comp.logoUrl || '')}" placeholder="Paste logo image URL or upload below"><input id="wa_comp_logo_file" type="file" accept="image/*" style="margin-top:8px"><div class="hint">Upload or link your company logo. It appears in the public website header and footer, and on printed invoices.</div>${comp.logoUrl ? `<img src="${U.esc(comp.logoUrl)}" alt="Company logo preview" style="max-width:160px;max-height:70px;object-fit:contain;margin-top:8px">` : ''}</div>
          <div class="field"><label>Support &amp; Showroom Hours</label><input id="wa_comp_hours" value="${U.esc(comp.hours || 'Mon â€“ Sat: 9:00 AM â€“ 7:00 PM PKT')}"></div>
          <div style="margin-top:14px; display:flex; justify-content:flex-end;">
            <button class="btn btn-pri" style="background:#F15A29; border:none; padding:10px 22px; font-weight:700;" onclick="KhataWebAdmin.saveAndSyncWebsite()">
              Save Company Details
            </button>
          </div>
        </div>
      </div>

      <div id="sec-order-builder" class="wa-subtab-pane" style="${activeSub === 'sec-order-builder' ? 'display:block;' : 'display:none;'}">
        <div class="card" style="padding:18px;margin-bottom:16px">
          <div class="card-title">Build your order form</div>
          <p class="hint">Set the customer choices and the price range for each system. Customers can also enter a custom size and explain any special requirements.</p>
          <div class="field"><label>Solar systems customers can select</label><textarea id="wa_order_systems" rows="7" placeholder="5 kW | Small home | 750000 | 980000">${U.esc((orderConfig.systems || window.DEFAULT_SOLIS_DATA?.orderSettings?.systems || []).map(x => `${x.size || ''} | ${x.description || ''} | ${Number(x.minPrice) || 0} | ${Number(x.maxPrice) || 0}`).join('\n'))}</textarea><div class="hint">One per line: system size | description | starting PKR price | maximum PKR price</div></div>
          <div class="grid2">
            ${[['inverter','Inverter / system type'],['battery','Battery choice'],['monthlyBill','Monthly electricity bill']].map(([key,label]) => `<label class="srow"><span class="s-main"><span class="s-t">${label}</span><span class="s-d">Show this choice on the order form</span></span><input type="checkbox" id="wa_order_module_${key}" ${(orderConfig.modules || window.DEFAULT_SOLIS_DATA?.orderSettings?.modules || {inverter:true,battery:true,monthlyBill:true})[key] !== false ? 'checked' : ''}></label>`).join('')}
          </div>
          <div class="field"><label>Your additional order questions (one per line)</label><textarea id="wa_order_custom" rows="4" placeholder="Roof type | Concrete,Metal,Other">${U.esc((orderConfig.customModules || []).map(x => `${x.label} | ${(x.options || []).join(',')}`).join('\n'))}</textarea><div class="hint">Format: question | option 1, option 2. Example: Roof type | Concrete, Metal, Other</div></div>
          <div class="field"><label>Selectable order items and prices</label><textarea id="wa_order_priced_items" rows="5" placeholder="Lithium battery bank | 525000">${U.esc((orderConfig.pricedItems || window.DEFAULT_SOLIS_DATA?.orderSettings?.pricedItems || []).map(x => `${x.label || ''} | ${Number(x.price) || 0}`).join('\n'))}</textarea><div class="hint">One per line: item name | price in PKR. Customers can select these items and the estimate updates immediately. Include “Lithium” or “Tubular” in battery item names to link those prices to the battery choice.</div></div>
          <div class="grid2"><div class="field"><label>Custom system minimum price per kW (PKR)</label><input type="number" id="wa_order_custom_min_rate" min="0" value="${Number(orderConfig.customRates?.minPerKw) || 145000}"></div><div class="field"><label>Custom system maximum price per kW (PKR)</label><input type="number" id="wa_order_custom_max_rate" min="0" value="${Number(orderConfig.customRates?.maxPerKw) || 175000}"></div></div>
          <button class="btn btn-pri" onclick="SettingsPage.saveOrderBuilder()">Save Order Form</button>
        </div>
      </div>

      <!-- Subtab 2: Inverter Catalog & PKR Pricing -->
      <div id="sec-products" class="wa-subtab-pane" style="${activeSub === 'sec-products' ? 'display:block;' : 'display:none;'}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div>
            <h3 style="font-size:16px; font-weight:700; color:var(--text);">Inverter Catalog (${products.length} Models)</h3>
            <div style="font-size:12px; color:var(--muted);">Update prices in PKR, specs, power ratings and models</div>
          </div>
          <button class="btn btn-sm btn-pri" style="background:#F15A29; border:none; font-weight:700;" onclick="KhataWebAdmin.addProduct()">
            + Add Inverter Model
          </button>
        </div>

        <div style="display:flex; flex-direction:column; gap:14px;" id="waProductsContainer">
          ${products.map((p, idx) => `
            <div class="card" style="padding:16px; border-left:4px solid #F15A29; margin-bottom:0;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <strong style="color:#F15A29; font-size:15px; font-family:monospace;">${U.esc(p.model)}</strong>
                  <span style="font-size:11px; background:#FFF1EB; color:#F15A29; padding:2px 8px; border-radius:12px; font-weight:700;">#${idx + 1}</span>
                </div>
                <button class="btn btn-sm btn-danger" onclick="KhataWebAdmin.deleteProduct(${idx})">
                  Delete Model
                </button>
              </div>

              <div class="grid2">
                <div class="field"><label>Model Code</label><input class="wa-prod-model" data-idx="${idx}" value="${U.esc(p.model || '')}"></div>
                <div class="field"><label>Product Name</label><input class="wa-prod-name" data-idx="${idx}" value="${U.esc(p.name || '')}"></div>
              </div>

              <div class="grid2">
                <div class="field"><label>Estimated Price in PKR</label><input class="wa-prod-price" data-idx="${idx}" value="${U.esc(p.pricePKR || 'â‚¨ 350,000')}"></div>
                <div class="field"><label>Power Range</label><input class="wa-prod-power" data-idx="${idx}" value="${U.esc(p.powerRange || '')}"></div>
              </div>

              <div class="grid2">
                <div class="field"><label>Peak Efficiency</label><input class="wa-prod-eff" data-idx="${idx}" value="${U.esc(p.efficiency || '')}"></div>
                <div class="field"><label>MPPT Trackers</label><input class="wa-prod-mppt" data-idx="${idx}" value="${U.esc(p.mpptCount || '')}"></div>
              </div>

              <div class="field"><label>Category</label>
                <select class="wa-prod-cat" data-idx="${idx}">
                  <option value="Single Phase PV Inverter" ${p.category === 'Single Phase PV Inverter' ? 'selected' : ''}>Single Phase PV Inverter</option>
                  <option value="Three Phase PV Inverter" ${p.category === 'Three Phase PV Inverter' ? 'selected' : ''}>Three Phase PV Inverter</option>
                  <option value="Energy Storage Inverter" ${p.category === 'Energy Storage Inverter' ? 'selected' : ''}>Energy Storage Inverter (Hybrid)</option>
                  <option value="Utility Scale PV Inverter" ${p.category === 'Utility Scale PV Inverter' ? 'selected' : ''}>Utility Scale PV Inverter</option>
                  <option value="Accessories" ${p.category === 'Accessories' ? 'selected' : ''}>Accessories</option>
                </select>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top:16px;">
          <button class="btn btn-pri btn-block" style="background:#F15A29; border:none; padding:12px; font-weight:700;" onclick="KhataWebAdmin.saveAndSyncWebsite()">
            ðŸ’¾ Save &amp; Publish Inverter Catalog
          </button>
        </div>
      </div>

      <!-- Subtab 3: Hero Carousel Slides -->
      <div id="sec-slides" class="wa-subtab-pane" style="${activeSub === 'sec-slides' ? 'display:block;' : 'display:none;'}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div>
            <h3 style="font-size:16px; font-weight:700; color:var(--text);">Hero Carousel Slides (${slides.length})</h3>
            <div style="font-size:12px; color:var(--muted);">Control main homepage banner headlines, subtext and background visuals</div>
          </div>
          <button class="btn btn-sm btn-pri" style="background:#F15A29; border:none; font-weight:700;" onclick="KhataWebAdmin.addSlide()">
            + Add New Slide
          </button>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;" id="waSlidesContainer">
          ${slides.map((s, idx) => `
            <div class="card" style="padding:16px; border-left:4px solid #2563EB; margin-bottom:0;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong>Slide #${idx + 1} (${U.esc(s.badge || 'Slide')})</strong>
                <button class="btn btn-sm btn-danger" onclick="KhataWebAdmin.deleteSlide(${idx})">Delete</button>
              </div>
              <div class="field"><label>Badge Tag</label><input class="wa-slide-badge" data-idx="${idx}" value="${U.esc(s.badge || '')}"></div>
              <div class="field"><label>Slide Headline</label><input class="wa-slide-title" data-idx="${idx}" value="${U.esc(s.title || '')}"></div>
              <div class="field"><label>Subtitle</label><textarea class="wa-slide-sub" data-idx="${idx}" style="min-height:50px;">${U.esc(s.subtitle || '')}</textarea></div>
              <div class="field"><label>Background Image URL</label><input class="wa-slide-img" data-idx="${idx}" value="${U.esc(s.imageUrl || '')}"></div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top:16px;">
          <button class="btn btn-pri btn-block" style="background:#F15A29; border:none; padding:12px; font-weight:700;" onclick="KhataWebAdmin.saveAndSyncWebsite()">
            ðŸ’¾ Save &amp; Publish Slides
          </button>
        </div>
      </div>

      <!-- Subtab 4: Website Estimate Orders & Leads -->
      <div id="sec-orders" class="wa-subtab-pane" style="${activeSub === 'sec-orders' ? 'display:block;' : 'display:none;'}">
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:14px;">
          <div class="card" style="padding:12px; text-align:center; margin-bottom:0;">
            <div style="font-size:22px; font-weight:800; color:#F15A29;">${pendingCount}</div>
            <div style="font-size:11px; color:var(--muted); font-weight:600; text-transform:uppercase;">Pending Orders</div>
          </div>
          <div class="card" style="padding:12px; text-align:center; margin-bottom:0;">
            <div style="font-size:22px; font-weight:800; color:#2563EB;">${inProgressCount}</div>
            <div style="font-size:11px; color:var(--muted); font-weight:600; text-transform:uppercase;">In Discussion</div>
          </div>
          <div class="card" style="padding:12px; text-align:center; margin-bottom:0;">
            <div style="font-size:22px; font-weight:800; color:#10B981;">${invoicedCount}</div>
            <div style="font-size:11px; color:var(--muted); font-weight:600; text-transform:uppercase;">Invoiced / Done</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
          <h3 style="font-size:16px; font-weight:700; color:var(--text);">Online Customer Orders (${orders.length})</h3>
          <div style="display:flex; gap:4px; overflow-x:auto;">
            ${['all', 'Pending', 'Contacted', 'In Progress', 'Invoiced in Khata'].map(f => `
              <button class="btn btn-sm ${KhataWebAdmin.activeFilter === f ? 'btn-pri' : 'btn-outline'}" style="font-size:11px; padding:3px 9px;" onclick="KhataWebAdmin.setOrderFilter('${f}')">
                ${f === 'all' ? 'All' : f}
              </button>
            `).join('')}
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px;">
          ${orders.length === 0 ? `
            <div class="card" style="padding:32px; text-align:center; color:var(--muted);">
              <div style="font-size:36px; margin-bottom:8px;">ðŸ“¦</div>
              <div style="font-weight:700; font-size:15px; margin-bottom:4px;">No customer estimate orders yet</div>
              <div style="font-size:13px;">When customers submit an estimate on your website, their orders and phone numbers appear here live.</div>
            </div>
          ` : (KhataWebAdmin.activeFilter === 'all' ? orders : orders.filter(o => (o.status || 'Pending').toLowerCase() === KhataWebAdmin.activeFilter.toLowerCase())).map(o => KhataWebAdmin.renderOrderCard(o)).join('')}
        </div>
      </div>

      <!-- Complete configuration for every public website content section -->
      <div id="sec-content" class="wa-subtab-pane" style="${activeSub === 'sec-content' ? 'display:block;' : 'display:none;'}">
        <div class="card wa-content-card">
          <div class="card-title">Edit your website without code</div>
          <p class="muted small">Use the buttons below to update the information customers see. Each section has its own simple form and save button.</p>
          <div class="grid2" style="margin-top:14px">
            <button class="btn" onclick="SettingsPage.switchSubtab('sec-company')">Company name, logo &amp; contact details</button>
            <button class="btn" onclick="SettingsPage.switchSubtab('sec-order-builder')">Order systems &amp; customer questions</button>
            <button class="btn" onclick="SettingsPage.switchSubtab('sec-products')">Products &amp; prices</button>
            <button class="btn" onclick="SettingsPage.switchSubtab('sec-slides')">Homepage banners</button>
          </div>
        </div>
      </div>
    `;
  },

  /* ========================================================
     SHOP & KHATA PREFERENCES SECTION
     ======================================================== */
  async renderShopSection() {
    const s = App.s;
    const u = Auth.user;
    const accounts = await Auth.users();
    const canManageAccounts = await Auth.isAdmin(u);
    const connected = Backup.driveValid();
    const lastBk = s.lastBackupAt ? U.fmtDateTime(s.lastBackupAt) : 'never';
    const curOpts = [['\u20A8', 'PKR (\u20A8)'], ['\u20B9', 'INR (\u20B9)'], ['$', 'USD ($)'], ['\u20AC', 'EUR (\u20AC)'], ['\u00A3', 'GBP (\u00A3)'], ['AED', 'AED']];

    return '' +
      '<div class="section-label">Shop profile</div>' +
      '<div class="card">' +
      '<div class="field"><label>Shop name</label><input id="st_shop" value="' + U.esc(s.shopName) + '"></div>' +
      '<div class="field-row">' +
      '<div class="field"><label>Phone</label><input id="st_phone" value="' + U.esc(s.shopPhone || '') + '"></div>' +
      '<div class="field"><label>Currency</label><select id="st_cur">' +
      curOpts.map(c => '<option value="' + c[0] + '" ' + (s.currency === c[0] ? 'selected' : '') + '>' + c[1] + '</option>').join('') +
      '</select></div></div>' +
      '<div class="field"><label>Address</label><input id="st_addr" value="' + U.esc(s.shopAddress || '') + '"></div>' +
      '<div class="field"><label>Invoice footer</label><input value="' + U.esc(s.invoiceFooter || '') + '" placeholder="Thank you for your business" onchange="App.s.invoiceFooter=this.value;App.saveSettings()"></div>' +
      '<div class="field"><label>Language / direction</label><select onchange="App.setLanguage(this.value)"><option value="en" ' + (s.language !== 'ur' ? 'selected' : '') + '>English &middot; LTR</option><option value="ur" ' + (s.language === 'ur' ? 'selected' : '') + '>&#1575;&#1585;&#1583;&#1608; &middot; RTL</option></select></div>' +
      '<button class="btn btn-pri btn-block" onclick="SettingsPage.saveProfile()">' + UI.icon('save', 16) + ' Save profile</button>' +
      '</div>' +

      '<div class="section-label">Khata & inventory preferences</div>' +
      '<div class="card">' +
      '<div class="srow"><div class="s-main"><div class="s-t">Auto-adjust advance</div><div class="s-d">New bills automatically use customer advance</div></div>' +
      '<label class="switch"><input type="checkbox" ' + (s.autoAdvance ? 'checked' : '') + ' onchange="App.s.autoAdvance=this.checked;App.saveSettings();UI.toast(\'Saved\',\'ok\')"><span class="track"></span></label></div>' +
      '<div class="srow"><div class="s-main"><div class="s-t">Default low-stock alarm</div><div class="s-d">Used for new items (editable per item)</div></div>' +
      '<input class="input" style="width:70px;text-align:center" inputmode="decimal" value="' + s.lowStockDefault + '" onchange="App.s.lowStockDefault=U.num(this.value)||0;App.saveSettings();UI.toast(\'Saved\',\'ok\')"></div>' +
      '<div class="field-row"><div class="field"><label>Invoice number prefix</label><input value="' + U.esc(s.invoicePrefix || 'INV-') + '" onchange="App.s.invoicePrefix=this.value.trim()||\'INV-\';App.saveSettings()"></div><div class="field"><label>Default credit days</label><input type="number" min="0" value="' + U.num(s.defaultCreditDays) + '" onchange="App.s.defaultCreditDays=Math.max(0,U.num(this.value));App.saveSettings()"></div></div>' +
      '<div class="field-row"><div class="field"><label>Negative stock</label><select onchange="App.s.negativeStockMode=this.value;App.saveSettings()"><option value="warn" ' + (s.negativeStockMode !== 'block' ? 'selected' : '') + '>Warn and allow</option><option value="block" ' + (s.negativeStockMode === 'block' ? 'selected' : '') + '>Block sale</option></select></div><div class="field"><label>Reminder gap (days)</label><input type="number" min="0" value="' + U.num(s.minReminderGapDays) + '" onchange="App.s.minReminderGapDays=Math.max(0,U.num(this.value));App.saveSettings()"></div></div>' +
      '<div class="srow"><div class="s-main"><div class="s-t">Stock alarm notifications</div><div class="s-d">System notification when items go low</div></div>' +
      '<label class="switch"><input type="checkbox" ' + (s.notify ? 'checked' : '') + ' onchange="SettingsPage.toggleNotify(this.checked)"><span class="track"></span></label></div>' +
      '<div class="srow"><div class="s-main"><div class="s-t">Auto-lock</div><div class="s-d">Lock app after inactivity</div></div>' +
      '<select class="input" style="width:96px" onchange="App.s.autoLockMin=U.num(this.value);App.saveSettings();UI.toast(\'Saved\',\'ok\')">' +
      [[0, 'Off'], [2, '2 min'], [5, '5 min'], [15, '15 min']].map(o => '<option value="' + o[0] + '" ' + (s.autoLockMin === o[0] ? 'selected' : '') + '>' + o[1] + '</option>').join('') + '</select></div>' +
      '</div>' +

      (canManageAccounts ? '<div class="section-label">Sub-admin accounts</div><div class="card">' +
        '<div class="hint" style="margin-bottom:12px">Create a login for a trusted team member. Set their password here and share the generated ID and password with them. They can change the password after logging in.</div>' +
        (this.lastCreatedAccountId ? '<div class="alert-card" style="margin-bottom:12px"><b>Share these new login details now</b><br>ID: <code>' + U.esc(this.lastCreatedAccountId) + '</code><br>Password: <code>' + U.esc(this.lastCreatedAccountPassword) + '</code><div class="mt6"><button class="btn btn-sm" onclick="SettingsPage.copySubAdminCredentials()">Copy login details</button> <button class="btn btn-sm" onclick="SettingsPage.hideSubAdminCredentials()">Hide</button></div></div>' : '') +
        '<div class="field-row"><div class="field"><label>Sub-admin username</label><input id="subadmin_username" placeholder="e.g. shopstaff"></div><div class="field"><label>Temporary password</label><input id="subadmin_password" type="password" autocomplete="new-password" placeholder="Set a password"></div></div>' +
        '<button class="btn btn-pri btn-block" onclick="SettingsPage.createSubAdmin()">Create sub-admin account</button>' +
        '<div class="divider"></div><div class="bold small mb8">Accounts on this device</div>' +
        accounts.map(account => '<div class="srow"><span class="s-ic i-blue">' + UI.icon('users', 16) + '</span><div class="s-main"><div class="s-t">' + U.esc(account.username) + (account.id === u.id ? ' (you)' : '') + '</div><div class="s-d">' + (account.role === 'admin' ? 'Administrator' : 'Sub-admin') + ' ? ID: ' + U.esc(account.id) + '</div></div></div>').join('') +
        '</div>' : '') +

      '<div class="section-label">Security â€” smart login</div>' +
      '<div class="card">' +
      (Auth.googleReady() && location.protocol !== 'file:' ? '<div class="srow" onclick="Auth.googleLogin()"><span class="s-ic i-blue">' + Auth.gLogo() + '</span><div class="s-main"><div class="s-t">Sign in with Google</div><div class="s-d">' + (Auth.user.googleEmail ? 'Signed in as ' + U.esc(Auth.user.googleEmail) : 'Link this Gmail â€” auto backup & sync') + '</div></div>' + UI.icon('chevR', 16) + '</div>' : '') +
      '<div class="srow" onclick="SettingsPage.changePass()"><span class="s-ic i-pri">' + UI.icon('key', 17) + '</span><div class="s-main"><div class="s-t">Change password</div><div class="s-d">Signed in as ' + U.esc(u.username) + (u.googleEmail ? ' (Google)' : '') + '</div></div>' + UI.icon('chevR', 16) + '</div>' +
      '<div class="srow" onclick="SettingsPage.setPin()"><span class="s-ic i-green">' + UI.icon('lock', 17) + '</span><div class="s-main"><div class="s-t">' + (u.pinHash ? 'Change / remove PIN' : 'Set quick PIN') + '</div><div class="s-d">' + (u.pinHash ? 'PIN unlock is on' : '4â€“6 digit fast unlock') + '</div></div>' + UI.icon('chevR', 16) + '</div>' +
      (Auth.bioCapable() && location.protocol !== 'file:' ?
        '<div class="srow" onclick="Auth.enrollBio()"><span class="s-ic i-amber">' + UI.icon('finger', 17) + '</span><div class="s-main"><div class="s-t">Fingerprint quick unlock</div><div class="s-d">' + (Auth.bioEnrolled() ? 'Enrolled âœ“ â€” tap to re-enroll' : 'Use device biometrics') + '</div></div>' + UI.icon('chevR', 16) + '</div>' : '') +
      '<div class="srow" onclick="App.lock()"><span class="s-ic i-red">' + UI.icon('lock', 17) + '</span><div class="s-main"><div class="s-t">Lock now</div><div class="s-d">Require unlock on next open</div></div>' + UI.icon('chevR', 16) + '</div>' +
      '<div class="srow" onclick="Auth.logout()"><span class="s-ic i-red">' + UI.icon('logout', 17) + '</span><div class="s-main"><div class="s-t">Log out</div><div class="s-d">Data stays on device</div></div>' + UI.icon('chevR', 16) + '</div>' +
      '</div>' +

      '<div class="section-label">Migrate from another app</div>' +
      '<div class="card">' +
      '<div class="srow" onclick="App.nav(\'import\')"><span class="s-ic i-pri">' + UI.icon('upload', 17) + '</span>' +
      '<div class="s-main"><div class="s-t">Import customers & inventory</div>' +
      '<div class="s-d">From Digi Khata, Udhaar Book etc â€” CSV, Excel, PDF or paste</div></div>' + UI.icon('chevR', 16) + '</div>' +
      '</div>' +

      '<div class="section-label">Backup & global sync</div>' +
      '<div class="card">' +
      '<div class="row-between tiny muted" style="margin-bottom:10px">' + UI.icon('cloud', 14) + ' Last backup: <b>' + lastBk + '</b></div>' +
      '<div class="grid2">' +
      '<button class="btn btn-sm" onclick="Backup.exportNow()">' + UI.icon('download', 15) + ' Export file</button>' +
      '<button class="btn btn-sm" onclick="Backup.pickFile()">' + UI.icon('upload', 15) + ' Import file</button>' +
      '</div>' +
      '<div class="divider"></div>' +
      '<div class="card-title" style="margin-bottom:8px">' + UI.icon('sync', 15) + ' Google Drive sync</div>' +
      (connected
        ? '<div class="row-between" style="background:var(--greenSoft);border-radius:10px;padding:9px 12px;margin-bottom:10px"><span class="small bold green">' + UI.icon('check', 14) + ' Connected</span>' +
          '<button class="btn btn-sm" onclick="Backup.driveDisconnect()">Disconnect</button></div>'
        : '<div class="field"><label>Google OAuth Client ID</label><input id="gd_cid" value="' + U.esc(s.driveClient || '') + '" placeholder="xxxxxxxx.apps.googleusercontent.com">' +
          '<div class="hint">One-time setup â€” see README. Then tap Connect.</div></div>') +
      '<div class="grid2">' +
      (connected
        ? '<button class="btn btn-sm btn-pri" onclick="Backup.driveBackup(false)">' + UI.icon('cloud', 15) + ' Backup to Drive</button>' +
          '<button class="btn btn-sm" onclick="Backup.driveList()">' + UI.icon('download', 15) + ' Restore from Drive</button>'
        : '<button class="btn btn-sm btn-pri" onclick="Backup.connect()">' + UI.icon('cloud', 15) + ' Connect Google</button>') +
      '</div>' +
      '<div class="srow" style="border-top:1px solid var(--line);margin-top:10px"><div class="s-main"><div class="s-t">Daily auto-backup</div><div class="s-d">Silently backs up to Drive every 24h</div></div>' +
      '<label class="switch"><input type="checkbox" ' + (s.driveAuto ? 'checked' : '') + ' onchange="App.s.driveAuto=this.checked;App.saveSettings();UI.toast(this.checked?\'Auto-backup on\':\'Auto-backup off\',\'ok\')"><span class="track"></span></label></div>' +
      '<div class="hint">Sync across devices: back up here â†’ on the other phone use â€œRestore from Drive â†’ Mergeâ€. Newest change wins.</div>' +
      '</div>' +

      '<div class="section-label">Audit & data integrity</div><div class="card"><div class="grid2">' +
      '<button class="btn btn-sm" onclick="SettingsPage.auditViewer()">' + UI.icon('clipboard', 15) + ' Audit history</button>' +
      '<button class="btn btn-sm" onclick="SettingsPage.integrityCheck()">' + UI.icon('shield', 15) + ' Integrity check</button>' +
      '</div><div class="hint mt6">Recomputes invoice totals and stock quantities from saved entries and movements.</div></div>' +
      (App.installEvt ? '<div class="section-label">Install</div><div class="card"><button class="btn btn-pri btn-block" onclick="SettingsPage.install()">' + UI.icon('install', 17) + ' Install as app</button><div class="hint" style="text-align:center;margin-top:8px">Works offline, opens like a native app</div></div>' : '') +

      '<div class="section-label">Danger zone</div>' +
      '<div class="card">' +
      '<button class="btn btn-danger btn-block" onclick="SettingsPage.resetAll()">' + UI.icon('trash', 16) + ' Erase all data & restart</button>' +
      '<div class="hint" style="text-align:center;margin-top:8px">Deletes khatas, inventory, invoices and the login from this device. Export a backup first!</div>' +
      '</div>' +

      '<div class="tiny muted" style="text-align:center;padding:6px 0 14px">Easy Khata v1.1 â€¢ offline-first PWA<br>' + UI.icon('zap', 12) + ' made for solar & inverter businesses<div class="app-powered"><span>Powered by</span><img src="images/ineha-tech.png" alt="Ineha Tech"></div></div>';
  },

  bind() {},

  async auditViewer() {
    const records = (await DB.all('audit_log')).sort((a, b) => (b.at || '').localeCompare(a.at || '')).slice(0, 100);
      const html = records.length ? '<div class="list">' + records.map(entry =>
        '<div class="lrow"><div class="l-main"><div class="l-title">' + U.esc(entry.action) + ' Â· ' + U.esc(entry.store) + '</div>' +
        '<div class="l-sub">Record ' + U.esc(entry.recordId) + ' Â· ' + U.fmtDateTime(entry.at) + (entry.actorId ? ' Â· by ' + U.esc(entry.actorId) : '') + '</div>' +
        ((entry.oldValue || entry.newValue) ? '<details class="mt6"><summary class="hint">View changed values</summary><pre class="audit-json">' + U.esc(JSON.stringify({ before: entry.oldValue, after: entry.newValue }, null, 2)) + '</pre></details>' : '') +
        '</div></div>'
      ).join('') + '</div>' : UI.empty('clipboard', 'No audit history yet', 'Saved changes will appear here.');
    UI.sheet({ title: 'Audit history (latest 100)', body: html });
  },

  async integrityMismatches() {
    const [items, moves, invoices, entries] = await Promise.all([
      DB.all('items'), DB.all('moves'), DB.all('invoices'), DB.all('entries')
    ]);
    const mismatches = [];
    items.forEach(item => {
      const state = Stock.calculateState(moves.filter(move => move.itemId === item.id), item);
      if (Math.abs(U.num(item.qty) - state.qty) > 0.0001 || Math.abs(U.num(item.avgCost != null ? item.avgCost : item.costPrice) - state.avgCost) > 0.01) {
        mismatches.push({ type: 'stock', id: item.id, name: item.name, detail: 'Saved ' + U.fmtQty(item.qty) + ' Â· calculated ' + U.fmtQty(state.qty) + ' ' + (item.unit || 'pcs') });
      }
    });
    invoices.forEach(invoice => {
      const linked = entries.filter(entry => entry.invoiceId === invoice.id);
      if (Math.abs(U.num(invoice.paid) - U.sumType(linked, ['payment'])) > 0.01 ||
          Math.abs(U.num(invoice.advanceApplied) - U.sumType(linked, ['advance_apply'])) > 0.01 ||
          Math.abs(U.num(invoice.returned) - U.sumType(linked, ['return'])) > 0.01) {
        mismatches.push({ type: 'invoice', id: invoice.id, name: invoice.no, detail: 'Paid, advance, or return totals differ from linked entries' });
      }
    });
    return mismatches;
  },

  async integrityCheck() {
    const mismatches = await SettingsPage.integrityMismatches();
    const html = mismatches.length
      ? '<div class="alert-card"><b>' + mismatches.length + ' mismatch(es) found</b></div><div class="list">' + mismatches.map(item =>
        '<div class="lrow"><div class="l-main"><div class="l-title">' + U.esc(item.name) + ' Â· ' + U.esc(item.type) + '</div><div class="l-sub">' + U.esc(item.detail) + '</div></div></div>'
      ).join('') + '</div><button class="btn btn-pri btn-block mt10" onclick="SettingsPage.repairIntegrity()">Recompute from source records</button>'
      : '<div class="card"><div class="bold green">No mismatches found</div><div class="hint">Stock quantities and invoice totals agree with their source records.</div></div>';
    UI.sheet({ title: 'Data integrity check', body: html });
  },

  async repairIntegrity() {
    const ok = await UI.confirm({ title: 'Repair calculated totals?', message: 'Recompute item quantities, weighted costs, and invoice payment totals from saved movements and entries. Source records remain available and each repaired record is audited.', ok: 'Repair' });
    if (!ok) return;
    const [items, moves, invoices, entries] = await Promise.all([
      DB.all('items'), DB.all('moves'), DB.all('invoices'), DB.all('entries')
    ]);
    const ops = [];
    items.forEach(item => {
      const state = Stock.calculateState(moves.filter(move => move.itemId === item.id), item);
      item.qty = state.qty; item.avgCost = state.avgCost;
      ops.push({ store: 'items', record: item });
    });
    invoices.forEach(invoice => {
      const linked = entries.filter(entry => entry.invoiceId === invoice.id);
      invoice.paid = U.sumType(linked, ['payment']);
      invoice.advanceApplied = U.sumType(linked, ['advance_apply']);
      invoice.returned = U.sumType(linked, ['return']);
      ops.push({ store: 'invoices', record: invoice });
    });
    if (ops.length) await DB.batch(ops);
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    UI.toast('Integrity repair completed', 'ok');
    SettingsPage.integrityCheck();
  },

  async resetWebsiteContent() {
    KhataWebAdmin.webData = null;
    await KhataWebAdmin.fetchWebData();
    this.activeSubtab = 'sec-content';
    await App.rerender();
  },

  switchMainTab(tab) {
    this.activeTab = tab;
    App.nav(`settings?tab=${tab}`);
  },

  switchSubtab(subtab) {
    this.activeSubtab = subtab;
    document.querySelectorAll('.wa-subtab-pane').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.wa-subtab-btn').forEach(el => {
      el.style.background = 'var(--card)';
      el.style.color = 'var(--text)';
      el.style.borderColor = 'var(--line)';
    });
    const target = document.getElementById(subtab);
    if (target) target.style.display = 'block';
    const activeBtn = document.querySelector(`.wa-subtab-btn[data-target="${subtab}"]`);
    if (activeBtn) {
      activeBtn.style.background = 'var(--app-brand, #F15A29)';
      activeBtn.style.color = '#fff';
      activeBtn.style.borderColor = 'var(--app-brand, #F15A29)';
    }
  },

  async createSubAdmin() {
    if (!(await Auth.isAdmin())) return UI.toast('Only an administrator can create sub-admin accounts', 'err');
    const username = (U.q('#subadmin_username')?.value || '').trim().toLowerCase();
    const password = U.q('#subadmin_password')?.value || '';
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) return UI.toast('Use a username with 3â€“30 letters, numbers, dots, dashes or underscores', 'err');
    if (password.length < 8) return UI.toast('Set a password with at least 8 characters', 'err');
    const existing = await Auth.users();
    if (existing.some(account => account.username.toLowerCase() === username)) return UI.toast('That username is already in use', 'err');
    const id = 'EK-' + U.uid().toUpperCase();
    const salt = U.uid();
    const account = { id, username, role: 'subadmin', salt, hash: await Auth.sha(password, salt), createdAt: U.nowISO(), createdBy: Auth.user.id };
    try { await DB.put('users', account); }
    catch (error) { return UI.toast('Could not create account: ' + (error.message || error), 'err'); }
    this.lastCreatedAccountId = id;
    this.lastCreatedAccountPassword = password;
    await App.saveSettings();
    UI.toast('Sub-admin account created. Share the ID and password securely.', 'ok');
    await App.rerender();
  },

  async copySubAdminId() {
    try {
      await navigator.clipboard.writeText(this.lastCreatedAccountId);
      UI.toast('Account ID copied', 'ok');
    } catch (error) { UI.toast('Account ID: ' + this.lastCreatedAccountId); }
  },

  async copySubAdminCredentials() {
    const credentials = 'ID: ' + this.lastCreatedAccountId + '\nPassword: ' + this.lastCreatedAccountPassword;
    try { await navigator.clipboard.writeText(credentials); UI.toast('Login details copied', 'ok'); }
    catch (error) { UI.toast('Copy is unavailable on this device', 'err'); }
  },

  async hideSubAdminCredentials() {
    this.lastCreatedAccountId = '';
    this.lastCreatedAccountPassword = '';
    await App.rerender();
  },

  async saveOrderBuilder() {
    const d = KhataWebAdmin.webData || {};
    const lines = (document.getElementById('wa_order_systems')?.value || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    const systems = lines.map(line => {
      const [size, description, minPrice, maxPrice] = line.split('|');
      return { size: (size || '').trim(), description: (description || '').trim(), minPrice: Math.max(0, U.num(minPrice)), maxPrice: Math.max(0, U.num(maxPrice)) };
    }).filter(x => x.size);
    if (!systems.length) return UI.toast('Add at least one system size before saving', 'err');
    const modules = {};
    ['inverter', 'battery', 'monthlyBill'].forEach(key => { modules[key] = !!document.getElementById('wa_order_module_' + key)?.checked; });
    const customModules = (document.getElementById('wa_order_custom')?.value || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean).map(line => {
      const [label, ...options] = line.split('|');
      return { label: label.trim(), options: (options.join('|') || '').split(',').map(x => x.trim()).filter(Boolean) };
    }).filter(x => x.label);
    const pricedItems = (document.getElementById('wa_order_priced_items')?.value || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean).map((line, index) => {
      const [label, price] = line.split('|');
      return { id: 'order-item-' + index, label: (label || '').trim(), price: Math.max(0, U.num(price)), active: true };
    }).filter(item => item.label);
    const minPerKw = Math.max(0, U.num(document.getElementById('wa_order_custom_min_rate')?.value) || 145000);
    const maxPerKw = Math.max(minPerKw, U.num(document.getElementById('wa_order_custom_max_rate')?.value) || minPerKw);
    d.orderSettings = { systems, modules, customModules, pricedItems, customRates: { minPerKw, maxPerKw } };
    KhataWebAdmin.webData = d;
    localStorage.setItem('solis_inverters_data', JSON.stringify(d));
    const response = await fetch('/api/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).catch(() => null);
    if (response && response.ok) {
      UI.toast('Order form saved and published', 'ok');
      await App.rerender();
    }
    else UI.toast('Order form saved on this device; website publishing is unavailable', 'err');
  },

  async saveProfile() {
    App.s.shopName = U.q('#st_shop').value.trim() || 'My Shop';
    App.s.shopPhone = U.q('#st_phone').value.trim();
    App.s.currency = U.q('#st_cur').value;
    App.s.shopAddress = U.q('#st_addr').value.trim();
    await App.saveSettings();
    UI.toast('Profile saved', 'ok');
  },

  changePass() {
    UI.sheet({
      title: 'Change password',
      body:
      '<div class="field"><label>Current password</label><input id="cp_old" type="password"></div>' +
      '<div class="field"><label>New password</label><input id="cp_new" type="password"></div>' +
      '<div class="field"><label>Confirm new password</label><input id="cp_new2" type="password"></div>' +
      '<button class="btn btn-pri btn-block" onclick="SettingsPage.doChangePass()">' + UI.icon('check', 17) + ' Update password</button>'
    });
  },

  async doChangePass() {
    const oldP = U.q('#cp_old').value, n1 = U.q('#cp_new').value, n2 = U.q('#cp_new2').value;
    if (n1.length < 4) return UI.toast('New password too short', 'err');
    if (n1 !== n2) return UI.toast('New passwords do not match', 'err');
    const ok = await Auth.changePassword(oldP, n1);
    if (!ok) return UI.toast('Current password is wrong', 'err');
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    UI.toast('Password updated', 'ok');
  },

  setPin() {
    UI.sheet({
      title: Auth.user.pinHash ? 'Change / remove PIN' : 'Set quick PIN',
      body:
      '<div class="field"><label>New PIN (4â€“6 digits, blank to remove)</label><input id="pn_new" inputmode="numeric" maxlength="6"></div>' +
      '<div class="field"><label>Confirm with password</label><input id="pn_pass" type="password" placeholder="your login password"></div>' +
      '<button class="btn btn-pri btn-block" onclick="SettingsPage.doSetPin()">' + UI.icon('check', 17) + ' Save PIN</button>'
    });
  },

  async doSetPin() {
    const pin = U.q('#pn_new').value.replace(/\D/g, '');
    const pass = U.q('#pn_pass').value;
    const h = await Auth.sha(pass, Auth.user.salt);
    if (h !== Auth.user.hash) return UI.toast('Password is wrong', 'err');
    if (pin && (pin.length < 4)) return UI.toast('PIN must be 4â€“6 digits', 'err');
    await Auth.setPin(pin || null);
    U.q('.sheet-overlay') && U.q('.sheet-overlay').remove();
    UI.toast(pin ? 'PIN saved' : 'PIN removed', 'ok');
    App.rerender();
  },

  async toggleNotify(on) {
    App.s.notify = on;
    await App.saveSettings();
    if (on && 'Notification' in window && Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch (e) {}
    }
    App.maybeNotify(true);
  },

  async install() {
    if (!App.installEvt) return;
    App.installEvt.prompt();
    const r = await App.installEvt.userChoice;
    if (r && r.outcome === 'accepted') { UI.toast('Installingâ€¦', 'ok'); App.installEvt = null; App.rerender(); }
  },

  async resetAll() {
    const ok = await UI.confirm({
      title: 'Erase everything?',
      message: 'All khatas, customers, inventory, invoices, expenses and your login will be permanently deleted from this device. This cannot be undone.',
      ok: 'Erase all data'
    });
    if (!ok) return;
    const ok2 = await UI.confirm({ title: 'Really sure?', message: 'Have you exported a backup? This is the last warning.', ok: 'Yes, erase forever' });
    if (!ok2) return;
    for (const s of ['settings', 'users', 'items', 'moves', 'customers', 'entries', 'invoices']) await DB.clear(s);
    localStorage.clear();
    indexedDB.deleteDatabase(DB.name);
    UI.toast('All data erased', 'ok');
    setTimeout(() => location.reload(), 600);
  }
};

/**
 * Solis Inverters Pakistan (Karachi) — Admin Panel & Dynamic Content Manager
 * Provides full control over hero slides, products, PKR specs, Karachi contacts,
 * and tracks customer estimate orders directly synced with Easy Khata.
 */

class SolisCMS {
  constructor() {
    this.data = null;
    this.orders = [];
    this.isLiveEdit = false;
    this.init();
  }

  async init() {
    await this.loadData();
    await this.loadOrders();
    this.renderAdminDrawer();
    this.bindEvents();
  }

  async loadData() {
    let loaded = null;
    try {
      const res = await fetch('/api/content', { cache: 'no-cache' });
      if (res.ok) {
        loaded = await res.json();
      }
    } catch (e) {}

    if (!loaded) {
      const local = localStorage.getItem('solis_inverters_data');
      if (local) {
        try {
          loaded = JSON.parse(local);
        } catch (e) {}
      }
    }

    if (!loaded && typeof window.DEFAULT_SOLIS_DATA !== 'undefined') {
      loaded = JSON.parse(JSON.stringify(window.DEFAULT_SOLIS_DATA));
    }

    this.data = loaded || {};
    window.SOLIS_DATA = this.data;
  }

  async loadOrders() {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        this.orders = await res.json();
      }
    } catch (e) {}

    if (!this.orders || !this.orders.length) {
      const local = localStorage.getItem('solis_orders');
      if (local) {
        try { this.orders = JSON.parse(local); } catch (e) {}
      }
    }
  }

  async saveData(notify = true) {
    try {
      localStorage.setItem('solis_inverters_data', JSON.stringify(this.data));
    } catch (e) {}

    try {
      await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.data)
      });
    } catch (e) {}

    if (window.solisApp) {
      window.solisApp.renderAll();
    }

    if (notify) {
      this.toast('Changes saved & published successfully!');
    }
  }

  toast(message) {
    let container = document.getElementById('solisToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'solisToastContainer';
      container.className = 'solis-toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'solis-toast';
    toast.innerHTML = `<span>☀️</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.4s ease';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  renderAdminDrawer() {
    let drawer = document.getElementById('adminDrawer');
    if (drawer) drawer.remove();

    const orderCount = (this.orders || []).length;

    drawer = document.createElement('div');
    drawer.id = 'adminDrawer';
    drawer.className = 'admin-drawer';
    drawer.innerHTML = `
      <div class="admin-header">
        <div class="admin-header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F15A29" stroke-width="2"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z"/></svg>
          Solis Pakistan Portal &amp; CMS
        </div>
        <button id="closeAdminDrawerBtn" class="solis-modal-close" style="color:#fff;" aria-label="Close Admin">&times;</button>
      </div>
      <div class="admin-tabs-nav">
        <button class="admin-tab-btn active" data-tab="tab-overview">Overview</button>
        <button class="admin-tab-btn" data-tab="tab-orders">Orders (${orderCount})</button>
        <button class="admin-tab-btn" data-tab="tab-slides">Hero Slides</button>
        <button class="admin-tab-btn" data-tab="tab-products">Inverter Models</button>
        <button class="admin-tab-btn" data-tab="tab-company">Karachi Hub</button>
        <button class="admin-tab-btn" data-tab="tab-subscribers">Subscribers</button>
        <button class="admin-tab-btn" data-tab="tab-backup">Backup &amp; Sync</button>
      </div>
      <div class="admin-body">
        <!-- Overview Tab -->
        <div id="tab-overview" class="admin-tab-content active">
          <div style="background:#FFF1EB; border:1px solid #F15A29; padding:16px; border-radius:8px; margin-bottom:20px;">
            <h4 style="color:#F15A29; margin-bottom:6px; font-weight:700;">Karachi Regional CMS &amp; Khata Hub</h4>
            <p style="font-size:13px; color:#4B5563;">Update website content, Pakistani pricing, and manage incoming solar orders in real time.</p>
          </div>

          <div style="margin-bottom:24px;">
            <button id="toggleLiveEditBtn" class="btn-solis-secondary" style="width:100%; justify-content:center; padding:12px; margin-bottom:12px;">
              <span id="liveEditStatusDot" style="width:10px; height:10px; border-radius:50%; background:#9ca3af; display:inline-block;"></span>
              <span id="liveEditText">Enable Click-to-Edit Mode</span>
            </button>
            <p style="font-size:12px; color:#6B7280; text-align:center;">Clicking this highlights editable texts directly on the live page so you can edit in place.</p>
          </div>

          <h5 style="font-size:14px; font-weight:700; margin-bottom:12px;">Direct Jump to Khata &amp; Portals</h5>
          <div style="display:flex; gap:10px; flex-direction:column; margin-bottom:24px;">
            <a href="/admin" class="btn-solis-primary" style="display:flex; align-items:center; justify-content:space-between; background:#2563EB; border-color:#2563EB;">
              <span>📊 Open Easy Khata Login &amp; Dashboard</span>
              <span>&rarr;</span>
            </a>
            <a href="/khata.html#/orders" class="btn-solis-secondary" style="display:flex; align-items:center; justify-content:space-between;">
              <span>📦 Khata Order Trace &amp; Billing</span>
              <span style="color:#F15A29;">&rarr;</span>
            </a>
            <a href="https://www.soliscloud.com" target="_blank" rel="noopener" class="btn-solis-secondary" style="display:flex; align-items:center; justify-content:space-between;">
              <span>☁️ SolisCloud Monitoring Portal</span>
              <span style="color:#F15A29;">&rarr;</span>
            </a>
          </div>

          <h5 style="font-size:14px; font-weight:700; margin-bottom:12px;">Website Statistics</h5>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div style="background:#F8F9FA; padding:12px; border-radius:6px; text-align:center; border:1px solid #E5E7EB;">
              <div style="font-size:24px; font-weight:800; color:#F15A29;">${(this.data.featuredProducts || []).length}</div>
              <div style="font-size:12px; color:#6B7280;">Inverter Models</div>
            </div>
            <div style="background:#F8F9FA; padding:12px; border-radius:6px; text-align:center; border:1px solid #E5E7EB;">
              <div style="font-size:24px; font-weight:800; color:#10B981;">${orderCount}</div>
              <div style="font-size:12px; color:#6B7280;">Website Orders</div>
            </div>
          </div>
        </div>

        <!-- Orders Tab -->
        <div id="tab-orders" class="admin-tab-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h4 style="font-size:15px; font-weight:700;">Customer Estimate Orders</h4>
            <a href="/khata.html#/orders" class="btn-solis-secondary" style="padding:4px 10px; font-size:11px;">Open in Khata &rarr;</a>
          </div>
          <div id="adminOrdersList" style="display:flex; flex-direction:column; gap:12px; max-height:480px; overflow-y:auto;"></div>
        </div>

        <!-- Hero Slides Tab -->
        <div id="tab-slides" class="admin-tab-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h4 style="font-size:15px; font-weight:700;">Carousel Slides</h4>
            <button id="addSlideBtn" class="btn-solis-primary" style="padding:6px 14px; font-size:12px;">+ Add Slide</button>
          </div>
          <div id="adminSlidesList" style="display:flex; flex-direction:column; gap:14px;"></div>
        </div>

        <!-- Inverter Models Tab -->
        <div id="tab-products" class="admin-tab-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h4 style="font-size:15px; font-weight:700;">Inverter Catalog &amp; PKR Pricing</h4>
            <button id="addProductBtn" class="btn-solis-primary" style="padding:6px 14px; font-size:12px;">+ Add Model</button>
          </div>
          <div id="adminProductsList" style="display:flex; flex-direction:column; gap:14px;"></div>
        </div>

        <!-- Company & Stats Tab -->
        <div id="tab-company" class="admin-tab-content">
          <h4 style="font-size:15px; font-weight:700; margin-bottom:16px;">Karachi Hub &amp; Contact</h4>
          <div class="admin-form-group">
            <label class="admin-label">Karachi Landline Hotline</label>
            <input type="text" id="adminHotline" class="admin-input" value="${this.data.company?.hotline || '+92 21 3456 7890'}">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">WhatsApp Number</label>
            <input type="text" id="adminWhatsapp" class="admin-input" value="${this.data.company?.whatsapp || '+92 300 123 4567'}">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Support Email</label>
            <input type="email" id="adminEmail" class="admin-input" value="${this.data.company?.email || 'pakistan@ginlong.com'}">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Brand Slogan</label>
            <input type="text" id="adminSlogan" class="admin-input" value="${this.data.company?.slogan || 'Bankable, Reliable, Local'}">
          </div>
          <div class="admin-form-group">
            <label class="admin-label">Karachi Head Office Address</label>
            <textarea id="adminAddress" class="admin-textarea">${this.data.company?.address || 'Suite 402, 4th Floor, Business Avenue, Main Shahrah-e-Faisal, Karachi 75400, Pakistan'}</textarea>
          </div>
          <button id="saveCompanyBtn" class="btn-solis-primary" style="width:100%;">Save Karachi Details</button>
        </div>

        <!-- Subscribers Tab -->
        <div id="tab-subscribers" class="admin-tab-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h4 style="font-size:15px; font-weight:700;">Newsletter Subscribers</h4>
            <button id="exportSubscribersBtn" class="btn-solis-secondary" style="padding:6px 12px; font-size:12px;">Export CSV</button>
          </div>
          <div id="adminSubscribersList" style="max-height:380px; overflow-y:auto; border:1px solid #E5E7EB; border-radius:6px; background:#fff;"></div>
        </div>

        <!-- Backup & Sync Tab -->
        <div id="tab-backup" class="admin-tab-content">
          <h4 style="font-size:15px; font-weight:700; margin-bottom:12px;">Import / Export / Reset</h4>
          <p style="font-size:13px; color:#4B5563; margin-bottom:16px;">You can download your entire customized configuration or restore the official Solis Pakistan defaults.</p>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <button id="exportJsonBtn" class="btn-solis-secondary" style="justify-content:center;">📥 Export Website JSON</button>
            <label class="btn-solis-secondary" style="justify-content:center; cursor:pointer;">
              📤 Import Website JSON
              <input type="file" id="importJsonInput" accept=".json" style="display:none;">
            </label>
            <button id="resetDefaultsBtn" class="btn-solis-secondary" style="justify-content:center; color:#DC2626; border-color:#FCA5A5;">🔄 Reset to Solis Pakistan Defaults</button>
          </div>
        </div>
      </div>
      <div class="admin-footer">
        <span style="font-size:12px; color:#6B7280;">Solis Pakistan CMS</span>
        <button id="quickSaveBtn" class="btn-solis-primary" style="padding:8px 18px; font-size:13px;">Save &amp; Apply</button>
      </div>
    `;

    document.body.appendChild(drawer);

    // Floating Admin Button
    let floatBtn = document.getElementById('floatingAdminBtn');
    if (!floatBtn) {
      floatBtn = document.createElement('button');
      floatBtn.id = 'floatingAdminBtn';
      floatBtn.className = 'floating-admin-btn';
      floatBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
        Admin Panel
      `;
      floatBtn.addEventListener('click', () => this.openDrawer());
      document.body.appendChild(floatBtn);
    }

    // Live Edit Banner
    let banner = document.getElementById('liveEditBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'liveEditBanner';
      banner.className = 'live-edit-banner';
      banner.innerHTML = `✏️ Live Edit Mode is ACTIVE — Click any text with an orange outline to edit directly. <button id="exitLiveEditBannerBtn" style="background:#fff; color:#F15A29; border:none; padding:2px 8px; border-radius:4px; font-weight:700; margin-left:12px; cursor:pointer;">Exit &amp; Save</button>`;
      document.body.appendChild(banner);
      document.getElementById('exitLiveEditBannerBtn')?.addEventListener('click', () => this.toggleLiveEdit());
    }

    this.renderOrdersTab();
    this.renderSlidesTab();
    this.renderProductsTab();
    this.loadSubscribers();
  }

  renderOrdersTab() {
    const container = document.getElementById('adminOrdersList');
    if (!container) return;
    const orders = this.orders || [];

    if (!orders.length) {
      container.innerHTML = `<div style="padding:24px; text-align:center; color:#9ca3af; font-size:13px;">No estimate orders received yet.</div>`;
      return;
    }

    container.innerHTML = orders.map(o => {
      const cleanPhone = (o.phone || '').replace(/[^0-9]/g, '');
      const wa = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
      return `
        <div style="background:#fff; border:1px solid #E5E7EB; border-radius:8px; padding:12px; font-size:13px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
            <div>
              <strong style="color:#F15A29; font-family:monospace;">${o.id}</strong>
              <span style="font-weight:700; margin-left:6px;">${o.customerName}</span>
            </div>
            <span style="font-size:11px; background:#FFF1EB; color:#F15A29; font-weight:700; padding:2px 6px; border-radius:4px;">${o.status || 'Pending'}</span>
          </div>
          <div style="color:#6b7280; font-size:12px; margin-bottom:8px;">
            📍 ${o.area || o.city || 'Karachi'} • ⚡ ${o.systemSize} (${o.inverterModel})
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#059669; font-weight:800;">${o.estimatedCost || ''}</span>
            <div style="display:flex; gap:6px;">
              <a href="https://wa.me/${wa}" target="_blank" style="background:#25D366; color:#fff; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">WhatsApp</a>
              <a href="/admin" style="background:#2563EB; color:#fff; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">Khata Bill</a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  openDrawer() {
    const drawer = document.getElementById('adminDrawer');
    if (drawer) drawer.classList.add('open');
  }

  closeDrawer() {
    const drawer = document.getElementById('adminDrawer');
    if (drawer) drawer.classList.remove('open');
  }

  toggleLiveEdit() {
    this.isLiveEdit = !this.isLiveEdit;
    const body = document.body;
    const dot = document.getElementById('liveEditStatusDot');
    const text = document.getElementById('liveEditText');

    if (this.isLiveEdit) {
      body.classList.add('live-edit-active');
      if (dot) dot.style.background = '#10B981';
      if (text) text.textContent = 'Disable Click-to-Edit Mode';
      this.closeDrawer();
      this.toast('Live Edit Mode ON: Click highlighted texts on the page to edit!');
      this.enableInlineEditing();
    } else {
      body.classList.remove('live-edit-active');
      if (dot) dot.style.background = '#9CA3AF';
      if (text) text.textContent = 'Enable Click-to-Edit Mode';
      this.saveData(true);
      this.disableInlineEditing();
    }
  }

  enableInlineEditing() {
    const editables = document.querySelectorAll('[data-editable]');
    editables.forEach(el => {
      el.setAttribute('contenteditable', 'true');
      el.addEventListener('blur', () => this.handleInlineEditBlur(el));
    });
  }

  disableInlineEditing() {
    const editables = document.querySelectorAll('[data-editable]');
    editables.forEach(el => {
      el.removeAttribute('contenteditable');
    });
  }

  handleInlineEditBlur(el) {
    const key = el.getAttribute('data-editable');
    const val = el.innerText.trim();

    if (key === 'company.slogan') {
      if (!this.data.company) this.data.company = {};
      this.data.company.slogan = val;
    } else if (key === 'company.hotline') {
      if (!this.data.company) this.data.company = {};
      this.data.company.hotline = val;
    } else if (key.startsWith('slide-title-')) {
      const idx = parseInt(key.replace('slide-title-', ''), 10);
      if (this.data.heroSlides && this.data.heroSlides[idx]) {
        this.data.heroSlides[idx].title = val;
      }
    } else if (key.startsWith('slide-sub-')) {
      const idx = parseInt(key.replace('slide-sub-', ''), 10);
      if (this.data.heroSlides && this.data.heroSlides[idx]) {
        this.data.heroSlides[idx].subtitle = val;
      }
    }
    this.saveData(false);
  }

  renderSlidesTab() {
    const container = document.getElementById('adminSlidesList');
    if (!container) return;
    container.innerHTML = '';

    (this.data.heroSlides || []).forEach((slide, idx) => {
      const card = document.createElement('div');
      card.style = 'border:1px solid #E5E7EB; border-radius:6px; padding:12px; background:#F9FAFB;';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong style="font-size:13px;">Slide #${idx + 1} (${slide.tag || 'Slide'})</strong>
          <div>
            <button class="delete-slide-btn" data-idx="${idx}" style="background:none; border:none; color:#DC2626; cursor:pointer; font-size:12px;">Delete</button>
          </div>
        </div>
        <div class="admin-form-group" style="margin-bottom:8px;">
          <label class="admin-label" style="font-size:11px;">Badge Tag</label>
          <input type="text" class="admin-input slide-badge-input" data-idx="${idx}" value="${slide.badge || ''}">
        </div>
        <div class="admin-form-group" style="margin-bottom:8px;">
          <label class="admin-label" style="font-size:11px;">Title</label>
          <input type="text" class="admin-input slide-title-input" data-idx="${idx}" value="${slide.title || ''}">
        </div>
        <div class="admin-form-group" style="margin-bottom:8px;">
          <label class="admin-label" style="font-size:11px;">Subtitle</label>
          <textarea class="admin-textarea slide-sub-input" data-idx="${idx}" style="min-height:50px;">${slide.subtitle || ''}</textarea>
        </div>
        <div class="admin-form-group" style="margin-bottom:8px;">
          <label class="admin-label" style="font-size:11px;">Image URL</label>
          <input type="text" class="admin-input slide-img-input" data-idx="${idx}" value="${slide.imageUrl || ''}">
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.slide-badge-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const i = e.target.getAttribute('data-idx');
        this.data.heroSlides[i].badge = e.target.value;
      });
    });
    container.querySelectorAll('.slide-title-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const i = e.target.getAttribute('data-idx');
        this.data.heroSlides[i].title = e.target.value;
      });
    });
    container.querySelectorAll('.slide-sub-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const i = e.target.getAttribute('data-idx');
        this.data.heroSlides[i].subtitle = e.target.value;
      });
    });
    container.querySelectorAll('.slide-img-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const i = e.target.getAttribute('data-idx');
        this.data.heroSlides[i].imageUrl = e.target.value;
      });
    });
    container.querySelectorAll('.delete-slide-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const i = parseInt(e.target.getAttribute('data-idx'), 10);
        if (confirm('Delete this slide?')) {
          this.data.heroSlides.splice(i, 1);
          this.renderSlidesTab();
          this.saveData(true);
        }
      });
    });
  }

  renderProductsTab() {
    const container = document.getElementById('adminProductsList');
    if (!container) return;
    container.innerHTML = '';

    (this.data.featuredProducts || []).forEach((prod, idx) => {
      const item = document.createElement('div');
      item.style = 'border:1px solid #E5E7EB; border-radius:6px; padding:12px; background:#F9FAFB;';
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong style="font-size:13px; color:#F15A29;">${prod.model}</strong>
          <button class="delete-prod-btn" data-idx="${idx}" style="background:none; border:none; color:#DC2626; cursor:pointer; font-size:12px;">Delete</button>
        </div>
        <div class="admin-form-group" style="margin-bottom:8px;">
          <label class="admin-label" style="font-size:11px;">Product Name</label>
          <input type="text" class="admin-input prod-name-input" data-idx="${idx}" value="${prod.name || ''}">
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
          <div>
            <label class="admin-label" style="font-size:11px;">Price in PKR</label>
            <input type="text" class="admin-input prod-price-input" data-idx="${idx}" value="${prod.pricePKR || '₨ 350,000'}">
          </div>
          <div>
            <label class="admin-label" style="font-size:11px;">Power Range</label>
            <input type="text" class="admin-input prod-power-input" data-idx="${idx}" value="${prod.powerRange || ''}">
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
          <div>
            <label class="admin-label" style="font-size:11px;">Peak Efficiency</label>
            <input type="text" class="admin-input prod-eff-input" data-idx="${idx}" value="${prod.efficiency || ''}">
          </div>
          <div>
            <label class="admin-label" style="font-size:11px;">MPPT Count</label>
            <input type="text" class="admin-input prod-mppt-input" data-idx="${idx}" value="${prod.mpptCount || ''}">
          </div>
        </div>
      `;
      container.appendChild(item);
    });

    container.querySelectorAll('.prod-name-input').forEach(input => {
      input.addEventListener('change', (e) => {
        this.data.featuredProducts[e.target.dataset.idx].name = e.target.value;
      });
    });
    container.querySelectorAll('.prod-price-input').forEach(input => {
      input.addEventListener('change', (e) => {
        this.data.featuredProducts[e.target.dataset.idx].pricePKR = e.target.value;
      });
    });
    container.querySelectorAll('.prod-power-input').forEach(input => {
      input.addEventListener('change', (e) => {
        this.data.featuredProducts[e.target.dataset.idx].powerRange = e.target.value;
      });
    });
    container.querySelectorAll('.prod-eff-input').forEach(input => {
      input.addEventListener('change', (e) => {
        this.data.featuredProducts[e.target.dataset.idx].efficiency = e.target.value;
      });
    });
    container.querySelectorAll('.prod-mppt-input').forEach(input => {
      input.addEventListener('change', (e) => {
        this.data.featuredProducts[e.target.dataset.idx].mpptCount = e.target.value;
      });
    });
    container.querySelectorAll('.delete-prod-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const i = parseInt(e.target.dataset.idx, 10);
        if (confirm('Delete this inverter model?')) {
          this.data.featuredProducts.splice(i, 1);
          this.renderProductsTab();
          this.saveData(true);
        }
      });
    });
  }

  async loadSubscribers() {
    const list = document.getElementById('adminSubscribersList');
    if (!list) return;
    let subs = [];
    try {
      const res = await fetch('/api/subscribers');
      if (res.ok) subs = await res.json();
    } catch (e) {
      const local = localStorage.getItem('solis_subscribers');
      if (local) subs = JSON.parse(local);
    }

    if (!subs.length) {
      list.innerHTML = `<div style="padding:20px; text-align:center; color:#9ca3af; font-size:13px;">No subscribers recorded yet.</div>`;
      return;
    }

    list.innerHTML = subs.map(s => `
      <div style="padding:10px 14px; border-bottom:1px solid #F3F4F6; display:flex; justify-content:space-between; align-items:center; font-size:13px;">
        <div>
          <strong>${s.email}</strong>
          <div style="font-size:11px; color:#9CA3AF;">${new Date(s.subscribedAt).toLocaleString()}</div>
        </div>
        <span style="font-size:11px; background:#FFF1EB; color:#F15A29; padding:2px 8px; border-radius:4px; font-weight:600;">${s.source || 'Website'}</span>
      </div>
    `).join('');
  }

  bindEvents() {
    document.getElementById('closeAdminDrawerBtn')?.addEventListener('click', () => this.closeDrawer());

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.getAttribute('data-tab');
        document.getElementById(target)?.classList.add('active');
      });
    });

    document.getElementById('quickSaveBtn')?.addEventListener('click', () => {
      this.saveData(true);
    });

    document.getElementById('toggleLiveEditBtn')?.addEventListener('click', () => {
      this.toggleLiveEdit();
    });

    document.getElementById('saveCompanyBtn')?.addEventListener('click', () => {
      if (!this.data.company) this.data.company = {};
      this.data.company.hotline = document.getElementById('adminHotline').value;
      this.data.company.whatsapp = document.getElementById('adminWhatsapp').value;
      this.data.company.email = document.getElementById('adminEmail').value;
      this.data.company.slogan = document.getElementById('adminSlogan').value;
      this.data.company.address = document.getElementById('adminAddress').value;
      this.saveData(true);
    });

    document.getElementById('addSlideBtn')?.addEventListener('click', () => {
      if (!this.data.heroSlides) this.data.heroSlides = [];
      this.data.heroSlides.push({
        id: 'slide-' + Date.now(),
        badge: 'NEW PROMOTION',
        title: 'New Solar Solution',
        subtitle: 'Engineered with cutting edge PV technology for Pakistan.',
        primaryCta: { label: 'Estimate Order', link: '#estimate' },
        secondaryCta: { label: 'Contact Us', link: '#trust-stats' },
        imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1920&q=80',
        tag: 'New',
        active: true
      });
      this.renderSlidesTab();
      this.saveData(true);
    });

    document.getElementById('addProductBtn')?.addEventListener('click', () => {
      if (!this.data.featuredProducts) this.data.featuredProducts = [];
      this.data.featuredProducts.push({
        id: 'prod-' + Date.now(),
        model: 'S6-NEW(' + Math.floor(Math.random() * 10 + 5) + 'K)-PK',
        name: 'New Solis S6 High-Efficiency Inverter',
        category: 'Energy Storage Inverter',
        badge: 'New Inverter',
        pricePKR: '₨ 390,000',
        efficiency: '98.5% Peak',
        powerRange: '5.0 kW – 12.0 kW',
        mpptCount: '4 MPPTs',
        batteryVoltage: 'High Voltage LiFePO4 & Tubular',
        switchTime: '< 10 ms',
        warranty: '10 Years Official Warranty',
        certifications: 'NEPRA SRO Certified, K-Electric Approved',
        description: 'Latest generation intelligent inverter offering industry-leading efficiency and grid flexibility in Pakistan.',
        highlights: [
          'High DC input current capability',
          'Automatic 10ms transfer switch',
          'NEMA 4X weather-sealed housing'
        ],
        imageUrl: 'https://images.unsplash.com/photo-1558441719-8b489c63a79b?auto=format&fit=crop&w=700&q=80'
      });
      this.renderProductsTab();
      this.saveData(true);
    });

    document.getElementById('exportSubscribersBtn')?.addEventListener('click', async () => {
      let subs = [];
      try {
        const res = await fetch('/api/subscribers');
        if (res.ok) subs = await res.json();
      } catch (e) {
        subs = JSON.parse(localStorage.getItem('solis_subscribers') || '[]');
      }
      if (!subs.length) {
        alert('No subscribers to export');
        return;
      }
      const csv = 'Email,Subscribed Date,Source\n' + subs.map(s => `"${s.email}","${s.subscribedAt}","${s.source}"`).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'solis_pakistan_subscribers.csv';
      a.click();
    });

    document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'solis_pakistan_website_data.json';
      a.click();
    });

    document.getElementById('importJsonInput')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          this.data = parsed;
          window.SOLIS_DATA = parsed;
          this.saveData(true);
          this.renderSlidesTab();
          this.renderProductsTab();
          this.toast('Configuration imported successfully!');
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    });

    document.getElementById('resetDefaultsBtn')?.addEventListener('click', async () => {
      if (confirm('Are you sure you want to reset all content back to original Solis Pakistan defaults?')) {
        try {
          await fetch('/api/reset', { method: 'POST' });
        } catch (e) {}
        localStorage.removeItem('solis_inverters_data');
        if (typeof window.DEFAULT_SOLIS_DATA !== 'undefined') {
          this.data = JSON.parse(JSON.stringify(window.DEFAULT_SOLIS_DATA));
          window.SOLIS_DATA = this.data;
        }
        await this.saveData(false);
        this.renderSlidesTab();
        this.renderProductsTab();
        this.toast('Website restored to Solis Pakistan defaults');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        const drawer = document.getElementById('adminDrawer');
        if (drawer.classList.contains('open')) {
          this.closeDrawer();
        } else {
          this.openDrawer();
        }
      }
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.solisCMS = new SolisCMS();
});

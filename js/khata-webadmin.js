/**
 * Easy Khata — Website Admin & Orders Tracker Module
 * Enables complete control over the Solis Pakistan website directly from inside the Khata app,
 * and allows tracking and converting website customer estimate orders into Khata invoices and customers.
 */

const KhataWebAdmin = {
  orders: [],
  activeFilter: 'all',
  searchTerm: '',
  webData: null,

  async init() {
    await this.fetchOrders();
    await this.fetchWebData();
  },

  async fetchOrders() {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        this.orders = await res.json();
      }
    } catch (e) {
      console.warn('Could not fetch orders from API, checking local storage', e);
    }
    if (!this.orders || !this.orders.length) {
      const local = localStorage.getItem('solis_orders');
      if (local) {
        try { this.orders = JSON.parse(local); } catch (err) {}
      }
    }
    return this.orders || [];
  },

  async fetchWebData() {
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        this.webData = await res.json();
      }
    } catch (e) {
      console.warn('Could not fetch web data', e);
    }
    if (!this.webData) {
      const local = localStorage.getItem('solis_inverters_data');
      if (local) {
        try { this.webData = JSON.parse(local); } catch (err) {}
      }
    }
    if (!this.webData && typeof DEFAULT_SOLIS_DATA !== 'undefined') {
      this.webData = JSON.parse(JSON.stringify(DEFAULT_SOLIS_DATA));
    }
    return this.webData;
  },

  /* ========================================================
     ORDERS & ESTIMATES TRACE PAGE (#/orders)
     ======================================================== */
  async ordersPage() {
    await this.fetchOrders();
    const orders = this.orders || [];
    const filter = this.activeFilter;

    const query = (this.searchTerm || '').trim().toLowerCase();
    const filtered = orders.filter(o => (filter === 'all' || (o.status || 'Pending').toLowerCase() === filter.toLowerCase()) &&
      (!query || [o.id, o.customerName, o.phone, o.city, o.area, o.inverterModel].some(value => String(value || '').toLowerCase().includes(query))));

    const pendingCount = orders.filter(o => (o.status || 'Pending') === 'Pending').length;
    const inProgressCount = orders.filter(o => ['In Progress', 'Contacted', 'Survey Scheduled'].includes(o.status)).length;
    const completedCount = orders.filter(o => ['Completed', 'Invoiced in Khata'].includes(o.status)).length;

    return `
      <div class="page">
        <div class="page-head" style="background:#1a1e24; color:#fff; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:18px; font-weight:800; color:#F15A29; display:flex; align-items:center; gap:8px;">
              <span>📦</span> Website Estimate Orders
            </div>
            <div style="font-size:12px; color:#adb5bd;">Track, trace &amp; convert website leads into Khata invoices</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-sm" style="background:#F15A29; color:#fff; border:none;" onclick="App.nav('settings?tab=website')">🌐 Website Settings</button>
            <a href="/" target="_blank" class="btn btn-sm btn-outline" style="color:#adb5bd; border-color:#4b5563;">View Website ↗</a>
          </div>
        </div>

        <div class="page-body" style="padding:16px 20px;">
          <div class="row" style="justify-content:flex-end;margin-bottom:10px"><button class="btn btn-sm" onclick="KhataWebAdmin.reloadOrders()">Refresh orders</button></div>
          <!-- Quick Stat Counters -->
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:16px;">
            <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:12px; text-align:center;">
              <div style="font-size:22px; font-weight:800; color:#F15A29;">${pendingCount}</div>
              <div style="font-size:11px; color:#6b7280; font-weight:600; text-transform:uppercase;">New Pending Orders</div>
            </div>
            <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:12px; text-align:center;">
              <div style="font-size:22px; font-weight:800; color:#2563EB;">${inProgressCount}</div>
              <div style="font-size:11px; color:#6b7280; font-weight:600; text-transform:uppercase;">In Discussion</div>
            </div>
            <div style="background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:12px; text-align:center;">
              <div style="font-size:22px; font-weight:800; color:#10B981;">${completedCount}</div>
              <div style="font-size:11px; color:#6b7280; font-weight:600; text-transform:uppercase;">Closed / Invoiced</div>
            </div>
          </div>

          <!-- Filter Pills -->
          <div style="display:flex; gap:8px; overflow-x:auto; margin-bottom:16px; padding-bottom:4px;">
            <button class="btn btn-sm ${filter === 'all' ? 'btn-pri' : 'btn-outline'}" onclick="KhataWebAdmin.setOrderFilter('all')">All (${orders.length})</button>
            <button class="btn btn-sm ${filter === 'Pending' ? 'btn-pri' : 'btn-outline'}" onclick="KhataWebAdmin.setOrderFilter('Pending')">Pending (${pendingCount})</button>
            <button class="btn btn-sm ${filter === 'Contacted' ? 'btn-pri' : 'btn-outline'}" onclick="KhataWebAdmin.setOrderFilter('Contacted')">Contacted</button>
            <button class="btn btn-sm ${filter === 'In Progress' ? 'btn-pri' : 'btn-outline'}" onclick="KhataWebAdmin.setOrderFilter('In Progress')">In Progress</button>
            <button class="btn btn-sm ${filter === 'Completed' ? 'btn-pri' : 'btn-outline'}" onclick="KhataWebAdmin.setOrderFilter('Completed')">Completed</button>
            <button class="btn btn-sm ${filter === 'Survey Scheduled' ? 'btn-pri' : 'btn-outline'}" onclick="KhataWebAdmin.setOrderFilter('Survey Scheduled')">Survey scheduled</button>
            <button class="btn btn-sm ${filter === 'Invoiced in Khata' ? 'btn-pri' : 'btn-outline'}" onclick="KhataWebAdmin.setOrderFilter('Invoiced in Khata')">Invoiced</button>
            <button class="btn btn-sm ${filter === 'Cancelled' ? 'btn-pri' : 'btn-outline'}" onclick="KhataWebAdmin.setOrderFilter('Cancelled')">Cancelled</button>
          </div>

          <div class="searchbar" style="margin-bottom:14px"><input id="orders_q" placeholder="Search order, customer or phone" value="${U.esc(this.searchTerm)}" oninput="KhataWebAdmin.searchOrders(this.value)"></div>

          <!-- Orders List -->
          <div id="orders_list">${filtered.length === 0 ? `
            <div class="card" style="padding:40px; text-align:center; color:#6b7280;">
              <div style="font-size:36px; margin-bottom:10px;">📋</div>
              <div style="font-weight:700; font-size:15px; color:#111827;">No orders found in this filter</div>
              <div style="font-size:13px; margin-top:4px;">Estimate orders submitted on your website will automatically appear here.</div>
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap:14px;">
              ${filtered.map(o => KhataWebAdmin.renderOrderCard(o)).join('')}
            </div>
          `}</div>
        </div>
      </div>
    `;
  },

  renderOrderCard(o) {
    const statusColors = {
      'Pending': { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B' },
      'Contacted': { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6' },
      'Survey Scheduled': { bg: '#E0E7FF', text: '#3730A3', border: '#6366F1' },
      'In Progress': { bg: '#EDE9FE', text: '#5B21B6', border: '#8B5CF6' },
      'Invoiced in Khata': { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
      'Completed': { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
      'Cancelled': { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444' }
    };
    const sc = statusColors[o.status] || statusColors['Pending'];
    const cleanPhone = (o.phone || '').replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;

    return `
      <div class="card" style="border-left:4px solid ${sc.border}; padding:16px; background:#fff; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
          <div>
            <span style="font-family:monospace; font-weight:800; font-size:13px; color:#F15A29; background:#FFF1EB; padding:3px 8px; border-radius:4px;">
              ${o.id}
            </span>
            <span style="font-size:16px; font-weight:700; color:#111827; margin-left:8px;">${U.esc(o.customerName)}</span>
            <div style="font-size:12px; color:#6b7280; margin-top:2px;">
              📍 ${U.esc(o.area || o.city || 'Karachi, Pakistan')} • 🕒 ${new Date(o.createdAt).toLocaleString()}
            </div>
          </div>
          <div>
            <span style="background:${sc.bg}; color:${sc.text}; border:1px solid ${sc.border}; font-size:11px; font-weight:700; padding:4px 10px; border-radius:20px;">
              ● ${o.status || 'Pending'}
            </span>
          </div>
        </div>

        <!-- System & Inverter Requirements -->
        <div style="background:#F8F9FA; border-radius:6px; padding:10px 12px; margin-bottom:12px; display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:8px; font-size:12.5px;">
          <div><span style="color:#6b7280;">System Size:</span> <strong>${o.systemSize || '10 kW'}</strong></div>
          <div><span style="color:#6b7280;">Recommended:</span> <strong style="color:#F15A29;">${o.inverterModel || 'Solis S6 Hybrid'}</strong></div>
          <div><span style="color:#6b7280;">Monthly Bill:</span> <strong>${o.monthlyBill || 'N/A'}</strong></div>
          <div><span style="color:#6b7280;">Battery Type:</span> <strong>${o.batteryType || 'None'}</strong></div>
          <div><span style="color:#6b7280;">Est. Cost:</span> <strong style="color:#059669;">${o.estimatedCost || 'PKR 1,200,000'}</strong></div>
        </div>

        ${o.customModules && Object.keys(o.customModules).length ? `
          <div style="background:#F8F9FA;border-radius:6px;padding:10px 12px;margin-bottom:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;font-size:12.5px;">
            ${Object.entries(o.customModules).map(([label, value]) => `<div><span style="color:#6b7280;">${U.esc(label)}:</span> <strong>${U.esc(value)}</strong></div>`).join('')}
          </div>
        ` : ''}

        ${o.selectedItems && o.selectedItems.length ? `
          <div style="background:#F8F9FA;border-radius:6px;padding:10px 12px;margin-bottom:12px;font-size:12.5px;">
            <strong>Selected order items:</strong> ${o.selectedItems.map(item => `${U.esc(item.label)} (₨ ${Number(item.price || 0).toLocaleString('en-PK')})`).join(', ')}
          </div>
        ` : ''}

        ${o.notes ? `
          <div style="font-size:12px; color:#4b5563; background:#FFFBEB; border:1px solid #FEF3C7; padding:8px 12px; border-radius:6px; margin-bottom:12px;">
            <strong>Customer Note:</strong> ${U.esc(o.notes)}
          </div>
        ` : ''}

        <!-- Actions -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; border-top:1px solid #f3f4f6; padding-top:12px;">
          <div style="display:flex; gap:8px;">
            <a href="tel:${cleanPhone}" class="btn btn-sm btn-outline" style="display:inline-flex; align-items:center; gap:4px;">
              📞 Call (${o.phone})
            </a>
            <a href="https://wa.me/${waPhone}?text=${encodeURIComponent(`Hello ${o.customerName}, regarding your Solis Solar order estimate (${o.id}) for ${o.systemSize} system in ${o.area || o.city}...`)}" target="_blank" class="btn btn-sm" style="background:#25D366; color:#fff; border:none; display:inline-flex; align-items:center; gap:4px;">
              💬 WhatsApp
            </a>
          </div>

          <div style="display:flex; gap:8px;">
            <!-- Status Dropdown -->
            <select class="input" style="width:140px; font-size:12px; padding:4px 8px; height:32px;" onchange="KhataWebAdmin.updateOrderStatus('${o.id}', this.value)">
              <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Contacted" ${o.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
              <option value="Survey Scheduled" ${o.status === 'Survey Scheduled' ? 'selected' : ''}>Survey Scheduled</option>
              <option value="In Progress" ${o.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>

            <!-- Convert to Khata Bill -->
            <button class="btn btn-sm btn-pri" style="background:#F15A29; border-color:#F15A29;" onclick="KhataWebAdmin.convertToKhata('${o.id}')">
              📄 Convert to Bill
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async setOrderFilter(f) {
    this.activeFilter = f;
    App.rerender();
  },

  searchOrders(value) {
    this.searchTerm = value || '';
    const container = document.getElementById('orders_list');
    if (!container) return;
    const query = this.searchTerm.trim().toLowerCase(), filter = this.activeFilter;
    const filtered = (this.orders || []).filter(o => (filter === 'all' || (o.status || 'Pending').toLowerCase() === filter.toLowerCase()) &&
      (!query || [o.id, o.customerName, o.phone, o.city, o.area, o.inverterModel].some(v => String(v || '').toLowerCase().includes(query))));
    container.innerHTML = filtered.length
      ? '<div style="display:flex;flex-direction:column;gap:14px">' + filtered.map(o => this.renderOrderCard(o)).join('') + '</div>'
      : '<div class="card" style="padding:28px;text-align:center">No orders match this search.</div>';
  },

  async reloadOrders() {
    try {
      await this.fetchOrders();
      await App.rerender();
      UI.toast('Orders refreshed', 'ok');
    } catch (error) {
      UI.toast('Could not refresh orders: ' + (error.message || error), 'err');
    }
  },

  async updateOrderStatus(id, newStatus, metadata) {
    let order = (this.orders || []).find(o => o.id === id);
    if (!order) {
      await this.fetchOrders();
      order = (this.orders || []).find(o => o.id === id);
    }
    if (!order) { UI.toast('Order not found. Refresh the orders list.', 'err'); return false; }
    try {
      const response = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ id, status: newStatus }, metadata || {}))
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Server returned ' + response.status);
      Object.assign(order, result.order || {}, { status: newStatus });
      if (metadata && metadata.invoiceId) order.invoiceId = metadata.invoiceId;
      localStorage.setItem('solis_orders', JSON.stringify(this.orders));
      UI.toast('Order ' + id + ' updated to ' + newStatus, 'ok');
      App.rerender();
      return true;
    } catch (error) {
      UI.toast('Order update failed: ' + error.message, 'err');
      App.rerender();
      return false;
    }
  },

  async convertToKhata(orderId) {
    const o = (this.orders || []).find(x => x.id === orderId);
    if (!o) return;
    try {
      let linkedInvoiceId = o.invoiceId || o.khataInvoiceId;
      if (!linkedInvoiceId) {
        const linkedInvoice = (await DB.all('invoices')).find(inv => inv.sourceOrderId === o.id);
        linkedInvoiceId = linkedInvoice && linkedInvoice.id;
      }
      if (linkedInvoiceId) {
        await this.updateOrderStatus(orderId, 'Invoiced in Khata', { invoiceId: linkedInvoiceId });
        return App.nav('bill?id=' + encodeURIComponent(linkedInvoiceId));
      }
      if (!o.customerName) return UI.toast('This order has no customer name.', 'err');
      const customers = await DB.all('customers');
      const normalizePhone = value => String(value || '').replace(/\D/g, '').replace(/^0/, '92');
      const phone = normalizePhone(o.phone);
      let cust = customers.find(c => phone && normalizePhone(c.phone) === phone) ||
        customers.find(c => (c.name || '').trim().toLowerCase() === o.customerName.trim().toLowerCase());
      if (!cust) {
        cust = {
          id: U.uid(), name: o.customerName.trim(), phone: o.phone || '',
          address: o.area || o.city || '', notes: 'Website order ' + o.id,
          isCustomer: true, createdAt: U.nowISO()
        };
        await DB.put('customers', cust);
      } else if (cust.isCustomer === false) {
        cust.isCustomer = true;
        await DB.put('customers', cust);
      }
      const estimateAmount = Number(String(o.estimatedCost || '').replace(/[^\d.]/g, '')) || 0;
      const estimateName = [o.systemSize, o.inverterModel].filter(Boolean).join(' · ') || ('Website order ' + o.id);
      const note = 'Website order ' + o.id + (o.notes ? ' · ' + o.notes : '');
      App.nav('bform?cid=' + encodeURIComponent(cust.id) + '&orderId=' + encodeURIComponent(o.id) +
        '&estimateAmount=' + encodeURIComponent(estimateAmount) + '&estimateName=' + encodeURIComponent(estimateName) +
        '&note=' + encodeURIComponent(note));
    } catch (error) {
      console.error('Could not convert website order', error);
      UI.toast('Could not prepare bill: ' + (error.message || error), 'err');
    }
  },

  /* ========================================================
     WEBSITE SETTINGS & CMS PAGE (#/webadmin)
     ======================================================== */
  async webAdminPage() {
    await this.fetchWebData();
    const d = this.webData || {};
    const comp = d.company || {};
    const slides = d.heroSlides || [];
    const products = d.featuredProducts || [];

    return `
      <div class="page">
        <div class="page-head" style="background:#1a1e24; color:#fff; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:18px; font-weight:800; color:#F15A29; display:flex; align-items:center; gap:8px;">
              <span>🌐</span> Solis Pakistan Website Control
            </div>
            <div style="font-size:12px; color:#adb5bd;">Control live slides, models, Karachi hotline &amp; PKR prices</div>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-sm btn-pri" style="background:#F15A29; border:none;" onclick="KhataWebAdmin.saveAndSyncWebsite()">💾 Save &amp; Publish</button>
            <a href="/" target="_blank" class="btn btn-sm btn-outline" style="color:#adb5bd; border-color:#4b5563;">View Website ↗</a>
          </div>
        </div>

        <div class="page-body" style="padding:16px 20px;">
          <!-- Navigation Tabs -->
          <div style="display:flex; gap:8px; margin-bottom:20px; border-bottom:1px solid #e5e7eb; padding-bottom:8px;">
            <button class="btn btn-sm btn-pri" onclick="KhataWebAdmin.switchTab('sec-company')">🏢 Company &amp; Karachi Contact</button>
            <button class="btn btn-sm btn-outline" onclick="KhataWebAdmin.switchTab('sec-slides')">🖼️ Hero Carousel (${slides.length})</button>
            <button class="btn btn-sm btn-outline" onclick="KhataWebAdmin.switchTab('sec-products')">⚡ Inverter Catalog (${products.length})</button>
            <button class="btn btn-sm btn-outline" onclick="App.nav('orders')">📦 Orders Received</button>
          </div>

          <!-- Section 1: Company Profile & Karachi Contact -->
          <div id="sec-company" class="webadmin-sec">
            <div class="card" style="padding:20px; background:#fff; border-radius:8px; margin-bottom:16px;">
              <h3 style="font-size:16px; font-weight:700; color:#111827; margin-bottom:14px;">Karachi Regional Hub Details</h3>
              <div class="field"><label>Company Name</label><input id="wa_comp_name" value="${U.esc(comp.name || 'Solis Pakistan')}"></div>
              <div class="field"><label>Brand Slogan</label><input id="wa_comp_slogan" value="${U.esc(comp.slogan || 'Bankable, Reliable, Local')}"></div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="field"><label>Karachi Landline Hotline</label><input id="wa_comp_hotline" value="${U.esc(comp.hotline || '+92 21 3456 7890')}"></div>
                <div class="field"><label>Official WhatsApp Number</label><input id="wa_comp_wa" value="${U.esc(comp.whatsapp || '+92 300 123 4567')}"></div>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="field"><label>Support Email</label><input id="wa_comp_email" value="${U.esc(comp.email || 'pakistan@ginlong.com')}"></div>
                <div class="field"><label>Sales Email</label><input id="wa_comp_sales" value="${U.esc(comp.salesEmail || 'sales.pk@ginlong.com')}"></div>
              </div>
              <div class="field"><label>Karachi Office Address</label><input id="wa_comp_addr" value="${U.esc(comp.address || 'Suite 402, Business Avenue, Main Shahrah-e-Faisal, Karachi 75400, Pakistan')}"></div>
              <div class="field"><label>Support &amp; Showroom Hours</label><input id="wa_comp_hours" value="${U.esc(comp.hours || 'Mon – Sat: 9:00 AM – 7:00 PM PKT')}"></div>
              <button class="btn btn-pri btn-block" style="background:#F15A29; border:none;" onclick="KhataWebAdmin.saveAndSyncWebsite()">Save Company Profile</button>
            </div>
          </div>

          <!-- Section 2: Hero Carousel Slides -->
          <div id="sec-slides" class="webadmin-sec" style="display:none;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <h3 style="font-size:16px; font-weight:700;">Hero Carousel Slides</h3>
              <button class="btn btn-sm btn-pri" style="background:#F15A29; border:none;" onclick="KhataWebAdmin.addSlide()">+ Add New Slide</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:12px;" id="waSlidesContainer">
              ${slides.map((s, idx) => `
                <div class="card" style="padding:14px; background:#fff; border-radius:8px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <strong>Slide #${idx + 1} (${U.esc(s.tag || 'Slide')})</strong>
                    <button class="btn btn-sm btn-danger" onclick="KhataWebAdmin.deleteSlide(${idx})">Delete</button>
                  </div>
                  <div class="field"><label>Badge Tag</label><input class="wa-slide-badge" data-idx="${idx}" value="${U.esc(s.badge || '')}"></div>
                  <div class="field"><label>Slide Headline</label><input class="wa-slide-title" data-idx="${idx}" value="${U.esc(s.title || '')}"></div>
                  <div class="field"><label>Subtitle</label><textarea class="wa-slide-sub" data-idx="${idx}" style="min-height:50px;">${U.esc(s.subtitle || '')}</textarea></div>
                  <div class="field"><label>Background Image URL</label><input class="wa-slide-img" data-idx="${idx}" value="${U.esc(s.imageUrl || '')}"></div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 3: Inverter Catalog & PKR Pricing -->
          <div id="sec-products" class="webadmin-sec" style="display:none;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <h3 style="font-size:16px; font-weight:700;">Inverter Catalog &amp; PKR Pricing</h3>
              <button class="btn btn-sm btn-pri" style="background:#F15A29; border:none;" onclick="KhataWebAdmin.addProduct()">+ Add Inverter Model</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:14px;" id="waProductsContainer">
              ${products.map((p, idx) => `
                <div class="card" style="padding:16px; background:#fff; border-radius:8px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <strong style="color:#F15A29; font-size:14px;">${U.esc(p.model)}</strong>
                    <button class="btn btn-sm btn-danger" onclick="KhataWebAdmin.deleteProduct(${idx})">Delete Model</button>
                  </div>
                  <div class="field"><label>Model Code</label><input class="wa-prod-model" data-idx="${idx}" value="${U.esc(p.model || '')}"></div>
                  <div class="field"><label>Product Name</label><input class="wa-prod-name" data-idx="${idx}" value="${U.esc(p.name || '')}"></div>
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="field"><label>Estimated Price in PKR</label><input class="wa-prod-price" data-idx="${idx}" value="${U.esc(p.pricePKR || '₨ 350,000')}"></div>
                    <div class="field"><label>Power Range</label><input class="wa-prod-power" data-idx="${idx}" value="${U.esc(p.powerRange || '')}"></div>
                  </div>
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
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
          </div>
        </div>
      </div>
    `;
  },

  switchTab(secId) {
    document.querySelectorAll('.webadmin-sec').forEach(el => el.style.display = 'none');
    const target = document.getElementById(secId);
    if (target) target.style.display = 'block';
  },

  addSlide() {
    if (!this.webData.heroSlides) this.webData.heroSlides = [];
    this.webData.heroSlides.push({
      id: 'slide-' + Date.now(),
      badge: 'NEW PROMOTION',
      title: 'New Solar Inverter Line',
      subtitle: 'Engineered for high performance and reliable backup in Pakistan.',
      primaryCta: { label: 'Order System', link: '#estimate' },
      secondaryCta: { label: 'Contact Karachi', link: 'tel:+922134567890' },
      imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1920&q=80',
      tag: 'New',
      active: true
    });
    App.rerender();
  },

  deleteSlide(idx) {
    if (confirm('Delete this carousel slide?')) {
      this.webData.heroSlides.splice(idx, 1);
      App.rerender();
    }
  },

  addProduct() {
    if (!this.webData.featuredProducts) this.webData.featuredProducts = [];
    this.webData.featuredProducts.push({
      id: 'prod-' + Date.now(),
      model: 'S6-NEW(' + Math.floor(Math.random() * 10 + 5) + 'K)-PK',
      name: 'Solis S6 High-Efficiency Pakistan Edition',
      category: 'Energy Storage Inverter',
      badge: 'New Inverter',
      pricePKR: '₨ 380,000',
      efficiency: '98.5% Peak',
      powerRange: '6.0 kW – 12.0 kW',
      mpptCount: '4 MPPTs',
      batteryVoltage: 'High Voltage LiFePO4 & Tubular',
      switchTime: '< 10 ms',
      warranty: '10 Years Official Warranty',
      certifications: 'NEPRA SRO Certified, K-Electric Approved',
      description: 'Engineered with advanced anti-dust cooling and high surge tolerance for Pakistan.',
      highlights: [
        'Built-in DC AFCI fire safety protection',
        'Automatic 10ms transfer switch during load shedding',
        'Direct connection to K-Electric green net meter'
      ],
      imageUrl: 'https://images.unsplash.com/photo-1558441719-8b489c63a79b?auto=format&fit=crop&w=700&q=80'
    });
    App.rerender();
  },

  deleteProduct(idx) {
    if (confirm('Delete this inverter model from the website?')) {
      this.webData.featuredProducts.splice(idx, 1);
      App.rerender();
    }
  },

  async saveFullContent() {
    const editor = document.getElementById('wa_full_content_json');
    if (!editor) return UI.toast('Website content editor is unavailable', 'err');
    let next;
    try {
      next = JSON.parse(editor.value);
      if (!next || typeof next !== 'object' || Array.isArray(next)) throw new Error('The root value must be a JSON object.');
      if (!next.company || typeof next.company !== 'object' || Array.isArray(next.company)) throw new Error('Add a company object before saving.');
      for (const key of ['heroSlides', 'categories', 'featuredProducts', 'solutions', 'resources', 'distributors']) {
        if (!Array.isArray(next[key])) throw new Error(key + ' must be a JSON array.');
      }
      if (!next.trustStats || typeof next.trustStats !== 'object' || Array.isArray(next.trustStats)) throw new Error('Add a trustStats object before saving.');
    } catch (error) {
      return UI.toast('Content not saved: ' + error.message, 'err');
    }
    this.webData = next;
    localStorage.setItem('solis_inverters_data', JSON.stringify(next));
    try {
      const response = await fetch('/api/content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next)
      });
      if (!response.ok) throw new Error('Server returned ' + response.status);
      UI.toast('All website content saved and published', 'ok');
    } catch (error) {
      UI.toast('Saved on this device, but publishing failed: ' + error.message, 'err');
    }
    await App.rerender();
  },

  async saveAndSyncWebsite() {
    if (!this.webData) await this.fetchWebData();
    if (!this.webData.company) this.webData.company = {};

    // Gather company values if inputs are present
    const nameEl = document.getElementById('wa_comp_name');
    if (nameEl) {
      this.webData.company.name = nameEl.value.trim();
      const primaryColor = document.getElementById('wa_comp_primary_color')?.value;
      if (primaryColor && /^#[0-9a-f]{6}$/i.test(primaryColor)) this.webData.company.primaryColor = primaryColor;
      this.webData.company.slogan = document.getElementById('wa_comp_slogan').value.trim();
      this.webData.company.hotline = document.getElementById('wa_comp_hotline').value.trim();
      this.webData.company.whatsapp = document.getElementById('wa_comp_wa').value.trim();
      this.webData.company.email = document.getElementById('wa_comp_email').value.trim();
      this.webData.company.salesEmail = document.getElementById('wa_comp_sales').value.trim();
      this.webData.company.address = document.getElementById('wa_comp_addr').value.trim();
      const mobile = document.getElementById('wa_comp_mobile');
      if (mobile) this.webData.company.mobile = mobile.value.trim();
      const logo = document.getElementById('wa_comp_logo');
      if (logo) this.webData.company.logoUrl = logo.value.trim();
      const logoFile = document.getElementById('wa_comp_logo_file')?.files?.[0];
      if (logoFile) {
        if (!logoFile.type.startsWith('image/')) return UI.toast('Choose an image file for the logo', 'err');
        if (logoFile.size > 1500000) return UI.toast('Logo image must be smaller than 1.5 MB', 'err');
        this.webData.company.logoUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(logoFile);
        });
      }
      this.webData.company.hours = document.getElementById('wa_comp_hours').value.trim();
    }

    // Gather slide values
    document.querySelectorAll('.wa-slide-title').forEach(el => {
      const idx = el.dataset.idx;
      if (this.webData.heroSlides && this.webData.heroSlides[idx]) {
        this.webData.heroSlides[idx].title = el.value.trim();
      }
    });
    document.querySelectorAll('.wa-slide-sub').forEach(el => {
      const idx = el.dataset.idx;
      if (this.webData.heroSlides && this.webData.heroSlides[idx]) {
        this.webData.heroSlides[idx].subtitle = el.value.trim();
      }
    });
    document.querySelectorAll('.wa-slide-badge').forEach(el => {
      const idx = el.dataset.idx;
      if (this.webData.heroSlides && this.webData.heroSlides[idx]) {
        this.webData.heroSlides[idx].badge = el.value.trim();
      }
    });
    document.querySelectorAll('.wa-slide-img').forEach(el => {
      const idx = el.dataset.idx;
      if (this.webData.heroSlides && this.webData.heroSlides[idx]) {
        this.webData.heroSlides[idx].imageUrl = el.value.trim();
      }
    });

    // Gather product values
    document.querySelectorAll('.wa-prod-model').forEach(el => {
      const idx = el.dataset.idx;
      if (this.webData.featuredProducts && this.webData.featuredProducts[idx]) {
        this.webData.featuredProducts[idx].model = el.value.trim();
      }
    });
    document.querySelectorAll('.wa-prod-name').forEach(el => {
      const idx = el.dataset.idx;
      if (this.webData.featuredProducts && this.webData.featuredProducts[idx]) {
        this.webData.featuredProducts[idx].name = el.value.trim();
      }
    });
    document.querySelectorAll('.wa-prod-price').forEach(el => {
      const idx = el.dataset.idx;
      if (this.webData.featuredProducts && this.webData.featuredProducts[idx]) {
        this.webData.featuredProducts[idx].pricePKR = el.value.trim();
      }
    });
    document.querySelectorAll('.wa-prod-power').forEach(el => {
      const idx = el.dataset.idx;
      if (this.webData.featuredProducts && this.webData.featuredProducts[idx]) {
        this.webData.featuredProducts[idx].powerRange = el.value.trim();
      }
    });
    document.querySelectorAll('.wa-prod-eff').forEach(el => {
      const idx = el.dataset.idx;
      if (this.webData.featuredProducts && this.webData.featuredProducts[idx]) {
        this.webData.featuredProducts[idx].efficiency = el.value.trim();
      }
    });
    document.querySelectorAll('.wa-prod-mppt').forEach(el => {
      const idx = el.dataset.idx;
      if (this.webData.featuredProducts && this.webData.featuredProducts[idx]) {
        this.webData.featuredProducts[idx].mpptCount = el.value.trim();
      }
    });
    document.querySelectorAll('.wa-prod-cat').forEach(el => {
      const idx = el.dataset.idx;
      if (this.webData.featuredProducts && this.webData.featuredProducts[idx]) {
        this.webData.featuredProducts[idx].category = el.value;
      }
    });

    // Save to localStorage
    localStorage.setItem('solis_inverters_data', JSON.stringify(this.webData));

    // Save to server
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.webData)
      });
      if (!response.ok) throw new Error('Server returned ' + response.status);
      UI.toast('Website changes published live to Solis Pakistan!', 'ok');
      await App.applyWebsiteTheme?.();
    } catch (e) {
      UI.toast('Saved on this device, but publishing failed: ' + e.message, 'err');
    }
  }
};

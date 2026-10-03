/**
 * Solis Inverters Pakistan (Karachi Hub) — Main Website Controller
 * Handles slider, navigation, category filtering, search, spec modals,
 * Pakistan solar & inverter quote estimator, order creation, and live order tracking.
 */

class SolisApp {
  constructor() {
    this.currentSlide = 0;
    this.slideInterval = null;
    this.activeCategoryFilter = 'all';
    this.selectedSystemSize = '10 kW';
    this.selectedInverterType = 'hybrid';
    this.selectedBattery = 'lithium';
    this.monthlyBillPKR = 85000;
    this.init();
  }

  async init() {
    await this.loadData();
    // Render all dynamic sections
    this.renderAll();

    // Attach site-wide event handlers
    this.initHeaderScroll();
    this.initHeroSlider();
    this.initModals();
    this.initSearch();
    this.initNewsletter();
    this.initMobileMenu();
    this.initLanguageSelector();
    this.initEstimator();
    this.initOrderTracker();
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
    const defaultOrder = window.DEFAULT_SOLIS_DATA?.orderSettings;
    if (defaultOrder) {
      const current = this.data.orderSettings || {};
      this.data.orderSettings = {
        ...JSON.parse(JSON.stringify(defaultOrder)),
        ...current,
        systems: Array.isArray(current.systems) && current.systems.length ? current.systems : JSON.parse(JSON.stringify(defaultOrder.systems)),
        modules: { ...defaultOrder.modules, ...(current.modules || {}) },
        customModules: Array.isArray(current.customModules) ? current.customModules : [],
        pricedItems: Array.isArray(current.pricedItems) ? current.pricedItems : JSON.parse(JSON.stringify(defaultOrder.pricedItems)),
        customRates: { ...defaultOrder.customRates, ...(current.customRates || {}) }
      };
    }
    window.SOLIS_DATA = this.data;
  }

  getData() {
    return this.data || window.SOLIS_DATA || window.DEFAULT_SOLIS_DATA || {};
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

  renderAll() {
    this.renderCompanyElements();
    this.renderOrderBuilder();
    this.renderHeroSlider();
    this.renderCategories();
    this.renderFeaturedProducts();
    this.renderSolutions();
    this.renderTrustStats();
    this.renderResources();
    this.renderFooter();
    this.applyBrandColor();
  }

  applyBrandColor() {
    const color = this.getData().company?.primaryColor;
    if (!/^#[0-9a-f]{6}$/i.test(color || '')) return;
    document.documentElement.style.setProperty('--solis-brand', color);
    document.querySelectorAll('[style]').forEach(el => {
      if (/#f15a29/i.test(el.style.cssText)) el.style.cssText = el.style.cssText.replace(/#f15a29/gi, color);
    });
  }

  renderOrderBuilder() {
    const config = this.getData().orderSettings || {};
    const defaults = (window.DEFAULT_SOLIS_DATA?.orderSettings || {}).systems || [];
    const systems = Array.isArray(config.systems) && config.systems.length ? config.systems : defaults;
    const grid = document.getElementById('orderSystemSizes');
    if (grid) {
      grid.innerHTML = systems.map((system, index) => `<button type="button" class="size-pill-btn ${index === Math.min(2, systems.length - 1) ? 'active' : ''}" data-size="${this.escapeHtml(system.size)}"><span class="size-pill-val">${this.escapeHtml(system.size)}</span><span class="size-pill-sub">${this.escapeHtml(system.description || '')}</span></button>`).join('');
      this.selectedSystemSize = systems[Math.min(2, systems.length - 1)]?.size || '10 kW';
    }
    const modules = config.modules || { inverter: true, battery: true, monthlyBill: true };
    [['inverter','estInverterType'],['battery','estBatteryType'],['monthlyBill','estMonthlyBill']].forEach(([key,id]) => {
      const el = document.getElementById(id);
      if (el?.closest('.solis-form-group')) el.closest('.solis-form-group').hidden = modules[key] === false;
    });
    const custom = document.getElementById('customOrderModules');
    if (custom) custom.innerHTML = (config.customModules || []).map((module, index) => {
      const options = module.options || [];
      return `<div class="solis-form-group"><label class="solis-label">${this.escapeHtml(module.label || `Question ${index + 1}`)}</label>${options.length ? `<select class="solis-select custom-order-module" data-label="${this.escapeHtml(module.label)}"><option value="">Select</option>${options.map(option => `<option>${this.escapeHtml(option)}</option>`).join('')}</select>` : `<input class="solis-input custom-order-module" data-label="${this.escapeHtml(module.label)}">`}</div>`;
    }).join('');
    const pricedItems = document.getElementById('pricedOrderItems');
    if (pricedItems) pricedItems.innerHTML = (config.pricedItems || []).filter(item => item.active !== false && !/lithium|tubular/i.test(item.label || '')).map(item =>
      `<label class="solis-priced-item"><input type="checkbox" class="priced-order-item" data-label="${this.escapeHtml(item.label)}" data-price="${Number(item.price) || 0}"><span>${this.escapeHtml(item.label)}</span><strong>${this.formatPKR(Number(item.price) || 0)}</strong></label>`
    ).join('');
    const customRate = config.customRates || {};
    const rateHint = document.getElementById('customSizeRateHint');
    if (rateHint) rateHint.textContent = `Custom system pricing: ${this.formatPKR(Number(customRate.minPerKw) || 145000)}–${this.formatPKR(Number(customRate.maxPerKw) || 175000)} per kW`;
    this.bindCustomOrderItems();
  }

  formatPKR(value) { return '₨ ' + Math.max(0, Number(value) || 0).toLocaleString('en-PK'); }

  bindCustomOrderItems() {
    document.querySelectorAll('.priced-order-item').forEach(input => input.addEventListener('change', () => this.recalculateEstimate()));
    const customSize = document.getElementById('customSystemSize');
    customSize?.addEventListener('input', () => {
      if (Number(customSize.value) > 0) document.querySelectorAll('.size-pill-btn').forEach(btn => btn.classList.remove('active'));
      else {
        const selected = Array.from(document.querySelectorAll('.size-pill-btn')).find(btn => btn.dataset.size === this.selectedSystemSize);
        selected?.classList.add('active');
      }
      this.recalculateEstimate();
    });
  }

  escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  // --- Company Branding & Headings ---
  renderCompanyElements() {
    const data = this.getData();
    const comp = data.company || {};
    if (/^#[0-9a-f]{6}$/i.test(comp.primaryColor || '')) {
      document.documentElement.style.setProperty('--solis-brand', comp.primaryColor);
      document.documentElement.style.setProperty('--solis-brand-rgb', [1, 3, 5].map(i => parseInt(comp.primaryColor.slice(i, i + 2), 16)).join(','));
    }

    if (comp.logoUrl) {
      document.querySelectorAll('.solis-logo-link, .footer-logo').forEach(container => {
        if (container.querySelector('.dynamic-company-logo')) return;
        container.querySelectorAll('svg, .solis-logo-text, .solis-logo-badge, .footer-logo-text').forEach(el => el.hidden = true);
        const logo = document.createElement('img');
        logo.className = 'dynamic-company-logo';
        logo.src = comp.logoUrl;
        logo.alt = comp.name || 'Company logo';
        logo.style.cssText = 'max-width:150px;max-height:48px;object-fit:contain';
        container.prepend(logo);
      });
    }

    const hotlineEls = document.querySelectorAll('.dynamic-hotline');
    hotlineEls.forEach(el => {
      el.textContent = comp.hotline || '+92 21 3456 7890';
      if (el.tagName === 'A') el.href = `tel:${(comp.hotline || '922134567890').replace(/[^0-9+]/g, '')}`;
    });

    const waEls = document.querySelectorAll('.dynamic-whatsapp');
    waEls.forEach(el => {
      el.textContent = comp.whatsapp || '+92 300 123 4567';
      const cleanWa = (comp.whatsapp || '923001234567').replace(/[^0-9]/g, '');
      if (el.tagName === 'A') el.href = `https://wa.me/${cleanWa}?text=Hello%20Solis%20Karachi,%20I%20want%20to%20inquire%20about%20solar%20inverters`;
    });

    const sloganEls = document.querySelectorAll('.dynamic-slogan');
    sloganEls.forEach(el => {
      el.textContent = comp.slogan || 'Bankable, Reliable, Local';
    });

    const emailEls = document.querySelectorAll('.dynamic-email');
    emailEls.forEach(el => {
      el.textContent = comp.email || 'pakistan@ginlong.com';
      if (el.tagName === 'A') el.href = `mailto:${comp.email || 'pakistan@ginlong.com'}`;
    });

    const addrEls = document.querySelectorAll('.dynamic-address');
    addrEls.forEach(el => {
      el.textContent = comp.address || 'Suite 402, Business Avenue, Main Shahrah-e-Faisal, Karachi 75400, Pakistan';
    });
  }

  // --- Hero Slider ---
  renderHeroSlider() {
    const data = this.getData();
    const slides = data.heroSlides || [];
    const track = document.getElementById('heroTrack');
    const pagination = document.getElementById('heroPagination');
    if (!track || !pagination) return;

    track.innerHTML = '';
    pagination.innerHTML = '';

    slides.forEach((slide, idx) => {
      const slideEl = document.createElement('div');
      slideEl.className = `hero-slide ${idx === 0 ? 'active' : ''}`;
      slideEl.setAttribute('data-index', idx);
      slideEl.innerHTML = `
        <img class="hero-bg" src="${slide.imageUrl}" alt="${slide.title}" loading="${idx === 0 ? 'eager' : 'lazy'}">
        <div class="hero-overlay"></div>
        <div class="container">
          <div class="hero-content">
            <div class="hero-badge">
              <span>●</span>
              <span data-editable="slide-badge-${idx}">${slide.badge || 'SOLIS PAKISTAN'}</span>
            </div>
            <h1 class="hero-title" data-editable="slide-title-${idx}">${slide.title}</h1>
            <p class="hero-subtitle" data-editable="slide-sub-${idx}">${slide.subtitle}</p>
            <div class="hero-actions">
              <a href="${slide.primaryCta?.link || '#estimate'}" class="btn-solis-primary">
                ${slide.primaryCta?.label || 'Estimate System & Order'} &rarr;
              </a>
              <a href="${slide.secondaryCta?.link || 'tel:+922134567890'}" class="btn-solis-white">
                ${slide.secondaryCta?.label || 'Call Karachi Office'}
              </a>
            </div>
          </div>
        </div>
      `;
      track.appendChild(slideEl);

      const dot = document.createElement('button');
      dot.className = `hero-dot ${idx === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Slide ${idx + 1}`);
      dot.addEventListener('click', () => this.goToSlide(idx));
      pagination.appendChild(dot);
    });

    this.currentSlide = 0;
  }

  initHeroSlider() {
    const prevBtn = document.getElementById('heroPrevBtn');
    const nextBtn = document.getElementById('heroNextBtn');
    const heroWrap = document.querySelector('.solis-hero');

    if (prevBtn) prevBtn.addEventListener('click', () => this.prevSlide());
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextSlide());

    this.startAutoSlide();

    if (heroWrap) {
      heroWrap.addEventListener('mouseenter', () => this.stopAutoSlide());
      heroWrap.addEventListener('mouseleave', () => this.startAutoSlide());
    }

    document.addEventListener('keydown', (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') this.prevSlide();
      if (e.key === 'ArrowRight') this.nextSlide();
    });
  }

  startAutoSlide() {
    this.stopAutoSlide();
    this.slideInterval = setInterval(() => this.nextSlide(), 6500);
  }

  stopAutoSlide() {
    if (this.slideInterval) clearInterval(this.slideInterval);
  }

  goToSlide(idx) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-dot');
    if (!slides.length) return;

    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    this.currentSlide = (idx + slides.length) % slides.length;
    slides[this.currentSlide]?.classList.add('active');
    dots[this.currentSlide]?.classList.add('active');
  }

  nextSlide() {
    this.goToSlide(this.currentSlide + 1);
  }

  prevSlide() {
    this.goToSlide(this.currentSlide - 1);
  }

  // --- 1. Product Categories ---
  renderCategories() {
    const data = this.getData();
    const categories = data.categories || [];
    const container = document.getElementById('categoriesGrid');
    if (!container) return;

    container.innerHTML = categories.map(cat => `
      <div class="category-card" data-cat-name="${cat.name}">
        <div class="category-img-box">
          <img class="category-img" src="${cat.imageUrl}" alt="${cat.name}" loading="lazy">
          <div class="category-count-badge">${cat.count || 'Available'}</div>
        </div>
        <div class="category-body">
          <h3 class="category-name">${cat.name}</h3>
          <p class="category-desc">${cat.shortDesc}</p>
          <a href="#featured" class="category-link" data-filter-to="${cat.name}">
            Explore Category <span>&rarr;</span>
          </a>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('[data-filter-to]').forEach(link => {
      link.addEventListener('click', () => {
        const catName = link.getAttribute('data-filter-to');
        this.setFeaturedFilter(catName);
      });
    });
  }

  // --- 2. Featured Products ---
  renderFeaturedProducts() {
    const data = this.getData();
    const products = data.featuredProducts || [];
    const container = document.getElementById('productsGrid');
    const filterContainer = document.getElementById('featuredFilterBar');
    if (!container) return;

    if (filterContainer && !filterContainer.hasChildNodes()) {
      const categories = ['all', 'Energy Storage Inverter', 'Single Phase PV Inverter', 'Three Phase PV Inverter', 'Utility Scale PV Inverter', 'Accessories'];
      filterContainer.innerHTML = categories.map(cat => `
        <button class="filter-pill ${cat === 'all' ? 'active' : ''}" data-cat="${cat}">
          ${cat === 'all' ? 'All Inverters' : cat.replace(' PV Inverter', '')}
        </button>
      `).join('');

      filterContainer.querySelectorAll('.filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          filterContainer.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeCategoryFilter = btn.getAttribute('data-cat');
          this.filterProductsDisplay();
        });
      });
    }

    container.innerHTML = products.map((prod, idx) => `
      <div class="product-card" data-category="${prod.category}" data-model="${prod.model}">
        <div class="product-card-top">
          <span class="product-badge-tag">${prod.badge || 'NEPRA Approved'}</span>
          <span class="product-category-tag">${prod.category}</span>
          <img class="product-image" src="${prod.imageUrl}" alt="${prod.model}" loading="lazy">
        </div>
        <div class="product-card-body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span class="product-model-code">${prod.model}</span>
            <span style="font-weight:800; color:#059669; font-size:14px;">${prod.pricePKR || ''}</span>
          </div>
          <h3 class="product-card-title">${prod.name}</h3>

          <div class="product-spec-grid">
            <div class="spec-item">
              <span class="spec-label">Peak Efficiency</span>
              <span class="spec-val">${prod.efficiency}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Power Range</span>
              <span class="spec-val">${prod.powerRange}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">MPPT Trackers</span>
              <span class="spec-val">${prod.mpptCount}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Certifications</span>
              <span class="spec-val" style="font-size:10.5px;">${(prod.certifications || 'NEPRA Listed').split(',')[0]}</span>
            </div>
          </div>

          <ul class="product-highlights-list">
            ${(prod.highlights || []).slice(0, 3).map(h => `<li>${h}</li>`).join('')}
          </ul>

          <div class="product-card-footer">
            <button class="btn-view-specs" data-prod-idx="${idx}">
              View Specifications
            </button>
            <button class="btn-solis-primary btn-quote-jump" data-model="${prod.model}" style="padding:8px 14px; font-size:12px;">
              Get Quote
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Spec Modal triggers
    container.querySelectorAll('.btn-view-specs').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-prod-idx'), 10);
        this.openSpecModal(products[i]);
      });
    });

    // "Get Quote" button -> scrolls to Estimate Order section and preselects the model
    container.querySelectorAll('.btn-quote-jump').forEach(btn => {
      btn.addEventListener('click', () => {
        const model = btn.getAttribute('data-model');
        const estSec = document.getElementById('estimate');
        if (estSec) {
          estSec.scrollIntoView({ behavior: 'smooth' });
          const modelSelect = document.getElementById('estInverterModel');
          if (modelSelect) {
            let found = false;
            for (let opt of modelSelect.options) {
              if (opt.value.includes(model) || model.includes(opt.value)) {
                opt.selected = true;
                found = true;
                break;
              }
            }
            if (!found) {
              const opt = new Option(model, model, true, true);
              modelSelect.add(opt);
            }
          }
          this.recalculateEstimate();
        }
      });
    });

    this.filterProductsDisplay();
  }

  setFeaturedFilter(catName) {
    const filterContainer = document.getElementById('featuredFilterBar');
    if (!filterContainer) return;
    const btn = filterContainer.querySelector(`[data-cat="${catName}"]`);
    if (btn) {
      filterContainer.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.activeCategoryFilter = catName;
      this.filterProductsDisplay();
    }
  }

  filterProductsDisplay() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      const cat = card.getAttribute('data-category');
      if (this.activeCategoryFilter === 'all' || cat === this.activeCategoryFilter) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // --- 3. Solutions Section ---
  renderSolutions() {
    const data = this.getData();
    const solutions = data.solutions || [];
    const container = document.getElementById('solutionsWrapper');
    if (!container) return;

    container.innerHTML = solutions.map(sol => `
      <div class="solution-card">
        <div class="solution-img-box">
          <img class="solution-img" src="${sol.imageUrl}" alt="${sol.title}" loading="lazy">
          <div class="solution-badge">Pakistan Ready</div>
        </div>
        <div class="solution-body">
          <h3 class="solution-title">${sol.title}</h3>
          <div class="solution-subtitle">${sol.subtitle}</div>
          <p class="solution-desc">${sol.description}</p>
          <ul class="solution-bullets">
            ${(sol.features || []).map(f => `
              <li>
                <span class="bullet-icon">●</span>
                <span>${f}</span>
              </li>
            `).join('')}
          </ul>
          <div>
            <a href="#estimate" class="btn-solis-secondary" style="padding:10px 18px; font-size:13px;">
              ${sol.cta || 'Estimate System'} &rarr;
            </a>
          </div>
        </div>
      </div>
    `).join('');
  }

  // --- 4. Trust & Stats Bar ---
  renderTrustStats() {
    const data = this.getData();
    const trust = data.trustStats || {};
    const metrics = trust.metrics || [];
    const container = document.getElementById('trustMetricsGrid');
    if (!container) return;

    container.innerHTML = metrics.map(m => `
      <div class="metric-card">
        <div class="metric-val">${m.value}</div>
        <div class="metric-lbl">${m.label}</div>
        <div class="metric-dtl">${m.detail}</div>
      </div>
    `).join('');
  }

  // --- 5. Quick Links / Resources ---
  renderResources() {
    const data = this.getData();
    const resources = (data.resources || []).filter(res => {
      const publicLabel = [res.title, res.linkText, res.linkUrl].join(' ').toLowerCase();
      return !publicLabel.includes('soliscloud');
    });
    const container = document.getElementById('resourcesGrid');
    if (!container) return;

    const icons = {
      'video': '▶️',
      'file-text': '📄',
      'cloud': '☁️',
      'layout': '📐',
      'shield-check': '🛡️'
    };

    container.innerHTML = resources.map(res => `
      <div class="resource-card">
        <div class="resource-icon-circle">
          ${icons[res.icon] || '⚡'}
        </div>
        <h4 class="resource-title">${res.title}</h4>
        <p class="resource-desc">${res.description}</p>
        <a href="${res.linkUrl}" class="resource-link">
          ${res.linkText} &rarr;
        </a>
      </div>
    `).join('');
  }

  // --- Footer ---
  renderFooter() {
    const yearEls = document.querySelectorAll('.dynamic-year');
    yearEls.forEach(el => el.textContent = new Date().getFullYear());
  }

  // --- Sticky Header Scroll ---
  initHeaderScroll() {
    const header = document.querySelector('.solis-header');
    if (!header) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // --- ESTIMATE ORDER CALCULATOR & SYSTEM QUOTATION ---
  initEstimator() {
    const sizeBtns = document.querySelectorAll('.size-pill-btn');
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sizeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (document.getElementById('customSystemSize')) document.getElementById('customSystemSize').value = '';
        this.selectedSystemSize = btn.getAttribute('data-size');
        this.recalculateEstimate();
      });
    });

    const inverterSelect = document.getElementById('estInverterType');
    const batterySelect = document.getElementById('estBatteryType');
    const billInput = document.getElementById('estMonthlyBill');

    inverterSelect?.addEventListener('change', () => this.recalculateEstimate());
    batterySelect?.addEventListener('change', () => this.recalculateEstimate());
    billInput?.addEventListener('input', () => this.recalculateEstimate());

    // Order form submit
    const form = document.getElementById('estimateOrderForm');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleOrderSubmit();
    });

    this.recalculateEstimate();
  }

  recalculateEstimate() {
    const customKw = Number(document.getElementById('customSystemSize')?.value) || 0;
    const sizeStr = customKw > 0 ? `${customKw} kW` : (this.selectedSystemSize || '10 kW');
    const kw = parseFloat(sizeStr.replace(/[^0-9.]/g, '')) || 10;
    const inverterType = document.getElementById('estInverterType')?.value || 'hybrid';

    // Calculation formulas for Karachi / Pakistan:
    // Avg 4.5 Peak Sun Hours * 30 days = ~135-140 kWh/kW/month
    const monthlyUnits = Math.round(kw * 140);
    // Average K-Electric residential blended rate: PKR 62/unit
    const monthlySavings = Math.round(monthlyUnits * 62);

    let recModel = 'S6-EH1P10K-H-PK Hybrid Storage';
    let minCost = kw * 145000;
    let maxCost = kw * 175000;

    if (kw <= 4) {
      recModel = inverterType === 'hybrid' ? 'S6-EH1P3.8K-H Hybrid' : 'S6-GR1P3.6K Single Phase';
      minCost = 450000;
      maxCost = 650000;
    } else if (kw <= 6) {
      recModel = inverterType === 'hybrid' ? 'S6-EH1P6K-H-PK Hybrid' : 'S6-GR1P5K Single Phase';
      minCost = 750000;
      maxCost = 980000;
    } else if (kw <= 12) {
      recModel = inverterType === 'hybrid' ? 'S6-EH1P10K-H Whole-Home Hybrid' : 'S6-GR3P10K Three-Phase Net Metering';
      minCost = 1450000;
      maxCost = 1850000;
    } else if (kw <= 20) {
      recModel = 'S6-GR3P15K-20K Three Phase Net Metering';
      minCost = 2400000;
      maxCost = 2950000;
    } else {
      recModel = 'S5-GC(50-100)K Commercial Inverter';
      minCost = kw * 115000;
      maxCost = kw * 140000;
    }

    const orderConfig = this.getData().orderSettings || {};
    const selectedSystem = customKw > 0 ? null : (orderConfig.systems || []).find(system => system.size === this.selectedSystemSize);
    if (customKw > 0) {
      const rates = orderConfig.customRates || {};
      minCost = kw * (Number(rates.minPerKw) || 145000);
      maxCost = kw * (Number(rates.maxPerKw) || 175000);
      recModel = `Custom ${kw} kW solar system (${inverterType === 'hybrid' ? 'Hybrid' : inverterType === 'ongrid' ? 'Three-Phase On-Grid' : 'Single-Phase On-Grid'})`;
    } else if (selectedSystem && Number.isFinite(Number(selectedSystem.minPrice))) {
      minCost = Math.max(0, Number(selectedSystem.minPrice));
      maxCost = Number.isFinite(Number(selectedSystem.maxPrice)) ? Math.max(minCost, Number(selectedSystem.maxPrice)) : minCost;
    }
    document.querySelectorAll('.priced-order-item:checked').forEach(item => {
      const price = Math.max(0, Number(item.dataset.price) || 0);
      minCost += price;
      maxCost += price;
    });
    const batterySelectEl = document.getElementById('estBatteryType');
    const selectedBattery = batterySelectEl?.closest('.solis-form-group')?.hidden ? 'none' : (batterySelectEl?.value || 'none');
    const batteryPriceItem = (orderConfig.pricedItems || []).find(item => item.active !== false && (selectedBattery === 'lithium' ? /lithium/i.test(item.label || '') : selectedBattery === 'tubular' ? /tubular/i.test(item.label || '') : false));
    if (batteryPriceItem) {
      minCost += Number(batteryPriceItem.price) || 0;
      maxCost += Number(batteryPriceItem.price) || 0;
    }

    const fmtPKR = (num) => '₨ ' + num.toLocaleString('en-PK');

    // Update result labels
    const genEl = document.getElementById('calcMonthlyUnits');
    const savEl = document.getElementById('calcMonthlySavings');
    const modelEl = document.getElementById('calcRecModel');
    const costEl = document.getElementById('calcEstCost');

    if (genEl) genEl.textContent = `~${monthlyUnits.toLocaleString()} Units (kWh) / Month`;
    if (savEl) savEl.textContent = `${fmtPKR(monthlySavings)} / Month`;
    if (modelEl) modelEl.textContent = recModel;
    if (costEl) costEl.textContent = `${fmtPKR(minCost)} – ${fmtPKR(maxCost)}`;

    // Update hidden order inputs
    const hiddenModel = document.getElementById('orderInverterModelHidden');
    const hiddenCost = document.getElementById('orderCostHidden');
    if (hiddenModel) hiddenModel.value = recModel;
    if (hiddenCost) hiddenCost.value = `${fmtPKR(minCost)} – ${fmtPKR(maxCost)}`;
  }

  async handleOrderSubmit() {
    const name = document.getElementById('orderCustomerName')?.value.trim();
    const phone = document.getElementById('orderPhone')?.value.trim();
    const city = document.getElementById('orderCity')?.value || 'Karachi';
    const area = document.getElementById('orderArea')?.value.trim();
    const bill = document.getElementById('estMonthlyBill')?.value || 'PKR 85,000 / Month';
    const notes = document.getElementById('orderNotes')?.value.trim();
    const customSystemSize = document.getElementById('customSystemSize')?.value || '';
    const size = customSystemSize ? `${customSystemSize} kW (Custom)` : (this.selectedSystemSize || '10 kW');
    const batterySelect = document.getElementById('estBatteryType');
    const batteryHidden = batterySelect?.closest('.solis-form-group')?.hidden;
    const battery = batteryHidden ? 'No Battery' : (batterySelect?.selectedOptions[0]?.text || 'No Battery');
    const inverterModel = document.getElementById('orderInverterModelHidden')?.value || 'Solis S6 Hybrid Inverter';
    const cost = document.getElementById('orderCostHidden')?.value || 'PKR 1,500,000';

    if (!name || !phone) {
      alert('Please enter your full name and phone/WhatsApp number');
      return;
    }

    const selectedItems = Array.from(document.querySelectorAll('.priced-order-item:checked')).map(item => ({ label: item.dataset.label, price: Number(item.dataset.price) || 0 }));
    const batteryKey = batteryHidden ? 'none' : (batterySelect?.value || 'none');
    const configuredBattery = (this.getData().orderSettings?.pricedItems || []).find(item => item.active !== false && (batteryKey === 'lithium' ? /lithium/i.test(item.label || '') : batteryKey === 'tubular' ? /tubular/i.test(item.label || '') : false));
    if (configuredBattery) selectedItems.push({ label: configuredBattery.label, price: Number(configuredBattery.price) || 0 });
    const payload = {
      customerName: name,
      phone: phone,
      city: city,
      area: area || city,
      systemSize: size,
      inverterModel: inverterModel,
      monthlyBill: bill,
      batteryType: battery,
      estimatedCost: cost,
      notes: notes,
      customSystemSize,
      selectedItems,
      customModules: Array.from(document.querySelectorAll('.custom-order-module')).reduce((all, el) => { all[el.dataset.label] = el.value.trim(); return all; }, {})
    };

    let orderId = 'PK-ORD-' + Math.floor(1000 + Math.random() * 9000);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const d = await res.json();
        if (d.orderId) orderId = d.orderId;
      }
    } catch (e) {
      // Offline / local storage fallback
      const orders = JSON.parse(localStorage.getItem('solis_orders') || '[]');
      payload.id = orderId;
      payload.status = 'Pending';
      payload.createdAt = new Date().toISOString();
      orders.unshift(payload);
      localStorage.setItem('solis_orders', JSON.stringify(orders));
    }

    // Open Order Confirmation Modal
    this.openOrderConfirmationModal(orderId, payload);
  }

  openOrderConfirmationModal(orderId, orderData) {
    const modal = document.getElementById('orderSuccessModalBackdrop');
    if (!modal) return;

    document.getElementById('successOrderId').textContent = orderId;
    document.getElementById('successCustomerName').textContent = orderData.customerName;
    document.getElementById('successSystemDetail').textContent = `${orderData.systemSize} • ${orderData.inverterModel}`;
    document.getElementById('successEstimatedCost').textContent = orderData.estimatedCost;

    const cleanPhone = (orderData.phone || '').replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(`Assalam-o-Alaikum, I have submitted an order on Solis Pakistan website with Tracking ID: ${orderId} for a ${orderData.systemSize} solar system in ${orderData.area}. Please confirm availability and quotation.`);

    const waBtn = document.getElementById('successWhatsAppBtn');
    if (waBtn) {
      waBtn.href = `https://wa.me/923001234567?text=${waText}`;
    }

    const trackBtn = document.getElementById('successTrackOrderBtn');
    if (trackBtn) {
      trackBtn.onclick = () => {
        modal.classList.remove('open');
        const trackInput = document.getElementById('trackingIdInput');
        if (trackInput) {
          trackInput.value = orderId;
          this.trackOrderById(orderId);
          document.getElementById('estimate-track')?.scrollIntoView({ behavior: 'smooth' });
        }
      };
    }

    modal.classList.add('open');
  }

  // --- Order Tracking Logic ---
  initOrderTracker() {
    const trackBtn = document.getElementById('trackOrderSubmitBtn');
    const input = document.getElementById('trackingIdInput');

    trackBtn?.addEventListener('click', () => {
      const id = input.value.trim();
      if (!id) {
        alert('Please enter your Tracking ID (e.g. PK-ORD-8821)');
        return;
      }
      this.trackOrderById(id);
    });
  }

  async trackOrderById(orderId) {
    const resultBox = document.getElementById('trackingStatusResult');
    if (!resultBox) return;

    resultBox.style.display = 'block';
    resultBox.innerHTML = `<div style="text-align:center; padding:20px; color:#6b7280;">🔍 Looking up order <strong>${orderId}</strong>...</div>`;

    let order = null;
    try {
      const res = await fetch(`/api/orders/track?id=${encodeURIComponent(orderId)}`);
      if (res.ok) {
        order = await res.json();
      }
    } catch (e) {}

    if (!order) {
      const local = JSON.parse(localStorage.getItem('solis_orders') || '[]');
      order = local.find(o => o.id?.toUpperCase() === orderId.toUpperCase());
    }

    if (!order) {
      resultBox.innerHTML = `
        <div style="background:#FEE2E2; border:1px solid #FCA5A5; color:#991B1B; padding:16px; border-radius:8px;">
          <strong>Order Not Found:</strong> No solar order found with ID "${orderId}". Please verify your Tracking ID or contact our Karachi office via WhatsApp at +92 300 123 4567.
        </div>
      `;
      return;
    }

    // Determine stepper progress
    const steps = [
      { key: 'Pending', label: '1. Order Received' },
      { key: 'Contacted', label: '2. WhatsApp Contact' },
      { key: 'Survey Scheduled', label: '3. Site Survey' },
      { key: 'Invoiced in Khata', label: '4. Order Verified & Processed' },
      { key: 'Completed', label: '5. Turnkey Installed' }
    ];

    const currentStatus = order.status || 'Pending';
    let activeStepIdx = 0;
    if (currentStatus === 'Contacted') activeStepIdx = 1;
    else if (currentStatus === 'Survey Scheduled') activeStepIdx = 2;
    else if (currentStatus === 'Invoiced in Khata' || currentStatus === 'In Progress') activeStepIdx = 3;
    else if (currentStatus === 'Completed') activeStepIdx = 4;

    resultBox.innerHTML = `
      <div style="border:1px solid #E5E7EB; border-radius:8px; padding:20px; background:#F8F9FA;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
          <div>
            <span style="font-size:12px; color:#6b7280;">ORDER TRACKING ID:</span>
            <strong style="color:#F15A29; font-size:18px; font-family:monospace; margin-left:6px;">${order.id}</strong>
          </div>
          <span style="background:#FFF1EB; color:#F15A29; border:1px solid rgba(241,90,41,0.3); padding:4px 12px; border-radius:20px; font-weight:700; font-size:12px;">
            Status: ${currentStatus}
          </span>
        </div>

        <div class="tracking-timeline">
          ${steps.map((s, idx) => {
            let cls = '';
            if (idx < activeStepIdx) cls = 'done';
            else if (idx === activeStepIdx) cls = 'current';
            return `
              <div class="tracking-step ${cls}">
                <div class="tracking-step-dot">${idx < activeStepIdx ? '✓' : idx + 1}</div>
                <div class="tracking-step-label">${s.label}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="margin-top:24px; padding-top:16px; border-top:1px solid #E5E7EB; display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; font-size:13px;">
          <div><span style="color:#6b7280;">Customer:</span> <strong>${order.customerName}</strong></div>
          <div><span style="color:#6b7280;">System:</span> <strong>${order.systemSize} (${order.inverterModel})</strong></div>
          <div><span style="color:#6b7280;">Location:</span> <strong>${order.area || order.city}</strong></div>
          <div><span style="color:#6b7280;">Est. Cost:</span> <strong style="color:#059669;">${order.estimatedCost}</strong></div>
        </div>

        <div style="margin-top:16px; display:flex; justify-content:flex-start; align-items:center; flex-wrap:wrap; gap:10px;">
          <a href="https://wa.me/923001234567?text=${encodeURIComponent(`Regarding my Solis Pakistan order ${order.id}...`)}" target="_blank" class="btn-whatsapp-solid" style="padding:8px 16px; font-size:13px;">
            💬 Chat with Assigned Engineer on WhatsApp
          </a>
        </div>
      </div>
    `;
  }

  // --- Modals (Spec Details, Online Service, Language, Search) ---
  initModals() {
    document.querySelectorAll('.solis-modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('open');
        }
      });
    });

    document.querySelectorAll('.solis-modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.solis-modal-backdrop')?.classList.remove('open');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.solis-modal-backdrop.open').forEach(b => b.classList.remove('open'));
      }
    });

    // Online Service Button
    const serviceBtns = document.querySelectorAll('.btn-online-service');
    serviceBtns.forEach(b => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('serviceModalBackdrop')?.classList.add('open');
      });
    });

    // Service Ticket Form submit
    document.getElementById('serviceTicketForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      document.getElementById('serviceModalBackdrop')?.classList.remove('open');
      this.toast('Service request submitted! Solis Karachi engineering team will contact you shortly.');
    });
  }

  openSpecModal(prod) {
    if (!prod) return;
    const modal = document.getElementById('specModalBackdrop');
    if (!modal) return;

    document.getElementById('specModalTitle').textContent = `${prod.model} Technical Specifications`;
    document.getElementById('specModalImage').src = prod.imageUrl;
    document.getElementById('specModalImage').alt = prod.model;

    const tableBody = document.getElementById('specModalTableBody');
    tableBody.innerHTML = `
      <tr><td>Model Code</td><td>${prod.model}</td></tr>
      <tr><td>Product Name</td><td>${prod.name}</td></tr>
      <tr><td>Estimated Price (PKR)</td><td style="color:#059669; font-weight:800;">${prod.pricePKR || 'Contact for Quote'}</td></tr>
      <tr><td>Category</td><td>${prod.category}</td></tr>
      <tr><td>Rated Power</td><td>${prod.powerRange}</td></tr>
      <tr><td>Peak Efficiency</td><td>${prod.efficiency}</td></tr>
      <tr><td>MPPT Trackers</td><td>${prod.mpptCount}</td></tr>
      <tr><td>Battery Compatibility</td><td>${prod.batteryVoltage || 'N/A'}</td></tr>
      <tr><td>Transfer Switching Time</td><td>${prod.switchTime || '< 10 ms'}</td></tr>
      <tr><td>Standard Warranty</td><td>${prod.warranty || '10 Years Official Warranty'}</td></tr>
      <tr><td>Grid Standard & Safety</td><td>${prod.certifications || 'NEPRA Approved, UL 1741 SB, K-Electric'}</td></tr>
    `;

    document.getElementById('specModalDesc').textContent = prod.description;

    const downloadBtn = document.getElementById('specDownloadDatasheetBtn');
    if (downloadBtn) {
      downloadBtn.onclick = () => {
        this.toast(`Downloading official datasheet: ${prod.model}_Pakistan_Datasheet.pdf`);
      };
    }

    const orderBtn = document.getElementById('specOrderNowBtn');
    if (orderBtn) {
      orderBtn.onclick = () => {
        modal.classList.remove('open');
        document.getElementById('estimate')?.scrollIntoView({ behavior: 'smooth' });
      };
    }

    modal.classList.add('open');
  }

  // --- Live Search ---
  initSearch() {
    const searchTrigger = document.getElementById('searchTriggerBtn');
    const searchModal = document.getElementById('searchModalBackdrop');
    const searchInput = document.getElementById('searchInputField');
    const searchResults = document.getElementById('searchResultsList');

    if (searchTrigger && searchModal) {
      searchTrigger.addEventListener('click', () => {
        searchModal.classList.add('open');
        setTimeout(() => searchInput?.focus(), 100);
      });
    }

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchModal?.classList.add('open');
        setTimeout(() => searchInput?.focus(), 100);
      }
    });

    if (searchInput && searchResults) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
          searchResults.innerHTML = `<div style="padding:16px; color:#9ca3af; text-align:center; font-size:13px;">Type a model name (e.g. S6, Hybrid, Storage, 10K, Karachi, K-Electric)</div>`;
          return;
        }

        const data = this.getData();
        const products = (data.featuredProducts || []).filter(p =>
          p.model.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
        );

        const solutions = (data.solutions || []).filter(s =>
          s.title.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query)
        );

        if (!products.length && !solutions.length) {
          searchResults.innerHTML = `<div style="padding:16px; color:#9ca3af; text-align:center; font-size:13px;">No matching solar inverters found for "${query}".</div>`;
          return;
        }

        let html = '';
        products.forEach(p => {
          html += `
            <div class="search-item" data-type="product" data-model="${p.model}">
              <div>
                <strong style="color:#F15A29; font-size:14px;">${p.model}</strong>
                <div style="font-size:12.5px; color:#1f2937;">${p.name}</div>
                <div style="font-size:11px; color:#6b7280;">${p.category} • ${p.powerRange} • <strong style="color:#059669;">${p.pricePKR || ''}</strong></div>
              </div>
              <span style="font-size:12px; color:#F15A29; font-weight:600;">View Specs &rarr;</span>
            </div>
          `;
        });

        solutions.forEach(s => {
          html += `
            <div class="search-item" data-type="solution">
              <div>
                <strong style="color:#111827; font-size:14px;">${s.title}</strong>
                <div style="font-size:12px; color:#6b7280;">${s.subtitle}</div>
              </div>
              <span style="font-size:12px; color:#F15A29; font-weight:600;">Explore &rarr;</span>
            </div>
          `;
        });

        searchResults.innerHTML = html;

        searchResults.querySelectorAll('.search-item[data-type="product"]').forEach(item => {
          item.addEventListener('click', () => {
            searchModal.classList.remove('open');
            const model = item.getAttribute('data-model');
            const prod = (data.featuredProducts || []).find(p => p.model === model);
            if (prod) this.openSpecModal(prod);
          });
        });

        searchResults.querySelectorAll('.search-item[data-type="solution"]').forEach(item => {
          item.addEventListener('click', () => {
            searchModal.classList.remove('open');
            document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' });
          });
        });
      });
    }
  }

  // --- Newsletter Signup ---
  initNewsletter() {
    const form = document.getElementById('newsletterForm');
    const input = document.getElementById('newsletterEmail');
    if (!form || !input) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!email || !email.includes('@')) {
        alert('Please provide a valid email address.');
        return;
      }

      let success = false;
      let msg = 'Thank you for subscribing to Solis Pakistan news!';

      try {
        const res = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'Pakistan Karachi Hub' })
        });
        if (res.ok) {
          const data = await res.json();
          success = true;
          msg = data.message || msg;
        }
      } catch (err) {
        const subs = JSON.parse(localStorage.getItem('solis_subscribers') || '[]');
        if (!subs.some(s => s.email === email)) {
          subs.unshift({ email, subscribedAt: new Date().toISOString(), source: 'Local Web' });
          localStorage.setItem('solis_subscribers', JSON.stringify(subs));
        }
        success = true;
      }

      if (success) {
        input.value = '';
        this.toast(msg);
      }
    });
  }

  // --- Mobile Menu Drawer ---
  initMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const drawer = document.getElementById('mobileNavDrawer');
    const closeBtn = document.getElementById('closeMobileNavBtn');

    if (toggle && drawer) {
      toggle.addEventListener('click', () => drawer.classList.add('open'));
      closeBtn?.addEventListener('click', () => drawer.classList.remove('open'));
      drawer.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => drawer.classList.remove('open'));
      });
    }
  }

  // --- Language / Region Selector ---
  initLanguageSelector() {
    const btn = document.getElementById('langSelectorBtn');
    const modal = document.getElementById('langModalBackdrop');
    if (btn && modal) {
      btn.addEventListener('click', () => modal.classList.add('open'));
      modal.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', () => {
          modal.classList.remove('open');
          const lang = opt.getAttribute('data-lang');
          this.toast(`Region selected: ${lang}`);
        });
      });
    }
  }
}

// Start application
window.addEventListener('DOMContentLoaded', () => {
  window.solisApp = new SolisApp();
});

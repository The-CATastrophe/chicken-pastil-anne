/* ============================================================
   Chicken Pastil-Anne — app.js
   Vanilla JS, no dependencies
   ============================================================ */

'use strict';

/* ── State ── */
let MENU   = null;   // loaded from data/menu.json
let cart   = {};     // { itemId: { item, qty } }
let isMobile = window.innerWidth <= 860;

/* ── DOM references ── */
const $ = id => document.getElementById(id);

/* ============================================================
   BOOT — load menu, restore cart, render
   ============================================================ */
async function init() {
  try {
    const res  = await fetch('/data/menu.json');
    MENU       = await res.json();
    window.MENU = MENU; // expose for footer script
    window.dispatchEvent(new Event('menu-loaded'));
  } catch (e) {
    console.error('Failed to load menu:', e);
    return;
  }

  restoreCart();
  renderHeader();
  renderCategoryNav();
  renderMenu();
  renderOpenStatus();
  bindEvents();
  updateCartUI();
}

/* ============================================================
   HEADER
   ============================================================ */
function renderHeader() {
  const r = MENU.restaurant;
  document.title = r.name + ' — Online Order';

  // Hero badges
  const badgeArea = $('hero-badges');
  if (!badgeArea) return;
  const items = [
    { icon: iconPhone(), text: r.phone },
    { icon: iconPin(),   text: r.address },
    { icon: iconFB(),    text: 'fb: ' + r.facebook },
    { icon: iconQR(),    text: 'Scan QR',  href: 'qr.html' }
  ];
  badgeArea.innerHTML = items.map(b =>
    `<${b.href ? `a href="${b.href}"` : 'span'} class="hero-badge">
      ${b.icon}<span>${b.text}</span>
    </${b.href ? 'a' : 'span'}>`
  ).join('');
}

/* ============================================================
   OPEN STATUS
   ============================================================ */
function renderOpenStatus() {
  const r      = MENU.restaurant;
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const day    = days[new Date().getDay()];
  const hours  = r.hours[day];
  const closed = !hours || hours === 'CLOSED';

  const dot    = $('status-dot');
  const label  = $('status-label');
  if (!dot || !label) return;

  if (closed) {
    dot.className   = 'status-dot closed';
    label.textContent = 'Closed today';
  } else {
    dot.className   = 'status-dot';
    label.textContent = `Open today · ${hours}`;
  }
}

/* ============================================================
   CATEGORY NAV
   ============================================================ */
function renderCategoryNav() {
  const nav = $('category-nav-inner');
  if (!nav || !MENU) return;

  nav.innerHTML = MENU.categories.map((cat, i) =>
    `<button class="cat-btn${i === 0 ? ' active' : ''}"
             data-cat="${cat.id}"
             onclick="scrollToSection('${cat.id}')">
      ${getCatIcon(cat.icon)}
      <span>${cat.name}</span>
    </button>`
  ).join('');
}

function scrollToSection(catId) {
  const el = document.getElementById('section-' + catId);
  if (!el) return;
  const navH = document.querySelector('.category-nav')?.offsetHeight || 0;
  const top  = el.getBoundingClientRect().top + window.scrollY - navH - 8;
  window.scrollTo({ top, behavior: 'smooth' });
}

/* ── Auto-highlight nav on scroll ── */
function setupScrollSpy() {
  const sections = document.querySelectorAll('.category-section');
  const buttons  = document.querySelectorAll('.cat-btn');
  const navH     = document.querySelector('.category-nav')?.offsetHeight || 50;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id.replace('section-', '');
        buttons.forEach(b => b.classList.toggle('active', b.dataset.cat === id));
        // scroll nav button into view
        const activeBtn = document.querySelector(`.cat-btn[data-cat="${id}"]`);
        activeBtn?.scrollIntoView({ block: 'nearest', inline: 'center' });
      }
    });
  }, { rootMargin: `-${navH + 10}px 0px -60% 0px` });

  sections.forEach(s => obs.observe(s));
}

/* ============================================================
   MENU RENDER
   ============================================================ */
function renderMenu() {
  const container = $('menu-container');
  if (!container || !MENU) return;

  container.innerHTML = MENU.categories.map(cat => `
    <section class="category-section" id="section-${cat.id}">
      <div class="section-header">
        <h2>${cat.name}</h2>
        ${cat.subtitle ? `<p>${cat.subtitle}</p>` : ''}
      </div>
      <div class="items-grid">
        ${cat.items.map(item => renderItemCard(item)).join('')}
      </div>
    </section>
  `).join('');

  setupScrollSpy();
  updateCartUI(); // re-apply cart quantities
}

function renderItemCard(item) {
  const inCart = cart[item.id] ? cart[item.id].qty : 0;
  const badge  = item.badge
    ? `<span class="item-badge${item.badge === 'Bestseller' ? ' red' : ''}">${item.badge}</span>`
    : '';

  const controls = inCart > 0
    ? `<div class="qty-controls" id="qc-${item.id}">
         <button class="qty-btn" onclick="changeQty('${item.id}',-1)">&#8722;</button>
         <span class="qty-display" id="qty-${item.id}">${inCart}</span>
         <button class="qty-btn" onclick="changeQty('${item.id}',1)">&#43;</button>
       </div>`
    : `<button class="add-btn" id="add-${item.id}" onclick="addToCart('${item.id}')">
         ${iconPlus()}<span>Add</span>
       </button>`;

  return `
    <div class="menu-card${item.available ? '' : ' unavailable'}" id="card-${item.id}">
      ${badge}
      <div class="item-name">${item.name}</div>
      <div class="item-desc">${item.description}</div>
      <div class="item-footer">
        <span class="item-price">${MENU.restaurant.currency}${item.price.toFixed(2)}</span>
        <div id="ctrl-${item.id}">${controls}</div>
      </div>
    </div>`;
}

/* ── Refresh a single card's controls ── */
function refreshItemControl(itemId) {
  const ctrl   = $('ctrl-' + itemId);
  if (!ctrl) return;
  const inCart = cart[itemId] ? cart[itemId].qty : 0;

  if (inCart > 0) {
    ctrl.innerHTML =
      `<div class="qty-controls" id="qc-${itemId}">
         <button class="qty-btn" onclick="changeQty('${itemId}',-1)">&#8722;</button>
         <span class="qty-display" id="qty-${itemId}">${inCart}</span>
         <button class="qty-btn" onclick="changeQty('${itemId}',1)">&#43;</button>
       </div>`;
  } else {
    ctrl.innerHTML =
      `<button class="add-btn" id="add-${itemId}" onclick="addToCart('${itemId}')">
         ${iconPlus()}<span>Add</span>
       </button>`;
  }
}

/* ============================================================
   CART LOGIC
   ============================================================ */
function findItem(id) {
  for (const cat of MENU.categories)
    for (const item of cat.items)
      if (item.id === id) return item;
  return null;
}

function addToCart(id) {
  const item = findItem(id);
  if (!item) return;
  if (cart[id]) cart[id].qty++;
  else cart[id] = { item, qty: 1 };
  saveCart();
  refreshItemControl(id);
  updateCartUI();
  showToast(`${item.name} added to cart`);
}

function changeQty(id, delta) {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) {
    delete cart[id];
    showToast('Item removed');
  }
  saveCart();
  refreshItemControl(id);
  updateCartUI();
}

function clearCart() {
  cart = {};
  saveCart();
  // Re-render all item controls
  MENU.categories.forEach(cat =>
    cat.items.forEach(item => refreshItemControl(item.id))
  );
  updateCartUI();
  showToast('Cart cleared');
}

/* ── Persist ── */
function saveCart() {
  localStorage.setItem('pastil_cart', JSON.stringify(cart));
}
function restoreCart() {
  try {
    const saved = localStorage.getItem('pastil_cart');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Re-hydrate item references from current menu
      Object.keys(parsed).forEach(id => {
        const item = findItem(id);
        if (item) cart[id] = { item, qty: parsed[id].qty };
      });
    }
  } catch(e) {}
}

/* ── Totals ── */
function cartTotals(orderType) {
  const subtotal = Object.values(cart)
    .reduce((sum, e) => sum + e.item.price * e.qty, 0);
  const delivery = orderType === 'Delivery' ? MENU.restaurant.deliveryFee : 0;
  return { subtotal, delivery, total: subtotal + delivery };
}
function cartItemCount() {
  return Object.values(cart).reduce((s, e) => s + e.qty, 0);
}

/* ============================================================
   CART UI
   ============================================================ */
function updateCartUI() {
  const count    = cartItemCount();
  const { subtotal, total } = cartTotals('Delivery');
  const cur      = MENU.restaurant.currency;
  const isEmpty  = count === 0;

  // ── Sidebar
  const sideItems  = $('sidebar-cart-items');
  const sideEmpty  = $('sidebar-cart-empty');
  const sideFooter = $('sidebar-cart-footer');
  const sideSub    = $('sidebar-subtotal');
  const sideTotal  = $('sidebar-total');
  const sideCount  = $('sidebar-count');

  if (sideItems) {
    if (isEmpty) {
      sideEmpty  && (sideEmpty.style.display   = 'flex');
      sideFooter && (sideFooter.style.display  = 'none');
      sideItems.innerHTML = '';
    } else {
      sideEmpty  && (sideEmpty.style.display   = 'none');
      sideFooter && (sideFooter.style.display  = 'flex');
      sideItems.innerHTML = cartItemsHTML();
    }
  }
  if (sideSub)   sideSub.textContent   = cur + subtotal.toFixed(2);
  if (sideTotal) sideTotal.textContent = cur + total.toFixed(2);
  if (sideCount) sideCount.textContent = count + ' item' + (count !== 1 ? 's' : '');

  // ── Drawer (mobile)
  const drawItems  = $('drawer-cart-items');
  const drawEmpty  = $('drawer-cart-empty');
  const drawFooter = $('drawer-cart-footer');
  const drawSub    = $('drawer-subtotal');
  const drawTotal  = $('drawer-total');

  if (drawItems) {
    if (isEmpty) {
      drawEmpty  && (drawEmpty.style.display  = 'flex');
      drawFooter && (drawFooter.style.display = 'none');
      drawItems.innerHTML = '';
    } else {
      drawEmpty  && (drawEmpty.style.display  = 'none');
      drawFooter && (drawFooter.style.display = 'flex');
      drawItems.innerHTML = cartItemsHTML();
    }
  }
  if (drawSub)   drawSub.textContent   = cur + subtotal.toFixed(2);
  if (drawTotal) drawTotal.textContent = cur + total.toFixed(2);

  // ── Mobile bar
  const mobileBar  = $('mobile-cart-bar');
  const mobileQty  = $('mobile-cart-qty');
  const mobileAmt  = $('mobile-cart-amount');
  if (mobileBar) mobileBar.classList.toggle('visible', !isEmpty);
  if (mobileQty) mobileQty.textContent = count + ' item' + (count !== 1 ? 's' : '');
  if (mobileAmt) mobileAmt.textContent = cur + subtotal.toFixed(2);

  // ── Header badge
  const badge = $('cart-count-badge');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('visible', !isEmpty);
  }

  // ── Order summary in modal
  const modalSub  = $('modal-subtotal');
  const modalCnt  = $('modal-count');
  if (modalSub) modalSub.textContent = cur + subtotal.toFixed(2);
  if (modalCnt) modalCnt.textContent = count + ' item' + (count !== 1 ? 's' : '');
}

function cartItemsHTML() {
  const cur = MENU.restaurant.currency;
  return Object.values(cart).map(({ item, qty }) => `
    <div class="cart-item">
      <div class="cart-item-name">${item.name}</div>
      <div class="cart-item-row">
        <div class="qty-controls">
          <button class="qty-btn" onclick="changeQty('${item.id}',-1)">&#8722;</button>
          <span class="qty-display">${qty}</span>
          <button class="qty-btn" onclick="changeQty('${item.id}',1)">&#43;</button>
        </div>
        <span class="cart-item-price">${cur}${(item.price * qty).toFixed(2)}</span>
      </div>
    </div>`
  ).join('');
}

/* ============================================================
   ORDER MODAL
   ============================================================ */
function openOrderModal() {
  if (cartItemCount() === 0) {
    showToast('Your cart is empty', true);
    return;
  }
  $('order-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
  updateCartUI();
}

function closeOrderModal() {
  $('order-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function submitOrder(e) {
  e.preventDefault();

  // Collect form values
  const name    = $('cust-name').value.trim();
  const phone   = $('cust-phone').value.trim();
  const address = $('cust-address').value.trim();
  const oType   = document.querySelector('input[name="order-type"]:checked')?.value || 'Pickup';
  const payment = document.querySelector('input[name="payment"]:checked')?.value || 'Cash on Delivery';
  const notes   = $('order-notes').value.trim();

  if (!name || !phone) {
    showToast('Please fill in your name and phone', true);
    return;
  }
  if (oType === 'Delivery' && !address) {
    showToast('Please provide your delivery address', true);
    return;
  }

  const { subtotal, delivery, total } = cartTotals(oType);
  const cur   = MENU.restaurant.currency;
  const ordId = 'PA-' + Date.now().toString(36).toUpperCase();

  // Build message
  let msg = `Hello! I would like to place an order.\n\n`;
  msg += `Order ID: ${ordId}\n\n`;
  msg += `ITEMS:\n`;
  Object.values(cart).forEach(({ item, qty }) => {
    msg += `- ${qty}x ${item.name} — ${cur}${(item.price * qty).toFixed(2)}\n`;
  });
  msg += `\nSubtotal: ${cur}${subtotal.toFixed(2)}`;
  if (delivery > 0) msg += `\nDelivery Fee: ${cur}${delivery.toFixed(2)}`;
  msg += `\nTOTAL: ${cur}${total.toFixed(2)}`;
  msg += `\n\nName: ${name}`;
  msg += `\nPhone: ${phone}`;
  if (oType === 'Delivery') msg += `\nAddress: ${address}`;
  msg += `\nOrder Type: ${oType}`;
  msg += `\nPayment: ${payment}`;
  if (notes) msg += `\nNotes: ${notes}`;
  msg += `\n\nPlease confirm my order. Salamat!`;

  const fbName    = encodeURIComponent(MENU.restaurant.facebook.replace(/ /g,'-'));
  const encoded   = encodeURIComponent(msg);
  const messengerUrl = `https://m.me/${fbName}?text=${encoded}`;

  closeOrderModal();
  showToast('Redirecting to Messenger...');

  setTimeout(() => {
    window.open(messengerUrl, '_blank');
  }, 600);
}

/* ── Dynamic address field ── */
function bindOrderTypeChange() {
  document.querySelectorAll('input[name="order-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const addrGroup = $('address-group');
      if (addrGroup) {
        addrGroup.style.display = radio.value === 'Delivery' ? 'flex' : 'none';
      }
      updateCartUI();
      // Update delivery fee display
      const dFeeRow = $('modal-delivery-row');
      const dFee    = $('modal-delivery-fee');
      if (dFeeRow && dFee) {
        if (radio.value === 'Delivery') {
          dFeeRow.style.display = 'flex';
          dFee.textContent = MENU.restaurant.currency + MENU.restaurant.deliveryFee.toFixed(2);
        } else {
          dFeeRow.style.display = 'none';
        }
      }
      const mTotal = $('modal-total');
      const { total } = cartTotals(radio.value);
      if (mTotal) mTotal.textContent = MENU.restaurant.currency + total.toFixed(2);
    });
  });
}

/* ============================================================
   CART DRAWER (mobile)
   ============================================================ */
function openCartDrawer() {
  $('cart-drawer-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  updateCartUI();
}
function closeCartDrawer() {
  $('cart-drawer-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, isError = false) {
  const container = $('toast-container');
  if (!container) return;
  const t = document.createElement('div');
  t.className = 'toast' + (isError ? ' error' : '');
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ============================================================
   EVENT BINDING
   ============================================================ */
function bindEvents() {
  // Close modals on overlay click
  $('order-modal')?.addEventListener('click', e => {
    if (e.target === $('order-modal')) closeOrderModal();
  });
  $('cart-drawer-overlay')?.addEventListener('click', e => {
    if (e.target === $('cart-drawer-overlay')) closeCartDrawer();
  });

  // Order form
  $('order-form')?.addEventListener('submit', submitOrder);

  // Address toggle on load
  const addrGroup = $('address-group');
  if (addrGroup) addrGroup.style.display = 'none';

  // Order type radios
  bindOrderTypeChange();

  // Window resize
  window.addEventListener('resize', () => {
    isMobile = window.innerWidth <= 860;
  });
}

/* ============================================================
   SVG ICONS (inline, no emoji)
   ============================================================ */
function iconPhone() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.09-1.09a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.72 2.02z"/>
  </svg>`;
}
function iconPin() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>`;
}
function iconFB() {
  return `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
  </svg>`;
}
function iconQR() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/>
    <rect x="3" y="16" width="5" height="5"/>
    <path d="M21 16h-3a2 2 0 00-2 2v3m0-6h.01M12 3h.01M12 9v3m0 3h3m-3 3h.01M3 12h3m3 0h.01"/>
  </svg>`;
}
function iconPlus() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>`;
}
function iconCart() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
  </svg>`;
}
function iconSend() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>`;
}

/* ── Category icons ── */
function getCatIcon(type) {
  const icons = {
    bowl: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12h20c0-5.52-4.48-10-10-10z"/><path d="M2 12c0 5.52 4.48 10 10 10s10-4.48 10-10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>`,
    chicken:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>`,
    jar:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M6 6h12l-1 14H7L6 6z"/></svg>`,
    plate:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    fries:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
    star:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    fork:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3v5"/></svg>`,
    trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 21 12 17 16 21"/><path d="M7 21h10"/><path d="M5 3H3v4a4 4 0 004 4h10a4 4 0 004-4V3h-2"/><path d="M5 3v4"/><path d="M19 3v4"/><rect x="7" y="3" width="10" height="10" rx="1"/></svg>`,
    combo:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>`
  };
  return icons[type] || icons.plate;
}

/* ============================================================
   EXPOSE GLOBALS (called from HTML onclick)
   ============================================================ */
window.addToCart       = addToCart;
window.changeQty       = changeQty;
window.clearCart       = clearCart;
window.openOrderModal  = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.openCartDrawer  = openCartDrawer;
window.closeCartDrawer = closeCartDrawer;
window.scrollToSection = scrollToSection;

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', init);

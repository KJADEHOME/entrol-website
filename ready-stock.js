(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EntrolReadyStock = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function money(value, currency) {
    if (!Number.isFinite(Number(value))) return 'To be quoted';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(Number(value));
  }

  function volumetricWeight(product, divisor) {
    var dims = product.package_cm || {};
    var volumeWeight = Number(dims.length) * Number(dims.width) * Number(dims.height) / Number(divisor || 5000);
    return Math.max(Number(product.gross_weight_kg) || 0, Number.isFinite(volumeWeight) ? volumeWeight : 0);
  }

  function filterPublished(products, today, validDays) {
    var now = today instanceof Date ? today : new Date(today || Date.now());
    var windowDays = Number(validDays || 7);
    return (products || []).filter(function (product) {
      if (product.publish_status !== 'Published' || !['Authorized', 'Own Photo'].includes(product.image_authorization)) return false;
      if (!product.stock_verified_at) return false;
      var verified = new Date(product.stock_verified_at + 'T00:00:00Z');
      var ageDays = (now - verified) / 86400000;
      return Number.isFinite(ageDays) && ageDays >= 0 && ageDays <= windowDays;
    });
  }

  function estimateShipping(cart, products, rate) {
    if (!rate) return null;
    var lookup = new Map(products.map(function (p) { return [p.sku, p]; }));
    var weight = cart.reduce(function (sum, line) {
      var product = lookup.get(line.sku);
      return sum + (product ? volumetricWeight(product, rate.volumetric_divisor) * line.quantity : 0);
    }, 0);
    if (!weight) return null;
    var firstWeight = Math.max(0, Number(rate.first_weight_kg) || 0);
    var charge = Number(rate.first_weight_fee) || 0;
    if (weight > firstWeight) charge += (weight - firstWeight) * (Number(rate.additional_per_kg) || 0);
    return { amount: Math.max(Number(rate.minimum_charge) || 0, charge), currency: rate.currency || 'USD', chargeable_weight_kg: weight };
  }

  function buildIntentSummary(reference, cart, products, shipping, destination) {
    var lookup = new Map(products.map(function (p) { return [p.sku, p]; }));
    var lines = cart.map(function (line) {
      var p = lookup.get(line.sku);
      return p ? p.sku + ' | ' + p.name_en + ' | Qty ' + line.quantity + ' | Unit ' + money(p.price_usd, 'USD') : line.sku + ' | Qty ' + line.quantity;
    });
    return [
      'Purchase intent reference: ' + reference,
      'Destination: ' + (destination.country || '-') + ' ' + (destination.postal_code || '-'),
      'Shipping method: ' + (destination.method || 'To be quoted'),
      'Estimated shipping: ' + (shipping ? money(shipping.amount, shipping.currency) : 'To be quoted'),
      'Items:',
      lines.join('\n'),
      '',
      'This is a non-binding purchase intent. Price, stock, freight, duties and delivery terms require final confirmation.'
    ].join('\n');
  }

  function createReference(now, randomValue) {
    var date = now || new Date();
    var day = date.toISOString().slice(0, 10).replace(/-/g, '');
    var suffix = Math.floor((randomValue == null ? Math.random() : randomValue) * 1679616).toString(36).toUpperCase().padStart(4, '0');
    return 'ENT-' + day + '-' + suffix;
  }

  function initPage() {
    if (typeof document === 'undefined') return;
    var grid = document.getElementById('ready-stock-grid');
    if (!grid) return;

    var state = { products: [], cart: [], rates: [], currency: 'USD', reference: createReference() };
    try { state.cart = JSON.parse(localStorage.getItem('entrol_ready_stock_cart') || '[]'); } catch (_) { state.cart = []; }

    var category = document.getElementById('rs-category');
    var search = document.getElementById('rs-search');
    var cartItems = document.getElementById('rs-cart-items');
    var subtotalEl = document.getElementById('rs-subtotal');
    var shippingEl = document.getElementById('rs-shipping');
    var totalEl = document.getElementById('rs-total');
    var countEl = document.getElementById('rs-cart-count');
    var form = document.getElementById('ready-stock-intent-form');
    var country = document.getElementById('rs-country');
    var postalCode = document.getElementById('rs-postal-code');
    var method = document.getElementById('rs-method');
    var customerNotes = document.getElementById('rs-notes');
    var submit = document.getElementById('rs-submit');

    function saveCart() { localStorage.setItem('entrol_ready_stock_cart', JSON.stringify(state.cart)); }
    function visibleProducts() {
      var query = (search.value || '').trim().toLowerCase();
      return state.products.filter(function (p) {
        return (!category.value || p.category === category.value) && (!query || [p.sku, p.name_en, p.category, p.material].join(' ').toLowerCase().includes(query));
      });
    }
    function renderProducts() {
      var list = visibleProducts();
      if (!state.products.length) {
        grid.innerHTML = '<div class="rs-empty"><h2>Verified products are being prepared</h2><p>Only products with confirmed pricing, stock, packaging data and image authorization will appear here. Contact us for a tailored sourcing list while this weekly selection is being prepared.</p><a href="contact.html">Request a sourcing list</a></div>';
        return;
      }
      if (!list.length) {
        grid.innerHTML = '<div class="rs-empty"><h2>No matching products</h2><p>Try another category or search term.</p></div>';
        return;
      }
      grid.innerHTML = list.map(function (p) {
        return '<article class="rs-card"><img class="rs-card-image" src="' + p.images.main + '" alt="' + p.name_en.replace(/"/g, '&quot;') + '" loading="lazy"><div class="rs-card-body"><div class="rs-badges"><span class="rs-badge stock">' + p.supply_status + '</span><span class="rs-badge">' + p.category + '</span></div><h2>' + p.name_en + '</h2><p class="rs-sku">SKU: ' + p.sku + ' · Verified ' + p.stock_verified_at + '</p><div class="rs-price">' + money(p.price_usd, state.currency) + '</div><div class="rs-meta"><span>MOQ: ' + p.moq + '</span><span>Available: ' + p.verified_stock + '</span><span>Lead time: ' + p.lead_time_days + ' days</span><span>' + (p.dropship ? 'Dropship available' : 'Batch shipping') + '</span></div><div class="rs-add"><input id="qty-' + p.sku + '" type="number" min="' + p.moq + '" max="' + p.verified_stock + '" step="1" value="' + p.moq + '" aria-label="Quantity for ' + p.sku + '"><button type="button" data-add-sku="' + p.sku + '">Add</button></div></div></article>';
      }).join('');
    }
    function selectedRate() {
      return state.rates.find(function (r) { return r.enabled && r.country_code === country.value && r.method === method.value; }) || null;
    }
    function subtotal() {
      var lookup = new Map(state.products.map(function (p) { return [p.sku, p]; }));
      return state.cart.reduce(function (sum, line) { var p = lookup.get(line.sku); return sum + (p ? Number(p.price_usd) * line.quantity : 0); }, 0);
    }
    function currentShipping() { return estimateShipping(state.cart, state.products, selectedRate()); }
    function syncHiddenFields() {
      var ship = currentShipping();
      var destination = { country: country.options[country.selectedIndex] ? country.options[country.selectedIndex].text : '', postal_code: postalCode.value, method: method.value };
      form.querySelector('[name="product"]').value = state.cart.map(function (line) { return line.sku; }).join(', ');
      form.querySelector('[name="quantity"]').value = state.cart.map(function (line) { return line.sku + ':' + line.quantity; }).join(', ');
      var summary = buildIntentSummary(state.reference, state.cart, state.products, ship, destination);
      if (customerNotes.value.trim()) summary += '\n\nCustomer notes: ' + customerNotes.value.trim();
      form.querySelector('[name="message"]').value = summary;
      form.querySelector('[name="inquiry_trigger"]').value = 'ready_stock_purchase_intent';
    }
    function renderCart() {
      var lookup = new Map(state.products.map(function (p) { return [p.sku, p]; }));
      state.cart = state.cart.filter(function (line) { return lookup.has(line.sku); });
      saveCart();
      countEl.textContent = state.cart.reduce(function (n, line) { return n + line.quantity; }, 0);
      cartItems.innerHTML = state.cart.length ? state.cart.map(function (line) {
        var p = lookup.get(line.sku);
        return '<div class="rs-cart-row"><strong>' + p.name_en + '</strong><div class="rs-cart-row-line"><span>' + p.sku + ' × ' + line.quantity + '</span><span>' + money(p.price_usd * line.quantity, state.currency) + '</span></div><button type="button" class="rs-remove" data-remove-sku="' + p.sku + '">Remove</button></div>';
      }).join('') : '<p class="rs-cart-empty">Select verified products to create a purchase intent.</p>';
      var sub = subtotal();
      var ship = currentShipping();
      subtotalEl.textContent = money(sub, state.currency);
      shippingEl.textContent = ship ? money(ship.amount, ship.currency) : 'To be quoted';
      totalEl.textContent = ship && ship.currency === state.currency ? money(sub + ship.amount, state.currency) : money(sub, state.currency) + ' + freight';
      submit.disabled = !state.cart.length;
      syncHiddenFields();
    }

    grid.addEventListener('click', function (event) {
      var button = event.target.closest('[data-add-sku]');
      if (!button) return;
      var sku = button.dataset.addSku;
      var p = state.products.find(function (item) { return item.sku === sku; });
      var input = document.getElementById('qty-' + sku);
      var qty = Math.max(p.moq, Math.min(p.verified_stock, Number(input.value) || p.moq));
      var line = state.cart.find(function (item) { return item.sku === sku; });
      if (line) line.quantity = Math.min(p.verified_stock, line.quantity + qty); else state.cart.push({ sku: sku, quantity: qty });
      renderCart();
    });
    cartItems.addEventListener('click', function (event) {
      var button = event.target.closest('[data-remove-sku]');
      if (!button) return;
      state.cart = state.cart.filter(function (line) { return line.sku !== button.dataset.removeSku; });
      renderCart();
    });
    [search, category].forEach(function (el) { el.addEventListener('input', renderProducts); });
    [country, method, postalCode, customerNotes].forEach(function (el) { el.addEventListener('input', renderCart); });
    submit.addEventListener('click', syncHiddenFields);

    Promise.all([
      fetch('data/ready-stock-products.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('product_data_unavailable'); return r.json(); }),
      fetch('data/shipping-rates.json', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('shipping_data_unavailable'); return r.json(); })
    ]).then(function (data) {
      var productData = data[0];
      var shippingData = data[1];
      state.currency = productData.currency || 'USD';
      state.products = filterPublished(productData.products, new Date(), productData.verification_valid_days);
      state.rates = shippingData.rates || [];
      document.getElementById('rs-updated').textContent = productData.updated_at ? 'Product data updated ' + productData.updated_at : 'Products pending first verified upload';
      var categories = Array.from(new Set(state.products.map(function (p) { return p.category; }))).sort();
      categories.forEach(function (value) { var option = document.createElement('option'); option.value = value; option.textContent = value; category.appendChild(option); });
      renderProducts();
      renderCart();
    }).catch(function () {
      grid.innerHTML = '<div class="rs-empty"><h2>Product data is temporarily unavailable</h2><p>Please contact our sourcing team and we will send a verified selection.</p><a href="contact.html">Contact sourcing team</a></div>';
      submit.disabled = true;
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPage);
    else initPage();
  }

  return { money: money, volumetricWeight: volumetricWeight, filterPublished: filterPublished, estimateShipping: estimateShipping, buildIntentSummary: buildIntentSummary, createReference: createReference };
});

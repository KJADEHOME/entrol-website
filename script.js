/* =====================================================
   ENTSOL Website — script.js
   ===================================================== */

// ── NAV scroll effect ──────────────────────────────────
const nav = document.querySelector('.nav');
const handleScroll = () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
};
window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();

// ── Mobile menu ────────────────────────────────────────
const navToggle = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
if (navToggle && mobileMenu) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navToggle.classList.remove('active');
      mobileMenu.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ── Reveal on scroll (Intersection Observer) ────────────
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

// Fallback: Force reveal elements already in viewport on load
// Use DOMContentLoaded instead of load for faster response
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    revealEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('visible');
      }
    });
  }, 200); // Increased delay slightly to ensure DOM is ready
});

// ── Inquiry form ────────────────────────────────────────
const inquiryForm = document.getElementById('inquiryForm');
if (inquiryForm) {
  // Show success banner if redirected back after submission
  const params = new URLSearchParams(window.location.search);
  if (params.get('sent') === '1') {
    const banner = document.createElement('div');
    banner.className = 'form-success-banner';
    banner.innerHTML = '✅ <strong>Inquiry received!</strong> We\'ll get back to you within 24 hours.';
    inquiryForm.parentNode.insertBefore(banner, inquiryForm);
    inquiryForm.style.display = 'none';
  }

  // Detect Formsubmit.co: let native POST handle it
  const action = inquiryForm.getAttribute('action') || '';
  const useFormsubmit = action.includes('formsubmit.co');

  if (useFormsubmit) {
    // Native POST → Formsubmit handles redirect back to ?sent=1
  }

  // Fallback: mailto (local preview / before formsubmit is set up)
  inquiryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = inquiryForm.querySelector('button[type=submit]');
    const original = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;

    const data = new FormData(inquiryForm);
    const body = {};
    data.forEach((v, k) => { if (!k.startsWith('_')) body[k] = v; });

    const subject = encodeURIComponent(`[Entrol Inquiry] ${body['product-interest'] || 'Product'} from ${body['company-name'] || body['first-name'] || 'Customer'}`);
    const emailBody = Object.entries(body)
      .map(([k, v]) => `${k.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${v}`)
      .join('\n');
    const mailto = `mailto:wangyan@entrol.com?subject=${subject}&body=${encodeURIComponent(emailBody)}`;

    setTimeout(() => {
      btn.textContent = '✓ Opening email client…';
      btn.style.background = 'var(--color-accent)';
      btn.style.borderColor = 'var(--color-accent)';
      setTimeout(() => {
        window.location.href = mailto;
        btn.textContent = original;
        btn.disabled = false;
        btn.style.background = '';
        btn.style.borderColor = '';
        inquiryForm.reset();
      }, 800);
    }, 600);
  });
}

// ── Smooth anchor ───────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Inquiry Sidebar ─────────────────────────────────────
function toggleInquiry() {
  var sidebar = document.getElementById('inquirySidebar');
  var overlay = document.getElementById('inquiryOverlay');
  var tab = document.getElementById('inquiryTab');
  if (!sidebar || !overlay || !tab) return;
  var isOpen = sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    tab.classList.remove('hidden');
    document.body.classList.remove('inquiry-open');
    tab.setAttribute('aria-expanded', 'false');
    sidebar.setAttribute('aria-hidden', 'true');
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    tab.classList.add('hidden');
    document.body.classList.add('inquiry-open');
    tab.setAttribute('aria-expanded', 'true');
    sidebar.setAttribute('aria-hidden', 'false');
    var firstField = sidebar.querySelector('input:not([type="hidden"]), select, textarea');
    if (firstField) setTimeout(function() { firstField.focus(); }, 180);
  }
}

function openInquiryFor(product) {
  var sidebar = document.getElementById('inquirySidebar');
  var overlay = document.getElementById('inquiryOverlay');
  var tab = document.getElementById('inquiryTab');
  var select = document.getElementById('inqProduct');
  if (!sidebar || !overlay || !tab) return;
  if (select) select.value = product;
  sidebar.classList.add('open');
  overlay.classList.add('open');
  tab.classList.add('hidden');
  document.body.classList.add('inquiry-open');
  tab.setAttribute('aria-expanded', 'true');
  sidebar.setAttribute('aria-hidden', 'false');
  var triggerText = document.activeElement ? (document.activeElement.textContent || '').trim() : '';
  var eventData = {
    event: 'inquiry_open',
    product_interest: product || 'unspecified',
    trigger_text: triggerText,
    page_path: window.location.pathname
  };
  sessionStorage.setItem('entrol_inquiry_context', JSON.stringify({
    product_interest: product || '',
    trigger_text: triggerText,
    page: window.location.pathname,
    opened_at: new Date().toISOString()
  }));
  if (window.dataLayer) window.dataLayer.push(eventData);
  if (typeof gtag === 'function') {
    gtag('event', 'view_form', { form_name: 'quick_inquiry', product_interest: product || 'unspecified' });
  }
  if (typeof plausible === 'function') {
    plausible('inquiry_open', { props: { product: product || 'unspecified', page: window.location.pathname } });
  }
  var firstField = sidebar.querySelector('input:not([type="hidden"]), select, textarea');
  if (firstField) setTimeout(function() { firstField.focus(); }, 180);
}

function submitInquiry(e) {
  var form = e && e.currentTarget ? e.currentTarget : document.getElementById('inquiryForm');
  if (!form) return false;

  // All legacy quick-inquiry forms use the same reliable delivery endpoint.
  // Do not show a success state until FormSubmit has actually accepted the POST.
  form.action = 'https://formsubmit.co/wangyan@entrol.com';
  form.method = 'POST';

  var hiddenFields = {
    _subject: '[Entrol] New Quick Inquiry',
    _captcha: 'false',
    _template: 'table',
    _next: 'https://www.entrol.com/contact.html?sent=1',
    source_page: window.location.href,
    landing_page: sessionStorage.getItem('entrol_landing_page') || window.location.href,
    referrer: document.referrer || 'direct'
  };

  Object.keys(hiddenFields).forEach(function(name) {
    var input = form.querySelector('input[name="' + name + '"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    input.value = hiddenFields[name];
  });

  var params = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function(name) {
    var value = params.get(name) || sessionStorage.getItem('entrol_' + name);
    if (!value) return;
    var input = form.querySelector('input[name="' + name + '"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    input.value = value;
  });

  // Track the submit attempt. The thank-you URL is the authoritative success signal.
  if (typeof gtag === 'function') {
    gtag('event', 'inquiry_submit', { event_category: 'conversion', event_label: 'quick_inquiry' });
  }
  if (typeof plausible === 'function') {
    plausible('inquiry_submit', { props: { source: 'quick_inquiry', page: window.location.pathname } });
  }
  if (window.dataLayer) {
    window.dataLayer.push({ event: 'inquiry_submit', form_type: 'quick_inquiry', page_path: window.location.pathname });
  }

  return true;
}

// Sync inquiry product dropdown from query params
document.addEventListener('DOMContentLoaded', function() {
  var params = new URLSearchParams(window.location.search);
  if (!sessionStorage.getItem('entrol_landing_page')) {
    sessionStorage.setItem('entrol_landing_page', window.location.href);
  }
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function(name) {
    var value = params.get(name);
    if (value) sessionStorage.setItem('entrol_' + name, value);
  });

  var inquirySidebar = document.getElementById('inquirySidebar');
  var inquiryTab = document.getElementById('inquiryTab');
  if (inquirySidebar) {
    inquirySidebar.setAttribute('role', 'dialog');
    inquirySidebar.setAttribute('aria-modal', 'true');
    inquirySidebar.setAttribute('aria-label', 'Quick inquiry');
    inquirySidebar.setAttribute('aria-hidden', 'true');
  }
  if (inquiryTab) {
    inquiryTab.setAttribute('role', 'button');
    inquiryTab.setAttribute('tabindex', '0');
    inquiryTab.setAttribute('aria-controls', 'inquirySidebar');
    inquiryTab.setAttribute('aria-expanded', 'false');
    inquiryTab.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleInquiry();
      }
    });
  }
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && inquirySidebar && inquirySidebar.classList.contains('open')) toggleInquiry();
  });

  // Enrich every native FormSubmit form with attribution before it leaves the page.
  document.querySelectorAll('form[action*="formsubmit.co"]').forEach(function(form) {
    form.addEventListener('submit', function() {
      var attribution = {
        source_page: window.location.href,
        landing_page: sessionStorage.getItem('entrol_landing_page') || window.location.href,
        referrer: document.referrer || 'direct'
      };
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function(name) {
        var value = params.get(name) || sessionStorage.getItem('entrol_' + name);
        if (value) attribution[name] = value;
      });
      Object.keys(attribution).forEach(function(name) {
        var input = form.querySelector('input[name="' + name + '"]');
        if (!input) {
          input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          form.appendChild(input);
        }
        input.value = attribution[name];
      });
      if (window.dataLayer) {
        window.dataLayer.push({ event: 'inquiry_submit', form_type: form.className || 'native_form', page_path: window.location.pathname });
      }
      if (typeof plausible === 'function') {
        plausible('inquiry_submit', { props: { source: form.className || 'native_form', page: window.location.pathname } });
      }
    });
  });

  // The redirect is the authoritative client-side confirmation that the provider accepted a submission.
  if (params.get('sent') === '1') {
    if (window.dataLayer) window.dataLayer.push({ event: 'inquiry_success', page_path: window.location.pathname });
    if (typeof gtag === 'function') gtag('event', 'generate_lead', { event_category: 'conversion', event_label: 'formsubmit_success' });
    if (typeof plausible === 'function') plausible('inquiry_success', { props: { page: window.location.pathname } });
  }
  if (params.get('catalog') === 'sent') {
    if (window.dataLayer) window.dataLayer.push({ event: 'catalog_success', page_path: window.location.pathname });
    if (typeof gtag === 'function') gtag('event', 'generate_lead', { event_category: 'conversion', event_label: 'catalog_download' });
    if (typeof plausible === 'function') plausible('catalog_success', { props: { page: window.location.pathname } });
  }
  document.querySelectorAll('[data-catalog-download]').forEach(function(link) {
    link.addEventListener('click', function() {
      var placement = link.closest('.blog-conversion-panel') ? 'article_conversion'
        : link.closest('.catalog-section') ? 'homepage_catalog'
        : 'commercial_catalog';
      var catalogContext = {
        page: window.location.pathname,
        placement: placement,
        link_text: (link.textContent || '').trim(),
        touched_at: new Date().toISOString()
      };
      sessionStorage.setItem('entrol_catalog_touch', JSON.stringify(catalogContext));
      if (window.dataLayer) window.dataLayer.push({ event: 'catalog_download', file_name: 'Entrol-Pet-Products-Catalog-2026.pdf', page_path: catalogContext.page, catalog_placement: placement, link_text: catalogContext.link_text });
      if (typeof gtag === 'function') gtag('event', 'file_download', { event_category: 'conversion', event_label: 'pet_products_catalog_2026', catalog_placement: placement, page_path: catalogContext.page });
      if (typeof plausible === 'function') plausible('catalog_download', { props: { page: catalogContext.page, placement: placement } });
    });
  });

  // Track contact intent consistently across hero, footer, sticky and floating WhatsApp links.
  document.querySelectorAll('a[href*="wa.me/"]').forEach(function(link) {
    link.addEventListener('click', function() {
      var placement = link.classList.contains('whatsapp-float') ? 'floating_widget'
        : link.closest('footer') ? 'footer'
        : link.closest('.hero') ? 'hero'
        : link.closest('.sticky-mobile-cta') ? 'mobile_sticky'
        : 'page_content';
      if (window.dataLayer) window.dataLayer.push({
        event: 'whatsapp_click',
        contact_method: 'whatsapp',
        link_placement: placement,
        page_path: window.location.pathname
      });
      if (typeof gtag === 'function') gtag('event', 'contact', {
        method: 'whatsapp',
        link_placement: placement,
        page_path: window.location.pathname
      });
      if (typeof plausible === 'function') plausible('whatsapp_click', {
        props: { placement: placement, page: window.location.pathname }
      });
    });
  });

  document.querySelectorAll('[data-share-channel]').forEach(function(control) {
    control.addEventListener('click', function(event) {
      var channel = control.getAttribute('data-share-channel') || 'unknown';
      var tracked = {
        event: 'content_share',
        share_channel: channel,
        content_path: window.location.pathname
      };
      if (window.dataLayer) window.dataLayer.push(tracked);
      if (typeof gtag === 'function') {
        gtag('event', 'share', { method: channel, content_type: 'article', item_id: window.location.pathname });
      }
      if (typeof plausible === 'function') {
        plausible('content_share', { props: { channel: channel, page: window.location.pathname } });
      }

      if (channel !== 'copy_link') return;
      event.preventDefault();
      var shareUrl = control.getAttribute('data-share-url') || window.location.href;
      var status = control.closest('.article-share')?.querySelector('.article-share-status');
      navigator.clipboard.writeText(shareUrl).then(function() {
        if (status) status.textContent = 'Tracked link copied.';
      }).catch(function() {
        if (status) status.textContent = 'Copy failed. Please copy the browser address.';
      });
    });
  });

  document.querySelectorAll('[data-related-insight]').forEach(function(link) {
    link.addEventListener('click', function() {
      var target = link.getAttribute('href') || '';
      var eventData = {
        event: 'related_insight_click',
        source_path: window.location.pathname,
        target_path: target
      };
      if (window.dataLayer) window.dataLayer.push(eventData);
      if (typeof gtag === 'function') {
        gtag('event', 'select_content', { content_type: 'related_insight', item_id: target });
      }
      if (typeof plausible === 'function') {
        plausible('related_insight_click', { props: { source: window.location.pathname, target: target } });
      }
    });
  });
  var product = params.get('product');
  if (product) {
    var select = document.getElementById('inqProduct');
    if (select) select.value = product;
  }
});

// ── Parallax hero ───────────────────────────────────────
const heroImg = document.querySelector('.hero-img');
if (heroImg && heroImg.offsetParent !== null) {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    heroImg.style.transform = `translateY(${scrolled * 0.3}px)`;
  }, { passive: true });
}

// First-party durable lead capture. Success is shown only after durable storage.
const ENTROL_LEAD_API_URL = 'https://jipgzavuxvnaisgxcvts.supabase.co/functions/v1/entrol-submit-lead';

function entrolTrack(eventName, form) {
  var formType = form.classList.contains('catalog-form') || form.querySelector('[name="catalog_request"]')
    ? 'catalog'
    : 'inquiry';
  if (window.dataLayer) window.dataLayer.push({ event: eventName, form_type: formType, page_path: window.location.pathname });
  if (typeof gtag === 'function' && eventName === 'inquiry_success') {
    gtag('event', 'generate_lead', { event_category: 'conversion', event_label: 'first_party_lead_api' });
  }
  if (typeof plausible === 'function') plausible(eventName, { props: { source: formType, page: window.location.pathname } });
}

function entrolFormMessage(form, message, isError) {
  var status = form.querySelector('.entrol-form-status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'entrol-form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.style.marginTop = '12px';
    status.style.fontSize = '0.9rem';
    form.appendChild(status);
  }
  status.textContent = message;
  status.style.color = isError ? '#b42318' : '#2f6b1f';
}

async function entrolSubmitLead(form) {
  var button = form.querySelector('button[type="submit"], input[type="submit"]');
  var originalText = button ? (button.textContent || button.value) : '';
  if (button) {
    button.disabled = true;
    if (button.tagName === 'INPUT') button.value = 'Sending...';
    else button.textContent = 'Sending...';
  }

  var fields = {};
  new FormData(form).forEach(function(value, key) {
    if (typeof value === 'string' && !key.startsWith('_')) fields[key] = value;
  });
  var params = new URLSearchParams(window.location.search);
  fields.request_id = crypto.randomUUID();
  fields.submission_type = form.classList.contains('catalog-form') || fields.catalog_request ? 'catalog' : 'inquiry';
  fields.source_page = window.location.href;
  fields.landing_page = sessionStorage.getItem('entrol_landing_page') || window.location.href;
  fields.referrer = document.referrer || 'direct';
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function(name) {
    fields[name] = params.get(name) || sessionStorage.getItem('entrol_' + name) || '';
  });
  try {
    var catalogTouch = JSON.parse(sessionStorage.getItem('entrol_catalog_touch') || 'null');
    if (catalogTouch && typeof catalogTouch === 'object') {
      fields.catalog_touch_page = catalogTouch.page || '';
      fields.catalog_touch_placement = catalogTouch.placement || '';
      fields.catalog_touched_at = catalogTouch.touched_at || '';
    }
  } catch (_) {
    sessionStorage.removeItem('entrol_catalog_touch');
  }
  try {
    var inquiryContext = JSON.parse(sessionStorage.getItem('entrol_inquiry_context') || 'null');
    if (inquiryContext && typeof inquiryContext === 'object') {
      fields.inquiry_trigger = inquiryContext.trigger_text || '';
    }
  } catch (_) {
    sessionStorage.removeItem('entrol_inquiry_context');
  }

  try {
    entrolTrack('inquiry_submit', form);
    var response = await fetch(ENTROL_LEAD_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Request-Id': fields.request_id },
      body: JSON.stringify(fields)
    });
    var result = await response.json().catch(function() { return {}; });
    if (!response.ok || !result.ok) throw new Error(result.error || 'submission_failed');

    form.reset();
    entrolFormMessage(form, fields.submission_type === 'catalog'
      ? 'Request received. Our team will send the catalog to your business email.'
      : 'Inquiry received. Our team will contact you within 24 hours.', false);
    entrolTrack(fields.submission_type === 'catalog' ? 'catalog_success' : 'inquiry_success', form);
  } catch (error) {
    console.error('Entrol lead submission failed:', error);
    entrolFormMessage(form, 'We could not save your inquiry. Please retry, email wangyan@entrol.com, or contact us on WhatsApp.', true);
  } finally {
    if (button) {
      button.disabled = false;
      if (button.tagName === 'INPUT') button.value = originalText;
      else button.textContent = originalText;
    }
  }
}

document.addEventListener('submit', function(event) {
  var form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  var isInquiry = (form.action || '').includes('formsubmit.co') || (form.getAttribute('onsubmit') || '').includes('submitInquiry');
  if (!isInquiry || ENTROL_LEAD_API_URL.startsWith('__')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  entrolSubmitLead(form);
}, true);

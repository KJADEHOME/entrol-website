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
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    tab.classList.add('hidden');
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

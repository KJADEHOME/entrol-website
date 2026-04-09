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
    const mailto = `mailto:b.wu@entrol.com?subject=${subject}&body=${encodeURIComponent(emailBody)}`;

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

// ── Parallax hero ───────────────────────────────────────
const heroImg = document.querySelector('.hero-img');
if (heroImg && heroImg.offsetParent !== null) {
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    heroImg.style.transform = `translateY(${scrolled * 0.3}px)`;
  }, { passive: true });
}

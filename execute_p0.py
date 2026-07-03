#!/usr/bin/env python3
"""Execute all P0 funnel optimization tasks for Entrol website."""

import os
import re

WEBSITE_DIR = os.path.dirname(os.path.abspath(__file__))

def read_file(filepath):
    for enc in ['utf-8', 'gbk', 'gb2312', 'latin-1']:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                return f.read(), enc
        except (UnicodeDecodeError, FileNotFoundError):
            continue
    return None, None

def write_file(filepath, content, enc='utf-8'):
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

changes = []

# ============================================================
# P0-1: Fix 7 blog post CTAs → route to relevant money pages
# ============================================================
blog_routes = {
    'blog/cat-tree-manufacturer-china-guide.html': {
        'money_page': '../oem-pet-products-manufacturer.html',
        'cta_text': 'Start Your OEM Cat Tree Project',
        'cta_sub': 'Get a custom quote within 24 hours. Tell us your specs, MOQ, and target price.',
        'anchor': 'OEM cat tree manufacturer',
    },
    'blog/cat-tree-materials-guide.html': {
        'money_page': '../wholesale-pet-products.html',
        'cta_text': 'Get Wholesale Pricing',
        'cta_sub': 'Bulk order cat trees and pet products at factory-direct wholesale prices.',
        'anchor': 'wholesale pet products supplier',
    },
    'blog/how-to-choose-pet-product-manufacturer.html': {
        'money_page': '../oem-pet-products-manufacturer.html',
        'cta_text': 'Request Your OEM Quote',
        'cta_sub': 'Tell us about your product vision. We will send a tailored OEM quote within 24 hours.',
        'anchor': 'OEM pet products manufacturer',
    },
    'blog/moq-factory-negotiation-guide.html': {
        'money_page': '../wholesale-pet-products.html',
        'cta_text': 'Get Wholesale Price List',
        'cta_sub': 'Ready to place an order? Get our full wholesale pricing with tiered MOQ discounts.',
        'anchor': 'wholesale pet products supplier',
    },
    'blog/pet-product-industry-trends-2026.html': {
        'money_page': '../amazon-pet-supplier.html',
        'cta_text': 'Start Your Amazon Supply',
        'cta_sub': 'FBA-ready products, barcoding, poly-bagging, and direct-to-Amazon shipping.',
        'anchor': 'Amazon pet product supplier',
    },
    'blog/pet-product-oem-cost-guide.html': {
        'money_page': '../oem-pet-products-manufacturer.html',
        'cta_text': 'Get Your OEM Cost Estimate',
        'cta_sub': 'Send us your product specs and target volume for a detailed cost breakdown.',
        'anchor': 'OEM pet products manufacturer',
    },
    'blog/sustainable-pet-product-manufacturing.html': {
        'money_page': '../oem-pet-products-manufacturer.html',
        'cta_text': 'Start Your Eco-Friendly OEM',
        'cta_sub': 'FSC, GRS, and OEKO-TEX certified manufacturing. Send us your sustainability requirements.',
        'anchor': 'eco-friendly OEM manufacturing',
    },
}

for filepath, info in blog_routes.items():
    fullpath = os.path.join(WEBSITE_DIR, filepath)
    content, enc = read_file(fullpath)
    if not content:
        changes.append(f"  FAIL: Could not read {filepath}")
        continue

    original = content

    # Pattern 1: Replace cta-box content with money page link + supplier badge
    # Find the cta-box div and replace its button link
    old_cta_patterns = [
        # Pattern: <a href="../contact.html" class="btn">Request a Free Quote</a>
        r'(<div class="cta-box">)\s*(<h3>[^<]+</h3>)\s*(<p>[^<]*</p>)\s*<a href="\.\./contact\.html" class="btn">Request a Free Quote</a>',
        # Pattern: <a href="../contact.html" class="btn">Request a Quote</a>
        r'(<div class="cta-box">)\s*(<h3>[^<]+</h3>)\s*(<p>[^<]*</p>)\s*<a href="\.\./contact\.html" class="btn">Request a Quote</a>',
        # Pattern: btn-cta with arrow (garbled)
        r'(<div class="cta-box">)\s*(<h3>[^<]+</h3>)\s*(<p>[^<]*</p>)\s*<a href="\.\./contact\.html" class="btn-cta">[^<]*</a>',
    ]

    cta_replaced = False
    for pattern in old_cta_patterns:
        match = re.search(pattern, content, re.DOTALL)
        if match:
            new_cta = f'''{match.group(1)}
      {match.group(2)}
      {match.group(3)}
      <a href="{info['money_page']}" class="btn">{info['cta_text']} &rarr;</a>
    </div>
    <div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="font-size:0.85rem;color:#666;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Recommended Supplier</p>
      <p style="font-size:1rem;color:#333;margin-bottom:12px;">Entrol &mdash; {info['anchor'].capitalize()} in China since 2005</p>
      <a href="{info['money_page']}" style="display:inline-block;background:#1a1a2e;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.9rem;">Visit {info['anchor'].split()[0].capitalize()} Page</a>
    </div>'''
            content = content[:match.start()] + new_cta + content[match.end():]
            cta_replaced = True
            break

    if not cta_replaced:
        # Fallback: just replace the href in the cta-box area
        # Find cta-box section and replace contact.html link
        cta_match = re.search(r'(<div class="cta-box">.*?)(<a href="\.\./contact\.html"[^>]*>)(.*?</a>)', content, re.DOTALL)
        if cta_match:
            new_link = f'<a href="{info["money_page"]}" class="btn">{info["cta_text"]} &rarr;</a>'
            content = content[:cta_match.start(2)] + new_link + content[cta_match.end():]
            cta_replaced = True

    if content != original:
        write_file(fullpath, content)
        changes.append(f"  P0-1: {filepath} → CTA routed to {info['money_page']}")
    else:
        changes.append(f"  P0-1: {filepath} → NO CHANGE (pattern not found)")

# ============================================================
# P0-2: Unify WhatsApp number in contact.html
# ============================================================
contact_path = os.path.join(WEBSITE_DIR, 'contact.html')
content, enc = read_file(contact_path)
if content:
    original = content
    content = content.replace('8618561686595', '8615263130999')
    if content != original:
        write_file(contact_path, content)
        changes.append("  P0-2: contact.html → WhatsApp unified to 8615263130999 (2 replacements)")
    else:
        changes.append("  P0-2: contact.html → No change needed")
else:
    changes.append("  P0-2: FAIL - could not read contact.html")

# ============================================================
# P0-3: Add cross-links between 3 money pages
# ============================================================
money_pages = {
    'oem-pet-products-manufacturer.html': {
        'title': 'OEM Manufacturing',
        'color': '#f0b429',
        'links': [
            ('amazon-pet-supplier.html', 'Amazon FBA Supply', 'FBA-ready products with barcoding, labeling & direct-to-Amazon shipping'),
            ('wholesale-pet-products.html', 'Wholesale Supply', 'Bulk pricing with tiered MOQ discounts for distributors and retailers'),
        ]
    },
    'amazon-pet-supplier.html': {
        'title': 'Amazon FBA Supply',
        'color': '#f97316',
        'links': [
            ('oem-pet-products-manufacturer.html', 'OEM Manufacturing', 'Private label branding with full custom design from 500 pcs MOQ'),
            ('wholesale-pet-products.html', 'Wholesale Supply', 'Bulk pricing with tiered MOQ discounts for distributors and retailers'),
        ]
    },
    'wholesale-pet-products.html': {
        'title': 'Wholesale Supply',
        'color': '#10b981',
        'links': [
            ('oem-pet-products-manufacturer.html', 'OEM Manufacturing', 'Private label branding with full custom design from 500 pcs MOQ'),
            ('amazon-pet-supplier.html', 'Amazon FBA Supply', 'FBA-ready products with barcoding, labeling & direct-to-Amazon shipping'),
        ]
    },
}

cross_link_html_template = '''
  <!-- CROSS-LINK SECTION -->
  <section style="padding:48px 0;background:#f8f9fa;">
    <div class="container">
      <h2 style="text-align:center;font-size:1.4rem;margin-bottom:8px;color:#1a1a2e;">Also Explore</h2>
      <p style="text-align:center;color:#666;margin-bottom:32px;">Other ways we can help grow your pet product business</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:800px;margin:0 auto;">
        {cards}
      </div>
    </div>
  </section>
'''

card_template = '''        <a href="{url}" style="display:block;background:#fff;border:1px solid #e0e0e0;border-radius:12px;padding:24px;text-decoration:none;transition:all 0.3s;" onmouseover="this.style.boxShadow='0 4px 20px rgba(0,0,0,0.08)';this.style.borderColor='{color}';" onmouseout="this.style.boxShadow='none';this.style.borderColor='#e0e0e0';">
          <h3 style="font-size:1.1rem;color:{color};margin-bottom:8px;">{title} &rarr;</h3>
          <p style="color:#666;font-size:0.9rem;margin:0;">{desc}</p>
        </a>'''

for filepath, info in money_pages.items():
    fullpath = os.path.join(WEBSITE_DIR, filepath)
    content, enc = read_file(fullpath)
    if not content:
        changes.append(f"  P0-3: FAIL - could not read {filepath}")
        continue

    # Check if cross-links already exist
    if 'Also Explore' in content or 'also-explore' in content:
        changes.append(f"  P0-3: {filepath} → Already has cross-links, skipping")
        continue

    # Build cards HTML
    cards = '\n'.join(
        card_template.format(url=url, color=info['color'], title=title, desc=desc)
        for url, title, desc in info['links']
    )
    cross_link_html = cross_link_html_template.format(cards=cards)

    # Insert before footer
    footer_match = re.search(r'(  <!-- FOOTER -->)', content)
    if footer_match:
        insert_pos = footer_match.start()
        content = content[:insert_pos] + cross_link_html + '\n' + content[insert_pos:]
        write_file(fullpath, content)
        changes.append(f"  P0-3: {filepath} → Cross-links added")
    else:
        # Try to find <footer
        footer_match = re.search(r'(<footer)', content)
        if footer_match:
            insert_pos = footer_match.start()
            content = content[:insert_pos] + cross_link_html + '\n' + content[insert_pos:]
            write_file(fullpath, content)
            changes.append(f"  P0-3: {filepath} → Cross-links added (before footer tag)")
        else:
            changes.append(f"  P0-3: {filepath} → Could not find footer insertion point")

# ============================================================
# P0-4: Add sticky mobile CTA bar to 3 money pages
# ============================================================

sticky_html = '''
  <!-- STICKY INQUIRY BAR (mobile) -->
  <div class="sticky-inquiry-bar">
    <a href="https://wa.me/8615263130999?text=Hi%20Entrol%2C%20I%27d%20like%20to%20get%20your%20product%20catalog%20and%20pricing."
       class="sticky-btn sticky-wa" target="_blank" rel="noopener">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.34 4.94L2.04 22l5.25-1.38c1.47.77 3.13 1.18 4.75 1.18 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm4.52 6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.09s.9 2.42 1.03 2.59c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.12-.23-.19-.48-.31z"/></svg>
      <span>WhatsApp</span>
    </a>
    <a href="#rfq-form" class="sticky-btn sticky-rfq">
      &#x1f4dd; <span>Get Quote</span>
    </a>
  </div>
'''

sticky_css = '''
/* STICKY INQUIRY BAR (mobile) */
.sticky-inquiry-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(26, 23, 20, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(255,255,255,0.1);
  padding: 8px 12px;
  z-index: 100;
  display: flex;
  gap: 8px;
  justify-content: center;
}
.sticky-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  color: #fff;
  font-family: inherit;
  white-space: nowrap;
  max-width: 200px;
}
.sticky-wa { background: #25D366; }
.sticky-wa:hover { background: #1da851; }
.sticky-rfq { background: #D4A84B; }
.sticky-rfq:hover { background: #C49A3E; }
@media (min-width: 769px) {
  .sticky-inquiry-bar { display: none !important; }
}
@media (max-width: 768px) {
  .whatsapp-float { bottom: 80px !important; }
}
'''

for filepath in ['oem-pet-products-manufacturer.html', 'amazon-pet-supplier.html', 'wholesale-pet-products.html']:
    fullpath = os.path.join(WEBSITE_DIR, filepath)
    content, enc = read_file(fullpath)
    if not content:
        changes.append(f"  P0-4: FAIL - could not read {filepath}")
        continue

    if 'sticky-inquiry-bar' in content:
        changes.append(f"  P0-4: {filepath} → Already has sticky bar, skipping")
        continue

    # Add sticky HTML before footer
    footer_match = re.search(r'(\s*<!-- FOOTER -->)', content)
    if not footer_match:
        footer_match = re.search(r'(\s*<footer)', content)
    if footer_match:
        insert_pos = footer_match.start()
        content = content[:insert_pos] + sticky_html + '\n' + content[insert_pos:]
    else:
        changes.append(f"  P0-4: {filepath} → Could not find footer for sticky bar")
        continue

    # Add CSS before </style>
    style_match = re.search(r'</style>', content)
    if style_match:
        insert_pos = style_match.start()
        content = content[:insert_pos] + sticky_css + '\n' + content[insert_pos:]

    write_file(fullpath, content)
    changes.append(f"  P0-4: {filepath} → Sticky CTA bar added")

# ============================================================
# P0-5: Add money page links to cat-tree-sourcing-guide.html
# ============================================================
sourcing_path = os.path.join(WEBSITE_DIR, 'cat-tree-sourcing-guide.html')
content, enc = read_file(sourcing_path)
if content:
    original = content

    # Replace the CTA section with money page links
    old_cta = '''  <!-- CTA Section -->
  <div class="cta-box">
    <h3>Ready to Source Cat Trees from China?</h3>
    <p style="margin-bottom: 16px;">Entrol has been manufacturing cat trees for 200+ global brands since 2005. We offer end-to-end OEM/ODM service including design, sampling, production, quality control, and DDP shipping to Amazon FBA.</p>
    <a href="https://www.entrol.com/cat-tree-oem.html" class="btn">View OEM Services</a>
    <a href="https://www.entrol.com/contact.html" class="btn btn-outline">Get a Quote</a>
  </div>'''

    new_cta = '''  <!-- CTA Section -->
  <div class="cta-box">
    <h3>Ready to Source Cat Trees from China?</h3>
    <p style="margin-bottom: 16px;">Entrol has been manufacturing cat trees for 200+ global brands since 2005. We offer end-to-end OEM/ODM service including design, sampling, production, quality control, and DDP shipping to Amazon FBA.</p>
    <a href="oem-pet-products-manufacturer.html" class="btn">OEM Manufacturing</a>
    <a href="amazon-pet-supplier.html" class="btn">Amazon FBA Supply</a>
    <a href="wholesale-pet-products.html" class="btn btn-outline">Wholesale Pricing</a>
  </div>'''

    if old_cta in content:
        content = content.replace(old_cta, new_cta)
    else:
        # Fallback: regex replace
        content = re.sub(
            r'(<div class="cta-box">.*?<a href=")[^"]*cat-tree-oem\.html[^"]*("[^>]*>.*?<a href=")[^"]*contact\.html[^"]*("[^>]*>.*?</div>)',
            lambda m: m.group(1) + 'oem-pet-products-manufacturer.html' + m.group(2) + 'amazon-pet-supplier.html' + '" class="btn">Amazon FBA Supply</a>\n    <a href="wholesale-pet-products.html' + m.group(3),
            content, flags=re.DOTALL
        )

    if content != original:
        write_file(sourcing_path, content)
        changes.append("  P0-5: cat-tree-sourcing-guide.html → Money page links added (OEM + Amazon + Wholesale)")
    else:
        changes.append("  P0-5: cat-tree-sourcing-guide.html → No change made")
else:
    changes.append("  P0-5: FAIL - could not read cat-tree-sourcing-guide.html")

# ============================================================
# Print summary
# ============================================================
print("=" * 60)
print("P0 FUNNEL OPTIMIZATION COMPLETE")
print("=" * 60)
for change in changes:
    print(change)
print("=" * 60)

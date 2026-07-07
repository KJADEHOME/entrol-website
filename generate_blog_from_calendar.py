#!/usr/bin/env python3
"""
Entrol Blog Generator — reads entrol-blog-calendar.json, generates pending articles,
updates blog.html and sitemap.xml.

Usage:
  python generate_blog_from_calendar.py          # generate next pending article
  python generate_blog_from_calendar.py --all    # generate ALL pending articles
  python generate_blog_from_calendar.py --dry-run  # preview without writing files
  python generate_blog_from_calendar.py --article BLOG-015  # generate specific article
"""

import json, os, sys, re
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CALENDAR_PATH = os.path.join(BASE_DIR, 'entrol-blog-calendar.json')
BLOG_DIR = os.path.join(BASE_DIR, 'blog')
BLOG_HTML = os.path.join(BASE_DIR, 'blog.html')
SITEMAP = os.path.join(BASE_DIR, 'sitemap.xml')

# ── Article Content Templates ───────────────────────────────────────────

ARTICLE_CONTENTS = {
    "BLOG-015": {
        "content_sections": [
            ("Why Cat Tree Design Matters for B2B Buyers",
             "<p>In the competitive pet retail market, <strong>cat tree design is no longer an afterthought</strong> — it's a primary purchase driver. B2B buyers — whether Amazon sellers, pet store chains, or distributors — need products that not only function well but look good in modern homes.</p><p>Design-forward cat trees command 30-50% higher retail prices and sell 2-3x faster than generic models, according to Amazon category data. For B2B buyers, this means <strong>higher margins and faster inventory turnover</strong>.</p>"),
            ("Top 5 Design Trends Shaping 2026",
             "<p><strong>1. Furniture-Grade Aesthetics.</strong> Cat trees that look like mid-century modern furniture — wood finishes, neutral tones, clean lines. The 'cat furniture' category has grown 47% YoY on Amazon.</p><p><strong>2. Wall-Mounted Systems.</strong> Space-saving wall-mounted cat shelves and climbing systems. Ideal for apartments and urban homes. Modular design allows buyers to sell starter kits + expansion packs.</p><p><strong>3. Multi-Cat Configurations.</strong> With 43% of cat-owning households having 2+ cats, multi-level designs with separate resting platforms are essential. Double condos, dual hammocks, and extra-wide perches.</p><p><strong>4. Natural Materials.</strong> Sisal-wrapped posts remain the gold standard, but buyers now demand FSC-certified wood, organic cotton cushions, and jute rope accents. 'Eco-friendly cat tree' search volume up 62%.</p><p><strong>5. Interactive Elements.</strong> Integrated toys, dangling teasers, scratching pads with catnip pockets, and replaceable components. Products that keep cats engaged sell better and generate repeat purchases for replacement parts.</p>"),
            ("Materials That Are Trending: Sisal, Plush, and Wood",
             "<p>Material selection is the foundation of cat tree design. The 2026 sweet spot combines three core materials:</p><ul><li><strong>Sisal rope (8-10mm):</strong> Still the undisputed king for scratching posts. Buyers should specify 100% natural sisal, tightly wound, with no chemical treatment.</li><li><strong>Plush/faux fur (280-400gsm):</strong> The most popular covering for platforms and condos. Trending toward shorter pile (3-5mm) for easier cleaning and a more premium look. Color trends: beige, sage green, charcoal grey.</li><li><strong>Solid wood / MDF + veneer:</strong> For the furniture-grade segment. 15-18mm thick panels with scratch-resistant laminate. Wood species trending: oak veneer, walnut finish, white ash.</li></ul>"),
            ("Multi-Function Cat Trees: Combining Play, Rest, and Scratch",
             "<p>Single-function cat trees are declining. The 2026 buyer wants <strong>3-in-1 designs</strong> that include:</p><ul><li>Scratching surfaces (sisal posts + horizontal cardboard scratchers)</li><li>Resting areas (enclosed condos + open perches + hammocks)</li><li>Play features (dangling toys, tunnels, treat puzzles)</li></ul><p>This multi-function approach increases the product's perceived value and justifies a premium price point. It also reduces SKU count for retailers — one product does the job of three.</p>"),
            ("Color and Aesthetic Trends for US and EU Markets",
             "<p>Color preferences differ significantly between markets:</p><p><strong>US Market:</strong> Warm neutrals dominate — beige, cream, light brown, soft grey. Navy blue accents for contrast. Avoid bright primary colors which read as 'budget' to US consumers.</p><p><strong>EU Market (especially Germany/Scandinavia):</strong> Cooler palettes — white, light grey, sage green, natural wood. Minimalist aesthetic. Scandinavians prefer lighter wood tones; Germans lean toward darker, more substantial designs.</p><p><strong>UK Market:</strong> A blend — grey is universally popular, with beige close behind. British buyers are more receptive to subtle patterns (herringbone, tweed-textured plush).</p>"),
            ("Space-Saving Designs for Apartment Living",
             "<p>With 68% of millennials living in apartments, space-efficient cat trees are a growth category. Key design elements:</p><ul><li><strong>Vertical orientation:</strong> Tall and narrow (120-180cm height, 40-50cm base) rather than wide and sprawling.</li><li><strong>Corner-fit designs:</strong> 90-degree triangular bases that tuck into room corners.</li><li><strong>Over-door hanging systems:</strong> No floor space required; uses existing door frames.</li><li><strong>Foldable/collapsible:</strong> For renters who move frequently.</li></ul><p>These designs typically have higher MOQs due to specialized tooling, but command 40-60% higher retail prices.</p>"),
            ("How to Communicate Design Requirements to Your Factory",
             "<p>Clear communication prevents costly mistakes. Follow this process:</p><ol><li><strong>Provide a detailed tech pack:</strong> Dimensions (cm), materials, colors (Pantone codes), assembly instructions, packaging specs.</li><li><strong>Share reference images:</strong> Competitor products you like (and don't like) with specific notes.</li><li><strong>Request a pre-production sample (PPS):</strong> A single unit made with production-intent materials before mass production.</li><li><strong>Specify tolerances:</strong> Acceptable variance in dimensions (±3mm), color (within one shade), and weight (±5%).</li><li><strong>Use annotated photos for feedback:</strong> Circle issues directly on factory photos with clear instructions.</li></ol>"),
            ("MOQ Considerations for Custom Cat Tree Designs",
             "<p>Custom design MOQs vary by complexity:</p><table><tr><th>Design Type</th><th>Typical MOQ</th><th>Tooling Cost</th></tr><tr><td>Stock design with custom color</td><td>100-200 units</td><td>$0</td></tr><tr><td>Modified existing design</td><td>300-500 units</td><td>$200-$500</td></tr><tr><td>Fully custom design</td><td>500-1000 units</td><td>$1,000-$3,000</td></tr><tr><td>Furniture-grade (wood)</td><td>200-500 units</td><td>$500-$1,500</td></tr></table><p><strong>Pro tip:</strong> Start with a modified existing design to test the market before investing in full custom tooling. Many successful Amazon brands launched this way.</p>")
        ],
        "cta_text": "Looking to manufacture custom cat trees with trending 2026 designs? Entrol's OEM team can help you develop market-ready products with low MOQs. Contact us today.",
        "reading_time": "8 min",
        "tags": ["Cat Trees", "Design Trends", "Product Development", "OEM"]
    },

    "BLOG-016": {
        "content_sections": [
            ("Why Safety Compliance Is Non-Negotiable for B2B Buyers",
             "<p>If you're importing pet products into the US or EU, <strong>safety compliance isn't optional — it's the law.</strong> One failed inspection, one customer complaint, or one CPSC recall can destroy a brand overnight. For B2B buyers — Amazon sellers, distributors, and retailers — compliance is your first line of defense against liability.</p><p>In 2025 alone, the CPSC issued 12 recalls for pet products, ranging from choking hazards in dog toys to structural failures in cat trees. The average cost of a recall? <strong>$100,000-$500,000</strong> in direct costs, plus irreversible brand damage.</p>"),
            ("US Standards: ASTM, CPSIA, and FDA Requirements",
             "<p>The US regulatory framework for pet products involves multiple agencies and standards:</p><p><strong>ASTM F963 (Toy Safety Standard):</strong> While designed for children's toys, many pet toy importers voluntarily comply with ASTM F963 for small parts testing, sharp edges, and heavy metals. This is a strong trust signal for retailers.</p><p><strong>CPSIA (Consumer Product Safety Improvement Act):</strong> Requires third-party testing for lead content (≤90ppm in paint/surface coatings) and phthalates (≤0.1% for six specified phthalates). Applies to any pet product that could be handled by children.</p><p><strong>FDA (Food and Drug Administration):</strong> Only applies to pet food, treats, and oral care products. Not relevant for cat trees, toys, or apparel — but important if you're expanding into edible categories.</p><p><strong>FHSA (Federal Hazardous Substances Act):</strong> Covers products that could be hazardous. Sharp edges, small detachable parts, and toxic materials fall under this.</p>"),
            ("EU Standards: CE Marking, REACH, and OEKO-TEX",
             "<p>The EU regulatory environment is more stringent than the US in several key areas:</p><p><strong>CE Marking:</strong> Mandatory for many product categories sold in the EU/EEA. For pet products, CE marking is required for electronic items (automatic feeders, water fountains, grooming tools with motors). Non-electronic pet products (cat trees, toys, beds) do not require CE marking but must comply with the General Product Safety Regulation (GPSR).</p><p><strong>REACH Regulation (EC 1907/2006):</strong> The most comprehensive chemical safety regulation in the world. Restricts 200+ Substances of Very High Concern (SVHC). All materials in pet products — fabrics, dyes, plastics, adhesives — must comply with REACH limits.</p><p><strong>OEKO-TEX Standard 100:</strong> While voluntary, this certification is a powerful trust signal for textiles (pet beds, apparel, plush toys). It certifies that every component of the product is free from harmful substances. <strong>Entrol's textile pet products are OEKO-TEX certified.</strong></p>"),
            ("Key Differences Between US and EU Requirements",
             "<table><tr><th>Aspect</th><th>United States</th><th>European Union</th></tr><tr><td>Lead limit (surface coating)</td><td>90 ppm (CPSIA)</td><td>90 mg/kg (REACH Annex XVII)</td></tr><tr><td>Phthalates</td><td>6 restricted (CPSIA, ≤0.1%)</td><td>4 restricted (REACH, ≤0.1%) + ongoing additions</td></tr><tr><td>Flame retardants</td><td>State-level (CA TB 117)</td><td>REACH + POP Regulation restrictions</td></tr><tr><td>Formaldehyde (textiles)</td><td>No federal limit; some state limits</td><td>≤75 ppm (OEKO-TEX) or country-specific</td></tr><tr><td>Product registration</td><td>Not required for non-food pet products</td><td>GPSR requires EU Responsible Person</td></tr><tr><td>Labeling</td><td>Country of origin + care instructions</td><td>CE mark (if applicable) + EU address + language-specific warnings</td></tr></table>"),
            ("How to Verify Your Supplier's Compliance",
             "<p>Don't take a supplier's word for it. Follow this verification process:</p><ol><li><strong>Request compliance documentation upfront:</strong> Ask for test reports from ISO 17025-accredited labs (SGS, Intertek, TÜV, Bureau Veritas). Reports should be within 12 months and match your product specifications.</li><li><strong>Verify the test report:</strong> Contact the lab directly using the report number. Counterfeit test reports are a known issue. Most major labs have online report verification portals.</li><li><strong>Conduct pre-shipment testing:</strong> Random-sample testing from your production batch before it ships. This catches batch-specific issues that the supplier's annual testing might miss.</li><li><strong>Annual renewal:</strong> Most certifications require annual renewal. Set calendar reminders for your product portfolio.</li></ol>"),
            ("Common Compliance Failures and How to Avoid Them",
             "<div class='red-flags'><h4>⚠️ Red Flags in Compliance</h4><ul><li><strong>Missing or outdated test reports:</strong> If the report is more than 2 years old, it's worthless for current production.</li><li><strong>Lab reports from unknown facilities:</strong> Only accept reports from ISO 17025-accredited labs. A local Chinese testing lab without international accreditation is not sufficient for US/EU compliance.</li><li><strong>Supplier reluctance to share documentation:</strong> If a factory hesitates to provide test reports, walk away. Legitimate manufacturers are proud of their compliance record.</li><li><strong>Material substitution without notification:</strong> The factory switches to a cheaper material that hasn't been tested. Prevent this by specifying materials in your purchase contract with compliance penalties.</li></ul></div>"),
            ("Documentation You Need Before Importing",
             "<p>Before your shipment leaves China, ensure you have:</p><ul><li><strong>Certificate of Analysis (COA):</strong> Batch-specific test results from an accredited lab.</li><li><strong>Certificate of Conformity (COC):</strong> Declaration that the product meets applicable standards.</li><li><strong>Material Safety Data Sheet (MSDS):</strong> Required if any materials are classified as hazardous (adhesives, some plastics).</li><li><strong>Supplier's compliance declaration:</strong> A signed document from the factory listing the specific regulations and standards the product complies with.</li><li><strong>EU REACH SVHC declaration:</strong> Specifically required for EU imports; confirms the product contains no Substances of Very High Concern above threshold limits.</li></ul>"),
            ("Entrol's Compliance Certifications",
             "<p>At Entrol, we maintain the following certifications to serve US and EU buyers:</p><ul><li><strong>OEKO-TEX Standard 100</strong> — All textile pet products (beds, apparel, plush toys)</li><li><strong>CE Marking</strong> — For electronic pet products in the EU</li><li><strong>REACH Compliance</strong> — Material-level testing for all product lines</li><li><strong>CPSIA Compliance</strong> — Lead and phthalate testing for US-bound products</li><li><strong>DDP Shipping Available</strong> — We handle all customs documentation for EU buyers</li></ul>")
        ],
        "cta_text": "Need a pet product manufacturer with verified US and EU compliance certifications? Entrol provides full documentation with every order. Contact our team to discuss your compliance requirements.",
        "reading_time": "9 min",
        "tags": ["Compliance", "Safety", "EU Market", "US Market"]
    }
}


# ── HTML Template ───────────────────────────────────────────────────────

def nav_html():
    return '''  <!-- Navigation -->
  <header>
    <nav class="navbar">
      <div class="nav-container">
        <div class="logo">
          <a href="/">
            <img src="assets/logo.png" alt="Entrol -  B2B Pet Products Manufacturer" width="48" height="48" style="border-radius: 8px;">
            <span class="logo-text">Entrol</span>
          </a>
        </div>
        <button class="mobile-menu-btn" aria-label="Toggle menu" onclick="document.querySelector('.nav-links').classList.toggle('active')">☰</button>
        <ul class="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/oem-pet-products-manufacturer.html">OEM</a></li>
          <li><a href="/wholesale-pet-products.html">Wholesale</a></li>
          <li><a href="/amazon-pet-supplier.html">Amazon</a></li>
          <li><a href="/products.html">Products</a></li>
          <li><a href="/blog.html">Blog</a></li>
          <li><a href="/contact.html">Contact</a></li>
        </ul>
      </div>
    </nav>
  </header>'''


def blog_card_html(article_data):
    slug = article_data['slug']
    title = article_data['title']
    keyword = article_data['target_keyword']
    tags = " · ".join(article_data['tags'])
    reading_time = article_data.get('reading_time', '8 min')
    return f'''          <article class="blog-card">
            <a href="blog/{slug}.html">
              <h3>{title}</h3>
              <p class="blog-meta">{tags} · {reading_time} read</p>
              <p class="blog-excerpt">{keyword}</p>
              <span class="read-more">Read Article →</span>
            </a>
          </article>'''


def generate_article_html(article_data, content_sections):
    slug = article_data['slug']
    title = article_data['title']
    target_kw = article_data['target_keyword']
    reading_time = article_data.get('reading_time', '8 min')
    cta_text = article_data.get('cta_text', '')
    tags = article_data.get('tags', [])

    sections_html = ''
    for i, (heading, body) in enumerate(content_sections):
        section_id = f"section-{i+1}"
        sections_html += f'''
      <section id="{section_id}" class="content-section">
        <h2>{heading}</h2>
        {body}
      </section>'''

    # Build tags HTML
    tags_html = ' '.join([f'<span class="tag">{t}</span>' for t in tags])

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){{w[l]=w[l]||[];w[l].push({{'gtm.start':
new Date().getTime(),event:'gtm.js'}});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
}})(window,document,'script','dataLayer','GTM-T3ZXMRHS');</script>
<!-- End Google Tag Manager -->
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} | Entrol</title>
  <meta name="description" content="{target_kw}. Expert B2B guide for pet product importers, Amazon sellers, and distributors.">
  <meta name="keywords" content="{target_kw}">
  <link rel="canonical" href="https://www.entrol.com/blog/{slug}.html">
  
<link rel="alternate" hreflang="en-us" href="https://www.entrol.com/blog/{slug}.html" />
<link rel="alternate" hreflang="en-gb" href="https://www.entrol.com/blog/{slug}.html" />
<link rel="alternate" hreflang="en-ca" href="https://www.entrol.com/blog/{slug}.html" />
<link rel="alternate" hreflang="en-au" href="https://www.entrol.com/blog/{slug}.html" />
<link rel="alternate" hreflang="x-default" href="https://www.entrol.com/blog/{slug}.html" />
<!-- Open Graph -->
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{target_kw}. Expert B2B guide for pet product importers, Amazon sellers, and distributors.">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://www.entrol.com/blog/{slug}.html">
  <meta property="og:image" content="https://www.entrol.com/assets/logo.png">
  
  <script async src="https://plausible.io/js/pa-FQF0O3k3eX6BJX0oJcj0y.js"></script>
  <script>
    window.plausible=window.plausible||function(){{(plausible.q=plausible.q||[]).push(arguments)}},plausible.init=plausible.init||function(i){{plausible.o=i||{{}}}};
    plausible.init()
  </script>

  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{title}",
    "description": "{target_kw}. Expert B2B guide for pet product importers, Amazon sellers, and distributors.",
    "image": "https://www.entrol.com/assets/logo.png",
    "author": {{
      "@type": "Organization",
      "name": "Entrol",
      "url": "https://www.entrol.com"
    }},
    "publisher": {{
      "@type": "Organization",
      "name": "Entrol",
      "url": "https://www.entrol.com",
      "logo": {{
        "@type": "ImageObject",
        "url": "https://www.entrol.com/assets/logo.png"
      }}
    }},
    "datePublished": "{datetime.now().strftime('%Y-%m-%d')}",
    "dateModified": "{datetime.now().strftime('%Y-%m-%d')}",
    "mainEntityOfPage": {{
      "@type": "WebPage",
      "@id": "https://www.entrol.com/blog/{slug}.html"
    }}
  }}
  </script>

  <link rel="stylesheet" href="../css/style.css">
  <style>
    .blog-article {{ max-width: 800px; margin: 0 auto; padding: 40px 20px; }}
    .blog-article h1 {{ font-size: 2.2em; margin-bottom: 12px; color: #1a1a2e; }}
    .blog-meta-top {{ color: #666; font-size: 0.9em; margin-bottom: 30px; display: flex; gap: 20px; flex-wrap: wrap; align-items: center; }}
    .blog-meta-top .tag {{ display: inline-block; background: #f0f4ff; color: #3b82f6; padding: 3px 10px; border-radius: 20px; font-size: 0.85em; }}
    .content-section {{ margin: 30px 0; }}
    .content-section h2 {{ font-size: 1.5em; color: #1a1a2e; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #f0f4ff; }}
    .content-section p {{ line-height: 1.8; color: #333; margin-bottom: 14px; }}
    .content-section ul, .content-section ol {{ margin: 10px 0 16px 24px; color: #333; }}
    .content-section li {{ margin-bottom: 8px; line-height: 1.7; }}
    .content-section table {{ width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.9em; }}
    .content-section th {{ background: #f0f4ff; padding: 10px 12px; text-align: left; color: #1a1a2e; font-weight: 600; }}
    .content-section td {{ padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }}
    .info-box {{ background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px; padding: 20px; margin: 24px 0; }}
    .info-box h4 {{ color: #0284c7; margin-top: 0; }}
    .red-flags {{ background: #fff5f5; border: 1px solid #fecaca; border-radius: 10px; padding: 20px; margin: 24px 0; }}
    .red-flags h4 {{ color: #dc2626; margin-top: 0; }}
    .red-flags ul {{ margin-bottom: 0; }}
    .cta-box {{ background: linear-gradient(135deg, #1a1a2e, #16213e); color: #fff; border-radius: 12px; padding: 30px; margin: 40px 0; text-align: center; }}
    .cta-box h3 {{ color: #fff; margin-top: 0; font-size: 1.3em; }}
    .cta-box p {{ color: #e2e8f0; margin: 12px 0 20px; }}
    .cta-btn {{ display: inline-block; background: #25D366; color: #fff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px; transition: transform 0.2s; }}
    .cta-btn:hover {{ transform: translateY(-2px); }}
    .cta-btn.secondary {{ background: #fff; color: #1a1a2e; }}
    .cross-links {{ display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 40px 0; }}
    .cross-link-card {{ background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; text-decoration: none; color: #333; transition: box-shadow 0.2s; }}
    .cross-link-card:hover {{ box-shadow: 0 4px 12px rgba(0,0,0,0.1); }}
    .cross-link-card h4 {{ margin: 0 0 6px; color: #1a1a2e; }}
    .cross-link-card p {{ margin: 0; font-size: 0.9em; color: #666; }}
    .back-link {{ margin: 30px 0; }}
    .back-link a {{ color: #3b82f6; text-decoration: none; font-size: 0.95em; }}
    .back-link a:hover {{ text-decoration: underline; }}
    @media (max-width: 768px) {{
      .blog-article h1 {{ font-size: 1.6em; }}
      .cross-links {{ grid-template-columns: 1fr; }}
    }}
  </style>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T3ZXMRHS"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
{nav_html()}

  <main>
    <article class="blog-article">
      <div class="back-link"><a href="/blog.html">← Back to Blog</a></div>
      
      <h1>{title}</h1>
      
      <div class="blog-meta-top">
        <span>{reading_time} read</span>
        {tags_html}
      </div>

      <div class="info-box">
        <h4>📌 Key Takeaways</h4>
        <p>This comprehensive guide covers everything B2B pet product buyers need to know about {target_kw}. Whether you're an Amazon seller, pet store chain, or distributor — you'll find actionable insights to make better sourcing decisions.</p>
      </div>
{sections_html}

      <div class="cta-box">
        <h3>Ready to Source Smarter?</h3>
        <p>{cta_text}</p>
        <a href="https://wa.me/8615263130999?text=Hi%20Entrol,%20I%20read%20your%20article%20on%20{slug.replace('-', '%20')}" class="cta-btn" target="_blank" rel="noopener" onclick="if(window.plausible){{plausible('whatsapp_click',{{props:{{source:'blog/{slug}'}}}})}}">💬 WhatsApp Now</a>
        <a href="/contact.html" class="cta-btn secondary">📧 Send Inquiry</a>
      </div>

      <div class="cross-links">
        <a href="/oem-pet-products-manufacturer.html" class="cross-link-card">
          <h4>OEM Pet Products</h4>
          <p>Custom manufacturing for your brand</p>
        </a>
        <a href="/wholesale-pet-products.html" class="cross-link-card">
          <h4>Wholesale Supply</h4>
          <p>Bulk pricing for distributors</p>
        </a>
      </div>

      <div class="back-link"><a href="/blog.html">← Back to All Articles</a></div>
    </article>
  </main>

  <!-- WhatsApp Float -->
  <a href="https://wa.me/8615263130999?text=Hi%20Entrol" class="whatsapp-float" target="_blank" rel="noopener" onclick="if(window.plausible){{plausible('whatsapp_click',{{props:{{source:'blog-float-{slug}'}}}})}}">
    <svg viewBox="0 0 24 24" width="28" height="28"><path fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    <span>Chat on WhatsApp</span>
  </a>

  <!-- Footer -->
  <footer>
    <div class="footer-container">
      <div class="footer-col">
        <h4>Entrol</h4>
        <p>Your trusted B2B pet products manufacturer in China. OEM, wholesale, and Amazon FBA supply — with verified compliance for US and EU markets.</p>
      </div>
      <div class="footer-col">
        <h4>Services</h4>
        <a href="/oem-pet-products-manufacturer.html">OEM/ODM</a>
        <a href="/wholesale-pet-products.html">Wholesale</a>
        <a href="/amazon-pet-supplier.html">Amazon FBA</a>
        <a href="/private-label-pet-supplier.html">Private Label</a>
      </div>
      <div class="footer-col">
        <h4>Resources</h4>
        <a href="/products.html">Products</a>
        <a href="/blog.html">Blog</a>
        <a href="/contact.html">Contact</a>
        <a href="https://wa.me/8615263130999" target="_blank">WhatsApp</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© {datetime.now().year} Entrol. All rights reserved. | WhatsApp: +86 15263130999</p>
    </div>
  </footer>
</body>
</html>'''
    return html


# ── File Operations ──────────────────────────────────────────────────────

def read_file_safe(path):
    """Read file with fallback encodings."""
    for enc in ['utf-8', 'latin-1', 'gbk']:
        try:
            with open(path, 'r', encoding=enc) as f:
                return f.read(), enc
        except (UnicodeDecodeError, UnicodeError):
            continue
    raise ValueError(f"Cannot read {path} with any encoding")


def update_blog_html(new_article_data):
    """Add a blog card to blog.html before </main>."""
    content, enc = read_file_safe(BLOG_HTML)
    card = blog_card_html(new_article_data)
    
    # Find the blog-grid section and insert before the closing </div> before </main>
    # Strategy: insert before the last </div> that comes before </main>
    if '</main>' in content:
        insert_point = content.rfind('</main>')
        new_content = content[:insert_point] + '\n' + card + '\n        ' + content[insert_point:]
    else:
        # Fallback: insert before </body>
        insert_point = content.rfind('</body>')
        new_content = content[:insert_point] + '\n' + card + '\n' + content[insert_point:]
    
    with open(BLOG_HTML, 'w', encoding=enc if enc != 'latin-1' else 'utf-8') as f:
        f.write(new_content)
    print(f"  ✅ Updated blog.html with card for: {new_article_data['title']}")


def update_sitemap_xml(slug):
    """Add new blog URL to sitemap.xml."""
    content, enc = read_file_safe(SITEMAP)
    
    new_url = f'''  <url>
    <loc>https://www.entrol.com/blog/{slug}.html</loc>
    <lastmod>{datetime.now().strftime('%Y-%m-%d')}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>
  </url>
'''
    
    if '</urlset>' in content:
        insert_point = content.rfind('</urlset>')
        new_content = content[:insert_point] + new_url + '\n' + content[insert_point:]
    else:
        print("  ⚠️  Could not find </urlset> in sitemap.xml")
        return
    
    with open(SITEMAP, 'w', encoding=enc if enc != 'latin-1' else 'utf-8') as f:
        f.write(new_content)
    print(f"  ✅ Updated sitemap.xml with: /blog/{slug}.html")


def update_calendar_status(article_id, new_status='completed'):
    """Mark an article as completed in the calendar."""
    with open(CALENDAR_PATH, 'r', encoding='utf-8') as f:
        calendar = json.load(f)
    
    for month_data in calendar['calendar']:
        for article in month_data['articles']:
            if article['id'] == article_id:
                article['status'] = new_status
                article['completed_date'] = datetime.now().strftime('%Y-%m-%d')
                print(f"  ✅ Marked {article_id} as '{new_status}'")
                break
    
    with open(CALENDAR_PATH, 'w', encoding='utf-8') as f:
        json.dump(calendar, f, indent=2, ensure_ascii=False)


def find_pending_articles():
    """Find all pending articles in the calendar, sorted by ID."""
    with open(CALENDAR_PATH, 'r', encoding='utf-8') as f:
        calendar = json.load(f)
    
    pending = []
    for month_data in calendar['calendar']:
        for article in month_data['articles']:
            if article['status'] == 'pending':
                pending.append(article)
    
    pending.sort(key=lambda x: x['id'])
    return pending


# ── Main ─────────────────────────────────────────────────────────────────

def generate_article(article_data, dry_run=False):
    """Generate a single article and update supporting files."""
    article_id = article_data['id']
    title = article_data['title']
    slug = article_data['slug']
    
    print(f"\n{'[DRY RUN] ' if dry_run else ''}Generating: {article_id} — {title}")
    
    # Verify content exists
    if article_id not in ARTICLE_CONTENTS:
        print(f"  ❌ No content template found for {article_id}")
        print(f"  ℹ️  Add content to ARTICLE_CONTENTS dict in this script")
        return False
    
    content_sections = ARTICLE_CONTENTS[article_id]['content_sections']
    reading_time = ARTICLE_CONTENTS[article_id].get('reading_time', '8 min')
    cta_text = ARTICLE_CONTENTS[article_id].get('cta_text', '')
    tags = ARTICLE_CONTENTS[article_id].get('tags', [])
    
    # Merge metadata
    article_data['reading_time'] = reading_time
    article_data['cta_text'] = cta_text
    article_data['tags'] = tags
    
    if dry_run:
        print(f"  Would generate: blog/{slug}.html")
        print(f"  Sections: {len(content_sections)}")
        print(f"  Would update: blog.html, sitemap.xml")
        return True
    
    # Generate HTML
    html = generate_article_html(article_data, content_sections)
    
    # Write blog post
    blog_path = os.path.join(BLOG_DIR, f"{slug}.html")
    with open(blog_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"  ✅ Created: blog/{slug}.html ({len(html):,} bytes)")
    
    # Update blog.html
    update_blog_html(article_data)
    
    # Update sitemap.xml
    update_sitemap_xml(slug)
    
    # Update calendar
    update_calendar_status(article_id, 'completed')
    
    return True


def main():
    dry_run = '--dry-run' in sys.argv
    generate_all = '--all' in sys.argv
    
    # Check for specific article
    specific_id = None
    for arg in sys.argv:
        if arg.startswith('--article='):
            specific_id = arg.split('=')[1]
        elif arg.startswith('BLOG-'):
            specific_id = arg
    
    # Find pending articles
    pending = find_pending_articles()
    
    if not pending:
        print("📭 No pending articles found in calendar.")
        return
    
    print(f"📋 Found {len(pending)} pending article(s) in calendar\n")
    
    if specific_id:
        # Generate specific article
        target = next((a for a in pending if a['id'] == specific_id), None) or \
                 next((a for month in json.load(open(CALENDAR_PATH, 'r', encoding='utf-8'))['calendar']
                       for a in month['articles'] if a['id'] == specific_id), None)
        if target:
            generate_article(target, dry_run)
        else:
            print(f"❌ Article {specific_id} not found in calendar")
    elif generate_all:
        # Generate all pending
        for article in pending:
            generate_article(article, dry_run)
    else:
        # Generate only the next one
        next_article = pending[0]
        print(f"Generating next article: {next_article['id']} — {next_article['title']}")
        print("(Use --all to generate all pending articles)\n")
        generate_article(next_article, dry_run)
    
    # Summary
    if not dry_run:
        remaining = find_pending_articles()
        print(f"\n{'='*60}")
        print(f"📊 Calendar Status: {len(remaining)} pending, completed up to {datetime.now().strftime('%Y-%m-%d')}")
        print(f"Next: {remaining[0]['id']} — {remaining[0]['title']}" if remaining else "All caught up! 🎉")


if __name__ == '__main__':
    main()

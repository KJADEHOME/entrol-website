# -*- coding: utf-8 -*-
"""
Inject the production photo gallery block into every category page.

Idempotent: re-running will not duplicate the gallery, the stylesheet link
or the script tag.
"""
import os
import re
import sys

REPO = r"D:\codex\entrol-growth-os\source"
MANIFEST = os.path.join(REPO, "scripts", "product_images_manifest.json")

import json

CSS_LINK = '<link rel="stylesheet" href="product-gallery.css">'
JS_TAG = '<script src="product-gallery.js"></script>'

# slug -> (group title, alt prefix)
ALT = {
    "pet-carrier": "Pet Carriers",
    "pet-travel-bag": "Pet Travel Bags",
    "pet-car-seat": "Pet Car Seats",
    "pet-bed": "Pet Beds",
    "pet-leash": "Pet Leashes &amp; Collars",
    "pet-toy": "Pet Toys",
    "pet-bowl": "Pet Bowls",
    "pet-clothing": "Pet Clothing",
    "pet-comb": "Pet Combs &amp; Brushes",
    "slow-feeder-mat": "Slow Feeder &amp; Licking Mats",
    "scratching-board": "Cat Scratching Boards",
}

WA = "8615263130999"

PAGES = [
    {
        "file": "pet-travel.html",
        "anchor": '<script src="script.js"></script>',
        "before": True,
        "title": "Pet Travel &amp; Carrier Production Gallery",
        "sub": "Real production references for carriers, travel bags and car-seat protection. "
               "Dimensions, load rating, materials and hardware are confirmed by SKU.",
        "groups": ["pet-carrier", "pet-travel-bag", "pet-car-seat"],
        "product": "Pet%20Travel%20Accessories",
        "wa_msg": "Hi%20Entrol%2C%20I%20need%20wholesale%20pet%20carrier%20and%20travel%20bag%20pricing",
    },
    {
        "file": "pet-bedding.html",
        "anchor": '<section class="related-insights"',
        "before": True,
        "title": "Pet Bedding Production Gallery",
        "sub": "Production references for beds, mats and cushions. Fill type, cover fabric, "
               "size range and wash requirements are confirmed by SKU.",
        "groups": ["pet-bed"],
        "product": "Pet%20Bedding",
        "wa_msg": "Hi%20Entrol%2C%20I%20need%20wholesale%20pet%20bed%20pricing",
    },
    {
        "file": "pet-apparel.html",
        "anchor": '<section class="related-insights"',
        "before": True,
        "title": "Pet Clothing Production Gallery",
        "sub": "Knitwear, sweaters, jackets and seasonal apparel from our production floor. "
               "Yarn composition, gauge, sizing and labelling are confirmed by SKU.",
        "groups": ["pet-clothing"],
        "product": "Pet%20Apparel",
        "wa_msg": "Hi%20Entrol%2C%20I%20need%20wholesale%20pet%20clothing%20pricing",
    },
    {
        "file": "dog-toys-oem.html",
        "anchor": "<!-- PROCESS -->",
        "before": True,
        "title": "Pet Toy Production Gallery",
        "sub": "Plush, rope, chew and enrichment toy references from our production floor. "
               "Materials, safety testing and packaging are confirmed by SKU.",
        "groups": ["pet-toy"],
        "product": "Dog%20Toys",
        "wa_msg": "Hi%20Entrol%2C%20I%20need%20OEM%20pet%20toy%20pricing",
    },
    {
        "file": "pet-feeding.html",
        "anchor": '<script src="script.js"></script>',
        "before": True,
        "title": "Pet Feeding Production Gallery",
        "sub": "Bowls, slow feeders and licking mats from our production floor. "
               "Materials, food-contact requirements and packaging are confirmed by SKU.",
        "groups": ["pet-bowl", "slow-feeder-mat"],
        "product": "Pet%20Feeding%20Supplies",
        "wa_msg": "Hi%20Entrol%2C%20I%20need%20wholesale%20pet%20bowl%20and%20slow%20feeder%20pricing",
    },
    {
        "file": "pet-grooming.html",
        "anchor": '<script src="script.js"></script>',
        "before": True,
        "title": "Pet Grooming Production Gallery",
        "sub": "Combs, brushes and grooming tools from our production floor. "
               "Handle material, bristle specification and packaging are confirmed by SKU.",
        "groups": ["pet-comb"],
        "product": "Pet%20Grooming%20Supplies",
        "wa_msg": "Hi%20Entrol%2C%20I%20need%20wholesale%20pet%20grooming%20tool%20pricing",
    },
    {
        "file": "cat-tree.html",
        "anchor": '<section class="related-insights"',
        "before": True,
        "title": "Cat Scratching Board Production Gallery",
        "sub": "Scratching boards, posts and sisal surfaces from our production floor. "
               "Board density, sisal grade, frame structure and packaging are confirmed by SKU.",
        "groups": ["scratching-board"],
        "product": "Cat%20Trees",
        "wa_msg": "Hi%20Entrol%2C%20I%20need%20wholesale%20cat%20scratching%20board%20pricing",
    },
    {
        "file": "pet-leashes.html",
        "anchor": "<!-- GALLERY -->",
        "before": True,
        "title": "Leash &amp; Collar Production Gallery",
        "sub": "Leashes, collars, harnesses and training lines from our production floor. "
               "Webbing width, rope construction, hardware finish and pull strength are confirmed by SKU.",
        "groups": ["pet-leash"],
        "product": "Pet%20Leashes%20and%20Collars",
        "wa_msg": "Hi%20Entrol%2C%20I%20need%20wholesale%20dog%20leash%20and%20collar%20pricing",
    },
]


def build_group(slug, data):
    label = ALT.get(slug, slug)
    items = data["items"]
    rows = []
    for i, it in enumerate(items, start=1):
        alt = "Wholesale %s &mdash; production reference %d | Entrol OEM/ODM" % (
            label.replace("&amp;", "and"), i)
        rows.append(
            '          <div class="pg-item"><img src="%s" alt="%s" loading="lazy" '
            'decoding="async"></div>' % (it["file"], alt)
        )
    return (
        '      <div class="pg-group" data-pg-gallery data-pg-caption="%s">\n'
        '        <div class="pg-group-head">\n'
        '          <h3 class="pg-group-title">%s</h3>\n'
        '          <span class="pg-group-count">%d references</span>\n'
        '        </div>\n'
        '        <div class="pg-grid">\n%s\n        </div>\n'
        '      </div>\n'
    ) % (label, label, len(items), "\n".join(rows))


def build_section(cfg, manifest):
    groups = "".join(build_group(s, manifest[s]) for s in cfg["groups"])
    total = sum(manifest[s]["count"] for s in cfg["groups"])
    return (
        '\n<section class="section pg-section" id="gallery">\n'
        '  <div class="container">\n'
        '    <div class="pg-head">\n'
        '      <p class="pg-eyebrow">Production Gallery &middot; %d references</p>\n'
        '      <h2 class="pg-title">%s</h2>\n'
        '      <p class="pg-sub">%s</p>\n'
        '    </div>\n'
        '%s'
        '    <div class="pg-cta">\n'
        '      <p>Seen a reference close to your requirement? Send the item number, target '
        'specification, estimated quantity and destination market for a product-specific quotation.</p>\n'
        '      <div class="pg-cta-btns">\n'
        '        <a href="contact.html?product=%s" class="btn btn-primary">Request Quote &rarr;</a>\n'
        '        <a href="https://wa.me/%s?text=%s" target="_blank" rel="noopener" class="btn" '
        'style="background:#25D366;color:#fff;border:none;">WhatsApp This Range</a>\n'
        '      </div>\n'
        '    </div>\n'
        '  </div>\n'
        '</section>\n'
    ) % (total, cfg["title"], cfg["sub"], groups, cfg["product"], WA, cfg["wa_msg"])


def main():
    with open(MANIFEST, encoding="utf-8") as f:
        manifest = json.load(f)

    for cfg in PAGES:
        path = os.path.join(REPO, cfg["file"])
        if not os.path.isfile(path):
            print("[MISS] %s" % cfg["file"])
            continue
        with open(path, encoding="utf-8") as f:
            html = f.read()

        changed = False

        # 1. gallery block
        if 'id="gallery"' in html:
            print("[SKIP] %-20s gallery already present" % cfg["file"])
        else:
            anchor = cfg["anchor"]
            if anchor not in html:
                print("[ERR ] %-20s anchor not found: %r" % (cfg["file"], anchor))
                continue
            block = build_section(cfg, manifest)
            if cfg["before"]:
                html = html.replace(anchor, block + anchor, 1)
            else:
                html = html.replace(anchor, anchor + block, 1)
            changed = True

        # 2. stylesheet
        if "product-gallery.css" not in html:
            m = re.search(r"</head>", html, re.I)
            if not m:
                print("[ERR ] %-20s no </head>" % cfg["file"])
                continue
            html = html[:m.start()] + CSS_LINK + "\n" + html[m.start():]
            changed = True

        # 3. script
        if "product-gallery.js" not in html:
            idx = html.rfind("</body>")
            if idx == -1:
                print("[ERR ] %-20s no </body>" % cfg["file"])
                continue
            html = html[:idx] + JS_TAG + "\n" + html[idx:]
            changed = True

        if changed:
            with open(path, "w", encoding="utf-8", newline="") as f:
                f.write(html)
            n = sum(manifest[s]["count"] for s in cfg["groups"])
            print("[OK  ] %-20s +%d images" % (cfg["file"], n))

    return 0


if __name__ == "__main__":
    sys.exit(main())

# -*- coding: utf-8 -*-
"""
Wire the new pet-leashes.html category page into site navigation,
the products index and the sitemap. Idempotent.
"""
import os
import re
import sys

REPO = r"D:\codex\entrol-growth-os\source"
TODAY = "2026-09-10"

NEW = "pet-leashes.html"
NAV_TRAVEL = '<li><a href="pet-travel.html">Pet Travel</a></li>'
NAV_TRAVEL_SHORT = '<li><a href="pet-travel.html">Travel</a></li>'
NAV_NEW = '<li><a href="pet-leashes.html">Pet Leashes</a></li>'

# products.html: new category card using a real production photo
CARD_ANCHOR = '<a href="pet-travel.html" class="cat-card reveal">'
CARD_NEW = (
    '<a href="pet-leashes.html" class="cat-card reveal">'
    '<div class="cat-card-img"><img src="assets/images/pet-leash-1.webp" alt="Wholesale pet leashes and collars" '
    'loading="lazy" decoding="async"></div>'
    '<div class="cat-card-body"><h3>Leashes &amp; Collars</h3>'
    '<p>Flat webbing, rope and reflective leashes with matching collars and harnesses.</p>'
    '<span class="cat-card-link">Explore leashes &rarr;</span></div></a>\n\n        '
)

# products.html: JSON-LD ItemList entry
LIST_ANCHOR = """          {

            "@type": "ListItem",

            "position": 4,"""
LIST_NEW = """          {

            "@type": "ListItem",

            "position": 5,

            "item": {

              "@type": "WebPage",

              "@id": "https://www.entrol.com/pet-leashes.html",

              "name": "Pet Leashes & Collars",

              "description": "Leashes, collars, harnesses and training lines for wholesale and private-label sourcing.",

              "url": "https://www.entrol.com/pet-leashes.html"

            }

          }

        ]

      }

    ]

  }

  </script>"""
# we only need to insert the new ListItem before the closing of itemListElement
LIST_ITEM_NEW = """          },

          {

            "@type": "ListItem",

            "position": 5,

            "item": {

              "@type": "WebPage",

              "@id": "https://www.entrol.com/pet-leashes.html",

              "name": "Pet Leashes & Collars",

              "description": "Leashes, collars, harnesses and training lines for wholesale and private-label sourcing.",

              "url": "https://www.entrol.com/pet-leashes.html"

            }

          """

INQUIRE_ANCHOR = '<button onclick="openInquiryFor(\'Dog Toys\')" class="btn btn-inquire" style="font-size:0.9rem;padding:12px 24px;">Inquire Now &mdash;Dog Toys</button>'
INQUIRE_NEW = '<button onclick="openInquiryFor(\'Pet Leashes\')" class="btn btn-inquire" style="font-size:0.9rem;padding:12px 24px;">Inquire Now &mdash;Pet Leashes</button>'

FOOTER_ANCHOR = '<a href="pet-bedding.html">Pet Bedding</a>'
FOOTER_NEW = '<a href="pet-bedding.html">Pet Bedding</a><a href="pet-leashes.html">Leashes &amp; Collars</a><a href="pet-travel.html">Pet Travel</a>'

GALLERY_PAGES = [
    "pet-travel.html", "pet-bedding.html", "pet-apparel.html", "dog-toys-oem.html",
    "pet-feeding.html", "pet-grooming.html", "cat-tree.html", "pet-leashes.html",
]


def edit(path, fn):
    if not os.path.isfile(path):
        print("[MISS] %s" % os.path.basename(path))
        return
    with open(path, encoding="utf-8") as f:
        html = f.read()
    out, n = fn(html)
    if n:
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write(out)
    print("[%-4s] %-22s %d change(s)" % ("OK" if n else "SKIP", os.path.basename(path), n))


def add_nav(html):
    n = 0
    if NEW in html:
        return html, 0
    for anchor in (NAV_TRAVEL, NAV_TRAVEL_SHORT):
        if anchor in html:
            html = html.replace(anchor, anchor + "\n            " + NAV_NEW, 1)
            n += 1
            break
    return html, n


def main():
    # 1. navigation on index.html and products.html
    for name in ("index.html", "products.html"):
        edit(os.path.join(REPO, name), add_nav)

    # 2. products.html extras
    ppath = os.path.join(REPO, "products.html")

    def products_fn(html):
        n = 0
        if 'href="pet-leashes.html" class="cat-card' not in html and CARD_ANCHOR in html:
            html = html.replace(CARD_ANCHOR, CARD_NEW + CARD_ANCHOR, 1)
            n += 1
        if '"position": 5' not in html and LIST_ANCHOR in html:
            # insert new ListItem after the Dog Toys entry: find position 4 block end
            idx = html.find(LIST_ANCHOR)
            close = html.find("          }\n\n        ]", idx)
            if close == -1:
                close = html.find("        ]", idx)
            if close != -1:
                html = html[:close] + "          },\n\n          {\n\n            \"@type\": \"ListItem\",\n\n            \"position\": 5,\n\n            \"item\": {\n\n              \"@type\": \"WebPage\",\n\n              \"@id\": \"https://www.entrol.com/pet-leashes.html\",\n\n              \"name\": \"Pet Leashes & Collars\",\n\n              \"description\": \"Leashes, collars, harnesses and training lines for wholesale and private-label sourcing.\",\n\n              \"url\": \"https://www.entrol.com/pet-leashes.html\"\n\n            }\n\n          " + html[close:]
                n += 1
        if "openInquiryFor(&#39;Pet Leashes&#39;)" not in html and "Pet Leashes&#39;" not in html and INQUIRE_ANCHOR in html:
            html = html.replace(INQUIRE_ANCHOR, INQUIRE_ANCHOR + "\n\n        " + INQUIRE_NEW, 1)
            n += 1
        if FOOTER_ANCHOR in html and 'pet-leashes.html">Leashes' not in html:
            html = html.replace(FOOTER_ANCHOR, FOOTER_NEW, 1)
            n += 1
        return html, n

    edit(ppath, products_fn)

    # 3. sitemap: add new URL + bump lastmod on gallery pages
    spath = os.path.join(REPO, "sitemap.xml")
    with open(spath, encoding="utf-8") as f:
        sm = f.read()
    n = 0
    if NEW not in sm:
        entry = ("  <url>\n    <loc>https://www.entrol.com/%s</loc>\n"
                 "    <lastmod>%s</lastmod>\n    <changefreq>monthly</changefreq>\n"
                 "    <priority>0.8</priority>\n  </url>\n" % (NEW, TODAY))
        sm = sm.replace("</urlset>", entry + "</urlset>")
        n += 1
    for page in GALLERY_PAGES:
        pat = re.compile(r"(<loc>https://www\.entrol\.com/" + re.escape(page) + r"</loc>\s*<lastmod>)([\d-]+)(</lastmod>)")
        sm, c = pat.subn(lambda m: m.group(1) + TODAY + m.group(3), sm)
        n += c
    with open(spath, "w", encoding="utf-8", newline="") as f:
        f.write(sm)
    print("[OK  ] sitemap.xml           %d change(s)" % n)

    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Entrol 内链权重传递脚本
- 为 16 篇博客 + 5 个 P2 着陆页添加/升级指向 4 个钱页的上下文内链
- 锚文本改为关键词丰富版本（OEM Pet Products Manufacturer 等）
- 使用内联样式，不依赖 styles.css（原 cross-links 类无共享样式）
- 带编码 fallback (utf-8 -> latin-1)
"""
import os, re

BASE = "D:/codex/entrol-growth-os/source"

# 钱页相对路径（用相对路径，适配子目录 blog/）
OEM = "../oem-pet-products-manufacturer.html"
AMAZON = "../amazon-pet-supplier.html"
WHOLESALE = "../wholesale-pet-products.html"
PRIVATE = "../private-label-pet-supplier.html"
CUSTOM = "../custom-pet-products.html"
CATMAN = "../cat-tree-manufacturer.html"
CATOEM = "../cat-tree-oem.html"

# 每个文件 -> [(目标href, 锚文本标题, 描述), ...]
LINKS = {
    # ---------------- 博客 (16) ----------------
    "blog/amazon-fba-pet-products-sourcing-guide.html": [
        (AMAZON, "Amazon FBA Pet Supplier", "FBA-ready OEM supply for Amazon sellers"),
        (OEM, "OEM Pet Products Manufacturer", "Custom pet product manufacturing in China"),
    ],
    "blog/cat-tree-design-trends-2026.html": [
        (OEM, "OEM Pet Products Manufacturer", "Custom cat tree OEM and ODM in China"),
        (CATMAN, "Cat Tree Manufacturer China", "85+ OEM cat tree designs, low MOQ 50pcs"),
        (WHOLESALE, "Wholesale Pet Products Supplier", "Bulk cat tree pricing, factory direct"),
    ],
    "blog/cat-tree-manufacturer-china-guide.html": [
        (CATMAN, "Cat Tree Manufacturer China", "OEM cat tree factory since 2005"),
        (OEM, "OEM Pet Products Manufacturer", "Custom OEM and ODM pet products"),
        (WHOLESALE, "Wholesale Pet Products Supplier", "Factory-direct bulk pricing"),
    ],
    "blog/cat-tree-materials-guide.html": [
        (CATMAN, "Cat Tree Manufacturer China", "Sisal, plush and wood cat trees"),
        (OEM, "OEM Pet Products Manufacturer", "Custom materials and finishes"),
    ],
    "blog/custom-packaging-guide-pet-products.html": [
        (OEM, "OEM Pet Products Manufacturer", "Custom packaging and private label"),
        (PRIVATE, "Private Label Pet Supplier", "Branded packaging for your SKUs"),
    ],
    "blog/freight-shipping-guide-pet-products-china.html": [
        (WHOLESALE, "Wholesale Pet Products Supplier", "Bulk shipping and mixed containers"),
        (OEM, "OEM Pet Products Manufacturer", "FOB, CIF, DDP worldwide"),
    ],
    "blog/how-to-choose-pet-product-manufacturer.html": [
        (OEM, "OEM Pet Products Manufacturer", "Verified China factory since 2005"),
        (AMAZON, "Amazon FBA Pet Supplier", "Compliance-ready for Amazon"),
    ],
    "blog/moq-factory-negotiation-guide.html": [
        (OEM, "OEM Pet Products Manufacturer", "Low MOQ from 200 units"),
        (WHOLESALE, "Wholesale Pet Products Supplier", "Tiered bulk pricing"),
    ],
    "blog/oem-vs-odm-manufacturing.html": [
        (OEM, "OEM Pet Products Manufacturer", "OEM and ODM custom manufacturing"),
        (CUSTOM, "Custom Pet Products", "Turn your design into product"),
    ],
    "blog/pet-product-industry-trends-2026.html": [
        (OEM, "OEM Pet Products Manufacturer", "Manufacture trending pet products"),
        (AMAZON, "Amazon FBA Pet Supplier", "Best-sellers for Amazon sellers"),
    ],
    "blog/pet-product-oem-cost-guide.html": [
        (OEM, "OEM Pet Products Manufacturer", "Transparent OEM pricing"),
        (WHOLESALE, "Wholesale Pet Products Supplier", "Volume discount tiers"),
    ],
    "blog/pet-product-quality-control-china.html": [
        (OEM, "OEM Pet Products Manufacturer", "AQL 2.5 QC, multi-stage"),
        (AMAZON, "Amazon FBA Pet Supplier", "FBA-compliant quality"),
    ],
    "blog/pet-product-safety-standards-us-eu.html": [
        (OEM, "OEM Pet Products Manufacturer", "CPSIA and REACH compliant"),
        (AMAZON, "Amazon FBA Pet Supplier", "Amazon compliance docs"),
    ],
    "blog/private-label-pet-brand-amazon.html": [
        (AMAZON, "Amazon FBA Pet Supplier", "Private label for Amazon"),
        (PRIVATE, "Private Label Pet Supplier", "Build your own brand"),
    ],
    "blog/sustainable-pet-product-manufacturing.html": [
        (OEM, "OEM Pet Products Manufacturer", "Eco-friendly OEM materials"),
        (WHOLESALE, "Wholesale Pet Products Supplier", "Sustainable bulk supply"),
    ],
    "blog/wholesale-pet-products-import-guide.html": [
        (WHOLESALE, "Wholesale Pet Products Supplier", "Import in bulk, low MOQ"),
        (OEM, "OEM Pet Products Manufacturer", "Factory-direct sourcing"),
    ],
    # ---------------- P2 着陆页 (5) ----------------
    "cat-tree-manufacturer.html": [
        (OEM, "OEM Pet Products Manufacturer", "Custom cat tree OEM"),
        (WHOLESALE, "Wholesale Pet Products Supplier", "Bulk cat tree pricing"),
        (CATOEM, "Cat Tree OEM", "OEM and ODM cat trees"),
    ],
    "custom-pet-products.html": [
        (OEM, "OEM Pet Products Manufacturer", "Custom OEM manufacturing"),
        (PRIVATE, "Private Label Pet Supplier", "Your brand, our factory"),
    ],
    "dog-toys-oem.html": [
        (OEM, "OEM Pet Products Manufacturer", "Custom dog toy OEM"),
        (WHOLESALE, "Wholesale Pet Products Supplier", "Bulk dog toy supply"),
    ],
    "private-label-pet-supplier.html": [
        (OEM, "OEM Pet Products Manufacturer", "Private label OEM"),
        (AMAZON, "Amazon FBA Pet Supplier", "Amazon-ready private label"),
    ],
    "cat-tree-oem.html": [
        (OEM, "OEM Pet Products Manufacturer", "Cat tree OEM and ODM"),
        (CATMAN, "Cat Tree Manufacturer China", "85+ cat tree designs"),
        (WHOLESALE, "Wholesale Pet Products Supplier", "Bulk cat tree pricing"),
    ],
}

CARD_STYLE = ("display:block;background:#fff;border:1px solid #e0e0e0;border-radius:12px;"
              "padding:24px;text-decoration:none;transition:all 0.3s;")
WRAP_STYLE = ("display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));"
              "gap:20px;margin:40px 0;")
H4_STYLE = "margin:0 0 8px;color:#1a1a2e;font-size:1.1rem;"
P_STYLE = "margin:0;color:#666;font-size:0.9rem;"

# 博客在 blog/ 子目录 -> 用 ../ ; 着陆页在根目录 -> 用 ./
PREFIX_BLOG = "../"
PREFIX_ROOT = "./"


def read_file(path):
    for enc in ("utf-8", "latin-1"):
        try:
            with open(path, encoding=enc) as f:
                return f.read(), enc
        except Exception:
            continue
    raise RuntimeError("cannot read " + path)


def make_block(items):
    cards = []
    for href, title, desc in items:
        cards.append(
            f'        <a href="{href}" class="cross-link-card" style="{CARD_STYLE}">\n'
            f'          <h4 style="{H4_STYLE}">{title}</h4>\n'
            f'          <p style="{P_STYLE}">{desc}</p>\n'
            f'        </a>'
        )
    cards_html = "\n".join(cards)
    return (
        f'      <div class="cross-links" style="{WRAP_STYLE}">\n'
        f'{cards_html}\n'
        f'      </div>'
    )


def fix_href_prefix(items, prefix):
    """将 ../xxx.html 根据文件位置重写成正确相对路径。
    prefix='../' 用于 blog/ 子目录；prefix='./' 用于根目录着陆页。"""
    out = []
    for href, title, desc in items:
        base = href
        if base.startswith("../"):
            base = base[3:]
        elif base.startswith("./"):
            base = base[2:]
        out.append((prefix + base, title, desc))
    return out


def insert_or_replace(html, block):
    """返回 (新html, 动作)"""
    if 'class="cross-links"' in html:
        new_html = re.sub(r'<div class="cross-links"[^>]*>.*?</div>',
                          block, html, count=1, flags=re.S)
        return new_html, "replaced"
    if 'class="back-link"' in html:
        new_html = html.replace('<div class="back-link">',
                                 block + "\n\n      <div class=\"back-link\">", 1)
        return new_html, "inserted(back-link)"
    if '</footer>' in html:
        new_html = html.replace('</footer>', block + "\n\n      </footer>", 1)
        return new_html, "inserted(footer-close)"
    if '<footer' in html:
        new_html = html.replace('<footer', block + "\n\n      <footer", 1)
        return new_html, "inserted(footer)"
    # 兜底：放在 WhatsApp Floating Button 注释前（内容真正结尾）
    for marker in ("<!-- WhatsApp Floating Button -->",
                   "<!-- WhatsApp Floating Widget -->",
                   '<a href="https://wa.me/'):
        idx = html.find(marker)
        if idx != -1:
            return html[:idx] + block + "\n\n" + html[idx:], f"inserted({marker[:20]})"
    return html + "\n" + block, "appended"


def main():
    report = []
    for rel, items in LINKS.items():
        path = os.path.join(BASE, rel)
        if not os.path.exists(path):
            report.append(f"SKIP (missing): {rel}")
            continue
        html, enc = read_file(path)
        before = html.count('cross-link-card')
        prefix = "../" if rel.startswith("blog/") else "./"
        items_fixed = fix_href_prefix(items, prefix)
        block = make_block(items_fixed)
        new_html, action = insert_or_replace(html, block)
        with open(path, "w", encoding=enc) as f:
            f.write(new_html)
        after = new_html.count('cross-link-card')
        report.append(f"{action:18} {rel:48} cards {before}->{after} [{enc}]")
    print("\n".join(report))
    print(f"\nTotal files processed: {len(LINKS)}")


if __name__ == "__main__":
    main()

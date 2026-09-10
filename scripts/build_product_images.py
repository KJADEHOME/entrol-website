# -*- coding: utf-8 -*-
"""
Batch-convert Entrol 2026 pet product photos into web-optimised WebP assets.

Source : D:\\Entrol production list PPT\\pet product\\entrol pet procuct 2026\\<category folder>\\
Target : <repo>/source/assets/images/<slug>-<n>.webp

Also emits a manifest JSON describing every generated asset so the HTML
gallery builder does not need to re-scan the filesystem.
"""
import json
import os
import re
import sys

from PIL import Image

SRC_ROOT = r"D:\Entrol production list PPT\pet product\entrol pet procuct 2026"
REPO = r"D:\codex\entrol-growth-os\source"
IMG_OUT = os.path.join(REPO, "assets", "images")
MANIFEST = os.path.join(REPO, "scripts", "product_images_manifest.json")

# source folder -> (slug, target page, display label)
CATEGORIES = {
    "1-entrol pet procuct-pet carriers 2026": ("pet-carrier", "pet-travel.html", "Pet Carriers"),
    "2-entrol pet procuct-pet travel bags 2026": ("pet-travel-bag", "pet-travel.html", "Pet Travel Bags"),
    "3-entrol pet procuct-pet car seats 2026": ("pet-car-seat", "pet-travel.html", "Pet Car Seats"),
    "4-entrol pet procuct-pet beds 2026": ("pet-bed", "pet-bedding.html", "Pet Beds"),
    "5-entrol pet procuct-pet leashes 2026": ("pet-leash", "pet-leashes.html", "Pet Leashes & Collars"),
    "6-entrol pet procuct-pet toys 2026": ("pet-toy", "dog-toys-oem.html", "Pet Toys"),
    "7-entrol pet procuct-pet bowls 2026": ("pet-bowl", "pet-feeding.html", "Pet Bowls"),
    "8-entrol pet procuct-pet clothing 2026": ("pet-clothing", "pet-apparel.html", "Pet Clothing"),
    "9-entrol pet procuct-pet combs 2026": ("pet-comb", "pet-grooming.html", "Pet Combs & Brushes"),
    "10-entrol pet procuct-slow feeder licking mats 2026": ("slow-feeder-mat", "pet-feeding.html", "Slow Feeder & Licking Mats"),
    "11-entrol pet procuct-pet scratching roards 2026": ("scratching-board", "cat-tree.html", "Cat Scratching Boards"),
}

MAX_W = 1200
QUALITY = 82


def natural_key(name):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", name)]


def main():
    os.makedirs(IMG_OUT, exist_ok=True)
    manifest = {}
    total_in = total_out = 0

    for folder, (slug, page, label) in CATEGORIES.items():
        src_dir = os.path.join(SRC_ROOT, folder)
        if not os.path.isdir(src_dir):
            print(f"[MISS] {folder}")
            continue

        files = sorted(
            [f for f in os.listdir(src_dir) if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))],
            key=natural_key,
        )
        items = []
        for i, fname in enumerate(files, start=1):
            src = os.path.join(src_dir, fname)
            dst_name = f"{slug}-{i}.webp"
            dst = os.path.join(IMG_OUT, dst_name)
            try:
                with Image.open(src) as im:
                    im = im.convert("RGB")
                    if im.width > MAX_W:
                        h = round(im.height * MAX_W / im.width)
                        im = im.resize((MAX_W, h), Image.LANCZOS)
                    im.save(dst, "WEBP", quality=QUALITY, method=6)
            except Exception as e:  # noqa: BLE001
                print(f"[ERR ] {src}: {e}")
                continue

            b_in, b_out = os.path.getsize(src), os.path.getsize(dst)
            total_in += b_in
            total_out += b_out
            items.append({"file": f"assets/images/{dst_name}", "src": dst_name})

        manifest[slug] = {"label": label, "page": page, "count": len(items), "items": items}
        print(f"[OK  ] {slug:<18} {len(items):>3} images -> {page}")

    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    n = sum(v["count"] for v in manifest.values())
    print(f"\nTotal: {n} images | {total_in/1e6:.1f}MB -> {total_out/1e6:.1f}MB "
          f"({(1-total_out/total_in)*100:.0f}% saved)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

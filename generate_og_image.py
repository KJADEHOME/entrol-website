from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1200, 627
BG = '#f5f0e8'        # warm cream, matches site palette
TEXT_DARK = '#1a2332' # near-black navy
TEXT_MUTED = '#5a6473'
ACCENT = '#c78d46'    # warm gold/terracotta accent

img = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(img)

# Try common Windows fonts
font_paths = [
    r'C:\Windows\Fonts\segoeui.ttf',
    r'C:\Windows\Fonts\arial.ttf',
    r'C:\Windows\Fonts\calibri.ttf',
]
font_path = None
for fp in font_paths:
    if os.path.exists(fp):
        font_path = fp
        break

brand_font = ImageFont.truetype(font_path, 96) if font_path else ImageFont.load_default()
title_font = ImageFont.truetype(font_path, 60) if font_path else ImageFont.load_default()
sub_font   = ImageFont.truetype(font_path, 30) if font_path else ImageFont.load_default()

# Logo
logo_path = r'D:\codex\entrol-growth-os\source\assets\logo.png'
logo = Image.open(logo_path).convert('RGBA')
# Resize logo to ~260px wide
lw, lh = logo.size
scale = 260 / lw
logo = logo.resize((int(lw*scale), int(lh*scale)), Image.LANCZOS)
img.paste(logo, (80, 80), logo)

# Text block
x = 80
y = 260

draw.text((x, y), "Entrol", font=brand_font, fill=TEXT_DARK)
y += 110

draw.text((x, y), "Pet Products Manufacturer", font=title_font, fill=TEXT_DARK)
y += 80

draw.text((x, y), "& OEM Supplier in China", font=title_font, fill=TEXT_DARK)
y += 100

draw.text((x, y), "Wholesale cat trees, pet apparel, bedding & toys  ·  Est. 2005",
          font=sub_font, fill=TEXT_MUTED)

# Accent line
line_y = 580
draw.rectangle([80, line_y, 80 + 160, line_y + 4], fill=ACCENT)

out_path = r'D:\codex\entrol-growth-os\source\assets\og-image-entrol.png'
img.save(out_path, 'PNG')
print(f"Saved {out_path} ({W}x{H})")

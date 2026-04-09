import os

html_dir = r'F:\龙虾\entrol-website'

# Fix index.html - swap cat-tree and pet-bedding desktop images
f = os.path.join(html_dir, 'index.html')
c = open(f, 'r', encoding='utf-8').read()

# Swap in category cards (首页三大卡片)
c = c.replace('hero-product-1.png', 'SWAP_CAT')
c = c.replace('hero-product-111.jpg', 'hero-product-1.png')
c = c.replace('SWAP_CAT', 'hero-product-111.jpg')

# Swap in hero floating images
c = c.replace('hero-product-1.png', 'SWAP_CAT')
c = c.replace('hero-product-111.jpg', 'hero-product-1.png')
c = c.replace('SWAP_CAT', 'hero-product-111.jpg')

# Swap in bestsellers strip
c = c.replace('hero-product-1.png', 'SWAP_CAT')
c = c.replace('hero-product-111.jpg', 'hero-product-1.png')
c = c.replace('SWAP_CAT', 'hero-product-111.jpg')

open(f, 'w', encoding='utf-8').write(c)
print('index.html: swapped cat-tree <-> pet-bedding images')

# Fix products.html - swap in category cards
f2 = os.path.join(html_dir, 'products.html')
c2 = open(f2, 'r', encoding='utf-8').read()
c2 = c2.replace('hero-product-1.png', 'SWAP_CAT')
c2 = c2.replace('hero-product-111.jpg', 'hero-product-1.png')
c2 = c2.replace('SWAP_CAT', 'hero-product-111.jpg')
open(f2, 'w', encoding='utf-8').write(c2)
print('products.html: swapped cat-tree <-> pet-bedding images')

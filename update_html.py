#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
批量更新 HTML 文件脚本
- 将所有 .jpg/.png 改成 .webp
- 给所有 <img> 标签加上 loading="lazy" decoding="async"
- 给首屏大图加 preload 优化
"""

import os
import re
import sys

# 设置控制台输出为 UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 首屏图片路径（需要 preload，不要加 lazy）
HERO_IMAGES = [
    'pet-bedding_1.webp',
    'hero-product-111.webp',
    'hero-product-11.webp',
    'hero-product-1.webp',
]

def update_html_file(file_path):
    """更新单个 HTML 文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # 1. 替换图片扩展名为 .webp
        content = re.sub(r'([a-zA-Z0-9_-]+)\.(jpg|jpeg|png)', r'\1.webp', content, flags=re.IGNORECASE)

        # 2. 为所有 <img> 标签添加 loading="lazy" 和 decoding="async"
        # 但跳过已经有 loading 属性的标签
        def add_loading_attrs(match):
            img_tag = match.group(0)
            src_match = re.search(r'src\s*=\s*["\']([^"\']+)["\']', img_tag, re.IGNORECASE)

            if not src_match:
                return img_tag

            src = src_match.group(1)
            filename = os.path.basename(src)

            # 检查是否是首屏图片（不加 lazy）
            if filename in HERO_IMAGES:
                # 只添加 decoding="async"，不添加 loading
                if 'decoding=' not in img_tag:
                    # 找到 > 之前的位置
                    insert_pos = img_tag.rfind('>')
                    if insert_pos != -1:
                        img_tag = img_tag[:insert_pos] + ' decoding="async"' + img_tag[insert_pos:]
                return img_tag

            # 其他图片添加 loading="lazy" 和 decoding="async"
            if 'loading=' not in img_tag:
                # 找到 > 之前的位置
                insert_pos = img_tag.rfind('>')
                if insert_pos != -1:
                    attrs_to_add = []
                    if 'loading=' not in img_tag:
                        attrs_to_add.append('loading="lazy"')
                    if 'decoding=' not in img_tag:
                        attrs_to_add.append('decoding="async"')

                    if attrs_to_add:
                        img_tag = img_tag[:insert_pos] + ' ' + ' '.join(attrs_to_add) + img_tag[insert_pos:]

            return img_tag

        content = re.sub(r'<img[^>]+>', add_loading_attrs, content, flags=re.IGNORECASE)

        # 只有内容变化时才写入文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False

    except Exception as e:
        print(f"处理文件失败 {file_path}: {e}")
        return False

def main():
    project_dir = r"F:\龙虾\entrol-website"

    print("📝 开始更新 HTML 文件...")
    print("-" * 60)

    # 查找所有 HTML 文件
    html_files = []
    for file in os.listdir(project_dir):
        if file.endswith('.html'):
            html_files.append(os.path.join(project_dir, file))

    # 按文件名排序
    html_files.sort()

    updated_count = 0
    for html_file in html_files:
        filename = os.path.basename(html_file)
        print(f"📄 处理中: {filename}")

        if update_html_file(html_file):
            updated_count += 1
            print(f"   ✅ 已更新")
        else:
            print(f"   ℹ️  无需更新")

    print("-" * 60)
    print(f"\n📊 更新完成！")
    print(f"   处理文件数: {len(html_files)}")
    print(f"   更新文件数: {updated_count}")
    print(f"\n💡 接下来请:")
    print(f"   1. 在 index.html 中添加 CSS preload")
    print(f"   2. 提交并推送到 GitHub")

if __name__ == "__main__":
    main()

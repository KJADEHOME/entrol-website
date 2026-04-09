#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
图片压缩脚本
压缩 assets 文件夹中的所有 jpg、jpeg、png 图片
"""

import os
import sys
from PIL import Image
from pathlib import Path

# 设置控制台输出为 UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def compress_image(input_path, quality=85, max_size=(1920, 1920)):
    """压缩单张图片"""
    try:
        with Image.open(input_path) as img:
            # 转换为 RGB 模式（如果是 RGBA）
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')

            # 调整图片大小（保持宽高比）
            img.thumbnail(max_size, Image.LANCZOS)

            # 保存压缩后的图片
            img.save(input_path, 'JPEG', quality=quality, optimize=True)
            return True
    except Exception as e:
        print(f"压缩失败 {input_path}: {e}")
        return False

def get_file_size(filepath):
    """获取文件大小（字节）"""
    return os.path.getsize(filepath)

def format_size(size_bytes):
    """格式化文件大小"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

def main():
    assets_dir = r"F:\龙虾\entrol-website\assets"

    print("🖼️  开始压缩图片...")
    print("-" * 60)

    total_original = 0
    total_compressed = 0
    compressed_count = 0

    # 遍历所有图片文件
    for root, dirs, files in os.walk(assets_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                filepath = os.path.join(root, file)

                # 跳过 raw 文件夹（备份原始图片）
                if 'raw' in filepath.lower():
                    print(f"⏭️  跳过原始备份: {file}")
                    continue

                original_size = get_file_size(filepath)
                total_original += original_size

                print(f"📦 压缩中: {file} ({format_size(original_size)})")

                # 压缩图片
                if compress_image(filepath, quality=75, max_size=(1200, 1200)):
                    compressed_size = get_file_size(filepath)
                    total_compressed += compressed_size
                    compressed_count += 1

                    saved = original_size - compressed_size
                    saved_percent = (saved / original_size) * 100

                    print(f"   ✅ {format_size(original_size)} → {format_size(compressed_size)} "
                          f"(节省 {saved_percent:.1f}%)")
                else:
                    print(f"   ❌ 压缩失败")

    print("-" * 60)
    print(f"\n📊 压缩完成！")
    print(f"   压缩图片数: {compressed_count}")
    print(f"   原始总大小: {format_size(total_original)}")
    print(f"   压缩后大小: {format_size(total_compressed)}")
    print(f"   节省空间: {format_size(total_original - total_compressed)} "
          f"({((total_original - total_compressed) / total_original * 100):.1f}%)")

if __name__ == "__main__":
    main()

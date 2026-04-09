#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
图片压缩脚本 v2 - 使用 WebP 格式
压缩 assets 文件夹中的所有 jpg、jpeg、png 图片并转换为 WebP
"""

import os
import sys
from PIL import Image
from pathlib import Path
import shutil

# 设置控制台输出为 UTF-8
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

def compress_to_webp(input_path, output_path, quality=80):
    """压缩图片并转换为 WebP 格式"""
    try:
        with Image.open(input_path) as img:
            # 保存为 WebP
            img.save(output_path, 'WEBP', quality=quality, method=6)
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
    project_dir = r"F:\龙虾\entrol-website"
    assets_dir = os.path.join(project_dir, "assets")
    compressed_dir = os.path.join(project_dir, "assets_compressed")

    print("🖼️  开始压缩图片并转换为 WebP...")
    print("-" * 60)

    # 清空或创建输出目录
    if os.path.exists(compressed_dir):
        shutil.rmtree(compressed_dir)
    os.makedirs(compressed_dir)

    total_original = 0
    total_compressed = 0
    compressed_count = 0

    # 遍历所有图片文件
    for root, dirs, files in os.walk(assets_dir):
        for file in files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                input_path = os.path.join(root, file)

                # 跳过 raw 文件夹（备份原始图片）
                if 'raw' in input_path.lower():
                    print(f"⏭️  跳过原始备份: {file}")
                    continue

                # 跳过 logo.png（需要保留透明背景）
                if file == 'logo.png':
                    print(f"⏭️  跳过 logo（保留 PNG）: {file}")
                    continue

                # 计算相对路径以保持目录结构
                rel_path = os.path.relpath(root, assets_dir)
                output_subdir = os.path.join(compressed_dir, rel_path)

                if not os.path.exists(output_subdir):
                    os.makedirs(output_subdir)

                # 生成 WebP 文件名
                filename_no_ext = os.path.splitext(file)[0]
                output_path = os.path.join(output_subdir, f"{filename_no_ext}.webp")

                original_size = get_file_size(input_path)
                total_original += original_size

                print(f"📦 压缩中: {file} ({format_size(original_size)})")

                # 压缩并转换为 WebP
                if compress_to_webp(input_path, output_path, quality=80):
                    compressed_size = get_file_size(output_path)
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
    print(f"\n📁 WebP 文件已保存到: {compressed_dir}")
    print(f"💡 接下来请运行 update_html.py 更新 HTML 文件")

if __name__ == "__main__":
    main()

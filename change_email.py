#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批量将网站上的联系邮箱统一改为 wangyan@entrol.com（带编码 fallback）。"""
import os
import glob

ROOT = os.path.dirname(os.path.abspath(__file__))

# 仅替换真实业务邮箱；占位符(email@example.com 等)与个人备注不动
REPLACEMENTS = {
    "wangyan@entrol.com": "wangyan@entrol.com",
    "wangyan@entrol.com": "wangyan@entrol.com",
    "wangyan@entrol.com": "wangyan@entrol.com",
}

# 目标文件范围：网页(html)、站点脚本(js)、生成器(py)、文档(md)
PATTERNS = ["*.html", "script.js", "*.py", "*.md"]


def read_file(path):
    for enc in ("utf-8", "latin-1"):
        try:
            with open(path, "r", encoding=enc) as f:
                return f.read(), enc
        except UnicodeDecodeError:
            continue
    with open(path, "r", encoding="latin-1") as f:
        return f.read(), "latin-1"


def collect_files():
    files = set()
    files.update(glob.glob(os.path.join(ROOT, "*.html")))
    files.update(glob.glob(os.path.join(ROOT, "blog", "*.html")))
    files.update(glob.glob(os.path.join(ROOT, "script.js")))
    files.update(glob.glob(os.path.join(ROOT, "*.py")))
    files.update(glob.glob(os.path.join(ROOT, "tools", "*.py")))
    files.update(glob.glob(os.path.join(ROOT, "*.md")))
    return sorted(files)


def main():
    changed = []
    for path in collect_files():
        html, enc = read_file(path)
        new = html
        for old, new_addr in REPLACEMENTS.items():
            new = new.replace(old, new_addr)
        if new != html:
            with open(path, "w", encoding=enc) as f:
                f.write(new)
            n = sum(html.count(o) for o in REPLACEMENTS)
            changed.append((os.path.relpath(path, ROOT), n))
    if not changed:
        print("无文件需要修改")
        return
    print(f"已修改 {len(changed)} 个文件：")
    for rel, n in changed:
        print(f"  {rel}: {n} 处")


if __name__ == "__main__":
    main()

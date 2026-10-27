#!/usr/bin/env python3
"""Ön görsellerden arka planı kaldırılmış, 256 renge indirgenmiş sanal deneme PNG'leri üretir: repo/img/tryon/KOD.png"""
from PIL import Image, ImageFilter
import numpy as np, json, os
ms = json.load(open('data/models.json', encoding='utf-8'))['models']
os.makedirs('repo/img/tryon', exist_ok=True)
def cut(src, dst, maxw=900):
    im = Image.open(src).convert('RGB')
    if im.width > maxw: im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    a = np.asarray(im).astype(np.int32)
    d = np.sqrt(((255 - a) ** 2).sum(axis=2))          # beyaza uzaklık
    alpha = np.clip((d - 18) / 40.0, 0, 1)                # 18 altı şeffaf, 58 üstü opak
    al = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
    out = im.convert('RGBA'); out.putalpha(al)
    bb = al.point(lambda p: 255 if p > 10 else 0).getbbox(); out = out.crop(bb) if bb else out
    out.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG).save(dst, optimize=True)
n = 0
for m in ms:
    d = f"repo/img/{m['brand_slug']}/"
    cut(d + m['images']['front'], f"repo/img/tryon/{m['code']}.png"); n += 1
    for v in m['variants']:
        if v['images'].get('front'): cut(d + v['images']['front'], f"repo/img/tryon/{v['code']}.png"); n += 1
print(n, 'png')

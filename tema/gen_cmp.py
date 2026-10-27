#!/usr/bin/env python3
"""Clip-on modeller için karşılaştırma çifti üretir: img/cmp/KOD-optik.jpg (clip'siz, ilk renk) ve KOD-clipon.jpg (katalogdaki clip takılı ana görsel).
İki görsel gözlük sınır kutusuna göre hizalanır; aynı tuvale, aynı ölçekte basılır."""
import json, os
from PIL import Image, ImageChops

ms = json.load(open('data/models.json', encoding='utf-8'))['models']
os.makedirs('repo/img/cmp', exist_ok=True)
W = 1000
def bbox(im, thr=242):
    g = im.convert('L').point(lambda p: 255 if p < thr else 0)
    return g.getbbox()
def place(im, bb, scale, canvas_w, canvas_h, cx, cy):
    w = int(im.width * scale); h = int(im.height * scale)
    im2 = im.resize((w, h), Image.LANCZOS)
    bx = (bb[0] * scale, bb[1] * scale, bb[2] * scale, bb[3] * scale)
    bcx = (bx[0] + bx[2]) / 2; bcy = (bx[1] + bx[3]) / 2
    out = Image.new('RGB', (canvas_w, canvas_h), 'white')
    out.paste(im2, (int(round(cx - bcx)), int(round(cy - bcy))))
    return out
n = 0
for m in ms:
    if m['category'] != 'Clip-On' or not m['variants']:
        continue
    d = f"repo/img/{m['brand_slug']}/"
    R = Image.open(d + m['images']['front']).convert('RGB')
    L = Image.open(d + m['variants'][0]['images']['front']).convert('RGB')
    bR, bL = bbox(R), bbox(L)
    if not bR or not bL:
        print('bbox yok', m['code']); continue
    wR = bR[2] - bR[0]; wL = bL[2] - bL[0]
    sR = (W * 0.9) / wR                 # clip takılı görsel tuvalin %90'ı
    sL = sR * wR / wL                   # optik görsel aynı genişliğe
    hR = (bR[3] - bR[1]) * sR; hL = (bL[3] - bL[1]) * sL
    H = int(max(hR, hL) * 1.3)
    cx, cy = W / 2, H / 2
    place(L, bL, sL, W, H, cx, cy).save(f"repo/img/cmp/{m['code']}-optik.jpg", quality=86)
    place(R, bR, sR, W, H, cx, cy).save(f"repo/img/cmp/{m['code']}-clipon.jpg", quality=86)
    n += 1
print(n, 'çift üretildi')

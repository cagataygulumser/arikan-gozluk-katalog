#!/usr/bin/env python3
"""Ön görsellerden sanal deneme PNG'leri üretir: repo/img/tryon/KOD.png
- beyaz arka plan kaldırılır (alpha)
- cam içinden görünen katlı sap uçları silinir (şeffaf cam: boşluğun dışbükey zarfı içindeki opak pikseller; renkli cam: satır medyanından çok koyu bölgeler boyanır)
- 256 renge indirgenir"""
from PIL import Image, ImageFilter
import numpy as np, json, os, cv2
ms = json.load(open('data/models.json', encoding='utf-8'))['models']
os.makedirs('repo/img/tryon', exist_ok=True)

def tinted_fix(rgb, alpha):
    """Renkli (opak) camların arkasından görünen sapları boyayarak siler. rgb uint8 HxWx3, alpha uint8."""
    H,W,_=rgb.shape
    opaque=(alpha>40).astype(np.uint8)
    k=max(6,int(W*0.045)); er=cv2.erode(opaque, np.ones((k,k),np.uint8))
    n,lab=cv2.connectedComponents(er)
    comps=[i for i in range(1,n) if (lab==i).sum()>0.03*H*W]
    comps=sorted(comps,key=lambda i:-(lab==i).sum())[:2]
    if len(comps)<2: return rgb,0
    gray=cv2.cvtColor(rgb,cv2.COLOR_RGB2GRAY).astype(np.int32); tot=0
    for i in comps:
        m=(lab==i).astype(np.uint8)
        reg=cv2.dilate(m,np.ones((int(k*0.7),)*2,np.uint8)).astype(bool)   # cam bölgesi (çerçeveye ulaşmadan)
        dark=np.zeros((H,W),bool)
        for y in range(H):
            row=reg[y]
            if row.sum()<10: continue
            med=np.median(gray[y,row]); dark[y]=row&(gray[y]<med-30)
        dark=cv2.morphologyEx(dark.astype(np.uint8),cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
        n2,l2=cv2.connectedComponents(dark)
        for j in range(1,n2):
            c=l2==j
            if c.sum()<0.003*H*W: continue
            tot+=int(c.sum()); mask=cv2.dilate(c.astype(np.uint8),np.ones((7,7),np.uint8))
            rgb=cv2.inpaint(rgb,mask,7,cv2.INPAINT_TELEA)
    return rgb,tot

def strip_temples(alpha, soft0=None):
    """alpha: uint8 (H,W). Camların kapalı boşluklarını bul; her boşluğun dışbükey zarfı içindeki (zarfın birkaç px içi) opak pikselleri şeffaf yap."""
    H, W = alpha.shape
    opaque = (alpha > 40).astype(np.uint8)
    # boşluk tespiti için: silik cam kenarlarını (rimless naylon/çizgi) da say ve küçük açıklıkları kapat
    if soft0 is None: soft0 = (alpha > 10).astype(np.uint8)
    holes = []
    for frac in (0.012, 0.03, 0.05):                                 # boşluk bulunamazsa daha güçlü kapatma dene
        kc = max(3, int(round(W * frac))); soft = cv2.morphologyEx(soft0, cv2.MORPH_CLOSE, np.ones((kc, kc), np.uint8))
        # kenara değmeyen şeffaf bölgeler = cam boşlukları
        n, lab = cv2.connectedComponents(1 - soft, connectivity=4)
        border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
        holes = [i for i in range(1, n) if i not in border and (lab == i).sum() > 0.02 * H * W]
        holes = sorted(holes, key=lambda i: -(lab == i).sum())[:2]
        if len(holes) == 2: break
    if not holes: return alpha, 0
    out = alpha.copy(); removed = 0
    for i in holes:
        m = (lab == i).astype(np.uint8)
        cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        hull = cv2.convexHull(max(cnts, key=cv2.contourArea))
        hm = np.zeros((H, W), np.uint8); cv2.fillConvexPoly(hm, hull, 1)
        k = max(2, int(round(W * 0.012)))                      # zarfı içe doğru daralt: çerçeve kenarına dokunma
        hm = cv2.erode(hm, np.ones((k, k), np.uint8))
        # zarf içindeki opak pikseller: çerçeve dışındaki ada(lar) = sap ucu, burun pedi vb.
        inside = (hm == 1) & (opaque == 1)
        # çerçeve kenarına bitişik opak pikselleri koru: zarf içindeki opak bileşenler, zarf dışına taşıyorsa (= çerçevenin kendisi) atlanır
        n2, lab2 = cv2.connectedComponents(opaque, connectivity=8)
        for j in range(1, n2):
            comp = lab2 == j
            if not (comp & inside).any(): continue
            frac_in = (comp & (hm == 1)).sum() / comp.sum()
            if frac_in > 0.85:                                   # tamamen cam içinde → sap ucu
                out[comp] = 0; removed += int(comp.sum())
            else:                                                 # çerçeveye bağlı: sadece zarfın içinde kalan kısmını sil
                part = comp & inside
                if part.sum() < 0.6 * comp.sum():                  # çerçevenin kendisi değilse
                    out[part] = 0; removed += int(part.sum())
    return out, removed

def cut(src, dst, maxw=900):
    im = Image.open(src).convert('RGB')
    if im.width > maxw: im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    a = np.asarray(im).astype(np.int32)
    d = np.sqrt(((255 - a) ** 2).sum(axis=2))
    alpha = (np.clip((d - 18) / 40.0, 0, 1) * 255).astype(np.uint8)
    rgb, t = tinted_fix(np.asarray(im).copy(), alpha); im = Image.fromarray(rgb)   # renkli cam arkasındaki saplar
    soft0 = (d > 7).astype(np.uint8)                                                  # çok silik cam kenarları (rimless) boşluk tespitinde sayılsın
    alpha, removed = strip_temples(alpha, soft0); removed += t                               # şeffaf cam içindeki sap uçları
    al = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.6))
    out = im.convert('RGBA'); out.putalpha(al)
    bb = al.point(lambda p: 255 if p > 10 else 0).getbbox(); out = out.crop(bb) if bb else out
    out.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG).save(dst, optimize=True)
    return removed

if __name__ == '__main__':
    import sys
    only = set(sys.argv[1:])
    n = 0; stats = []
    for m in ms:
        d = f"repo/img/{m['brand_slug']}/"
        items = [(m['code'], m['images']['front'])] + [(v['code'], v['images'].get('front')) for v in m['variants']]
        for code, f in items:
            if not f or (only and code not in only): continue
            r = cut(d + f, f"repo/img/tryon/{code}.png"); n += 1; stats.append((r, code))
    stats.sort(reverse=True)
    print(n, 'png; sap ucu silinen:', sum(1 for r, _ in stats if r), '; en çok:', stats[:5])

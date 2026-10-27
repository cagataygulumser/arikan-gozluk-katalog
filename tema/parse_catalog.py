#!/usr/bin/env python3
"""Arıkan 2026 katalog PDF'lerinden model/renk verisi ve görsel çıkarır.
Kullanım: python3 parse_catalog.py <pdf> <marka> <kategori> <çıktı_dizini> [--ocr]
"""
import sys, re, json, os, io
import pymupdf

PDF, BRAND, CATEGORY, OUT = sys.argv[1:5]
OCR = '--ocr' in sys.argv
IMG_DIR = os.path.join(OUT, 'img', BRAND.lower().replace(' ', '-'))
os.makedirs(IMG_DIR, exist_ok=True)

CODE_RE = re.compile(r'^([A-Z]{0,2}\d{3,5})\.?C(\d+)$')
MODEL_RE = re.compile(r'^[A-Z]{0,2}\d{3,5}$')
LABELS = ['CLIP ON ÇERÇEVE RENGİ', 'CLIP ON CAM RENGİ', 'CLIP ON LENS RENGİ', 'ÇERÇEVE RENGİ', 'SAP UCU RENGİ',
          'SAP RENGİ', 'LENS RENGİ', 'CAM RENGİ']
MAT_LABELS = ['ÇERÇEVE', 'CAM', 'SAP UCU', 'SAP', 'LENS']

# Eksik "i" glifleri ve OCR hataları için düzeltme tablosu
FIX = {
    'S yah': 'Siyah', 'Lac vert': 'Lacivert', 'Polar ze': 'Polarize', 'Mav': 'Mavi', 'Gr': 'Gri', 'Açık Gr': 'Açık Gri',
    'Koyu Gr': 'Koyu Gri', 'Kr stal': 'Kristal', 'Krem': 'Krem', 'Beyaz': 'Beyaz', 'Ş r': 'Şir', 'P nk': 'Pink',
    'Yeş l': 'Yeşil', 'Kahvereng': 'Kahverengi', 'Haki': 'Haki', 'Hak': 'Haki', 'Sar': 'Sarı', 'Mor': 'Mor',
    'Bej': 'Bej', 'Pembe': 'Pembe', 'K rm z': 'Kırmızı', 'Bordo': 'Bordo', 'Turuncu': 'Turuncu', 'Dem': 'Demi',
    'Gümüş': 'Gümüş', 'Altın': 'Altın', 'Altin': 'Altın', 'Kahverengl': 'Kahverengi', 'Siyan': 'Siyah', 'Gumuş': 'Gümüş', 'Gümüs': 'Gümüş', 'Kirmizi': 'Kırmızı', 'Füme': 'Füme', 'Fume': 'Füme', 'Yesil': 'Yeşil', 'Lacıvert': 'Lacivert', 'Sari': 'Sarı', 'Alt n': 'Altın', 'Gun': 'Gun', 'Bak r': 'Bakır', 'Pet rol': 'Petrol',
    'Şeffaf': 'Şeffaf', 'Mat S yah': 'Mat Siyah', 'Mat Gr': 'Mat Gri', 'Füme': 'Füme', 'Kırçıllı Siyah': 'Kırçıllı Siyah',
    'K rç ll': 'Kırçıllı', 'Kırçıll': 'Kırçıllı', 'Lac vert/Mav': 'Lacivert / Mavi', 'Lacivert/Mavi': 'Lacivert / Mavi',
}

def fix_text(t):
    t = t.replace('İ', 'İ')
    t = re.sub(r'\s+', ' ', t).strip()
    if t in FIX:
        return FIX[t]
    # parça parça düzelt ("Siyah / Gun")
    parts = [p.strip() for p in re.split(r'\s*/\s*', t)]
    parts = [FIX.get(p, p) for p in parts]
    return ' / '.join(parts)

doc = pymupdf.open(PDF)

def spans_of(page):
    out = []
    if OCR:
        import pytesseract
        from PIL import Image
        pix = page.get_pixmap(dpi=400)
        img = Image.open(io.BytesIO(pix.tobytes('png')))
        data = pytesseract.image_to_data(img, lang='tur+eng', config='--psm 11', output_type=pytesseract.Output.DICT)
        scale = 72 / 400
        # kelimeleri satırlara grupla
        lines = {}
        for i, w in enumerate(data['text']):
            w = w.strip()
            if not w or (int(data['conf'][i]) < 40 and data['left'][i] * (72 / 400) < 150) or int(data['conf'][i]) < 0:
                continue
            key = (data['block_num'][i], data['par_num'][i], data['line_num'][i])
            x, y, ww, hh = data['left'][i] * scale, data['top'][i] * scale, data['width'][i] * scale, data['height'][i] * scale
            lines.setdefault(key, []).append((x, y, x + ww, y + hh, w))
        for ws in lines.values():
            ws.sort()
            x0 = min(w[0] for w in ws); y0 = min(w[1] for w in ws); x1 = max(w[2] for w in ws); y1 = max(w[3] for w in ws)
            text = ' '.join(w[4] for w in ws)
            text = text.replace('RENGi', 'RENGİ').replace('RENGI', 'RENGİ').replace('ÇERÇEV ', 'ÇERÇEVE ')
            if text == 'ÇERÇEV': text = 'ÇERÇEVE'
            out.append({'bbox': (x0, y0, x1, y1), 'text': text, 'size': y1 - y0, 'bold': False})
        return out
    d = page.get_text('dict')
    for b in d['blocks']:
        if b['type'] != 0:
            continue
        for l in b['lines']:
            # aynı satırdaki span'leri birleştir
            segs = [s for s in l['spans'] if s['text'].strip()]
            if not segs:
                continue
            text = ''.join(s['text'] for s in segs).strip()
            x0 = min(s['bbox'][0] for s in segs); y0 = min(s['bbox'][1] for s in segs)
            x1 = max(s['bbox'][2] for s in segs); y1 = max(s['bbox'][3] for s in segs)
            out.append({'bbox': (x0, y0, x1, y1), 'text': text, 'size': segs[0]['size'], 'bold': 'Bold' in segs[0]['font'] or 'Medium' in segs[0]['font']})
    return out

def split_codes(spans):
    """'Q503.C1\nQ503.C2' gibi birleşik değil; ama 'LC1408.C1' yanında 'LC1408 .C1' olabilir -> normalize."""
    res = []
    for s in spans:
        t = s['text'].replace(' ', '')
        m = CODE_RE.match(t)
        if m:
            s = dict(s); s['code'] = f"{m.group(1)}.C{int(m.group(2))}"
        res.append(s)
    return res

def images_of(page):
    imgs = []
    for img in page.get_images(full=True):
        for r in page.get_image_rects(img[0]):
            if r.width < 60 or r.height < 25:
                continue  # logo vb.
            if r.width > 500 and r.height > 700:
                continue  # tam sayfa arka plan
            imgs.append({'xref': img[0], 'rect': r})
    return imgs

def save_clip(page, rect, name, dpi=200):
    pad = 2
    clip = pymupdf.Rect(rect.x0 - pad, rect.y0 - pad, rect.x1 + pad, rect.y1 + pad) & page.rect
    pix = page.get_pixmap(dpi=dpi, clip=clip, colorspace=pymupdf.csRGB, alpha=False)
    path = os.path.join(IMG_DIR, name)
    pix.save(path.replace('.jpg', '.png'))
    from PIL import Image
    im = Image.open(path.replace('.jpg', '.png')).convert('RGB')
    im.save(path, 'JPEG', quality=88, optimize=True)
    os.remove(path.replace('.jpg', '.png'))
    return name

models = []
cur = None
flags = {'yeni': False, 'antifar': False}
warnings = []

for pno in range(len(doc)):
    page = doc[pno]
    spans = split_codes(spans_of(page))
    texts = [s['text'] for s in spans]
    joined = ' '.join(texts)
    if 'Yeni Eklenenler' in joined:
        flags['yeni'] = True
    if 'devamı' in joined.lower():
        flags['yeni'] = False
    codes = [s for s in spans if 'code' in s]
    has_dims = any('mm' in t for t in texts)
    if has_dims and len(codes) == 1 and codes[0]['size'] >= 14:
        codes[0]['text'] = codes[0]['code'].split('.')[0]
    big = [s for s in spans if MODEL_RE.match(s['text'].replace(' ', '')) and s['size'] >= 14]
    hero_variant = codes[0]['code'] if (has_dims and len(codes) == 1 and big) else None
    if hero_variant:
        codes = []
    imgs = images_of(page)

    if not codes and big and has_dims:
        # ---- Kapak (hero) sayfası
        code = big[0]['text'].replace(' ', '')
        mm = [t for t in texts if re.search(r'\d+\s*mm', t)]
        nums = [int(x) for t in texts for x in re.findall(r'(\d+)\s*mm', t)]
        # etiket sırasına göre: ÇERÇEVE, KÖPRÜ, SAP (x konumuna göre sırala)
        mmspans = sorted([s for s in spans if re.search(r'\d+\s*mm', s['text'])], key=lambda s: s['bbox'][0])
        vals = [int(re.search(r'(\d+)\s*mm', s['text']).group(1)) for s in mmspans]
        if len(vals) != 3:
            warnings.append(f'p{pno+1} {code}: ölçü sayısı {vals}')
        cur = {'brand': BRAND, 'category': CATEGORY, 'code': code, 'page': pno + 1,
               'lens': vals[0] if len(vals) > 0 else None, 'bridge': vals[1] if len(vals) > 1 else None,
               'temple': vals[2] if len(vals) > 2 else None,
               'new': flags['yeni'], 'antifar': 'Anti-Far' in joined or 'Anti Far' in joined,
               'materials': {}, 'images': {}, 'variants': [], 'hero_variant': hero_variant}
        bigimgs = sorted([i for i in imgs if i['rect'].width > 300], key=lambda i: i['rect'].y0)
        if bigimgs:
            cur['images']['front'] = save_clip(page, bigimgs[0]['rect'], f'{code}-on.jpg')
        if len(bigimgs) > 1:
            cur['images']['side'] = save_clip(page, bigimgs[1]['rect'], f'{code}-yan.jpg')
        if len(bigimgs) > 2:
            cur['images']['clip'] = save_clip(page, bigimgs[2]['rect'], f'{code}-clip.jpg')
        models.append(cur)
        continue

    if codes:
        # ---- Renk varyant sayfası
        mcode = codes[0]['code'].split('.')[0]
        if cur is not None and cur['code'] != mcode and not cur['variants'] and cur['page'] == pno and OCR:
            # OCR kapak kodunu yanlış okumuş; varyant sayfasındaki kodu esas al
            for k in list(cur['images']):
                old = cur['images'][k]; new = old.replace(cur['code'], mcode)
                os.rename(os.path.join(IMG_DIR, old), os.path.join(IMG_DIR, new)); cur['images'][k] = new
            cur['code'] = mcode
        if cur is None or cur['code'] != mcode:
            # kapak sayfası atlanmış olabilir; yeni model aç
            found = [m for m in models if m['code'] == mcode]
            if found:
                cur = found[0]
            else:
                warnings.append(f'p{pno+1}: {mcode} için kapak sayfası yok')
                cur = {'brand': BRAND, 'category': CATEGORY, 'code': mcode, 'page': pno + 1, 'lens': None, 'bridge': None,
                       'temple': None, 'new': flags['yeni'], 'antifar': False, 'materials': {}, 'images': {}, 'variants': []}
                models.append(cur)
        # malzemeler: sol sütun (x < 150)
        left = [s for s in spans if s['bbox'][0] < 150]
        for s in left:
            lab = s['text'].strip().upper()
            if lab in MAT_LABELS:
                y = (s['bbox'][1] + s['bbox'][3]) / 2
                vals = [v for v in left if v is not s and abs((v['bbox'][1] + v['bbox'][3]) / 2 - y) < 6 and v['bbox'][0] > s['bbox'][2]]
                if vals:
                    cur['materials'][lab.title().replace('Sap Ucu', 'Sap Ucu')] = fix_text(vals[0]['text'])
        # varyantlar
        xs = sorted(c['bbox'][0] for c in codes)
        col_x = []
        for x in xs:
            if not col_x or x - col_x[-1][-1] > 60:
                col_x.append([x])
            else:
                col_x[-1].append(x)
        col_x = [sum(g) / len(g) for g in col_x]
        def col_of(x):
            return min(col_x, key=lambda cx: abs(cx - x))
        for c in codes:
            c['col'] = col_of(c['bbox'][0])
        # etiket -> değer
        label_spans = [s for s in spans if s['text'].strip().upper() in LABELS]
        variants = {}
        # katalogda aynı renk kodu birden fazla yazılmışsa (dizgi hatası) konuma göre C1, C2... olarak yeniden numarala
        codes.sort(key=lambda c: (round(c['bbox'][1] / 60), c['bbox'][0]))
        seen = set()
        for c in codes:
            if c['code'] in seen:
                base = c['code'].split('.C')[0]; n = 1
                while f'{base}.C{n}' in seen:
                    n += 1
                warnings.append(f'p{pno+1}: {c["code"]} tekrar -> {base}.C{n}')
                c['code'] = f'{base}.C{n}'
            seen.add(c['code'])
            variants[c['code']] = {'code': c['code'], 'attrs': {}, 'images': {}}
        def owner(x, y):
            # aynı sütunda, üstte olan en yakın kod
            cands = [c for c in codes if c['col'] == col_of(x) and c['bbox'][1] <= y + 12]
            if not cands:
                return None
            return max(cands, key=lambda c: c['bbox'][1])
        for ls in label_spans:
            lab = ls['text'].strip().upper()
            x0, y1 = ls['bbox'][0], ls['bbox'][3]
            vals = [v for v in spans if v is not ls and abs(v['bbox'][0] - x0) < 8 and -2 <= v['bbox'][1] - y1 < (14 if OCR else 8)
                    and v['text'].strip().upper() not in LABELS and 'code' not in v]
            if OCR and vals:
                # ikinci satır
                v1 = max(vals, key=lambda v: v['bbox'][3])
                more = [v for v in spans if v is not ls and v not in vals and abs(v['bbox'][0] - x0) < 8 and -2 <= v['bbox'][1] - v1['bbox'][3] < 10
                        and v['text'].strip().upper() not in LABELS and 'code' not in v]
                vals += more
            own = owner(x0, ls['bbox'][1])
            if own is None:
                continue
            key = {'ÇERÇEVE RENGİ': 'frame_color', 'SAP RENGİ': 'temple_color', 'SAP UCU RENGİ': 'tip_color',
                   'LENS RENGİ': 'lens_color', 'CAM RENGİ': 'lens_color', 'CLIP ON ÇERÇEVE RENGİ': 'clip_frame_color',
                   'CLIP ON CAM RENGİ': 'clip_lens_color', 'CLIP ON LENS RENGİ': 'clip_lens_color'}[lab]
            if vals:
                variants[own['code']]['attrs'][key] = fix_text(' '.join(v['text'] for v in sorted(vals, key=lambda v: (round(v['bbox'][1] / 4), v['bbox'][0]))))
            else:
                warnings.append(f'p{pno+1} {own["code"]}: {lab} değeri yok')
        # görseller
        for im in imgs:
            r = im['rect']
            cx = (r.x0 + r.x1) / 2
            # kod sütunu: görsel merkezi hangi koda yakın
            cands = [c for c in codes if c['bbox'][1] <= r.y0 + 12]
            if not cands:
                continue
            # sütun: en yakın kod x (kod x'i görselin sağında olabilir -> |cx - code.x| en küçük)
            best_col = min(col_x, key=lambda cxx: abs(cxx - cx))
            cands = [c for c in cands if c['col'] == best_col]
            if not cands:
                continue
            own = max(cands, key=lambda c: c['bbox'][1])
            variants[own['code']].setdefault('_imgs', []).append(r)
        for vc, v in variants.items():
            rs = sorted(v.pop('_imgs', []), key=lambda r: r.y0)
            names = ['on', 'yan', 'clip']
            for i, r in enumerate(rs[:3]):
                v['images'][['front', 'side', 'clip'][i]] = save_clip(page, r, f'{vc.replace(".", "-")}-{names[i]}.jpg')
            if len(rs) < 2:
                warnings.append(f'p{pno+1} {vc}: görsel sayısı {len(rs)}')
            cur['variants'].append(v)
        continue

out = {'brand': BRAND, 'category': CATEGORY, 'source': os.path.basename(PDF), 'models': models, 'warnings': warnings}
with open(os.path.join(OUT, f'{BRAND.lower().replace(" ", "-")}-{CATEGORY.lower()}.json'), 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print(f'{BRAND} {CATEGORY}: {len(models)} model, {sum(len(m["variants"]) for m in models)} varyant, {len(warnings)} uyarı')
for w in warnings[:40]:
    print('  !', w)

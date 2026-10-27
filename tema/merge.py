#!/usr/bin/env python3
"""5 katalog JSON'unu tek models.json'da birleştirir, OCR hatalarını düzeltir."""
import json, re, glob, collections

TOKEN_FIX = {
    'at': 'Mat', 'avi': 'Mavi', 'oyu': 'Koyu', 'ristal': 'Kristal', 'Yesi': 'Yeşil', 'Yeşi': 'Yeşil', 'IrmıZzI': 'Kırmızı',
    'Irmızı': 'Kırmızı', 'TR9O': 'TR90', 'TRIO': 'TR90', 'etal': 'Metal', 'Gumus': 'Gümüş', 'Siya': 'Siyah', 'Gumuş': 'Gümüş',
    'Aluminyum': 'Alüminyum', 'Altin': 'Altın', 'Gumüş': 'Gümüş', 'Kahverengl': 'Kahverengi', 'Lacıvert': 'Lacivert',
}
MANUAL = {}  # (variant_code, key) -> value ; görsel kontrol sonrası elle düzeltmeler
try:
    MANUAL = {tuple(k.split('|')): v for k, v in json.load(open('data/manual_fix.json', encoding='utf-8')).items()}
except FileNotFoundError:
    pass

def fix(v):
    if v is None:
        return v
    v = v.strip().strip('-').strip()
    toks = v.split(' ')
    toks = [TOKEN_FIX.get(t, t) for t in toks]
    v = ' '.join(toks)
    v = re.sub(r'\s*/\s*', ' / ', v)
    v = re.sub(r'\s+', ' ', v).strip()
    return v

models = []
for f in sorted(glob.glob('data/*-*.json')):
    if 'manual' in f or f.endswith('models.json'):
        continue
    d = json.load(open(f, encoding='utf-8'))
    for m in d['models']:
        for k in list(m['materials']):
            m['materials'][k] = fix(m['materials'][k])
        for va in m['variants']:
            for k in list(va['attrs']):
                va['attrs'][k] = fix(va['attrs'][k])
                if (va['code'], k) in MANUAL:
                    va['attrs'][k] = MANUAL[(va['code'], k)]
            if (va['code'], 'drop') in MANUAL:
                va['attrs'] = {}
        is_clip = any('clip_frame_color' in va['attrs'] or 'clip_lens_color' in va['attrs'] for va in m['variants']) \
            or m['materials'].get('Cam', '').lower().startswith('polar') or m['category'] == 'Clip-On'
        m['category'] = 'Clip-On' if is_clip else 'Optik'
        m['brand_slug'] = m['brand'].lower().replace(' ', '-')
        m['slug'] = f"{m['brand_slug']}-{m['code'].lower()}"
        models.append(m)

order = {'lee-cooper': 0, 'quantum': 1, 'slazenger': 2, 'belmond': 3}
models.sort(key=lambda m: (order.get(m['brand_slug'], 9), m['category'] != 'Optik', m['page']))

# tutarlılık kontrolü
sus = []
for m in models:
    for va in m['variants']:
        for k, v in va['attrs'].items():
            if not v or len(v) < 3 or v.endswith('/') or v.startswith('/') or re.search(r'[A-Z]{3,}', v) or v in ('Mat', 'Koyu', 'Kristal', 'Açık'):
                sus.append((m['brand'], m['code'], va['code'], k, v))
        if len(va['images']) < 2:
            sus.append((m['brand'], m['code'], va['code'], 'images', len(va['images'])))
    if not m['variants']:
        sus.append((m['brand'], m['code'], '-', 'variants', 0))

json.dump({'generated': '2026-10-27', 'season': '2026', 'models': models}, open('data/models.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(models), 'model', sum(len(m['variants']) for m in models), 'varyant')
print(collections.Counter((m['brand'], m['category']) for m in models))
print('Şüpheli:', len(sus))
for s in sus:
    print(' ', s)

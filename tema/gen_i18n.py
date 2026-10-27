#!/usr/bin/env python3
"""data/i18n_en.json (arayüz sözlüğü) + data/i18n_content_en.json (sayfa/yazı gövdeleri) -> repo/i18n/en.json"""
import json, os
ui = json.load(open('data/i18n_en.json', encoding='utf-8')); ui.pop('_meta', None)
content = json.load(open('data/i18n_content_en.json', encoding='utf-8'))
extra = {
    'Paz #:#–#:#': 'Sun #:#–#:#',
    '— ince ve hafif; kaplama yüzeyi uzun ömürlüdür': '— slim and light; the plated finish is long-lasting',
    '— bitkisel bazlı selüloz asetat; renk derinliği ve dayanıklılık sağlar': '— plant-based cellulose acetate; gives colour depth and durability',
    '— ultra hafif, korozyona dayanıklı ve hipoalerjenik': '— ultra-light, corrosion-resistant and hypoallergenic',
    '— esnek, kırılmaya dayanıklı ve çok hafif termoplastik': '— flexible, break-resistant and very light thermoplastic',
    '— esnek ve hafif polieterimid; sporda ve yoğun kullanımda rahat': '— flexible, light polyetherimide; comfortable for sport and heavy use',
    '— kaymayı önleyen yumuşak kauçuk doku': '— soft, non-slip rubber texture',
    '— çok hafif ve sert karbon fiber yapı': '— very light, rigid carbon-fibre structure',
    '— hafif ve sağlam alüminyum': '— light, sturdy aluminium',
    '— kesme (faset) işlemeli yüzey': '— faceted (cut) surface',
    '— yansımaları keser, parlamayı azaltır ({code})': '— cuts reflections, reduces glare ({code})',
    'Anti-Far seçeneği ne demek?': 'What does the blue-light option mean?',
    'Bu model için gece sürüşüne yönelik, karşı far parlamasını azaltan sarı tonlu anti-far clip-on cam seçeneği de bulunur. Yetkili satış noktasına sorun.': 'A yellow-tinted night-driving clip-on lens that reduces oncoming headlight glare is also available for this model. Ask an authorised store.',
    'Blog · Rehber': 'Blog · Guide', 'Rehber': 'Guide', 'Güneş Gözlüğü': 'Sunglasses',
}
ui.update(extra)
for tr_title, a in content['articles'].items():
    ui[tr_title] = a['title']; ui['@@' + tr_title + ' · Blog · Arıkan Optik'] = a['title'] + ' · Blog · Arıkan Optik'
os.makedirs('repo/i18n', exist_ok=True)
out = {'lang': 'en', 'ui': ui, 'pages': content['pages'], 'articles': content['articles']}
json.dump(out, open('repo/i18n/en.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
print(len(ui), 'arayüz dizesi,', len(content['pages']), 'sayfa,', len(content['articles']), 'yazı ->', os.path.getsize('repo/i18n/en.json') // 1024, 'KB')

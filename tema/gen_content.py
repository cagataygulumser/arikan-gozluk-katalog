#!/usr/bin/env python3
"""models.json -> Blogger içe aktarma XML'i (yazılar + sayfalar) ve önizleme HTML'leri."""
import json, html, os, re, datetime
from xml.sax.saxutils import escape

CDN = 'https://cdn.jsdelivr.net/gh/cagataygulumser/arikan-gozluk-katalog@main/'
SITE = 'https://arikanoptik.blogspot.com'   # içe aktarma sonrası gerçek adres farklı olabilir; önemi yok
BRAND_NAMES = {'lee-cooper': 'Lee Cooper', 'quantum': 'Quantum', 'slazenger': 'Slazenger', 'belmond': 'Belmond'}
LABELS = {'frame_color': 'Çerçeve rengi', 'temple_color': 'Sap rengi', 'tip_color': 'Sap ucu rengi', 'lens_color': 'Lens rengi',
          'clip_frame_color': 'Clip-on çerçeve rengi', 'clip_lens_color': 'Clip-on cam rengi'}
ATTR_ORDER = ['frame_color', 'lens_color', 'temple_color', 'tip_color', 'clip_frame_color', 'clip_lens_color']
MAT_ORDER = ['Çerçeve', 'Sap', 'Sap Ucu', 'Cam', 'Lens']
MAT_DESC = {
    'Metal': 'ince ve hafif; kaplama yüzeyi uzun ömürlüdür',
    'Asetat': 'bitkisel bazlı selüloz asetat; renk derinliği ve dayanıklılık sağlar',
    'Titanyum': 'ultra hafif, korozyona dayanıklı ve hipoalerjenik',
    'TR90': 'esnek, kırılmaya dayanıklı ve çok hafif termoplastik',
    'Ultem': 'esnek ve hafif polieterimid; sporda ve yoğun kullanımda rahat',
    'Rubber': 'kaymayı önleyen yumuşak kauçuk doku',
    'Karbon': 'çok hafif ve sert karbon fiber yapı',
    'Alüminyum': 'hafif ve sağlam alüminyum',
    'Faset': 'kesme (faset) işlemeli yüzey',
    'Polarize': 'yansımaları keser, parlamayı azaltır (UV400)',
}

E = html.escape

def img(m, name):
    return f"{CDN}img/{m['brand_slug']}/{name}"

def dim_str(m):
    return f"{m['lens'] or '–'} □ {m['bridge'] or '–'} – {m['temple'] or '–'}"

def dims_svg():
    return ('<svg aria-hidden="true" fill="none" viewBox="0 0 520 260">'
            '<g stroke="#111827" stroke-width="3"><rect height="96" rx="34" width="170" x="40" y="70"/><rect height="96" rx="34" width="170" x="310" y="70"/>'
            '<path d="M210 100c20-18 80-18 100 0"/><path d="M40 100 4 92M480 100l36-8"/></g>'
            '<g stroke="#DC2626" stroke-width="2"><path d="M40 200h170M40 192v16M210 192v16"/><path d="M218 40h84M218 32v16M302 32v16"/><path d="M60 236h400M60 228v16M460 228v16"/></g>'
            '<g fill="#6B7280" font-family="Montserrat,sans-serif" font-size="13" font-weight="500" letter-spacing="2"><text x="96" y="222">ÇERÇEVE</text><text x="232" y="24">KÖPRÜ</text><text x="244" y="256">SAP</text></g></svg>')

def mat_rows(m):
    rows = []
    for k in MAT_ORDER:
        v = m['materials'].get(k)
        if v:
            d = MAT_DESC.get(v.split(' / ')[0], '')
            rows.append(f'<tr><th>{E(k)}</th><td>{E(v)}' + (f' <small style="color:#919EA7;font-weight:400">— {E(d)}</small>' if d else '') + '</td></tr>')
    return ''.join(rows)

def faq(m, brand):
    code = m['code']; clip = m['category'] == 'Clip-On'
    qa = [
        (f'{code} modeline numaralı cam takılabilir mi?',
         f'Evet. {brand} {code} bir optik çerçevedir; göz numaranıza uygun tek odaklı, progresif (multifokal) ya da mavi ışık filtreli camlar yetkili optik mağazasında bu çerçeveye uygulanır.'
         + (' Clip-on güneş camı ise çerçevenin önüne mıknatısla tutunur; numaralı camınızın üstüne takılır.' if clip else '')),
        ('Ölçüler bana uyar mı?',
         f'{code} modelinin ekartmanı {dim_str(m)} mm\'dir: cam genişliği {m["lens"]} mm, köprü {m["bridge"]} mm, sap uzunluğu {m["temple"]} mm. Şu an kullandığınız gözlüğün sap iç yüzündeki rakamlarla karşılaştırın; cam genişliği ±2 mm, köprü ±1 mm farklar genellikle rahat uyum sağlar. Ayrıntı için ölçü rehberine bakın.'),
        (f'{code} hangi renklerde var?',
         f'{code} modeli {len(m["variants"])} renk seçeneğiyle üretilir: ' + ', '.join(f'{v["code"].split(".")[1]} ({v["attrs"].get("frame_color", "")})' for v in m['variants']) + '. Her rengin ön, yan' + (' ve clip-on' if clip else '') + ' görselleri bu sayfada.'),
        ('Fiyatı nedir, nereden alabilirim?',
         f'{brand} gözlükleri yalnızca yetkili optik mağazalarında satılır; fiyat ve stok bilgisi için size en yakın satış noktasına danışabilirsiniz.'),
    ]
    if clip:
        qa.append(('Clip-on nasıl çalışır?', 'Çerçevenin köprü ve uç kısımlarındaki gizli mıknatıslar, aynı formda üretilmiş güneş camını tek hareketle tutar. Camlar polarizedir: su, yol ve cam yüzeylerden gelen yansımaları keser; UV400 koruma sağlar.'))
    if m.get('antifar'):
        qa.append(('Anti-Far seçeneği ne demek?', 'Bu model için gece sürüşüne yönelik, karşı far parlamasını azaltan sarı tonlu anti-far clip-on cam seçeneği de bulunur. Yetkili satış noktasına sorun.'))
    return ''.join(f'<details><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q, a in qa)

def jsonld(m, brand):
    data = {
        '@context': 'https://schema.org', '@type': 'Product',
        'name': f'{brand} {m["code"]}', 'brand': {'@type': 'Brand', 'name': brand},
        'sku': m['code'], 'category': 'Gözlük Çerçevesi' if m['category'] == 'Optik' else 'Clip-On Gözlük',
        'image': [img(m, m['images'][k]) for k in ('front', 'side') if m['images'].get(k)],
        'description': f'{brand} {m["code"]} {m["category"].lower()} gözlük çerçevesi. Ekartman {dim_str(m)} mm. {len(m["variants"])} renk seçeneği.',
        'additionalProperty': [
            {'@type': 'PropertyValue', 'name': 'Çerçeve genişliği', 'value': m['lens'], 'unitCode': 'MMT'},
            {'@type': 'PropertyValue', 'name': 'Köprü', 'value': m['bridge'], 'unitCode': 'MMT'},
            {'@type': 'PropertyValue', 'name': 'Sap uzunluğu', 'value': m['temple'], 'unitCode': 'MMT'},
        ] + [{'@type': 'PropertyValue', 'name': k, 'value': v} for k, v in m['materials'].items()],
        'color': ', '.join(v['attrs'].get('frame_color', '') for v in m['variants'] if v['attrs'].get('frame_color')),
    }
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False) + '</script>'

def post_html(m):
    brand = BRAND_NAMES.get(m['brand_slug'], m['brand'])
    code = m['code']; clip = m['category'] == 'Clip-On'
    first = m['variants'][0] if m['variants'] else None
    front = img(m, m['images'].get('front') or (first and first['images'].get('front')))
    side = img(m, m['images'].get('side') or (first and first['images'].get('side')))
    clipimg = img(m, first['images']['clip']) if (first and first['images'].get('clip')) else None
    badges = []
    if m.get('new'): badges.append('<span class="badge badge--red">Yeni</span>')
    badges.append('<span class="badge badge--dark">Clip-On</span>' if clip else '<span class="badge">Optik çerçeve</span>')
    if m['materials'].get('Cam', '').lower().startswith('polar'): badges.append('<span class="badge badge--line">Polarize</span>')
    if m.get('antifar'): badges.append('<span class="badge badge--line">Anti-Far seçeneği</span>')
    if 'Titanyum' in m['materials'].values(): badges.append('<span class="badge badge--line">Titanyum</span>')
    badges.append(f'<span class="badge badge--line">{len(m["variants"])} renk</span>')

    color_btns = []
    for v in m['variants']:
        attrs = {k: v['attrs'][k] for k in ATTR_ORDER if v['attrs'].get(k)}
        fimg = img(m, v['images']['front']) if v['images'].get('front') else front
        simg = img(m, v['images']['side']) if v['images'].get('side') else ''
        cimg = img(m, v['images']['clip']) if v['images'].get('clip') else ''
        color_btns.append(
            f'<button type="button" class="color-btn" data-code="{E(v["code"])}" data-front="{E(fimg)}" data-side="{E(simg)}" data-clip="{E(cimg)}" data-attrs="{E(json.dumps(attrs, ensure_ascii=False))}">'
            f'<img loading="lazy" src="{E(fimg)}" alt="{E(brand)} {E(v["code"])}"><b>{E(v["code"].split(".")[1])}</b><small>{E(v["attrs"].get("frame_color", ""))}</small></button>')

    variant_cards = []
    for v in m['variants']:
        imgs = ''.join(f'<img loading="lazy" src="{E(img(m, v["images"][k]))}" alt="{E(brand)} {E(v["code"])} {lbl}">'
                       for k, lbl in (('front', 'ön görünüm'), ('side', 'yan görünüm'), ('clip', 'clip-on')) if v['images'].get(k))
        dl = ''.join(f'<dt>{E(LABELS[k])}</dt><dd>{E(v["attrs"][k])}</dd>' for k in ATTR_ORDER if v['attrs'].get(k))
        variant_cards.append(f'<div class="variant" id="{E(v["code"].replace(".", "-"))}"><div class="variant__imgs">{imgs}</div><div class="variant__code"><span>{E(v["code"])}</span><span class="badge badge--line">Renk {E(v["code"].split(".")[1][1:])}</span></div><dl>{dl}</dl></div>')

    thumbs = (f'<figure data-kind="front" class="active"><figcaption>Ön</figcaption><img src="{E(front)}" alt="{E(brand)} {E(code)} ön görünüm"></figure>'
              f'<figure data-kind="side"><figcaption>Yan</figcaption><img src="{E(side)}" alt="{E(brand)} {E(code)} yan görünüm"></figure>'
              + (f'<figure data-kind="clip"><figcaption>Clip-On</figcaption><img src="{E(clipimg)}" alt="{E(brand)} {E(code)} clip-on"></figure>' if clipimg else ''))

    intro = (f'{brand} {code}, 2026 koleksiyonunun {"clip-on güneş camı takılabilen" if clip else "numaralı cam için tasarlanmış"} '
             f'{E(m["materials"].get("Çerçeve", "")).lower()} çerçeveli modelidir. Ekartman {dim_str(m)} mm; {len(m["variants"])} renk seçeneği.')

    return f'''<article class="model" data-code="{E(code)}" data-brand="{E(brand)}" data-brand-slug="{E(m['brand_slug'])}" data-cat="{E(m['category'])}">
{jsonld(m, brand)}
<div class="model__top">
  <div class="model__gallery">
    <figure class="model__main"><img id="m-front" src="{E(front)}" alt="{E(brand)} {E(code)} gözlük ön görünüm"><span class="zoom">Büyütmek için tıklayın</span></figure>
    <div class="model__thumbs">{thumbs}</div>
  </div>
  <div class="model__info">
    <img class="model__brand" src="{CDN}img/logo/{m['brand_slug']}.png" alt="{E(brand)}">
    <p class="eyebrow">2026 {'Clip-On' if clip else 'Optik'} Koleksiyonu</p>
    <h1 class="model__code">{E(code)}</h1>
    <p class="model__sub">{E(brand)} · {'Clip-On gözlük' if clip else 'Optik çerçeve'} · {E(m['materials'].get('Çerçeve', ''))}</p>
    <div class="model__badges">{''.join(badges)}</div>
    <div class="dims">
      {dims_svg()}
      <div class="dims__nums"><div><b>{m['lens'] or '–'}</b><small>Çerçeve mm</small></div><div><b>{m['bridge'] or '–'}</b><small>Köprü mm</small></div><div><b>{m['temple'] or '–'}</b><small>Sap mm</small></div></div>
      <p class="dims__str">Ekartman: <b>{dim_str(m)}</b> · <a href="/p/ekartman-rehberi.html" style="text-decoration:underline">Nasıl okunur?</a></p>
    </div>
    <table class="specs"><tbody>{mat_rows(m)}</tbody></table>
    <div class="colors"><h3>Renk seçenekleri <span>{len(m['variants'])} renk · seçmek için tıklayın</span></h3><div class="color-list">{''.join(color_btns)}</div></div>
    <div class="attrs" id="m-attrs"></div>
    <div class="cta">
      <a class="btn btn--red" href="/p/yetkili-satis-noktalari.html">Yetkili satış noktası bul</a>
      <a class="btn btn--ghost" href="https://wa.me/905074904824?text={E('Merhaba, ' + brand + ' ' + code + ' modeli hakkında bilgi almak istiyorum.')}" rel="noopener" target="_blank">WhatsApp ile sor</a>
    </div>
    <div class="share">Paylaş: <a href="#" data-share>Bağlantıyı kopyala</a> · <a href="https://wa.me/?text={E(brand + ' ' + code + ' gözlük modeli')}" rel="noopener" target="_blank">WhatsApp</a></div>
  </div>
</div>
<section class="variants">
  <div class="section__head"><p class="eyebrow">Tüm renkler</p><h2 class="title-2">{E(code)} renk seçenekleri</h2><p class="lead" style="margin:12px auto 0">{intro}</p></div>
  <div class="variant-grid">{''.join(variant_cards)}</div>
</section>
<div class="guide-mini">
  {dims_svg()}
  <div><h3>Ölçüler nasıl okunur?</h3><p><b>{m['lens']}</b> cam (çerçeve) genişliği, <b>{m['bridge']}</b> iki cam arasındaki köprü, <b>{m['temple']}</b> sap uzunluğu; hepsi milimetre. Kullandığınız gözlüğün sapındaki rakamlarla kıyaslayın.</p><a class="link-arrow" href="/p/ekartman-rehberi.html">Ölçü rehberi</a></div>
</div>
<section class="faq"><p class="eyebrow">Sık sorulanlar</p><h2 class="title-2" style="margin-bottom:10px">{E(code)} hakkında</h2>{faq(m, brand)}</section>
</article>'''

def post_labels(m):
    brand = BRAND_NAMES.get(m['brand_slug'], m['brand'])
    labels = [brand, m['category']]
    fm = m['materials'].get('Çerçeve')
    if fm: labels.append(fm.split(' / ')[0])
    if m.get('new'): labels.append('Yeni')
    if m['materials'].get('Cam', '').lower().startswith('polar'): labels.append('Polarize')
    if m.get('antifar'): labels.append('Anti-Far')
    if 'Titanyum' in m['materials'].values() and 'Titanyum' not in labels: labels.append('Titanyum')
    return labels

# ---------------------------------------------------------------- sayfalar
PAGES = {}
PAGES['Ekartman Rehberi'] = f'''
<p class="note">Her modelin sayfasında <b>51 □ 18 – 145</b> biçiminde üç sayı görürsünüz. Bu "ekartman" (ölçü) bilgisidir ve gözlüğün yüzünüze uyup uymayacağını önceden tahmin etmenizi sağlar.</p>
<figure>{dims_svg()}</figure>
<h2>Üç sayı ne anlatır?</h2>
<table><thead><tr><th>Ölçü</th><th>Nerede?</th><th>Tipik aralık</th><th>Ne etkiler?</th></tr></thead><tbody>
<tr><td><b>Çerçeve (cam) genişliği</b></td><td>Tek camın en geniş yatay ölçüsü</td><td>46–58 mm</td><td>Gözlüğün yüzde ne kadar yer kaplayacağı, "büyük/küçük" görünüm</td></tr>
<tr><td><b>Köprü</b></td><td>İki cam arasındaki mesafe</td><td>14–22 mm</td><td>Burun üzerinde oturuş; dar köprü dar burunlarda kayma yapmaz</td></tr>
<tr><td><b>Sap uzunluğu</b></td><td>Menteşeden sap ucuna</td><td>135–150 mm</td><td>Kulak arkasına kavrama; kısa sap sıkar, uzun sap kayar</td></tr>
</tbody></table>
<h2>Kendi ölçünüzü nasıl bulursunuz?</h2>
<p>Şu an rahat kullandığınız gözlüğün <b>sol sapının iç yüzüne</b> bakın. Orada model kodu, renk kodu ve ekartman yazar (örn. <b>LC1408.C1 51□19-140</b>). Bu üç sayı size referans olur:</p>
<ul>
<li>Cam genişliğinde <b>±2 mm</b>, köprüde <b>±1 mm</b>, sapta <b>±5 mm</b> fark genellikle hissedilmez.</li>
<li>Toplam genişlik için pratik hesap: <i>2 × cam genişliği + köprü</i>. Örneğin 51□19 için yaklaşık 121 mm. Yüz genişliğinize yakın olmalı.</li>
<li>Yüksek numaralarda (±4 ve üzeri) küçük cam genişliği ve göz merkezine yakın oturan model camı inceltir.</li>
</ul>
<h2>Model ve renk kodu</h2>
<p>Kataloglarda her modelin kodu (örn. <b>Q503</b>) ve renk varyantı (<b>Q503.C2</b>) ayrı yazılır. Sitede model kodunu arayın; sayfada tüm renkleri görürsünüz. Renk kodunu (C2) aradığınızda da aynı sayfa açılır ve o renk seçili gelir.</p>
<h2>Clip-on modeller</h2>
<p>Clip-on modellerde ekartman optik çerçeveye aittir; mıknatıslı güneş camı aynı ölçüde üretildiği için ek bir ölçü gerekmez.</p>
<p>Ölçüler ön eleme içindir; nihai karar için yetkili optik mağazasında deneyin. Optisyen burun pedi ve sap ayarıyla uyumu kişiselleştirir.</p>
'''
PAGES['Sık Sorulan Sorular'] = '''
<h2>Site hakkında</h2>
<h3>Bu siteden gözlük satın alabilir miyim?</h3>
<p>Hayır. Bu site Lee Cooper, Quantum, Slazenger ve Belmond 2026 koleksiyonlarının bilgi kataloğudur. Satış yalnızca yetkili optik mağazalarında yapılır.</p>
<h3>Aradığım modeli nasıl bulurum?</h3>
<p>Üst menüdeki arama kutusuna model kodunu yazın (örn. <b>LC1408</b> ya da <b>9599.C2</b>). Kod gözlük sapının iç yüzünde yazar. Markalar menüsünden koleksiyonları filtreleyerek de gezebilirsiniz.</p>
<h3>Fiyatlar neden yazmıyor?</h3>
<p>Fiyatlar satış noktasına ve seçilen cama göre değişir. Tavsiye fiyat için yetkili mağazaya danışın.</p>
<h2>Ürünler hakkında</h2>
<h3>Optik çerçeve ile clip-on arasındaki fark nedir?</h3>
<p>Optik çerçeve numaralı cam için üretilir. Clip-on modellerde buna ek olarak çerçeveye mıknatısla tutunan polarize güneş camı bulunur; böylece tek gözlükle hem numaralı hem güneş gözlüğü kullanırsınız.</p>
<h3>Polarize cam ne işe yarar?</h3>
<p>Yoldan, sudan ve cam yüzeylerden yansıyan yatay ışığı keser; parlamayı azaltır, kontrastı artırır. Tüm clip-on camlar UV400 korumalıdır.</p>
<h3>Anti-far seçeneği nedir?</h3>
<p>Bazı Slazenger clip-on modellerinde gece sürüşü için sarı tonlu, karşı far parlamasını yumuşatan cam seçeneği vardır. Model sayfasında "Anti-Far seçeneği" rozetiyle gösterilir.</p>
<h3>Çerçeve malzemeleri arasında nasıl seçim yaparım?</h3>
<ul>
<li><b>Metal:</b> ince, klasik görünüm; burun pedleri ayarlanabilir.</li>
<li><b>Asetat:</b> canlı renkler ve desenler; sıcak tutuşlu, sağlam.</li>
<li><b>Titanyum:</b> en hafif ve hipoalerjenik seçenek; metal alerjisi olanlar için.</li>
<li><b>TR90 / Ultem:</b> esnek, kırılmaz, çok hafif; çocuklar ve spor için ideal.</li>
</ul>
<h3>Ölçüler bana uyar mı?</h3>
<p>Her model sayfasındaki ekartman bilgisini mevcut gözlüğünüzle karşılaştırın. Ayrıntı için <a href="/p/ekartman-rehberi.html">ölçü rehberine</a> bakın.</p>
'''
PAGES['Yetkili Satış Noktaları'] = '''
<p>Lee Cooper, Quantum, Slazenger ve Belmond gözlükleri Türkiye genelinde yetkili optik mağazalarında satılır. Beğendiğiniz modelin kodunu not edin ve en yakın satış noktasına danışın; mağazada yoksa sizin için getirtilebilir.</p>
<h2>İstanbul</h2>
<ul class="dealers">
<li><b>[Mağaza adı]</b>[İlçe] · [Adres]<br>[Telefon]</li>
<li><b>[Mağaza adı]</b>[İlçe] · [Adres]<br>[Telefon]</li>
</ul>
<h2>Ankara</h2>
<ul class="dealers">
<li><b>[Mağaza adı]</b>[İlçe] · [Adres]<br>[Telefon]</li>
</ul>
<h2>İzmir</h2>
<ul class="dealers">
<li><b>[Mağaza adı]</b>[İlçe] · [Adres]<br>[Telefon]</li>
</ul>
<h2>Bayi olmak ister misiniz?</h2>
<p>Perakende ve distribütörlük başvuruları için <a href="https://arikantime.com/tr/be-our-partner" rel="noopener" target="_blank">arikantime.com</a> üzerinden iletişime geçebilirsiniz.</p>
'''
PAGES['Hakkımızda'] = '''
<p>Arıkan Group, saat, gözlük ve aksesuar markalarının Türkiye distribütörlüğünü yürütür. Gözlük tarafında <b>Lee Cooper</b>, <b>Quantum</b>, <b>Slazenger</b> ve <b>Belmond</b> markalarının optik ve clip-on koleksiyonlarını yetkili optik mağazalarıyla buluşturur.</p>
<h2>Bu site ne için?</h2>
<p>Bir gözlük modelini beğendiğinizde ya da sapında yazan kodu merak ettiğinizde, o modelle ilgili her şeyi tek sayfada görebilmeniz için hazırlandı: ölçüler, çerçeve ve sap malzemesi, tüm renk seçenekleri ve her rengin ön-yan görselleri. Katalog bilgileri markaların 2026 sezon kataloglarından alınmıştır.</p>
<h2>Tasarım felsefesi</h2>
<p>"Başarılı ürünler, mükemmel tasarım ve ürün geliştirmeyle başlar." Her koleksiyon; malzeme seçimi, ölçü dengesi ve renk uyumu gözetilerek geliştirilir ve yetkili satış noktalarında optisyen desteğiyle sunulur.</p>
<h2>Kurumsal</h2>
<p>Kurumsal bilgiler, kariyer ve iş ortaklığı için <a href="https://arikantime.com/tr/" rel="noopener" target="_blank">arikantime.com</a> adresini ziyaret edin.</p>
'''
PAGES['İletişim'] = '''
<p>Modeller, satış noktaları ve bayilik hakkında sorularınız için bize ulaşın.</p>
<ul class="dealers">
<li><b>WhatsApp</b><a href="https://wa.me/905074904824" rel="noopener" target="_blank">0507 490 48 24</a></li>
<li><b>E-posta</b><a href="mailto:info@example.com">info@example.com</a></li>
<li><b>Telefon</b>+90 (212) 000 00 00</li>
<li><b>Adres</b>[Şirket adresi]</li>
</ul>
'''

# ---------------------------------------------------------------- import XML
def atom_entry(kind, idx, title, content, labels=(), published=None):
    published = published or datetime.datetime(2026, 10, 1, 9, 0, 0) + datetime.timedelta(minutes=idx)
    ts = published.strftime('%Y-%m-%dT%H:%M:%S.000+03:00')
    cats = ''.join(f"<category scheme='http://www.blogger.com/atom/ns#' term='{escape(l, {chr(39): '&#39;'})}'/>" for l in labels)
    return f'''<entry>
<id>tag:blogger.com,1999:blog-0.{kind}-{idx}</id>
<published>{ts}</published><updated>{ts}</updated>
<category scheme='http://schemas.google.com/g/2005#kind' term='http://schemas.google.com/blogger/2008/kind#{kind}'/>
{cats}
<title type='text'>{escape(title)}</title>
<content type='html'>{escape(content)}</content>
<author><name>Arıkan Optik</name></author>
<app:control xmlns:app='http://purl.org/atom/app#'><app:draft>no</app:draft></app:control>
</entry>
'''

def main():
    d = json.load(open('data/models.json', encoding='utf-8'))
    models = d['models']
    order = {'lee-cooper': 0, 'quantum': 1, 'slazenger': 2, 'belmond': 3}
    models.sort(key=lambda m: (order.get(m['brand_slug'], 9), m['category'] != 'Optik', m['page']))
    os.makedirs('out/posts', exist_ok=True)
    entries = []
    # yazılar: en son yayımlanan en üstte görünsün diye ters sırada tarih ver
    n = len(models)
    for i, m in enumerate(models):
        brand = BRAND_NAMES.get(m['brand_slug'], m['brand'])
        title = f'{brand} {m["code"]}'
        body = post_html(m)
        open(f'out/posts/{m["slug"]}.html', 'w', encoding='utf-8').write(body)
        entries.append(atom_entry('post', i + 1, title, body, post_labels(m), datetime.datetime(2026, 10, 1, 9, 0) + datetime.timedelta(minutes=n - i)))
    for j, (title, body) in enumerate(PAGES.items()):
        entries.append(atom_entry('page', 1000 + j, title, body.strip(), ()))
    feed = f'''<?xml version='1.0' encoding='UTF-8'?>
<feed xmlns='http://www.w3.org/2005/Atom' xmlns:openSearch='http://a9.com/-/spec/opensearchrss/1.0/' xmlns:blogger='http://schemas.google.com/blogger/2008' xmlns:georss='http://www.georss.org/georss' xmlns:gd='http://schemas.google.com/g/2005' xmlns:thr='http://purl.org/syndication/thread/1.0'>
<id>tag:blogger.com,1999:blog-0</id>
<updated>2026-10-27T12:00:00.000+03:00</updated>
<title type='text'>Arıkan Optik · 2026 Gözlük Kataloğu</title>
<generator version='7.00' uri='http://www.blogger.com'>Blogger</generator>
{''.join(entries)}</feed>
'''
    open('out/arikan-optik-icerik-import.xml', 'w', encoding='utf-8').write(feed)
    json.dump({k: v for k, v in PAGES.items()}, open('out/pages.json', 'w', encoding='utf-8'), ensure_ascii=False)
    print(f'{n} yazı + {len(PAGES)} sayfa -> out/arikan-optik-icerik-import.xml ({os.path.getsize("out/arikan-optik-icerik-import.xml")//1024} KB)')

if __name__ == '__main__':
    main()

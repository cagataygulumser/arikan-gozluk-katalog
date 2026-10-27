#!/usr/bin/env python3
"""Blog yazıları (demo) -> out/arikan-optik-blog-import.xml"""
import datetime, os
from xml.sax.saxutils import escape
from gen_content import atom_entry, CDN

HERO = CDN + 'img/hero/'

ARTICLES = [
    {
        'title': 'Güneş Gözlüğü Seçimi Nasıl Yapılır?',
        'cover': HERO + 'quantum-p063-hero.jpg',
        'labels': ['Blog', 'Rehber', 'Güneş Gözlüğü'],
        'date': datetime.datetime(2026, 10, 20, 10, 0),
        'summary': 'UV koruması, polarize cam, cam rengi ve yüz şekli: doğru güneş gözlüğünü seçerken bakmanız gereken beş şey.',
        'html': '''
<p class="article__lead">Güneş gözlüğü bir aksesuar olduğu kadar bir koruma aracıdır. Doğru seçim; göz sağlığınızı, sürüş güvenliğinizi ve gün boyu konforunuzu doğrudan etkiler. İşte optisyen gözüyle beş adımda güneş gözlüğü seçimi.</p>
<h2>1. UV400 koruması şart</h2>
<p>Camın koyuluğu koruma anlamına gelmez. Koyu ama UV filtresi olmayan bir cam, göz bebeğini büyüterek daha fazla ultraviyole ışının göze girmesine yol açar. Gözlüğün <b>UV400</b> (400 nanometreye kadar tam koruma) etiketini ve CE işaretini mutlaka arayın. Yetkili satış noktalarında satılan tüm markalı güneş gözlükleri bu standardı karşılar.</p>
<h2>2. Polarize cam ne zaman gerekli?</h2>
<p>Polarize cam; yoldan, sudan, kar ve cam yüzeylerden yansıyan yatay ışığı keser. Araç kullananlar, deniz ve göl kenarında zaman geçirenler ve balıkçılar için büyük fark yaratır. Dikkat: bazı araç göstergeleri ve telefon ekranları polarize camla belirli açılarda kararmış görünebilir; pilotlar polarize cam kullanmaz.</p>
<h2>3. Cam rengi ne işe yarar?</h2>
<table>
<thead><tr><th>Renk</th><th>Etkisi</th><th>Kime uygun?</th></tr></thead>
<tbody>
<tr><td>Füme / gri</td><td>Renkleri bozmadan parlaklığı azaltır</td><td>Günlük kullanım, sürüş</td></tr>
<tr><td>Kahverengi</td><td>Kontrastı artırır, derinlik algısını güçlendirir</td><td>Değişken ışık, doğa sporları</td></tr>
<tr><td>Yeşil (G15)</td><td>Dengeli kontrast, göz yormaz</td><td>Uzun süreli kullanım</td></tr>
<tr><td>Sarı / turuncu</td><td>Düşük ışıkta kontrast verir</td><td>Sisli hava, gece sürüşü (anti-far)</td></tr>
<tr><td>Degrade</td><td>Üstü koyu, altı açık</td><td>Araç içinde gösterge paneli okuma</td></tr>
</tbody>
</table>
<h2>4. Yüz şekline göre çerçeve</h2>
<ul>
<li><b>Yuvarlak yüz:</b> köşeli, dikdörtgen çerçeveler yüzü uzatır.</li>
<li><b>Köşeli yüz:</b> yuvarlak ve oval formlar hatları yumuşatır.</li>
<li><b>Oval yüz:</b> hemen her form uyar; çerçeve genişliği yüz genişliğini aşmasın.</li>
<li><b>Kalp şeklinde yüz:</b> alt kısmı geniş, pilot (aviator) ve cat-eye formlar dengeler.</li>
</ul>
<h2>5. Ölçü ve oturuş</h2>
<p>Çerçevenin sapındaki üç sayı (örn. 55 □ 16 – 145) cam genişliği, köprü ve sap uzunluğunu verir. Gözlük kaşa değmemeli, yanaklara oturmamalı, başınızı öne eğdiğinizde kaymamalı. Burun pedi olan metal modellerde optisyen pedleri burnunuza göre ayarlayabilir.</p>
<div class="article__tip"><b>İpucu:</b> Numaralı cam kullanıyorsanız clip-on modeller tek çerçeveyle hem optik hem güneş gözlüğü imkânı sunar. <a href="/search/label/Clip-On">Clip-on koleksiyonuna göz atın</a>.</div>
'''
    },
    {
        'title': 'Yüz Şeklinize Göre Gözlük Çerçevesi Nasıl Seçilir?',
        'cover': HERO + 'belmond-p001-hero.jpg',
        'labels': ['Blog', 'Rehber', 'Çerçeve'],
        'date': datetime.datetime(2026, 10, 17, 10, 0),
        'summary': 'Yuvarlak, köşeli, oval ya da kalp şeklinde yüz: hangi çerçeve formu dengeler, hangisi abartır?',
        'html': '''
<p class="article__lead">Gözlük yüzün ortasında durur; formu ve rengi yüz hatlarınızla ya uyum kurar ya da çatışır. Temel kural basit: çerçeve, yüzün hatlarının tersini tamamlamalı.</p>
<h2>Yüz şeklinizi nasıl anlarsınız?</h2>
<p>Aynanın karşısına geçin, saçınızı geriye alın ve alın, elmacık kemikleri ile çene hattının genişliğini karşılaştırın. Alın ve çene hemen hemen eşit ve yüz uzunsa <b>oval</b>; genişlik uzunluğa yakınsa <b>yuvarlak</b>; çene hattı belirgin ve köşeliyse <b>kare</b>; alın geniş çene darsa <b>kalp</b> şeklindesiniz.</p>
<h2>Yuvarlak yüz</h2>
<p>Köşeli hatlar yüze belirginlik katar. Dikdörtgen, wayfarer ve geometrik formlar iyi çalışır; yuvarlak ve küçük çerçevelerden kaçının. Koyu renkli üst çizgi (browline) yüzü yukarı taşır.</p>
<h2>Kare yüz</h2>
<p>Sert çene hattını yumuşatmak için yuvarlak, oval ve pilot formlar seçin. Metal ince çerçeveler yüzü hafifletir; kalın köşeli asetatlar hatları daha da sertleştirir.</p>
<h2>Oval yüz</h2>
<p>En esnek yüz tipi. Dengeyi bozmamak için çerçeve genişliği yüzün en geniş noktasını geçmesin; çok küçük çerçeveler yüzü büyük gösterir.</p>
<h2>Kalp şeklinde yüz</h2>
<p>Üst kısım geniş, çene dar olduğundan alt kısmı dolgun formlar (cat-eye'ın tersi, yuvarlak altlı modeller) ve açık renkler dengeyi sağlar. Çok geniş üst çizgiler alnı daha geniş gösterir.</p>
<h2>Renk ve malzeme</h2>
<ul>
<li>Sıcak ten tonlarına kahverengi, demi (kaplumbağa), altın; soğuk tonlara siyah, gri, gümüş, lacivert daha iyi uyar.</li>
<li>Asetat çerçeve karakter katar; metal ve titanyum daha hafif ve sade durur.</li>
<li>Kristal (şeffaf) renkler yüzü yormadan modern bir görünüm verir.</li>
</ul>
<h2>Ölçüyü unutmayın</h2>
<p>Form ne kadar doğru olursa olsun yanlış ölçü rahatsızlık verir. Mevcut gözlüğünüzün sapındaki ölçüleri referans alın ve <a href="/p/ekartman-rehberi.html">ekartman rehberine</a> göz atın. Sitedeki her modelin sayfasında çerçeve, köprü ve sap ölçüleri yazar.</p>
'''
    },
    {
        'title': 'Clip-On Gözlük Nedir, Kime Uygundur?',
        'cover': HERO + 'lee-cooper-p075.jpg',
        'labels': ['Blog', 'Clip-On'],
        'date': datetime.datetime(2026, 10, 14, 10, 0),
        'summary': 'Tek çerçeve, iki kullanım: mıknatıslı polarize camlı clip-on gözlüklerin avantajları ve dikkat edilecek noktalar.',
        'html': '''
<p class="article__lead">Numaralı gözlük kullanan herkesin ortak derdi: dışarı çıkınca güneş gözlüğüne geçmek. Clip-on modeller bu sorunu tek çerçeveyle çözer; optik çerçevenin önüne mıknatısla tutunan polarize güneş camı saniyeler içinde takılır ve çıkar.</p>
<h2>Nasıl çalışır?</h2>
<p>Çerçevenin köprüsünde ve uçlarında gizli mıknatıslar vardır. Clip, aynı kalıpla üretildiği için çerçeveyle birebir oturur; titreşimle oynamaz, camı çizmez. Çıkarıldığında kılıfında ya da cepte taşınabilecek kadar incedir.</p>
<h2>Avantajları</h2>
<ul>
<li>Tek numaralı cam, iki gözlük: ayrıca numaralı güneş gözlüğü yaptırma maliyeti yok.</li>
<li>Polarize cam yansımaları keser; araç kullananlar için konfor.</li>
<li>Fotokromik (renk değiştiren) camların aksine araç içinde de karartır, geçiş beklemez.</li>
<li>Progresif (multifokal) cam kullananlar için ideal: aynı cam, aynı alışkanlık.</li>
</ul>
<h2>Dikkat edilecekler</h2>
<ul>
<li>Clip yalnızca kendi çerçevesine uyar; başka modelle değişmez.</li>
<li>Yüksek numaralı, kalın camlarda clip ile cam arasında boşluk azalır; optisyeninize danışın.</li>
<li>Polarize cam bazı LCD ekranları belli açılarda karartabilir.</li>
</ul>
<h2>Anti-far seçeneği</h2>
<p>Bazı Slazenger clip-on modellerinde gece sürüşü için sarı tonlu anti-far cam da bulunur; karşıdan gelen far parlamasını yumuşatır. Model sayfasında "Anti-Far seçeneği" rozetiyle gösterilir.</p>
<p><a class="link-arrow" href="/search/label/Clip-On">Tüm clip-on modelleri</a></p>
'''
    },
    {
        'title': 'Gözlük Çerçevesi Malzemeleri: Metal, Asetat, Titanyum, TR90',
        'cover': HERO + 'quantum-p002.jpg',
        'labels': ['Blog', 'Rehber', 'Çerçeve'],
        'date': datetime.datetime(2026, 10, 10, 10, 0),
        'summary': 'Hafiflik, dayanıklılık, alerji ve görünüm: çerçeve malzemeleri arasındaki farklar ve hangisinin size uygun olduğu.',
        'html': '''
<p class="article__lead">Çerçevenin malzemesi ağırlığını, dayanıklılığını, ayarlanabilirliğini ve yüzünüzdeki duruşunu belirler. Kataloglarımızdaki dört ana malzemeyi karşılaştıralım.</p>
<h2>Metal</h2>
<p>İnce, klasik ve hafif. Ayarlanabilir burun pedleri sayesinde farklı burun yapılarına uyarlanır. Kaplama kalitesi önemlidir; yetkili ürünlerde kaplama uzun ömürlüdür. Nikel hassasiyeti olanlar titanyum ya da asetatı tercih etmeli.</p>
<h2>Asetat</h2>
<p>Bitkisel bazlı selüloz asetat; renk derinliği, desen (demi, kristal, kırçıllı) ve karakter sunar. Metale göre biraz daha ağır ama çok sağlam. Burun pedi yoktur, köprü ölçüsü bu yüzden daha kritiktir.</p>
<h2>Titanyum</h2>
<p>En hafif ve en dayanıklı metal; korozyona dayanıklı, hipoalerjeniktir. Uzun süre takanlar ve metal alerjisi olanlar için ideal. Quantum koleksiyonunda titanyum optik ve clip-on modeller bulunur.</p>
<h2>TR90 ve Ultem</h2>
<p>Esnek, kırılmaya dayanıklı, tüy gibi hafif termoplastikler. Spor, çocuk ve yoğun kullanım için uygundur; bükülür ama kırılmaz. Slazenger clip-on serisinde Ultem, Lee Cooper'da TR90 modeller vardır.</p>
<h2>Hangisi size uygun?</h2>
<table>
<thead><tr><th>İhtiyaç</th><th>Öneri</th></tr></thead>
<tbody>
<tr><td>Çok hafif olsun</td><td>Titanyum, TR90</td></tr>
<tr><td>Renk ve karakter</td><td>Asetat</td></tr>
<tr><td>Metal alerjisi</td><td>Titanyum, asetat, TR90</td></tr>
<tr><td>Spor / çocuk</td><td>TR90, Ultem</td></tr>
<tr><td>Klasik ince görünüm</td><td>Metal, titanyum</td></tr>
</tbody>
</table>
<p>Koleksiyon sayfasında <b>Çerçeve malzemesi</b> filtresiyle modelleri malzemeye göre süzebilirsiniz.</p>
'''
    },
]


def article_html(a):
    return f'''<div class="article__body-in">
<figure class="article__cover"><img src="{a['cover']}" alt="{escape(a['title'])}"></figure>
{a['html'].strip()}
</div>'''


def main():
    os.makedirs('out', exist_ok=True)
    entries = []
    for i, a in enumerate(ARTICLES):
        entries.append(atom_entry('post', 5000 + i, a['title'], article_html(a), a['labels'], a['date']))
    feed = f'''<?xml version='1.0' encoding='UTF-8'?>
<feed xmlns='http://www.w3.org/2005/Atom' xmlns:openSearch='http://a9.com/-/spec/opensearchrss/1.0/' xmlns:blogger='http://schemas.google.com/blogger/2008' xmlns:georss='http://www.georss.org/georss' xmlns:gd='http://schemas.google.com/g/2005' xmlns:thr='http://purl.org/syndication/thread/1.0'>
<id>tag:blogger.com,1999:blog-0</id>
<updated>2026-10-27T12:00:00.000+03:00</updated>
<title type='text'>Arıkan Optik · Blog</title>
<generator version='7.00' uri='http://www.blogger.com'>Blogger</generator>
{''.join(entries)}</feed>
'''
    open('out/arikan-optik-blog-import.xml', 'w', encoding='utf-8').write(feed)
    print(f'{len(ARTICLES)} blog yazısı -> out/arikan-optik-blog-import.xml')


if __name__ == '__main__':
    main()

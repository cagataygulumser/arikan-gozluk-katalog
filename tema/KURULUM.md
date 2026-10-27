# Arıkan Optik · 2026 Gözlük Kataloğu — Blogger Kurulum Rehberi

## Ne teslim edildi?

| Dosya | Ne işe yarar |
|---|---|
| `arikan-optik-tema.xml` | Blogger teması (arikantime.com tasarım dili). Tema > Düzenle > HTML'e yapıştırılır. |
| `arikan-optik-icerik-import.xml` | 161 model yazısı + 5 sabit sayfa. Ayarlar > İçeriği içe aktar ile tek seferde yüklenir. |
| `models.json` | Tüm model verisi (GitHub'da; tema buradan beslenir). |
| GitHub deposu `cagataygulumser/arikan-gozluk-katalog` | 1.530 ürün görseli, 16 hero fotoğrafı, 4 logo, `models.json`. jsDelivr CDN ile servis edilir. |

Veri kapsamı: **161 model, 526 renk varyantı** — Lee Cooper 53 (32 optik + 21 clip-on), Slazenger 66 (41 + 25), Quantum 30 (26 + 4), Belmond 12 (9 + 3).

## Durum (27 Ekim 2026)

Site **deneme-site-v3.blogspot.com** adresinde kuruldu ve çalışıyor: tema yüklü, 161 yazı + 5 sayfa içe aktarıldı, blog başlığı "Arıkan Optik" yapıldı, Arıkan logosu (cdn.arikantime.com) header ve footer'da. Aşağıdaki adımlar başka bir bloga taşımak istersen geçerlidir.

**Blogger'a özgü iki tuzak (çözüldü, temada hazır):** (1) Blogger'ın zorunlu "Kötüye Kullanım Bildir" (ReportAbuse1) widget'ı temada yoksa ve (2) bölümlerde `showaddelement='no'` (v3'te `false` olmalı) / `preferred='yes'` bölüm eksikse Blogger hiçbir widget'ı basmaz; sayfalar boş çıkar. Tema bunları içeriyor; silmeyin.

## Kurulum (sırayla)

1. **Blog oluştur** — blogger.com > Yeni blog. Dil: Türkçe. (Adres örn. `arikanoptik.blogspot.com`; sonradan özel alan adı bağlanabilir.)
2. **Temayı yükle** — Tema > sağ üstteki ok > *Geri yükle* > `arikan-optik-tema.xml` seç. (Ya da *HTML'i düzenle* > tümünü sil > dosya içeriğini yapıştır > Kaydet.)
3. **İçeriği içe aktar** — Ayarlar > *İçeriği yönet* > *İçeriği içe aktar* > `arikan-optik-icerik-import.xml`. "İçe aktarılan yazıları otomatik yayınla" işaretli olsun. İşlem birkaç dakika sürebilir; yazılar 1 Ekim 2026 tarihli görünür (sıralama için kasıtlı).
4. **Sayfa adresleri** — Blogger sayfalara kendi adresini verir (örn. `/p/ekartman-rehberi_3.html`); tema bu adresleri sayfa başlığından otomatik bulur (menü, footer ve model sayfalarındaki bağlantılar). Sayfa başlıklarını değiştirmeyin: Ekartman Rehberi, Sık Sorulan Sorular, Yetkili Satış Noktaları, Hakkımızda, İletişim.
5. **Ayarlar**
   - Ayarlar > Temel > Başlık: `Arıkan Optik` (header ve footer'da bu başlık görünür).
   - Ayarlar > Yazılar > Ana sayfada gösterilecek yazı sayısı: 20 (sadece arama botları için; ziyaretçi JS ile tüm listeyi görür).
   - Ayarlar > Gizlilik > Arama motorları görebilsin: Açık. Ayarlar > Tarayıcılar ve dizine ekleme > Özel robots etiketi: gerek yok.
   - Ayarlar > Yorumlar > Yorum konumu: *Gizli* (ürün sayfalarında yorum yok).
6. **Logo** — Düzen > Başlık (Header1) > Resim yükle. Yüklenirse metin logo yerine görsel kullanılır (yükseklik 40 px'e ölçeklenir; şeffaf PNG önerilir).
7. **WhatsApp numarası** — Tema > HTML'i düzenle > üstteki `AO_CONFIG` bloğunda `whatsapp: '905000000000'` değerini gerçek numarayla değiştir. Sabit buton ve model sayfalarındaki "WhatsApp ile sor" bu alandan beslenir. *İletişim* ve *Yetkili Satış Noktaları* sayfalarındaki köşeli parantezli alanları da doldur.
8. **Sosyal bağlantılar** — Footer'daki Instagram/YouTube/Facebook adresleri HTML'de `site-footer` içinde; kendi hesaplarınla değiştir.

## Site nasıl çalışır?

- **Ana sayfa**: hero slider, logo şeridi, sayaçlar, marka kartları, Optik/Clip-On, yeni modeller, ölçü rehberi bandı, öne çıkanlar.
- **Arama**: üst menüdeki kutuya `LC1408` ya da `9599.C2` yazınca doğrudan model sayfasına gider (renk kodu yazılırsa o renk seçili açılır). Doğal ifadeler de anlaşılır: "mavi clip-on", "yuvarlak titanyum", "slazenger köşeli siyah", "lee cooper cat eye", "52 18 140", "polarize yeşil", "çerçevesiz altın"; yazım hataları tolere edilir (slazinger, quantom, titanium). Tanınan ölçütler arama kutusunun altında ve sonuç sayfasında rozet olarak gösterilir; tüm ölçütlere uyan model yoksa en yakınlar listelenir. Sözlük `tema/search.js` içindeki `voc(...)` satırlarında; yeni eş anlamlı eklemek için oraya kelime eklemek yeterli.
- **Koleksiyon sayfaları**: `/search/label/Lee Cooper`, `/search/label/Clip-On`, `/search/label/Optik`, `/search/label/Yeni`, `/search` (tümü). Soldaki filtreler: marka, tür, çerçeve genişliği, malzeme, renk ailesi, özellik (Yeni / Polarize / Anti-Far / Titanyum). Sıralama: katalog sırası, yeni, kod, genişlik, renk sayısı.
- **Model sayfası**: büyük ön görsel (tıklayınca büyür), ön/yan/clip-on küçük resimler, ekartman şeması, malzeme tablosu, renk seçenekleri (tıklayınca görseller ve renk detayları değişir), tüm renklerin kartları, ölçü bilgisi, SSS, aynı markadan benzer ölçülü 4 model. Her sayfada Google için Product şeması (JSON-LD) gömülü.
- **Etiketler**: her yazıda marka, tür (Optik / Clip-On), çerçeve malzemesi ve varsa Yeni / Polarize / Anti-Far / Titanyum.

## Ek bileşenler

- **Yetkili satış noktaları haritası:** `dealers.json` (GitHub) → il adı anahtar, mağaza listesi. Sayfa haritadan ve il aramasından beslenir.
- **Blog:** Blogger'da yazıya **Blog** etiketi ver; tema makale olarak basar, listeye (/search/label/Blog) ve ana sayfaya düşer. Kapak = yazının ilk görseli.
- **Clip-on karşılaştırma kaydırıcısı:** 53 clip-on modelin sayfasında otomatik ("Tek çerçeve, iki kullanım" bölümü). Çiftler `gen_cmp.py` ile üretilir: sol = ilk rengin clip'siz ön görseli, sağ = katalogdaki clip takılı ana görsel; ikisi gözlük sınır kutusuna göre hizalanır (`img/cmp/KOD-optik.jpg`, `KOD-clipon.jpg`). Herhangi bir sayfaya elle de eklenebilir: `<div class="cmp" data-left="OPTİK_GÖRSEL" data-right="CLIPON_GÖRSEL"></div>`. Demo: /p/clip-on-demo.html.
- **QR etiketler (bayiler için):** /p/qr-etiketler.html — marka/tür seç, etiketleri işaretle, Yazdır (A4, 50×30 veya 70×42 mm). QR `site/search?q=KOD` adresine gider; alan adı değişince etiketleri yeniden yazdırmak yeterli.
- **Favicon:** `img/logo/favicon-*.png` (tema head'inde).
- **Gözlük Asistanı:** sol alttaki kart (kapatılınca dikey sekmeye dönüşür), ana sayfadaki "Asistanı başlat" bandı ve footer bağlantısı aynı pencereyi açar. Sorular: tür → yüz ölçüsü (ekartman) → çerçeve şekli → malzeme → renk → (clip-on: polarize / optik: çerçeve yapısı). Puanlama tamamen tarayıcıda, `models.json` üzerinden çalışır; dış servis yok. Sonuç ekranında %uyum, eşleşen özellikler, Karşılaştır (yan yana tablo) ve Paylaş (cevapları `#asistan=...` bağlantısına gömer; bağlantı açılınca aynı sonuçlar gelir). Herhangi bir sayfadan `<a href="#asistan">` ile açılabilir.
- **Çerçeve şekli / yapısı verisi:** kataloglarda yok; 161 modelin ön fotoğrafından etiketlendi (`tema/shapes.json`: shape = round/square/oval/cateye/geo, rim = full/half/rimless). Bir modelin şeklini düzeltmek için bu dosyayı değiştirip `merge.py` çalıştırın ve `models.json`'u güncelleyin.

- **Ölçüm (GA4):** `AO_CONFIG.ga` ölçüm kimliği (şu an G-9C4CG896VN, "Arıkan Optik Katalog" akışı, mülk 304777974). Gönderilen olaylar: `arama` (terim, bulundu, model), `filtre` (grup, deger), `model_goruntule` / `qr_okutma` / `renk_sec` (marka, model, tur, sekil, malzeme, renk), `whatsapp_tikla` (konum, model), `clipon_kaydir`, `bayi_il` (il), `qr_yazdir`, `asistan_ac` / `asistan_adim` (adim, cevap) / `asistan_sonuc` (tur, yuz, sekil, malzeme, renk, ozellik, ilk_model, uyum) / `asistan_model_tikla` / `asistan_karsilastir` / `asistan_paylas`. Parametrelerin raporlarda görünmesi için GA4 > Yönetici > Özel tanımlar'da olay kapsamlı özel boyut olarak kayıtlı olmaları gerekir.

- **Bayi talep formu:** /p/bayi-talep-formu.html — model arama ile ya da model sayfasındaki "Talep listesine ekle" düğmesiyle liste oluşturulur (tarayıcıda saklanır), renk/adet seçilir, bayi bilgileri girilir; "WhatsApp ile gönder" hazır mesajı açar, "Talebi gönder" kaydı Google Form'a yazar (form: docs.google.com/forms/d/1xMd7Q93jTioL_3UZj5qojQtx50s26WbtBNnP23QDzws — Yanıtlar sekmesi; istenirse Sheets'e bağlanır). Form adresi ve alan kimlikleri `AO_CONFIG.order` içinde; Arıkan kendi formunu açarsa aynı sırayla 7 soru (Mağaza adı, Yetkili kişi, Telefon, İl, Sipariş listesi, Not, Kaynak site) oluşturup `entry.` kimliklerini buraya yazmak yeterli.

## Veri ve görseller nasıl güncellenir?

- Tema, `https://cdn.jsdelivr.net/gh/cagataygulumser/arikan-gozluk-katalog@main/models.json` dosyasını okur; görseller aynı depodaki `img/` klasöründen gelir. Depoya push edilen değişiklik CDN'e en geç 24 saatte yansır (anında yansıması için `@main` yerine bir sürüm etiketi, örn. `@v2`, kullanılabilir).
- Yeni bir model eklemek için: görselleri `img/<marka>/KOD-on.jpg`, `KOD-yan.jpg`, `KOD-C1-on.jpg`… adlarıyla depoya koy; `models.json`'a kaydı ekle; Blogger'da aynı yapıda bir yazı aç (yazı başlığı mutlaka `Marka KOD` biçiminde olmalı; arama ve kartlar yazıyı bu başlıktan bulur).
- 2027 kataloğu geldiğinde: aynı PDF'ler `parse_catalog.py` ile işlenir, `merge.py` + `gen_content.py` ile yeni import XML'i üretilir. Betikler depodaki `tema/` klasöründe.

## Bilinmesi gerekenler

- İlk içe aktarma iki kez tetiklendiği için kopyalar çöp kutusuna taşındı; bu yüzden yazı adreslerinde `_4`, `_5` gibi ekler var (örn. `/2026/10/slazenger-9599_4.html`). İşleve etkisi yok. Temiz adres istersen: Yayınlar > Çöp kutusu'nu boşalt, tüm yazı ve sayfaları sil, `arikan-optik-icerik-import.xml` dosyasını bir kez daha içe aktar.
- Logo şu an doğrudan Arıkan'ın CDN'inden (cdn.arikantime.com/BranchImages/logo.png) geliyor. Kalıcı olsun istersen Düzen > Başlık'tan aynı logoyu yükle; yüklenen görsel otomatik olarak CDN bağlantısının yerine geçer.

- Görsel çözünürlüğü kataloğa bağlı: kapak (ilk renk) görselleri ~1100 px, renk varyantı görselleri ~440 px genişliğinde. Varyant görselleri kartlarda ve küçük resimlerde kullanılır; büyütmede yumuşak görünebilir.
- Lee Cooper kataloğu sıkıştırılmış (metinsiz) olduğu için veriler OCR ile okundu ve örneklemle doğrulandı; bir hata görürsen ilgili yazıyı Blogger'da düzelt ve `models.json`'daki kaydı güncelle.
- Slazenger'da 7 modelin clip-on çerçeve rengi katalogda "-" olarak geçiyor (çerçevesiz clip); sitede bu alan boş bırakıldı.
- Fiyat alanı bilinçli olarak yok; "Yetkili satış noktası bul" ve WhatsApp yönlendirmesi var.

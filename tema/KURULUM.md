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

- **Yetkili satış noktaları:** `dealers.json` (GitHub) → il adı anahtar, mağaza listesi (lat/lng verilirse kartta "Haritada göster" + Google Haritalar gömülü harita + "Yol tarifi"; `place_id` yol tarifini doğrudan işletmeye bağlar). Sayfada il haritası, il arama, ilçe filtresi, "Yakınımdakiler" (tarayıcı konumu, kuş uçuşu mesafe) var. Model sayfasındaki "Yetkili satış noktası bul" düğmesi `?model=KOD` ile gelir; sayfa üstünde model kartı görünür. `demo: true` iken "örnek liste" notu basılır — Tekirdağ kayıtları Google Haritalar'daki herkese açık işletmelerdir, gerçek bayi listesi gelince değiştirilir.
- **Blog:** Blogger'da yazıya **Blog** etiketi ver; tema makale olarak basar, listeye (/search/label/Blog) ve ana sayfaya düşer. Kapak = yazının ilk görseli.
- **Clip-on karşılaştırma kaydırıcısı:** 53 clip-on modelin sayfasında otomatik ("Tek çerçeve, iki kullanım" bölümü). Çiftler `gen_cmp.py` ile üretilir: sol = ilk rengin clip'siz ön görseli, sağ = katalogdaki clip takılı ana görsel; ikisi gözlük sınır kutusuna göre hizalanır (`img/cmp/KOD-optik.jpg`, `KOD-clipon.jpg`). Herhangi bir sayfaya elle de eklenebilir: `<div class="cmp" data-left="OPTİK_GÖRSEL" data-right="CLIPON_GÖRSEL"></div>`. Demo: /p/clip-on-demo.html.
- **QR etiketler (bayiler için):** /p/qr-etiketler.html — marka/tür seç, etiketleri işaretle, Yazdır (A4, 50×30 veya 70×42 mm). QR `site/search?q=KOD` adresine gider; alan adı değişince etiketleri yeniden yazdırmak yeterli.
- **Favicon:** `img/logo/favicon-*.png` (tema head'inde).
- **Gözlük Asistanı:** sol alttaki kart (kapatılınca dikey sekmeye dönüşür), ana sayfadaki "Asistanı başlat" bandı ve footer bağlantısı aynı pencereyi açar. Sorular: tür → yüz ölçüsü (ekartman) → çerçeve şekli → malzeme → renk → (clip-on: polarize / optik: çerçeve yapısı). Puanlama tamamen tarayıcıda, `models.json` üzerinden çalışır; dış servis yok. Sonuç ekranında %uyum, eşleşen özellikler, Karşılaştır (yan yana tablo) ve Paylaş (cevapları `#asistan=...` bağlantısına gömer; bağlantı açılınca aynı sonuçlar gelir). Herhangi bir sayfadan `<a href="#asistan">` ile açılabilir.
- **Çerçeve şekli / yapısı verisi:** kataloglarda yok; 161 modelin ön fotoğrafından etiketlendi (`tema/shapes.json`: shape = round/square/oval/cateye/geo, rim = full/half/rimless). Bir modelin şeklini düzeltmek için bu dosyayı değiştirip `merge.py` çalıştırın ve `models.json`'u güncelleyin.

- **Ölçüm (GA4):** `AO_CONFIG.ga` ölçüm kimliği (şu an G-9C4CG896VN, "Arıkan Optik Katalog" akışı, mülk 304777974). Gönderilen olaylar: `arama` (terim, bulundu, model), `filtre` (grup, deger), `model_goruntule` / `qr_okutma` / `renk_sec` (marka, model, tur, sekil, malzeme, renk), `whatsapp_tikla` (konum, model), `clipon_kaydir`, `bayi_il` (il), `qr_yazdir`, `asistan_ac` / `asistan_adim` (adim, cevap) / `asistan_sonuc` (tur, yuz, sekil, malzeme, renk, ozellik, ilk_model, uyum) / `asistan_model_tikla` / `asistan_karsilastir` / `asistan_paylas`. Parametrelerin raporlarda görünmesi için GA4 > Yönetici > Özel tanımlar'da olay kapsamlı özel boyut olarak kayıtlı olmaları gerekir.

- **Bayi talep formu:** /p/bayi-talep-formu.html — model arama ile ya da model sayfasındaki "Talep listesine ekle" düğmesiyle liste oluşturulur (tarayıcıda saklanır), renk/adet seçilir, bayi bilgileri girilir; "WhatsApp ile gönder" hazır mesajı açar, "Talebi gönder" kaydı Google Form'a yazar (form: docs.google.com/forms/d/1xMd7Q93jTioL_3UZj5qojQtx50s26WbtBNnP23QDzws — Yanıtlar sekmesi; bağlı e-tablo: docs.google.com/spreadsheets/d/1I7Zafdo83sAOxubSiSCViR4D_-rshFm889x1jozgq6I). Form adresi ve alan kimlikleri `AO_CONFIG.order` içinde; Arıkan kendi formunu açarsa aynı sırayla 7 soru (Mağaza adı, Yetkili kişi, Telefon, İl, Sipariş listesi, Not, Kaynak site) oluşturup `entry.` kimliklerini buraya yazmak yeterli.

- **İngilizce sürüm:** header ve footer'daki TR | EN anahtarı (`?lang=en`; seçim tarayıcıda hatırlanır, `<html lang>` ve hreflang etiketleri ayarlanır). Çeviri tamamen tarayıcıda: `i18n/en.json` (GitHub) sözlüğü sayfadaki metinleri, nitelikleri (placeholder/alt/title) ve sayfa başlığını çevirir; sabit sayfaların (Ekartman Rehberi, SSS, Hakkımızda, İletişim) ve 4 blog yazısının İngilizce gövdeleri aynı dosyada. Renk/malzeme adları kelime sözlüğüyle çevrilir (Siyah→Black, Asetat→Acetate…). Sözlük kaynakları `tema/i18n_en.json` (arayüz) ve `tema/i18n_content_en.json` (gövdeler); `gen_i18n.py` ile `i18n/en.json` üretilir. Yeni bir metin eklenince karşılığı `i18n_en.json`'a yazılır; karşılığı olmayan metin Türkçe kalır. Not: Slazenger kataloğunda PDF'den okunan bazı renk adlarında 'i' harfi düşmüştü (Kr stal → Kristal); `models.json` düzeltildi, Blogger'daki yazı gövdeleri ise tarayıcıda (`TEXT_FIX`) düzeltiliyor — fırsat bulunca Slazenger yazıları yeniden içe aktarılabilir.

- **Instagram bandı (ana sayfa):** `instagram.json` (GitHub) → son 6 gönderi: `url`, `image` (`img/instagram/` altındaki kare görsel), `caption`, `video`. Şimdilik elle güncellenir (gönderi görseli `instagram.com/p/KOD/media/?size=l` adresinden alınabilir); Arıkan Meta hesabını bağlarsa Instagram Graph API ile otomatikleştirilebilir.
- **Logo:** `img/logo/arikan.png` (depoda; arikantime CDN'ine bağımlılık kalktı). Menü: Markalar (Optik/Clip-On bağlantıları bu menünün altında), Yeni Gelenler, Ölçü Rehberi, Blog, Satış Noktaları, S.S.S., İletişim, TR|EN.

- **Yüz şekli rehberi / şekil filtreleri:** ana sayfada "Yüzünüze göre çerçeve" (Oval/Yuvarlak/Kare/Kalp → önerilen şekiller + örnek modeller + `/search?shape=…`); koleksiyon filtrelerinde Çerçeve şekli ve Çerçeve yapısı.
- **Ölçü aracı:** Ekartman Rehberi sayfasının üstünde (`#olcu=52-18-140` ile doğrudan sonuç); ana sayfadaki ölçü bandından da gönderilir. ±2 mm cam / ±1 mm köprü.
- **Favoriler:** kart ve model sayfasındaki kalp; `/search?fav=1` kişisel liste (tarayıcıda), `/search?fav=KOD,KOD` paylaşılan liste; WhatsApp'tan sor.
- **Sanal deneme:** model sayfasında "Sanal deneme" düğmesi (`?tryon` ile otomatik açılır). Tarayıcıda MediaPipe Face Landmarker (jsDelivr'dan yüklenir, Google model dosyası) ile yüz noktaları bulunur; çerçeve, göz bebeği mesafesi 63 mm kabul edilerek **gerçek ölçekte** çizilir (2×cam+köprü+10 mm). Kamera yoksa fotoğraf yüklenir; "Fotoğraf çek" paylaşır/indirir. Çerçeve PNG'leri `img/tryon/KOD.png` (ön görsellerden arka plan kaldırılmış, camdan görünen katlı sap uçları silinmiş, 256 renk) — `gen_tryon.py` ile üretilir (OpenCV gerekir); görüntü cihazdan çıkmaz.

- **İletişim sayfası:** gerçek adres/telefon/e-posta (arikantime.com'dan), harita (anahtarsız Google Maps gömme, koordinat 41.1024,28.9850) ve iletişim formu. Form, `AO_CONFIG.contact` ile Google Form'a (id 1sM_FWO9SmvsLsBS2tSqGFkkuKU9Y1hCnLilzGfyAPas; bağlı tablo "Arıkan Optik · İletişim Mesajları") gönderilir, yeni yanıt e-posta bildirimi açık; "WhatsApp ile gönder" aynı metni WhatsApp'a taşır. WhatsApp numarası tema HTML'indeki 0507 490 48 24 olarak kalır.
- **Gizlilik ve KVKK:** /p/gizlilik-ve-kvkk.html (TR/EN); alt bilgi Kurumsal'da, talep ve iletişim formlarının altında onay satırı.
- **Çerez tercihi:** ilk ziyarette küçük çubuk; GA4 rıza modu varsayılan "denied", "Kabul et" → `analytics_storage: granted` (localStorage `ao_cookie` = 1/0). Reddedenlerde Analytics çerez bırakmaz (yalnızca çerezsiz ping).

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

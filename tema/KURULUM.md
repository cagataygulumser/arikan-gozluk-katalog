# Arıkan Optik · 2026 Gözlük Kataloğu — Blogger Kurulum Rehberi

## Ne teslim edildi?

| Dosya | Ne işe yarar |
|---|---|
| `arikan-optik-tema.xml` | Blogger teması (arikantime.com tasarım dili). Tema > Düzenle > HTML'e yapıştırılır. |
| `arikan-optik-icerik-import.xml` | 161 model yazısı + 5 sabit sayfa. Ayarlar > İçeriği içe aktar ile tek seferde yüklenir. |
| `models.json` | Tüm model verisi (GitHub'da; tema buradan beslenir). |
| GitHub deposu `cagataygulumser/arikan-gozluk-katalog` | 1.530 ürün görseli, 16 hero fotoğrafı, 4 logo, `models.json`. jsDelivr CDN ile servis edilir. |

Veri kapsamı: **161 model, 517 renk varyantı** — Lee Cooper 53 (32 optik + 21 clip-on), Slazenger 66 (41 + 25), Quantum 30 (26 + 4), Belmond 12 (9 + 3).

## Kurulum (sırayla)

1. **Blog oluştur** — blogger.com > Yeni blog. Dil: Türkçe. (Adres örn. `arikanoptik.blogspot.com`; sonradan özel alan adı bağlanabilir.)
2. **Temayı yükle** — Tema > sağ üstteki ok > *Geri yükle* > `arikan-optik-tema.xml` seç. (Ya da *HTML'i düzenle* > tümünü sil > dosya içeriğini yapıştır > Kaydet.)
3. **İçeriği içe aktar** — Ayarlar > *İçeriği yönet* > *İçeriği içe aktar* > `arikan-optik-icerik-import.xml`. "İçe aktarılan yazıları otomatik yayınla" işaretli olsun. İşlem birkaç dakika sürebilir; yazılar 1 Ekim 2026 tarihli görünür (sıralama için kasıtlı).
4. **Sayfa adreslerini doğrula** — Sayfalar bölümünde 5 sayfa olmalı. Tema şu adresleri bekler:
   - `/p/ekartman-rehberi.html`, `/p/sik-sorulan-sorular.html`, `/p/yetkili-satis-noktalari.html`, `/p/hakkimizda.html`, `/p/iletisim.html`
   Blogger farklı bir adres verdiyse: Tema > HTML'i düzenle'de ilgili `/p/...html` ifadelerini bul-değiştir ile düzelt (menü, footer ve model sayfalarındaki "Ölçü rehberi" bağlantıları).
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
- **Model kodu arama**: üst menüdeki kutuya `LC1408` ya da `9599.C2` yazınca doğrudan model sayfasına gider (renk kodu yazılırsa o renk seçili açılır). Yazarken öneri listesi çıkar.
- **Koleksiyon sayfaları**: `/search/label/Lee Cooper`, `/search/label/Clip-On`, `/search/label/Optik`, `/search/label/Yeni`, `/search` (tümü). Soldaki filtreler: marka, tür, çerçeve genişliği, malzeme, renk ailesi, özellik (Yeni / Polarize / Anti-Far / Titanyum). Sıralama: katalog sırası, yeni, kod, genişlik, renk sayısı.
- **Model sayfası**: büyük ön görsel (tıklayınca büyür), ön/yan/clip-on küçük resimler, ekartman şeması, malzeme tablosu, renk seçenekleri (tıklayınca görseller ve renk detayları değişir), tüm renklerin kartları, ölçü bilgisi, SSS, aynı markadan benzer ölçülü 4 model. Her sayfada Google için Product şeması (JSON-LD) gömülü.
- **Etiketler**: her yazıda marka, tür (Optik / Clip-On), çerçeve malzemesi ve varsa Yeni / Polarize / Anti-Far / Titanyum.

## Veri ve görseller nasıl güncellenir?

- Tema, `https://cdn.jsdelivr.net/gh/cagataygulumser/arikan-gozluk-katalog@main/models.json` dosyasını okur; görseller aynı depodaki `img/` klasöründen gelir. Depoya push edilen değişiklik CDN'e en geç 24 saatte yansır (anında yansıması için `@main` yerine bir sürüm etiketi, örn. `@v2`, kullanılabilir).
- Yeni bir model eklemek için: görselleri `img/<marka>/KOD-on.jpg`, `KOD-yan.jpg`, `KOD-C1-on.jpg`… adlarıyla depoya koy; `models.json`'a kaydı ekle; Blogger'da aynı yapıda bir yazı aç (yazı başlığı mutlaka `Marka KOD` biçiminde olmalı; arama ve kartlar yazıyı bu başlıktan bulur).
- 2027 kataloğu geldiğinde: aynı PDF'ler `parse_catalog.py` ile işlenir, `merge.py` + `gen_content.py` ile yeni import XML'i üretilir. Betikler depodaki `tema/` klasöründe.

## Bilinmesi gerekenler

- Görsel çözünürlüğü kataloğa bağlı: kapak (ilk renk) görselleri ~1100 px, renk varyantı görselleri ~440 px genişliğinde. Varyant görselleri kartlarda ve küçük resimlerde kullanılır; büyütmede yumuşak görünebilir.
- Lee Cooper kataloğu sıkıştırılmış (metinsiz) olduğu için veriler OCR ile okundu ve örneklemle doğrulandı; bir hata görürsen ilgili yazıyı Blogger'da düzelt ve `models.json`'daki kaydı güncelle.
- Slazenger'da 7 modelin clip-on çerçeve rengi katalogda "-" olarak geçiyor (çerçevesiz clip); sitede bu alan boş bırakıldı.
- Fiyat alanı bilinçli olarak yok; "Yetkili satış noktası bul" ve WhatsApp yönlendirmesi var.

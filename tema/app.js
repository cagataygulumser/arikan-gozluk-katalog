/* =====================================================================
   ARIKAN OPTİK — Gözlük Kataloğu · tema JavaScript'i
   Veri kaynağı: GitHub + jsDelivr CDN (models.json + görseller)
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.AO_CONFIG || {};
  var CDN = CFG.cdn || 'https://cdn.jsdelivr.net/gh/cagataygulumser/arikan-gozluk-katalog@main/';
  var BRANDS = CFG.brands || {};
  var BRAND_ORDER = ['lee-cooper', 'quantum', 'slazenger', 'belmond'];
  var FEED_URL = (CFG.feed || '/feeds/posts/summary?alt=json&max-results=500');
  var BODY = document.body;
  var VIEW = BODY.getAttribute('data-view') || 'home';
  var LABEL = BODY.getAttribute('data-label') || '';
  var QUERY = BODY.getAttribute('data-query') || '';
  var state = { models: [], posts: {}, ready: false };

  /* ---------- yardımcılar ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]; }); }
  function slug(s) { return String(s).toLowerCase().replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function img(m, name) { return CDN + 'img/' + m.brand_slug + '/' + name; }
  function trUpper(s) { return String(s).replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase(); }
  function dimStr(m) { return (m.lens || '–') + ' □ ' + (m.bridge || '–') + ' – ' + (m.temple || '–'); }
  function catLabel(m) { return m.category === 'Clip-On' ? 'Clip-On' : 'Optik Çerçeve'; }
  function brandInfo(m) { return BRANDS[m.brand_slug] || { name: m.brand, logo: CDN + 'img/logo/' + m.brand_slug + '.png' }; }
  function isPolar(m) { return /polar/i.test(m.materials && m.materials.Cam || ''); }
  function frameMaterial(m) { return (m.materials && m.materials['Çerçeve']) || ''; }

  /* ---------- renk eşleme ---------- */
  var COLOR_MAP = [
    [/şeffaf|kristal|transparan/i, '#E5E7EB'], [/siyah/i, '#111111'], [/antrasit/i, '#374151'], [/gun ?metal|gun/i, '#4B5563'],
    [/gümüş|gumus/i, '#C9CCD1'], [/pembe altın|rose/i, '#E0B4A0'], [/altın|gold/i, '#D4AF37'], [/bakır/i, '#B87333'], [/bronz/i, '#8C6A3F'],
    [/demi|havana|kaplumbağa/i, '#8B5A2B'], [/kahverengi/i, '#6B4423'], [/bordo/i, '#7F1D1D'], [/kırmızı|kirmizi/i, '#DC2626'],
    [/lacivert/i, '#1E3A8A'], [/petrol/i, '#0F766E'], [/mavi/i, '#2563EB'], [/haki/i, '#6B705C'], [/yeşil|yesil/i, '#166534'],
    [/pembe/i, '#F472B6'], [/mor|lila/i, '#7C3AED'], [/turuncu/i, '#F97316'], [/sarı|sari/i, '#FACC15'], [/bej|krem/i, '#E7D8C0'],
    [/beyaz/i, '#FFFFFF'], [/füme|fume/i, '#4B5563'], [/gri/i, '#9CA3AF'], [/karbon/i, '#2F2F2F'], [/rubber/i, '#222222']
  ];
  var FAMILIES = [
    ['Siyah', /siyah|karbon/i], ['Gri / Gun', /gri|gun|antrasit|füme/i], ['Gümüş', /gümüş/i], ['Altın / Bronz', /altın|bronz|bakır|rose/i],
    ['Kahverengi / Demi', /kahverengi|demi|havana/i], ['Mavi / Lacivert', /mavi|lacivert|petrol/i], ['Yeşil / Haki', /yeşil|haki/i],
    ['Kırmızı / Bordo', /kırmızı|bordo|turuncu/i], ['Pembe / Mor', /pembe|mor|lila/i], ['Şeffaf / Kristal', /şeffaf|kristal/i], ['Bej / Beyaz', /bej|beyaz|krem|sarı/i]
  ];
  function hexOf(name) {
    var n = String(name || '');
    for (var i = 0; i < COLOR_MAP.length; i++) if (COLOR_MAP[i][0].test(n)) return COLOR_MAP[i][1];
    return '#9CA3AF';
  }
  function swatch(v) {
    var fc = (v.attrs && v.attrs.frame_color) || '';
    var parts = fc.split('/').map(function (s) { return s.trim(); }).filter(Boolean);
    var title = esc(v.code + (fc ? ' · ' + fc : ''));
    if (parts.length > 1) return '<i class="sw sw--multi" title="' + title + '" style="--c1:' + hexOf(parts[0]) + ';--c2:' + hexOf(parts[1]) + '"></i>';
    return '<i class="sw" title="' + title + '" style="background:' + hexOf(parts[0] || '') + '"></i>';
  }
  function familiesOf(m) {
    var out = {};
    (m.variants || []).forEach(function (v) {
      var fc = (v.attrs && v.attrs.frame_color) || '';
      FAMILIES.forEach(function (f) { if (f[1].test(fc)) out[f[0]] = 1; });
    });
    return Object.keys(out);
  }

  /* ---------- veri yükleme ---------- */
  function fetchJSON(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); });
  }
  function loadModels() {
    try { var c = sessionStorage.getItem('ao_models_v1'); if (c) return Promise.resolve(JSON.parse(c)); } catch (e) { }
    return fetchJSON(CDN + 'models.json').then(function (d) {
      try { sessionStorage.setItem('ao_models_v1', JSON.stringify(d)); } catch (e) { }
      return d;
    });
  }
  function loadPosts() {
    if (CFG.posts) return Promise.resolve(CFG.posts);
    try { var c = sessionStorage.getItem('ao_posts_v1'); if (c) return Promise.resolve(JSON.parse(c)); } catch (e) { }
    return fetchJSON(FEED_URL).then(function (d) {
      var map = {};
      ((d.feed && d.feed.entry) || []).forEach(function (e) {
        var t = (e.title && e.title.$t) || '';
        var m = t.match(/([A-Z]{0,2}\d{3,5})\s*$/);
        var link = (e.link || []).filter(function (l) { return l.rel === 'alternate'; })[0];
        if (m && link) map[m[1]] = link.href;
      });
      try { sessionStorage.setItem('ao_posts_v1', JSON.stringify(map)); } catch (e) { }
      return map;
    }).catch(function () { return {}; });
  }
  function postUrl(m) { return state.posts[m.code] || ('/search?q=' + encodeURIComponent(m.code)); }

  function ready() {
    return Promise.all([loadModels(), loadPosts()]).then(function (r) {
      state.models = (r[0].models || []).map(function (m) {
        m.brand_slug = m.brand_slug || slug(m.brand);
        return m;
      });
      state.posts = r[1] || {};
      state.ready = true;
      return state;
    });
  }

  /* ---------- kart ---------- */
  function card(m) {
    var b = brandInfo(m);
    var front = m.images && m.images.front ? img(m, m.images.front) : (m.variants[0] && m.variants[0].images.front ? img(m, m.variants[0].images.front) : '');
    var side = m.images && m.images.side ? img(m, m.images.side) : '';
    var badges = '';
    if (m.new) badges += '<span class="badge badge--red">Yeni</span>';
    if (m.category === 'Clip-On') badges += '<span class="badge badge--dark">Clip-On</span>';
    if (m.antifar) badges += '<span class="badge">Anti-Far</span>';
    return '<a class="card" href="' + esc(postUrl(m)) + '" data-code="' + esc(m.code) + '">' +
      '<div class="card__img"><div class="card__badges">' + badges + '</div>' +
      '<img class="front" loading="lazy" src="' + esc(front) + '" alt="' + esc(b.name + ' ' + m.code + ' gözlük önden görünüm') + '">' +
      (side ? '<img class="side" loading="lazy" src="' + esc(side) + '" alt="' + esc(b.name + ' ' + m.code + ' yandan görünüm') + '">' : '') +
      '</div><div class="card__body"><div class="card__brand">' + esc(b.name) + ' · ' + esc(catLabel(m)) + '</div>' +
      '<div class="card__code">' + esc(m.code) + '</div>' +
      '<div class="card__meta"><span>' + m.variants.length + ' renk</span><span class="swatches">' + m.variants.slice(0, 8).map(swatch).join('') + '</span></div>' +
      '<div class="card__dims">' + esc(dimStr(m)) + ' mm · ' + esc(frameMaterial(m)) + '</div></div></a>';
  }
  function renderGrid(el, list) {
    if (!list.length) { el.innerHTML = '<div class="empty"><b>Sonuç bulunamadı</b>Filtreleri temizleyip tekrar deneyin ya da model kodunu doğrudan arayın.</div>'; return; }
    el.innerHTML = '<div class="grid">' + list.map(card).join('') + '</div>';
  }

  /* ---------- arama ---------- */
  function findExact(q) {
    var n = slug(q).replace(/-/g, '').toUpperCase();
    if (!n) return null;
    for (var i = 0; i < state.models.length; i++) {
      var m = state.models[i];
      if (m.code.toUpperCase() === n) return m;
      for (var j = 0; j < m.variants.length; j++) if (m.variants[j].code.replace(/\./g, '').toUpperCase() === n) return m;
    }
    return null;
  }
  function variantHash(q, m) {
    var n = slug(q).replace(/-/g, '').toUpperCase();
    for (var j = 0; j < m.variants.length; j++) if (m.variants[j].code.replace(/\./g, '').toUpperCase() === n) return '#' + m.variants[j].code.replace('.', '-');
    return '';
  }
  function searchModels(q) {
    var n = slug(q).replace(/-/g, '');
    if (!n) return [];
    var ql = q.toLowerCase();
    return state.models.filter(function (m) {
      if (slug(m.code).replace(/-/g, '').indexOf(n) >= 0) return true;
      if (slug(m.brand).replace(/-/g, '').indexOf(n) >= 0) return true;
      var hay = (m.category + ' ' + Object.keys(m.materials).map(function (k) { return m.materials[k]; }).join(' ') + ' ' +
        m.variants.map(function (v) { return Object.keys(v.attrs).map(function (k) { return v.attrs[k]; }).join(' '); }).join(' ')).toLowerCase();
      return hay.indexOf(ql) >= 0;
    });
  }
  function bindSearch(form) {
    if (!form) return;
    var input = $('input', form), box = form.parentNode.querySelector('.search-suggest');
    form.addEventListener('submit', function (e) {
      var q = input.value.trim(); if (!q) { e.preventDefault(); return; }
      if (state.ready) { var m = findExact(q); if (m && state.posts[m.code]) { e.preventDefault(); location.href = state.posts[m.code] + variantHash(q, m); } }
    });
    if (!box) return;
    input.addEventListener('input', function () {
      var q = input.value.trim();
      if (!state.ready || q.length < 2) { box.classList.remove('open'); return; }
      var res = searchModels(q).slice(0, 8);
      if (!res.length) { box.classList.remove('open'); return; }
      box.innerHTML = res.map(function (m) {
        var b = brandInfo(m);
        return '<a href="' + esc(postUrl(m)) + '"><img src="' + esc(img(m, m.images.front || m.variants[0].images.front)) + '" alt=""><span><b>' + esc(m.code) + '</b><small>' + esc(b.name + ' · ' + catLabel(m) + ' · ' + m.variants.length + ' renk') + '</small></span></a>';
      }).join('');
      box.classList.add('open');
    });
    document.addEventListener('click', function (e) { if (!form.parentNode.contains(e.target)) box.classList.remove('open'); });
  }

  /* ---------- sabit sayfa bağlantıları (Blogger'ın verdiği gerçek adreslere çevir) ---------- */
  var PAGE_TITLES = { '/p/ekartman-rehberi.html': 'Ekartman Rehberi', '/p/sik-sorulan-sorular.html': 'Sık Sorulan Sorular', '/p/yetkili-satis-noktalari.html': 'Yetkili Satış Noktaları', '/p/hakkimizda.html': 'Hakkımızda', '/p/iletisim.html': 'İletişim' };
  function fixPageLinks() {
    var apply = function (map) {
      $$('a[href^="/p/"]').forEach(function (a) {
        var key = a.getAttribute('href').split('#')[0];
        var t = PAGE_TITLES[key];
        if (t && map[t]) a.setAttribute('href', map[t]);
      });
    };
    try { var c = sessionStorage.getItem('ao_pages_v1'); if (c) { apply(JSON.parse(c)); return; } } catch (e) { }
    fetchJSON('/feeds/pages/default?alt=json').then(function (d) {
      var map = {};
      ((d.feed && d.feed.entry) || []).forEach(function (e) {
        var link = (e.link || []).filter(function (l) { return l.rel === 'alternate'; })[0];
        if (link) map[e.title.$t] = link.href;
      });
      try { sessionStorage.setItem('ao_pages_v1', JSON.stringify(map)); } catch (e) { }
      apply(map);
    }).catch(function () { });
  }

  /* ---------- header ---------- */
  function initHeader() {
    fixPageLinks();
    if (CFG.whatsapp) $$('a[href*="wa.me/905000000000"]').forEach(function (a) { a.href = a.href.replace('905000000000', CFG.whatsapp); if (/\+90 500/.test(a.textContent)) a.textContent = '0507 490 48 24'; });
    // içe aktarılmış eski metinlerdeki uyarı/not satırlarını kaldır
    $$('.page .note').forEach(function (n) { if (/Blogger/.test(n.textContent)) n.parentNode.removeChild(n); });
    $$('.faq p').forEach(function (pp) { pp.textContent = pp.textContent.replace(/\s*Bu site satış yapmaz, modelin tüm bilgilerini tek yerde sunar\./, ''); });
    var burger = $('.burger'), nav = $('.nav');
    if (burger && nav) burger.addEventListener('click', function () { nav.classList.toggle('open'); BODY.classList.toggle('nav-open'); });
    $$('.search').forEach(bindSearch);
    var top = $('.to-top');
    if (top) {
      window.addEventListener('scroll', function () { top.classList.toggle('show', window.scrollY > 500); }, { passive: true });
      top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
    }
    // Markalar menüsüne model sayıları
    ready().then(function () {
      $$('[data-brand-count]').forEach(function (el) {
        var s = el.getAttribute('data-brand-count');
        var n = state.models.filter(function (m) { return s === 'all' || m.brand_slug === s; }).length;
        el.textContent = n + ' model';
      });
    });
  }

  /* ---------- ana sayfa ---------- */
  function initHome() {
    // hero slider
    var slides = $$('.hero__slide'), dots = $('.hero__dots'), i = 0, timer;
    if (slides.length) {
      slides.forEach(function (s, k) { var d = document.createElement('button'); d.setAttribute('aria-label', 'Slayt ' + (k + 1)); d.addEventListener('click', function () { go(k); }); dots.appendChild(d); });
      function go(k) { slides[i].classList.remove('active'); dots.children[i].classList.remove('active'); i = (k + slides.length) % slides.length; slides[i].classList.add('active'); dots.children[i].classList.add('active'); clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 6500); }
      go(0);
      $('.hero__arrow--prev').addEventListener('click', function () { go(i - 1); });
      $('.hero__arrow--next').addEventListener('click', function () { go(i + 1); });
    }
    bindSearch($('.hero-search'));
    ready().then(function () {
      var ms = state.models;
      var set = function (sel, v) { var el = $(sel); if (el) el.textContent = v; };
      set('[data-stat=brands]', Object.keys(ms.reduce(function (a, m) { a[m.brand_slug] = 1; return a; }, {})).length);
      set('[data-stat=models]', ms.length);
      set('[data-stat=colors]', ms.reduce(function (a, m) { return a + m.variants.length; }, 0));
      set('[data-stat=clip]', ms.filter(function (m) { return m.category === 'Clip-On'; }).length);
      $$('[data-brand-count]').forEach(function (el) { var s = el.getAttribute('data-brand-count'); el.textContent = ms.filter(function (m) { return m.brand_slug === s; }).length + ' model'; });
      var newGrid = $('#home-new');
      if (newGrid) {
        var news = ms.filter(function (m) { return m.new; });
        if (!news.length) news = ms.filter(function (m) { return m.category === 'Clip-On'; }).slice(0, 8);
        renderGrid(newGrid, news.slice(0, 8));
      }
      var pick = $('#home-pick');
      if (pick) {
        // her markadan 2 model
        var out = [];
        BRAND_ORDER.forEach(function (b) { out = out.concat(ms.filter(function (m) { return m.brand_slug === b; }).slice(0, 2)); });
        renderGrid(pick, out);
      }
    });
  }

  /* ---------- koleksiyon / etiket / arama sayfası ---------- */
  function initCollection() {
    var root = $('#collection'); if (!root) return;
    var filt = { brand: [], cat: [], mat: [], fam: [], feat: [], size: [] };
    var sort = 'default';
    var initial = (LABEL || '').trim();
    var q = (QUERY || '').trim();
    var head = $('#coll-title'), lead = $('#coll-lead'), logoEl = $('#coll-logo'), count = $('#coll-count');
    ready().then(function () {
      var ms = state.models;
      // etikete göre başlangıç
      var bslug = slug(initial);
      var brandHit = BRANDS[bslug];
      if (brandHit) { filt.brand = [bslug]; head.textContent = brandHit.name; lead.textContent = brandHit.desc || ''; if (logoEl) logoEl.innerHTML = '<img src="' + esc(brandHit.logo) + '" alt="' + esc(brandHit.name) + '">'; }
      else if (/clip/i.test(initial)) { filt.cat = ['Clip-On']; head.textContent = 'Clip-On Koleksiyonu'; lead.textContent = 'Mıknatıslı güneş camı ile tek çerçeve, iki kullanım: numaralı optik gözlük ve polarize güneş gözlüğü.'; }
      else if (/optik/i.test(initial)) { filt.cat = ['Optik']; head.textContent = 'Optik Çerçeveler'; lead.textContent = 'Numaralı cam için tasarlanmış 2026 optik çerçeve koleksiyonu.'; }
      else if (/yeni/i.test(initial)) { filt.feat = ['new']; head.textContent = 'Koleksiyona Yeni Eklenenler'; lead.textContent = '2026 sezonunda koleksiyona katılan en yeni modeller.'; }
      else if (/polar/i.test(initial)) { filt.feat = ['polar']; head.textContent = 'Polarize Camlı Modeller'; }
      else if (/anti/i.test(initial)) { filt.feat = ['antifar']; head.textContent = 'Anti-Far Seçenekli Modeller'; }
      else if (q) { head.textContent = '"' + q + '" için sonuçlar'; var exact = findExact(q); if (exact && state.posts[exact.code]) { location.replace(state.posts[exact.code] + variantHash(q, exact)); return; } }
      else if (initial) { var matHit = ms.some(function (m) { return slug(frameMaterial(m)) === bslug; }); if (matHit) { filt.mat = [bslug]; head.textContent = initial + ' Çerçeveler'; } else head.textContent = initial; }
      else { head.textContent = 'Tüm Modeller'; lead.textContent = 'Lee Cooper, Quantum, Slazenger ve Belmond 2026 koleksiyonlarının tamamı.'; }
      buildFilters(ms);
      apply();
    });

    function buildFilters(ms) {
      var f = $('#filters');
      var counts = function (fn) { var c = {}; ms.forEach(function (m) { var ks = fn(m); (Array.isArray(ks) ? ks : [ks]).forEach(function (k) { if (k) c[k] = (c[k] || 0) + 1; }); }); return c; };
      var group = function (title, key, items, render) {
        return '<fieldset><h4>' + title + '</h4>' + items.map(function (it) {
          var checked = filt[key].indexOf(it.v) >= 0 ? ' checked' : '';
          return '<label><input type="checkbox" data-k="' + key + '" value="' + esc(it.v) + '"' + checked + '>' + (render ? render(it) : '') + '<span>' + esc(it.l) + '</span><span class="n">' + it.n + '</span></label>';
        }).join('') + '</fieldset>';
      };
      var cb = counts(function (m) { return m.brand_slug; });
      var cc = counts(function (m) { return m.category; });
      var cm = counts(function (m) { return slug(frameMaterial(m)); });
      var cf = counts(familiesOf);
      var feats = [['new', 'Yeni gelenler', ms.filter(function (m) { return m.new; }).length], ['polar', 'Polarize cam', ms.filter(isPolar).length], ['antifar', 'Anti-Far seçeneği', ms.filter(function (m) { return m.antifar; }).length], ['titan', 'Titanyum', ms.filter(function (m) { return /titan/i.test(JSON.stringify(m.materials)); }).length]].filter(function (x) { return x[2]; });
      var sizes = [['46-49', 'Küçük · 46–49 mm'], ['50-52', 'Orta · 50–52 mm'], ['53-55', 'Büyük · 53–55 mm'], ['56-99', 'Ekstra · 56 mm +']];
      var matLabel = {}; ms.forEach(function (m) { matLabel[slug(frameMaterial(m))] = frameMaterial(m); });
      f.innerHTML = '<button class="filters__close" aria-label="Kapat">×</button>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px"><h4 style="margin:0">Filtrele</h4><button class="filters__clear" id="f-clear">Temizle</button></div>' +
        group('Marka', 'brand', BRAND_ORDER.filter(function (b) { return cb[b]; }).map(function (b) { return { v: b, l: (BRANDS[b] || { name: b }).name, n: cb[b] }; })) +
        group('Tür', 'cat', ['Optik', 'Clip-On'].filter(function (c) { return cc[c]; }).map(function (c) { return { v: c, l: c === 'Optik' ? 'Optik çerçeve' : 'Clip-On', n: cc[c] }; })) +
        group('Çerçeve genişliği', 'size', sizes.map(function (s) { var r = s[0].split('-'); return { v: s[0], l: s[1], n: ms.filter(function (m) { return m.lens >= +r[0] && m.lens <= +r[1]; }).length }; }).filter(function (x) { return x.n; })) +
        group('Çerçeve malzemesi', 'mat', Object.keys(cm).sort(function (a, b) { return cm[b] - cm[a]; }).map(function (k) { return { v: k, l: matLabel[k], n: cm[k] }; })) +
        group('Renk', 'fam', FAMILIES.map(function (fa) { return { v: fa[0], l: fa[0], n: cf[fa[0]] || 0 }; }).filter(function (x) { return x.n; }), function (it) { return '<i class="sw" style="background:' + hexOf(it.v.split('/')[0]) + '"></i>'; }) +
        group('Özellik', 'feat', feats.map(function (x) { return { v: x[0], l: x[1], n: x[2] }; }));
      f.addEventListener('change', function (e) {
        var t = e.target; if (t.type !== 'checkbox') return;
        var k = t.getAttribute('data-k'), arr = filt[k], i = arr.indexOf(t.value);
        if (t.checked && i < 0) arr.push(t.value); if (!t.checked && i >= 0) arr.splice(i, 1);
        apply();
      });
      $('#f-clear').addEventListener('click', function () { Object.keys(filt).forEach(function (k) { filt[k] = []; }); $$('input[type=checkbox]', f).forEach(function (c) { c.checked = false; }); apply(); });
      $('.filters__close', f).addEventListener('click', function () { f.classList.remove('open'); });
      var tg = $('.filters-toggle'); if (tg) tg.addEventListener('click', function () { f.classList.add('open'); });
      var so = $('#sort'); if (so) so.addEventListener('change', function () { sort = so.value; apply(); });
    }
    function apply() {
      var ms = state.models.filter(function (m) {
        if (q && searchModels(q).indexOf(m) < 0) return false;
        if (filt.brand.length && filt.brand.indexOf(m.brand_slug) < 0) return false;
        if (filt.cat.length && filt.cat.indexOf(m.category) < 0) return false;
        if (filt.mat.length && filt.mat.indexOf(slug(frameMaterial(m))) < 0) return false;
        if (filt.fam.length) { var fam = familiesOf(m); if (!filt.fam.some(function (x) { return fam.indexOf(x) >= 0; })) return false; }
        if (filt.size.length && !filt.size.some(function (s) { var r = s.split('-'); return m.lens >= +r[0] && m.lens <= +r[1]; })) return false;
        if (filt.feat.length) {
          if (filt.feat.indexOf('new') >= 0 && !m.new) return false;
          if (filt.feat.indexOf('polar') >= 0 && !isPolar(m)) return false;
          if (filt.feat.indexOf('antifar') >= 0 && !m.antifar) return false;
          if (filt.feat.indexOf('titan') >= 0 && !/titan/i.test(JSON.stringify(m.materials))) return false;
        }
        return true;
      });
      if (sort === 'code') ms.sort(function (a, b) { return a.code.localeCompare(b.code, 'tr', { numeric: true }); });
      else if (sort === 'size-asc') ms.sort(function (a, b) { return (a.lens || 0) - (b.lens || 0); });
      else if (sort === 'size-desc') ms.sort(function (a, b) { return (b.lens || 0) - (a.lens || 0); });
      else if (sort === 'colors') ms.sort(function (a, b) { return b.variants.length - a.variants.length; });
      else if (sort === 'new') ms.sort(function (a, b) { return (b.new ? 1 : 0) - (a.new ? 1 : 0); });
      count.textContent = ms.length + ' model';
      renderGrid($('#coll-grid'), ms);
      // chips
      var chips = $('#chips'); var html = '';
      var labelOf = { brand: function (v) { return (BRANDS[v] || { name: v }).name; }, cat: function (v) { return v; }, mat: function (v) { return v; }, fam: function (v) { return v; }, size: function (v) { return v.replace('-99', '+').replace('-', '–') + ' mm'; }, feat: function (v) { return { new: 'Yeni', polar: 'Polarize', antifar: 'Anti-Far', titan: 'Titanyum' }[v]; } };
      Object.keys(filt).forEach(function (k) { filt[k].forEach(function (v) { html += '<span class="chip"><b>' + esc(labelOf[k](v)) + '</b><button data-k="' + k + '" data-v="' + esc(v) + '" aria-label="Kaldır">×</button></span>'; }); });
      chips.innerHTML = html;
      $$('button', chips).forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-k'), v = b.getAttribute('data-v'); filt[k] = filt[k].filter(function (x) { return x !== v; });
          var cbx = $('#filters input[data-k="' + k + '"][value="' + v.replace(/"/g, '\\"') + '"]'); if (cbx) cbx.checked = false; apply();
        });
      });
    }
  }

  /* ---------- model sayfası ---------- */
  function initModel() {
    var art = $('.model'); if (!art) return;
    var code = art.getAttribute('data-code');
    var mainImg = $('#m-front'), sideImg = $('#m-side'), clipImg = $('#m-clip');
    var thumbs = $$('.model__thumbs figure');
    var attrsBox = $('#m-attrs');
    var initDone = false;
    var LABELS = { frame_color: 'Çerçeve rengi', temple_color: 'Sap rengi', tip_color: 'Sap ucu rengi', lens_color: 'Lens rengi', clip_frame_color: 'Clip-on çerçeve', clip_lens_color: 'Clip-on cam rengi' };
    // thumbs -> ana görsel
    thumbs.forEach(function (fg) {
      fg.addEventListener('click', function () {
        thumbs.forEach(function (x) { x.classList.remove('active'); }); fg.classList.add('active');
        var im = $('img', fg); mainImg.src = im.src; mainImg.alt = im.alt;
      });
    });
    // renk seçimi
    $$('.color-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.color-btn').forEach(function (x) { x.classList.remove('active'); }); btn.classList.add('active');
        var f = btn.getAttribute('data-front'), s = btn.getAttribute('data-side'), c = btn.getAttribute('data-clip');
        var imgs = { front: f, side: s, clip: c };
        thumbs.forEach(function (fg) { var k = fg.getAttribute('data-kind'); var im = $('img', fg); if (imgs[k]) { im.src = imgs[k]; fg.style.display = ''; } else if (k === 'clip') fg.style.display = 'none'; });
        var act = thumbs.filter(function (x) { return x.classList.contains('active'); })[0] || thumbs[0];
        if (act) mainImg.src = $('img', act).src;
        var attrs = {}; try { attrs = JSON.parse(btn.getAttribute('data-attrs') || '{}'); } catch (e) { }
        if (attrsBox) {
          var dl = Object.keys(attrs).filter(function (k) { return attrs[k]; }).map(function (k) { return '<dt>' + esc(LABELS[k] || k) + '</dt><dd>' + swatch({ code: '', attrs: { frame_color: attrs[k] } }) + esc(attrs[k]) + '</dd>'; }).join('');
          attrsBox.innerHTML = '<div class="attrs__title"><span>Seçili renk</span><b>' + esc(btn.getAttribute('data-code')) + '</b></div><dl>' + dl + '</dl>';
        }
        if (initDone) history.replaceState(null, '', '#' + btn.getAttribute('data-code').replace('.', '-'));
      });
    });
    var h = location.hash.replace('#', '').replace('-', '.');
    var pre = $$('.color-btn').filter(function (b) { return b.getAttribute('data-code') === h; })[0] || $('.color-btn');
    if (pre) { var y = window.scrollY; pre.click(); window.scrollTo(0, y); pre.blur(); }
    initDone = true;
    // breadcrumb: marka ve tür
    var cb = $('[data-crumb-brand]'), cc = $('[data-crumb-cat]');
    if (cb) { cb.textContent = art.getAttribute('data-brand'); cb.href = '/search/label/' + encodeURIComponent(art.getAttribute('data-brand')); }
    if (cc) { cc.textContent = art.getAttribute('data-cat'); cc.href = '/search/label/' + encodeURIComponent(art.getAttribute('data-cat')); }
    // lightbox
    var lb = document.createElement('div'); lb.className = 'lightbox'; lb.innerHTML = '<img alt="">'; document.body.appendChild(lb);
    if (mainImg) { mainImg.parentNode.addEventListener('click', function () { $('img', lb).src = mainImg.src; lb.classList.add('open'); }); }
    lb.addEventListener('click', function () { lb.classList.remove('open'); });
    // paylaş
    var sh = $('[data-share]'); if (sh) sh.addEventListener('click', function (e) { e.preventDefault(); if (navigator.share) navigator.share({ title: document.title, url: location.href }); else { navigator.clipboard && navigator.clipboard.writeText(location.href); sh.textContent = 'Bağlantı kopyalandı'; } });
    // ilgili modeller + breadcrumb
    ready().then(function () {
      var me = state.models.filter(function (m) { return m.code === code; })[0];
      var rel = $('#related-grid'); if (!rel) return;
      if (!me) { rel.parentNode.style.display = 'none'; return; }
      var pool = state.models.filter(function (m) { return m.code !== me.code && m.brand_slug === me.brand_slug; });
      pool.sort(function (a, b) { var da = Math.abs((a.lens || 0) - (me.lens || 0)) + (a.category === me.category ? 0 : 3); var db = Math.abs((b.lens || 0) - (me.lens || 0)) + (b.category === me.category ? 0 : 3); return da - db; });
      renderGrid(rel, pool.slice(0, 4));
    });
  }

  /* ---------- başlat ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    if (VIEW === 'home') initHome();
    else if (VIEW === 'collection') initCollection();
    else if (VIEW === 'post') initModel();
    else if (VIEW === 'error') initCollection();
  });
})();

/* =====================================================================
   ARIKAN OPTİK — Gözlük Kataloğu · tema JavaScript'i
   Veri kaynağı: GitHub + jsDelivr CDN (models.json + görseller)
   ===================================================================== */
(function () {
  'use strict';
  var CFG = window.AO_CONFIG || {};
  var CDN = CFG.cdn || 'https://cdn.jsdelivr.net/gh/cagataygulumser/arikan-gozluk-katalog@main/';
  var BRANDS = CFG.brands || {};
  var DATA_V = '{{STAMP}}'; // veri dosyaları için önbellek kırıcı (build.py doldurur)
  function dataUrl(name) { return CDN + name + '?v=' + DATA_V; }
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
  /* ---------- ölçüm (GA4) ---------- */
  function track(name, params) { try { if (window.gtag && CFG.ga) window.gtag('event', name, params || {}); } catch (e) { } }
  function modelParams(m) { return { marka: m.brand, model: m.code, tur: m.category, sekil: m.shape || '', malzeme: frameMaterial(m) }; }

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
    try { var c = sessionStorage.getItem('ao_models_' + DATA_V); if (c) return Promise.resolve(JSON.parse(c)); } catch (e) { }
    return fetchJSON(dataUrl('models.json')).then(function (d) {
      try { sessionStorage.setItem('ao_models_' + DATA_V, JSON.stringify(d)); } catch (e) { }
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

  /* ---------- favoriler ---------- */
  var FAV_KEY = 'ao_fav_v1';
  function favGet() { try { return JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch (e) { return []; } }
  function favHas(c) { return favGet().indexOf(c) >= 0; }
  function favToggle(c) { var l = favGet(), i = l.indexOf(c); if (i >= 0) l.splice(i, 1); else l.push(c); try { localStorage.setItem(FAV_KEY, JSON.stringify(l)); } catch (e) { } track(i >= 0 ? 'favori_cikar' : 'favori_ekle', { model: c }); favSync(); return i < 0; }
  function favSync() {
    var l = favGet();
    $$('[data-fav]').forEach(function (b) { var on = l.indexOf(b.getAttribute('data-fav')) >= 0; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); if (b.classList.contains('fav--text')) $('span', b).textContent = on ? 'Favorilerde' : 'Favorilere ekle'; });
    $$('[data-fav-count]').forEach(function (el) { el.textContent = l.length || ''; el.style.display = l.length ? '' : 'none'; });
  }
  function favBtn(code, text) { return '<button class="fav' + (text ? ' fav--text btn btn--ghost' : '') + (favHas(code) ? ' on' : '') + '" type="button" data-fav="' + esc(code) + '" aria-label="Favorilere ekle" aria-pressed="' + (favHas(code) ? 'true' : 'false') + '"><svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.2C1 8 3.5 4.5 7 4.5c2 0 3.5 1 5 2.8 1.5-1.8 3-2.8 5-2.8 3.5 0 6 3.5 4.5 7.3C19.5 16.4 12 21 12 21z"/></svg>' + (text ? '<span>' + (favHas(code) ? 'Favorilerde' : 'Favorilere ekle') + '</span>' : '') + '</button>'; }
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-fav]'); if (!b) return; e.preventDefault(); e.stopPropagation(); favToggle(b.getAttribute('data-fav')); });

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
      '<div class="card__img"><div class="card__badges">' + badges + '</div>' + favBtn(m.code) +
      '<img class="front" loading="lazy" src="' + esc(front) + '" alt="' + esc(b.name + ' ' + m.code + ' gözlük önden görünüm') + '">' +
      (side ? '<img class="side" loading="lazy" src="' + esc(side) + '" alt="' + esc(b.name + ' ' + m.code + ' yandan görünüm') + '">' : '') +
      '</div><div class="card__body"><div class="card__brand">' + esc(b.name) + ' · ' + esc(catLabel(m)) + '</div>' +
      '<div class="card__code">' + esc(m.code) + '</div>' +
      '<div class="card__meta"><span>' + m.variants.length + ' renk</span><span class="swatches">' + m.variants.slice(0, 8).map(swatch).join('') + '</span></div>' +
      '<div class="card__dims">' + esc(dimStr(m)) + ' mm · ' + esc(frameMaterial(m)) + '</div></div></a>';
  }
  function renderGrid(el, list) {
    el.classList.remove('skeleton');
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
/* {{I18N}} */

/* {{SEARCH}} */
  function bindSearch(form) {
    if (!form) return;
    var input = $('input', form), box = form.parentNode.querySelector('.search-suggest');
    form.addEventListener('submit', function (e) {
      var q = input.value.trim(); if (!q) { e.preventDefault(); return; }
      if (state.ready) { var m = findExact(q); track('arama', { terim: q, bulundu: m ? 'evet' : 'hayir', model: m ? m.code : '' }); if (m && state.posts[m.code]) { e.preventDefault(); location.href = state.posts[m.code] + variantHash(q, m); } }
    });
    if (!box) return;
    input.addEventListener('input', function () {
      var q = input.value.trim();
      if (!state.ready || q.length < 2) { box.classList.remove('open'); return; }
      var res = searchModels(q).slice(0, 8);
      if (!res.length || (lastSearch && lastSearch.relaxed === 'all')) { box.classList.remove('open'); return; }
      var all = searchModels(q), chips = (lastSearch && lastSearch.chips.filter(function (c) { return c.k !== 'unknown'; })) || [];
      box.innerHTML = (chips.length ? '<div class="search-suggest__chips">' + chipHtml(chips) + (lastSearch.relaxed ? '<small>tam eşleşme yok · en yakınlar</small>' : '') + '</div>' : '') + res.map(function (m) {
        var b = brandInfo(m);
        return '<a href="' + esc(postUrl(m)) + '"><img src="' + esc(img(m, m.images.front || m.variants[0].images.front)) + '" alt=""><span><b>' + esc(m.code) + '</b><small>' + esc(b.name + ' · ' + catLabel(m) + ' · ' + m.variants.length + ' renk') + '</small></span></a>';
      }).join('') + (all.length > res.length ? '<a class="search-suggest__all" href="/search?q=' + encodeURIComponent(q) + '">Tüm sonuçları gör (' + all.length + ')</a>' : '');
      box.classList.add('open');
    });
    document.addEventListener('click', function (e) { if (!form.parentNode.contains(e.target)) box.classList.remove('open'); });
  }

  /* ---------- sabit sayfa bağlantıları (Blogger'ın verdiği gerçek adreslere çevir) ---------- */
  var PAGE_TITLES = { '/p/ekartman-rehberi.html': 'Ekartman Rehberi', '/p/sik-sorulan-sorular.html': 'Sık Sorulan Sorular', '/p/yetkili-satis-noktalari.html': 'Yetkili Satış Noktaları', '/p/hakkimizda.html': 'Hakkımızda', '/p/iletisim.html': 'İletişim', '/p/qr-etiketler.html': 'QR Etiketler', '/p/bayi-talep-formu.html': 'Bayi Talep Formu', '/p/gizlilik-ve-kvkk.html': 'Gizlilik ve KVKK' };
  function fixPageLinks() {
    var apply = function (map) {
      $$('a[href^="/p/"]').forEach(function (a) {
        var href = a.getAttribute('href'), m = href.match(/^([^?#]+)(\?[^#]*)?(#.*)?$/);
        var t = m && PAGE_TITLES[m[1]];
        if (t && map[t]) a.setAttribute('href', map[t] + (m[2] || '') + (m[3] || ''));
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
    document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href*="wa.me"]'); if (a) { var art = $('.model'); track('whatsapp_tikla', { konum: a.id === 'wa-fab' ? 'sabit_buton' : 'sayfa', model: art ? art.getAttribute('data-code') : '', sayfa: VIEW }); } });
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

  /* ---------- ölçü aracı: "gözlüğümün ölçüsünü yaz" ---------- */
  function parseDims(q) {
    var m = String(q || '').match(/(\d{2})\s*[□\-x×\/\s]\s*(\d{2})(?:\s*[-–x×\/\s]\s*(\d{3}))?/);
    return m ? { lens: +m[1], bridge: +m[2], temple: m[3] ? +m[3] : null } : null;
  }
  function initSizeTool() {
    var h1 = $('.page h1'), pageIn = $('.page__in'); if (!h1 || !pageIn) return;
    if (!/ekartman|size guide/i.test(h1.textContent)) return;
    var box = document.createElement('section'); box.className = 'sizetool'; box.id = 'olcu';
    box.innerHTML = '<p class="eyebrow">Ölçü aracı</p><h2>Gözlüğünüzün ölçüsünü yazın</h2><p class="sizetool__hint">Sapın iç yüzündeki üç sayıyı girin (örn. <b>52 18 140</b>); cam genişliği ±2 mm ve köprü ±1 mm aralığındaki modelleri listeleyelim.</p>' +
      '<form class="sizetool__form"><input id="size-q" type="text" inputmode="numeric" placeholder="52 18 140" autocomplete="off" aria-label="Ekartman"><button class="btn btn--red" type="submit">Uygun modelleri bul</button></form><div class="sizetool__out" id="size-out"></div>';
    h1.parentNode.insertBefore(box, h1.nextSibling);
    var form = $('form', box), inp = $('#size-q', box), out = $('#size-out', box);
    function run(q) {
      var d = parseDims(q);
      if (!d) { out.innerHTML = '<p class="qnote">Ölçüyü "52 18 140" biçiminde yazın (cam genişliği, köprü, sap).</p>'; return; }
      ready().then(function () {
        var list = state.models.filter(function (m) { return Math.abs((m.lens || 0) - d.lens) <= 2 && Math.abs((m.bridge || 0) - d.bridge) <= 1; });
        list.sort(function (a, b) { var da = Math.abs(a.lens - d.lens) * 2 + Math.abs(a.bridge - d.bridge) * 3 + (d.temple ? Math.abs((a.temple || 0) - d.temple) / 5 : 0); var db = Math.abs(b.lens - d.lens) * 2 + Math.abs(b.bridge - d.bridge) * 3 + (d.temple ? Math.abs((b.temple || 0) - d.temple) / 5 : 0); return da - db; });
        track('olcu_ara', { ekartman: d.lens + '-' + d.bridge + (d.temple ? '-' + d.temple : ''), sonuc: list.length });
        var exact = list.filter(function (m) { return m.lens === d.lens && m.bridge === d.bridge; }).length;
        out.innerHTML = '<p class="sizetool__sum"><b>' + list.length + '</b> uygun model' + (exact ? ' · ' + exact + ' tanesi birebir ' + d.lens + ' □ ' + d.bridge : '') + (d.temple ? ' · sap ' + d.temple + ' mm\'ye en yakınlar önce' : '') + '</p><div id="size-grid"></div>' + (list.length > 12 ? '<p style="text-align:center;margin-top:24px"><a class="btn btn--dark" href="/search?q=' + encodeURIComponent(d.lens + ' ' + d.bridge) + '">Tümünü koleksiyonda gör</a></p>' : '');
        renderGrid($('#size-grid', out), list.slice(0, 12));
      });
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); run(inp.value); });
    var m = location.hash.match(/#olcu=([\d\-x]+)/); if (m) { inp.value = m[1].replace(/[-x]/g, ' '); run(inp.value); }
  }

  /* ---------- yüz şekli rehberi (ana sayfa) ---------- */
  var FACES = [
    { k: 'oval', l: 'Oval', d: 'Alın ve çene dengeli, yüz hafif uzun. En esnek yüz tipi: hemen her form uyar; çerçeve yüzün en geniş noktasını aşmasın.', shapes: ['square', 'round', 'cateye', 'geo'], svg: '<ellipse cx="60" cy="62" rx="34" ry="46"/>' },
    { k: 'round', l: 'Yuvarlak', d: 'Genişlik ve uzunluk birbirine yakın, hatlar yumuşak. Köşeli ve geometrik formlar yüze belirginlik katar; küçük yuvarlak çerçevelerden kaçının.', shapes: ['square', 'geo', 'cateye'], svg: '<circle cx="60" cy="62" r="42"/>' },
    { k: 'square', l: 'Kare', d: 'Çene hattı belirgin ve köşeli. Yuvarlak ve oval formlar hatları yumuşatır; ince metal çerçeveler yüzü hafifletir.', shapes: ['round', 'oval'], svg: '<rect x="20" y="18" width="80" height="88" rx="16"/>' },
    { k: 'heart', l: 'Kalp', t: 'Kalp şeklinde yüz', d: 'Alın geniş, çene dar. Alt kısmı dolgun formlar ve açık renkler dengeyi kurar; çok geniş üst çizgilerden kaçının.', shapes: ['oval', 'round', 'geo'], svg: '<path d="M18 40c0-14 12-24 42-24s42 10 42 24c0 28-22 56-42 68C40 96 18 68 18 40z"/>' }
  ];
  function initFaceGuide() {
    var grid = $('#face-grid'), res = $('#face-result'); if (!grid) return;
    grid.innerHTML = FACES.map(function (f) { return '<button class="face__item" data-k="' + f.k + '"><svg viewBox="0 0 120 124" fill="none" stroke="currentColor" stroke-width="3">' + f.svg + '</svg><span>' + esc(f.l) + '</span></button>'; }).join('');
    function show(k) {
      var f = FACES.filter(function (x) { return x.k === k; })[0]; if (!f) return;
      $$('.face__item', grid).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-k') === k); });
      track('yuz_sekli', { yuz: k });
      var models = state.models.filter(function (m) { return f.shapes.indexOf(m.shape) >= 0; });
      var pick = []; f.shapes.forEach(function (sh) { pick = pick.concat(models.filter(function (m) { return m.shape === sh; }).slice(0, 2)); });
      res.innerHTML = '<div class="face__box"><div class="face__text"><h3>' + esc(f.t || (f.l + ' yüz')) + '</h3><p>' + esc(f.d) + '</p><div class="face__shapes">' + f.shapes.map(function (sh) { return '<span class="face__shape">' + ico(SHAPE_ICON, sh) + '<b>' + esc(shapeLabel(sh)) + '</b></span>'; }).join('') + '</div>' +
        '<a class="btn btn--red" href="/search?shape=' + f.shapes.join(',') + '">' + models.length + ' uygun modeli gör</a></div><div class="face__models" id="face-models"></div></div>';
      renderGrid($('#face-models'), pick.slice(0, 4));
      if (window.innerWidth < 900) res.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    $$('.face__item', grid).forEach(function (b) { b.addEventListener('click', function () { show(b.getAttribute('data-k')); }); });
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
    var gs = $('#guide-size'); if (gs) gs.addEventListener('submit', function (e) { e.preventDefault(); var v = $('input', gs).value.trim(); var d = parseDims(v); var a = $('a[href*="ekartman"]', gs.parentNode); var base = a ? a.getAttribute('href') : '/p/ekartman-rehberi.html'; location.href = base + (d ? '#olcu=' + d.lens + '-' + d.bridge + (d.temple ? '-' + d.temple : '') : '#olcu'); });
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
      var hb = $('#home-blog'); if (hb) blogFeed().then(function (list) { renderBlog(hb, list.slice(0, 3)); }).catch(function () { hb.parentNode.parentNode.style.display = 'none'; });
      initFaceGuide();
      var ig = $('#ig-grid');
      if (ig) fetchJSON(dataUrl('instagram.json')).then(function (d) {
        var posts = (d.posts || []).slice(0, 6); ig.classList.remove('skeleton');
        if (!posts.length) { ig.parentNode.parentNode.style.display = 'none'; return; }
        ig.innerHTML = posts.map(function (pp) { return '<a class="ig__item" href="' + esc(pp.url) + '" target="_blank" rel="noopener" aria-label="' + esc(pp.caption || 'Instagram gönderisi') + '"><img loading="lazy" src="' + esc(CDN + 'img/instagram/' + pp.image) + '" alt="' + esc(pp.caption || '') + '">' + (pp.video ? '<span class="ig__video"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' : '') + '<span class="ig__hover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg></span></a>'; }).join('');
        $$('.ig__item', ig).forEach(function (a) { a.addEventListener('click', function () { track('instagram_tikla', { gonderi: a.href }); }); });
      }).catch(function () { ig.parentNode.parentNode.style.display = 'none'; });
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
    var filt = { brand: [], cat: [], mat: [], fam: [], feat: [], size: [], shape: [], rim: [] };
    var sort = 'default';
    // URL parametreleri: ?shape=round,square&rim=full&cat=Optik (yüz şekli rehberi vb.)
    (function () { var qs = location.search.replace(/^\?/, '').split('&'); qs.forEach(function (kv) { var i = kv.indexOf('='); if (i < 0) return; var k = kv.slice(0, i), v = decodeURIComponent(kv.slice(i + 1)); if (filt[k] && v) filt[k] = v.split(',').filter(Boolean); }); })();
    var initial = (LABEL || '').trim();
    var q = (QUERY || '').trim();
    var favParam = (location.search.match(/[?&]fav=([^&]*)/) || [])[1]; favParam = favParam ? decodeURIComponent(favParam) : ''; var favList = null;
    var head = $('#coll-title'), lead = $('#coll-lead'), logoEl = $('#coll-logo'), count = $('#coll-count');
    if (slug(initial) === 'blog') { initBlogList(); return; }
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
      else if (favParam) {
        var codes = favParam === '1' ? favGet() : favParam.split(',');
        favList = codes; head.textContent = favParam === '1' ? 'Favorilerim' : 'Paylaşılan liste'; var fn = codes.length;
        lead.innerHTML = (fn ? fn + ' model' : 'Henüz favori yok. Kartlardaki kalp simgesiyle model ekleyin.') + (fn ? ' · <a class="fav-share" href="#" data-act="share">Listeyi paylaş</a> · <a class="fav-wa" href="https://wa.me/' + esc(CFG.whatsapp || '') + '?text=' + encodeURIComponent('Merhaba, şu modeller hakkında bilgi almak istiyorum: ' + codes.join(', ')) + '" target="_blank" rel="noopener">WhatsApp\'tan sor</a>' : '');
        var shareA = $('[data-act=share]', lead); if (shareA) shareA.addEventListener('click', function (e) { e.preventDefault(); var url = location.origin + '/search?fav=' + codes.join(','); track('favori_paylas', { adet: fn }); if (navigator.share) navigator.share({ title: 'Arıkan Optik · gözlük listem', url: url }).catch(function () { }); else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { shareA.textContent = 'Bağlantı kopyalandı'; }); });
        if (!fn) { buildFilters(ms); $('#coll-grid').innerHTML = ''; count.textContent = '0 model'; return; }
      }
      else if (q) { head.textContent = '"' + q + '" için sonuçlar'; var exact = findExact(q); if (exact && state.posts[exact.code]) { location.replace(state.posts[exact.code] + variantHash(q, exact)); return; } var list0 = searchModels(q); if (lastSearch && lastSearch.chips.length) lead.innerHTML = '<span class="qlead">Anladığımız:</span> ' + chipHtml(lastSearch.chips) + (lastSearch.relaxed === 'all' ? '<br><small class="qnote">Bu ifadeyi eşleştiremedik; tüm modeller listeleniyor. Model kodu ya da "mavi clip-on", "yuvarlak titanyum" gibi bir ifade deneyin.</small>' : lastSearch.relaxed ? '<br><small class="qnote">Tüm ölçütlere uyan model yok; en yakın sonuçlar listeleniyor.</small>' : ''); else if (lastSearch && lastSearch.relaxed === 'all') lead.innerHTML = '<small class="qnote">"' + esc(q) + '" ifadesini eşleştiremedik; tüm modeller listeleniyor. Model kodu ya da "mavi clip-on", "yuvarlak titanyum" gibi bir ifade deneyin.</small>'; }
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
        group('Çerçeve şekli', 'shape', AST.shapes.map(function (x) { return { v: x[0], l: x[1], n: ms.filter(function (m) { return m.shape === x[0]; }).length }; }).filter(function (x) { return x.n; }), function (it) { return '<i class="fshape">' + ico(SHAPE_ICON, it.v) + '</i>'; }) +
        group('Çerçeve yapısı', 'rim', [['full', 'Tam çerçeve'], ['half', 'Yarım çerçeve'], ['rimless', 'Çerçevesiz']].map(function (x) { return { v: x[0], l: x[1], n: ms.filter(function (m) { return (m.rim || 'full') === x[0]; }).length }; }).filter(function (x) { return x.n; })) +
        group('Çerçeve malzemesi', 'mat', Object.keys(cm).sort(function (a, b) { return cm[b] - cm[a]; }).map(function (k) { return { v: k, l: matLabel[k], n: cm[k] }; })) +
        group('Renk', 'fam', FAMILIES.map(function (fa) { return { v: fa[0], l: fa[0], n: cf[fa[0]] || 0 }; }).filter(function (x) { return x.n; }), function (it) { return '<i class="sw" style="background:' + hexOf(it.v.split('/')[0]) + '"></i>'; }) +
        group('Özellik', 'feat', feats.map(function (x) { return { v: x[0], l: x[1], n: x[2] }; }));
      f.addEventListener('change', function (e) {
        var t = e.target; if (t.type !== 'checkbox') return;
        var k = t.getAttribute('data-k'), arr = filt[k], i = arr.indexOf(t.value);
        if (t.checked && i < 0) arr.push(t.value); if (!t.checked && i >= 0) arr.splice(i, 1);
        if (t.checked) track('filtre', { grup: k, deger: t.value });
        apply();
      });
      $('#f-clear').addEventListener('click', function () { Object.keys(filt).forEach(function (k) { filt[k] = []; }); $$('input[type=checkbox]', f).forEach(function (c) { c.checked = false; }); apply(); });
      $('.filters__close', f).addEventListener('click', function () { f.classList.remove('open'); });
      var tg = $('.filters-toggle'); if (tg) tg.addEventListener('click', function () { f.classList.add('open'); });
      var so = $('#sort'); if (so) so.addEventListener('change', function () { sort = so.value; apply(); });
    }
    function apply() {
      var ms = state.models.filter(function (m) {
        if (favList && favList.indexOf(m.code) < 0) return false;
        if (q && searchModels(q).indexOf(m) < 0) return false;
        if (filt.brand.length && filt.brand.indexOf(m.brand_slug) < 0) return false;
        if (filt.cat.length && filt.cat.indexOf(m.category) < 0) return false;
        if (filt.mat.length && filt.mat.indexOf(slug(frameMaterial(m))) < 0) return false;
        if (filt.fam.length) { var fam = familiesOf(m); if (!filt.fam.some(function (x) { return fam.indexOf(x) >= 0; })) return false; }
        if (filt.size.length && !filt.size.some(function (s) { var r = s.split('-'); return m.lens >= +r[0] && m.lens <= +r[1]; })) return false;
        if (filt.shape.length && filt.shape.indexOf(m.shape) < 0) return false;
        if (filt.rim.length && filt.rim.indexOf(m.rim || 'full') < 0) return false;
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
      var labelOf = { brand: function (v) { return (BRANDS[v] || { name: v }).name; }, cat: function (v) { return v; }, mat: function (v) { return v; }, fam: function (v) { return v; }, size: function (v) { return v.replace('-99', '+').replace('-', '–') + ' mm'; }, shape: shapeLabel, rim: rimLabel, feat: function (v) { return { new: 'Yeni', polar: 'Polarize', antifar: 'Anti-Far', titan: 'Titanyum' }[v]; } };
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
        if (initDone) track('renk_sec', { model: code, renk: btn.getAttribute('data-code') || btn.textContent.trim() });
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
    $$('a[href^="https://wa.me/?text="]').forEach(function (a) { a.href = 'https://wa.me/?text=' + encodeURIComponent(document.title.split(' – ')[0] + ' ' + location.href.split('#')[0]); });
    var ctaBox = $('.model .cta'); if (ctaBox && !$('[data-fav]', ctaBox)) { ctaBox.insertAdjacentHTML('beforeend', favBtn(code, true)); favSync(); }
    // eylem düğmeleri: ikonlar + düzen (kırmızı birincil üstte tam genişlik, altta eşit üç ikincil)
    if (ctaBox) {
      var ICO = { pin: '<svg viewBox="0 0 24 24"><path d="M12 22s7-6.6 7-12a7 7 0 0 0-14 0c0 5.4 7 12 7 12zm0-9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>',
        wa: '<svg viewBox="0 0 24 24"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4zM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zm0-21.6A11.8 11.8 0 0 0 2 18.2L.3 24l6-1.6A11.8 11.8 0 1 0 12 .2z"/></svg>' };
      $$('a[href*="noktalar"]', ctaBox).forEach(function (a) { if (!$('svg', a)) a.insertAdjacentHTML('afterbegin', ICO.pin); a.classList.add('cta__main'); });
      $$('a[href*="wa.me"]', ctaBox).forEach(function (a) { if (!$('svg', a)) a.insertAdjacentHTML('afterbegin', ICO.wa); });
      ctaBox.classList.add('cta--grid');
    }
    var sh = $('[data-share]'); if (sh) sh.addEventListener('click', function (e) { e.preventDefault(); if (navigator.share) navigator.share({ title: document.title, url: location.href }); else { navigator.clipboard && navigator.clipboard.writeText(location.href); sh.textContent = 'Bağlantı kopyalandı'; } });
    // ilgili modeller + breadcrumb
    ready().then(function () {
      var me = state.models.filter(function (m) { return m.code === code; })[0];
      $$('.model .cta a[href*="noktalar"]').forEach(function (a) { a.href = a.getAttribute('href').split('?')[0] + '?model=' + encodeURIComponent(code); });
      if (me) { track('model_goruntule', modelParams(me)); if (/[?&]qr=1/.test(location.search) || /[?&]qr=1/.test(document.referrer)) track('qr_okutma', modelParams(me)); }
      // clip-on modellerde optik / clip-on karşılaştırma kaydırıcısı
      var cmpSec = $('#model-cmp');
      if (cmpSec && me && me.category === 'Clip-On') {
        var el = $('.cmp', cmpSec);
        el.setAttribute('data-left', CDN + 'img/cmp/' + me.code + '-optik.jpg'); el.setAttribute('data-right', CDN + 'img/cmp/' + me.code + '-clipon.jpg');
        el.setAttribute('data-left-sub', 'Numaralı cam · ' + (me.variants[0] ? me.variants[0].code : '')); el.setAttribute('data-right-sub', isPolar(me) ? 'Mıknatıslı polarize güneş camı' : 'Mıknatıslı güneş camı');
        cmpSec.style.display = ''; initCompare();
      }
      var rel = $('#related-grid'); if (!rel) return;
      if (!me) { rel.parentNode.style.display = 'none'; return; }
      var pool = state.models.filter(function (m) { return m.code !== me.code && m.brand_slug === me.brand_slug; });
      pool.sort(function (a, b) { var da = Math.abs((a.lens || 0) - (me.lens || 0)) + (a.category === me.category ? 0 : 3); var db = Math.abs((b.lens || 0) - (me.lens || 0)) + (b.category === me.category ? 0 : 3); return da - db; });
      renderGrid(rel, pool.slice(0, 4));
    });
  }

  /* ---------- blog ---------- */
  function blogFeed() {
    return i18nReady().then(function () { return blogFeedRaw(); });
  }
  function blogFeedRaw() {
    try { var c = sessionStorage.getItem('ao_blog_v2'); if (c) return Promise.resolve(JSON.parse(c)); } catch (e) { }
    return fetchJSON('/feeds/posts/default/-/Blog?alt=json&max-results=50').then(function (d) {
      var list = ((d.feed && d.feed.entry) || []).map(function (e) {
        var link = (e.link || []).filter(function (l) { return l.rel === 'alternate'; })[0];
        var html = (e.content && e.content.$t) || (e.summary && e.summary.$t) || '';
        var im = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        var th = im ? im[1] : (e.media$thumbnail ? e.media$thumbnail.url.replace(/\/s72-c\//, '/s800/') : '');
        var tmp = document.createElement('div'); tmp.innerHTML = html;
        var lead = tmp.querySelector('.article__lead, p');
        var txt = (lead ? lead.textContent : tmp.textContent || '').replace(/\s+/g, ' ').trim();
        var d2 = new Date(e.published.$t);
        return { title: e.title.$t, url: link ? link.href : '#', img: th, date: d2.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }), sum: txt.slice(0, 160), labels: (e.category || []).map(function (c) { return c.term; }) };
      });
      try { sessionStorage.setItem('ao_blog_v2', JSON.stringify(list)); } catch (e) { }
      return list;
    });
  }
  function bcard(p) {
    var en = enArticle(p.title), title = en ? en.title : p.title, sum = en ? en.summary : p.sum;
    return '<a class="bcard" href="' + esc(p.url) + '">' + (p.img ? '<div class="bcard__img"><img loading="lazy" src="' + esc(p.img) + '" alt=""></div>' : '') +
      '<div class="bcard__body"><div class="bcard__date">' + esc(p.date) + '</div><div class="bcard__title">' + esc(title) + '</div><div class="bcard__sum">' + esc(sum) + (!en && p.sum.length >= 160 ? '…' : '') + '</div></div></a>';
  }
  function renderBlog(el, list) { el.classList.remove('skeleton'); el.innerHTML = list.length ? '<div class="blog-grid">' + list.map(bcard).join('') + '</div>' : '<div class="empty"><b>Henüz yazı yok</b></div>'; }
  function initBlogList() {
    var head = $('#coll-title'); if (head) head.textContent = 'Blog';
    document.title = 'Blog · Gözlük Rehberi · ' + document.title.split(' · ').pop();
    var eb = $('.coll-head .eyebrow'); if (eb) eb.textContent = 'Yazılar';
    var lead = $('#coll-lead'); if (lead) lead.textContent = 'Gözlük seçimi, cam teknolojileri ve bakım üzerine optisyen gözüyle yazılar.';
    $('#collection').style.display = 'none'; $('#blog-list').style.display = '';
    blogFeed().then(function (list) { var c = $('#coll-count'); if (c) c.textContent = list.length + ' yazı'; renderBlog($('#blog-grid'), list); }).catch(function () { renderBlog($('#blog-grid'), []); });
  }
  function initArticle() {
    var art = $('.article'); if (!art) return;
    var t = $('.article__title'); if (t) document.title = t.textContent.trim() + ' · Blog · ' + document.title.split(' · ').pop();
    var dt = $('.article__date'); if (dt) { var m = dt.textContent.trim().match(/^(\S+)\s+(\d+),\s*(\d{4})$/); if (m) dt.textContent = m[2] + ' ' + m[1].charAt(0) + m[1].slice(1).toLowerCase() + ' ' + m[3]; }
    // Blogger küçük resim kapak görselini kaldırmaz; gövdedeki kapak zaten var
    blogFeed().then(function (list) {
      var rel = $('#blog-related'); if (!rel) return;
      var cur = location.pathname;
      renderBlog(rel, list.filter(function (p) { return p.url.indexOf(cur) < 0; }).slice(0, 3));
    });
  }

  /* ---------- yetkili satış noktaları: Türkiye haritası ---------- */
  function trNorm(s) { return String(s || '').replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase().replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/â/g, 'a'); }
  function initDealers() {
    var h1 = $('.page h1'); var pageIn = $('.page__in');
    if (!h1 || !pageIn || trNorm(h1.textContent).indexOf('satis noktalar') < 0) return;
    var qs = {}; location.search.replace(/^\?/, '').split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) qs[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1)); });
    var modelCtx = (qs.model || '').toUpperCase();
    var app = document.createElement('div'); app.className = 'dealers-app';
    app.innerHTML = (modelCtx ? '<div class="dealers-ctx" id="dealer-ctx"></div>' : '') +
      '<p class="lead">Lee Cooper, Quantum, Slazenger ve Belmond gözlükleri yetkili optik mağazalarında satılır. Haritadan ilinizi seçin, il adını yazın ya da konumunuzu kullanın.</p>' +
      '<div class="dealers-search"><input id="dealer-q" type="search" placeholder="İl ara: Tekirdağ, İstanbul, İzmir…" autocomplete="off" aria-label="İl ara"><button class="btn btn--red" id="dealer-go" type="button">Ara</button><button class="btn btn--ghost" id="dealer-near" type="button"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/></svg> Yakınımdakiler</button><div class="dealers-suggest" id="dealer-suggest"></div></div>' +
      '<div class="dealers-map" id="dealer-map"><div class="skeleton">Harita yükleniyor</div></div>' +
      '<div class="dealers-legend"><span><i class="sw" style="background:#DC2626"></i> Yetkili satış noktası olan iller</span><span><i class="sw" style="background:#E5E7EB"></i> Henüz eklenmedi</span></div>' +
      '<div class="dealers-result" id="dealer-result"></div><p class="dealers-demo" id="dealer-demo"></p>';
    Array.prototype.slice.call(pageIn.children).forEach(function (el) { if (el !== h1) pageIn.removeChild(el); });
    pageIn.appendChild(app);
    if (modelCtx) ready().then(function () { var m = modelByCode(modelCtx), box = $('#dealer-ctx'); if (m && box) { box.innerHTML = '<img src="' + esc(frontOf(m)) + '" alt=""><div><p class="eyebrow">Aradığınız model</p><b>' + esc(brandInfo(m).name + ' ' + m.code) + '</b><small>' + esc(catLabel(m)) + ' · ' + esc(dimStr(m)) + ' mm · ' + m.variants.length + ' renk · <a href="' + esc(postUrl(m)) + '">modele dön</a></small></div>'; } else if (box) box.style.display = 'none'; });
    Promise.all([fetchJSON(dataUrl('tr-map.json')), fetchJSON(dataUrl('dealers.json'))]).then(function (r) {
      var cities = r[0].cities, dealers = (r[1] && r[1].dealers) || {};
      if (r[1] && r[1].demo && r[1].demo_note) $('#dealer-demo').textContent = r[1].demo_note;
      var byNorm = {}; cities.forEach(function (c) { byNorm[trNorm(c.n)] = c; });
      var has = function (c) { return (dealers[c.n] || []).length > 0; };
      var mapEl = $('#dealer-map');
      mapEl.innerHTML = '<svg viewBox="' + r[0].viewBox + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Türkiye il haritası">' +
        cities.map(function (c) { return '<path class="prov' + (has(c) ? ' has' : '') + '" data-id="' + c.id + '" d="' + c.d + '"><title>' + esc(c.n) + (has(c) ? ' · ' + dealers[c.n].length + ' satış noktası' : '') + '</title></path>'; }).join('') + '</svg><div class="dealers-tip" id="dealer-tip"></div>';
      var tip = $('#dealer-tip');
      var byId = {}; cities.forEach(function (c) { byId[c.id] = c; });
      $$('path.prov', mapEl).forEach(function (pth) {
        pth.addEventListener('click', function () { show(byId[pth.getAttribute('data-id')]); });
        pth.addEventListener('mousemove', function (e) { var c = byId[pth.getAttribute('data-id')]; tip.textContent = c.n + (has(c) ? ' · ' + dealers[c.n].length + ' satış noktası' : ''); var b = mapEl.getBoundingClientRect(); tip.style.left = (e.clientX - b.left + 14) + 'px'; tip.style.top = (e.clientY - b.top - 10) + 'px'; tip.style.display = 'block'; });
        pth.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
      });
      function dist(a, b, c, d) { var R = 6371, dLat = (c - a) * Math.PI / 180, dLon = (d - b) * Math.PI / 180, x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a * Math.PI / 180) * Math.cos(c * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2); return 2 * R * Math.asin(Math.sqrt(x)); }
      function embed(d) { return 'https://maps.google.com/maps?q=' + d.lat + ',' + d.lng + '&z=15&hl=tr&output=embed'; }
      function card(d, c, i, extra) {
        var q = encodeURIComponent(d.name + ' ' + (d.district || '') + ' ' + c.n);
        var dir = d.lat ? 'https://www.google.com/maps/dir/?api=1&destination=' + d.lat + ',' + d.lng + (d.place_id ? '&destination_place_id=' + d.place_id : '') : null;
        var waText = modelCtx ? '?text=' + encodeURIComponent('Merhaba, ' + modelCtx + ' modeli mağazanızda var mı?') : '';
        return '<div class="dealer' + (d.lat ? ' dealer--geo' : '') + '" data-i="' + i + '"><div class="dealer__name">' + esc(d.name) + (extra ? '<span class="dealer__dist">' + extra + '</span>' : '') + '</div><div class="dealer__district">' + esc(d.district || '') + ' · ' + esc(c.n) + '</div>' +
          '<div class="dealer__row">' + esc(d.address || '') + '</div>' +
          (d.hours ? '<div class="dealer__row dealer__hours">' + esc(d.hours) + '</div>' : '') +
          (d.brands ? '<div class="dealer__brands">' + d.brands.map(function (b) { return '<span class="badge badge--line">' + esc(b) + '</span>'; }).join('') + '</div>' : '') +
          '<div class="dealer__actions">' + (d.phone ? '<a class="btn btn--dark" href="tel:' + esc(d.phone.replace(/\s/g, '')) + '">Hemen ara</a>' : '') +
          (d.whatsapp ? '<a class="btn btn--ghost" href="https://wa.me/' + esc(d.whatsapp) + waText + '" target="_blank" rel="noopener">WhatsApp</a>' : '') +
          (dir ? '<a class="btn btn--ghost" href="' + dir + '" target="_blank" rel="noopener">Yol tarifi</a>' : '<a class="btn btn--ghost" href="' + (d.maps || 'https://www.google.com/maps/search/?api=1&query=' + q) + '" target="_blank" rel="noopener">Haritada aç</a>') +
          (d.lat ? '<button class="btn btn--ghost dealer__show" type="button" data-show="' + i + '">Haritada göster</button>' : '') + '</div></div>';
      }
      function bindCards(res, list, c) {
        var frame = $('#dealer-frame', res), label = $('#dealer-frame-label', res);
        function pickMap(i) { var d = list[i]; if (!d || !d.lat || !frame) return; frame.src = embed(d); if (label) label.textContent = d.name + ' · ' + (d.district || c.n); $$('.dealer', res).forEach(function (x) { x.classList.toggle('active', +x.getAttribute('data-i') === i); }); }
        $$('[data-show]', res).forEach(function (b) { b.addEventListener('click', function () { pickMap(+b.getAttribute('data-show')); track('bayi_harita', { il: c.n, bayi: list[+b.getAttribute('data-show')].name }); if (window.innerWidth < 900 && frame) frame.scrollIntoView({ behavior: 'smooth', block: 'center' }); }); });
        $$('a[href^="tel:"]', res).forEach(function (a) { a.addEventListener('click', function () { track('bayi_ara', { il: c.n, bayi: a.closest('.dealer').querySelector('.dealer__name').textContent }); }); });
        var first = list.map(function (d, i) { return d.lat ? i : -1; }).filter(function (i) { return i >= 0; })[0]; if (first != null) pickMap(first);
      }
      function show(c, opts) {
        if (!c) return; opts = opts || {}; track('bayi_il', { il: c.n });
        $$('path.prov.active', mapEl).forEach(function (x) { x.classList.remove('active'); });
        var pth = $('path.prov[data-id="' + c.id + '"]', mapEl); if (pth) { pth.classList.add('active'); pth.parentNode.appendChild(pth); }
        var all = dealers[c.n] || [], districts = [];
        all.forEach(function (d) { if (d.district && districts.indexOf(d.district) < 0) districts.push(d.district); });
        var dsel = opts.district || '';
        var list = dsel ? all.filter(function (d) { return d.district === dsel; }) : all;
        var res = $('#dealer-result');
        var html = '<div class="dealers-head"><p class="eyebrow">' + esc(c.p) + ' · Yetkili satış noktaları</p><h2 class="title-2">' + esc(c.n) + '</h2><p class="lead">' + (all.length ? all.length + ' satış noktası' + (modelCtx ? ' · ' + esc(modelCtx) + ' için mağazayı arayıp stok sorabilirsiniz' : '') : 'Bu ilde henüz listelenmiş yetkili satış noktası yok.') + '</p>' +
          (districts.length > 1 ? '<div class="dealers-districts"><button class="chip' + (!dsel ? ' on' : '') + '" data-d="">Tümü (' + all.length + ')</button>' + districts.map(function (x) { return '<button class="chip' + (dsel === x ? ' on' : '') + '" data-d="' + esc(x) + '">' + esc(x) + ' (' + all.filter(function (d) { return d.district === x; }).length + ')</button>'; }).join('') + '</div>' : '') + '</div>';
        var geo = list.some(function (d) { return d.lat; });
        if (list.length) {
          html += '<div class="dealers-body' + (geo ? ' dealers-body--map' : '') + '"><div class="dealer-grid">' + list.map(function (d, i) { return card(d, c, i); }).join('') + '</div>' +
            (geo ? '<div class="dealers-frame"><div class="dealers-frame__in"><iframe id="dealer-frame" title="Harita" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe><p class="dealers-frame__label" id="dealer-frame-label"></p></div></div>' : '') + '</div>';
        } else {
          html += '<p class="dealer-empty">Size en yakın satış noktasını öğrenmek için <a href="https://wa.me/' + esc(CFG.whatsapp || '') + '" target="_blank" rel="noopener">WhatsApp\'tan yazın</a>.</p>';
        }
        res.innerHTML = html;
        $$('.dealers-districts .chip', res).forEach(function (b) { b.addEventListener('click', function () { show(c, { district: b.getAttribute('data-d'), keep: true }); }); });
        bindCards(res, list, c);
        if (!opts.keep) { res.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', location.pathname + location.search + '#' + c.id); }
      }
      // yakınımdakiler
      $('#dealer-near').addEventListener('click', function () {
        var btn = this; if (!navigator.geolocation) { alert('Tarayıcınız konum desteklemiyor.'); return; }
        btn.disabled = true; btn.textContent = 'Konum alınıyor…';
        navigator.geolocation.getCurrentPosition(function (pos) {
          btn.disabled = false; btn.innerHTML = 'Yakınımdakiler';
          var la = pos.coords.latitude, ln = pos.coords.longitude, found = [];
          Object.keys(dealers).forEach(function (cn) { dealers[cn].forEach(function (d) { if (d.lat) found.push({ d: d, cn: cn, km: dist(la, ln, d.lat, d.lng) }); }); });
          found.sort(function (a, b) { return a.km - b.km; }); found = found.slice(0, 6);
          track('bayi_yakin', { il: found[0] ? found[0].cn : '' });
          var res = $('#dealer-result');
          if (!found.length) { res.innerHTML = '<p class="dealer-empty">Konum bilgisi olan satış noktası bulunamadı.</p>'; return; }
          var c = byNorm[trNorm(found[0].cn)];
          res.innerHTML = '<div class="dealers-head"><p class="eyebrow">Konumunuza göre</p><h2 class="title-2">En yakın satış noktaları</h2><p class="lead">Mesafeler kuş uçuşudur.</p></div><div class="dealers-body dealers-body--map"><div class="dealer-grid">' +
            found.map(function (f, i) { return card(f.d, byNorm[trNorm(f.cn)] || { n: f.cn, p: '' }, i, (f.km < 10 ? f.km.toFixed(1) : Math.round(f.km)) + ' km'); }).join('') + '</div><div class="dealers-frame"><div class="dealers-frame__in"><iframe id="dealer-frame" title="Harita" loading="lazy" allowfullscreen></iframe><p class="dealers-frame__label" id="dealer-frame-label"></p></div></div></div>';
          bindCards(res, found.map(function (f) { return f.d; }), c || { n: found[0].cn });
          res.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, function () { btn.disabled = false; btn.innerHTML = 'Yakınımdakiler'; alert('Konum alınamadı. İl adını yazarak arayabilirsiniz.'); }, { timeout: 8000 });
      });
      // arama
      var q = $('#dealer-q'), sug = $('#dealer-suggest');
      function find(v) { var n = trNorm(v).trim(); if (!n) return null; return byNorm[n] || cities.filter(function (c) { return trNorm(c.n).indexOf(n) === 0; })[0] || cities.filter(function (c) { return trNorm(c.n).indexOf(n) >= 0; })[0]; }
      q.addEventListener('input', function () {
        var n = trNorm(q.value).trim(); if (!n) { sug.classList.remove('open'); return; }
        var hits = cities.filter(function (c) { return trNorm(c.n).indexOf(n) >= 0; }).sort(function (a, b) { return a.n.localeCompare(b.n, 'tr'); }).slice(0, 8);
        if (!hits.length) { sug.classList.remove('open'); return; }
        sug.innerHTML = hits.map(function (c) { return '<button type="button" data-id="' + c.id + '"><b>' + esc(c.n) + '</b><small>' + (has(c) ? dealers[c.n].length + ' satış noktası' : 'henüz eklenmedi') + '</small></button>'; }).join('');
        sug.classList.add('open');
        $$('button', sug).forEach(function (b) { b.addEventListener('click', function () { var c = byId[b.getAttribute('data-id')]; q.value = c.n; sug.classList.remove('open'); show(c); }); });
      });
      var go = function () { var c = find(q.value); sug.classList.remove('open'); if (c) { q.value = c.n; show(c); } };
      $('#dealer-go').addEventListener('click', go);
      q.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      document.addEventListener('click', function (e) { if (!sug.parentNode.contains(e.target)) sug.classList.remove('open'); });
      var start = byId[location.hash.replace('#', '')] || cities.filter(has)[0];
      if (start) { show(start, { keep: true }); }
    }).catch(function () { $('#dealer-map').innerHTML = '<div class="empty">Harita yüklenemedi.</div>'; });
  }

  /* ---------- karşılaştırma kaydırıcısı ---------- */
  function initCompare() {
    $$('.cmp[data-left][data-right]').forEach(function (el) {
      var L = el.getAttribute('data-left'), R = el.getAttribute('data-right');
      if (!L || !R || el.getAttribute('data-ready')) return; el.setAttribute('data-ready', '1');
      var ll = el.getAttribute('data-left-label') || 'Optik', rl = el.getAttribute('data-right-label') || 'Clip-On';
      var ls = el.getAttribute('data-left-sub') || '', rs = el.getAttribute('data-right-sub') || '';
      var pos = parseFloat(el.getAttribute('data-start') || '50');
      el.innerHTML = '<div class="cmp__stage"><img src="' + esc(L) + '" alt="' + esc(ll) + '" draggable="false"><div class="cmp__right"><img src="' + esc(R) + '" alt="' + esc(rl) + '" draggable="false"></div><div class="cmp__bar"></div><div class="cmp__handle" role="slider" tabindex="0" aria-label="Karşılaştırma" aria-valuemin="0" aria-valuemax="100"></div></div>';
      var labels = document.createElement('div'); labels.className = 'cmp__labels';
      labels.innerHTML = '<div class="cmp__label">' + esc(ll) + (ls ? '<small>' + esc(ls) + '</small>' : '') + '</div><div class="cmp__label cmp__label--r">' + esc(rl) + (rs ? '<small>' + esc(rs) + '</small>' : '') + '</div>';
      el.parentNode.insertBefore(labels, el.nextSibling);
      var stage = $('.cmp__stage', el), right = $('.cmp__right', el), bar = $('.cmp__bar', el), handle = $('.cmp__handle', el);
      function set(p) { pos = Math.max(0, Math.min(100, p)); right.style.clipPath = 'inset(0 0 0 ' + pos + '%)'; bar.style.left = pos + '%'; handle.style.left = pos + '%'; handle.setAttribute('aria-valuenow', Math.round(pos)); }
      function fromEvent(e) { var b = stage.getBoundingClientRect(); var x = (e.touches ? e.touches[0].clientX : e.clientX) - b.left; set(x / b.width * 100); }
      var drag = false;
      var used = false;
      el.addEventListener('pointerdown', function (e) { if (!used) { used = true; var art = $('.model'); track('clipon_kaydir', { model: art ? art.getAttribute('data-code') : 'demo' }); } drag = true; el.setPointerCapture && el.setPointerCapture(e.pointerId); fromEvent(e); });
      el.addEventListener('pointermove', function (e) { if (drag) fromEvent(e); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { el.addEventListener(t, function () { drag = false; }); });
      handle.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') { set(pos - 3); e.preventDefault(); } if (e.key === 'ArrowRight') { set(pos + 3); e.preventDefault(); } });
      set(pos);
      // ilk açılışta kısa bir "göz kırpma" animasyonu
      var t0 = null; function anim(ts) { if (!t0) t0 = ts; var k = (ts - t0) / 1400; if (k >= 1 || drag) { if (!drag) set(50); return; } set(50 + Math.sin(k * Math.PI * 2) * 14); requestAnimationFrame(anim); }
      setTimeout(function () { requestAnimationFrame(anim); }, 600);
    });
  }


  /* ---------- QR etiket üretici (bayiler için) ---------- */
  function loadScript(src) { return new Promise(function (res, rej) { var sc = document.createElement('script'); sc.src = src; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); }); }
  function initQr() {
    var root = $('#qr-tool'); if (!root) return;
    root.innerHTML = '<div class="skeleton">Yükleniyor</div>';
    Promise.all([ready(), loadScript('https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js')]).then(function () {
      root.classList.remove('skeleton');
      var sel = {}, f = { brand: 'all', cat: 'all' }, size = 'm';
      var origin = location.origin;
      function qrSvg(url) { var q = window.qrcode(0, 'M'); q.addData(url); q.make(); return q.createSvgTag({ cellSize: 2, margin: 0, scalable: true }); }
      function label(m, forPrint) {
        var b = brandInfo(m), url = origin + '/search?q=' + encodeURIComponent(m.code);
        return '<div class="qrl' + (!forPrint && sel[m.code] ? ' on' : '') + '" data-code="' + esc(m.code) + '">' +
          (!forPrint ? '<span class="qrl__check"></span>' : '') +
          '<div class="qrl__l"><img src="' + esc(b.logo) + '" alt="' + esc(b.name) + '"><b>' + esc(m.code) + '</b><small>' + esc(m.category === 'Clip-On' ? 'Clip-On' : 'Optik') + ' · ' + esc(dimStr(m)) + '</small><em>Tüm renkler için okutun</em></div>' +
          '<div class="qrl__q">' + qrSvg(url) + '</div><span class="qrl__site">' + esc(location.host) + '</span></div>';
      }
      function list() { return state.models.filter(function (m) { return (f.brand === 'all' || m.brand_slug === f.brand) && (f.cat === 'all' || m.category === f.cat); }); }
      function count() { return Object.keys(sel).filter(function (k) { return sel[k]; }).length; }
      function render() {
        var ms = list();
        root.innerHTML = '<div class="qr-bar">' +
          '<div class="qr-bar__g"><span>Marka</span>' + [['all', 'Tümü']].concat(BRAND_ORDER.map(function (b) { return [b, (BRANDS[b] || {}).name || b]; })).map(function (x) { return '<button class="chip' + (f.brand === x[0] ? ' on' : '') + '" data-k="brand" data-v="' + x[0] + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>' +
          '<div class="qr-bar__g"><span>Tür</span>' + [['all', 'Tümü'], ['Optik', 'Optik'], ['Clip-On', 'Clip-On']].map(function (x) { return '<button class="chip' + (f.cat === x[0] ? ' on' : '') + '" data-k="cat" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
          '<div class="qr-bar__g"><span>Boyut</span><button class="chip' + (size === 'm' ? ' on' : '') + '" data-k="size" data-v="m">50 × 30 mm</button><button class="chip' + (size === 'l' ? ' on' : '') + '" data-k="size" data-v="l">70 × 42 mm</button></div>' +
          '<div class="qr-bar__g qr-bar__act"><button class="btn btn--ghost" data-act="all">Listedekileri seç</button><button class="btn btn--ghost" data-act="none">Temizle</button><button class="btn btn--red" data-act="print">Yazdır <b class="qr-n">' + count() + '</b></button></div></div>' +
          '<p class="qr-hint">' + ms.length + ' model listeleniyor · ' + count() + ' etiket seçili. Etikete tıklayarak seçin.</p>' +
          '<div class="qr-grid">' + ms.map(function (m) { return label(m, false); }).join('') + '</div>';
        $$('.chip', root).forEach(function (c) { c.addEventListener('click', function () { var k = c.getAttribute('data-k'), v = c.getAttribute('data-v'); if (k === 'size') size = v; else f[k] = v; render(); }); });
        $$('.qrl', root).forEach(function (l) { l.addEventListener('click', function () { var c = l.getAttribute('data-code'); sel[c] = !sel[c]; l.classList.toggle('on', sel[c]); $('.qr-n', root).textContent = count(); $('.qr-hint', root).textContent = ms.length + ' model listeleniyor · ' + count() + ' etiket seçili. Etikete tıklayarak seçin.'; }); });
        $('[data-act=all]', root).addEventListener('click', function () { ms.forEach(function (m) { sel[m.code] = true; }); render(); });
        $('[data-act=none]', root).addEventListener('click', function () { sel = {}; render(); });
        $('[data-act=print]', root).addEventListener('click', doPrint);
      }
      function doPrint() {
        var chosen = state.models.filter(function (m) { return sel[m.code]; });
        if (!chosen.length) { alert('Önce yazdırılacak etiketleri seçin.'); return; }
        var old = $('#qr-print'); if (old) old.parentNode.removeChild(old);
        var pr = document.createElement('div'); pr.id = 'qr-print'; pr.className = 'qr-print qr-print--' + size;
        var per = size === 'l' ? 12 : 36, pages = [];
        for (var i = 0; i < chosen.length; i += per) pages.push(chosen.slice(i, i + per));
        pr.innerHTML = pages.map(function (pg) { return '<div class="qr-page">' + pg.map(function (m) { return label(m, true); }).join('') + '</div>'; }).join('');
        document.body.appendChild(pr);
        track('qr_yazdir', { adet: chosen.length, boyut: size });
        setTimeout(function () { window.print(); }, 300);
      }
      render();
    }).catch(function () { root.innerHTML = '<div class="empty"><b>Etiket aracı yüklenemedi</b>Sayfayı yenileyip tekrar deneyin.</div>'; });
  }

/* {{TRYON}} */

/* {{ORDER}} */

/* {{ASSISTANT}} */

  /* ---------- başlat ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    initI18n();
    initHeader();
    initCompare();
    initAssistant();
    orderBadge(); favSync();
    if (VIEW === 'home') initHome();
    else if (VIEW === 'collection') initCollection();
    else if (VIEW === 'post') { initModel(); initArticle(); initOrderButton(); initTryOn(); }
    else if (VIEW === 'error') initCollection();
    else if (VIEW === 'page') { initDealers(); initQr(); initOrder(); initSizeTool(); }
  });
  window.AO = { tryon: TRYON, search: function (q) { return searchModels(q).map(function (m) { return m.code; }); }, parse: parseQuery, last: function () { return lastSearch; }, ready: ready };
})();

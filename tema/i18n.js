  /* ---------- çok dillilik: TR (varsayılan) / EN ---------- */
  var LANG = (function () {
    var m = location.search.match(/[?&]lang=(tr|en)\b/), l = m ? m[1] : null;
    if (l) { try { localStorage.setItem('ao_lang', l); } catch (e) { } }
    else { try { l = localStorage.getItem('ao_lang'); } catch (e) { } }
    return l === 'en' ? 'en' : 'tr';
  })();
  var I18N = { dict: {}, pages: {}, articles: {}, loaded: null, cache: {} };
  // veri düzeltmeleri (her iki dilde): katalog OCR'ından kalan bozuk kelimeler
  var TEXT_FIX = [[/Kr stal/g, 'Kristal'], [/Lac vert/g, 'Lacivert'], [/\bKahvereng\b/g, 'Kahverengi'], [/\bMav\b/g, 'Mavi'], [/Yeş l/g, 'Yeşil'], [/S yah/g, 'Siyah'], [/\bGr\b/g, 'Gri'], [/Grad ent/g, 'Gradient'], [/Alüm nyum/g, 'Alüminyum'], [/Şeﬀaf/g, 'Şeffaf'], [/\bRuuber\b/g, 'Rubber']];
  var COLOR_EN = { 'Siyah': 'Black', 'Gümüş': 'Silver', 'Altın': 'Gold', 'Pembe': 'Pink', 'Kahverengi': 'Brown', 'Mavi': 'Blue', 'Lacivert': 'Navy', 'Yeşil': 'Green', 'Haki': 'Khaki', 'Kırmızı': 'Red', 'Bordo': 'Burgundy', 'Şeffaf': 'Clear', 'Kristal': 'Crystal', 'Mat': 'Matte', 'Parlak': 'Glossy', 'Koyu': 'Dark', 'Açık': 'Light', 'Gri': 'Grey', 'Antrasit': 'Anthracite', 'Gun': 'Gunmetal', 'Metal': 'Metal', 'Bej': 'Beige', 'Beyaz': 'White', 'Mor': 'Purple', 'Lila': 'Lilac', 'Turuncu': 'Orange', 'Sarı': 'Yellow', 'Demi': 'Tortoise', 'Havana': 'Havana', 'Füme': 'Smoke', 'Bakır': 'Copper', 'Bronz': 'Bronze', 'Kırçıllı': 'Speckled', 'Kemik': 'Bone', 'Petrol': 'Petrol', 'Krem': 'Cream', 'Asetat': 'Acetate', 'Titanyum': 'Titanium', 'Alüminyum': 'Aluminium', 'Rubber': 'Rubber', 'Ultem': 'Ultem', 'TR90': 'TR90', 'Faset': 'Facet', 'PPSU': 'PPSU', 'Naylon': 'Nylon', 'Karbon': 'Carbon', 'Super': 'Super', 'NXT': 'NXT', 'Polarize': 'Polarized', 'Rose': 'Rose', 'Gold': 'Gold', 'Kahve': 'Coffee', 'Gradient': 'Gradient', 'Antik': 'Antique', 'Turkuaz': 'Turquoise', 'Bordo-Kahverengi': 'Burgundy-Brown', 'Standart': 'Standard', 'Optik': 'Optical', 'Çerçeve': 'Frame', 'Sap': 'Temple', 'Ucu': 'Tip', 'Cam': 'Lens', 'Lens': 'Lens', 'Yeni': 'New', 'Degrade': 'Gradient', 'Transparan': 'Transparent', 'Kaplumbağa': 'Tortoise', 'Saten': 'Satin', 'Çelik': 'Steel', 'Şampanya': 'Champagne', 'Zeytin': 'Olive', 'Taba': 'Tan', 'Somon': 'Salmon', 'Gül': 'Rose', 'Kurusu': 'Dusty', 'Vişne': 'Cherry', 'Ekru': 'Ecru', 'Kum': 'Sand', 'Nude': 'Nude', 'Leopar': 'Leopard', 'Aynalı': 'Mirrored', 'Ayna': 'Mirror', 'Dumanlı': 'Smoky' };
  var COLOR_BIGRAM = [[/Pembe Altın/g, 'Rose Gold'], [/Gun Metal/g, 'Gunmetal'], [/Sap Ucu/g, 'Temple tip'], [/Mat Siyah/g, 'Matte Black'], [/Gül Kurusu/g, 'Dusty Rose']];
  function fixText(s) { TEXT_FIX.forEach(function (r) { s = s.replace(r[0], r[1]); }); return s; }
  function colorTr(s) {
    // yalnızca renk/malzeme kelimelerinden oluşan metinleri kelime kelime çevir
    var toks = s.split(/(\s+|\/|,)/), any = false, ok = true;
    for (var i = 0; i < toks.length; i++) { var t = toks[i]; if (!t || /^\s+$/.test(t) || t === '/' || t === ',') continue; if (COLOR_EN[t]) any = true; else if (!/^[\d\.\-–·%()A-Z]+$/.test(t)) { ok = false; break; } }
    if (!any || !ok) return null;
    var out = s; COLOR_BIGRAM.forEach(function (b) { out = out.replace(b[0], b[1]); });
    return out.split(/(\s+|\/|,)/).map(function (t) { return COLOR_EN[t] || t; }).join('');
  }
  var BRAND_RE = /\b(Lee Cooper|Quantum|Slazenger|Belmond)\b/g, CODE_RE = /\b[A-Z]{0,2}\d{3,5}(?:\.C\d+)?\b/g, NUM_RE = /\d+(?:[.,]\d+)?/g;
  function canonKey(s) {
    var brands = s.match(BRAND_RE) || [], t = s.replace(BRAND_RE, '\u0001');
    var codes = t.match(CODE_RE) || []; t = t.replace(CODE_RE, '\u0002');
    var nums = t.match(NUM_RE) || []; t = t.replace(NUM_RE, '#');
    return { key: t.replace(/\u0001/g, '{brand}').replace(/\u0002/g, '{code}'), brands: brands, codes: codes, nums: nums };
  }
  function restore(tpl, c) { var b = 0, k = 0, n = 0; return tpl.replace(/\{brand\}|\{code\}|#/g, function (m) { if (m === '{brand}') return c.brands[b++] != null ? c.brands[b - 1] : m; if (m === '{code}') return c.codes[k++] != null ? c.codes[k - 1] : m; return c.nums[n++] != null ? c.nums[n - 1] : m; }); }
  var RULES = [
    [/^(.+?) ([A-Z]{0,2}\d{3,5}), (\d{4}) koleksiyonunun (clip-on güneş camı takılabilen|numaralı cam için tasarlanmış)\s*(.*?)\s*çerçeveli modelidir\. Ekartman (.+?) mm; (\d+) renk seçeneği\.$/, function (m) { var mat = m[5] ? colorTr(m[5].charAt(0).toUpperCase() + m[5].slice(1)) || m[5] : ''; return m[1] + ' ' + m[2] + ' is ' + (mat ? 'the ' + mat.toLowerCase() + '-framed ' : 'a ') + (m[4].indexOf('clip') === 0 ? 'model of the ' + m[3] + ' collection that takes a clip-on sun lens' : 'optical model of the ' + m[3] + ' collection, designed for prescription lenses') + '. Size ' + m[6] + ' mm; ' + m[7] + ' colour options.'; }],
    [/^([A-Z]{0,2}\d{3,5}) modeli (\d+) renk seçeneğiyle üretilir: (.*)\. Her rengin ön, yan( ve clip-on)? görselleri bu sayfada\.$/, function (m) { var list = m[3].replace(/\(([^)]*)\)/g, function (_, c) { return '(' + (colorTr(c) || c) + ')'; }); return m[1] + ' is produced in ' + m[2] + ' colour options: ' + list + '. Front, side' + (m[4] ? ' and clip-on' : '') + ' images of every colour are on this page.'; }],
    [/^(\d+) □ (\d+) – (\d+) mm · (.+)$/, function (m) { var mat = colorTr(m[4]); return mat ? m[1] + ' □ ' + m[2] + ' – ' + m[3] + ' mm · ' + mat : null; }],
    [/^([A-Z]{0,2}\d{3,5}\.C\d+) · (.+)$/, function (m) { var c = colorTr(m[2]); return c ? m[1] + ' · ' + c : null; }],
    [/^(.*) · ([A-Z]{0,2}\d{3,5}\.C\d+)$/, function (m) { var c = colorTr(m[1]); return c ? c + ' · ' + m[2] : null; }],
    [/^Listede (\d+) adet var ·$/, function (m) { return m[1] + ' item(s) in the list ·'; }],
    [/^(\d+) adet$/, function (m) { return m[1] + ' pcs'; }],
    [/^Ara \((\d+)\)$/, function (m) { return 'Search (' + m[1] + ')'; }],
    [/^Aradığınız (.+) özelliklerini tam olarak karşılayan bu model, tarzınızı kusursuz bir şekilde tamamlayacak\.$/, function (m) { return 'This model exactly matches your ' + prefList(m[1]) + ' preferences and will complete your style perfectly.'; }],
    [/^Aradığınız (.+) özelliklerini karşılayan bu model, yalnızca (.+) tercihinizden farklı\.$/, function (m) { return 'This model matches your ' + prefList(m[1]) + ' preferences; it differs only in ' + prefList(m[2]) + '.'; }],
    [/^Tercihlerinize en yakın alternatiflerden biri; (.+) tercihinizden farklı olsa da değerlendirmeye değer\.$/, function (m) { return 'One of the closest alternatives to your preferences; worth considering even though it differs in ' + prefList(m[1]) + '.'; }]
  ];
  var PREF_EN = { 'clip-on': 'clip-on', 'optik çerçeve': 'optical frame', 'dar yüz ölçüsü': 'narrow face', 'orta yüz ölçüsü': 'medium face', 'geniş yüz ölçüsü': 'wide face', 'yuvarlak çerçeve': 'round frame', 'köşeli çerçeve': 'square frame', 'oval çerçeve': 'oval frame', 'cat-eye çerçeve': 'cat-eye frame', 'geometrik çerçeve': 'geometric frame', 'metal malzeme': 'metal', 'asetat malzeme': 'acetate', 'titanyum malzeme': 'titanium', 'hafif plastik malzeme': 'TR90/Ultem', 'polarize cam': 'polarized lenses', 'standart cam': 'standard lenses', 'tam çerçeve': 'full rim', 'yarım çerçeve': 'half rim', 'çerçevesiz': 'rimless' };
  function prefList(s) {
    var items = s.split(/, | ve /).map(function (x) {
      x = x.trim(); if (PREF_EN[x]) return PREF_EN[x];
      if (/ renk$/.test(x)) { var c = x.slice(0, -5).replace(/(^|[\s\/])(\S)/g, function (_, a, b) { return a + b.toUpperCase(); }); var t = colorTr(c); return (t || c).toLowerCase() + ' colour'; }
      return x;
    });
    return items.length > 1 ? items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1] : items[0];
  }
  function translateText(raw, attr) {
    var s = fixText(raw);
    if (LANG !== 'en') return s;
    var ck = (attr ? '@' : '') + s;
    if (I18N.cache[ck] != null) return I18N.cache[ck];
    var out = tr1(s, attr);
    I18N.cache[ck] = out;
    return out;
  }
  function tr1(s, attr) {
    var D = I18N.dict, p = attr ? '@' : '';
    if (D[p + s]) return D[p + s];
    if (attr && D[s]) return D[s];
    var c = canonKey(s);
    if (c.key !== s) { if (D[p + c.key]) return restore(D[p + c.key], c); if (attr && D[c.key]) return restore(D[c.key], c); }
    for (var i = 0; i < RULES.length; i++) { var m = s.match(RULES[i][0]); if (m) { var r = RULES[i][1](m); if (r) return r; } }
    var col = colorTr(s); if (col) return col;
    if (s.indexOf(' · ') > 0) { var parts = s.split(' · '), ch = false; var t = parts.map(function (x) { var y = tr1(x, attr); if (y !== x) ch = true; return y; }); if (ch) return t.join(' · '); }
    if (/:$/.test(s)) { var base = s.slice(0, -1); var tb = tr1(base, attr); if (tb !== base) return tb + ':'; }
    return s;
  }
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|CODE|PRE)$/;
  function translateNode(n) {
    if (n.nodeType === 3) {
      var p = n.parentNode; if (!p || SKIP.test(p.nodeName) || (p.closest && p.closest('[data-i18n-skip]'))) return;
      var v = n.nodeValue; if (!v || !v.trim()) return;
      if (n.__ao === v) return;
      var m = v.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2].replace(/\s+/g, ' ');
      var t = translateText(core, false);
      if (t !== core) { n.nodeValue = m[1] + t + m[3]; }
      n.__ao = n.nodeValue;
    } else if (n.nodeType === 1) {
      if (SKIP.test(n.nodeName) && n.nodeName !== 'INPUT') return;
      ATTRS.forEach(function (a) { var v = n.getAttribute && n.getAttribute(a); if (v && v.trim() && !/^https?:/.test(v)) { var t = translateText(v.trim(), true); if (t !== v.trim()) n.setAttribute(a, t); } });
      if (n.nodeName === 'INPUT' && n.type === 'search') return;
      var w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), x;
      while ((x = w.nextNode())) { if (x.nodeType === 3) translateNode(x); else ATTRS.forEach(function (a) { var v = x.getAttribute(a); if (v && v.trim() && !/^https?:/.test(v)) { var t = translateText(v.trim(), true); if (t !== v.trim()) x.setAttribute(a, t); } }); }
    }
  }
  function translateTitle() {
    var t = document.title.trim(); var D = I18N.dict;
    var c = canonKey(t);
    var r = D['@@' + t] || (D['@@' + c.key] ? restore(D['@@' + c.key], c) : null);
    if (!r) { var parts = t.split(' · '); r = parts.map(function (x) { return tr1(x, true); }).join(' · '); }
    if (r && r !== t) document.title = r;
  }
  function swapPageContent() {
    if (VIEW === 'page') {
      var h1 = $('.page h1'), pageIn = $('.page__in'); if (!h1 || !pageIn) return;
      var key = h1.textContent.trim(), en = I18N.pages[key]; if (!en) return;
      h1.textContent = en.title;
      Array.prototype.slice.call(pageIn.children).forEach(function (el) { if (el !== h1) pageIn.removeChild(el); });
      var wrap = document.createElement('div'); wrap.innerHTML = en.html; while (wrap.firstChild) pageIn.appendChild(wrap.firstChild);
      fixPageLinks();
    }
  }
  function enArticle(title) { return LANG === 'en' ? I18N.articles[String(title || '').trim()] : null; }
  function swapArticle() {
    var t = $('.article__title'), body = $('.article__body'); if (!t || !body) return;
    var en = enArticle(t.textContent); if (!en) return;
    t.textContent = en.title; document.title = en.title + ' · Blog · Arıkan Optik';
    var inner = $('.article__body-in', body) || body, cover = $('.article__cover', inner);
    inner.innerHTML = (cover ? cover.outerHTML : '') + en.html;
  }
  function i18nReady() {
    if (I18N.loaded) return I18N.loaded;
    if (LANG !== 'en') return (I18N.loaded = Promise.resolve());
    I18N.loaded = fetchJSON(dataUrl('i18n/en.json')).then(function (d) { I18N.dict = d.ui || {}; I18N.pages = d.pages || {}; I18N.articles = d.articles || {}; }).catch(function () { });
    return I18N.loaded;
  }
  function initI18n() {
    document.documentElement.lang = LANG;
    // dil anahtarı (header + footer)
    var mk = function (cls) { var el = document.createElement('div'); el.className = 'lang ' + cls; el.setAttribute('data-i18n-skip', '1'); el.innerHTML = '<a href="?lang=tr" data-lang="tr"' + (LANG === 'tr' ? ' class="on"' : '') + '>TR</a><span>|</span><a href="?lang=en" data-lang="en"' + (LANG === 'en' ? ' class="on"' : '') + '>EN</a>'; $$('a', el).forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); var l = a.getAttribute('data-lang'); try { localStorage.setItem('ao_lang', l); } catch (x) { } track('dil', { dil: l }); var u = location.pathname + location.search.replace(/[?&]lang=(tr|en)/, '').replace(/^&/, '?'); u += (u.indexOf('?') >= 0 ? '&' : '?') + 'lang=' + l; location.href = u + location.hash; }); }); return el; };
    var nav = $('.nav'); if (nav) nav.insertBefore(mk('lang--nav'), $('.search-wrap', nav) || null);
    var fb = $('.site-footer__bottom'); if (fb) fb.appendChild(mk('lang--footer'));
    // hreflang
    ['tr', 'en'].forEach(function (l) { var ln = document.createElement('link'); ln.rel = 'alternate'; ln.hreflang = l; ln.href = location.origin + location.pathname + (l === 'en' ? '?lang=en' : ''); document.head.appendChild(ln); });
    // Türkçe'de de veri düzeltmeleri; İngilizce'de tam çeviri
    i18nReady().then(function () {
      swapPageContent(); swapArticle();
      translateNode(document.body); translateTitle();
      var mo = new MutationObserver(function (muts) {
        muts.forEach(function (m) {
          if (m.type === 'characterData') translateNode(m.target);
          else if (m.type === 'attributes') { if (m.target.nodeType === 1) { var v = m.target.getAttribute(m.attributeName); if (v && v.trim()) { var t = translateText(v.trim(), true); if (t !== v.trim()) m.target.setAttribute(m.attributeName, t); } } }
          else m.addedNodes.forEach(function (n) { translateNode(n); });
        });
        if (LANG === 'en') translateTitle();
      });
      mo.observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ATTRS });
      var tmo = new MutationObserver(function () { if (LANG === 'en') translateTitle(); }); var te = document.querySelector('title'); if (te) tmo.observe(te, { childList: true, characterData: true, subtree: true });
    });
  }

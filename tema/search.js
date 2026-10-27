  /* ---------- akıllı arama: doğal dil + yazım toleransı ---------- */
  function lev(a, b) {
    if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  // sözlük: normalize edilmiş kelime -> {k: tür, v: değer, l: etiket}
  var VOCAB = [];
  function voc(words, k, v, l) { words.split(' ').forEach(function (w) { VOCAB.push({ w: trNorm(w), k: k, v: v, l: l }); }); }
  voc('leecooper lee cooper lc', 'brand', 'lee-cooper', 'Lee Cooper'); voc('quantum quantom kuantum', 'brand', 'quantum', 'Quantum');
  voc('slazenger slazinger slazenge', 'brand', 'slazenger', 'Slazenger'); voc('belmond belmont', 'brand', 'belmond', 'Belmond');
  voc('clipon clip clips klips klipsli gunes gunesli gunesgozlugu sun', 'cat', 'Clip-On', 'Clip-On'); voc('optik optic numarali', 'cat', 'Optik', 'Optik');
  voc('yuvarlak round panto daire', 'shape', 'round', 'Yuvarlak'); voc('koseli kare dikdortgen rectangle square kosegen', 'shape', 'square', 'Köşeli');
  voc('oval', 'shape', 'oval', 'Oval'); voc('cateye cat kedi kedigozu cekik', 'shape', 'cateye', 'Cat-Eye'); voc('geometrik altigen hexagon geo', 'shape', 'geo', 'Geometrik');
  voc('metal metalik celik', 'mat', 'Metal', 'Metal'); voc('asetat acetate plastik kemik', 'mat', 'Asetat', 'Asetat'); voc('titanyum titanium titan', 'mat', 'Titanyum', 'Titanyum');
  voc('tr90 tr ultem hafif esnek', 'mat', 'Hafif plastik', 'TR90 · Ultem'); voc('aluminyum aluminium', 'mat', 'Alüminyum', 'Alüminyum');
  voc('polarize polarized polar', 'feat', 'polar', 'Polarize'); voc('antifar antifarli maviisik bluelight ekran', 'feat', 'antifar', 'Anti-Far'); voc('yeni new 2026 sezon', 'feat', 'new', 'Yeni');
  voc('cercevesiz rimless', 'rim', 'rimless', 'Çerçevesiz'); voc('yarim nylor yarimcerceve', 'rim', 'half', 'Yarım çerçeve'); voc('tam tamcerceve', 'rim', 'full', 'Tam çerçeve');
  voc('dar kucuk ince', 'face', 'dar', 'Dar yüz'); voc('orta normal', 'face', 'orta', 'Orta yüz'); voc('genis buyuk', 'face', 'genis', 'Geniş yüz');
  FAMILIES.forEach(function (f) { var words = f[0].split('/').map(function (x) { return trNorm(x.trim()); }); voc(words.join(' '), 'fam', f[0], f[0]); });
  voc('gold sari altin', 'fam', 'Altın / Bronz', 'Altın / Bronz'); voc('silver gumus gri', 'fam', 'Gümüş', 'Gümüş'); voc('black siyah', 'fam', 'Siyah', 'Siyah');
  voc('blue mavi lacivert navy', 'fam', 'Mavi / Lacivert', 'Mavi / Lacivert'); voc('brown kahve kahverengi demi havana kaplumbaga', 'fam', 'Kahverengi / Demi', 'Kahverengi / Demi');
  voc('seffaf kristal transparan transparent clear', 'fam', 'Şeffaf / Kristal', 'Şeffaf / Kristal'); voc('yesil haki green', 'fam', 'Yeşil / Haki', 'Yeşil / Haki');
  voc('kirmizi bordo red', 'fam', 'Kırmızı / Bordo', 'Kırmızı / Bordo'); voc('pembe mor lila pink purple rose', 'fam', 'Pembe / Mor', 'Pembe / Mor'); voc('beyaz bej krem white', 'fam', 'Bej / Beyaz', 'Bej / Beyaz');
  var STOP = { yuz: 1, yuzu: 1, yuzum: 1, yuzlu: 1, filtre: 1, filtreli: 1, cami: 1, cerceve: 1, cerceveler: 1, gozluk: 1, gozlukler: 1, cam: 1, camli: 1, isik: 1, ve: 1, ile: 1, icin: 1, bir: 1, model: 1, modeli: 1, modeller: 1, cercevesi: 1, gozlugu: 1, gozlukleri: 1, renk: 1, renkli: 1, olan: 1, mi: 1, mu: 1, var: 1, arıyorum: 1, ariyorum: 1, istiyorum: 1, kadin: 1, erkek: 1, bayan: 1, unisex: 1 };
  function lookup(tok) {
    var best = null, bd = 9;
    for (var i = 0; i < VOCAB.length; i++) {
      var w = VOCAB[i].w; if (w === tok) return VOCAB[i];
      if (tok.length >= 4 && Math.abs(w.length - tok.length) <= 2) { var d = lev(w, tok); if (d < bd && d <= (tok.length >= 7 ? 2 : 1)) { bd = d; best = VOCAB[i]; } }
    }
    return best;
  }
  function parseQuery(q) {
    var toks = trNorm(q).replace(/[^a-z0-9\s\-\.]/g, ' ').split(/[\s]+/).filter(Boolean);
    var crit = { brand: [], cat: [], shape: [], mat: [], feat: [], rim: [], face: [], fam: [], code: [], lens: [] }, chips = [], i;
    // "lee cooper", "cat eye" gibi iki kelimelik ifadeler
    var joined = []; for (i = 0; i < toks.length; i++) { var jv = i + 1 < toks.length ? lookup(toks[i] + toks[i + 1]) : null; if (jv && jv.w === toks[i] + toks[i + 1]) { joined.push(toks[i] + toks[i + 1]); i++; } else joined.push(toks[i]); }
    joined.forEach(function (t) {
      if (STOP[t]) return;
      if (/^\d{2}$/.test(t) && +t >= 42 && +t <= 62) { crit.lens.push(+t); chips.push({ k: 'lens', l: t + ' mm' }); return; }
      if ((/^\d{2}$/.test(t) && +t >= 12 && +t <= 26) || (/^\d{3}$/.test(t) && +t >= 120 && +t <= 160)) return;
      var m = t.match(/^(\d{2})[-x\.\s]?(\d{2})[-x\.\s]?(\d{3})$/); if (m) { crit.lens.push(+m[1]); chips.push({ k: 'lens', l: m[1] + ' mm' }); return; }
      var v = lookup(t.replace(/-/g, ''));
      if (v) { if (crit[v.k].indexOf(v.v) < 0) { crit[v.k].push(v.v); chips.push({ k: v.k, l: v.l }); } return; }
      var c = t.replace(/[\.\-]/g, '').toUpperCase();
      if (/^[A-Z]{0,2}\d{2,5}(C\d{1,2})?$/.test(c) || /^[A-Z]{1,2}\d+/.test(c) || /^\d{3,5}$/.test(c)) { crit.code.push(c); chips.push({ k: 'code', l: t.toUpperCase() }); return; }
      chips.push({ k: 'unknown', l: t });
    });
    return { crit: crit, chips: chips };
  }
  function matchCount(m, crit) {
    var n = 0, total = 0, fail = false;
    function check(ok) { total++; if (ok) n++; else fail = true; }
    if (crit.brand.length) check(crit.brand.indexOf(m.brand_slug) >= 0);
    if (crit.cat.length) check(crit.cat.indexOf(m.category) >= 0);
    if (crit.shape.length) check(crit.shape.indexOf(m.shape) >= 0);
    if (crit.mat.length) check(crit.mat.indexOf(matOf(m)) >= 0 || crit.mat.some(function (x) { return trNorm(frameMaterial(m)).indexOf(trNorm(x)) >= 0; }));
    if (crit.rim.length) check(crit.rim.indexOf(m.rim || 'full') >= 0);
    if (crit.face.length) check(crit.face.indexOf(faceOf(m)[0]) >= 0);
    if (crit.lens.length) check(crit.lens.some(function (l) { return Math.abs((m.lens || 0) - l) <= 1; }));
    if (crit.fam.length) { var fams = familiesOf(m); check(crit.fam.some(function (f) { return fams.indexOf(f) >= 0; })); }
    crit.feat.forEach(function (f) { check(f === 'polar' ? isPolar(m) : f === 'antifar' ? !!m.antifar : f === 'new' ? !!m.new : true); });
    crit.code.forEach(function (c) {
      var mc = m.code.toUpperCase(), hit = mc.indexOf(c) >= 0 || m.variants.some(function (v) { return v.code.replace(/\./g, '').toUpperCase().indexOf(c) >= 0; });
      if (!hit && c.length >= 4 && Math.abs(mc.length - c.length) <= 1) hit = lev(mc, c) <= 1;
      check(hit);
    });
    return { n: n, total: total, all: total > 0 && !fail };
  }
  var lastSearch = null;
  function searchModels(q) {
    var p = parseQuery(q); lastSearch = { chips: p.chips, relaxed: false, q: q };
    var known = p.chips.filter(function (c) { return c.k !== 'unknown'; }).length;
    if (!known) {
      // hiçbir ölçüt tanınmadı: serbest metin eşleşmesi
      var ql = trNorm(q);
      var free = state.models.filter(function (m) {
        var hay = trNorm(m.code + ' ' + m.brand + ' ' + m.category + ' ' + Object.keys(m.materials).map(function (k) { return m.materials[k]; }).join(' ') + ' ' + m.variants.map(function (v) { return Object.keys(v.attrs).map(function (k) { return v.attrs[k]; }).join(' '); }).join(' '));
        return hay.indexOf(ql) >= 0;
      });
      if (!free.length) lastSearch.relaxed = 'all';
      return free.length ? free : state.models.slice();
    }
    var scored = state.models.map(function (m) { return { m: m, r: matchCount(m, p.crit) }; });
    var full = scored.filter(function (x) { return x.r.all; }).map(function (x) { return x.m; });
    if (full.length) {
      if (p.crit.code.length) { // kod aramasında: tam > başlangıç > içerir > benzer
        var rank = function (m) { var mc = m.code.toUpperCase(), best = 3; p.crit.code.forEach(function (c) { var r = mc === c ? 0 : mc.indexOf(c) === 0 ? 1 : mc.indexOf(c) >= 0 ? 2 : 3; if (r < best) best = r; }); return best; };
        full.sort(function (a, b) { return rank(a) - rank(b); });
      }
      return full;
    }
    lastSearch.relaxed = true;
    return scored.filter(function (x) { return x.r.n >= Math.max(1, x.r.total - 1); }).sort(function (a, b) { return b.r.n - a.r.n; }).map(function (x) { return x.m; });
  }
  function chipHtml(chips) {
    return chips.map(function (c) { return '<span class="qchip' + (c.k === 'unknown' ? ' qchip--x' : '') + '">' + esc(c.l) + '</span>'; }).join('');
  }

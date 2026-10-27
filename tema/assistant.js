  /* ---------- Gözlük Asistanı (adım adım model önerisi) ---------- */
  var AST = {
    shapes: [['round', 'Yuvarlak'], ['square', 'Köşeli'], ['oval', 'Oval'], ['cateye', 'Cat-Eye'], ['geo', 'Geometrik']],
    mats: [['Metal', /metal|alüminyum|faset/i], ['Asetat', /asetat/i], ['Titanyum', /titanyum/i], ['Hafif plastik', /tr90|ultem|ppsu|naylon/i]],
    faces: [['dar', 'Dar', 0, 50], ['orta', 'Orta', 51, 54], ['genis', 'Geniş', 55, 999]],
    heroes: ['lee-cooper-p001-hero.jpg', 'quantum-p063-hero.jpg', 'slazenger-p001-hero.jpg', 'belmond-p001-hero.jpg', 'slazenger-clip-p001.jpg', 'lee-cooper-p076.jpg']
  };
  var SHAPE_ICON = {
    round: '<circle cx="34" cy="40" r="24"/><circle cx="96" cy="40" r="24"/><path d="M58 36c5-6 9-6 14 0"/><path d="M10 34 2 30M120 34l8-4"/>',
    square: '<rect x="8" y="18" width="52" height="44" rx="7"/><rect x="70" y="18" width="52" height="44" rx="7"/><path d="M60 36h10"/><path d="M8 30 2 28M122 30l6-2"/>',
    oval: '<ellipse cx="34" cy="40" rx="28" ry="20"/><ellipse cx="96" cy="40" rx="28" ry="20"/><path d="M62 36c3-5 5-5 6 0"/><path d="M6 34 1 31M124 34l5-3"/>',
    cateye: '<path d="M56 34C50 28 20 18 6 22 2 24 6 50 20 58c14 6 36 0 36-24z"/><path d="M74 34c6-6 36-16 50-12 4 2 0 28-14 36-14 6-36 0-36-24z"/><path d="M56 38c4-5 14-5 18 0"/>',
    geo: '<path d="M14 20h32l14 12-4 28H18L8 46z"/><path d="M84 20h32l6 26-10 14H74l-4-28z"/><path d="M60 34h10"/>',
    any: '<circle cx="34" cy="40" r="24" stroke-dasharray="4 5"/><rect x="70" y="18" width="52" height="44" rx="7" stroke-dasharray="4 5"/><path d="M58 36c5-6 9-6 14 0"/>'
  };
  var RIM_ICON = {
    full: '<rect x="8" y="18" width="52" height="44" rx="9" stroke-width="5"/><rect x="70" y="18" width="52" height="44" rx="9" stroke-width="5"/><path d="M60 36h10"/>',
    half: '<path d="M8 22c0-3 2-4 5-4h42c3 0 5 1 5 4v8" stroke-width="5"/><path d="M70 22c0-3 2-4 5-4h42c3 0 5 1 5 4v8" stroke-width="5"/><path d="M8 30c2 22 6 32 26 32s24-10 26-32M70 30c2 22 6 32 26 32s24-10 26-32" stroke-width="1.5" stroke-dasharray="3 3"/><path d="M60 36h10"/>',
    rimless: '<rect x="8" y="18" width="52" height="44" rx="9" stroke-width="1.5" opacity=".55"/><rect x="70" y="18" width="52" height="44" rx="9" stroke-width="1.5" opacity=".55"/><path d="M60 34h10M2 28l6 2M122 30l6-2" stroke-width="3"/>',
    any: '<rect x="8" y="18" width="52" height="44" rx="9" stroke-dasharray="4 5"/><rect x="70" y="18" width="52" height="44" rx="9" stroke-dasharray="4 5"/><path d="M60 36h10"/>'
  };
  function faceIcon(rx) { return '<svg viewBox="0 0 130 80" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><ellipse cx="65" cy="42" rx="' + rx + '" ry="34"/><path d="M' + (65 - rx * .55) + ' 40h' + (rx * .35) + 'M' + (65 + rx * .2) + ' 40h' + (rx * .35) + '" stroke-width="3"/></svg>'; }
  function ico(set, k) { return '<svg viewBox="0 0 130 80" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">' + set[k] + '</svg>'; }
  function joinTr(arr) { if (arr.length < 2) return arr.join(''); return arr.slice(0, -1).join(', ') + ' ve ' + arr[arr.length - 1]; }
  function faceOf(m) { for (var i = 0; i < AST.faces.length; i++) if (m.lens >= AST.faces[i][2] && m.lens <= AST.faces[i][3]) return AST.faces[i]; return AST.faces[1]; }
  function matOf(m) { var fm = frameMaterial(m); for (var i = 0; i < AST.mats.length; i++) if (AST.mats[i][1].test(fm)) return AST.mats[i][0]; return fm || '–'; }
  function shapeLabel(k) { for (var i = 0; i < AST.shapes.length; i++) if (AST.shapes[i][0] === k) return AST.shapes[i][1]; return '–'; }
  function rimLabel(k) { return { full: 'Tam çerçeve', half: 'Yarım çerçeve', rimless: 'Çerçevesiz' }[k] || '–'; }
  function modelByCode(c) { for (var i = 0; i < state.models.length; i++) if (state.models[i].code === c) return state.models[i]; return null; }
  function frontOf(m) { return m.images && m.images.front ? img(m, m.images.front) : (m.variants[0] && m.variants[0].images.front ? img(m, m.variants[0].images.front) : ''); }

  function astScore(m, a) {
    var crit = [], pts = 0, w = 0;
    if (a.type !== 'any') { if ((a.type === 'clip') !== (m.category === 'Clip-On')) return null; crit.push({ label: 'Tür', val: catLabel(m), ok: true, s: a.type === 'clip' ? 'clip-on' : 'optik çerçeve' }); }
    if (a.face !== 'any') {
      var f = faceOf(m), want = AST.faces.map(function (x) { return x[0]; }).indexOf(a.face), have = AST.faces.map(function (x) { return x[0]; }).indexOf(f[0]);
      var ok = want === have, near = Math.abs(want - have) === 1; w += 2; pts += ok ? 2 : (near ? 1 : 0);
      crit.push({ label: 'Ekartman', val: m.lens + ' mm · ' + f[1], ok: ok, s: AST.faces[want][1].toLowerCase() + ' yüz ölçüsü' });
    }
    if (a.shape !== 'any') { var so = m.shape === a.shape; w += 3; pts += so ? 3 : 0; crit.push({ label: 'Çerçeve Şekli', val: shapeLabel(m.shape), ok: so, s: shapeLabel(a.shape).toLowerCase() + ' çerçeve' }); }
    if (a.mat !== 'any') { var mo = matOf(m) === a.mat; w += 2; pts += mo ? 2 : 0; crit.push({ label: 'Malzeme', val: matOf(m), ok: mo, s: a.mat.toLowerCase() + ' malzeme' }); }
    if (a.colors.length) {
      var fams = familiesOf(m), hit = a.colors.filter(function (c) { return fams.indexOf(c) >= 0; });
      w += 2; pts += hit.length ? 2 : 0;
      crit.push({ label: 'Çerçeve Rengi', val: (hit[0] || fams[0] || '–'), ok: !!hit.length, s: (hit[0] || a.colors[0]).toLowerCase() + ' renk' });
    }
    if (a.feat === 'polar-yes' || a.feat === 'polar-no') { var p = isPolar(m), po = (a.feat === 'polar-yes') === p; w += 2; pts += po ? 2 : 0; crit.push({ label: 'Cam', val: p ? 'Polarize' : 'Standart', ok: po, s: a.feat === 'polar-yes' ? 'polarize cam' : 'standart cam' }); }
    if (/^rim-/.test(a.feat)) { var rk = a.feat.slice(4), ro = (m.rim || 'full') === rk; w += 2; pts += ro ? 2 : 0; crit.push({ label: 'Çerçeve Yapısı', val: rimLabel(m.rim || 'full'), ok: ro, s: rimLabel(rk).toLowerCase() }); }
    return { m: m, crit: crit, pct: w ? Math.round(pts / w * 100) : 100, full: crit.every(function (c) { return c.ok; }) };
  }
  function astRank(a) {
    var out = [];
    state.models.forEach(function (m) { var r = astScore(m, a); if (r) out.push(r); });
    out.sort(function (x, y) { return y.pct - x.pct || (y.m.new - x.m.new) || (state.models.indexOf(x.m) - state.models.indexOf(y.m)); });
    return out.slice(0, 5);
  }
  function astSentence(r) {
    var ok = r.crit.filter(function (c) { return c.ok; }).map(function (c) { return c.s; });
    var no = r.crit.filter(function (c) { return !c.ok; }).map(function (c) { return c.s; });
    if (!r.crit.length) return 'Koleksiyonun öne çıkan modellerinden biri; tüm renk ve ölçü seçeneklerini sayfasında görebilirsiniz.';
    if (!no.length) return 'Aradığınız ' + joinTr(ok) + ' özelliklerini tam olarak karşılayan bu model, tarzınızı kusursuz bir şekilde tamamlayacak.';
    if (!ok.length) return 'Tercihlerinize en yakın alternatiflerden biri; ' + joinTr(no) + ' tercihinizden farklı olsa da değerlendirmeye değer.';
    return 'Aradığınız ' + joinTr(ok) + ' özelliklerini karşılayan bu model, yalnızca ' + joinTr(no) + ' tercihinizden farklı.';
  }
  function astEncode(a) { var p = []; ['type', 'face', 'shape', 'mat', 'feat'].forEach(function (k) { if (a[k] && a[k] !== 'any') p.push(k + '=' + encodeURIComponent(a[k])); }); if (a.colors.length) p.push('c=' + encodeURIComponent(a.colors.join('|'))); return p.join('&'); }
  function astDecode(s) {
    var a = { type: 'any', face: 'any', shape: 'any', mat: 'any', colors: [], feat: 'any' };
    if (/%26|%3D/i.test(s)) { try { s = decodeURIComponent(s); } catch (e) { } }
    s.split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i < 0) return; var k = kv.slice(0, i), v = kv.slice(i + 1); try { v = decodeURIComponent(v); } catch (e) { } if (k === 'c') a.colors = v.split('|').filter(Boolean); else if (k in a) a[k] = v; });
    return a;
  }

  function initAssistant() {
    if ($('#ast')) return;
    var answers, hist, step, results, mode = 'quiz', idx = 0;
    var root = document.createElement('div'); root.id = 'ast'; root.className = 'ast'; root.setAttribute('aria-hidden', 'true');
    root.innerHTML = '<div class="ast__box" role="dialog" aria-modal="true" aria-label="Gözlük Asistanı"><button class="ast__x" aria-label="Kapat">&#10005;</button><div class="ast__media"><img alt="" src=""></div><div class="ast__panel"></div></div>';
    document.body.appendChild(root);
    var media = $('.ast__media img', root), panel = $('.ast__panel', root);
    $('.ast__x', root).addEventListener('click', close);
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('open')) close(); });

    // sağ alt yuvarlak başlatıcı (WhatsApp düğmesinin üstünde)
    var launch = document.createElement('button'); launch.className = 'ast-launch'; launch.id = 'ast-launch'; launch.type = 'button'; launch.setAttribute('aria-label', 'Gözlük asistanı');
    launch.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12.2 4.4 6.4A2 2 0 0 1 6.3 5h1.2v2H6.6l-1.3 4h3.1c1.6 0 2.9.9 3.3 2.2h.6c.4-1.3 1.7-2.2 3.3-2.2h3.1l-1.3-4h-.9V5h1.2a2 2 0 0 1 1.9 1.4l1.9 5.8c.2.3.3.7.3 1.1v1.2c0 2.2-1.8 3.9-4 3.9h-.8c-2 0-3.7-1.5-3.9-3.5h-1.2c-.3 2-1.9 3.5-3.9 3.5h-.8c-2.2 0-4-1.7-4-3.9v-1.2c0-.4.1-.8.3-1.1zm1.7 1.3v1c0 1.1.9 2 2 2H7c1.1 0 2-.9 2-2v-1c0-.3-.3-.6-.6-.6H4.8c-.3 0-.6.3-.6.6zm10.8 0v1c0 1.1.9 2 2 2h.8c1.1 0 2-.9 2-2v-1c0-.3-.3-.6-.6-.6h-3.6c-.3 0-.6.3-.6.6z"/></svg><span class="ast-launch__tip">Gözlük asistanı</span>';
    document.body.appendChild(launch);
    function setMin(v) { launch.classList.toggle('min', v); }
    setTimeout(function () { launch.classList.add('in'); }, 600);
    launch.addEventListener('click', function () { open(); });
    $$('a[href="#asistan"],[data-asistan]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); open(); }); });

    function open(pre) {
      answers = pre || { type: 'any', face: 'any', shape: 'any', mat: 'any', colors: [], feat: 'any' };
      hist = []; mode = 'quiz'; idx = 0;
      root.classList.add('open'); root.setAttribute('aria-hidden', 'false'); BODY.classList.add('ast-open'); track('asistan_ac', { kaynak: pre ? 'paylasim' : 'buton' });
      setMin(true);
      ready().then(function () { if (pre) finish(); else go('type'); });
    }
    function close() { root.classList.remove('open'); root.setAttribute('aria-hidden', 'true'); BODY.classList.remove('ast-open'); setMin(false); if (location.hash.indexOf('#asistan') === 0) history.replaceState(null, '', location.pathname + location.search); }

    var STEPS = ['type', 'face', 'shape', 'mat', 'colors', 'feat'];
    function stepsFor() { return STEPS.filter(function (s) { return s !== 'feat' || answers.type !== 'any'; }); }
    function progress(s) { var list = stepsFor(); return Math.round((list.indexOf(s)) / list.length * 100); }
    function hero(i) { media.src = CDN + 'img/hero/' + AST.heroes[i % AST.heroes.length]; media.parentNode.classList.remove('ast__media--model'); }
    function tile(v, label, inner, extra) { return '<button class="ast-opt' + (extra || '') + '" data-v="' + esc(v) + '"><span class="ast-opt__ico">' + inner + '</span><span class="ast-opt__l">' + esc(label) + '</span></button>'; }
    function photoTile(v, label, code) { var m = modelByCode(code); return tile(v, label, m ? '<img src="' + esc(frontOf(m)) + '" alt="">' : ''); }
    function frame(title, sub, body, opts) {
      opts = opts || {};
      panel.innerHTML = '<div class="ast__head"><h2 class="ast__title">' + title + '</h2>' + (sub ? '<p class="ast__sub">' + sub + '</p>' : '') + '</div>' +
        (opts.multi ? '<div class="ast__bar"><span>' + opts.multi + '</span><button class="btn btn--red ast__next" disabled>Devam</button></div>' : '') +
        '<div class="ast__body">' + body + '</div>' +
        '<div class="ast__foot">' + (hist.length ? '<button class="ast__back">&#8630; Geri Al</button>' : '<span></span>') + '<div class="ast__prog"><i style="width:' + progress(step) + '%"></i></div></div>';
      var back = $('.ast__back', panel); if (back) back.addEventListener('click', function () { var prev = hist.pop(); if (prev) go(prev, true); });
    }
    function pick(s, v) { if (s === 'colors') answers.colors = v; else answers[s] = v; hist.push(s); track('asistan_adim', { adim: s, cevap: s === 'colors' ? (v.length ? v.join('|') : 'any') : v }); var list = stepsFor(), i = list.indexOf(s); if (i + 1 < list.length) go(list[i + 1]); else finish(); }
    function bindSingle(s) { $$('.ast-opt', panel).forEach(function (b) { b.addEventListener('click', function () { pick(s, b.getAttribute('data-v')); }); }); }

    function go(s, back) {
      step = s; root.classList.remove('wide'); if (back) { /* önceki adıma dönüş: cevap korunur, kullanıcı değiştirebilir */ }
      if (s === 'type') {
        hero(0);
        frame('Ne tür bir gözlük arıyorsunuz?', 'Numaralı cam için optik çerçeve mi, mıknatıslı güneş camıyla kullanılan clip-on mu?',
          '<div class="ast-grid ast-grid--3">' + photoTile('optik', 'Optik çerçeve', 'LC3268') + photoTile('clip', 'Clip-On', 'LC3233') + tile('any', 'Fark etmez', ico(SHAPE_ICON, 'any')) + '</div>');
        bindSingle('type');
      } else if (s === 'face') {
        hero(1);
        frame('Yüz ölçünüz nasıl?', 'Mevcut gözlüğünüzün sapındaki ilk sayı (çerçeve genişliği) ipucu verir: 50 ve altı dar, 51–54 orta, 55 ve üzeri geniş.',
          '<div class="ast-grid ast-grid--4">' + tile('dar', 'Dar', faceIcon(24)) + tile('orta', 'Orta', faceIcon(30)) + tile('genis', 'Geniş', faceIcon(36)) + tile('any', 'Bilmiyorum', '<span class="ast-opt__q">?</span>') + '</div>');
        bindSingle('face');
      } else if (s === 'shape') {
        hero(2);
        frame('Tercih ettiğiniz çerçeve şeklini öğrenebilir miyiz?', 'Yüz hatlarınızın tersi şekiller genellikle dengeli durur: yuvarlak yüze köşeli, köşeli yüze yuvarlak çerçeve.',
          '<div class="ast-grid ast-grid--3">' + AST.shapes.map(function (x) { return tile(x[0], x[1], ico(SHAPE_ICON, x[0])); }).join('') + tile('any', 'Fark etmez', ico(SHAPE_ICON, 'any')) + '</div>');
        bindSingle('shape');
      } else if (s === 'mat') {
        hero(3);
        frame('Çerçeve malzemesi tercihiniz?', 'Metal ince ve klasik, asetat renkli ve belirgin, titanyum hafif ve dayanıklı, TR90/Ultem esnek ve çok hafiftir.',
          '<div class="ast-grid ast-grid--3">' + photoTile('Metal', 'Metal', 'LC1408') + photoTile('Asetat', 'Asetat', 'LC3253') + photoTile('Titanyum', 'Titanyum', 'Q1031') + photoTile('Hafif plastik', 'TR90 · Ultem', 'LC3269') + tile('any', 'Fark etmez', ico(SHAPE_ICON, 'any')) + '</div>');
        bindSingle('mat');
      } else if (s === 'colors') {
        hero(4);
        var sel = answers.colors.slice();
        frame('Çerçevede hangi renkleri tercih edersiniz?', '', '<div class="ast-grid ast-grid--4 ast-grid--sw">' + FAMILIES.map(function (f) {
          var parts = f[0].split('/').map(function (x) { return x.trim(); });
          return tile(f[0], f[0], '<i class="ast-sw" style="--c1:' + hexOf(parts[0]) + ';--c2:' + hexOf(parts[1] || parts[0]) + '"></i>', sel.indexOf(f[0]) >= 0 ? ' on' : '');
        }).join('') + tile('any', 'Fark etmez', '<i class="ast-sw ast-sw--any"></i>') + '</div>', { multi: 'Birden fazla renk seçebilirsiniz' });
        var next = $('.ast__next', panel);
        function sync() { next.disabled = !sel.length; next.textContent = sel.length ? 'Devam (' + sel.length + ')' : 'Devam'; }
        $$('.ast-opt', panel).forEach(function (b) {
          b.addEventListener('click', function () {
            var v = b.getAttribute('data-v');
            if (v === 'any') { pick('colors', []); return; }
            var i = sel.indexOf(v); if (i >= 0) sel.splice(i, 1); else sel.push(v);
            b.classList.toggle('on', i < 0); sync();
          });
        });
        next.addEventListener('click', function () { pick('colors', sel); });
        sync();
      } else if (s === 'feat') {
        hero(answers.type === 'clip' ? 4 : 5);
        if (answers.type === 'clip') {
          frame('Son olarak güneş camında polarize özelliği ister misiniz?', 'Polarize camlar yoldan, sudan ve camdan yansıyan parlamayı keser; araç kullanırken ve deniz kenarında belirgin fark yaratır.',
            '<div class="ast-list">' + ['polar-yes|Evet', 'polar-no|Hayır', 'any|Fark etmez'].map(function (x) { var p = x.split('|'); return '<button class="ast-opt ast-opt--row" data-v="' + p[0] + '">' + p[1] + '</button>'; }).join('') + '</div>');
        } else {
          frame('Son olarak çerçeve yapısı tercihiniz?', 'Tam çerçeve en dayanıklı ve belirgin olandır; yarım çerçeve ve çerçevesiz modeller yüzde daha hafif ve sade durur.',
            '<div class="ast-grid ast-grid--4">' + tile('rim-full', 'Tam çerçeve', ico(RIM_ICON, 'full')) + tile('rim-half', 'Yarım çerçeve', ico(RIM_ICON, 'half')) + tile('rim-rimless', 'Çerçevesiz', ico(RIM_ICON, 'rimless')) + tile('any', 'Fark etmez', ico(RIM_ICON, 'any')) + '</div>');
        }
        bindSingle('feat');
      }
      panel.scrollTop = 0;
    }

    function finish() {
      results = astRank(answers); idx = 0; mode = 'quiz';
      track('asistan_sonuc', { tur: answers.type, yuz: answers.face, sekil: answers.shape, malzeme: answers.mat, renk: answers.colors.join('|') || 'any', ozellik: answers.feat, ilk_model: results[0] ? results[0].m.code : '', uyum: results[0] ? results[0].pct : 0 });
      hero(0); root.classList.remove('wide');
      panel.innerHTML = '<div class="ast__loading"><p>Kişiselleştirilmiş sonuçlarınızı hazırlıyoruz…</p><div class="ast__prog ast__prog--big"><i></i></div></div>';
      var bar = $('.ast__prog i', panel); requestAnimationFrame(function () { bar.style.width = '100%'; });
      setTimeout(showResults, 1500);
    }
    function showResults() {
      mode = 'results';
      if (!results.length) { panel.innerHTML = '<div class="ast__head"><h2 class="ast__title">Bu kombinasyona uyan model bulunamadı</h2><p class="ast__sub">Birkaç tercihi gevşetip tekrar deneyin.</p></div><div class="ast__foot"><button class="ast__back ast__restart">&#8634; Başa Dön</button></div>'; $('.ast__restart', panel).addEventListener('click', function () { open(); }); return; }
      renderResult();
    }
    function renderResult() {
      root.classList.remove('wide');
      var r = results[idx], m = r.m, b = brandInfo(m);
      media.src = frontOf(m); media.parentNode.classList.add('ast__media--model');
      panel.innerHTML = '<div class="ast__rhead"><button class="ast__arrow" data-d="-1" aria-label="Önceki"' + (idx === 0 ? ' disabled' : '') + '>&#8249;</button><div class="ast__rtitle"><p class="eyebrow">Önerilerimiz</p><div class="ast__dots">' + results.map(function (_, i) { return '<i class="' + (i === idx ? 'on' : '') + '"></i>'; }).join('') + '</div></div><button class="ast__arrow" data-d="1" aria-label="Sonraki"' + (idx === results.length - 1 ? ' disabled' : '') + '>&#8250;</button></div>' +
        '<div class="ast__res"><h2 class="ast__title">' + esc(b.name) + ' ' + esc(m.code) + '</h2><p class="ast__meta">' + esc(catLabel(m)) + ' · ' + esc(dimStr(m)) + ' mm · ' + m.variants.length + ' renk <span class="ast__pct">%' + r.pct + ' uyum</span></p>' +
        '<a class="btn btn--red ast__cta" href="' + esc(postUrl(m)) + '">Modeli İncele</a>' +
        '<div class="ast__why"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.6L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.4zM5 15l.9 2.6L8.5 18l-2.6.9L5 21l-.9-2.1L1.5 18l2.6-.4zM19 14l.8 2.2 2.2.8-2.2.8L19 20l-.8-2.2-2.2-.8 2.2-.8z"/></svg><p>' + esc(astSentence(r)) + '</p></div>' +
        '<ul class="ast__chips">' + r.crit.map(function (c) { return '<li class="' + (c.ok ? 'ok' : 'no') + '"><i></i>' + esc(c.label) + ': <b>' + esc(c.val) + '</b></li>'; }).join('') + '<li class="ok"><i></i>Renkler: <b>' + esc(familiesOf(m).slice(0, 3).join(', ') || '–') + '</b></li></ul></div>' +
        '<div class="ast__tools"><button data-act="restart">&#8634; Başa Dön</button><button data-act="compare">&#8646; Karşılaştır</button><button data-act="share">&#8599; Paylaş</button></div>';
      var cta = $('.ast__cta', panel); if (cta) cta.addEventListener('click', function () { track('asistan_model_tikla', { model: m.code, sira: idx + 1, uyum: r.pct }); });
      $$('.ast__arrow', panel).forEach(function (bt) { bt.addEventListener('click', function () { idx = Math.max(0, Math.min(results.length - 1, idx + parseInt(bt.getAttribute('data-d'), 10))); renderResult(); }); });
      bindTools();
      panel.scrollTop = 0;
    }
    function renderCompare() {
      mode = 'compare'; hero(1); root.classList.add('wide');
      var rows = [
        ['', function (r) { return '<img src="' + esc(frontOf(r.m)) + '" alt="">'; }],
        ['Model', function (r) { return '<b>' + esc(brandInfo(r.m).name) + '<br>' + esc(r.m.code) + '</b>'; }],
        ['Uyum', function (r) { return '<span class="ast__pct">%' + r.pct + '</span>'; }],
        ['Tür', function (r) { return esc(catLabel(r.m)); }],
        ['Şekil', function (r) { return esc(shapeLabel(r.m.shape)); }],
        ['Yapı', function (r) { return esc(rimLabel(r.m.rim || 'full')); }],
        ['Ekartman', function (r) { return esc(dimStr(r.m)) + '<br><small>' + esc(faceOf(r.m)[1]) + ' yüz</small>'; }],
        ['Malzeme', function (r) { return esc(frameMaterial(r.m) || '–'); }],
        ['Cam', function (r) { return r.m.category === 'Clip-On' ? (isPolar(r.m) ? 'Polarize' : 'Standart') : '–'; }],
        ['Renkler', function (r) { return '<span class="swatches">' + r.m.variants.slice(0, 6).map(swatch).join('') + '</span><small>' + r.m.variants.length + ' renk</small>'; }],
        ['', function (r) { return '<a class="btn btn--dark" href="' + esc(postUrl(r.m)) + '">İncele</a>'; }]
      ];
      panel.innerHTML = '<div class="ast__head"><p class="eyebrow">Karşılaştır</p><h2 class="ast__title">Önerilen modeller yan yana</h2></div><div class="ast__table"><table>' + rows.map(function (row) { return '<tr><th>' + row[0] + '</th>' + results.map(function (r) { return '<td>' + row[1](r) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table></div>' +
        '<div class="ast__tools"><button data-act="restart">&#8634; Başa Dön</button><button data-act="results">&#8249; Önerilere dön</button><button data-act="share">&#8599; Paylaş</button></div>';
      bindTools(); panel.scrollTop = 0;
    }
    function bindTools() {
      $$('.ast__tools button', panel).forEach(function (bt) {
        bt.addEventListener('click', function () {
          var act = bt.getAttribute('data-act');
          if (act === 'restart') open();
          else if (act === 'compare') { track('asistan_karsilastir', {}); renderCompare(); }
          else if (act === 'results') renderResult();
          else if (act === 'share') {
            var url = location.origin + '/#asistan=' + astEncode(answers); track('asistan_paylas', {});
            var done = function () { bt.textContent = '✓ Bağlantı kopyalandı'; setTimeout(function () { bt.innerHTML = '&#8599; Paylaş'; }, 2200); };
            if (navigator.share) navigator.share({ title: 'Arıkan Optik · Gözlük Asistanı önerilerim', url: url }).catch(function () { });
            else if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { prompt('Bağlantıyı kopyalayın:', url); });
            else prompt('Bağlantıyı kopyalayın:', url);
          }
        });
      });
    }
    // paylaşılan bağlantı ile açılış
    function fromHash() { var h = location.hash || ''; if (h.indexOf('#asistan') === 0) { var q = h.indexOf('=') > 0 ? h.slice(h.indexOf('=') + 1) : ''; open(q ? astDecode(q) : null); } }
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

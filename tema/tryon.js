  /* ---------- sanal deneme: kamera / fotoğraf üzerine çerçeve ---------- */
  var TRYON = { vision: null, lm: null, mode: null, img: new Image(), ready: false, raf: 0, stream: null, scaleAdj: 1, code: '', model: null, lastLm: null };
  var MP_VER = '0.10.14';
  var UA = navigator.userAgent || '';
  var IS_IOS = /iP(hone|ad|od)/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var IS_SAFARI = /Safari/.test(UA) && !/Chrome|CriOS|FxiOS|EdgiOS|Android/.test(UA);
  function withTimeout(p, ms, msg) { return new Promise(function (res, rej) { var t = setTimeout(function () { rej(new Error(msg)); }, ms); p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); }); }); }
  function tryonLoad() {
    if (TRYON.lm) return Promise.resolve(TRYON.lm);
    if (TRYON.loading) return TRYON.loading;
    var load = import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + MP_VER + '/vision_bundle.mjs').then(function (v) {
      return v.FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + MP_VER + '/wasm').then(function (fs) {
        var opts = function (d) { return { baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task', delegate: d }, runningMode: 'VIDEO', numFaces: 1 }; };
        // Safari / iOS: GPU delegesi güvenilir değil, doğrudan CPU
        var first = (IS_IOS || IS_SAFARI) ? 'CPU' : 'GPU', second = first === 'GPU' ? 'CPU' : 'GPU';
        return v.FaceLandmarker.createFromOptions(fs, opts(first)).catch(function () { return v.FaceLandmarker.createFromOptions(fs, opts(second)); });
      }).then(function (lm) { TRYON.lm = lm; TRYON.vision = v; return lm; });
    });
    TRYON.loading = withTimeout(load, 45000, 'Yüz tanıma bu bağlantıda yüklenemedi; lütfen tekrar deneyin ya da "Fotoğraf yükle" kullanın.').catch(function (e) { TRYON.loading = null; throw e; });
    return TRYON.loading;
  }
  function initTryOn() {
    var art = $('.model'); if (!art) return;
    var code = art.getAttribute('data-code');
    var thumbs = $('.model__thumbs'); if (!thumbs) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn--dark tryon-btn';
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.5"/></svg><span>Sanal deneme</span>';
    thumbs.parentNode.insertBefore(b, thumbs.nextSibling);
    b.addEventListener('click', function () { tryonOpen(code); });
    if (/[?&#]tryon/.test(location.search + location.hash)) tryonOpen(code, true);
  }
  function tryonOpen(code, auto) {
    TRYON.code = code; TRYON.scaleAdj = 1;
    var root = $('#tryon');
    if (!root) {
      root = document.createElement('div'); root.id = 'tryon'; root.className = 'tryon';
      root.innerHTML = '<div class="tryon__box"><button class="tryon__x" aria-label="Kapat">&#10005;</button>' +
        '<div class="tryon__stage"><video id="tryon-video" playsinline muted autoplay></video><canvas id="tryon-canvas"></canvas><div class="tryon__status" id="tryon-status">Hazırlanıyor…</div></div>' +
        '<div class="tryon__panel"><p class="eyebrow">Sanal deneme</p><h2 class="tryon__title" id="tryon-title"></h2><p class="tryon__meta" id="tryon-meta"></p>' +
        '<div class="tryon__colors" id="tryon-colors"></div>' +
        '<label class="tryon__adj">Boyut ince ayarı <input id="tryon-scale" type="range" min="80" max="120" value="100"><span id="tryon-scale-v">100%</span></label>' +
        '<div class="tryon__btns"><button class="btn btn--red" id="tryon-shot" type="button">Fotoğraf çek</button><label class="btn btn--ghost" for="tryon-file">Fotoğraf yükle</label><input id="tryon-file" type="file" accept="image/*" hidden><button class="btn btn--ghost" id="tryon-cam" type="button">Kamerayı aç</button></div>' +
        '<p class="tryon__note">Görüntü cihazınızda kalır, hiçbir yere gönderilmez. Çerçeve gerçek ölçeğinde çizilir: göz bebeği mesafeniz (ortalama 63 mm) referans alınır.</p></div></div>';
      document.body.appendChild(root);
      $('.tryon__x', root).addEventListener('click', tryonClose);
      root.addEventListener('click', function (e) { if (e.target === root) tryonClose(); });
      $('#tryon-scale', root).addEventListener('input', function () { TRYON.scaleAdj = +this.value / 100; $('#tryon-scale-v', root).textContent = this.value + '%'; if (TRYON.mode === 'image') tryonDrawImage(); });
      $('#tryon-shot', root).addEventListener('click', tryonShot);
      $('#tryon-file', root).addEventListener('change', function () { if (this.files && this.files[0]) tryonFromFile(this.files[0]); });
      $('#tryon-cam', root).addEventListener('click', tryonCamera);
    }
    root.classList.add('open'); BODY.classList.add('ast-open');
    track('sanal_deneme_ac', { model: code });
    ready().then(function () {
      var m = modelByCode(code); TRYON.model = m; if (!m) return;
      $('#tryon-title').textContent = brandInfo(m).name + ' ' + m.code;
      $('#tryon-meta').textContent = catLabel(m) + ' · ' + dimStr(m) + ' mm';
      var vs = [{ code: m.code, label: 'Katalog rengi', fc: '' }].concat(m.variants.filter(function (v) { return v.images && v.images.front; }).map(function (v) { return { code: v.code, label: v.code.split('.')[1], fc: v.attrs.frame_color || '' }; }));
      $('#tryon-colors').innerHTML = vs.map(function (v, i) { return '<button type="button" class="tryon__color' + (i === 0 ? ' on' : '') + '" data-code="' + esc(v.code) + '" title="' + esc(v.fc) + '">' + (v.fc ? swatch({ code: v.code, attrs: { frame_color: v.fc } }) : '') + '<span>' + esc(v.label) + '</span></button>'; }).join('');
      $$('.tryon__color').forEach(function (bt) { bt.addEventListener('click', function () { $$('.tryon__color').forEach(function (x) { x.classList.remove('on'); }); bt.classList.add('on'); tryonSetImage(bt.getAttribute('data-code')); }); });
      tryonSetImage(m.code);
    });
    // kamera isteği dokunma hareketi içinde hemen yapılmalı (iOS Safari); adres ile otomatik açılışta iOS'ta dokunma beklenir
    if (auto && (IS_IOS || IS_SAFARI)) tryonStatus('Başlamak için "Kamerayı aç" düğmesine dokunun'); else tryonCamera();
  }
  function tryonSetImage(c) { TRYON.ready = false; var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { TRYON.img = im; TRYON.ready = true; if (TRYON.mode === 'image') tryonDrawImage(); }; im.src = CDN + 'img/tryon/' + c + '.png?v=' + DATA_V; }
  function tryonStatus(t) { var s = $('#tryon-status'); if (s) { s.textContent = t; s.style.display = t ? '' : 'none'; } }
  function tryonCamera() {
    tryonStop(); TRYON.mode = 'video'; var video = $('#tryon-video'), canvas = $('#tryon-canvas'); video.style.display = ''; tryonStatus('Kamera izni bekleniyor…');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { tryonStatus('Bu tarayıcı kamerayı desteklemiyor — "Fotoğraf yükle" ile deneyebilirsiniz.'); return; }
    // 1) kamera izni hemen (kullanıcı dokunuşu içinde) — 2) yüz tanıma modeli paralel yüklenir
    var camP = navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      .catch(function (e) { if (/OverconstrainedError|NotReadable/.test(String(e && e.name))) return navigator.mediaDevices.getUserMedia({ video: true, audio: false }); throw e; });
    camP.then(function () { tryonStatus('Yüz tanıma yükleniyor…'); }, function () { });
    Promise.all([camP, tryonLoad()]).then(function (res) {
      var stream = res[0], lm = res[1]; lm.setOptions({ runningMode: 'VIDEO' }); tryonStatus('Kamera açılıyor…');
      if (TRYON.mode !== 'video') { stream.getTracks().forEach(function (t) { t.stop(); }); throw new Error('iptal'); }
      TRYON.stream = stream; video.srcObject = stream; video.setAttribute('playsinline', ''); video.muted = true;
      return new Promise(function (res, rej) {
        var done = false, fin = function () { if (!done && video.videoWidth > 0) { done = true; res(); } };
        video.onloadedmetadata = function () { var p = video.play(); if (p && p.catch) p.catch(function () { }); fin(); };
        video.onloadeddata = fin; video.onplaying = fin; video.onresize = fin;
        setTimeout(function () { if (!done) { if (video.videoWidth > 0) fin(); else rej(new Error('Kamera görüntüsü alınamadı — "Fotoğraf yükle" ile deneyebilirsiniz.')); } }, 12000);
      });
    }).then(function () {
      canvas.width = video.videoWidth; canvas.height = video.videoHeight; tryonStatus('Yüzünüzü kameraya çevirin');
      // tanıma için kare kopyası (Safari'de video dokusu sorunlarına karşı), küçük boyut = hızlı
      var fw = Math.min(640, video.videoWidth), fh = Math.round(video.videoHeight * fw / video.videoWidth);
      var frame = document.createElement('canvas'); frame.width = fw; frame.height = fh; var fctx = frame.getContext('2d', { willReadFrequently: true });
      var last = -1, lastTs = 0;
      function loop() {
        if (TRYON.mode !== 'video') return;
        var now = performance.now(); if (now <= lastTs) now = lastTs + 1;
        if (video.currentTime !== last && video.readyState >= 2) {
          last = video.currentTime; lastTs = now; var lms = null;
          try { fctx.drawImage(video, 0, 0, fw, fh); var r = TRYON.lm.detectForVideo(frame, now); lms = (r.faceLandmarks && r.faceLandmarks[0]) || null; } catch (e) { }
          TRYON.lastLm = lms; tryonDraw(canvas, video, lms, true);
        }
        TRYON.raf = requestAnimationFrame(loop);
      }
      loop();
    }).catch(function (e) {
      var n = String(e && e.name || ''); if (String(e && e.message) === 'iptal') return;
      tryonStatus(/NotAllowed|Permission|Security/.test(n) ? 'Kamera izni verilmedi — tarayıcı ayarlarından izin verin ya da "Fotoğraf yükle" kullanın.' : /NotFound|NotReadable|Overconstrained|Abort/.test(n) ? 'Kamera açılamadı — "Fotoğraf yükle" ile deneyebilirsiniz.' : 'Yüklenemedi: ' + (e && e.message ? e.message : e));
      track('sanal_deneme_hata', { hata: (n || String(e && e.message || e)).slice(0, 60) });
    });
  }
  function tryonStop() { if (TRYON.raf) cancelAnimationFrame(TRYON.raf); TRYON.raf = 0; if (TRYON.stream) { TRYON.stream.getTracks().forEach(function (t) { t.stop(); }); TRYON.stream = null; } }
  function tryonClose() { tryonStop(); TRYON.mode = null; var root = $('#tryon'); if (root) root.classList.remove('open'); BODY.classList.remove('ast-open'); }
  function tryonFromFile(file) {
    tryonStop(); TRYON.mode = 'image'; var video = $('#tryon-video'), canvas = $('#tryon-canvas'); video.style.display = 'none'; tryonStatus('Fotoğraf işleniyor…');
    var im = new Image(); im.onload = function () {
      var W = Math.min(1280, im.width), H = Math.round(im.height * W / im.width); canvas.width = W; canvas.height = H; TRYON.photo = im;
      tryonLoad().then(function (lm) { lm.setOptions({ runningMode: 'IMAGE' }); var tmp = document.createElement('canvas'); tmp.width = W; tmp.height = H; tmp.getContext('2d').drawImage(im, 0, 0, W, H); var r = lm.detect(tmp); TRYON.lastLm = (r.faceLandmarks && r.faceLandmarks[0]) || null; tryonStatus(TRYON.lastLm ? '' : 'Fotoğrafta yüz bulunamadı; yüzün karşıdan göründüğü bir fotoğraf deneyin.'); tryonDrawImage(); track('sanal_deneme_foto', { model: TRYON.code, yuz: TRYON.lastLm ? 'evet' : 'hayir' }); });
    }; im.src = URL.createObjectURL(file);
  }
  function tryonDrawImage() { var canvas = $('#tryon-canvas'); if (!canvas || !TRYON.photo) return; tryonDraw(canvas, TRYON.photo, TRYON.lastLm, false); }
  function tryonDraw(canvas, src, lms, mirror) {
    var ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
    ctx.save(); ctx.clearRect(0, 0, W, H);
    if (mirror) { ctx.translate(W, 0); ctx.scale(-1, 1); }
    ctx.drawImage(src, 0, 0, W, H);
    if (lms && TRYON.ready && TRYON.model) {
      var L = lms[468] || lms[133], R = lms[473] || lms[362]; // iris merkezleri
      var lx = L.x * W, ly = L.y * H, rx = R.x * W, ry = R.y * H;
      var ipd = Math.hypot(rx - lx, ry - ly), pxPerMm = ipd / 63;
      var m = TRYON.model, wmm = 2 * (m.lens || 52) + (m.bridge || 18) + 10;
      var dw = wmm * pxPerMm * TRYON.scaleAdj, dh = dw * TRYON.img.height / TRYON.img.width;
      var cx = (lx + rx) / 2, cy = (ly + ry) / 2, ang = Math.atan2(ry - ly, rx - lx);
      // yüz dönüşü (yaw) için hafif genişlik düzeltmesi: yanak noktaları 234/454
      var cl = lms[234], cr = lms[454]; var yaw = cl && cr ? Math.abs((cl.x + cr.x) / 2 - lms[1].x) * 3 : 0;
      ctx.translate(cx, cy); ctx.rotate(ang); ctx.scale(Math.max(.75, 1 - yaw), 1);
      ctx.drawImage(TRYON.img, -dw / 2, -dh * 0.5, dw, dh);
      if (mirror && !TRYON._ok) { TRYON._ok = true; tryonStatus(''); }
    } else if (mirror && TRYON._ok) { TRYON._ok = false; tryonStatus('Yüz aranıyor…'); }
    ctx.restore();
  }
  function tryonShot() {
    var canvas = $('#tryon-canvas'); if (!canvas) return;
    track('sanal_deneme_foto_cek', { model: TRYON.code });
    canvas.toBlob(function (blob) {
      var file = new File([blob], 'arikan-' + TRYON.code + '-deneme.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: brandInfo(TRYON.model).name + ' ' + TRYON.code }).catch(function () { }); return; }
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
    }, 'image/png');
  }

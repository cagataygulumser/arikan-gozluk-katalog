  /* ---------- bayi talep listesi / formu ---------- */
  var ORDER_KEY = 'ao_order_v1';
  function orderGet() { try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '[]'); } catch (e) { return []; } }
  function orderSet(list) { try { localStorage.setItem(ORDER_KEY, JSON.stringify(list)); } catch (e) { } orderBadge(); }
  function orderAdd(code, variant, qty) {
    var list = orderGet(), hit = list.filter(function (x) { return x.code === code && x.variant === variant; })[0];
    if (hit) hit.qty += (qty || 1); else list.push({ code: code, variant: variant || '', qty: qty || 1 });
    orderSet(list); track('talep_ekle', { model: code, renk: variant || '' });
    return list;
  }
  function orderBadge() { var n = orderGet().reduce(function (a, x) { return a + x.qty; }, 0); $$('[data-order-count]').forEach(function (el) { el.textContent = n ? n : ''; el.style.display = n ? '' : 'none'; }); }
  function orderPageUrl() { var a = $('a[href*="bayi-talep"]'); return a ? a.getAttribute('href') : '/p/bayi-talep-formu.html'; }
  // model sayfasına "Talep listesine ekle" düğmesi
  function initOrderButton() {
    var art = $('.model'), cta = $('.model .cta'); if (!art || !cta) return;
    var code = art.getAttribute('data-code');
    var b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn--ghost order-add'; b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 5h12v2H3zm0 6h12v2H3zm0 6h8v2H3zm15-5v-3h2v3h3v2h-3v3h-2v-3h-3v-2z"/></svg><span>Talep listesine ekle</span>';
    cta.appendChild(b);
    var note = document.createElement('div'); note.className = 'order-note'; cta.parentNode.insertBefore(note, cta.nextSibling);
    b.addEventListener('click', function () {
      var act = $('.color-btn.active'); var v = act ? (act.getAttribute('data-code') || '') : '';
      var list = orderAdd(code, v, 1); var n = list.reduce(function (a, x) { return a + x.qty; }, 0);
      note.innerHTML = '<b>' + esc(code + (v ? ' · ' + v : '')) + '</b> listeye eklendi. Listede ' + n + ' adet var · <a href="' + esc(orderPageUrl()) + '">Talep formuna git</a>';
      b.classList.add('done'); setTimeout(function () { b.classList.remove('done'); }, 1200);
    });
  }
  function initOrder() {
    var root = $('#order-tool'); if (!root) return;
    root.innerHTML = '<div class="skeleton">Yükleniyor</div>';
    var OC = CFG.order || {};
    Promise.all([ready(), fetchJSON(dataUrl('tr-map.json')).catch(function () { return { cities: [] }; })]).then(function (r) {
      root.classList.remove('skeleton');
      var cities = (r[1].cities || []).map(function (c) { return c.n; }).sort(function (a, b) { return a.localeCompare(b, 'tr'); });
      var info = {}; try { info = JSON.parse(localStorage.getItem('ao_dealer_info') || '{}'); } catch (e) { }
      function variantsOf(m) { return m.variants.map(function (v) { return v.code; }); }
      function lineText(x) { var m = modelByCode(x.code); if (!m) return x.code; var v = m.variants.filter(function (vv) { return vv.code === x.variant; })[0]; var col = v && v.attrs && v.attrs.frame_color ? ' ' + v.attrs.frame_color : ''; return brandInfo(m).name + ' ' + m.code + (x.variant ? ' · ' + x.variant + col : ' · renk seçilmedi') + ' · ' + x.qty + ' adet'; }
      function message() {
        var list = orderGet();
        var head = 'ARIKAN OPTİK · BAYİ TALEBİ\n' + (info.magaza || '-') + ' / ' + (info.yetkili || '-') + ' / ' + (info.telefon || '-') + ' / ' + (info.il || '-') + '\n\n';
        return head + list.map(function (x, i) { return (i + 1) + ') ' + lineText(x); }).join('\n') + (info.not ? '\n\nNot: ' + info.not : '');
      }
      function render() {
        var list = orderGet(), total = list.reduce(function (a, x) { return a + x.qty; }, 0);
        root.innerHTML = '<div class="order">' +
          '<section class="order__sec"><h3>1 · Modeller</h3><p class="order__hint">Model kodu ya da ifade yazıp listeye ekleyin; model sayfalarındaki "Talep listesine ekle" düğmesi de buraya düşer.</p>' +
          '<div class="order__search"><input id="order-q" type="search" placeholder="Model kodu ya da &quot;mavi clip-on&quot;" autocomplete="off"><div class="order__suggest" id="order-suggest"></div></div>' +
          (list.length ? '<table class="order__table"><thead><tr><th></th><th>Model</th><th>Renk</th><th>Adet</th><th></th></tr></thead><tbody>' + list.map(function (x, i) {
            var m = modelByCode(x.code); if (!m) return '';
            return '<tr data-i="' + i + '"><td><img src="' + esc(frontOf(m)) + '" alt=""></td><td><b>' + esc(brandInfo(m).name) + ' ' + esc(m.code) + '</b><small>' + esc(catLabel(m)) + ' · ' + esc(dimStr(m)) + '</small></td>' +
              '<td><select data-k="variant"><option value="">Renk seçin</option>' + m.variants.map(function (v) { return '<option value="' + esc(v.code) + '"' + (v.code === x.variant ? ' selected' : '') + '>' + esc(v.code + (v.attrs.frame_color ? ' · ' + v.attrs.frame_color : '')) + '</option>'; }).join('') + '</select></td>' +
              '<td><input data-k="qty" type="number" min="1" max="999" value="' + x.qty + '"></td><td><button class="order__rm" data-rm="' + i + '" aria-label="Kaldır">&#10005;</button></td></tr>';
          }).join('') + '</tbody></table><p class="order__total">Toplam <b>' + total + '</b> adet · ' + list.length + ' kalem</p>' : '<div class="empty"><b>Liste boş</b>Yukarıdan model ekleyin.</div>') + '</section>' +
          '<section class="order__sec"><h3>2 · Bayi bilgileri</h3><div class="order__form">' +
          '<label>Mağaza adı<input data-f="magaza" value="' + esc(info.magaza || '') + '" required></label>' +
          '<label>Yetkili kişi<input data-f="yetkili" value="' + esc(info.yetkili || '') + '"></label>' +
          '<label>Telefon<input data-f="telefon" type="tel" value="' + esc(info.telefon || '') + '" required></label>' +
          '<label>İl<input data-f="il" list="order-cities" value="' + esc(info.il || '') + '"><datalist id="order-cities">' + cities.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist></label>' +
          '<label class="order__wide">Not<textarea data-f="not" rows="2">' + esc(info.not || '') + '</textarea></label></div></section>' +
          '<section class="order__sec order__send"><h3>3 · Gönder</h3><div class="order__btns"><a class="btn btn--dark" id="order-wa" href="#" rel="noopener" target="_blank">WhatsApp ile gönder</a>' + (OC.form ? '<button class="btn btn--red" id="order-send" type="button">Talebi gönder</button>' : '') + '<button class="btn btn--ghost" id="order-clear" type="button">Listeyi temizle</button></div><p class="order__msg" id="order-msg"></p><p class="order__legal">Göndererek <a href="/p/gizlilik-ve-kvkk.html">Gizlilik ve KVKK metnini</a> kabul etmiş olursunuz.</p></section></div>';
        // etkileşimler
        var inp = $('#order-q', root), sug = $('#order-suggest', root);
        inp.addEventListener('input', function () {
          var q = inp.value.trim(); if (q.length < 2) { sug.innerHTML = ''; return; }
          var res = searchModels(q).slice(0, 6);
          sug.innerHTML = res.map(function (m) { return '<button type="button" data-add="' + esc(m.code) + '"><img src="' + esc(frontOf(m)) + '" alt=""><span><b>' + esc(m.code) + '</b><small>' + esc(brandInfo(m).name + ' · ' + catLabel(m)) + '</small></span><em>+ Ekle</em></button>'; }).join('');
          $$('[data-add]', sug).forEach(function (b) { b.addEventListener('click', function () { orderAdd(b.getAttribute('data-add'), '', 1); render(); $('#order-q', root).focus(); }); });
        });
        inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); var m = findExact(inp.value.trim()); if (m) { orderAdd(m.code, variantHash(inp.value.trim(), m).replace('#', '').replace('-', '.'), 1); render(); } else { var f = $('[data-add]', sug); if (f) f.click(); } } });
        $$('tr[data-i]', root).forEach(function (tr) {
          var i = +tr.getAttribute('data-i');
          $('[data-k=variant]', tr).addEventListener('change', function (e) { var l = orderGet(); l[i].variant = e.target.value; orderSet(l); });
          $('[data-k=qty]', tr).addEventListener('change', function (e) { var l = orderGet(); l[i].qty = Math.max(1, parseInt(e.target.value, 10) || 1); orderSet(l); render(); });
        });
        $$('[data-rm]', root).forEach(function (b) { b.addEventListener('click', function () { var l = orderGet(); l.splice(+b.getAttribute('data-rm'), 1); orderSet(l); render(); }); });
        $$('[data-f]', root).forEach(function (el) { el.addEventListener('input', function () { info[el.getAttribute('data-f')] = el.value; try { localStorage.setItem('ao_dealer_info', JSON.stringify(info)); } catch (e) { } }); });
        var wa = $('#order-wa', root);
        wa.addEventListener('click', function (e) {
          if (!orderGet().length) { e.preventDefault(); msg('Önce listeye model ekleyin.', true); return; }
          wa.href = 'https://wa.me/' + (OC.whatsapp || CFG.whatsapp) + '?text=' + encodeURIComponent(message());
          track('talep_gonder', { kanal: 'whatsapp', kalem: orderGet().length, il: info.il || '' });
        });
        $('#order-clear', root).addEventListener('click', function () { if (confirm('Liste temizlensin mi?')) { orderSet([]); render(); } });
        var send = $('#order-send', root);
        if (send) send.addEventListener('click', function () {
          var list = orderGet();
          if (!list.length) { msg('Önce listeye model ekleyin.', true); return; }
          if (!info.magaza || !info.telefon) { msg('Mağaza adı ve telefon zorunlu.', true); return; }
          send.disabled = true; send.textContent = 'Gönderiliyor…';
          var fd = new FormData(), F = OC.fields || {};
          var vals = { magaza: info.magaza, yetkili: info.yetkili || '', telefon: info.telefon, il: info.il || '', liste: list.map(lineText).join('\n'), not: info.not || '', site: location.host };
          Object.keys(F).forEach(function (k) { if (vals[k] != null) fd.append(F[k], vals[k]); });
          fetch(OC.form, { method: 'POST', mode: 'no-cors', body: fd }).then(function () {
            track('talep_gonder', { kanal: 'form', kalem: list.length, adet: list.reduce(function (a, x) { return a + x.qty; }, 0), il: info.il || '' });
            orderSet([]); render(); msg('Talebiniz iletildi. Teşekkürler — en kısa sürede sizinle iletişime geçilecek.', false);
          }).catch(function () { send.disabled = false; send.textContent = 'Talebi gönder'; msg('Gönderilemedi. Lütfen WhatsApp ile gönderin.', true); });
        });
      }
      function msg(t, err) { var el = $('#order-msg', root); if (el) { el.textContent = t; el.className = 'order__msg' + (err ? ' err' : ' ok'); } }
      render();
    });
  }

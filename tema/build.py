#!/usr/bin/env python3
"""Tema XML'ini birleştirir (CSS+JS) ve Blogger etiketlerini yorumlayarak önizleme HTML'leri üretir."""
import re, os, json, html, sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.abspath(__file__))
css = open(f'{ROOT}/theme/skin.css', encoding='utf-8').read()
js = open(f'{ROOT}/theme/app.js', encoding='utf-8').read()
js = js.replace('/* {{I18N}} */', open(f'{ROOT}/theme/i18n.js', encoding='utf-8').read())
js = js.replace('/* {{SEARCH}} */', open(f'{ROOT}/theme/search.js', encoding='utf-8').read())
js = js.replace('/* {{ORDER}} */', open(f'{ROOT}/theme/order.js', encoding='utf-8').read())
js = js.replace('/* {{ASSISTANT}} */', open(f'{ROOT}/theme/assistant.js', encoding='utf-8').read())
tpl = open(f'{ROOT}/theme/template.xml', encoding='utf-8').read()
assert ']]>' not in css and ']]>' not in js
import time
js = js.replace('{{STAMP}}', time.strftime('%Y%m%d%H%M'))
theme = tpl.replace('{{CSS}}', css).replace('{{JS}}', js)
os.makedirs(f'{ROOT}/out', exist_ok=True)
open(f'{ROOT}/out/arikan-optik-tema.xml', 'w', encoding='utf-8').write(theme)
# XML geçerlilik
ET.fromstring(theme.encode('utf-8'))
print('tema XML geçerli:', len(theme) // 1024, 'KB')

# ------------------------------------------------------------------ önizleme
PREVIEW = '--preview' in sys.argv
if not PREVIEW:
    sys.exit(0)
B = '{http://www.google.com/2005/gml/b}'
EX = '{http://www.google.com/2005/gml/expr}'
D = '{http://www.google.com/2005/gml/data}'
XH = '{http://www.w3.org/1999/xhtml}'
models = json.load(open(f'{ROOT}/data/models.json', encoding='utf-8'))['models']
pages = json.load(open(f'{ROOT}/out/pages.json', encoding='utf-8'))
BASE = 'http://localhost:8765/arikan/'
LOCAL_CDN = BASE + 'repo/'
posts_map = {m['code']: BASE + 'out/preview/post-' + m['slug'] + '.html' for m in models}

def slugify(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower().replace('ç', 'c').replace('ğ', 'g').replace('ı', 'i').replace('ö', 'o').replace('ş', 's').replace('ü', 'u')).strip('-')

def evaluate(expr, ctx):
    expr = html.unescape(expr.strip())
    if expr.startswith('(') and expr.endswith(')'):
        expr = expr[1:-1].strip()
    # birleştirme
    if ' + ' in expr:
        return ''.join(str(evaluate(p, ctx)) for p in expr.split(' + '))
    if expr.startswith('"') and expr.endswith('"'):
        return expr[1:-1]
    if ' and ' in expr:
        return all(evaluate(p, ctx) for p in expr.split(' and '))
    m = re.match(r'(data:\S+)\s+any\s*\(\s*\w+\s*=>\s*\w+\.name\s*==\s*"([^"]+)"\s*\)', expr)
    if m:
        return any(l.get('name') == m.group(2) for l in (evaluate(m.group(1), ctx) or []))
    m = re.match(r'(data:\S+)\s*(&lt;|<|lt)\s*(\d+)', expr)
    if m:
        return int(evaluate(m.group(1), ctx) or 0) < int(m.group(3))
    if expr.startswith('data:'):
        path = expr[5:].split('.')
        cur = ctx
        for p in path:
            if isinstance(cur, dict) and p in cur:
                cur = cur[p]
            else:
                return ''
        return cur
    return expr

def render(el, ctx, out):
    tag = el.tag
    if tag == B + 'skin':
        out.append('<style>' + (el.text or '') + '</style>')
        return
    if tag in (B + 'include', B + 'widget-settings'):
        return
    if tag == B + 'attr':
        v = el.get(EX + 'value') or el.get('value')
        ctx['_attrs'].append((el.get('name'), evaluate(v, ctx) if el.get(EX + 'value') else v))
        return
    if tag == B + 'if':
        branches, cur = [], [el.get('cond'), []]
        for ch in el:
            if ch.tag == B + 'elseif':
                branches.append(cur); cur = [ch.get('cond'), []]
            elif ch.tag == B + 'else':
                branches.append(cur); cur = [None, []]
            else:
                cur[1].append(ch)
        branches.append(cur)
        # metin düğümleri: ElementTree'de koşul dallarının text'i karmaşık; sadece alt elemanları işliyoruz
        for cond, kids in branches:
            if cond is None or evaluate(cond, ctx):
                for k in kids:
                    render(k, ctx, out); out.append(k.tail or '')
                return
        return
    if tag == B + 'loop':
        values = evaluate(el.get('values'), ctx) or []
        var = el.get('var'); idx = el.get('index')
        for i, v in enumerate(values):
            c2 = dict(ctx); c2[var] = v
            if idx: c2[idx] = i
            for k in el:
                render(k, ctx=c2, out=out); out.append(k.tail or '')
        return
    if tag.startswith(D):
        val = str(evaluate('data:' + tag[len(D):], ctx))
        out.append(val if tag.endswith('.body') or tag.endswith('}post.body') else html.escape(val, quote=False)); return
    if tag == B + 'includable':
        if el.get('id') != 'main': return
    if tag in (B + 'section', B + 'widget', B + 'includable'):
        out.append(el.text or '')
        for k in el:
            render(k, ctx, out); out.append(k.tail or '')
        return
    # normal HTML elemanı
    name = tag.replace(XH, '')
    ctx['_attrs'] = []
    attrs = []
    for k, v in el.attrib.items():
        if k.startswith(EX):
            attrs.append((k[len(EX):], str(evaluate(v, ctx))))
        elif k.startswith(B) or k.startswith(D):
            continue
        else:
            attrs.append((k, v))
    inner = []
    inner.append(el.text or '')
    saved = ctx['_attrs']
    for k in el:
        render(k, ctx, inner); inner.append(k.tail or '')
    attrs += saved
    ctx['_attrs'] = []
    a = ''.join(f' {k}="{html.escape(str(v), quote=True)}"' for k, v in attrs)
    if name == 'script' and el.text:
        out.append(f'<{name}{a}>' + (el.text or '') + '</script>')
        return
    if name in ('br', 'img', 'meta', 'link', 'input', 'hr', 'source'):
        out.append(f'<{name}{a}>'); return
    out.append(f'<{name}{a}>' + ''.join(inner) + f'</{name}>')

def page(view, **kw):
    root = ET.fromstring(theme.encode('utf-8'))
    ctx = {'_attrs': [], 'view': {'isHomepage': view == 'home', 'isPost': view == 'post', 'isPage': view == 'page', 'isError': False,
                                   'isLabelSearch': view == 'label', 'isSearch': view in ('search', 'all'), 'isSingleItem': view in ('post', 'page'),
                                   'search': {'label': kw.get('label', ''), 'query': kw.get('query', '')}},
           'blog': {'title': 'Arıkan Optik', 'homepageUrl': BASE + 'out/preview/home.html', 'pageName': kw.get('title', ''), 'pageTitle': 'Arıkan Optik', 'postImageUrl': ''},
           'title': 'Arıkan Optik', 'image': '', 'posts': kw.get('posts', [])}
    out = ['<!DOCTYPE html>']
    render(root, ctx, out)
    h = ''.join(out)
    h = h.replace('<html', '<html lang="tr"', 1)
    # yerel önizleme ayarları
    h = h.replace("cdn: 'https://cdn.jsdelivr.net/gh/cagataygulumser/arikan-gozluk-katalog@main/',",
                  f"cdn: '{LOCAL_CDN}', posts: {json.dumps(posts_map)},")
    h = h.replace('https://cdn.jsdelivr.net/gh/cagataygulumser/arikan-gozluk-katalog@main/', LOCAL_CDN)
    h = h.replace("href='/search/label/", f"href='{BASE}out/preview/label-").replace('href="/search/label/', f'href="{BASE}out/preview/label-')
    h = re.sub(r"(out/preview/label-)([^'\"]+)", lambda m: m.group(1) + slugify(html.unescape(m.group(2).replace('%20', ' '))) + '.html', h)
    h = h.replace("href='/search'", f"href='{BASE}out/preview/all.html'").replace('href="/search"', f'href="{BASE}out/preview/all.html"')
    h = re.sub(r"href=(['\"])/p/([a-z0-9-]+)\.html", lambda m: f"href={m.group(1)}{BASE}out/preview/page-{m.group(2)}.html", h)
    return h

os.makedirs(f'{ROOT}/out/preview', exist_ok=True)
W = lambda n, s: open(f'{ROOT}/out/preview/{n}.html', 'w', encoding='utf-8').write(s)
W('home', page('home'))
W('all', page('all'))
for lab in ['Lee Cooper', 'Quantum', 'Slazenger', 'Belmond', 'Optik', 'Clip-On', 'Yeni', 'Polarize', 'Metal', 'Asetat', 'Titanyum', 'TR90']:
    W('label-' + slugify(lab), page('label', label=lab))
for m in models:
    body = open(f'{ROOT}/out/posts/{m["slug"]}.html', encoding='utf-8').read()
    labels = [m['brand'], m['category']]
    W('post-' + m['slug'], page('post', title=m['code'], posts=[{'title': m['brand'] + ' ' + m['code'], 'body': body, 'url': '#', 'labels': [{'name': l, 'url': BASE + 'out/preview/label-' + slugify(l) + '.html'} for l in labels]}]))
for t, body in pages.items():
    W('page-' + slugify(t), page('page', title=t, posts=[{'title': t, 'body': body, 'url': '#', 'labels': []}]))
print('önizleme hazır: out/preview/')

// Eldo — shared persistent quote bar + modal (for pages without the catalog: index, garancija, o-nama)
// Reads the same 'eldo-quote' localStorage key used by proizvodi.html. Matches proizvodi.html modal design.
(function () {
  'use strict';
  var KEY = 'eldo-quote';
  var LEN_KEY = 'eldo-quote-len';

  function getQuote() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function setQuote(arr) { try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {} }
  function getLengths() { try { return JSON.parse(localStorage.getItem(LEN_KEY) || '{}'); } catch (e) { return {}; } }
  function setLengths(o) { try { localStorage.setItem(LEN_KEY, JSON.stringify(o)); } catch (e) {} }
  function fmt(n) { return (n || 0).toLocaleString('sr-RS'); }

  var catalog = null;
  function resolve(id) { return catalog ? catalog.find(function (p) { return p.id === id; }) : null; }
  function itemLength(p) { if (!p || !p.pricePerCm) return null; var L = getLengths(); return L[p.id] || p.defaultLength || 100; }
  function itemPrice(p) { if (!p) return 0; if (p.pricePerCm) return p.pricePerCm * itemLength(p); return p.price || 0; }
  function clampLen(v) { v = parseInt(v, 10) || 0; return Math.min(600, Math.max(20, v)); }

  function injectStyles() {
    if (document.getElementById('eldo-qb-styles')) return;
    var css = document.createElement('style');
    css.id = 'eldo-qb-styles';
    css.textContent = [
      '.eqb{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(160%);z-index:140;display:flex;align-items:center;gap:16px;padding:10px 12px 10px 22px;background:var(--bg2,#161b25);border:1px solid var(--copper-soft-bd,rgba(217,119,87,.25));border-radius:999px;box-shadow:0 20px 50px hsla(225,40%,4%,.4),0 0 0 1px var(--copper-glow-30,rgba(217,119,87,.2));transition:transform .45s cubic-bezier(.65,0,.35,1);max-width:92vw;}',
      '.eqb.show{transform:translateX(-50%) translateY(0);}',
      '.eqb-info{display:flex;flex-direction:column;gap:1px;min-width:0;}',
      '.eqb-count{font-size:.875rem;font-weight:700;color:var(--fg,#e3e6ec);white-space:nowrap;}',
      '.eqb-count strong{color:var(--copper-lt,#e88c58);}',
      '.eqb-meta{font-size:.6875rem;color:var(--fg-muted,#8a92a3);letter-spacing:.04em;white-space:nowrap;}',
      '.eqb-actions{display:flex;gap:6px;flex-shrink:0;}',
      '.eqb-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 16px;border-radius:999px;font:600 .8125rem/1 Inter,sans-serif;cursor:pointer;border:1px solid transparent;text-decoration:none;transition:all .2s;}',
      '.eqb-btn svg{width:14px;height:14px;}',
      '.eqb-sec{background:transparent;color:var(--fg-muted,#8a92a3);border-color:var(--border,#2a313d);}',
      '.eqb-sec:hover{color:var(--fg,#e3e6ec);border-color:var(--border-strong,#3a4150);}',
      '.eqb-pri{background:linear-gradient(135deg,hsl(30,72%,52%),hsl(30,72%,46%));color:#fff;box-shadow:0 4px 14px var(--copper-glow-40,rgba(217,119,87,.25));}',
      '.eqb-pri:hover{transform:translateY(-1px);filter:brightness(1.05);}',
      'html[data-theme="light"] .eqb-pri{color:#1c2030;}',
      '.eqb-modal{position:fixed;inset:0;z-index:240;background:hsla(225,40%,4%,.8);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:24px;}',
      '.eqb-modal.open{display:flex;}',
      '.eqb-card{background:var(--bg2,#161b25);border:1px solid var(--border,#2a313d);border-radius:18px;max-width:540px;width:100%;padding:28px;max-height:88vh;overflow-y:auto;}',
      '.eqb-card h3{font-family:Cormorant Garamond,serif;font-size:1.625rem;font-weight:500;color:var(--white,#fff);margin:0 0 4px;display:flex;align-items:center;gap:10px;}',
      '.eqb-card h3::before{content:"";width:30px;height:30px;border-radius:8px;flex-shrink:0;background:linear-gradient(135deg,hsl(30,72%,52%),hsl(30,72%,46%));-webkit-mask:url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-.6 3h13M9 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>\') center / 18px no-repeat;mask:url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-.6 3h13M9 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>\') center / 18px no-repeat;}',
      '.eqb-card .sub{font-size:.875rem;color:var(--fg-muted,#8a92a3);margin:0 0 22px;}',
      '.eqb-items{list-style:none;display:flex;flex-direction:column;gap:8px;margin:0 0 22px;padding:2px;max-height:320px;overflow-y:auto;overflow-x:hidden;}',
      '.eqb-item{display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--bg3,#1c2230);border:1px solid var(--border,#2a313d);border-radius:12px;font-size:.875rem;transition:border-color .18s ease;}',
      '.eqb-item:hover{border-color:var(--copper-soft-bd,rgba(217,119,87,.4));}',
      '.eqb-item img{width:42px;height:42px;object-fit:contain;border:1px solid var(--border,#2a313d);border-radius:8px;padding:3px;background:var(--bg2,#161b25);flex-shrink:0;}',
      '.eqb-item .nm{flex:1;color:var(--fg,#e3e6ec);font-weight:500;min-width:0;}',
      '.eqb-item .pr{color:var(--copper-lt,#e88c58);font-weight:700;white-space:nowrap;font-size:.8125rem;}',
      '.eqb-item .rm{width:24px;height:24px;border:0;background:transparent;color:var(--fg-muted,#8a92a3);cursor:pointer;border-radius:6px;flex-shrink:0;}',
      '.eqb-item .rm:hover{color:hsl(0,60%,60%);}',
      // length stepper (matches proizvodi .qi-len)
      '.eqb-len{display:inline-flex;align-items:center;margin:0 0 0 16px;vertical-align:middle;background:var(--bg2,#161b25);border:1px solid var(--border,#2a313d);border-radius:8px;overflow:hidden;}',
      '.eqb-len button{width:26px;height:26px;border:0;background:transparent;color:var(--copper-lt,#e88c58);font-size:1.05rem;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;}',
      '.eqb-len button:hover{background:var(--copper-glow-12,rgba(196,124,74,.12));}',
      '.eqb-len input{width:44px;text-align:center;border:0;border-left:1px solid var(--border,#2a313d);border-right:1px solid var(--border,#2a313d);background:transparent;color:var(--fg,#e3e6ec);padding:4px 2px;font-family:inherit;font-size:.8rem;font-weight:700;-moz-appearance:textfield;}',
      '.eqb-len input::-webkit-outer-spin-button,.eqb-len input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}',
      '.eqb-len .u{font-size:.7rem;color:var(--fg-muted,#8a92a3);padding:0 8px 0 6px;font-weight:600;}',
      '.eqb-total{display:flex;justify-content:space-between;align-items:baseline;padding-top:14px;border-top:1px solid var(--border,#2a313d);margin-bottom:22px;}',
      '.eqb-total .lbl{color:var(--fg-muted,#8a92a3);font-size:.875rem;}',
      '.eqb-total .val{color:var(--copper-lt,#e88c58);font-weight:700;font-size:1.25rem;}',
      // utility row (PDF + share)
      '.eqb-utils{display:flex;gap:8px;margin-bottom:12px;padding-bottom:14px;border-bottom:1px solid var(--border,#2a313d);}',
      '.eqb-util{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 12px;border-radius:10px;background:var(--bg3,#1c2230);border:1px solid var(--border,#2a313d);color:var(--fg,#e3e6ec);font:600 .82rem/1 Inter,sans-serif;cursor:pointer;transition:border-color .2s,background .2s,color .2s;}',
      '.eqb-util svg{width:16px;height:16px;color:var(--copper-lt,#e88c58);flex-shrink:0;}',
      '.eqb-util:hover{border-color:var(--copper-soft-bd,rgba(217,119,87,.4));}',
      '.eqb-util.copied{border-color:hsla(140,50%,50%,.5);color:hsl(140,55%,52%);}',
      '.eqb-util.copied svg{color:hsl(140,55%,52%);}',
      '.eqb-modal-actions{display:flex;gap:8px;flex-wrap:wrap;}',
      '.eqb-modal-actions a,.eqb-modal-actions button{flex:1;min-width:140px;justify-content:center;}',
      '.eqb-empty{color:var(--fg-muted,#8a92a3);font-size:.9rem;text-align:center;padding:20px 0;}',
      '@media(max-width:560px){.eqb{left:12px;right:12px;bottom:12px;transform:translateY(160%);max-width:none;gap:10px;padding:10px 14px;}.eqb.show{transform:translateY(0);}.eqb-utils{flex-direction:column;}}'
    ].join('\n');
    document.head.appendChild(css);
  }

  function buildDOM() {
    if (document.getElementById('eldoQuoteBar')) return;
    var bar = document.createElement('div');
    bar.className = 'eqb';
    bar.id = 'eldoQuoteBar';
    bar.innerHTML =
      '<div class="eqb-info"><div class="eqb-count"><strong id="eqbCount">0</strong> proizvoda u ponudi</div><div class="eqb-meta" id="eqbTotal">0 RSD</div></div>' +
      '<div class="eqb-actions">' +
        '<button type="button" class="eqb-btn eqb-sec" id="eqbClear">Obriši</button>' +
        '<button type="button" class="eqb-btn eqb-pri" id="eqbView"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-.6 3h13M9 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm10 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>Pošalji upit</button>' +
      '</div>';
    document.body.appendChild(bar);

    var modal = document.createElement('div');
    modal.className = 'eqb-modal';
    modal.id = 'eldoQuoteModal';
    modal.innerHTML =
      '<div class="eqb-card">' +
        '<h3>Vaša ponuda</h3>' +
        '<p class="sub">Vaša izabrana lista elemenata. Pošaljite je nama i dogovaramo termin besplatnog merenja i izrade konačne ponude.</p>' +
        '<ul class="eqb-items" id="eqbItems"></ul>' +
        '<div class="eqb-total"><span class="lbl">Ukupno orijentaciono</span><span class="val" id="eqbModalTotal">0 RSD</span></div>' +
        '<div class="eqb-utils">' +
          '<button type="button" class="eqb-util" id="eqbPdf"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15l3 3 3-3"/></svg>Preuzmi PDF</button>' +
          '<button type="button" class="eqb-util" id="eqbShare"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/></svg><span id="eqbShareText">Kopiraj link</span></button>' +
        '</div>' +
        '<div class="eqb-modal-actions">' +
          '<button type="button" class="eqb-btn eqb-sec" id="eqbClose">Zatvori</button>' +
          '<a href="#" class="eqb-btn eqb-pri" id="eqbViber"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.7 6.7.633 9.817c-.063 3.115-.139 8.951 5.487 10.535v2.418s-.038.978.606 1.177c.778.243 1.235-.5 1.978-1.3.408-.44.97-1.086 1.395-1.58 3.849.323 6.807-.418 7.143-.527.776-.252 5.171-.816 5.886-6.652.738-6.017-.36-9.823-2.34-11.543l-.012-.005c-.6-.55-3.005-2.302-8.375-2.321 0 0-.395-.025-1.001-.018zm.062 1.717c.515-.005.855.018.855.018 4.541.014 6.71 1.382 7.22 1.842 1.674 1.434 2.53 4.864 1.905 9.897-.599 4.876-4.16 5.184-4.817 5.394-.28.09-2.926.747-6.246.531 0 0-2.473 2.985-3.247 3.762-.12.122-.262.17-.358.144-.135-.034-.172-.193-.17-.428l.02-4.011c-4.756-1.32-4.478-6.289-4.425-8.892.054-2.6.546-4.73 1.996-6.16 1.961-1.769 5.474-2.036 7.114-2.082z"/></svg>Pošalji na Viber</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    document.getElementById('eqbClear').addEventListener('click', function () { setQuote([]); update(); });
    document.getElementById('eqbView').addEventListener('click', openModal);
    document.getElementById('eqbClose').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

    // Length stepper events (delegated)
    var itemsEl = document.getElementById('eqbItems');
    itemsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.eqb-len button');
      if (b) {
        var p = resolve(b.dataset.id); if (!p) return;
        var v = clampLen(itemLength(p) + (b.dataset.act === 'inc' ? 1 : -1));
        var L = getLengths(); L[p.id] = v; setLengths(L);
        openModal(); update(); return;
      }
      var rm = e.target.closest('.rm');
      if (rm) {
        var arr = getQuote(); var idx = arr.indexOf(rm.dataset.id);
        if (idx !== -1) { arr.splice(idx, 1); setQuote(arr); }
        update(); openModal();
      }
    });
    itemsEl.addEventListener('change', function (e) {
      var inp = e.target.closest('.eqb-len input'); if (!inp) return;
      var p = resolve(inp.dataset.id); if (!p) return;
      var v = clampLen(inp.value);
      var L = getLengths(); L[p.id] = v; setLengths(L);
      openModal(); update();
    });

    // Share
    document.getElementById('eqbShare').addEventListener('click', function () {
      var q = getQuote(); if (!q.length) return;
      var url = location.origin + location.pathname.replace(/[^/]*$/, '') + 'proizvodi.html?ponuda=' + encodeURIComponent(q.join(','));
      var btn = this, txt = document.getElementById('eqbShareText');
      var show = function () { btn.classList.add('copied'); txt.textContent = 'Link kopiran!'; setTimeout(function () { btn.classList.remove('copied'); txt.textContent = 'Kopiraj link'; }, 2200); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(show).catch(function () { fallbackCopy(url, show); });
      else fallbackCopy(url, show);
    });
    // PDF
    document.getElementById('eqbPdf').addEventListener('click', exportPdf);
  }

  function fallbackCopy(text, cb) {
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); cb && cb(); } catch (e) {}
    document.body.removeChild(ta);
  }

  function exportPdf() {
    var q = getQuote(); var items = q.map(resolve).filter(Boolean);
    if (!items.length) return;
    var total = 0;
    var rows = items.map(function (p, i) {
      var price = itemPrice(p); total += price;
      var lenTxt = p.pricePerCm ? itemLength(p) + ' cm × ' + p.pricePerCm + ' din/cm' : [p.width, p.depth, p.height].filter(Boolean).join('×') + ' cm';
      return '<tr><td class="num">' + (i + 1) + '</td><td>' + p.name + (lenTxt ? '<span class="dim">' + lenTxt + '</span>' : '') + '</td><td class="price">' + fmt(price) + ' RSD</td></tr>';
    }).join('');
    var logoUrl = new URL('assets/logo.png', location.href).href;
    var today = new Date().toLocaleDateString('sr-RS');
    var html = '<!DOCTYPE html><html lang="sr"><head><meta charset="utf-8"><title>Ponuda — Eldo Design</title><style>' +
      '@page{margin:18mm 16mm;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c2030;line-height:1.5;}' +
      '.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #c47c4a;padding-bottom:16px;margin-bottom:24px;}.head img{height:54px;}.head .meta{text-align:right;font-size:12px;color:#666;}' +
      'h1{font-size:22px;font-weight:700;margin-bottom:4px;}.sub{color:#666;font-size:13px;margin-bottom:22px;}table{width:100%;border-collapse:collapse;font-size:13px;}' +
      'th{text-align:left;border-bottom:1px solid #ccc;padding:8px 6px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#888;}td{padding:10px 6px;border-bottom:1px solid #eee;vertical-align:top;}' +
      'td.num{color:#999;width:28px;}td.price{text-align:right;font-weight:700;color:#c47c4a;white-space:nowrap;}.dim{display:block;font-size:11px;color:#999;margin-top:2px;}' +
      '.total{display:flex;justify-content:space-between;margin-top:18px;padding-top:14px;border-top:2px solid #1c2030;font-size:16px;font-weight:700;}.total .v{color:#c47c4a;}' +
      '.note{margin-top:10px;font-size:11px;color:#999;}.foot{margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:12px;color:#555;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;}.foot b{color:#1c2030;}' +
      '</style></head><body>' +
      '<div class="head"><img src="' + logoUrl + '" alt="Eldo Design"><div class="meta">Ponuda<br>' + today + '</div></div>' +
      '<h1>Vaša ponuda</h1><p class="sub">Orijentaciona lista kuhinjskih elemenata — Eldo Design, Niš</p>' +
      '<table><thead><tr><th></th><th>Proizvod</th><th style="text-align:right">Cena</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="total"><span>Ukupno orijentaciono (' + items.length + ' kom)</span><span class="v">' + fmt(total) + ' RSD</span></div>' +
      '<p class="note">* Cene su orijentacione. Konačna ponuda se pravi nakon besplatnog merenja prostora. Radne ploče i zidne obloge se obračunavaju po dužnom centimetru.</p>' +
      '<div class="foot"><span><b>Eldo Design</b><br>Matejevački put 94, Niš</span><span>Tel: 0611444021<br>eldodesignnis@gmail.com</span><span>eldodesign.rs<br>@eldo_design_namestaj_</span></div>' +
      '</body></html>';
    var w = window.open('', '_blank');
    if (!w) { alert('Dozvolite pop-up prozore da biste preuzeli PDF.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    var img = w.document.querySelector('img');
    var go = function () { try { w.focus(); w.print(); } catch (e) {} };
    if (img && !img.complete) { img.onload = go; img.onerror = go; setTimeout(go, 1200); } else { setTimeout(go, 350); }
  }

  function update() {
    var q = getQuote();
    var bar = document.getElementById('eldoQuoteBar');
    if (!bar) return;
    document.getElementById('eqbCount').textContent = q.length;
    var total = q.reduce(function (s, id) { var p = resolve(id); return s + itemPrice(p); }, 0);
    document.getElementById('eqbTotal').textContent = fmt(total) + ' RSD orijentaciono';
    bar.classList.toggle('show', q.length > 0);
  }

  function openModal() {
    var q = getQuote();
    var list = document.getElementById('eqbItems');
    var total = 0;
    if (!q.length) {
      list.innerHTML = '<li class="eqb-empty">Vaša ponuda je prazna.</li>';
    } else {
      list.innerHTML = q.map(function (id) {
        var p = resolve(id); if (!p) return '';
        var price = itemPrice(p); total += price;
        var lenCtrl = p.pricePerCm
          ? '<span class="eqb-len"><button data-act="dec" data-id="' + p.id + '">−</button><input data-id="' + p.id + '" type="number" min="20" max="600" value="' + itemLength(p) + '"/><span class="u">cm</span><button data-act="inc" data-id="' + p.id + '">+</button></span>'
          : '';
        return '<li class="eqb-item"><img src="' + (p.image || '') + '" alt=""/><span class="nm">' + p.name + lenCtrl + '</span><span class="pr">' + (price ? fmt(price) + ' RSD' : 'Po upitu') + '</span><button class="rm" data-id="' + p.id + '" aria-label="Ukloni"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button></li>';
      }).join('');
    }
    document.getElementById('eqbModalTotal').textContent = fmt(total) + ' RSD';
    var lines = ['Zdravo, želim ponudu za sledeće proizvode:', ''];
    q.forEach(function (id, i) { var p = resolve(id); if (p) { var price = itemPrice(p); var lt = p.pricePerCm ? ' (' + itemLength(p) + ' cm)' : ''; lines.push((i + 1) + '. ' + p.name + lt + (price ? ' — ' + fmt(price) + ' RSD' : '')); } });
    lines.push('', 'Ukupno orijentaciono: ' + fmt(total) + ' RSD');
    document.getElementById('eqbViber').setAttribute('href', 'viber://forward?text=' + encodeURIComponent(lines.join('\n')));
    document.getElementById('eldoQuoteModal').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    document.getElementById('eldoQuoteModal').classList.remove('open');
    document.body.style.overflow = '';
  }

  function init() {
    injectStyles();
    buildDOM();
    fetch('catalog.json').then(function (r) { return r.arrayBuffer(); })
      .then(function (buf) { catalog = JSON.parse(new TextDecoder('utf-8').decode(buf)); update(); })
      .catch(function () { update(); });
    window.addEventListener('storage', function (e) { if (e.key === KEY || e.key === LEN_KEY) update(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

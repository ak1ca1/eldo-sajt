// Eldo — shared persistent quote bar + modal (for pages without the catalog: index, garancija, o-nama)
// Reads the same 'eldo-quote' localStorage key used by proizvodi.html.
(function () {
  'use strict';
  var KEY = 'eldo-quote';
  var VIBER = '%2B381611444021'; // +381611444021

  function getQuote() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (e) { return []; }
  }
  function setQuote(arr) {
    try { localStorage.setItem(KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function fmt(n) { return (n || 0).toLocaleString('sr-RS'); }

  var catalog = null;

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
      '.eqb-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border-radius:999px;font:600 .8125rem/1 Inter,sans-serif;cursor:pointer;border:1px solid transparent;text-decoration:none;transition:all .2s;}',
      '.eqb-btn svg{width:14px;height:14px;}',
      '.eqb-sec{background:transparent;color:var(--fg-muted,#8a92a3);border-color:var(--border,#2a313d);}',
      '.eqb-sec:hover{color:var(--fg,#e3e6ec);border-color:var(--border-strong,#3a4150);}',
      '.eqb-pri{background:linear-gradient(135deg,hsl(30,72%,52%),hsl(30,72%,46%));color:#fff;box-shadow:0 4px 14px var(--copper-glow-40,rgba(217,119,87,.25));}',
      '.eqb-pri:hover{transform:translateY(-1px);filter:brightness(1.05);}',
      'html[data-theme="light"] .eqb-count{color:#1c2030;}',
      'html[data-theme="light"] .eqb-count strong{color:#c97244;}',
      'html[data-theme="light"] .eqb-meta{color:#6a6050;}',
      'html[data-theme="light"] .eqb-sec{color:#6a6050;border-color:#d8cdb6;}',
      'html[data-theme="light"] .eqb-sec:hover{color:#1c2030;border-color:#c8bda5;}',
      'html[data-theme="light"] .eqb-pri{color:#1c2030;}',
      '.eqb-modal{position:fixed;inset:0;z-index:240;background:rgba(10,12,18,.7);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:24px;}',
      '.eqb-modal.open{display:flex;}',
      '.eqb-card{background:var(--bg2,#161b25);border:1px solid var(--border,#2a313d);border-radius:18px;max-width:540px;width:100%;padding:28px;max-height:88vh;overflow-y:auto;}',
      'html[data-theme="light"] .eqb-card{background:#faf6ee;}',
      '.eqb-card h3{font-family:Cormorant Garamond,serif;font-size:1.625rem;font-weight:500;color:var(--white,#fff);margin:0 0 4px;}',
      '.eqb-card .sub{font-size:.875rem;color:var(--fg-muted,#8a92a3);margin:0 0 22px;}',
      '.eqb-items{list-style:none;display:flex;flex-direction:column;gap:8px;margin:0 0 22px;padding:0;max-height:320px;overflow-y:auto;}',
      '.eqb-item{display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg3,#1c2230);border-radius:10px;font-size:.875rem;}',
      'html[data-theme="light"] .eqb-item{background:#ede5d2;}',
      '.eqb-item img{width:36px;height:36px;object-fit:contain;border-radius:6px;background:var(--bg2,#161b25);flex-shrink:0;}',
      '.eqb-item .nm{flex:1;color:var(--fg,#e3e6ec);min-width:0;}',
      '.eqb-item .pr{color:var(--copper-lt,#e88c58);font-weight:700;white-space:nowrap;}',
      '.eqb-item .rm{width:24px;height:24px;border:0;background:transparent;color:var(--fg-muted,#8a92a3);cursor:pointer;border-radius:6px;flex-shrink:0;}',
      '.eqb-item .rm:hover{color:#e06;}',
      '.eqb-total{display:flex;justify-content:space-between;align-items:baseline;padding-top:14px;border-top:1px solid var(--border,#2a313d);margin-bottom:22px;}',
      '.eqb-total .lbl{color:var(--fg-muted,#8a92a3);font-size:.875rem;}',
      '.eqb-total .val{color:var(--copper-lt,#e88c58);font-weight:700;font-size:1.25rem;}',
      '.eqb-modal-actions{display:flex;gap:8px;flex-wrap:wrap;}',
      '.eqb-modal-actions a,.eqb-modal-actions button{flex:1;min-width:140px;justify-content:center;}',
      '.eqb-empty{color:var(--fg-muted,#8a92a3);font-size:.9rem;text-align:center;padding:20px 0;}',
      '@media(max-width:560px){.eqb{left:12px;right:12px;bottom:12px;transform:translateY(160%);max-width:none;gap:10px;padding:10px 14px;}.eqb.show{transform:translateY(0);}}'
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
        '<div class="eqb-modal-actions">' +
          '<button type="button" class="eqb-btn eqb-sec" id="eqbClose">Zatvori</button>' +
          '<a href="#" class="eqb-btn eqb-pri" id="eqbViber"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.7 6.7.633 9.817c-.063 3.115-.139 8.951 5.487 10.535v2.418s-.038.978.606 1.177c.778.243 1.235-.5 1.978-1.3.408-.44.97-1.086 1.395-1.58 3.849.323 6.807-.418 7.143-.527.776-.252 5.171-.816 5.886-6.652.738-6.017-.36-9.823-2.34-11.543l-.012-.005c-.6-.55-3.005-2.302-8.375-2.321 0 0-.395-.025-1.001-.018zm.062 1.717c.515-.005.855.018.855.018 4.541.014 6.71 1.382 7.22 1.842 1.674 1.434 2.53 4.864 1.905 9.897-.599 4.876-4.16 5.184-4.817 5.394-.28.09-2.926.747-6.246.531 0 0-2.473 2.985-3.247 3.762-.12.122-.262.17-.358.144-.135-.034-.172-.193-.17-.428l.02-4.011c-4.756-1.32-4.478-6.289-4.425-8.892.054-2.6.546-4.73 1.996-6.16 1.961-1.769 5.474-2.036 7.114-2.082z"/></svg>Pošalji na Viber</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    document.getElementById('eqbClear').addEventListener('click', function () {
      setQuote([]); update();
    });
    document.getElementById('eqbView').addEventListener('click', openModal);
    document.getElementById('eqbClose').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });
  }

  function resolve(id) { return catalog ? catalog.find(function (p) { return p.id === id; }) : null; }

  function update() {
    var q = getQuote();
    var bar = document.getElementById('eldoQuoteBar');
    if (!bar) return;
    document.getElementById('eqbCount').textContent = q.length;
    var total = q.reduce(function (s, id) { var p = resolve(id); return s + (p && p.price ? p.price : 0); }, 0);
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
        total += p.price || 0;
        return '<li class="eqb-item"><img src="' + (p.image || '') + '" alt=""/><span class="nm">' + p.name + '</span><span class="pr">' + (p.price ? fmt(p.price) + ' RSD' : (p.pricePerCm ? p.pricePerCm + ' din/cm' : 'Po upitu')) + '</span><button class="rm" data-id="' + p.id + '" aria-label="Ukloni"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button></li>';
      }).join('');
    }
    document.getElementById('eqbModalTotal').textContent = fmt(total) + ' RSD';
    // Viber message
    var lines = ['Zdravo, želim ponudu za sledeće proizvode:', ''];
    q.forEach(function (id, i) { var p = resolve(id); if (p) lines.push((i + 1) + '. ' + p.name + (p.price ? ' — ' + fmt(p.price) + ' RSD' : '')); });
    lines.push('', 'Ukupno orijentaciono: ' + fmt(total) + ' RSD');
    document.getElementById('eqbViber').setAttribute('href', 'viber://forward?text=' + encodeURIComponent(lines.join('\n')));
    list.querySelectorAll('.rm').forEach(function (b) {
      b.addEventListener('click', function () {
        var arr = getQuote(); var idx = arr.indexOf(b.dataset.id);
        if (idx !== -1) { arr.splice(idx, 1); setQuote(arr); }
        update(); openModal();
      });
    });
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
    fetch('catalog.json')
      .then(function (r) { return r.arrayBuffer(); })
      .then(function (buf) { catalog = JSON.parse(new TextDecoder('utf-8').decode(buf)); update(); })
      .catch(function () { update(); });
    // Sync if quote changes in another tab
    window.addEventListener('storage', function (e) { if (e.key === KEY) update(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

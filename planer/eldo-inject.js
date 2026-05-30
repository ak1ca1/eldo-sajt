// Eldo planer — DOM-aware injection: place "Nazad" inside the sidebar header
// as a sibling of the close (X) button, so it naturally sits next to it.
(function () {
  'use strict';

  function makeNazad() {
    var a = document.createElement('a');
    a.href = '../index.html';
    a.className = 'eldo-nazad-inline';
    a.title = 'Nazad na sajt';
    a.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<polyline points="15 18 9 12 15 6"></polyline>' +
      '</svg>' +
      '<span>Nazad</span>';
    return a;
  }

  // Find the sidebar close (X) button: it's a button whose SVG has the lucide-x icon.
  function findCloseButton() {
    var btns = document.querySelectorAll('button, a[role="button"]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var svg = b.querySelector('svg');
      if (!svg) continue;
      var paths = svg.querySelectorAll('path');
      for (var j = 0; j < paths.length; j++) {
        var d = paths[j].getAttribute('d') || '';
        // Lucide X icon path
        if (d === 'M18 6 6 18' || d === 'm6 6 12 12' || d === 'M18 6L6 18' || d === 'M6 6l12 12') {
          // Also verify it has the bright copper bg (closes the sidebar/header X)
          var bgRgb = getComputedStyle(b).backgroundColor;
          if (b.offsetWidth < 80 && b.offsetHeight < 80) return b;
        }
      }
    }
    return null;
  }

  var attempts = 0;
  function tryInject() {
    attempts++;
    if (document.querySelector('.eldo-nazad-inline')) return true;
    var close = findCloseButton();
    if (!close) return false;
    var nazad = makeNazad();
    // Insert Nazad just before the close button
    close.parentNode.insertBefore(nazad, close);
    return true;
  }

  function start() {
    if (tryInject()) return;
    // Retry on mutation
    var mo = new MutationObserver(function () {
      if (tryInject()) mo.disconnect();
      else if (attempts > 80) mo.disconnect();
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

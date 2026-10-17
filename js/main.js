// Engadin Hotel – sezóna, menu, záložky skupin, kalkulačka, formulář.
(function () {
  var html = document.documentElement;

  // přepínač Zima / Léto (pamatuje si volbu)
  document.querySelectorAll('[data-sezona-btn]').forEach(function (b) {
    b.setAttribute('aria-pressed', b.dataset.sezonaBtn === html.dataset.sezona);
    b.addEventListener('click', function () {
      var s = b.dataset.sezonaBtn;
      html.dataset.sezona = s;
      try { localStorage.setItem('engadin-sezona', s); } catch (e) {}
      document.querySelectorAll('[data-sezona-btn]').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.sezonaBtn === s); });
    });
  });

  // mobilní menu
  var burger = document.querySelector('.burger'), menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var o = menu.classList.toggle('otevreno');
      burger.setAttribute('aria-expanded', o);
      burger.setAttribute('aria-label', o ? 'Zavřít menu' : 'Otevřít menu');
      document.body.style.overflow = o ? 'hidden' : '';
    });
  }

  // záložky skupin
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.zalozky [role=tab]'));
  function vyber(t) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { vyber(t); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { var n = tabs[(i + d + tabs.length) % tabs.length]; vyber(n); n.focus(); }
    });
  });

  // kalkulačka podle ceníku
  var k = document.getElementById('kalkulacka');
  if (k) {
    var ceny = JSON.parse(k.dataset.ceny);
    var kc = function (n) { return Math.round(n).toLocaleString('cs-CZ').replace(/\s/g, ' ') + ' Kč'; };
    var cislo = function (n) { var v = parseInt(k.elements[n].value, 10); return isNaN(v) || v < 0 ? 0 : v; };
    var spocitej = function () {
      var noci = Math.max(1, cislo('noci')), strava = k.querySelector('[name=strava]:checked').value;
      var cena = ceny[noci >= 4 ? 1 : 0][strava];
      var d9 = cislo('d9'), d15 = cislo('d15'), dosp = cislo('dosp'), osob = d9 + d15 + dosp;
      var celkem = noci * cena * (dosp + d15 * 0.8 + d9 * 0.6);
      k.elements.celkem.value = osob ? kc(celkem) : '–';
      k.elements.detail.value = osob
        ? osob + ' osob × ' + noci + (noci === 1 ? ' noc' : noci < 5 ? ' noci' : ' nocí') + ', ' + (strava === 'polopenze' ? 'polopenze' : 'snídaně') +
          '. Průměrně ' + kc(celkem / osob / noci) + ' za osobu a noc.'
        : 'Zadejte počet osob.';
      var a = k.querySelector('[data-kalk-odkaz]');
      if (a) a.href = a.href.split('?')[0] + '?noci=' + noci + '&strava=' + strava + '&deti=' + (d9 + d15) + '&dospeli=' + dosp;
    };
    k.addEventListener('input', spocitej);
    spocitej();
  }

  // předvyplnění poptávky z kalkulačky / odkazu skupiny
  var p = document.querySelector('form.formular');
  if (p) {
    var q = new URLSearchParams(location.search);
    ['noci', 'deti', 'dospeli', 'skupina'].forEach(function (n) { if (q.get(n) && p.elements[n]) p.elements[n].value = q.get(n); });
    if (q.get('strava') && p.elements.strava) p.elements.strava.value = q.get('strava');
  }

  // formulář: v návrhu jen ukázka
  document.querySelectorAll('form.formular').forEach(function (f) {
    var stav = f.querySelector('.formular-stav');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (f.querySelector('.past input').value) return;
      var endpoint = f.getAttribute('data-endpoint');
      if (f.getAttribute('data-demo') === '1' || !endpoint) {
        stav.textContent = 'Ukázka formuláře: v návrhu se nic neodesílá. Po spuštění webu přijde poptávka na info@engadinhotel.cz.';
        return;
      }
      stav.textContent = 'Odesílám…';
      fetch(endpoint, { method: 'POST', body: new FormData(f), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error(r.status); f.reset(); stav.textContent = 'Děkujeme, poptávka byla odeslána. Ozveme se s nabídkou.'; })
        .catch(function () { stav.textContent = 'Odeslání se nepodařilo. Napište nám prosím na info@engadinhotel.cz.'; });
    });
  });

  // profil okolí na mobilu: hotel doprostřed
  document.querySelectorAll('.profil').forEach(function (f) {
    if (f.scrollWidth > f.clientWidth) f.scrollLeft = f.scrollWidth * 0.6 - f.clientWidth / 2;
  });

  // jemné odhalení sekcí
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('videt'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.hlava-sekce, .panel-text, .venku-text, .profil, .mozaika, .kalk, .blok').forEach(function (el) { el.classList.add('odhal'); io.observe(el); });
  }
})();

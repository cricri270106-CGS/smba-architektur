(function () {
  'use strict';

  var P = window.SMBA_PROJECTS || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var img = function (p, i) { return 'img/p/' + p.s + '/' + (i === 'thumb' ? 'thumb' : pad(i)) + '.jpg'; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var bySlug = {};
  P.forEach(function (p, i) { p.i = i; bySlug[p.s] = p; });

  /* ---------- Theme ---------- */
  $('[data-theme-toggle]').addEventListener('click', function () {
    var root = document.documentElement;
    var dark = root.dataset.theme ? root.dataset.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('smba-theme', root.dataset.theme); } catch (e) {}
  });

  /* ---------- Header ---------- */
  var bar = $('[data-bar]');
  var onScroll = function () { bar.classList.toggle('scrolled', window.scrollY > 40); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  var menuBtn = $('[data-menu-btn]'), mobil = $('[data-mobilnav]');
  var setMenu = function (open) {
    mobil.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');
    menuBtn.innerHTML = open ? '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M4 8h16M4 16h16"/></svg>';
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', function () { setMenu(mobil.hidden); });
  $$('a', mobil).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

  /* ---------- Hero slideshow ---------- */
  var FEATURED = [
    'neubau-geschaeftsgebaeude-kerzers',
    'aufstockung-wohnhaus-fraeschels',
    'sanierung-umbau-und-erweiterung-bauernhaus-gals',
    'sanierung-schulhaus-kerzers',
    'qube-schlieren-b-bern',
    'neubau-gewaechshaus-muntelier'
  ];
  var feat = FEATURED.map(function (s) { return bySlug[s]; }).filter(Boolean);
  if (feat.length < FEATURED.length) feat = P.slice(0, 6);

  var slides = $('[data-hero-slides]'), cap = $('[data-hero-cap]');
  var heroImgs = feat.map(function (p, k) {
    var im = new Image(); im.alt = ''; im.decoding = 'async';
    im.src = img(p, p.cv);
    if (k === 0) { im.className = 'on'; im.fetchPriority = 'high'; } else im.fetchPriority = 'low';
    slides.appendChild(im); return im;
  });
  cap.textContent = feat[0].t;
  var hi = 0;
  if (!reduced && heroImgs.length > 1) {
    setInterval(function () {
      if (document.hidden) return;
      heroImgs[hi].classList.remove('on');
      hi = (hi + 1) % heroImgs.length;
      heroImgs[hi].classList.add('on');
      cap.textContent = feat[hi].t;
    }, 6000);
  }
  $('[data-hero]').addEventListener('click', function () { openProject(feat[hi]); });
  $('[data-hero]').style.cursor = 'pointer';

  /* ---------- Cards ---------- */
  var card = function (p, big) {
    var li = document.createElement('li');
    li.innerHTML =
      '<button class="card" type="button" data-slug="' + p.s + '" aria-label="Projekt öffnen: ' + esc(p.t) + '">' +
        '<div class="card-media"><img src="' + (big ? img(p, p.cv) : img(p, 'thumb')) + '" alt="" loading="lazy" decoding="async">' +
        '<span class="chip">' + esc(p.c[0]) + '</span>' +
        '<span class="card-open" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg></span></div>' +
        '<div class="card-body"><span class="card-title">' + esc(p.t) + '</span>' +
        (p.y ? '<span class="card-year">' + p.y + '</span>' : '') + '</div>' +
      '</button>';
    return li;
  };
  document.addEventListener('click', function (e) {
    var c = e.target.closest('.card[data-slug]');
    if (c) openProject(bySlug[c.dataset.slug]);
  });

  var featWrap = $('[data-featured]');
  feat.forEach(function (p, k) { var li = card(p, k === 0); li.classList.add('reveal'); featWrap.appendChild(li); });

  /* ---------- Portfolio ---------- */
  var CATS = ['Alle', 'Wohnungsbau', 'Umbau + Sanierung', 'Öffentliche Bauten', 'Gewerbebau', 'Landwirtschaft', 'Mit Partnern'];
  var state = { cat: 'Alle', q: '', limit: 12 };
  var grid = $('[data-grid]'), more = $('[data-more]'), countLabel = $('[data-count-label]');
  var filtersEl = $('[data-filters]');
  CATS.forEach(function (c) {
    var n = c === 'Alle' ? P.length : P.filter(function (p) { return p.c.indexOf(c) > -1; }).length;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'filter'; b.dataset.cat = c;
    b.setAttribute('aria-pressed', String(c === state.cat));
    b.innerHTML = esc(c) + ' <small>' + n + '</small>';
    filtersEl.appendChild(b);
  });
  filtersEl.addEventListener('click', function (e) {
    var b = e.target.closest('.filter'); if (!b) return;
    state.cat = b.dataset.cat; state.limit = 12;
    $$('.filter', filtersEl).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    render();
  });
  var search = $('[data-search]');
  var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  P.forEach(function (p) { p.hay = norm([p.t, p.c.join(' '), p.m.join(' '), p.y || ''].join(' ')); });
  search.addEventListener('input', function () { state.q = norm(search.value.trim()); state.limit = 12; render(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !modal.open) {
      e.preventDefault(); search.focus();
    }
  });
  more.addEventListener('click', function () { state.limit += 12; render(true); });

  var current = [];
  function render(append) {
    current = P.filter(function (p) {
      return (state.cat === 'Alle' || p.c.indexOf(state.cat) > -1) && (!state.q || p.hay.indexOf(state.q) > -1);
    });
    var shown = current.slice(0, state.limit);
    var start = append ? grid.children.length : 0;
    if (!append) grid.innerHTML = '';
    shown.slice(start).forEach(function (p, k) {
      var li = card(p); li.style.animationDelay = Math.min(k, 11) * 40 + 'ms'; grid.appendChild(li);
    });
    if (!current.length) grid.innerHTML = '<li class="pf-empty">Kein Projekt gefunden.</li>';
    countLabel.innerHTML = '<b>' + current.length + '</b> ' + (current.length === 1 ? 'Projekt' : 'Projekte') +
      (state.cat !== 'Alle' ? ' in ' + esc(state.cat) : '');
    more.parentNode.hidden = shown.length >= current.length;
  }
  render();

  /* ---------- Stats ---------- */
  var statVals = { projects: P.length, team: 9 };
  $$('[data-stat]').forEach(function (el) { el.dataset.count = statVals[el.dataset.stat]; el.textContent = statVals[el.dataset.stat]; });
  var countUp = function (el) {
    var to = +el.dataset.count, from = +(el.dataset.from || 0), t0 = null, dur = 1600;
    if (reduced) { el.textContent = to; return; }
    var step = function (t) {
      if (!t0) t0 = t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Team ---------- */
  var TEAM = [
    { g: 'lead', n: 'Stefan Meyer', r: 'Geschäftsinhaber, Projektleitung Bauleitung', tags: ['Inhaber'], m: 'stefan.meyer@smba.ch', img: 'stefan-meyer' },
    { g: 'lead', n: 'Franziska Meyer', r: 'Architektin FH, Projektleitung', tags: ['Architektur'], m: 'franziska.meyer@smba.ch', img: 'franziska-meyer' },
    { g: 'team', n: 'Stefan Jendly', r: 'Dipl. Bauleiter, Bauleitung', m: 'stefan.jendly@smba.ch', img: 'stefan-jendly' },
    { g: 'team', n: 'Jana Moser', r: 'Architektin FH, Projektleitung Bauleitung', m: 'jana.moser@smba.ch', img: 'jana-moser' },
    { g: 'team', n: 'Steven Trachsel', r: 'Dipl. Techniker HF Bauplanung, Projektleitung Bauleitung', m: 'steven.trachsel@smba.ch', img: 'steven-trachsel' },
    { g: 'team', n: 'Marianne Baumann', r: 'Sekretariat', m: 'marianne.baumann@smba.ch', img: 'marianne-baumann' },
    { g: 'team', n: 'Sandra Weyermann', r: 'Zeichnerin EFZ Architektur', m: 'sandra.weyermann@smba.ch', img: 'sandra-weyermann' },
    { g: 'team', n: 'Livia Kneubühl', r: 'Zeichnerin EFZ Architektur', m: 'livia.kneubuehl@smba.ch', img: 'livia-kneubuehl' },
    { g: 'team', n: 'Fiona Lehmann', r: 'Lernende Zeichnerin EFZ', m: 'fiona.lehmann@smba.ch', img: 'fiona-lehmann' }
  ];
  var initials = function (n) { return n.split(' ').map(function (w) { return w[0]; }).filter(function (c, i, a) { return i === 0 || i === a.length - 1; }).join(''); };
  TEAM.forEach(function (t) {
    var li = document.createElement('li'); li.className = 'reveal';
    li.innerHTML = '<article class="member">' +
      '<div class="member-photo">' + (t.img
        ? '<img src="img/team/' + t.img + '.jpg" alt="Portrait ' + esc(t.n) + '" loading="lazy" decoding="async">'
        : '<span class="member-mono" aria-hidden="true">' + initials(t.n) + '</span>') + '</div>' +
      '<div class="member-body"><h4 class="member-name">' + esc(t.n) + '</h4><p class="member-role">' + esc(t.r) + '</p>' +
      (t.tags ? '<div class="member-tags">' + t.tags.map(function (g) { return '<span class="tag">' + g + '</span>'; }).join('') + '</div>' : '') +
      '<a class="member-mail" href="mailto:' + t.m + '">' + t.m + '</a></div></article>';
    $('[data-team="' + t.g + '"]').appendChild(li);
  });

  /* ---------- Reveal on scroll ---------- */
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, sib = el.parentNode ? $$(':scope > .reveal', el.parentNode) : [];
        el.style.transitionDelay = Math.max(0, sib.indexOf(el)) % 6 * 70 + 'ms';
        el.classList.add('in'); io.unobserve(el);
        $$('[data-count]', el).forEach(countUp);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Band: duplicate for seamless loop ---------- */
  var band = $('[data-band]'); band.innerHTML += band.innerHTML;

  /* ---------- Project dialog ---------- */
  var modal = $('[data-modal]'), stageImg = $('[data-stage-img]'), thumbs = $('[data-thumbs]');
  var cur = null, curImg = 1, list = P;
  function showImg(n) {
    if (!cur) return;
    curImg = ((n - 1 + cur.n) % cur.n) + 1;
    stageImg.classList.add('loading');
    var src = img(cur, curImg), probe = new Image();
    probe.onload = probe.onerror = function () { if (img(cur, curImg) === src) { stageImg.src = src; stageImg.classList.remove('loading'); } };
    probe.src = src;
    stageImg.alt = cur.t + ', Bild ' + curImg + ' von ' + cur.n;
    $('[data-img-count]').textContent = curImg + ' / ' + cur.n;
    $$('button', thumbs).forEach(function (b, k) { b.setAttribute('aria-current', String(k + 1 === curImg)); });
    var active = thumbs.children[curImg - 1];
    if (active) thumbs.scrollTo({ left: active.offsetLeft - thumbs.clientWidth / 2 + active.clientWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
    // preload next
    if (cur.n > 1) { var nx = new Image(); nx.src = img(cur, (curImg % cur.n) + 1); }
  }
  function openProject(p) {
    if (!p) return;
    cur = p;
    list = current.indexOf(p) > -1 ? current : P;
    $('[data-pm-cat]').textContent = p.y || 'Projekt';
    $('[data-pm-title]').textContent = p.t;
    $('[data-pm-meta]').innerHTML = p.m.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('');
    $('[data-pm-tags]').innerHTML = p.c.map(function (c) { return '<span class="tag">' + esc(c) + '</span>'; }).join('');
    thumbs.innerHTML = '';
    for (var k = 1; k <= p.n; k++) {
      var b = document.createElement('button');
      b.type = 'button'; b.dataset.i = k; b.setAttribute('aria-label', 'Bild ' + k);
      b.innerHTML = '<img src="' + img(p, k) + '" alt="" loading="lazy" decoding="async">';
      thumbs.appendChild(b);
    }
    var multi = p.n > 1;
    $('[data-img-prev]').hidden = $('[data-img-next]').hidden = thumbs.hidden = !multi;
    $('.pm-info').scrollTop = 0;
    if (!modal.open) { modal.showModal(); document.body.style.overflow = 'hidden'; }
    showImg(1);
    if (history.replaceState) history.replaceState(null, '', '#projekt/' + p.s);
  }
  function closeProject() { if (modal.open) modal.close(); }
  modal.addEventListener('close', function () {
    document.body.style.overflow = '';
    if (location.hash.indexOf('#projekt/') === 0 && history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  });
  var stepProject = function (d) { var k = list.indexOf(cur); openProject(list[(k + d + list.length) % list.length]); };
  $('[data-close]').addEventListener('click', closeProject);
  $('[data-pm-cta]').addEventListener('click', closeProject);
  $('[data-proj-prev]').addEventListener('click', function () { stepProject(-1); });
  $('[data-proj-next]').addEventListener('click', function () { stepProject(1); });
  $('[data-img-prev]').addEventListener('click', function () { showImg(curImg - 1); });
  $('[data-img-next]').addEventListener('click', function () { showImg(curImg + 1); });
  thumbs.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) showImg(+b.dataset.i); });
  modal.addEventListener('click', function (e) { if (e.target === modal) closeProject(); });
  modal.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); showImg(curImg + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); showImg(curImg - 1); }
  });
  // swipe on stage
  var sx = null;
  $('[data-stage]').addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  $('[data-stage]').addEventListener('touchend', function (e) {
    if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 40) showImg(curImg + (dx < 0 ? 1 : -1));
  });
  // deep link
  var m = location.hash.match(/^#projekt\/(.+)$/);
  if (m && bySlug[decodeURIComponent(m[1])]) openProject(bySlug[decodeURIComponent(m[1])]);

  /* ---------- Contact form (mailto) ---------- */
  var form = $('[data-form]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    $$('[required]', form).forEach(function (f) {
      var bad = !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
      f.classList.toggle('invalid', bad); if (bad && ok) { f.focus(); ok = false; }
    });
    var note = $('[data-form-note]');
    if (!ok) { note.textContent = 'Bitte füllen Sie die markierten Felder aus.'; return; }
    var d = new FormData(form);
    var body = d.get('msg') + '\n\n—\n' + (d.get('anrede') === 'Keine Angabe' ? '' : d.get('anrede') + ' ') + d.get('name') + '\n' + d.get('email') + (d.get('tel') ? '\n' + d.get('tel') : '');
    location.href = 'mailto:info@smba.ch?subject=' + encodeURIComponent('Anfrage: ' + d.get('topic')) + '&body=' + encodeURIComponent(body);
    note.textContent = 'Ihr E-Mail-Programm wurde geöffnet. Vielen Dank!';
  });

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

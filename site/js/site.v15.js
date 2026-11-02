/* Countryside Cannabis — shared behavior */
(function () {
  'use strict';

  /* ---------- age gate (19+) ---------- */
  var gate = document.getElementById('agegate');
  if (gate) {
    var KEY = 'cc_age_ok';
    var ok = false;
    try { ok = localStorage.getItem(KEY) === '1'; } catch (e) {}

    /* Everything behind the gate goes inert while it is up. Without this a
       keyboard or screen-reader user can tab straight past a legal age check
       into the site. */
    var behind = [document.querySelector('.nav'), document.getElementById('main'),
                  document.querySelector('.footer')].filter(Boolean);
    var setBehind = function (off) {
      behind.forEach(function (el) {
        if (off) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); }
        else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
      });
    };
    var gateFocusables = function () {
      return gate.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])');
    };

    if (!ok) {
      gate.hidden = false;
      document.body.classList.add('locked');
      setBehind(true);
      var firstBtn = gate.querySelector('[data-age="yes"]');
      if (firstBtn) { try { firstBtn.focus({ preventScroll: true }); } catch (e) { firstBtn.focus(); } }

      /* Tab cycles inside the gate. Escape deliberately does nothing — letting a
         keystroke dismiss an age check would defeat the point of having one. */
      gate.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var f = gateFocusables();
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }

    var enter = gate.querySelector('[data-age="yes"]');
    var deny = gate.querySelector('[data-age="no"]');
    if (enter) enter.addEventListener('click', function () {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      gate.hidden = true;
      document.body.classList.remove('locked');
      setBehind(false);
      /* hand focus to the page rather than dropping it on <body> */
      var main = document.getElementById('main');
      if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
    });
    if (deny) deny.addEventListener('click', function () {
      window.location.href = 'https://www.google.com';
    });

  }

  /* ---------- sticky nav frosting ---------- */
  var nav = document.querySelector('.nav');
  if (nav && !nav.classList.contains('nav--solid')) {
    var onScroll = function () {
      if (window.scrollY > (parseFloat(nav.dataset.threshold) || 60)) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- mobile menu ---------- */
  var toggle = document.querySelector('.nav__toggle');
  var links = document.querySelector('.nav__links');
  if (toggle && links) {
    if (!links.id) links.id = 'nav-links';
    toggle.setAttribute('aria-controls', links.id);
    toggle.setAttribute('aria-expanded', 'false');
    var setMenu = function (open) {
      links.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    toggle.addEventListener('click', function () {
      setMenu(!links.classList.contains('open'));
    });
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('open')) { setMenu(false); toggle.focus(); }
    });
  }

  /* ---------- scroll reveals ---------- */
  var reveals = document.querySelectorAll('.reveal');
  window.__ccReady = true;
  /* failsafes for embedded previews: reveal anything the observer never reported,
     and fetch lazy images the frame never scrolled to */
  setTimeout(function () {
    [].forEach.call(document.querySelectorAll('.reveal:not(.in)'), function (el) {
      var r = el.getBoundingClientRect(); if (r.top < innerHeight * 1.2 && r.bottom > -40) el.classList.add('in');
    });
  }, 2500);
  window.addEventListener('load', function () {
    setTimeout(function () {
      [].forEach.call(document.querySelectorAll('img[loading="lazy"]'), function (img) { if (!img.complete || !img.naturalWidth) img.loading = 'eager'; });
    }, 3000);
  });
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- parallax ---------- */
  var layers = document.querySelectorAll('[data-parallax]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (layers.length && !reduce) {
    var ticking = false;
    var move = function () {
      var vh = window.innerHeight;
      layers.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.18;
        var offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(move); ticking = true; }
    }, { passive: true });
    move();
  }

  /* ---------- morphing pill nav indicator ---------- */
  if (links) {
    var navItems = links.querySelectorAll('a:not(.btn)');
    if (navItems.length) {
      var pill = document.createElement('span');
      pill.className = 'nav__pill';
      links.insertBefore(pill, links.firstChild);
      var activeItem = links.querySelector('a.active:not(.btn)');
      var narrow = window.matchMedia('(max-width: 980px)');
      var placePill = function (el, animate) {
        if (!el || narrow.matches) { pill.style.opacity = '0'; return; }
        if (!animate) pill.style.transition = 'none';
        var base = links.getBoundingClientRect();
        var r = el.getBoundingClientRect();
        pill.style.height = r.height + 'px';
        pill.style.transform = 'translate(-50%,' + (r.top - base.top) + 'px)';
        pill.style.opacity = '1';
        if (!animate) { void pill.offsetWidth; pill.style.transition = ''; }
      };
      window.addEventListener('resize', function () { placePill(activeItem, false); });
      window.addEventListener('load', function () { placePill(activeItem, false); });
      placePill(activeItem, false);
    }
  }

  /* ---------- scroll progress bar ---------- */
  var sbar = document.createElement('div');
  sbar.className = 'scrollbar';
  document.body.appendChild(sbar);
  var docEl = document.documentElement;
  var updateBar = function () {
    var max = docEl.scrollHeight - docEl.clientHeight;
    var p = max > 0 ? Math.min(1, docEl.scrollTop / max) : 0;
    sbar.style.transform = 'scaleX(' + p + ')';
  };
  window.addEventListener('scroll', updateBar, { passive: true });
  window.addEventListener('resize', updateBar);
  updateBar();

  /* ---------- magnetic buttons + card tilt (fine pointer, motion allowed) ---------- */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reduce) {
    document.querySelectorAll('.card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transition = 'transform .14s ease, box-shadow .3s ease, border-color .3s ease';
        card.style.transform = 'perspective(760px) rotateX(' + (-py * 3.5).toFixed(2) + 'deg) rotateY(' + (px * 3.5).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transition = ''; card.style.transform = ''; });
    });
  }

  /* ---------- motion hero (upgrades the still to video when a clip exists) ---------- */
  var hv = document.querySelector('.hero__video');
  if (hv) {
    var showVid = function () { hv.classList.add('ready'); };
    hv.addEventListener('playing', showVid);
    hv.addEventListener('loadeddata', function () {
      if (hv.readyState >= 2) { var p = hv.play(); if (p && p.catch) p.catch(function () {}); }
    });
    var pr = hv.play();
    if (pr && pr.catch) pr.catch(function () {});
  }

  /* ---------- footer year ---------- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- contact + connect forms (shared validation) ---------- */
  var wireForm = function (form) {
    if (!form) return;
    var status = form.querySelector('.form-status');
    var setInvalid = function (field, bad) { field.classList.toggle('invalid', bad); };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = true;
      form.querySelectorAll('.field[data-required]').forEach(function (f) {
        var input = f.querySelector('input, textarea, select');
        var val = (input && input.value || '').trim();
        var bad = !val;
        if (!bad && input.type === 'email') { bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); }
        setInvalid(f, bad);
        if (bad) valid = false;
      });
      if (!valid) {
        if (status) { status.textContent = 'Please complete the highlighted fields.'; status.className = 'form-status err'; }
        return;
      }
      /* no server yet: hand the message to the visitor's own email app, addressed and filled in */
      var v = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
      var topic = v('topic') || 'Enquiry';
      var to = /bulk|contract|white|toll/i.test(topic) ? 'sales@countrysidecannabis.com' : 'info@countrysidecannabis.com';
      var body = v('message') + '\n\n' + v('name') + (v('company') ? '\n' + v('company') : '') + '\n' + v('email');
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent('Website enquiry: ' + topic) + '&body=' + encodeURIComponent(body);
      if (status) { status.textContent = 'Your email app should open with the message ready to send. If it does not, email ' + to + '.'; status.className = 'form-status ok'; }
    });
    form.querySelectorAll('.field[data-required] input, .field[data-required] textarea').forEach(function (input) {
      input.addEventListener('input', function () { input.closest('.field').classList.remove('invalid'); });
    });
  };
  wireForm(document.getElementById('contact-form'));
  wireForm(document.getElementById('connect-form'));

  /* ---------- connect modal (nav CTA opens the form in a popup) ---------- */
  var modal = document.getElementById('connect-modal');
  if (modal) {
    var lastFocus = null;
    var focusables = function () {
      return modal.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])');
    };
    var openModal = function () {
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('modal-open');
      var f = focusables();
      if (f.length) f[0].focus();               /* move focus into the dialog */
    };
    var closeModal = function () {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();  /* return focus to trigger */
    };
    document.querySelectorAll('[data-connect]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal || (e.target.closest && e.target.closest('[data-close]'))) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (modal.hidden) return;
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key === 'Tab') {                     /* trap focus inside the dialog */
        var f = focusables();
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();

/* ---------- Countryside assistant: answers only from on-site info; ---------- */
/* ---------- anything it can't answer routes to the contact form. ---------- */
(function () {
  if (document.getElementById('cc-chat')) return;

  var KB = [
    { k: ['brand', 'litti', 'shatterizer', 'ellevia', 'greazy', 'buddy', 'blooms', 'harvest', 'reserve', 'product line'],
      a: 'Countryside makes six brands on Canadian shelves: Harvest Reserve (our own adult-use pre-rolls), LITTI., Shatterizer, GREAZY, Buddy Blooms and Ellevia. You can see them all on the Brands page.' },
    { k: ['where', 'location', 'located', 'address', 'find you', 'st thomas', 'ontario', 'direction', 'facilit', 'site', 'farm'],
      a: "We're in St. Thomas, Ontario, across two sites: the Sparling Facility (27 Sparling Rd, our primary facility) and the Barrie Facility (3 Barrie Blvd, extraction). There's a map on the Our Story page." },
    { k: ['service', 'what do you do', 'offer', 'produce', 'products', 'what do you make'],
      a: 'Three things: bulk dried flower, bulk extracts and concentrates, and contract manufacturing, tolling and white label. Full details are on the Services page.' },
    { k: ['flower', 'strain', 'cultivation', 'grow', 'indoor', 'dried'],
      a: 'We grow flower indoors, room by room, with a rotating cultivar menu. It is supplied in bulk, packed to your format, or used as extraction input.' },
    { k: ['extract', 'concentrate', 'distillate', 'rosin', 'thca', 'diamond', 'isolate', 'cbd', 'resin', 'sauce', 'hte', 'rso', 'vape'],
      a: 'Our extract range covers terp sauce / high-terpene extract, THC and CBD distillate, THCA and liquid diamonds, live resin and live rosin, CBD isolate, and RSO and crude, sold in bulk or produced to your specification.' },
    { k: ['wholesale', 'white label', 'private label', 'contract', 'tolling', 'bulk', 'partner', 'supply', 'buy', 'purchase', 'order', 'quote', 'pricing', 'price'],
      a: 'We supply bulk flower and extracts, and run contract manufacturing, tolling and white label for partners in Canada and abroad. The quickest way to start is to send the team a note:', form: true },
    { k: ['contact', 'phone', 'call', 'email', 'reach', 'talk', 'speak', 'get in touch', 'connect'],
      a: 'You can reach us at +1 866-586-0690 or info@countrysidecannabis.com (partnerships: sales@countrysidecannabis.com). Or send a message:', form: true },
    { k: ['gmp', 'eu', 'certif', 'export', 'international'],
      a: 'We supply partners in Canada and are working toward EU-GMP certification for supply into markets that require it.' },
    { k: ['age', '19', 'adult', 'legal'],
      a: 'Cannabis products are for adults 19+ only. You will see an age check when you first visit the site.' },
    { k: ['who', 'about', 'story', 'history', 'company', 'licen'],
      a: 'Countryside Cannabis Co. is a licensed producer in St. Thomas, Ontario, with a hundred-acre farm and an indoor grow. We grow, extract and finish cannabis ourselves. The full story is on the Our Story page.' },
    { k: ['hi', 'hello', 'hey', 'help'],
      a: "Hi! I can help with what's on this site: our brands, services, locations and how to get in touch. What would you like to know?" }
  ];
  var FALLBACK = "I can only answer questions about Countryside Cannabis from this site, and I don't have that one. The team can help you directly:";

  function reply(q) {
    var s = ' ' + q.toLowerCase().replace(/[^a-z0-9+ ]/g, ' ').replace(/\s+/g, ' ') + ' ';
    var best = null, score = 0;
    KB.forEach(function (e) {
      var n = 0;
      e.k.forEach(function (k) { if (s.indexOf(' ' + k) > -1) n++; });
      if (n > score) { score = n; best = e; }
    });
    return (best && score > 0) ? best : { a: FALLBACK, form: true };
  }

  /* build widget */
  var wrap = document.createElement('div');
  wrap.id = 'cc-chat';
  wrap.className = 'cc-chat';
  var chatIco = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  wrap.innerHTML =
    '<div class="cc-panel" role="dialog" aria-label="Countryside assistant">' +
      '<div class="cc-head">' +
        '<span class="cc-head__avatar">' + chatIco + '</span>' +
        '<div><div class="cc-head__title">Ask Countryside</div><div class="cc-head__sub">Answers from our site</div></div>' +
        '<button class="cc-head__x" type="button" aria-label="Close chat">&times;</button>' +
      '</div>' +
      '<div class="cc-log" aria-live="polite"></div>' +
      '<div class="cc-chips"></div>' +
      '<form class="cc-form"><input class="cc-input" type="text" placeholder="Ask a question…" aria-label="Type your question" autocomplete="off"><button class="cc-send" type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button></form>' +
    '</div>' +
    '<button class="cc-launch" type="button" aria-label="Open chat"><span class="cc-launch__dot"></span>' + chatIco + '<span class="cc-launch__txt">Ask us</span></button>';
  document.body.appendChild(wrap);

  var panel = wrap.querySelector('.cc-panel');
  var launch = wrap.querySelector('.cc-launch');
  /* tuck the launcher away while reading downward; bring it back on scroll up */
  (function () { var last = window.scrollY; window.addEventListener('scroll', function () {
    var y = window.scrollY; wrap.classList.toggle('is-tucked', y > last + 4 && y > 200); if (y < last - 4) wrap.classList.remove('is-tucked'); last = y;
  }, { passive: true }); })();
  var closeX = wrap.querySelector('.cc-head__x');
  var log = wrap.querySelector('.cc-log');
  var chips = wrap.querySelector('.cc-chips');
  var form = wrap.querySelector('.cc-form');
  var input = wrap.querySelector('.cc-input');

  function openForm() {
    var m = document.getElementById('connect-modal');
    if (m) {
      wrap.classList.remove('is-open');
      m.hidden = false;
      document.body.classList.add('modal-open');
      var f = m.querySelector('input, textarea, select, button');
      if (f && f.focus) setTimeout(function () { f.focus(); }, 60);
    } else {
      window.location.href = 'contact.html';
    }
  }

  function addMsg(text, who, withForm) {
    var b = document.createElement('div');
    b.className = 'cc-msg cc-msg--' + who;
    b.textContent = text;
    if (withForm) {
      var a = document.createElement('a');
      a.className = 'cc-cta';
      a.href = 'contact.html';
      a.textContent = 'Message the team';
      a.addEventListener('click', function (e) { if (document.getElementById('connect-modal')) { e.preventDefault(); openForm(); } });
      b.appendChild(document.createElement('br'));
      b.appendChild(a);
    }
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
  }

  function ask(q) {
    addMsg(q, 'user');
    var r = reply(q);
    setTimeout(function () { addMsg(r.a, 'bot', r.form); }, 320);
  }

  var STARTERS = ['Where are you?', 'What brands?', 'Your services', 'Contact'];
  STARTERS.forEach(function (t) {
    var c = document.createElement('button');
    c.className = 'cc-chip'; c.type = 'button'; c.textContent = t;
    c.addEventListener('click', function () { ask(t); });
    chips.appendChild(c);
  });

  var greeted = false;
  function openChat() {
    wrap.classList.add('is-open');
    if (!greeted) { greeted = true; addMsg("Hi! I'm the Countryside assistant. Ask me about our brands, services, locations or how to reach the team.", 'bot'); }
    setTimeout(function () { input.focus(); }, 80);
  }
  function closeChat() { wrap.classList.remove('is-open'); }

  launch.addEventListener('click', openChat);
  closeX.addEventListener('click', closeChat);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = input.value.trim();
    if (!v) return;
    input.value = '';
    ask(v);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && wrap.classList.contains('is-open')) closeChat(); });
})();


/* ---------- homepage brand flight + sunrise ----------
   The lockup opens large in the space above the hero headline. On scroll it separates:
   the wordmark lifts and dissolves, while the emblem glides (up first, then across) and
   lands exactly on the sun in the nav icon, whose C and S then fade in around it.
   Without JS, or with reduced motion, the nav is unchanged. */
(function () {
  var fl = document.querySelector('.brandflight');
  var nav = document.querySelector('.nav');
  var brand = document.querySelector('.nav__brand');
  var full = document.querySelector('.nav__logo--full');
  var icon = document.querySelector('.nav__logo--icon');
  var hero = document.querySelector('.hero__inner');
  if (!fl || !nav || !brand || !full || !icon || !hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { fl.remove(); return; }
  var word = fl.querySelector('.bf-word'), emb = fl.querySelector('.bf-emblem');

  /* lockup geometry (logo-full-white-v2.svg, 403.67 x 240.1) and nav icon geometry (137.47 x 362.61) */
  var EMB_X = 132.96 / 403.67, EMB_W = 137.75 / 403.67, EMB_H = 158.89 / 240.1;
  var WORD_Y = 177.55 / 240.1, WORD_H = 62.55 / 240.1;
  var ICON_EMB_Y = 101.82 / 362.61, ICON_EMB_H = 158.97 / 362.61;

  var S, T, E, dist = 1, on = false, raf = 0;
  var out3 = function (t) { return 1 - Math.pow(1 - t, 3); };
  var out4 = function (t) { return 1 - Math.pow(1 - t, 4); };
  var io = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  function measure() {
    var b = brand.getBoundingClientRect();
    T = { x: b.left + full.offsetLeft, y: b.top + full.offsetTop, w: full.offsetWidth, h: full.offsetHeight };
    var iw = icon.offsetWidth, ih = icon.offsetHeight;
    if (!T.w || !T.h || !iw || !ih) { on = false; return; }
    var itop = b.top + icon.offsetTop - ih / 2;               /* icon sits at top:50% with translateY(-50%) */
    E = { x: b.left + icon.offsetLeft, y: itop + ih * ICON_EMB_Y, w: iw, h: ih * ICON_EMB_H };
    var first = hero.firstElementChild || hero;
    var bottom = first.getBoundingClientRect().top + window.scrollY - 24;
    /* start below the top-bar links (desktop) so the large logo never crowds them */
    var nl = document.querySelector('.nav__links'); var top0 = T.y;
    if (nl && window.innerWidth > 980) { var nb = nl.getBoundingClientRect(); if (nb.height) top0 = Math.max(T.y, nb.bottom + 14); }
    var avail = bottom - top0, aspect = T.w / T.h;
    var w = Math.min(window.innerWidth * 0.62, 520, avail * 0.92 * aspect), h = w / aspect;
    if (h < T.h * 1.45) { on = false; return; }
    var hr = hero.getBoundingClientRect();
    S = { x: hr.left + hr.width / 2 - w / 2, y: top0 + avail / 2 - h / 2, w: w, h: h };
    dist = bottom - (T.y + T.h) - 20;                          /* lands before the headline reaches it */
    if (dist < 80) { on = false; return; }
    word.style.width = T.w + 'px'; word.style.height = (T.h * WORD_H) + 'px';
    emb.style.width = E.w + 'px';  emb.style.height = E.h + 'px';
    on = true;
  }

  function frame() {
    raf = 0;
    if (!on) { fl.classList.remove('is-on'); nav.classList.remove('is-flying'); delete nav.dataset.threshold; return; }
    var p = Math.min(1, Math.max(0, window.scrollY / dist));
    /* wordmark: follows the lockup's own path, then dissolves — its bottom always clears the copy */
    var e = out3(p), s = lerp(S.w / T.w, 1, e);
    var lx = lerp(S.x, T.x, e), ly = lerp(S.y, T.y, e);
    word.style.transform = 'translate3d(' + lx + 'px,' + (ly + T.h * s * WORD_Y) + 'px,0) scale(' + s + ')';
    var fade = Math.max(0, 1 - p / 0.42);
    word.style.opacity = fade.toFixed(3);
    word.style.filter = p > 0 ? 'blur(' + (p * 12).toFixed(1) + 'px)' : 'none';
    /* emblem: lifts first (fast y), then glides across (eased x) — a soft curve, never downward */
    var e0 = { x: S.x + S.w * EMB_X, y: S.y, s: (S.w * EMB_W) / E.w };
    var ex = lerp(e0.x, E.x, io(p)), ey = lerp(e0.y, E.y, out4(p)), es = lerp(e0.s, 1, out3(p));
    emb.style.transform = 'translate3d(' + ex + 'px,' + ey + 'px,0) scale(' + es + ')';
    fl.style.setProperty('--p', p.toFixed(3));
    var landed = p >= 1;
    fl.classList.add('is-on');
    fl.classList.toggle('is-landed', landed);
    nav.classList.toggle('is-flying', !landed);
    nav.dataset.threshold = String(dist);
  }
  function queue() { if (!raf) raf = requestAnimationFrame(frame); }

  function start() {
    measure(); frame();
    fl.classList.add('is-rising');                          /* one-time sunrise on arrival */
    fl.addEventListener('animationend', function (e) {
      if (e.target.classList.contains('bf-shine')) fl.classList.remove('is-rising');
    });
    window.dispatchEvent(new Event('scroll'));
  }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', function () { measure(); queue(); });

  /* hold the sunrise until the age gate is passed, so nobody misses it behind the dialog */
  var gate = document.querySelector('.agegate');
  var go = function () { (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start); };
  if (gate && !gate.hidden) {
    new MutationObserver(function (m, o) { if (gate.hidden) { o.disconnect(); go(); } }).observe(gate, { attributes: true, attributeFilter: ['hidden'] });
  } else go();
})();

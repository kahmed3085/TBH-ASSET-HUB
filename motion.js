/* TBH Asset Hub — logo intro (page load) + outro (page leave). GSAP, Premium personality. */
(function () {
  var c = document.getElementById('tbh-curtain');
  if (!c) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var logo = c.querySelector('.tc-logo'), line = c.querySelector('.tc-line'),
      tag = c.querySelector('.tc-tag'), inner = c.querySelector('.tc-inner');
  var ss = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} }
  };
  function hide() { c.style.display = 'none'; c.style.pointerEvents = 'none'; }

  if (reduce || !window.gsap) {             // no GSAP / reduced motion: get out of the way
    if (!reduce) { c.style.transition = 'opacity .3s ease'; c.style.opacity = '0'; setTimeout(hide, 320); }
    else hide();
    return;
  }

  var g = window.gsap;
  c.style.animation = 'none';               // GSAP owns it now; drop the CSS failsafe
  var EASE_IN_OUT = 'power3.inOut', EASE_OUT = 'power3.out', EASE_IN = 'power2.in';
  var seen = ss.get('tbhIntroSeen') === '1';
  var fromOutro = ss.get('tbhOutro') === '1';
  ss.set('tbhIntroSeen', '1'); ss.del('tbhOutro');

  // Page content that rises as the curtain lifts (counter-motion)
  var hero = Array.prototype.slice.call(document.querySelectorAll('.top, header > *, nav.jump'));
  var cardRow = document.querySelector('main');
  if (cardRow && cardRow.querySelector(':scope > a.card')) hero.push(cardRow);   // hub: move the card row as one block

  var introTl = null;
  function intro() {
    var full = !seen && !fromOutro;
    var tl = introTl = g.timeline();

    if (full) {
      // Setup: logo masked, rule undrawn
      g.set(logo, { clipPath: 'inset(0% 100% 0% 0%)', scale: 0.98 });
      g.set(line, { scaleX: 0, transformOrigin: 'left center' });
      g.set(tag, { opacity: 0, y: 8 });
      // Action: wipe reveal (primary) + rule draw (secondary) + slow settle (ambient)
      tl.to(logo, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.95, ease: EASE_IN_OUT }, 0.15)
        .to(logo, { scale: 1, duration: 1.3, ease: 'sine.out' }, 0.15)
        .to(line, { scaleX: 1, duration: 0.85, ease: EASE_IN_OUT }, 0.35)
        .to(tag, { opacity: 1, y: 0, duration: 0.5, ease: EASE_OUT }, 0.75)
        .to({}, { duration: 0.25 });          // breathing room
    } else {
      // Quick version: logo already sitting there (continuity from the outro)
      g.set(logo, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1 });
      g.set(line, { scaleX: 1 });
      g.set(tag, { opacity: 1, y: 0 });
      tl.to({}, { duration: fromOutro ? 0.15 : 0.3 });
    }

    // Resolution: logo lifts off, rule retracts, curtain rises, page rises in behind it
    tl.addLabel('exit')
      .to(inner, { y: -14, opacity: 0, duration: 0.4, ease: EASE_IN }, 'exit')
      .to(line, { scaleX: 0, transformOrigin: 'right center', duration: 0.4, ease: EASE_IN }, 'exit')
      .to(c, { yPercent: -100, duration: 0.85, ease: 'expo.inOut', onComplete: hide }, 'exit+=0.2')
      .from(hero, { y: 28, opacity: 0, duration: 0.8, ease: EASE_OUT, stagger: 0.07, clearProps: 'transform,opacity' }, 'exit+=0.55');
  }

  function outro(href) {
    ss.set('tbhOutro', '1');
    if (introTl) { introTl.kill(); introTl = null; }
    c.style.display = 'flex'; c.style.pointerEvents = 'auto';
    g.killTweensOf([c, inner, logo, line, tag]);
    g.set(c, { yPercent: 100, opacity: 1, visibility: 'visible' });
    g.set(inner, { y: 14, opacity: 0 });
    g.set(logo, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1 });
    g.set(line, { scaleX: 0, transformOrigin: 'left center' });
    g.set(tag, { opacity: 1, y: 0 });
    g.timeline({ onComplete: function () { window.location.href = href; } })
      .to(c, { yPercent: 0, duration: 0.6, ease: 'expo.inOut' })
      .to(inner, { y: 0, opacity: 1, duration: 0.4, ease: EASE_OUT }, '-=0.2')
      .to(line, { scaleX: 1, duration: 0.45, ease: EASE_IN_OUT }, '<0.05')
      .to({}, { duration: 0.1 });
  }

  // Intercept internal page links only (not downloads, anchors, new tabs or modified clicks)
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.hasAttribute('download') || (a.target && a.target !== '_self')) return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;
    if (!/(\.html?$|\/$|^\/[^.]*$)/i.test(url.pathname)) return;   // pages only, not files
    e.preventDefault();
    outro(url.href);
  });

  // Back/forward cache: never come back to a closed curtain
  window.addEventListener('pageshow', function (e) { if (e.persisted) { g.killTweensOf(c); hide(); } });

  // Start once the logo is decoded so the wipe never reveals a blank
  var start = function () { requestAnimationFrame(intro); };
  if (logo.decode) logo.decode().then(start, start); else start();
})();

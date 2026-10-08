/* ==========================================================================
   REELNINJA — app.js
   Four jobs, all of them optional to the page working:
     1. reveal things on enter
     2. hairline under the nav once you clear the hero
     3. a reading-progress line on the header
     4. pause/play the running tickers
   Every one fails open. With no JS the page is complete: the reveal attributes
   are inert and the progress line is 0-width.
   No library, no smooth-scroll hijack.
   ========================================================================== */

(function () {
  /* ---------------------------------------------------------------- 1. reveal */
  var nodes = document.querySelectorAll('[data-reveal]');

  function showAll() {
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.add('is-in');
  }

  // Fail OPEN, always. No observer, no problem: everything is simply visible. The
  // .js class on <html> is what allowed the hidden starting state in the first
  // place, so content can never be hidden by script that then fails to run.
  //
  // Reduced motion is deliberately NOT short-circuited here any more. Jumping
  // straight to visible deleted the entrance entirely for anyone with the OS
  // setting on; the CSS now drops the translate and keeps the fade, so the
  // entrance survives without the displacement.
  if (!('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-in');
          io.unobserve(entries[i].target);
        }
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

    for (var j = 0; j < nodes.length; j++) io.observe(nodes[j]);

    // Anything already on screen at load shows immediately rather than waiting
    // for the observer's first frame. Without this the hero can sit blank for
    // one paint on a slow device.
    requestAnimationFrame(function () {
      for (var k = 0; k < nodes.length; k++) {
        if (nodes[k].getBoundingClientRect().top < window.innerHeight) {
          nodes[k].classList.add('is-in');
        }
      }
    });

    // Belt and braces: if the observer never fires for any reason, reveal
    // everything rather than leaving the page empty.
    window.setTimeout(showAll, 3000);
  }

  /* ------------------------------------------------- 2 + 3. the scroll handler
     One listener for both, throttled to a frame. Two independent scroll
     listeners each doing layout reads is how a sticky header ends up janky. */
  var head = document.querySelector('.site-head');
  var hero = document.querySelector('.hero');
  var bar = document.getElementById('progress');
  var queued = false;

  function measure() {
    queued = false;
    var y = window.scrollY || window.pageYOffset;

    if (head && hero) head.classList.toggle('is-stuck', y > hero.offsetHeight * 0.7);

    if (bar) {
      var span = document.documentElement.scrollHeight - window.innerHeight;
      var p = span > 0 ? y / span : 0;
      bar.style.transform = 'scaleX(' + (p < 0 ? 0 : p > 1 ? 1 : p) + ')';
    }
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(measure);
  }

  if (head || bar) {
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  /* ------------------------------------------------- 4. pause the tickers
     WCAG 2.2.2 wants a mechanism to stop auto-moving content. Hover is not one
     on touch and focus is not one mid-scroll, so there is a real control. */
  var pause = document.getElementById('mqpause');
  var strip = document.querySelector('.strip');

  if (pause && strip) {
    pause.addEventListener('click', function () {
      var paused = strip.classList.toggle('is-paused');
      // The label itself carries the state. Pairing a changing label with
      // aria-pressed made a screen reader announce "Play, pressed".
      pause.textContent = paused ? 'Play' : 'Pause';
    });
  }
})();

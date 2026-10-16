(function () {
  'use strict';

  function initializeHomeMotion() {
    var body = document.body;
    if (!body.classList.contains('home-page') || !('IntersectionObserver' in window)) return;

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var smallScreen = window.matchMedia('(max-width: 759px)');
    var reveals = [];
    var pans = [];
    var enterObserver;
    var resetObserver;
    var panObserver;
    var pendingFrame = 0;
    var enabled = false;

    function addReveals(selector, stagger) {
      Array.prototype.forEach.call(document.querySelectorAll(selector), function (element, index) {
        element.setAttribute('data-scroll-reveal', '');
        element.style.setProperty('--reveal-delay', Math.min(index * (stagger || 0), 240) + 'ms');
        reveals.push(element);
      });
    }

    // Animate whole content blocks, keeping text and keyboard targets together.
    addReveals('#about > .section-label, #about .about-grid > h2');
    addReveals('#about .about-copy');
    addReveals('#about .value-row > div', 100);
    addReveals('#business .section-heading > div, #business .section-heading > p');
    addReveals('#business .business-tabs');
    addReveals('#business .business-panel');
    addReveals('.sustainability-content > .section-label, .sustainability-content > h2');
    addReveals('.sustainability-content > p, .sustainability-keywords, .sustainability-content > a', 80);
    addReveals('#newsroom .section-heading > div, #newsroom .section-heading > a');
    addReveals('#newsroom .news-card', 110);
    addReveals('.careers-copy > .section-label, .careers-copy > h2');
    addReveals('.careers-copy > p, .careers-copy > a', 80);
    addReveals('.careers-visual');
    addReveals('.contact-inner > div', 110);

    Array.prototype.forEach.call(document.querySelectorAll('.hero, .sustainability-photo, .careers-image'), function (element) {
      element.setAttribute('data-scroll-pan', '');
      pans.push(element);
    });

    function positionReveal(element, rect) {
      element.style.setProperty('--reveal-offset', rect.bottom < 0 ? '-24px' : '32px');
    }

    function show(element) {
      element.classList.remove('is-outside');
      element.classList.add('is-revealed');
    }

    function primeVisibleContent() {
      var height = window.innerHeight;
      reveals.forEach(function (element) {
        if (!element.getClientRects().length) return;
        var rect = element.getBoundingClientRect();
        positionReveal(element, rect);
        element.classList.toggle('is-revealed', rect.bottom >= 0 && rect.top < height);
        element.classList.add('is-outside');
      });
    }

    function updatePan() {
      pendingFrame = 0;
      if (!enabled || reducedMotion.matches || smallScreen.matches || document.hidden) return;
      var height = window.innerHeight;
      // Read all geometry before writing transforms; only visible images are promoted.
      var updates = pans.filter(function (element) {
        return element.classList.contains('is-pan-visible');
      }).map(function (element) {
        var rect = element.getBoundingClientRect();
        var progress = Math.max(-1, Math.min(1, (height / 2 - rect.top - rect.height / 2) / ((height + rect.height) / 2)));
        return { element: element, offset: progress * Math.min(26, rect.height * .035) };
      });
      updates.forEach(function (update) {
        update.element.style.setProperty('--pan-offset', update.offset.toFixed(2) + 'px');
      });
    }

    function requestPan() {
      if (enabled && !reducedMotion.matches && !smallScreen.matches && !pendingFrame && !document.hidden) {
        pendingFrame = window.requestAnimationFrame(updatePan);
      }
    }

    function stop() {
      enabled = false;
      body.classList.remove('home-motion-ready');
      if (enterObserver) enterObserver.disconnect();
      if (resetObserver) resetObserver.disconnect();
      if (panObserver) panObserver.disconnect();
      window.cancelAnimationFrame(pendingFrame);
      pendingFrame = 0;
      reveals.forEach(show);
      pans.forEach(function (element) {
        element.classList.remove('is-pan-visible');
        element.style.removeProperty('--pan-offset');
      });
    }

    function start() {
      stop();
      if (reducedMotion.matches) return;
      try {
        primeVisibleContent();
        enterObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) show(entry.target);
          });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });

        resetObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            var element = entry.target;
            if (entry.isIntersecting || !element.getClientRects().length || element.contains(document.activeElement)) return;
            positionReveal(element, entry.boundingClientRect);
            element.classList.add('is-outside');
            element.classList.remove('is-revealed');
          });
        }, { rootMargin: '96px 0px 96px 0px', threshold: 0 });

        panObserver = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            entry.target.classList.toggle('is-pan-visible', entry.isIntersecting);
          });
          requestPan();
        }, { rootMargin: '80px 0px 80px 0px', threshold: 0 });

        reveals.forEach(function (element) {
          enterObserver.observe(element);
          resetObserver.observe(element);
        });
        pans.forEach(function (element) { panObserver.observe(element); });
        enabled = true;
        body.classList.add('home-motion-ready');
        requestPan();
      } catch (error) {
        // Motion is optional: never leave content hidden if setup fails.
        stop();
      }
    }

    document.addEventListener('focusin', function (event) {
      var target = event.target.closest('[data-scroll-reveal]');
      if (target) show(target);
    });
    window.addEventListener('scroll', requestPan, { passive: true });
    window.addEventListener('resize', requestPan, { passive: true });
    document.addEventListener('visibilitychange', requestPan);
    window.addEventListener('pageshow', function (event) {
      if (event.persisted && enabled) {
        primeVisibleContent();
        requestPan();
      }
    });
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', start);
    else if (reducedMotion.addListener) reducedMotion.addListener(start);
    start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHomeMotion, { once: true });
  } else {
    initializeHomeMotion();
  }
}());

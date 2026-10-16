(function () {
  'use strict';

  function initialize() {
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var header = document.getElementById('site-header');
    var menuToggle = document.getElementById('menu-toggle');
    var navigation = document.getElementById('primary-navigation');
    var backTop = document.querySelector('[data-back-top]');
    var desktopQuery = window.matchMedia('(min-width: 1080px)');
    var scrollPending = false;

    function setMenu(open, returnFocus) {
      if (!menuToggle || !navigation) return;
      document.body.classList.toggle('menu-open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      if (returnFocus) menuToggle.focus();
    }

    if (menuToggle && navigation) {
      menuToggle.addEventListener('click', function () {
        setMenu(menuToggle.getAttribute('aria-expanded') !== 'true', false);
      });
      navigation.addEventListener('click', function (event) {
        if (event.target.closest('a')) setMenu(false, false);
      });
      document.addEventListener('click', function (event) {
        if (document.body.classList.contains('menu-open') &&
            !navigation.contains(event.target) && !menuToggle.contains(event.target)) {
          setMenu(false, false);
        }
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
          setMenu(false, true);
        }
      });
      window.addEventListener('resize', function () {
        if (desktopQuery.matches) setMenu(false, false);
      });
    }

    function updateScrollState() {
      var position = window.scrollY || window.pageYOffset || 0;
      if (header) header.classList.toggle('is-scrolled', position > 24);
      if (backTop) {
        var visible = position > 600;
        backTop.classList.toggle('is-visible', visible);
        backTop.setAttribute('aria-hidden', String(!visible));
        backTop.tabIndex = visible ? 0 : -1;
      }
      scrollPending = false;
    }

    window.addEventListener('scroll', function () {
      if (!scrollPending) {
        scrollPending = true;
        window.requestAnimationFrame(updateScrollState);
      }
    }, { passive: true });
    updateScrollState();

    if (backTop) {
      backTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      });
    }

    initializeHero(reducedMotion);
    initializeBusinessTabs();
  }

  function initializeHero(reducedMotion) {
    var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
    if (!slides.length) return;

    var hero = slides[0].closest('[data-hero], .hero, #hero') || slides[0].parentElement;
    var previous = document.querySelector('[data-hero-prev]');
    var next = document.querySelector('[data-hero-next]');
    var pause = document.querySelector('[data-hero-pause]');
    var currentLabel = document.querySelector('[data-hero-current]');
    var totalLabel = document.querySelector('[data-hero-total]');
    var current = slides.findIndex(function (slide) { return slide.classList.contains('is-active'); });
    var timer = null;
    var userPaused = false;
    var keyboardMode = false;
    var keyboardFocusInside = false;
    var duration = 8500;
    if (current < 0) current = 0;

    function isPaused() {
      return userPaused || reducedMotion.matches || document.hidden || keyboardFocusInside;
    }

    function updatePlayback() {
      window.clearTimeout(timer);
      timer = null;
      var stopped = isPaused() || slides.length < 2;
      if (pause) {
        pause.setAttribute('aria-pressed', String(stopped));
        pause.setAttribute('aria-label', stopped ? '메인 비주얼 자동 재생 시작' : '메인 비주얼 자동 재생 일시 정지');
        pause.classList.toggle('is-paused', stopped);
        pause.disabled = reducedMotion.matches || slides.length < 2;
        if (reducedMotion.matches) {
          pause.setAttribute('aria-label', '움직임 줄이기 설정으로 자동 재생이 중지되었습니다');
        }
      }
      if (!stopped) {
        timer = window.setTimeout(function () { showSlide(current + 1); }, duration);
      }
    }

    function showSlide(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        var active = slideIndex === current;
        slide.hidden = !active;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
      });
      if (currentLabel) currentLabel.textContent = String(current + 1).padStart(2, '0');
      if (totalLabel) totalLabel.textContent = String(slides.length).padStart(2, '0');
      updatePlayback();
    }

    if (previous) previous.addEventListener('click', function () { showSlide(current - 1); });
    if (next) next.addEventListener('click', function () { showSlide(current + 1); });
    if (pause) {
      pause.addEventListener('click', function () {
        userPaused = !userPaused;
        updatePlayback();
      });
    }

    // Keyboard readers can explore a slide without an automatic transition.
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Tab' || event.key.indexOf('Arrow') === 0) {
        keyboardMode = true;
        keyboardFocusInside = hero.contains(document.activeElement);
        updatePlayback();
      }
    });
    document.addEventListener('pointerdown', function () {
      keyboardMode = false;
      if (keyboardFocusInside) {
        keyboardFocusInside = false;
        updatePlayback();
      }
    }, { passive: true });
    hero.addEventListener('focusin', function () {
      keyboardFocusInside = keyboardMode;
      updatePlayback();
    });
    hero.addEventListener('focusout', function (event) {
      if (!event.relatedTarget || !hero.contains(event.relatedTarget)) {
        keyboardFocusInside = false;
        updatePlayback();
      }
    });
    document.addEventListener('visibilitychange', updatePlayback);
    if (reducedMotion.addEventListener) {
      reducedMotion.addEventListener('change', updatePlayback);
    } else if (reducedMotion.addListener) {
      reducedMotion.addListener(updatePlayback);
    }
    showSlide(current);
  }

  function initializeBusinessTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-business-tab]'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('[data-business-panel]'));
    if (!tabs.length || !panels.length) return;

    function panelFor(tab) {
      return panels.find(function (panel) {
        return panel.getAttribute('data-business-panel') === tab.getAttribute('data-business-tab');
      });
    }

    var validTabs = tabs.filter(function (tab) { return Boolean(panelFor(tab)); });
    if (!validTabs.length) return;
    var tabList = validTabs[0].closest('[role="tablist"]') || validTabs[0].parentElement;
    tabList.setAttribute('role', 'tablist');

    validTabs.forEach(function (tab, index) {
      var panel = panelFor(tab);
      tab.id = tab.id || 'business-tab-' + (index + 1);
      panel.id = panel.id || 'business-panel-' + (index + 1);
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      if (!panel.hasAttribute('tabindex')) panel.tabIndex = 0;
    });

    function selectTab(selected, focus) {
      validTabs.forEach(function (tab) {
        var active = tab === selected;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        tab.classList.toggle('is-active', active);
        panelFor(tab).hidden = !active;
        panelFor(tab).classList.toggle('is-active', active);
      });
      if (focus) selected.focus();
    }

    validTabs.forEach(function (tab, index) {
      tab.addEventListener('click', function (event) {
        event.preventDefault();
        selectTab(tab, false);
      });
      tab.addEventListener('keydown', function (event) {
        var destination = index;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') destination = (index + 1) % validTabs.length;
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') destination = (index - 1 + validTabs.length) % validTabs.length;
        else if (event.key === 'Home') destination = 0;
        else if (event.key === 'End') destination = validTabs.length - 1;
        else return;
        event.preventDefault();
        selectTab(validTabs[destination], true);
      });
    });
    var initial = validTabs.find(function (tab) {
      return tab.getAttribute('aria-selected') === 'true' || tab.classList.contains('is-active');
    }) || validTabs[0];
    selectTab(initial, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
}());

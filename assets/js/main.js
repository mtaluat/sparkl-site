document.addEventListener('DOMContentLoaded', function() {
      
      /* --- MOBILE DRAWER INTERACTION LOGIC --- */
      const mobileBtn = document.getElementById('mobile-menu-btn');
      const mobileDrawer = document.getElementById('mobile-drawer');
      const mobileOverlay = document.getElementById('mobile-overlay');
      const mobileCloseBtn = document.getElementById('mobile-close-btn');
      const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

      function toggleMobileMenu(forceState) {
        if (!mobileDrawer || !mobileOverlay) return;
        const shouldOpen = typeof forceState === 'boolean' ? forceState : !mobileDrawer.classList.contains('open');
        const isOpen = mobileDrawer.classList.toggle('open', shouldOpen);
        mobileOverlay.classList.toggle('active', isOpen);
        mobileBtn?.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
        if (isOpen && mobileCloseBtn) mobileCloseBtn.focus({ preventScroll: true });
      }

      if(mobileBtn) mobileBtn.addEventListener('click', toggleMobileMenu);
      if(mobileCloseBtn) mobileCloseBtn.addEventListener('click', () => toggleMobileMenu(false));
      if(mobileOverlay) mobileOverlay.addEventListener('click', () => toggleMobileMenu(false));
      mobileNavLinks.forEach(link => link.addEventListener('click', () => {
        toggleMobileMenu(false);
      }));

      /* --- SPARKLES ENGINE (v28: container-relative fall, varied shapes, pauses offscreen) --- */
      const SHAPES = ['s-dot', 's-dot', 's-star', 's-diamond', 's-ring'];
      const sparkleReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function buildSparkles(id, desktopCount, mobileCount) {
        const container = document.getElementById(id);
        if (!container) return;
        container.textContent = '';
        const fall = container.offsetHeight || 600;
        container.style.setProperty('--fall', fall + 'px');
        const count = window.innerWidth <= 768 ? mobileCount : desktopCount;
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
          const el = document.createElement('span');
          const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
          const size = shape === 's-dot' ? 3 + Math.random() * 4 : 8 + Math.random() * 9;
          const speed = 55 + Math.random() * 95;
          const duration = Math.min(14, Math.max(4, fall / speed));
          el.className = 'sparkle-particle ' + shape;
          el.style.cssText = 'width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) + 'px;left:' + (Math.random() * 100).toFixed(1) + '%;' +
            '--sparkle-duration:' + duration.toFixed(2) + 's;--sparkle-delay:-' + (Math.random() * duration).toFixed(2) + 's;' +
            '--drift:' + (Math.random() * 120 - 60).toFixed(0) + 'px;--spin:' + (Math.random() * 360 - 180).toFixed(0) + 'deg;';
          if (sparkleReduced) el.style.top = (Math.random() * 100).toFixed(1) + '%';
          fragment.appendChild(el);
        }
        container.appendChild(fragment);
      }
      function buildAllSparkles() {
        buildSparkles('sparkles-container', 22, 10);
        buildSparkles('footer-sparkles-container', 14, 8);
      }
      buildAllSparkles();

      let sparkleTimer = 0, lastSparkleW = window.innerWidth;
      window.addEventListener('resize', () => {
        clearTimeout(sparkleTimer);
        sparkleTimer = setTimeout(() => {
          if (Math.abs(window.innerWidth - lastSparkleW) > 40) { lastSparkleW = window.innerWidth; buildAllSparkles(); }
        }, 250);
      }, { passive: true });

      if ('IntersectionObserver' in window) {
        const sparkleObserver = new IntersectionObserver(entries => {
          entries.forEach(entry => entry.target.classList.toggle('is-paused', !entry.isIntersecting));
        });
        ['sparkles-container', 'footer-sparkles-container'].forEach(id => {
          const node = document.getElementById(id);
          if (node) sparkleObserver.observe(node);
        });
      }

      /* --- UNIFIED REVEAL (v28): one system, then classes are removed so hover/tilt work normally --- */
      const motionDisabled = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.querySelectorAll('.partners-section, .process-section').forEach(el => el.classList.add('reveal'));
      const revealItems = document.querySelectorAll('.reveal');
      revealItems.forEach(el => {
        const parent = el.parentElement;
        if (parent && (parent.classList.contains('card-grid') || parent.classList.contains('footer-grid'))) {
          const idx = Array.prototype.indexOf.call(parent.children, el);
          el.style.transitionDelay = (idx * 0.08).toFixed(2) + 's';
        }
      });
      const finishReveal = el => setTimeout(() => {
        el.classList.remove('reveal', 'active');
        el.style.transitionDelay = '';
      }, 1500);
      if (motionDisabled || !('IntersectionObserver' in window)) {
        revealItems.forEach(el => { el.classList.add('active'); finishReveal(el); });
      } else {
        const revealObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('active');
              finishReveal(entry.target);
              observer.unobserve(entry.target);
            }
          });
        }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });
        requestAnimationFrame(() => revealItems.forEach(el => revealObserver.observe(el)));
      }

      if (!motionDisabled) {
        const header = document.querySelector('.brand-header');
        const hero = document.querySelector('.hero-container');
        let scrollFrame = 0;
        const updateScrollMotion = () => {
          scrollFrame = 0;
          const y = window.scrollY || window.pageYOffset;
          const doc = document.documentElement;
          const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
          doc.style.setProperty('--page-progress', Math.min(1, y / maxScroll).toFixed(4));
          if (header) header.classList.toggle('is-scrolled', y > 24);
                  };
        window.addEventListener('scroll', () => {
          if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollMotion);
        }, { passive: true });
        updateScrollMotion();
      }


      /* --- DARK MODE LOGIC --- */
      const toggleBtn = document.getElementById('theme-toggle');
      if(toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        let savedTheme = 'light';
        try { savedTheme = localStorage.getItem('sparklTheme') || 'light'; } catch (e) {}
        
        if (savedTheme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
          if(icon) icon.classList.replace('fa-moon', 'fa-sun');
        }

        toggleBtn.addEventListener('click', function() {
          const currentTheme = document.documentElement.getAttribute('data-theme');
          if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            try { localStorage.setItem('sparklTheme', 'light'); } catch (e) {}
            if(icon) icon.classList.replace('fa-sun', 'fa-moon');
          } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            try { localStorage.setItem('sparklTheme', 'dark'); } catch (e) {}
            if(icon) icon.classList.replace('fa-moon', 'fa-sun');
          }
        });
      }

      /* --- CARD SPOTLIGHT (pointer devices) --- */
      if (window.matchMedia('(hover: hover)').matches) {
        document.querySelectorAll('.card-liquid').forEach(card => {
          card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
            card.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
          }, { passive: true });
        });
      }

      /* --- NUMBER COUNTER ANIMATION (final numbers are in the HTML, so they show even without JS) --- */
      const counters = document.querySelectorAll('.counter');
      if ('IntersectionObserver' in window && !motionDisabled) {
        const counterObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target, target = +el.getAttribute('data-target'), t0 = performance.now(), dur = 1600;
            const tick = now => {
              const p = Math.min(1, (now - t0) / dur);
              el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            observer.unobserve(el);
          });
        }, { threshold: 0.5 });
        counters.forEach(counter => { counter.textContent = '0'; counterObserver.observe(counter); });
      }

      
/* --- PINCODE CHECKER LOGIC --- */
      const pinBtn = document.getElementById('pincode-btn');
      const pinInput = document.getElementById('pincode-input');
      const pinResult = document.getElementById('pincode-result');
      // EDIT THIS LIST: pincodes where Sparkl currently runs last-mile delivery.
      const ACTIVE_PINCODES = ['192303', '192304', '192305'];

      if (pinBtn && pinInput && pinResult) {
        pinInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); pinBtn.click(); } });
        pinBtn.addEventListener('click', () => {
          if (pinBtn.disabled) return;
          const pin = pinInput.value.replace(/\D/g, '');
          if (!/^\d{6}$/.test(pin)) {
            pinResult.style.color = 'var(--warn)';
            pinResult.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Please enter a valid 6-digit pin code.';
            return;
          }
          pinBtn.disabled = true;
          pinBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
          setTimeout(() => {
            if (ACTIVE_PINCODES.includes(pin)) {
              pinResult.style.color = 'var(--ok)';
              pinResult.innerHTML = '<i class="fa-solid fa-circle-check"></i> Standard & Express delivery active in this sector.';
            } else {
              pinResult.style.color = 'var(--warn)';
              pinResult.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Out of active range. Only bulk B2B freight drops available here.';
            }
            pinBtn.innerHTML = 'Verify';
            pinBtn.disabled = false;
          }, 600);
        });
      }

      
/* --- UNIFIED TRACKING: one search box, served by /api/track on the same Worker --- */
      const trackBtn = document.getElementById('track-btn');
      const trackingInput = document.getElementById('tracking-input');
      const resultContainer = document.getElementById('tracking-result');

      if (trackBtn && trackingInput && resultContainer) {
        const API = '/api/track';
        const STEPS = ['Picked up', 'At hub', 'In transit', 'Out for delivery', 'Delivered'];
        const HINT = 'Your tracking number is on your booking confirmation or the parcel label.';
        const hintEl = document.getElementById('track-hint');
        const recentEl = document.getElementById('recent-searches');
        const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        const norm = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const CLOSE = '<button type="button" class="tr-close" data-clear><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> New search</button>';
        let seq = 0, ctrl = null;

        const store = {
          get() { try { return JSON.parse(localStorage.getItem('sparklRecent') || '[]'); } catch (e) { return []; } },
          add(id) { try { localStorage.setItem('sparklRecent', JSON.stringify([id].concat(this.get().filter(x => x !== id)).slice(0, 3))); } catch (e) {} }
        };
        function drawRecent() {
          if (!recentEl) return;
          recentEl.innerHTML = store.get().map(id => '<button type="button" data-id="' + esc(id) + '">' + esc(id) + '</button>').join('');
        }
        const setHint = (text, isError) => { if (hintEl) { hintEl.textContent = text; hintEl.classList.toggle('is-error', !!isError); } };
        const show = html => { resultContainer.style.display = 'block'; resultContainer.innerHTML = html; };
        const message = (text, kind) => show('<p class="tr-msg ' + (kind || '') + '">' + text + '</p>' + (kind ? '<div class="tr-actions">' + CLOSE + '</div>' : ''));
        const setBusy = busy => { trackBtn.disabled = busy; trackBtn.textContent = busy ? 'Searching…' : 'Track Order'; trackBtn.setAttribute('aria-busy', String(busy)); };

        function clearResult(focus) {
          seq++; if (ctrl) ctrl.abort();
          resultContainer.style.display = 'none'; resultContainer.innerHTML = '';
          trackingInput.value = ''; trackingInput.removeAttribute('aria-invalid');
          setBusy(false); setHint(HINT, false);
          try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
          if (focus) trackingInput.focus({ preventScroll: true });
        }

        function render(d) {
          const i = STEPS.findIndex(s => s.toLowerCase() === String(d.status || '').trim().toLowerCase());
          const done = i === STEPS.length - 1;
          const steps = i >= 0 ? '<div class="tr-steps' + (done ? ' done' : '') + '">' + STEPS.map((s, k) => '<div class="tr-st' + (k <= i ? ' on' : '') + '">' + s + '</div>').join('') + '</div>' : '';
          const cells = [['From', d.origin], ['To', d.destination], ['Current location', d.location], ['ETA', d.eta], ['Carrier', d.partner]]
            .filter(c => c[1]).map(c => '<div><div class="tr-lbl">' + c[0] + '</div>' + esc(c[1]) + '</div>').join('');
          const events = (d.events || []).map(e => '<li><strong>' + esc(e.status) + (e.location ? ' · ' + esc(e.location) : '') + '</strong><span>' + esc(e.time) + (e.note ? ' — ' + esc(e.note) : '') + '</span></li>').join('');
          const help = 'mailto:cs@sparkllogistics.in?subject=' + encodeURIComponent('Help with shipment ' + d.id);
          show('<div class="tr-top"><div><div class="tr-lbl">Tracking no.</div><div class="tr-id">' + esc(d.id) + '</div></div><span class="tr-pill' + (done ? ' done' : '') + '">' + esc(d.status || 'In transit') + '</span></div>' +
            steps + (cells ? '<div class="tr-grid">' + cells + '</div>' : '') +
            (events ? '<div class="tr-lbl">History</div><ul class="tr-list">' + events + '</ul>' : '') +
            '<div class="tr-actions">' + CLOSE +
            '<button type="button" class="tr-tool" data-copy="' + esc(norm(d.id)) + '"><i class="fa-regular fa-copy" aria-hidden="true"></i> Copy link</button>' +
            '<a class="tr-tool" href="' + help + '"><i class="fa-regular fa-envelope" aria-hidden="true"></i> Need help?</a></div>');
          resultContainer.scrollIntoView({ behavior: motionDisabled ? 'auto' : 'smooth', block: 'nearest' });
        }

        async function run(raw) {
          const id = norm(raw);
          if (id.length < 6) { setHint('Please enter your full tracking number, e.g. SPK2026000001.', true); trackingInput.focus(); trackingInput.setAttribute('aria-invalid', 'true'); return; }
          const n = ++seq; if (ctrl) ctrl.abort(); ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 12000);
          setBusy(true); setHint(HINT, false);
          show('<p class="tr-msg"><span class="tr-spin" aria-hidden="true"></span>Looking up ' + esc(id) + '…</p>');
          try {
            const r = await fetch(API + '?id=' + encodeURIComponent(id), { signal: ctrl.signal, headers: { Accept: 'application/json' } });
            if (n !== seq) return;
            const isJson = (r.headers.get('content-type') || '').includes('json');
            if (r.ok && isJson) {
              const d = await r.json(); if (n !== seq) return;
              render(d); store.add(norm(d.id)); drawRecent();
              try { history.replaceState(null, '', '#' + norm(d.id)); } catch (e) {}
            } else if (r.status === 404 || r.status === 400) {
              message('We couldn’t find that tracking number. Please check it and try again.', 'err');
            } else {
              message('Tracking is temporarily unavailable. Please try again in a minute.', 'err');
            }
          } catch (e) {
            if (n === seq) message(e.name === 'AbortError' ? 'The request timed out. Please try again.' : 'Network problem. Check your connection and try again.', 'err');
          } finally {
            clearTimeout(timer); if (n === seq) setBusy(false);
          }
        }

        trackBtn.addEventListener('click', () => run(trackingInput.value));
        trackingInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); run(trackingInput.value); } });
        resultContainer.addEventListener('click', e => {
          if (e.target.closest('[data-clear]')) return clearResult(true);
          const cp = e.target.closest('[data-copy]');
          if (cp && navigator.clipboard) navigator.clipboard.writeText(location.origin + '/#' + cp.getAttribute('data-copy')).then(() => { cp.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Copied'; });
        });
        if (recentEl) recentEl.addEventListener('click', e => { const b = e.target.closest('[data-id]'); if (b) { trackingInput.value = b.getAttribute('data-id'); run(b.getAttribute('data-id')); } });
        const fromHash = () => { const h = decodeURIComponent((location.hash || '').slice(1)); if (/^SPK[\s-]?\d/i.test(h)) { trackingInput.value = h; run(h); } };
        window.addEventListener('hashchange', fromHash);
        drawRecent(); fromHash();
      }

      /* --- v28 UX ADDITIONS --- */
      const store = { get: k => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };

      // Announcement bar dismiss
      const alertBar = document.querySelector('.alert-banner');
      const alertClose = document.getElementById('alert-close');
      if (alertBar && store.get('sparklAlertHidden') === '1') alertBar.classList.add('is-hidden');
      if (alertBar && alertClose) alertClose.addEventListener('click', () => { alertBar.classList.add('is-hidden'); store.set('sparklAlertHidden', '1'); });

      // Drawer: Esc to close, close when resized to desktop
      document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMobileMenu(false); });
      window.addEventListener('resize', () => { if (window.innerWidth > 950) toggleMobileMenu(false); }, { passive: true });

      // Jump-to-track links focus the input
      document.querySelectorAll('a[href="#tracking-input"]').forEach(link => link.addEventListener('click', () => {
        setTimeout(() => { const input = document.getElementById('tracking-input'); if (input) input.focus({ preventScroll: true }); }, 500);
      }));

      // Input hygiene + clear error states
      const trackInputEl = document.getElementById('tracking-input');
      const trackHintEl = document.getElementById('track-hint');
      if (trackInputEl) trackInputEl.addEventListener('input', () => {
        trackInputEl.removeAttribute('aria-invalid');
        if (trackHintEl && trackHintEl.classList.contains('is-error')) {
          trackHintEl.classList.remove('is-error');
          trackHintEl.textContent = 'Your tracking number is on your booking confirmation or the parcel label.';
        }
      });
      const pinEl = document.getElementById('pincode-input');
      if (pinEl) pinEl.addEventListener('input', () => { pinEl.value = pinEl.value.replace(/\D/g, '').slice(0, 6); });

      // Active nav link while scrolling
      const spyLinks = Array.prototype.slice.call(document.querySelectorAll('.header-menu a[href^="#"]'));
      const spyMap = new Map();
      spyLinks.forEach(a => { const t = document.querySelector(a.getAttribute('href')); if (t) spyMap.set(t, a); });
      if ('IntersectionObserver' in window && spyMap.size) {
        const spy = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            const link = spyMap.get(entry.target);
            if (!link || !entry.isIntersecting) return;
            spyLinks.forEach(l => { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
            link.classList.add('is-active'); link.setAttribute('aria-current', 'true');
          });
        }, { rootMargin: '-40% 0px -55% 0px' });
        spyMap.forEach((a, t) => spy.observe(t));
      }

      // Back to top
      const toTop = document.getElementById('to-top');
      if (toTop) {
        const onTopScroll = () => toTop.classList.toggle('show', (window.scrollY || window.pageYOffset) > 700);
        window.addEventListener('scroll', onTopScroll, { passive: true });
        onTopScroll();
        toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: motionDisabled ? 'auto' : 'smooth' }));
      }

    });

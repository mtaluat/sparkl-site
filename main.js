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
        buildSparkles('sparkles-container', 38, 16);
        buildSparkles('footer-sparkles-container', 26, 12);
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
          if (hero) {
            const heroHeight = Math.max(1, hero.offsetHeight);
            const progress = Math.min(1, y / heroHeight);
            hero.style.setProperty('--hero-shift', (progress * -35).toFixed(2));
            hero.style.setProperty('--hero-fade', progress.toFixed(3));
          }
        };
        window.addEventListener('scroll', () => {
          if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollMotion);
        }, { passive: true });
        updateScrollMotion();
      }


      /* --- DEEP 3D POINTER PHYSICS --- */
      if (!motionDisabled && !('ontouchstart' in window)) {
        document.querySelectorAll('.fleet-content').forEach(element => {
          element.classList.add('physics-target');
          const state = { x: 0, y: 0, tx: 0, ty: 0, active: false, frame: 0 };
          
          const animate = () => {
            // Increased multiplier for snappier, deeper physics response
            state.x += (state.tx - state.x) * .20;
            state.y += (state.ty - state.y) * .20;
            
            element.style.setProperty('--ry', `${state.x.toFixed(2)}deg`);
            element.style.setProperty('--rx', `${(-state.y).toFixed(2)}deg`);
            element.style.setProperty('--px', `${(state.x * .3).toFixed(2)}px`);
            element.style.setProperty('--py', `${(state.y * .3).toFixed(2)}px`);
            element.style.setProperty('--gx', `${50 + state.x * 4}%`);
            element.style.setProperty('--gy', `${50 + state.y * 4}%`);
            element.style.setProperty('--physics-glow', state.active ? '1' : '0');
            
            if (state.active || Math.abs(state.x) > .05 || Math.abs(state.y) > .05) {
                state.frame = requestAnimationFrame(animate);
            } else {
                state.frame = 0;
            }
          };
          
          element.addEventListener('pointermove', event => {
            const rect = element.getBoundingClientRect();
            // Increased division multipliers for more aggressive rotation output
            state.tx = ((event.clientX - rect.left) / rect.width - .5) * 6; 
            state.ty = ((event.clientY - rect.top) / rect.height - .5) * 6; 
            state.active = true;
            if (!state.frame) state.frame = requestAnimationFrame(animate);
          }, { passive: true });
          
          element.addEventListener('pointerleave', () => {
            state.tx = 0; state.ty = 0; state.active = false;
            if (!state.frame) state.frame = requestAnimationFrame(animate);
          });
        });
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

      /* --- ENHANCED DYNAMIC 3D CARDS (DESKTOP ONLY) --- */
      const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      
      if(!isTouchDevice && window.innerWidth > 1024) {
        const cards = document.querySelectorAll('.card-liquid');
        cards.forEach(card => {
          let rafId = 0;
          let latestEvent = null;
          const updateCard = () => {
            rafId = 0;
            if (!latestEvent) return;
            const rect = card.getBoundingClientRect();
            const x = latestEvent.clientX - rect.left;
            const y = latestEvent.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
            
            // Doubled the rotation impact bounds for deeper 3D pop
            const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -4;
            const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 4;
            
            card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
          };
          card.addEventListener('mousemove', e => {
            card.classList.add('is-tilting');
            latestEvent = e;
            if (!rafId) rafId = requestAnimationFrame(updateCard);
          }, { passive: true });
          card.addEventListener('mouseleave', () => {
            latestEvent = null;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = 0;
            card.style.transform = '';
            card.classList.remove('is-tilting');
          });
        });
      }

      /* --- NUMBER COUNTER ANIMATION --- */
      const counters = document.querySelectorAll('.counter');
      const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = +entry.target.getAttribute('data-target');
            const duration = 2000; 
            const increment = target / (duration / 16);
            let current = 0;
            
            const updateCounter = () => {
              current += increment;
              if (current < target) {
                entry.target.innerText = Math.ceil(current);
                requestAnimationFrame(updateCounter);
              } else {
                entry.target.innerText = target;
              }
            };
            updateCounter();
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      
      counters.forEach(counter => counterObserver.observe(counter));

      /* --- PINCODE CHECKER LOGIC --- */
      const pinBtn = document.getElementById('pincode-btn');
      const pinInput = document.getElementById('pincode-input');
      const pinResult = document.getElementById('pincode-result');
      
      if(pinBtn && pinInput && pinResult) {
        const activePincodes = ['192303', '192304', '192305'];

        pinBtn.addEventListener('click', () => {
          const pin = pinInput.value.replace(/\D/g, '');
          if(!/^\d{6}$/.test(pin)) {
            pinResult.style.color = 'var(--warn)';
            pinResult.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Please enter a valid 6-digit pin code.';
            return;
          }
          
          pinBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
          
          setTimeout(() => {
            if(activePincodes.includes(pin)) {
              pinResult.style.color = 'var(--ok)';
              pinResult.innerHTML = '<i class="fa-solid fa-circle-check"></i> Standard & Express delivery active in this sector.';
            } else {
              pinResult.style.color = 'var(--warn)';
              pinResult.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Out of active range. Only bulk B2B freight drops available here.';
            }
            pinBtn.innerHTML = 'Verify';
          }, 600);
        });
      }

      /* --- API TRACKING LOGIC --- */
      const trackBtn = document.getElementById('track-btn');
      const trackingInput = document.getElementById('tracking-input');
      const resultContainer = document.getElementById('tracking-result');

      if(trackBtn && trackingInput && resultContainer) {
        const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
        trackingInput.addEventListener('keydown', e => { if (e.key === 'Enter') trackBtn.click(); });
        if (pinInput) pinInput.addEventListener('keydown', e => { if (e.key === 'Enter' && pinBtn) pinBtn.click(); });
        trackBtn.addEventListener('click', async function() {
          const trackingNumber = trackingInput.value.trim().toUpperCase();

          if (!trackingNumber) {
            const hint = document.getElementById('track-hint');
            if (hint) { hint.textContent = 'Please enter a waybill, AWB or order ID.'; hint.classList.add('is-error'); }
            trackingInput.focus(); trackingInput.setAttribute('aria-invalid', 'true');
            return;
          }

          trackBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Querying...';
          resultContainer.style.display = 'block';
          resultContainer.innerHTML = '<div style="text-align: center; padding: 25px;"><i class="fa-solid fa-satellite-dish fa-beat"></i> Querying regional infrastructure...</div>';

          try {
            const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 10000);
            const response = await fetch(`https://track.sparkllogistics.in/?awb=${encodeURIComponent(trackingNumber)}`, { signal: ctrl.signal }); clearTimeout(to);
            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || 'Tracking footprint not found.');
            }

            let timelineHTML = '<ul style="list-style: none; padding: 0; margin-top: 20px; border-left: 2px solid var(--accent-primary); margin-left: 12px;">';
            if (data.timeline && Array.isArray(data.timeline)) {
              data.timeline.forEach(item => {
                timelineHTML += `
                  <li style="position: relative; padding-left: 25px; margin-bottom: 12px; font-size: 1.05rem;">
                    <div style="position: absolute; left: -7px; top: 6px; width: 12px; height: 12px; background: var(--accent-primary); border-radius: 50%; box-shadow: 0 0 10px rgba(244,123,32,0.5);"></div>
                    <strong style="color: #D9D2C3;">${esc(item.time)}:</strong> ${esc(item.event)}
                  </li>`;
              });
            }
            timelineHTML += '</ul>';

            resultContainer.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px; margin-bottom: 20px;">
                <h4 style="margin: 0; color: var(--accent-primary); font-size: 1.45rem;"><i class="fa-solid fa-box-open" style="margin-right: 12px;"></i>${esc(data.awb_number || trackingNumber)}</h4>
                <span style="background: rgba(255,255,255,0.1); padding: 6px 18px; border-radius: 20px; font-size: 0.9rem; font-weight: 700; letter-spacing: 1px;">${esc(data.network_partner || 'Sparkl Regional')}</span>
              </div>
              <p style="margin-bottom: 10px; font-size: 1.15rem;"><strong style="color: #9A958A;">Logistics Status:</strong> <span style="color: #8DC63F; font-weight: 700;">${esc(data.status || 'In Transit')}</span></p>
              <p style="margin-bottom: 10px; font-size: 1.15rem;"><strong style="color: #9A958A;">Current Node:</strong> ${esc(data.location || 'Processing Hub')}</p>
              <p style="margin-bottom: 20px; font-size: 1.15rem;"><strong style="color: #9A958A;">Estimated Delivery:</strong> ${esc(data.estimated_delivery || 'Standard Dispatch Timelines')}</p>
              ${timelineHTML}
            `;

          } catch (error) {
            resultContainer.innerHTML = `
              <div style="color: #F47B20; padding: 15px; background: rgba(244,123,32, 0.1); border-radius: 12px; border: 1px solid rgba(244,123,32, 0.2); font-weight: 500; font-size: 1.1rem;">
                <i class="fa-solid fa-triangle-exclamation" style="margin-right: 10px;"></i> Could not securely fetch live routing details. Please verify your AWB node.
              </div>`;
          } finally {
            trackBtn.innerHTML = 'Track Order';
          }
        });
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
          trackHintEl.textContent = 'Your AWB is on the shipping confirmation or the parcel label.';
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

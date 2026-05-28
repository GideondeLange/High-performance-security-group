import './style.css';

/* ============================================================
   NAVBAR — scroll effect + mobile toggle
   ============================================================ */
const navbar   = document.getElementById('navbar');
const toggle   = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const NAV_H    = 68; // must match CSS nav-container height

function closeMobileNav() {
  navLinks.classList.remove('open');
  toggle.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}

// Scrolled glass effect
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
  // ✅ Close mobile menu when user scrolls the page
  if (navLinks.classList.contains('open')) closeMobileNav();
}, { passive: true });

// Hamburger toggle
toggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  toggle.classList.toggle('open', open);
  toggle.setAttribute('aria-expanded', String(open));
});

// Close mobile nav on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => closeMobileNav());
});

// ✅ Close mobile menu if window is resized to desktop width
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) closeMobileNav();
}, { passive: true });

/* ============================================================
   SMOOTH SCROLL for anchor links
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      // ✅ Use exact navbar height + small breathing gap
      const offset = NAV_H + 12; // 68 + 12 = 80px
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ============================================================
   SCROLL REVEAL — Intersection Observer
   ============================================================ */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // stagger cards within the same parent
        const siblings = entry.target.parentElement.querySelectorAll('.reveal');
        let delay = 0;
        siblings.forEach((el, idx) => {
          if (el === entry.target) delay = idx * 80;
        });
        setTimeout(() => entry.target.classList.add('visible'), delay);
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ============================================================
   COUNTER ANIMATION (hero stats)
   ============================================================ */
function animateCounter(el, target, duration = 1800) {
  let start = null;
  const step = (ts) => {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString();
  };
  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.stat-num[data-target]').forEach(el => {
        animateCounter(el, +el.dataset.target);
      });
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

/* ============================================================
   QUOTE CALCULATOR
   ============================================================ */
const CAM_PRICE   = 1500;   // upfront per camera
const GUARD_PRICE = 4000;   // per guard per week (≈ monthly ×4 = R16k, but shown as weekly)
const GUARD_MONTHLY = 16000; // guard cost monthly (4 weeks)

const camSlider   = document.getElementById('camSlider');
const camCount    = document.getElementById('camCount');
const camMinus    = document.getElementById('camMinus');
const camPlus     = document.getElementById('camPlus');

const guardSlider = document.getElementById('guardSlider');
const guardCount  = document.getElementById('guardCount');
const guardMinus  = document.getElementById('guardMinus');
const guardPlus   = document.getElementById('guardPlus');

const addonCheckboxes = document.querySelectorAll('.addon-check input[type="checkbox"]');

// Summary elements
const sumCamCount   = document.getElementById('sumCamCount');
const sumCamCost    = document.getElementById('sumCamCost');
const sumGuardCount = document.getElementById('sumGuardCount');
const sumGuardCost  = document.getElementById('sumGuardCost');
const totalUpfront  = document.getElementById('totalUpfront');
const totalMonthly  = document.getElementById('totalMonthly');
const modalUpfront  = document.getElementById('modalUpfront');
const modalMonthly  = document.getElementById('modalMonthly');

const addonRows = {
  'addon-monitoring': document.getElementById('addonMonitoringRow'),
  'addon-armed':      document.getElementById('addonArmedRow'),
  'addon-app':        document.getElementById('addonAppRow'),
  'addon-alarm':      document.getElementById('addonAlarmRow'),
};

function fmt(n) {
  return 'R' + n.toLocaleString('en-ZA');
}

function updateSliderFill(slider) {
  const min = +slider.min;
  const max = +slider.max;
  const val = +slider.value;
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.backgroundSize = `${pct}% 100%`;
}

function animateValue(el, newVal, formatFn) {
  el.style.transform = 'scale(1.1)';
  el.style.transition = 'transform 0.2s ease';
  el.textContent = formatFn(newVal);
  setTimeout(() => {
    el.style.transform = 'scale(1)';
  }, 200);
}

function recalculate() {
  const cams   = +camSlider.value;
  const guards = +guardSlider.value;

  // Sync counter display
  camCount.textContent   = cams;
  guardCount.textContent = guards;
  sumCamCount.textContent   = cams;
  sumGuardCount.textContent = guards;

  // Costs
  const camUpfront    = cams * CAM_PRICE;
  const guardWeekly   = guards * GUARD_PRICE;
  const guardMonthCost = guards * GUARD_MONTHLY;

  let addonMonthly = 0;
  addonCheckboxes.forEach(cb => {
    if (cb.checked) addonMonthly += +cb.dataset.price;
    const row = addonRows[cb.id];
    if (row) row.classList.toggle('hidden', !cb.checked);
  });

  const upfront = camUpfront;
  const monthly = guardMonthCost + addonMonthly;

  sumCamCost.textContent  = fmt(camUpfront);
  sumGuardCost.textContent = fmt(guardWeekly) + '/wk';

  animateValue(totalUpfront, upfront, fmt);
  animateValue(totalMonthly, monthly, fmt);

  // Update modal too
  if (modalUpfront) modalUpfront.textContent = fmt(upfront);
  if (modalMonthly) modalMonthly.textContent = fmt(monthly);

  updateSliderFill(camSlider);
  updateSliderFill(guardSlider);
}

// Slider input
camSlider.addEventListener('input', () => {
  camCount.textContent = camSlider.value;
  recalculate();
});
guardSlider.addEventListener('input', () => {
  guardCount.textContent = guardSlider.value;
  recalculate();
});

// Counter buttons
function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

camMinus.addEventListener('click', () => {
  camSlider.value = clamp(+camSlider.value - 1, +camSlider.min, +camSlider.max);
  recalculate();
});
camPlus.addEventListener('click', () => {
  camSlider.value = clamp(+camSlider.value + 1, +camSlider.min, +camSlider.max);
  recalculate();
});
guardMinus.addEventListener('click', () => {
  guardSlider.value = clamp(+guardSlider.value - 1, +guardSlider.min, +guardSlider.max);
  recalculate();
});
guardPlus.addEventListener('click', () => {
  guardSlider.value = clamp(+guardSlider.value + 1, +guardSlider.min, +guardSlider.max);
  recalculate();
});

addonCheckboxes.forEach(cb => cb.addEventListener('change', recalculate));

// Init
recalculate();

/* ============================================================
   MODAL
   ============================================================ */
const modalOverlay = document.getElementById('modalOverlay');
const modal        = document.getElementById('modal');
const modalClose   = document.getElementById('modalClose');
const lockInBtn    = document.getElementById('lockInBtn');
const modalForm    = document.getElementById('modalForm');

function openModal() {
  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

lockInBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

modalForm.addEventListener('submit', e => {
  e.preventDefault();
  closeModal();
  showToast('🔒 Quote locked! Our team will contact you within 2 hours.');
});

/* ============================================================
   CONTACT FORM
   ============================================================ */
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', e => {
  e.preventDefault();
  showToast('✅ Message sent! We\'ll be in touch shortly.');
  contactForm.reset();
});

/* ============================================================
   TOAST
   ============================================================ */
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ============================================================
   TESTIMONIAL SLIDER
   ============================================================ */
const track     = document.getElementById('testimonialTrack');
const dotsWrap  = document.getElementById('sliderDots');
const prevBtn   = document.getElementById('prevTestimonial');
const nextBtn   = document.getElementById('nextTestimonial');
const cards     = track ? track.querySelectorAll('.testimonial-card') : [];
let current     = 0;
let autoPlay;

function buildDots() {
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });
}

function goTo(idx) {
  current = (idx + cards.length) % cards.length;
  track.style.transform = `translateX(-${current * 100}%)`;
  dotsWrap.querySelectorAll('.slider-dot').forEach((d, i) => {
    d.classList.toggle('active', i === current);
  });
}

if (cards.length) {
  buildDots();
  prevBtn.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
  nextBtn.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

  function resetAuto() {
    clearInterval(autoPlay);
    autoPlay = setInterval(() => goTo(current + 1), 5500);
  }
  resetAuto();
}

// Touch/swipe support
let touchStartX = 0;
if (track) {
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      goTo(diff > 0 ? current + 1 : current - 1);
      resetAuto();
    }
  });
}

/* ============================================================
   NAVBAR ACTIVE LINK on scroll
   ============================================================ */
const sections = document.querySelectorAll('section[id]');
const allNavLinks = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      allNavLinks.forEach(link => {
        link.style.color = '';
        if (link.getAttribute('href') === `#${entry.target.id}`) {
          link.style.color = 'var(--blue-light)';
        }
      });
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));

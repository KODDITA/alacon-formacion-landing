// ---------- Configuración de premios ----------
// Cada premio siempre equivale a la mitad del valor mínimo de la formación
// a la que se puede aplicar (300 -> formaciones de más de 600, etc).
const PRIZES = [
  { amount: 300, fine: 600 },
  { amount: 400, fine: 800 },
  { amount: 500, fine: 1000 },
  { amount: 600, fine: 1200 }
];

const CANVAS_SIZE = 240;
const REVEAL_THRESHOLD = 0.5; // % del área borrada para dar por revelado el premio
const BRUSH_RADIUS = 20;
const PRIZE_STORAGE_KEY = 'alaconPromoPrize';

function setFooterYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

function pickRandomPrize() {
  return PRIZES[Math.floor(Math.random() * PRIZES.length)];
}

function getStoredPrize() {
  try {
    const raw = localStorage.getItem(PRIZE_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const isValid = PRIZES.some((p) => p.amount === data.amount && p.fine === data.fine);
    return isValid ? data : null;
  } catch (e) {
    // localStorage bloqueado (modo privado, cookies desactivadas, etc.): seguimos sin memoria
    return null;
  }
}

function storePrize(prize) {
  try {
    localStorage.setItem(PRIZE_STORAGE_KEY, JSON.stringify(prize));
  } catch (e) {
    // Si no se puede guardar, el premio simplemente no se recordará en la próxima visita
  }
}

// Asigna un premio nuevo la primera vez, y reutiliza el mismo en visitas
// posteriores desde el mismo navegador (evita que recargar la página cambie el premio).
// NOTA: de momento no se está usando (ver initScratchCard más abajo, que usa
// pickRandomPrize directamente). Se deja aquí lista para reactivarla más adelante.
function getOrAssignPrize() {
  const stored = getStoredPrize();
  if (stored) return stored;

  const prize = pickRandomPrize();
  storePrize(prize);
  return prize;
}

// Uso administrativo: visita la página como tuweb.com/?reset=1 para forzar
// que se asigne un premio nuevo, ignorando el que ya estuviera guardado.
// Solo tiene efecto si getOrAssignPrize() está activa en initScratchCard.
function maybeResetPrizeFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('reset')) {
      localStorage.removeItem(PRIZE_STORAGE_KEY);
    }
  } catch (e) {
    // localStorage no disponible: no hay nada que resetear
  }
}

function formatEuros(value) {
  return value.toLocaleString('es-ES') + ' €';
}

function renderPrize(prize) {
  document.getElementById('prizeAmount').textContent = formatEuros(prize.amount);
  document.getElementById('prizeFine').textContent =
      'Válido para formaciones de más de ' + formatEuros(prize.fine);
}

class ScratchCard {
  constructor(canvas, logoSrc, onReveal) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = CANVAS_SIZE;
    this.revealed = false;
    this.logoReady = false;
    this.onReveal = onReveal || function () {};

    this.logoImg = new Image();
    this.logoImg.onload = () => {
      this.logoReady = true;
      this.drawCoverLayer();
    };
    this.logoImg.src = logoSrc;

    this._bindEvents();
  }

  _bindEvents() {
    const onMove = (event) => {
      const pos = this._getPointerPosition(event);
      this._scratchAt(pos.x, pos.y);
      if (event.cancelable) event.preventDefault();
    };

    this.canvas.addEventListener('mousemove', onMove);
    this.canvas.addEventListener('touchstart', onMove, { passive: false });
    this.canvas.addEventListener('touchmove', onMove, { passive: false });
  }

  _getPointerPosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
      x: (clientX - rect.left) * (this.canvas.width / rect.width),
      y: (clientY - rect.top) * (this.canvas.height / rect.height)
    };
  }

  _roundRectPath(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  drawCoverLayer() {
    const ctx = this.ctx;
    const size = this.size;
    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = '#f2f6fa';
    this._roundRectPath(0, 0, size, size, 20);
    ctx.fill();

    if (this.logoReady) {
      const maxW = size * 0.62;
      const maxH = size * 0.5;
      const ratio = Math.min(maxW / this.logoImg.width, maxH / this.logoImg.height);
      const w = this.logoImg.width * ratio;
      const h = this.logoImg.height * ratio;
      ctx.drawImage(this.logoImg, (size - w) / 2, size * 0.16, w, h);
    }

    ctx.fillStyle = '#6b6b6c';
    ctx.font = '500 13px "Instrument Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pasa el cursor aquí', size / 2, size * 0.82);

    this.revealed = false;
  }

  _scratchAt(x, y) {
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    this._checkRevealed();
  }

  _checkRevealed() {
    if (this.revealed) return;
    const data = this.ctx.getImageData(0, 0, this.size, this.size).data;
    let transparent = 0;
    let total = 0;
    // Muestreamos 1 de cada 24 píxeles del canal alpha para no penalizar el rendimiento
    for (let i = 3; i < data.length; i += 4 * 24) {
      total++;
      if (data[i] === 0) transparent++;
    }
    if (total > 0 && transparent / total > REVEAL_THRESHOLD) {
      this.revealed = true;
      this.ctx.clearRect(0, 0, this.size, this.size);
      this.onReveal();
    }
  }
}

// ---------- Confetti ----------

const CONFETTI_COLORS = ['#e0a83a', '#046ca2', '#2e6b9f', '#1f4d76'];

function launchConfetti(container) {
  if (!container) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const pieceCount = 26;
  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';

    const angle = Math.random() * Math.PI * 2;
    const distance = 70 + Math.random() * 90;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - 30;
    const rot = Math.round(Math.random() * 520 - 260) + 'deg';

    piece.style.setProperty('--dx', dx + 'px');
    piece.style.setProperty('--dy', dy + 'px');
    piece.style.setProperty('--rot', rot);
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.animationDelay = (Math.random() * 0.12) + 's';

    container.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

function initScratchCard() {
  const canvas = document.getElementById('scratchCanvas');
  if (!canvas) return;

  const holder = document.querySelector('.scratch-holder');

  renderPrize(pickRandomPrize());
  new ScratchCard(canvas, 'img/logo.png', () => {
    launchConfetti(holder);
    trackEvent('prize_revealed');
  });
}

// ---------- Intro animada a pantalla completa ----------
// Se reproduce una única vez al abrir la página; al terminar, se desvanece
// y se elimina del DOM dejando ver el sitio real debajo.
// Respeta prefers-reduced-motion (el CSS ya oculta el overlay directamente).

function initIntroSplash() {
  const overlay = document.getElementById('introOverlay');
  if (!overlay) return;

  // Si el visitante prefiere movimiento reducido, el overlay ya está
  // oculto por CSS; lo quitamos del DOM y no bloqueamos el scroll.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    overlay.remove();
    return;
  }

  const PLAY_DURATION = 3600; // ms: duración total de la secuencia (logo + trazo + titular)
  const HOLD = 400;           // ms: pequeña pausa antes de desvanecer
  const FADE = 600;           // ms: debe coincidir con la transición de opacidad en CSS

  document.body.classList.add('intro-lock');

  // Doble rAF para asegurarnos de que el navegador ya pintó el estado
  // inicial antes de añadir la clase que dispara las animaciones.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlay.classList.add('af-play');
    });
  });

  setTimeout(() => {
    overlay.classList.add('intro-hide');
    document.body.classList.remove('intro-lock');
    setTimeout(() => overlay.remove(), FADE + 50);
  }, PLAY_DURATION + HOLD);
}

// ---------- Scroll progress bar ----------

function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;

  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ---------- Sticky mini nav ----------

function initMiniNav() {
  const nav = document.getElementById('miniNav');
  const hero = document.querySelector('.hero');
  if (!nav || !hero) return;

  const threshold = hero.offsetHeight * 0.6;

  const update = () => {
    if (window.scrollY > threshold) {
      nav.classList.add('is-visible');
    } else {
      nav.classList.remove('is-visible');
    }
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ---------- Parallax hero blobs ----------

function initParallax() {
  const blobs = document.querySelectorAll('.blob');
  if (!blobs.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const update = () => {
    const y = window.scrollY;
    blobs.forEach((blob, i) => {
      const speed = i === 0 ? 0.18 : 0.12;
      blob.style.transform = 'translateY(' + (y * speed) + 'px)';
    });
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ---------- Reveal on scroll ----------

function initScrollReveal() {
  const targets = document.querySelectorAll('.reveal, .reveal-stagger');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

// ---------- Animated stat counters ----------

function animateCounter(el) {
  const target = parseFloat(el.dataset.target);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const duration = 1200;
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    el.textContent = prefix + value.toLocaleString('es-ES') + suffix;
    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }
  requestAnimationFrame(frame);
}

function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;

  if (!('IntersectionObserver' in window)) {
    counters.forEach((el) => animateCounter(el));
    return;
  }

  const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

// ---------- Cookie consent + analítica ----------

const COOKIE_CONSENT_KEY = 'alaconCookieConsent';

function loadAnalytics() {
  const id = window.GA_MEASUREMENT_ID;
  if (!id || id.indexOf('XXXXXXXXXX') !== -1) return; // no configurado todavía

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, { anonymize_ip: true });
}

function trackEvent(name, params) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params || {});
  }
}

function initCookieConsent() {
  const banner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('cookieAccept');
  const rejectBtn = document.getElementById('cookieReject');
  if (!banner || !acceptBtn || !rejectBtn) return;

  let stored = null;
  try {
    stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  } catch (e) {
    stored = null;
  }

  if (stored === 'accepted') {
    loadAnalytics();
  } else if (stored !== 'rejected') {
    banner.classList.add('is-visible');
  }

  acceptBtn.addEventListener('click', () => {
    try { localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted'); } catch (e) {}
    banner.classList.remove('is-visible');
    loadAnalytics();
  });

  rejectBtn.addEventListener('click', () => {
    try { localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected'); } catch (e) {}
    banner.classList.remove('is-visible');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setFooterYear();
  initScratchCard();
  initIntroSplash();
  initScrollProgress();
  initMiniNav();
  initParallax();
  initScrollReveal();
  initCounters();
  initCookieConsent();

  const whatsappLinks = document.querySelectorAll('a[href*="wa.me"]');
  whatsappLinks.forEach((link) => {
    link.addEventListener('click', () => trackEvent('whatsapp_click'));
  });
});
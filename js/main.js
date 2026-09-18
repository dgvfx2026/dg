/**
 * DG VFX Portfolio — main.js
 * Animações, lazy loading, interações, modal, nav
 */

'use strict';

/* ===== Utility ===== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const isMobile = () => window.innerWidth < 768;
const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===== Nav scroll behavior ===== */
const nav = $('#nav');
let lastScroll = 0;

function handleNavScroll() {
  const scroll = window.scrollY;
  if (scroll > 60) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
  lastScroll = scroll;
}

window.addEventListener('scroll', handleNavScroll, { passive: true });
handleNavScroll();

/* ===== Mobile menu ===== */
const burger = $('#navBurger');
const mobileMenu = $('#mobileMenu');

function toggleMobileMenu(open) {
  burger.classList.toggle('active', open);
  mobileMenu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.style.overflow = open ? 'hidden' : '';
}

burger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.contains('open');
  toggleMobileMenu(!isOpen);
});

// Close on link click
$$('.nav__mobile-link, .nav__mobile-cta').forEach(link => {
  link.addEventListener('click', () => toggleMobileMenu(false));
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (mobileMenu.classList.contains('open')) toggleMobileMenu(false);
    if (!videoModal.hidden) closeModal();
  }
});

/* ===== Reveal on scroll ===== */
function initReveal() {
  if (prefersReducedMotion()) {
    $$('.reveal-up').forEach(el => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger siblings
        const siblings = $$('.reveal-up', entry.target.parentElement);
        const idx = siblings.indexOf(entry.target);
        const delay = Math.min(idx * 80, 400);
        setTimeout(() => {
          entry.target.classList.add('revealed');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  $$('.reveal-up').forEach(el => observer.observe(el));
}

// Trigger hero reveal immediately
function initHeroReveal() {
  if (prefersReducedMotion()) return;
  $$('.hero .reveal-up').forEach((el, i) => {
    setTimeout(() => el.classList.add('revealed'), 100 + i * 120);
  });
}

/* ===== Lazy video loading ===== */
function initLazyVideos() {
  const videos = $$('video[data-src]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        const src = video.getAttribute('data-src');
        if (src && !video.src) {
          video.src = src;
          video.removeAttribute('data-src');
          video.load();
        }
        observer.unobserve(video);
      }
    });
  }, {
    rootMargin: '200px 0px',
    threshold: 0
  });

  videos.forEach(v => observer.observe(v));
}

/* ===== Video hover autoplay ===== */
function initVideoHover() {
  const cards = $$('.portfolio-card');

  cards.forEach(card => {
    const video = card.querySelector('.portfolio-card__video');
    if (!video) return;

    let playPromise = null;

    card.addEventListener('mouseenter', () => {
      if (isMobile()) return;
      // Load if not loaded yet
      if (video.getAttribute('data-src')) {
        video.src = video.getAttribute('data-src');
        video.removeAttribute('data-src');
        video.load();
      }
      playPromise = video.play().catch(() => {});
    });

    card.addEventListener('mouseleave', () => {
      if (isMobile()) return;
      if (playPromise !== null) {
        playPromise.then(() => {
          video.pause();
          video.currentTime = 0;
        }).catch(() => {});
      }
    });

    // Touch: play on tap, open modal on second tap
    let tapped = false;
    card.addEventListener('touchstart', () => {
      if (!tapped) {
        if (video.getAttribute('data-src')) {
          video.src = video.getAttribute('data-src');
          video.removeAttribute('data-src');
          video.load();
        }
        video.play().catch(() => {});
        tapped = true;
      }
    }, { passive: true });
  });
}

/* ===== Video Modal ===== */
const videoModal = $('#videoModal');
const modalVideo = $('#modalVideo');
const modalClose = $('#modalClose');

function openModal(src, poster) {
  modalVideo.src = src;
  if (poster) modalVideo.poster = poster;
  videoModal.hidden = false;
  document.body.style.overflow = 'hidden';
  modalVideo.play().catch(() => {});
  modalClose.focus();
}

function closeModal() {
  modalVideo.pause();
  modalVideo.src = '';
  videoModal.hidden = true;
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
videoModal.addEventListener('click', (e) => {
  if (e.target === videoModal) closeModal();
});

// Open modal on card click (desktop: only when not just playing on hover)
$$('.portfolio-card').forEach(card => {
  const video = card.querySelector('.portfolio-card__video');
  if (!video) return;

  card.addEventListener('click', () => {
    const src = video.src || video.getAttribute('data-src') || '';
    const poster = video.poster || '';
    if (src) openModal(src, poster);
  });

  // Keyboard support
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Ver projeto: ${card.querySelector('.portfolio-card__title')?.textContent || 'vídeo'}`);
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });
});

/* ===== Custom cursor (desktop only) ===== */
function initCursor() {
  if (isMobile()) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const cursor = $('#cursor');
  const follower = $('#cursorFollower');
  if (!cursor || !follower) return;

  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;
  let raf = null;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top = mouseY + 'px';
  }, { passive: true });

  function animateFollower() {
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    follower.style.left = followerX + 'px';
    follower.style.top = followerY + 'px';
    raf = requestAnimationFrame(animateFollower);
  }
  animateFollower();

  // Enlarge on interactive elements
  const interactives = $$('a, button, .portfolio-card, [role="button"]');
  interactives.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(2)';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
    });
  });
}

/* ===== Hero video performance ===== */
function initHeroVideo() {
  const heroVideo = $('.hero__video');
  if (!heroVideo) return;

  // On mobile, pause hero video to save battery
  if (isMobile()) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          heroVideo.play().catch(() => {});
        } else {
          heroVideo.pause();
        }
      });
    }, { threshold: 0.1 });
    observer.observe(heroVideo);
  }
}

/* ===== Smooth anchor scrolling ===== */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = $(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    });
  });
}

/* ===== Parallax (very subtle, desktop only) ===== */
function initParallax() {
  if (prefersReducedMotion() || isMobile()) return;

  const heroVideo = $('.hero__video');
  if (!heroVideo) return;

  window.addEventListener('scroll', () => {
    const scroll = window.scrollY;
    const speed = 0.25;
    heroVideo.style.transform = `translateY(${scroll * speed}px)`;
  }, { passive: true });
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  initHeroReveal();
  initReveal();
  initLazyVideos();
  initVideoHover();
  initCursor();
  initHeroVideo();
  initSmoothScroll();
  initParallax();

  // Announce page load to screen readers
  document.title = 'DG VFX — IA, 3D e VFX para vídeos publicitários';
});

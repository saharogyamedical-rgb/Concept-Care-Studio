(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const safeFbq = (eventName, payload = {}) => {
    if (typeof window.fbq === 'function') {
      try { window.fbq('track', eventName, payload); } catch (error) { /* Pixel should never break UI */ }
    }
  };

  const safeFbqCustom = (eventName, payload = {}) => {
    if (typeof window.fbq === 'function') {
      try { window.fbq('trackCustom', eventName, payload); } catch (error) { /* Pixel should never break UI */ }
    }
  };

  window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    if (!preloader) return;
    window.setTimeout(() => preloader.classList.add('hide'), prefersReduced ? 0 : 850);
    window.setTimeout(() => preloader.remove(), prefersReduced ? 10 : 1600);
  });

  const rootGlow = document.querySelector('.site-bg');
  if (rootGlow && !prefersReduced) {
    window.addEventListener('pointermove', (event) => {
      rootGlow.style.setProperty('--x', `${event.clientX}px`);
      rootGlow.style.setProperty('--y', `${event.clientY}px`);
    }, { passive: true });
  }

  const menuButton = document.querySelector('[data-menu-toggle]');
  const navLinks = document.querySelector('[data-nav-links]');
  const closeMenu = () => {
    menuButton?.classList.remove('active');
    navLinks?.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = navLinks?.classList.toggle('open');
    menuButton.classList.toggle('active', Boolean(isOpen));
    document.body.classList.toggle('menu-open', Boolean(isOpen));
    menuButton.setAttribute('aria-expanded', String(Boolean(isOpen)));
  });

  navLinks?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    revealElements.forEach((element, index) => {
      element.style.transitionDelay = `${Math.min(index * 38, 190)}ms`;
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach((element) => element.classList.add('visible'));
  }

  const serviceSection = document.querySelector('#services');
  if (serviceSection && 'IntersectionObserver' in window) {
    let serviceTracked = false;
    const serviceObserver = new IntersectionObserver((entries) => {
      const active = entries.some((entry) => entry.isIntersecting);
      if (active && !serviceTracked) {
        serviceTracked = true;
        safeFbq('ViewContent', { content_name: 'Concept Care Services Section' });
        serviceObserver.disconnect();
      }
    }, { threshold: 0.3 });
    serviceObserver.observe(serviceSection);
  }

  document.querySelectorAll('.js-lead').forEach((button) => {
    button.addEventListener('click', () => {
      const label = button.getAttribute('data-lead-label') || 'WhatsApp Contact';
      safeFbq('Contact', { content_name: label });
      safeFbq('Lead', { content_name: label });
      safeFbqCustom('WhatsAppClick', { button: label });
    });
  });

  document.querySelectorAll('.js-call').forEach((button) => {
    button.addEventListener('click', () => {
      const label = button.getAttribute('data-call-label') || 'Phone Call';
      safeFbq('Contact', { content_name: label, contact_method: 'phone' });
      safeFbq('Lead', { content_name: label, contact_method: 'phone' });
      safeFbqCustom('PhoneClick', { button: label });
    });
  });

  const reviewSlider = document.querySelector('#reviewSlider');
  const reviewCards = reviewSlider ? Array.from(reviewSlider.querySelectorAll('.review-card')) : [];
  const reviewDots = document.querySelector('#reviewDots');
  const previousReview = document.querySelector('[data-review-prev]');
  const nextReview = document.querySelector('[data-review-next]');

  const getVisibleReviewCount = () => {
    if (window.matchMedia('(max-width: 820px)').matches) return 1;
    if (window.matchMedia('(max-width: 1120px)').matches) return 2;
    return 3;
  };

  const getReviewStep = () => {
    if (!reviewCards.length) return 0;
    const style = window.getComputedStyle(reviewSlider);
    const gap = Number.parseFloat(style.columnGap || style.gap || '16') || 16;
    return reviewCards[0].getBoundingClientRect().width + gap;
  };

  const updateReviewDots = () => {
    if (!reviewSlider || !reviewDots || !reviewCards.length) return;
    const step = getReviewStep();
    if (!step) return;
    const activeIndex = Math.max(0, Math.round(reviewSlider.scrollLeft / step));
    const dotCount = Math.max(1, reviewCards.length - getVisibleReviewCount() + 1);
    reviewDots.innerHTML = '';

    for (let index = 0; index < dotCount; index += 1) {
      const dot = document.createElement('button');
      dot.className = `review-dot${index === activeIndex ? ' active' : ''}`;
      dot.type = 'button';
      dot.setAttribute('aria-label', `Show review ${index + 1}`);
      dot.addEventListener('click', () => reviewSlider.scrollTo({ left: index * step, behavior: 'smooth' }));
      reviewDots.appendChild(dot);
    }
  };

  const slideReviews = (direction) => {
    if (!reviewSlider) return;
    reviewSlider.scrollBy({ left: direction * getReviewStep(), behavior: 'smooth' });
  };

  previousReview?.addEventListener('click', () => slideReviews(-1));
  nextReview?.addEventListener('click', () => slideReviews(1));
  reviewSlider?.addEventListener('scroll', () => window.requestAnimationFrame(updateReviewDots), { passive: true });
  window.addEventListener('resize', updateReviewDots);
  updateReviewDots();

  if (reviewSlider && !prefersReduced) {
    window.setInterval(() => {
      const maxScroll = reviewSlider.scrollWidth - reviewSlider.clientWidth - 4;
      if (reviewSlider.scrollLeft >= maxScroll) {
        reviewSlider.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        slideReviews(1);
      }
    }, 6500);
  }

  const toastRoot = document.querySelector('#liveReviewToast');
  const toastReviews = [
    { name: 'Aarav', text: 'Premium posters made our brand look professional.', stars: '★★★★★' },
    { name: 'Nisha', text: 'Landing page clarity improved our WhatsApp enquiries.', stars: '★★★★★' },
    { name: 'Rohan', text: 'Meta ads finally had a proper creative direction.', stars: '★★★★★' },
    { name: 'Priya', text: 'Website design gave our business more trust online.', stars: '★★★★★' },
    { name: 'Simran', text: 'Reel concept and editing were sharp and engaging.', stars: '★★★★★' }
  ];

  let toastIndex = 0;
  const showToast = () => {
    if (!toastRoot || window.matchMedia('(max-width: 560px)').matches) return;
    const review = toastReviews[toastIndex % toastReviews.length];
    toastIndex += 1;
    toastRoot.innerHTML = `
      <div class="toast-card">
        <span class="avatar">${review.name.charAt(0)}</span>
        <div>
          <b>${review.name} posted a review</b>
          <p>${review.text}</p>
          <small>${review.stars}</small>
        </div>
      </div>`;
  };

  if (!prefersReduced) {
    window.setTimeout(showToast, 2800);
    window.setInterval(showToast, 7200);
  }

  const backTop = document.querySelector('[data-back-top]');
  window.addEventListener('scroll', () => {
    backTop?.classList.toggle('show', window.scrollY > 650);
  }, { passive: true });
  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

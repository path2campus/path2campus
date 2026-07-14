/* ============================================================
   PATH2CAMPUS — NAV LOGIC
   1. Tự động gắn class "is-active" vào đúng mục nav chính theo
      trang hiện tại.
   2. Dropdown desktop (Xếp hạng học thuật / Giới thiệu) — click
      để mở, click ra ngoài hoặc Esc để đóng.
   3. Mobile nav panel — trượt từ bên phải, kèm overlay + accordion.
   ============================================================ */

(function () {

  // ------------------------------------------------------------
  // 1. ACTIVE STATE CHO NAV CHÍNH
  // ------------------------------------------------------------
  const navLinks = document.querySelectorAll('.site-nav__link');

  function normalizePath(path) {
    if (path.endsWith('/index.html')) {
      path = path.slice(0, -'index.html'.length);
    }
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return path || '/';
  }

  if (navLinks.length > 0) {
    const currentPath = normalizePath(window.location.pathname);

    navLinks.forEach((link) => {
      const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);

      const isExactMatch = linkPath === currentPath;
      const isDiemChuanSection =
        linkPath === '/diem-chuan.html' && currentPath.startsWith('/diem-chuan/');

      link.classList.toggle('is-active', isExactMatch || isDiemChuanSection);
    });
  }


  // ------------------------------------------------------------
  // 2. DROPDOWN DESKTOP (Xếp hạng học thuật / Giới thiệu)
  // ------------------------------------------------------------
  const dropdowns = document.querySelectorAll('.dropdown');

  function closeAllDropdowns(except) {
    dropdowns.forEach((dd) => {
      if (dd !== except) {
        dd.classList.remove('is-open');
        const trigger = dd.querySelector('.site-subnav__trigger');
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector('.site-subnav__trigger');
    if (!trigger) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('is-open');
      closeAllDropdowns(dropdown);
      dropdown.classList.toggle('is-open', !isOpen);
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  // Click ra ngoài → đóng hết dropdown
  document.addEventListener('click', () => closeAllDropdowns());

  // Esc → đóng hết dropdown
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllDropdowns();
  });


  // ------------------------------------------------------------
  // 3. MOBILE NAV PANEL — trượt từ phải + overlay + accordion
  // ------------------------------------------------------------
  const menuToggle   = document.getElementById('menuToggle');
  const mobilePanel  = document.getElementById('mobileNavPanel');
  const mobileClose  = document.getElementById('mobileNavClose');
  const mobileOverlay = document.getElementById('mobileNavOverlay');

  function openMobileNav() {
    if (!mobilePanel || !mobileOverlay) return;
    mobilePanel.classList.add('is-open');
    mobileOverlay.classList.add('is-open');
    mobilePanel.setAttribute('aria-hidden', 'false');
    menuToggle?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // chặn cuộn nền khi panel mở
  }

  function closeMobileNav() {
    if (!mobilePanel || !mobileOverlay) return;
    mobilePanel.classList.remove('is-open');
    mobileOverlay.classList.remove('is-open');
    mobilePanel.setAttribute('aria-hidden', 'true');
    menuToggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (menuToggle && mobilePanel && mobileOverlay) {
    menuToggle.addEventListener('click', openMobileNav);
    mobileClose?.addEventListener('click', closeMobileNav);
    mobileOverlay.addEventListener('click', closeMobileNav);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });

    // Đóng panel khi bấm chọn 1 link điều hướng trực tiếp (không phải accordion trigger)
    mobilePanel.querySelectorAll('.mobile-nav-panel__link, .mobile-nav-panel__accordion-body a')
      .forEach((link) => link.addEventListener('click', closeMobileNav));
  }

  // Accordion trong mobile panel (Xếp hạng học thuật / Giới thiệu)
  const accordionTriggers = document.querySelectorAll('.mobile-nav-panel__accordion-trigger');

  accordionTriggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const key = trigger.getAttribute('data-accordion');
      const body = document.querySelector(`[data-accordion-body="${key}"]`);
      if (!body) return;

      const isOpen = body.classList.contains('is-open');
      body.classList.toggle('is-open', !isOpen);
      trigger.classList.toggle('is-open', !isOpen);
    });
  });

})();

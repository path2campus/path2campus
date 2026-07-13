/* ============================================================
   PATH2CAMPUS — NAV LOGIC
   Tự động gắn class "is-active" vào đúng mục nav bar dựa theo
   trang hiện tại — không cần hard-code is-active trong từng HTML,
   tránh quên sửa khi copy header giữa các trang.
   ============================================================ */

(function () {
  const navLinks = document.querySelectorAll('.site-nav__link');
  if (navLinks.length === 0) return;

  // Chuẩn hoá pathname hiện tại: bỏ trailing slash, coi "/index.html" == "/"
  function normalizePath(path) {
    if (path.endsWith('/index.html')) {
      path = path.slice(0, -'index.html'.length);
    }
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return path || '/';
  }

  const currentPath = normalizePath(window.location.pathname);

  navLinks.forEach((link) => {
    const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);

    // Trang chi tiết trường (/diem-chuan/neu/...) vẫn tính là active
    // ở mục "Tra cứu điểm chuẩn" — so khớp theo tiền tố thư mục.
    const isExactMatch = linkPath === currentPath;
    const isDiemChuanSection =
      linkPath === '/diem-chuan.html' && currentPath.startsWith('/diem-chuan/');

    link.classList.toggle('is-active', isExactMatch || isDiemChuanSection);
  });

  // ------------------------------------------------------------
  // MENU MOBILE — hamburger toggle (dưới breakpoint 767px)
  // Chỉ chạy nếu trang có gắn nút toggle (không bắt buộc phải có)
  // ------------------------------------------------------------
  const menuToggle = document.querySelector('.site-header__menu-toggle');
  const navBar = document.querySelector('.site-nav');

  if (menuToggle && navBar) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navBar.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Đóng menu khi bấm chọn 1 mục (mobile)
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        navBar.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();

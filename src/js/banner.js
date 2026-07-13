/* ============================================================
   PATH2CAMPUS — BANNER CAROUSEL
   Auto-play + nút bấm tay (prev/next/dots) + card nội dung
   riêng cho từng slide, load động từ data/banner-content.json
   ============================================================ */

(function () {
  const AUTOPLAY_INTERVAL = 6000; // 6 giây/slide

  const track   = document.getElementById('bannerTrack');
  const slides  = track ? track.querySelectorAll('.banner__slide') : [];
  const dots    = document.querySelectorAll('#bannerDots .banner__dot');
  const btnPrev = document.getElementById('bannerPrev');
  const btnNext = document.getElementById('bannerNext');
  const cardTitle = document.getElementById('bannerCardTitle');
  const cardBtn   = document.getElementById('bannerCardBtn');

  if (!track || slides.length === 0) return; // trang không có banner (không phải trang chủ)

  let current = 0;
  let autoplayTimer = null;
  let bannerContent = [];

  // ------------------------------------------------------------
  // LOAD NỘI DUNG CARD TỪ JSON
  // ------------------------------------------------------------
  async function loadBannerContent() {
    try {
      const res = await fetch('/data/banner-content.json');
      if (!res.ok) throw new Error('Không tải được banner-content.json');
      bannerContent = await res.json();
    } catch (err) {
      console.error('[banner.js] Lỗi tải nội dung banner:', err);
      bannerContent = [];
    }
    updateCard(current);
  }

  // ------------------------------------------------------------
  // CẬP NHẬT CARD THEO SLIDE ĐANG ACTIVE
  // ------------------------------------------------------------
  function updateCard(index) {
    if (!cardTitle || !cardBtn) return;

    const data = bannerContent.find(item => item.slide === index + 1);
    if (!data) {
      cardTitle.textContent = '';
      cardBtn.style.display = 'none';
      return;
    }

    cardTitle.textContent = data.title || '';
    cardBtn.textContent = data.buttonText || 'Truy cập';
    cardBtn.href = data.buttonLink || '#';
    cardBtn.style.display = data.buttonLink ? 'inline-flex' : 'none';
  }

  // ------------------------------------------------------------
  // CHUYỂN SLIDE
  // ------------------------------------------------------------
  function goToSlide(index) {
    current = (index + slides.length) % slides.length;

    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === current);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === current);
    });

    updateCard(current);
  }

  function nextSlide() {
    goToSlide(current + 1);
  }

  function prevSlide() {
    goToSlide(current - 1);
  }

  // ------------------------------------------------------------
  // AUTO-PLAY
  // ------------------------------------------------------------
  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, AUTOPLAY_INTERVAL);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  // Dừng auto-play khi người dùng chủ động bấm nút, khởi động lại sau
  // một khoảng nghỉ để không "giật" ngay giây sau khi họ vừa bấm.
  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  // ------------------------------------------------------------
  // GẮN SỰ KIỆN
  // ------------------------------------------------------------
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      nextSlide();
      resetAutoplay();
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      prevSlide();
      resetAutoplay();
    });
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goToSlide(i);
      resetAutoplay();
    });
  });

  // Tạm dừng auto-play khi hover (desktop) để người dùng đọc nội dung card
  const bannerEl = document.getElementById('banner');
  if (bannerEl) {
    bannerEl.addEventListener('mouseenter', stopAutoplay);
    bannerEl.addEventListener('mouseleave', startAutoplay);
  }

  // Tạm dừng khi tab không active — tiết kiệm tài nguyên, tránh nhảy
  // nhiều slide cùng lúc khi quay lại tab sau thời gian dài
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  // ------------------------------------------------------------
  // INIT
  // ------------------------------------------------------------
  loadBannerContent();
  startAutoplay();
})();

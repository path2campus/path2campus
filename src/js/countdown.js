/* ============================================================
   PATH2CAMPUS — COUNTDOWN LOGIC
   Đếm ngược lịch thi THPTQG, xử lý 4 trạng thái: upcoming /
   distributing / active / done. Giữ nguyên logic timezone GMT+7
   và các bugfix đã có từ bản gốc (ghi chú lại để không sửa nhầm).
   ============================================================ */

// ============================================================
// DATA — Lịch thi THPT Quốc Gia
// Cập nhật lịch chính thức khi có thông báo từ Bộ GD&ĐT
// ============================================================
const SCHEDULE = {
  2026: [
    { date: "2026-06-11", distributeTime: "07:30", startTime: "07:35", subject: "Ngữ văn",       duration: 120, icon: "📝" },
    { date: "2026-06-11", distributeTime: "14:20", startTime: "14:30", subject: "Toán",           duration: 90,  icon: "📐" },
    { date: "2026-06-12", distributeTime: "07:30", startTime: "07:35", subject: "Tự chọn môn 1", duration: 50,  icon: "📚" },
    { date: "2026-06-12", distributeTime: "08:35", startTime: "08:40", subject: "Tự chọn môn 2", duration: 50,  icon: "📚" },
  ],
  // --- Dự kiến (chưa chính thức, cập nhật khi có lịch) ---
  2027: [
    { date: "2027-06-11", distributeTime: "07:30", startTime: "07:35", subject: "Ngữ văn",       duration: 120, icon: "📝" },
    { date: "2027-06-11", distributeTime: "14:20", startTime: "14:30", subject: "Toán",           duration: 90,  icon: "📐" },
    { date: "2027-06-12", distributeTime: "07:30", startTime: "07:35", subject: "Tự chọn môn 1", duration: 50,  icon: "📚" },
    { date: "2027-06-12", distributeTime: "08:35", startTime: "08:40", subject: "Tự chọn môn 2", duration: 50,  icon: "📚" },
  ],
  2028: [
    { date: "2028-06-08", distributeTime: "07:30", startTime: "07:35", subject: "Ngữ văn",       duration: 120, icon: "📝" },
    { date: "2028-06-08", distributeTime: "14:20", startTime: "14:30", subject: "Toán",           duration: 90,  icon: "📐" },
    { date: "2028-06-09", distributeTime: "07:30", startTime: "07:35", subject: "Tự chọn môn 1", duration: 50,  icon: "📚" },
    { date: "2028-06-09", distributeTime: "08:35", startTime: "08:40", subject: "Tự chọn môn 2", duration: 50,  icon: "📚" },
  ],
  2029: [
    { date: "2029-06-07", distributeTime: "07:30", startTime: "07:35", subject: "Ngữ văn",       duration: 120, icon: "📝" },
    { date: "2029-06-07", distributeTime: "14:20", startTime: "14:30", subject: "Toán",           duration: 90,  icon: "📐" },
    { date: "2029-06-08", distributeTime: "07:30", startTime: "07:35", subject: "Tự chọn môn 1", duration: 50,  icon: "📚" },
    { date: "2029-06-08", distributeTime: "08:35", startTime: "08:40", subject: "Tự chọn môn 2", duration: 50,  icon: "📚" },
  ],
  2030: [
    { date: "2030-06-13", distributeTime: "07:30", startTime: "07:35", subject: "Ngữ văn",       duration: 120, icon: "📝" },
    { date: "2030-06-13", distributeTime: "14:20", startTime: "14:30", subject: "Toán",           duration: 90,  icon: "📐" },
    { date: "2030-06-14", distributeTime: "07:30", startTime: "07:35", subject: "Tự chọn môn 1", duration: 50,  icon: "📚" },
    { date: "2030-06-14", distributeTime: "08:35", startTime: "08:40", subject: "Tự chọn môn 2", duration: 50,  icon: "📚" },
  ],
  2031: [
    { date: "2031-06-12", distributeTime: "07:30", startTime: "07:35", subject: "Ngữ văn",       duration: 120, icon: "📝" },
    { date: "2031-06-12", distributeTime: "14:20", startTime: "14:30", subject: "Toán",           duration: 90,  icon: "📐" },
    { date: "2031-06-13", distributeTime: "07:30", startTime: "07:35", subject: "Tự chọn môn 1", duration: 50,  icon: "📚" },
    { date: "2031-06-13", distributeTime: "08:35", startTime: "08:40", subject: "Tự chọn môn 2", duration: 50,  icon: "📚" },
  ],
  2032: [
    { date: "2032-06-10", distributeTime: "07:30", startTime: "07:35", subject: "Ngữ văn",       duration: 120, icon: "📝" },
    { date: "2032-06-10", distributeTime: "14:20", startTime: "14:30", subject: "Toán",           duration: 90,  icon: "📐" },
    { date: "2032-06-11", distributeTime: "07:30", startTime: "07:35", subject: "Tự chọn môn 1", duration: 50,  icon: "📚" },
    { date: "2032-06-11", distributeTime: "08:35", startTime: "08:40", subject: "Tự chọn môn 2", duration: 50,  icon: "📚" },
  ],
  2033: [
    { date: "2033-06-09", distributeTime: "07:30", startTime: "07:35", subject: "Ngữ văn",       duration: 120, icon: "📝" },
    { date: "2033-06-09", distributeTime: "14:20", startTime: "14:30", subject: "Toán",           duration: 90,  icon: "📐" },
    { date: "2033-06-10", distributeTime: "07:30", startTime: "07:35", subject: "Tự chọn môn 1", duration: 50,  icon: "📚" },
    { date: "2033-06-10", distributeTime: "08:35", startTime: "08:40", subject: "Tự chọn môn 2", duration: 50,  icon: "📚" },
  ],
  2034: [
    { date: "2034-06-08", distributeTime: "07:30", startTime: "07:35", subject: "Ngữ văn",       duration: 120, icon: "📝" },
    { date: "2034-06-08", distributeTime: "14:20", startTime: "14:30", subject: "Toán",           duration: 90,  icon: "📐" },
    { date: "2034-06-09", distributeTime: "07:30", startTime: "07:35", subject: "Tự chọn môn 1", duration: 50,  icon: "📚" },
    { date: "2034-06-09", distributeTime: "08:35", startTime: "08:40", subject: "Tự chọn môn 2", duration: 50,  icon: "📚" },
  ],
  2035: [
    { date: "2035-06-14", distributeTime: "07:30", startTime: "07:35", subject: "Ngữ văn",       duration: 120, icon: "📝" },
    { date: "2035-06-14", distributeTime: "14:20", startTime: "14:30", subject: "Toán",           duration: 90,  icon: "📐" },
    { date: "2035-06-15", distributeTime: "07:30", startTime: "07:35", subject: "Tự chọn môn 1", duration: 50,  icon: "📚" },
    { date: "2035-06-15", distributeTime: "08:35", startTime: "08:40", subject: "Tự chọn môn 2", duration: 50,  icon: "📚" },
  ],
};

// ============================================================
// QUOTES
// ============================================================
const QUOTES = [
  {
    text: "Giáo dục là vũ khí mạnh nhất mà bạn có thể sử dụng để thay đổi thế giới.",
    author: "Nelson Mandela",
    sub: "Education is the most powerful weapon you can use to change the world."
  },
  {
    text: "Đầu tư vào kiến thức luôn mang lại lãi suất tốt nhất.",
    author: "Benjamin Franklin",
    sub: "An investment in knowledge pays the best interest."
  },
  {
    text: "Hôm nay bạn đứng ở đây vì những gì bạn đã làm ngày hôm qua. Ngày mai bạn đứng ở đâu là do những gì bạn làm hôm nay.",
    author: "Steph Curry",
    sub: "Where you stand today is because of what you did yesterday."
  },
  {
    text: "Thành công không phải là chìa khóa của hạnh phúc. Hạnh phúc mới là chìa khóa của thành công.",
    author: "Albert Schweitzer",
    sub: "Success is not the key to happiness. Happiness is the key to success."
  },
  {
    text: "Mỗi ngày bạn không học là một ngày bạn đang lùi lại.",
    author: "Tục ngữ",
    sub: "Every day you don't learn is a day you fall behind."
  },
  {
    text: "Sự chuẩn bị kỹ lưỡng hôm nay là nền tảng của thành công ngày mai.",
    author: "Abraham Lincoln",
    sub: "Give me six hours to chop down a tree and I will spend the first four sharpening the axe."
  },
];


// ============================================================
// HELPERS
// ============================================================
function pad(n) { return String(n).padStart(2, '0'); }

// Ép cứng múi giờ GMT+7 (Asia/Ho_Chi_Minh) bằng cách parse ISO string + offset.
// KHÔNG dùng setHours() vì phụ thuộc timezone thiết bị người dùng — đây là
// điểm quan trọng nhất, giữ nguyên logic đã kiểm chứng từ bản gốc.
const GMT7_OFFSET_MS = 7 * 60 * 60 * 1000;

function toVNTimestamp(dateStr, timeStr) {
  // dateStr: "2026-06-11", timeStr: "07:30"
  // Xây dựng UTC ms: coi dateStr+timeStr là giờ VN, trừ đi offset để ra UTC
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);
  return Date.UTC(y, mo - 1, d, h, mi, 0, 0) - GMT7_OFFSET_MS;
}

function parseExamDateTime(exam, useDistribute = true) {
  const timeStr = useDistribute ? exam.distributeTime : exam.startTime;
  return new Date(toVNTimestamp(exam.date, timeStr));
}

function examEndTime(exam) {
  const startMs = toVNTimestamp(exam.date, exam.startTime);
  return new Date(startMs + exam.duration * 60 * 1000);
}

function formatDateVi(dateStr) {
  // Parse dateStr "2026-06-11" trực tiếp, không qua Date() để tránh lệch ngày do timezone
  const [y, mo, d] = dateStr.split('-').map(Number);
  return `${d}/${mo}/${y}`;
}

// Lấy "now" luôn là thời điểm thực (UTC-based Date object) — so sánh với
// VN timestamp đã tính sẵn, nhất quán trên mọi thiết bị/múi giờ trình duyệt.
function nowUTC() {
  return new Date();
}


// ============================================================
// FIND ACTIVE YEAR & EXAM
// ============================================================
function findCurrentState(now) {
  const years = Object.keys(SCHEDULE).map(Number).sort((a, b) => a - b);

  for (const year of years) {
    const exams = SCHEDULE[year];
    const lastExam = exams[exams.length - 1];
    const lastEnd = examEndTime(lastExam);

    if (now > lastEnd) continue; // năm này đã thi xong, bỏ qua

    for (let i = 0; i < exams.length; i++) {
      const exam = exams[i];
      const distributeAt = parseExamDateTime(exam, true);
      const startAt      = parseExamDateTime(exam, false);
      const endAt         = examEndTime(exam);

      if (now < distributeAt) {
        return { state: 'upcoming', year, exam, examIndex: i, exams };
      }

      if (now >= distributeAt && now < startAt) {
        return { state: 'distributing', year, exam, examIndex: i, exams, distributeAt, startAt };
      }

      if (now >= startAt && now < endAt) {
        return { state: 'active', year, exam, examIndex: i, exams, startAt, endAt };
      }
    }
  }

  return { state: 'done', year: 2035 };
}


// ============================================================
// RENDER SCHEDULE
// ============================================================
function renderSchedule(year, exams, now, activeExamIndex) {
  document.getElementById('scheduleYearBadge').textContent = year;
  document.getElementById('heroYear').textContent = year;

  const list = document.getElementById('scheduleList');
  list.innerHTML = '';

  exams.forEach((exam, i) => {
    const distributeAt = parseExamDateTime(exam, true);
    const startAt      = parseExamDateTime(exam, false);
    const endAt         = examEndTime(exam);

    let state, badgeClass, badgeText;
    if (now >= endAt) {
      state = 'past'; badgeClass = 'done'; badgeText = 'Đã thi';
    } else if (now >= startAt && now < endAt) {
      state = 'current'; badgeClass = 'active'; badgeText = 'Đang thi';
    } else if (now >= distributeAt && now < startAt) {
      state = 'current'; badgeClass = 'active'; badgeText = 'Đang phát đề';
    } else if (i === activeExamIndex && now < distributeAt) {
      state = 'upcoming'; badgeClass = 'next'; badgeText = 'Tiếp theo';
    } else {
      state = 'upcoming'; badgeClass = 'upcoming'; badgeText = formatDateVi(exam.date);
    }

    const item = document.createElement('div');
    item.className = `schedule-item ${state}`;
    item.innerHTML = `
      <div class="item-icon">${exam.icon}</div>
      <div class="item-info">
        <div class="item-subject">${exam.subject}</div>
        <div class="item-meta">
          <span>${formatDateVi(exam.date)}</span>
          <span class="meta-sep">•</span>
          <span>Phát đề: ${exam.distributeTime}</span>
          <span class="meta-sep">•</span>
          <span>Làm bài: ${exam.startTime}</span>
          <span class="meta-sep">•</span>
          <span>${exam.duration} phút</span>
        </div>
      </div>
      <div class="item-status">
        <span class="status-badge ${badgeClass}">${badgeText}</span>
      </div>
    `;
    list.appendChild(item);
  });

  // Ghi chú "dự kiến" cho các năm sau 2026
  if (year > 2026) {
    const note = document.createElement('p');
    note.className = 'text-muted';
    note.style.cssText = 'font-size:var(--font-size-xs); text-align:center; margin-top:var(--space-4);';
    note.textContent = `⚠️ Lịch thi ${year} là dự kiến, chưa có thông báo chính thức từ Bộ GD&ĐT.`;
    list.appendChild(note);
  }
}


// ============================================================
// QUOTES ROTATION
// ============================================================
let currentQuote = 0;

function renderQuotes() {
  const q = QUOTES[currentQuote];
  document.getElementById('quoteText').textContent = q.text;
  document.getElementById('quoteAuthor').textContent = '— ' + q.author;
  document.getElementById('quoteAuthorSub').textContent = q.sub;

  const dots = document.getElementById('quoteDots');
  dots.innerHTML = '';
  QUOTES.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'quote-dot' + (i === currentQuote ? ' active' : '');
    d.onclick = () => { currentQuote = i; renderQuotes(); };
    dots.appendChild(d);
  });
}


// ============================================================
// MAIN TICK
// ============================================================
let prevDays = -1, prevHours = -1, prevMins = -1, prevSecs = -1;

// Tránh rebuild DOM của schedule mỗi giây — chỉ re-render khi trạng thái
// thực sự đổi (ví dụ chuyển từ "upcoming" sang "distributing").
let lastScheduleKey = null;

function getScheduleKey(ctx) {
  if (ctx.state === 'done') return 'done';
  const now = nowUTC();
  const statusSnapshot = ctx.exams.map(exam => {
    const distributeAt = parseExamDateTime(exam, true);
    const startAt      = parseExamDateTime(exam, false);
    const endAt         = examEndTime(exam);
    if (now >= endAt)        return 'past';
    if (now >= startAt)      return 'active';
    if (now >= distributeAt) return 'distributing';
    return 'upcoming';
  }).join(',');
  return `${ctx.year}-${statusSnapshot}`;
}

function updateBox(id, val, prev) {
  const el = document.getElementById(id);
  if (val !== prev) {
    el.classList.remove('is-updated');
    void el.offsetWidth; // force reflow để animation chạy lại
    el.classList.add('is-updated');
  }
  el.textContent = pad(val);
}

function tick() {
  const now = nowUTC();
  const ctx = findCurrentState(now);

  if (ctx.state === 'done') {
    document.getElementById('countdownLabel').textContent = 'Đã hoàn thành tất cả kỳ thi đến 2035.';
    document.getElementById('countdownGrid').style.display = 'none';
    document.getElementById('nextExamCard').style.display = 'none';
    document.getElementById('examActiveBanner').style.display = 'none';
    return;
  }

  const { state, year, exam, exams, examIndex } = ctx;

  const scheduleKey = getScheduleKey(ctx);
  if (scheduleKey !== lastScheduleKey) {
    renderSchedule(year, exams, now, state === 'upcoming' ? examIndex : -1);
    lastScheduleKey = scheduleKey;
  }

  // --- ĐANG PHÁT ĐỀ ---
  if (state === 'distributing') {
    document.getElementById('nextExamCard').style.display = 'none';
    document.getElementById('countdownGrid').style.display = 'none';
    document.getElementById('countdownLabel').textContent = '';
    document.getElementById('examActiveBanner').style.display = 'block';

    const secsToStart = Math.ceil((ctx.startAt - now) / 1000);
    const minsToStart = Math.ceil(secsToStart / 60);
    document.getElementById('activeExamText').textContent =
      `Đang phát đề ${exam.subject} — Làm bài bắt đầu sau ${minsToStart} phút`;

    const distributeWindow = ctx.startAt - ctx.distributeAt;
    const elapsed = now - ctx.distributeAt;
    const pct = Math.max(0, Math.min(100, (elapsed / distributeWindow) * 100));
    document.getElementById('timeRemainingFill').style.width = pct + '%';

    document.querySelector('.exam-active-banner__icon').textContent = '📋';
    document.querySelector('.exam-active-banner h2').textContent = 'Đang phát đề!';
    return;
  }

  // --- ĐANG LÀM BÀI ---
  if (state === 'active') {
    document.getElementById('nextExamCard').style.display = 'none';
    document.getElementById('countdownGrid').style.display = 'none';
    document.getElementById('countdownLabel').textContent = '';
    document.getElementById('examActiveBanner').style.display = 'block';

    const minsLeft = Math.ceil((ctx.endAt - now) / 60000);
    document.getElementById('activeExamText').textContent =
      `Đang thi ${exam.subject} — Còn lại: ${minsLeft} phút`;

    const totalMs = exam.duration * 60 * 1000;
    const elapsed = now - ctx.startAt;
    const pct = Math.max(0, Math.min(100, 100 - (elapsed / totalMs * 100)));
    document.getElementById('timeRemainingFill').style.width = pct + '%';

    document.querySelector('.exam-active-banner__icon').textContent = '🎯';
    document.querySelector('.exam-active-banner h2').textContent = 'Đang thi!';
    return;
  }

  // --- SẮP THI (đếm ngược bình thường) ---
  document.getElementById('examActiveBanner').style.display = 'none';
  document.getElementById('nextExamCard').style.display = 'block';
  document.getElementById('countdownGrid').style.display = 'flex';

  document.getElementById('nextSubject').textContent = exam.subject;
  document.getElementById('nextDate').textContent = formatDateVi(exam.date);
  document.getElementById('nextDistribute').textContent = exam.distributeTime;
  document.getElementById('nextStart').textContent = exam.startTime;
  document.getElementById('nextDuration').textContent = exam.duration;

  const target = parseExamDateTime(exam, true);
  const diff = target - now;

  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  const secs  = Math.floor((diff % 60000) / 1000);

  updateBox('cd-days',  days,  prevDays);
  updateBox('cd-hours', hours, prevHours);
  updateBox('cd-mins',  mins,  prevMins);
  updateBox('cd-secs',  secs,  prevSecs);

  prevDays = days; prevHours = hours; prevMins = mins; prevSecs = secs;

  document.getElementById('countdownLabel').textContent =
    `Thời gian còn lại đến môn thi ${exam.subject}`;
}


// ============================================================
// INIT
// ============================================================
renderQuotes();
setInterval(() => {
  currentQuote = (currentQuote + 1) % QUOTES.length;
  renderQuotes();
}, 8000);

tick();
setInterval(tick, 1000);

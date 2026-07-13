/* ============================================================
   PATH2CAMPUS — TRA CỨU ĐIỂM CHUẨN
   Logic search trường, render danh sách kết quả, hiển thị bảng
   điểm với cột tự động ẩn nếu toàn bộ dòng của trường đó trống
   ở cột điểm tương ứng.

   ES Module — import trực tiếp từ supabase-client.js
   ============================================================ */

import { searchSchools, getScoresBySchool, getSchoolByCode } from './supabase-client.js';

// ------------------------------------------------------------
// DOM REFS
// ------------------------------------------------------------
const searchInput   = document.getElementById('searchInput');
const searchBtn     = document.getElementById('searchBtn');

const searchResultsSection = document.getElementById('searchResultsSection');
const searchResults        = document.getElementById('searchResults');

const scoreResultsSection = document.getElementById('scoreResultsSection');
const scoreSchoolName     = document.getElementById('scoreSchoolName');
const scoreSchoolMeta     = document.getElementById('scoreSchoolMeta');
const scoreTableBody      = document.getElementById('scoreTableBody');
const backToSearchBtn     = document.getElementById('backToSearchBtn');

const loadingState  = document.getElementById('loadingState');
const emptyState    = document.getElementById('emptyState');
const initialState  = document.getElementById('initialState');

// Thứ tự cột phải khớp đúng với <thead> tĩnh trong diem-chuan.html
const COLUMN_KEYS = [
  'major_code',
  'major_name',
  'year',
  'score_thpt',
  'score_hoc_ba',
  'score_dgnl',
  'score_vsat',
  'note',
];

// Cột luôn hiện, không bao giờ ẩn dù trống (mã ngành/tên ngành/năm là
// thông tin định danh, không phải "điểm" nên không áp dụng logic ẩn)
const ALWAYS_VISIBLE_COLUMNS = new Set(['major_code', 'major_name', 'year']);


// ------------------------------------------------------------
// HIỂN THỊ / ẨN CÁC SECTION TRẠNG THÁI
// ------------------------------------------------------------
function showOnly(sectionToShow) {
  const all = [searchResultsSection, scoreResultsSection, loadingState, emptyState, initialState];
  all.forEach((el) => {
    if (el) el.style.display = 'none';
  });
  if (sectionToShow) sectionToShow.style.display = 'block';
}


// ------------------------------------------------------------
// TÌM KIẾM TRƯỜNG
// ------------------------------------------------------------
async function handleSearch() {
  const keyword = searchInput.value.trim();

  if (!keyword) {
    showOnly(initialState);
    return;
  }

  showOnly(loadingState);

  const { data: schools, error } = await searchSchools(keyword);

  if (error) {
    showOnly(emptyState);
    emptyState.querySelector('p').textContent =
      'Đã có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.';
    return;
  }

  if (schools.length === 0) {
    showOnly(emptyState);
    emptyState.querySelector('p').textContent =
      'Không tìm thấy trường nào khớp với từ khoá bạn nhập.';
    return;
  }

  renderSchoolResults(schools);
  showOnly(searchResultsSection);
}

function renderSchoolResults(schools) {
  searchResults.innerHTML = '';

  schools.forEach((school) => {
    const item = document.createElement('div');
    item.className = 'school-card';
    item.innerHTML = `
      <div class="school-card__info">
        <div class="school-card__text">
          <div class="school-card__name">${escapeHtml(school.school_name)}</div>
          <div class="school-card__meta">Mã trường: ${escapeHtml(school.school_code)}</div>
        </div>
      </div>
      <svg class="school-card__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    item.addEventListener('click', () => selectSchool(school.school_code, school.school_name));
    searchResults.appendChild(item);
  });
}


// ------------------------------------------------------------
// CHỌN 1 TRƯỜNG — HIỂN THỊ BẢNG ĐIỂM
// ------------------------------------------------------------
async function selectSchool(schoolCode, schoolName) {
  showOnly(loadingState);

  const { data: scores, error } = await getScoresBySchool(schoolCode);

  if (error || scores.length === 0) {
    showOnly(emptyState);
    emptyState.querySelector('p').textContent =
      'Chưa có dữ liệu điểm chuẩn cho trường này.';
    return;
  }

  scoreSchoolName.textContent = schoolName;

  const years = [...new Set(scores.map((r) => r.year))].sort((a, b) => b - a);
  scoreSchoolMeta.textContent = `Mã trường: ${schoolCode} • Dữ liệu năm: ${years.join(', ')}`;

  renderScoreTable(scores);
  showOnly(scoreResultsSection);

  // Cập nhật URL để có thể chia sẻ link trực tiếp tới trường đang xem
  const url = new URL(window.location);
  url.searchParams.set('school', schoolCode);
  window.history.replaceState({}, '', url);
}


// ------------------------------------------------------------
// RENDER BẢNG ĐIỂM — TỰ ĐỘNG ẨN CỘT NẾU TOÀN BỘ DÒNG ĐỀU TRỐNG
// ------------------------------------------------------------
function renderScoreTable(rows) {
  // Bước 1: xác định cột nào có ít nhất 1 giá trị khác null/rỗng
  const columnHasValue = {};
  COLUMN_KEYS.forEach((key) => {
    if (ALWAYS_VISIBLE_COLUMNS.has(key)) {
      columnHasValue[key] = true;
      return;
    }
    columnHasValue[key] = rows.some((row) => {
      const val = row[key];
      return val !== null && val !== undefined && String(val).trim() !== '';
    });
  });

  // Bước 2: ẩn/hiện header tương ứng
  const theadRow = document.querySelector('.score-table thead tr');
  const headerCells = theadRow.querySelectorAll('th');
  headerCells.forEach((th, i) => {
    const key = COLUMN_KEYS[i];
    if (columnHasValue[key]) {
      th.removeAttribute('data-hidden');
    } else {
      th.setAttribute('data-hidden', '');
    }
  });

  // Bước 3: render từng dòng dữ liệu, áp dụng đúng trạng thái ẩn/hiện
  scoreTableBody.innerHTML = '';

  rows.forEach((row) => {
    const tr = document.createElement('tr');

    COLUMN_KEYS.forEach((key) => {
      const td = document.createElement('td');

      if (!columnHasValue[key]) {
        td.setAttribute('data-hidden', '');
      }

      if (key === 'major_name') {
        td.classList.add('score-table__major-name');
        td.textContent = row[key] ?? '—';
      } else if (['score_thpt', 'score_hoc_ba', 'score_dgnl', 'score_vsat'].includes(key)) {
        td.classList.add('score-table__score');
        td.textContent = formatScore(row[key]);
      } else if (key === 'note') {
        td.classList.add('score-table__note');
        td.textContent = row[key] || '—';
      } else {
        td.textContent = row[key] ?? '—';
      }

      tr.appendChild(td);
    });

    scoreTableBody.appendChild(tr);
  });
}

function formatScore(val) {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  return Number.isNaN(num) ? '—' : num.toFixed(2).replace(/\.00$/, '');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}


// ------------------------------------------------------------
// SỰ KIỆN
// ------------------------------------------------------------
searchBtn.addEventListener('click', handleSearch);

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});

backToSearchBtn.addEventListener('click', () => {
  showOnly(initialState);
  const url = new URL(window.location);
  url.searchParams.delete('school');
  window.history.replaceState({}, '', url);
});


// ------------------------------------------------------------
// INIT — hỗ trợ mở trực tiếp link dạng ?school=NEU
// ------------------------------------------------------------
(function init() {
  const params = new URLSearchParams(window.location.search);
  const schoolCode = params.get('school');

  if (schoolCode) {
    openSchoolFromUrl(schoolCode);
  } else {
    showOnly(initialState);
  }
})();

async function openSchoolFromUrl(schoolCode) {
  showOnly(loadingState);

  const { data: school, error } = await getSchoolByCode(schoolCode);

  if (error || !school) {
    showOnly(emptyState);
    emptyState.querySelector('p').textContent =
      `Không tìm thấy trường với mã "${schoolCode}".`;
    return;
  }

  selectSchool(school.school_code, school.school_name);
}

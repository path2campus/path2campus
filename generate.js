/* ============================================================
   PATH2CAMPUS — GENERATE.JS
   Script build-time (chạy bằng `node generate.js` hoặc `npm run build`):
   1. Copy toàn bộ static assets từ src/ sang dist/
   2. Query Supabase (schools + scores)
   3. Với mỗi trường có data điểm, sinh dist/diem-chuan/{code}/index.html
      từ templates/template-school.html — HTML tĩnh, Google index được
   4. Sinh sitemap.xml liệt kê toàn bộ URL

   Cloudflare Pages build command: node generate.js
   Cloudflare Pages output directory: dist
   ============================================================ */

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SRC_DIR  = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');
const SITE_URL = 'https://path2campus.cloud';

// Thứ tự cột phải khớp đúng với template-school.html và diem-chuan.js
const COLUMN_KEYS = [
  'major_code', 'major_name', 'year',
  'score_thpt', 'score_hoc_ba', 'score_dgnl', 'score_vsat', 'note',
];
const ALWAYS_VISIBLE_COLUMNS = new Set(['major_code', 'major_name', 'year']);


// ============================================================
// 0. LOAD BIẾN MÔI TRƯỜNG
// Cloudflare Pages tự inject process.env khi build trên server của họ.
// Khi chạy local, đọc thêm từ .env.local nếu file tồn tại.
// ============================================================
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) return;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    console.error('❌ Thiếu SUPABASE_URL hoặc SUPABASE_PUBLISHABLE_KEY.');
    console.error('   Kiểm tra file .env.local (local) hoặc Environment Variables (Cloudflare Pages).');
    process.exit(1);
  }
}


// ============================================================
// 1. COPY STATIC ASSETS — src/ → dist/ (trừ templates/)
// ============================================================
function copyStaticAssets() {
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  const entries = fs.readdirSync(SRC_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === 'templates') continue; // không copy templates ra dist

    const srcPath  = path.join(SRC_DIR, entry.name);
    const destPath = path.join(DIST_DIR, entry.name);
    fs.cpSync(srcPath, destPath, { recursive: true });
  }

  console.log('✅ Đã copy static assets sang dist/');
}


// ============================================================
// 2. QUERY SUPABASE
// ============================================================
async function fetchData(supabase) {
  const { data: schools, error: schoolsError } = await supabase
    .from('schools')
    .select('school_code, school_name, region, type');

  if (schoolsError) {
    console.error('❌ Lỗi lấy danh sách trường:', schoolsError.message);
    process.exit(1);
  }

  const { data: scores, error: scoresError } = await supabase
    .from('scores')
    .select('*')
    .order('year', { ascending: false })
    .order('major_name', { ascending: true });

  if (scoresError) {
    console.error('❌ Lỗi lấy dữ liệu điểm:', scoresError.message);
    process.exit(1);
  }

  console.log(`✅ Đã tải ${schools.length} trường, ${scores.length} dòng điểm.`);
  return { schools, scores };
}


// ============================================================
// 3. HELPERS — escape HTML, format điểm, tính cột ẩn
// ============================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatScore(val) {
  if (val === null || val === undefined || val === '') return '—';
  const num = Number(val);
  return Number.isNaN(num) ? '—' : num.toFixed(2).replace(/\.00$/, '');
}

function computeHiddenColumns(rows) {
  const hidden = {};
  COLUMN_KEYS.forEach((key) => {
    if (ALWAYS_VISIBLE_COLUMNS.has(key)) {
      hidden[key] = false;
      return;
    }
    const hasValue = rows.some((row) => {
      const val = row[key];
      return val !== null && val !== undefined && String(val).trim() !== '';
    });
    hidden[key] = !hasValue;
  });
  return hidden;
}

function buildScoreRowsHtml(rows, hidden) {
  return rows.map((row) => {
    const cells = COLUMN_KEYS.map((key) => {
      const hiddenAttr = hidden[key] ? ' data-hidden' : '';
      let value;
      let cellClass = '';

      if (key === 'major_name') {
        cellClass = ' class="score-table__major-name"';
        value = escapeHtml(row[key]) || '—';
      } else if (['score_thpt', 'score_hoc_ba', 'score_dgnl', 'score_vsat'].includes(key)) {
        cellClass = ' class="score-table__score"';
        value = formatScore(row[key]);
      } else if (key === 'note') {
        cellClass = ' class="score-table__note"';
        value = escapeHtml(row[key]) || '—';
      } else {
        value = escapeHtml(row[key]) ?? '—';
      }

      return `<td${cellClass}${hiddenAttr}>${value}</td>`;
    }).join('');

    return `<tr>${cells}</tr>`;
  }).join('\n              ');
}


// ============================================================
// 4. SINH TRANG CHI TIẾT TỪNG TRƯỜNG
// ============================================================
function generateSchoolPages(schools, scores) {
  const templatePath = path.join(SRC_DIR, 'templates', 'template-school.html');
  const template = fs.readFileSync(templatePath, 'utf-8');

  const generatedSchools = [];

  for (const school of schools) {
    const schoolScores = scores.filter((s) => s.school_code === school.school_code);

    if (schoolScores.length === 0) {
      console.log(`⏭️  Bỏ qua ${school.school_code} — chưa có dữ liệu điểm.`);
      continue;
    }

    const hidden = computeHiddenColumns(schoolScores);
    const scoreRowsHtml = buildScoreRowsHtml(schoolScores, hidden);

    const years = [...new Set(schoolScores.map((r) => r.year))].sort((a, b) => b - a);
    const latestYear = years[0];
    const slug = school.school_code.toLowerCase();
    const canonicalUrl = `${SITE_URL}/diem-chuan/${slug}/`;

    let html = template
      .replaceAll('{{SCHOOL_NAME}}', escapeHtml(school.school_name))
      .replaceAll('{{SCHOOL_CODE}}', escapeHtml(school.school_code))
      .replaceAll('{{LATEST_YEAR}}', String(latestYear))
      .replaceAll('{{YEARS_LIST}}', years.join(', '))
      .replaceAll('{{CANONICAL_URL}}', canonicalUrl);

    // Dùng regex thay vì so khớp chuỗi tuyệt đối cho placeholder quan trọng
    // nhất — chấp nhận khoảng trắng linh hoạt quanh tên biến, phòng trường
    // hợp file template dính ký tự ẩn (non-breaking space, zero-width...)
    // do copy-paste qua nhiều nơi khiến so khớp chuỗi cứng bị thất bại.
    const scoreRowsPattern = /\{\{\s*SCORE_TABLE_ROWS\s*\}\}/;
    if (!scoreRowsPattern.test(html)) {
      console.warn(`⚠️  KHÔNG tìm thấy placeholder {{SCORE_TABLE_ROWS}} trong template cho ${school.school_code} — kiểm tra lại template-school.html.`);
    }
    html = html.replace(scoreRowsPattern, scoreRowsHtml);

    // Placeholder ẩn cột header — mỗi key có 1 placeholder riêng dạng {{HIDE_KEY}}
    // Cũng dùng regex linh hoạt khoảng trắng, đồng bộ với SCORE_TABLE_ROWS ở trên.
    COLUMN_KEYS.forEach((key) => {
      const pattern = new RegExp(`\\{\\{\\s*HIDE_${key.toUpperCase()}\\s*\\}\\}`, 'g');
      html = html.replace(pattern, hidden[key] ? ' data-hidden' : '');
    });

    const outDir = path.join(DIST_DIR, 'diem-chuan', slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');

    generatedSchools.push({ code: school.school_code, slug, name: school.school_name });
    console.log(`✅ Đã sinh trang: /diem-chuan/${slug}/`);
  }

  return generatedSchools;
}


// Các trang cẩm nang — viết tay, không sinh từ Supabase, nhưng vẫn cần
// khai báo trong sitemap để Google biết crawl (đây là nội dung SEO chính).
const CAM_NANG_PAGES = [
  'it',
  'ky-thuat',
  'kinh-te',
  'supham',
  'nghe-thuat',
  'khoa-hoc-xa-hoi',
  'dai-hoc-quoc-te',
  'tu-thuc',
];


// ============================================================
// 5. SINH SITEMAP.XML
// ============================================================
function generateSitemap(generatedSchools) {
  const staticUrls = [
    { loc: `${SITE_URL}/`, priority: '1.0' },
    { loc: `${SITE_URL}/diem-chuan.html`, priority: '0.9' },
    // nhom-ho-tro.html KHÔNG đưa vào sitemap — trang này đã đặt
    // noindex, không nên khai báo cho Google crawl.
  ];

  const camNangUrls = CAM_NANG_PAGES.map((slug) => ({
    loc: `${SITE_URL}/cam-nang/${slug}.html`,
    priority: '0.85',
  }));

  const schoolUrls = generatedSchools.map((s) => ({
    loc: `${SITE_URL}/diem-chuan/${s.slug}/`,
    priority: '0.8',
  }));

  const allUrls = [...staticUrls, ...camNangUrls, ...schoolUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

  fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), xml, 'utf-8');
  console.log(`✅ Đã sinh sitemap.xml (${allUrls.length} URL).`);
}


// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('🚀 Bắt đầu build Path2Campus...\n');

  loadEnv();
  copyStaticAssets();

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
  );

  const { schools, scores } = await fetchData(supabase);
  const generatedSchools = generateSchoolPages(schools, scores);
  generateSitemap(generatedSchools);

  console.log(`\n🎉 Build hoàn tất — ${generatedSchools.length} trang trường đã được sinh ra.`);
}

main().catch((err) => {
  console.error('❌ Build thất bại:', err);
  process.exit(1);
});

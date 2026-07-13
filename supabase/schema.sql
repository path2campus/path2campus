-- ============================================================
-- PATH2CAMPUS — DATABASE SCHEMA
-- ============================================================
-- File này KHÔNG được chạy tự động — chỉ dùng để tài liệu hoá
-- và tái tạo database khi cần (project mới, máy khác, khôi phục).
--
-- Cách dùng: copy toàn bộ nội dung, dán vào Supabase Dashboard
-- → SQL Editor → Run.
--
-- Project hiện tại: P2C Project (organization: path2campus)
-- ============================================================


-- ============================================================
-- BẢNG schools — danh sách trường đại học
-- ============================================================
create table if not exists schools (
  school_code text primary key,      -- Mã trường, viết hoa, ví dụ: NEU, DAV
  school_name text not null,         -- Tên đầy đủ, ví dụ: Đại học Kinh tế Quốc dân
  region text,                       -- Khu vực (miền Bắc/Trung/Nam) — chưa dùng, để mở rộng sau
  type text                          -- Loại trường (công lập/tư thục...) — chưa dùng, để mở rộng sau
);

-- ============================================================
-- BẢNG scores — điểm chuẩn theo ngành, theo năm
-- ============================================================
create table if not exists scores (
  id bigint generated always as identity primary key,
  school_code text references schools(school_code),
  major_code text,                   -- Mã ngành, giữ nguyên định dạng gốc (số hoặc chữ như EP09, HQT08-01)
  major_name text,                   -- Tên ngành/chương trình đào tạo
  year int,                          -- Năm tuyển sinh
  score_thpt numeric,                -- Điểm xét theo kết quả thi THPT
  score_hoc_ba numeric,              -- Điểm xét học bạ
  score_dgnl numeric,                -- Điểm đánh giá năng lực (HSA, APT...)
  score_vsat numeric,                -- Điểm V-SAT
  note text                          -- Ghi chú: phương thức xét tuyển khác (TSA, IELTS, xét kết hợp...),
                                      -- điều kiện phụ, nhân hệ số, v.v.
);

-- ============================================================
-- INDEX — tăng tốc truy vấn theo school_code (thao tác chính của trang tra cứu)
-- ============================================================
create index if not exists idx_scores_school_code on scores(school_code);


-- ============================================================
-- ROW LEVEL SECURITY — bắt buộc bật để Data API không bị lộ quyền ghi
-- ============================================================
alter table schools enable row level security;
alter table scores enable row level security;

-- Cho phép ĐỌC công khai (SELECT) — dùng cho publishable key trên frontend
-- KHÔNG cấp quyền insert/update/delete cho client — chỉ thao tác qua
-- Supabase Dashboard (Table Editor / SQL Editor) hoặc secret key ở server.
--
-- LƯU Ý: Postgres không hỗ trợ "CREATE POLICY IF NOT EXISTS" — nên dùng
-- DROP trước rồi CREATE lại, để file này chạy lại được nhiều lần mà
-- không báo lỗi trùng policy.
drop policy if exists "Public read schools" on schools;
create policy "Public read schools"
  on schools for select
  using (true);

drop policy if exists "Public read scores" on scores;
create policy "Public read scores"
  on scores for select
  using (true);


-- ============================================================
-- DỮ LIỆU TRƯỜNG — insert khi thêm trường mới
-- Dùng "on conflict do nothing" để chạy lại nhiều lần không lỗi trùng key
-- ============================================================
insert into schools (school_code, school_name) values
  ('NEU', 'Đại học Kinh tế Quốc dân'),
  ('DAV', 'Học viện Ngoại giao')
on conflict (school_code) do nothing;

-- Data điểm chuẩn (bảng scores) KHÔNG insert bằng SQL tay ở đây —
-- được import trực tiếp qua Table Editor → Import data from CSV
-- (neu.csv, dav.csv), theo đúng 9 cột: school_code, major_code,
-- major_name, year, score_thpt, score_hoc_ba, score_dgnl, score_vsat, note

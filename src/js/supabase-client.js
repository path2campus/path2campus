/* ============================================================
   PATH2CAMPUS — SUPABASE CLIENT
   Khởi tạo kết nối Supabase (publishable key — an toàn public vì
   đã bật RLS + policy "Public read") và các hàm query dùng chung
   cho trang tra cứu điểm chuẩn.

   File này là ES Module — HTML dùng nó phải khai báo:
   <script type="module" src="/js/supabase-client.js"></script>
   hoặc import từ file module khác (diem-chuan.js).
   ============================================================ */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ------------------------------------------------------------
// CẤU HÌNH — publishable key, an toàn để public (đã có RLS chặn ghi)
// ------------------------------------------------------------
const SUPABASE_URL = 'https://lrvzgwlingdjrugqibow.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Ws6DapHRE2sbr1WbDVfmyA_691XR2Lc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);


// ------------------------------------------------------------
// TÌM TRƯỜNG THEO TỪ KHOÁ (tên hoặc mã trường)
// Dùng ilike để tìm gần đúng, không phân biệt hoa thường
// ------------------------------------------------------------
export async function searchSchools(keyword) {
  const trimmed = (keyword || '').trim();
  if (!trimmed) return { data: [], error: null };

  const { data, error } = await supabase
    .from('schools')
    .select('school_code, school_name, region, type')
    .or(`school_name.ilike.%${trimmed}%,school_code.ilike.%${trimmed}%`)
    .order('school_name', { ascending: true });

  if (error) {
    console.error('[supabase-client] searchSchools error:', error);
  }

  return { data: data || [], error };
}


// ------------------------------------------------------------
// LẤY TOÀN BỘ ĐIỂM CHUẨN THEO MÃ TRƯỜNG
// ------------------------------------------------------------
export async function getScoresBySchool(schoolCode) {
  if (!schoolCode) return { data: [], error: null };

  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('school_code', schoolCode.toUpperCase())
    .order('year', { ascending: false })
    .order('major_name', { ascending: true });

  if (error) {
    console.error('[supabase-client] getScoresBySchool error:', error);
  }

  return { data: data || [], error };
}


// ------------------------------------------------------------
// LẤY THÔNG TIN 1 TRƯỜNG (dùng cho trang chi tiết trường)
// ------------------------------------------------------------
export async function getSchoolByCode(schoolCode) {
  if (!schoolCode) return { data: null, error: null };

  const { data, error } = await supabase
    .from('schools')
    .select('school_code, school_name, region, type')
    .eq('school_code', schoolCode.toUpperCase())
    .maybeSingle();

  if (error) {
    console.error('[supabase-client] getSchoolByCode error:', error);
  }

  return { data, error };
}


// ------------------------------------------------------------
// LẤY TOÀN BỘ DANH SÁCH TRƯỜNG (dùng cho generate.js / gợi ý search)
// ------------------------------------------------------------
export async function getAllSchools() {
  const { data, error } = await supabase
    .from('schools')
    .select('school_code, school_name, region, type')
    .order('school_name', { ascending: true });

  if (error) {
    console.error('[supabase-client] getAllSchools error:', error);
  }

  return { data: data || [], error };
}


// ------------------------------------------------------------
// LỌC ĐIỂM THEO NGÀNH (tìm theo tên ngành, không giới hạn trường)
// Dùng cho tính năng mở rộng sau: "So sánh điểm ngành X giữa các trường"
// ------------------------------------------------------------
export async function searchScoresByMajor(keyword, year = null) {
  const trimmed = (keyword || '').trim();
  if (!trimmed) return { data: [], error: null };

  let query = supabase
    .from('scores')
    .select('*, schools(school_name)')
    .ilike('major_name', `%${trimmed}%`);

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query.order('score_thpt', { ascending: false });

  if (error) {
    console.error('[supabase-client] searchScoresByMajor error:', error);
  }

  return { data: data || [], error };
}

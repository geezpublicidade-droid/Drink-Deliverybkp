import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export const STORAGE_BUCKETS = {
  products: 'products',
  banners: 'banners',
  categories: 'categories',
  videos: 'videos',
  motoboys: 'motoboys',
} as const;

export function getStorageUrl(bucket: string, path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

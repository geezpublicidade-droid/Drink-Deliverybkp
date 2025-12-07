import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

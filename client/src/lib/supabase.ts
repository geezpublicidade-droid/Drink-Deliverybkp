const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

export const STORAGE_BUCKET = 'images';

export function getStorageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

export async function uploadImage(
  file: File,
  folder: string = 'products'
): Promise<{ path: string; publicUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch('/api/storage/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload image');
  }

  const result = await response.json();
  return {
    path: result.path,
    publicUrl: result.publicUrl
  };
}

export async function deleteImage(path: string): Promise<void> {
  if (!path || path.startsWith('http')) {
    return;
  }
  console.log('Delete image not implemented for server-side storage:', path);
}

import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Buffer,
  contentType?: string
): Promise<{ url: string } | { error: string }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." };
  }

  const body = file instanceof File ? await file.arrayBuffer() : file;
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType: contentType || (file instanceof File ? file.type : "application/octet-stream"),
    upsert: true,
  });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}

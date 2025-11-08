import { supabase } from "@/integrations/supabase/client";

export async function uploadAvatar(file: File, userId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw new Error(`Failed to upload avatar: ${error.message}`);
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);
  
  return publicUrl;
}

export async function deleteAvatar(url: string): Promise<void> {
  // Extract the file path from the URL
  const urlParts = url.split('/avatars/');
  if (urlParts.length < 2) return;
  
  const filePath = urlParts[1];
  
  const { error } = await supabase.storage
    .from('avatars')
    .remove([filePath]);
  
  if (error) {
    console.error('Failed to delete avatar:', error);
  }
}

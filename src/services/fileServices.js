// src/services/fileServices.js
import { supabase } from "../supabase/config";


// Upload file
export const uploadFileToDB = async (file, currentUser) => {
  if (!currentUser) throw new Error("User not logged in!");

  const filePath = `${currentUser.id}/${Date.now()}_${file.name}`;

  // 1️⃣ Upload to private storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("user-files")
    .upload(filePath, file, { upsert: false });

  if (uploadError) throw uploadError;

  // 2️⃣ Generate a signed URL (temporary)
  const { data: signedURLData, error: signedURLError } = await supabase.storage
    .from("user-files")
    .createSignedUrl(filePath, 60 * 60); // 1 hour valid

  if (signedURLError) throw signedURLError;

  const fileData = {
    name: file.name,
    url: signedURLData.signedUrl,
    user_id: currentUser.id,
    uploaded_at: new Date().toISOString(),
  };

  // 3️⃣ Save metadata in "files" table
  const { data: savedFile, error: saveError } = await supabase
    .from("files")
    .insert(fileData)
    .select();

  if (saveError) throw saveError;

  return savedFile[0];
};

// Optional - get all files of user
export const getAllFiles = async (user_id) => {
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq("user_id", user_id)
    .order("uploaded_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Optional - delete file
export const deleteFileFromDB = async (filePath) => {
  const { error } = await supabase.storage.from("user-files").remove([filePath]);
  if (error) throw error;
  return true;
};

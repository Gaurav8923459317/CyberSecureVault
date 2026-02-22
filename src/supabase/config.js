// src/supabase/config.js
import { createClient } from "@supabase/supabase-js";

// ✅ Supabase project details
const SUPABASE_URL = "https://fjdbguotuhzqpzrbvbod.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZGJndW90dWh6cXB6cmJ2Ym9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwNzc2ODYsImV4cCI6MjA3NzY1MzY4Nn0.ObuQNvsN99DcbcudA9wQas3--8_5uawaBlIgoLp4iw4"; // API Keys tab me "anon public" se

// ✅ Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

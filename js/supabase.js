import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://zbmtkxqqsxhhiiiuahbj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpibXRreHFxc3hoaGlpaXVhaGJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMTIwMTIsImV4cCI6MjEwMjc4ODAxMn0.AhrEHW65wJDkPpK4Aa6lkjBjIFoRVeNHWsMk5eO1S7k";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
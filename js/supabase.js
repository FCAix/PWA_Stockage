import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://jixmmvxqraapeuehnxwz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppeG1tdnhxcmFhcGV1ZWhueHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyNzEwMzYsImV4cCI6MjA5OTg0NzAzNn0.CyTK24cXomP52byqS_PaxNQcXjDFlFvdx9DGWqgfiUg";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
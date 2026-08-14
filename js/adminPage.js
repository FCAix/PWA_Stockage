import { requireAuth } from "./authGuard.js";
import { supabase } from "./supabase.js";


await requireAuth(["admin"]);

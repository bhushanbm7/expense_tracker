import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// Paste your Supabase project values here (Project Settings → API)
const SUPABASE_URL = "https://bdvalrasjslgjshuayxn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkdmFscmFzanNsZ2pzaHVheXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTc3ODUsImV4cCI6MjA5MTEzMzc4NX0.eakuFVo-wqj1rILqLJdSdpiTcdQH9BA1FDyhk_iisYQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


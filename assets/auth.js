import { supabase } from "./supabaseClient.js";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function toMessage(err) {
  if (!err) return "Unknown error";
  return err?.message ? String(err.message) : String(err);
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ?? null;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session ?? null);
  });
}

export async function signUpWithEmail(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(email),
    password: String(password || ""),
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password: String(password || ""),
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function formatAuthError(err) {
  const msg = toMessage(err);
  if (/invalid login credentials/i.test(msg)) return "Invalid email or password.";
  if (/email rate limit exceeded/i.test(msg))
    return "Too many attempts. Please wait a moment and try again.";
  return msg;
}


import { supabase } from "./supabaseClient.js";

function toMessage(err) {
  if (!err) return "Unknown error";
  return err?.message ? String(err.message) : String(err);
}

export function formatCurrency(value) {
  const n = Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(safe);
}

export function formatTimestamp(iso) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return String(iso || "");
  }
}

export async function listTransactions(userId) {
  const { data, error } = await supabase
    .from("transactions")
    .select("id,user_id,amount,type,description,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addTransaction({ userId, amount, type, description }) {
  const payload = {
    user_id: userId,
    amount,
    type,
    description: description || "",
  };

  const { data, error } = await supabase.from("transactions").insert(payload).select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}

export function computeTotals(transactions) {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    const amt = Number(tx.amount) || 0;
    if (tx.type === "income") income += amt;
    else expense += amt;
  }
  const balance = income - expense;
  return { income, expense, balance };
}

export function formatTxError(err) {
  const msg = toMessage(err);
  if (/row level security/i.test(msg))
    return "Permission denied by RLS. Confirm you ran the SQL and enabled RLS policies.";
  return msg;
}


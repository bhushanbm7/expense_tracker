import {
  formatAuthError,
  getSession,
  onAuthStateChange,
  signInWithEmail,
  signOut,
  signUpWithEmail,
} from "./auth.js";
import {
  addTransaction,
  computeTotals,
  deleteTransaction,
  formatCurrency,
  formatTimestamp,
  formatTxError,
  listTransactions,
} from "./transactions.js";

const $ = (id) => document.getElementById(id);

const authCard = $("authCard");
const appSection = $("appSection");
const userPill = $("userPill");
const userEmail = $("userEmail");
const logoutBtn = $("logoutBtn");

const authEmail = $("authEmail");
const authPassword = $("authPassword");
const loginBtn = $("loginBtn");
const signupBtn = $("signupBtn");
const authAlert = $("authAlert");

const txForm = $("txForm");
const txAmount = $("txAmount");
const txType = $("txType");
const txDescription = $("txDescription");
const addTxBtn = $("addTxBtn");
const txAlert = $("txAlert");

const refreshBtn = $("refreshBtn");
const txList = $("txList");
const txEmpty = $("txEmpty");
const txCount = $("txCount");

const incomeTotal = $("incomeTotal");
const expenseTotal = $("expenseTotal");
const balanceTotal = $("balanceTotal");

let currentSession = null;
let currentTransactions = [];

function setAlert(el, message, { ok = false } = {}) {
  if (!message) {
    el.hidden = true;
    el.textContent = "";
    el.classList.remove("ok");
    return;
  }
  el.hidden = false;
  el.textContent = message;
  if (ok) el.classList.add("ok");
  else el.classList.remove("ok");
}

function setAuthLoading(loading) {
  loginBtn.disabled = loading;
  signupBtn.disabled = loading;
  authEmail.disabled = loading;
  authPassword.disabled = loading;
}

function setTxLoading(loading) {
  addTxBtn.disabled = loading;
  txAmount.disabled = loading;
  txType.disabled = loading;
  txDescription.disabled = loading;
  refreshBtn.disabled = loading;
}

function renderTotals() {
  const { income, expense, balance } = computeTotals(currentTransactions);
  incomeTotal.textContent = formatCurrency(income);
  expenseTotal.textContent = formatCurrency(expense);
  balanceTotal.textContent = formatCurrency(balance);
  balanceTotal.classList.toggle("value-income", balance >= 0);
  balanceTotal.classList.toggle("value-expense", balance < 0);
}

function renderTransactions() {
  txList.innerHTML = "";

  txCount.textContent = `${currentTransactions.length} item${currentTransactions.length === 1 ? "" : "s"}`;
  txEmpty.hidden = currentTransactions.length !== 0;

  for (const tx of currentTransactions) {
    const row = document.createElement("div");
    row.className = "tx";

    const main = document.createElement("div");
    main.className = "tx-main";

    const top = document.createElement("div");
    top.className = "tx-top";

    const badge = document.createElement("span");
    badge.className = `badge ${tx.type === "income" ? "badge-income" : "badge-expense"}`;
    badge.textContent = tx.type === "income" ? "INCOME" : "EXPENSE";

    const desc = document.createElement("div");
    desc.className = "tx-desc";
    desc.textContent = tx.description?.trim() ? tx.description.trim() : "(No description)";

    const amt = document.createElement("div");
    amt.className = "tx-amt";
    const amtValue = Number(tx.amount) || 0;
    amt.textContent = `${tx.type === "expense" ? "-" : "+"}${formatCurrency(amtValue)}`;

    top.append(badge, desc, amt);

    const meta = document.createElement("div");
    meta.className = "tx-meta";
    meta.textContent = formatTimestamp(tx.created_at);

    main.append(top, meta);

    const actions = document.createElement("div");
    actions.className = "tx-actions";
    const del = document.createElement("button");
    del.type = "button";
    del.className = "btn btn-ghost";
    del.textContent = "Delete";
    del.addEventListener("click", async () => {
      setAlert(txAlert, "");
      setTxLoading(true);
      try {
        await deleteTransaction(tx.id);
        currentTransactions = currentTransactions.filter((t) => t.id !== tx.id);
        renderTransactions();
        renderTotals();
      } catch (err) {
        setAlert(txAlert, formatTxError(err));
      } finally {
        setTxLoading(false);
      }
    });
    actions.append(del);

    row.append(main, actions);
    txList.append(row);
  }
}

async function refreshTransactions() {
  if (!currentSession?.user?.id) return;
  setAlert(txAlert, "");
  setTxLoading(true);
  try {
    currentTransactions = await listTransactions(currentSession.user.id);
    renderTransactions();
    renderTotals();
  } catch (err) {
    setAlert(txAlert, formatTxError(err));
  } finally {
    setTxLoading(false);
  }
}

function setAuthedUI(session) {
  const isAuthed = Boolean(session?.user);
  authCard.hidden = isAuthed;
  appSection.hidden = !isAuthed;
  userPill.hidden = !isAuthed;

  if (isAuthed) {
    userEmail.textContent = session.user.email || "(unknown)";
  } else {
    userEmail.textContent = "";
    currentTransactions = [];
    txList.innerHTML = "";
    renderTotals();
    setAlert(authAlert, "");
    setAlert(txAlert, "");
  }
}

loginBtn.addEventListener("click", async () => {
  setAlert(authAlert, "");
  setAuthLoading(true);
  try {
    await signInWithEmail(authEmail.value, authPassword.value);
  } catch (err) {
    setAlert(authAlert, formatAuthError(err));
  } finally {
    setAuthLoading(false);
  }
});

signupBtn.addEventListener("click", async () => {
  setAlert(authAlert, "");
  setAuthLoading(true);
  try {
    const res = await signUpWithEmail(authEmail.value, authPassword.value);
    if (res?.user && !res?.session) {
      setAlert(
        authAlert,
        "Signup successful. Check your email to confirm your account, then log in.",
        { ok: true },
      );
    }
  } catch (err) {
    setAlert(authAlert, formatAuthError(err));
  } finally {
    setAuthLoading(false);
  }
});

logoutBtn.addEventListener("click", async () => {
  setAlert(txAlert, "");
  logoutBtn.disabled = true;
  try {
    await signOut();
  } catch (err) {
    setAlert(txAlert, String(err?.message || err));
  } finally {
    logoutBtn.disabled = false;
  }
});

txForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentSession?.user?.id) return;

  setAlert(txAlert, "");

  const rawAmount = Number(txAmount.value);
  const amount = Number.isFinite(rawAmount) ? Math.round(rawAmount * 100) / 100 : NaN;
  const type = txType.value;
  const description = txDescription.value || "";

  if (!Number.isFinite(amount) || amount <= 0) {
    setAlert(txAlert, "Please enter a valid amount greater than 0.");
    return;
  }
  if (type !== "income" && type !== "expense") {
    setAlert(txAlert, "Please select a valid type.");
    return;
  }

  setTxLoading(true);
  try {
    const inserted = await addTransaction({
      userId: currentSession.user.id,
      amount,
      type,
      description,
    });
    currentTransactions = [inserted, ...currentTransactions];
    txForm.reset();
    txType.value = "expense";
    renderTransactions();
    renderTotals();
  } catch (err) {
    setAlert(txAlert, formatTxError(err));
  } finally {
    setTxLoading(false);
  }
});

refreshBtn.addEventListener("click", refreshTransactions);

(async function init() {
  try {
    currentSession = await getSession();
    setAuthedUI(currentSession);
    if (currentSession?.user) await refreshTransactions();
  } catch (err) {
    setAlert(authAlert, String(err?.message || err));
  }

  onAuthStateChange(async (session) => {
    currentSession = session;
    setAuthedUI(session);
    if (session?.user) await refreshTransactions();
  });
})();


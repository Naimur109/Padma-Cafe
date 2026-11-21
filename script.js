
/* =====================================================
   PADMA CAFE — FINAL WEBSITE SCRIPT
   Customer + Admin + Orders + Sales Reports
   ===================================================== */

/* SUPABASE CONFIG */
const SUPABASE_URL = "https://qeoxoujxdptjjwgxhvbb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mjf3B4SkF1kOXwhVxy_veA_oTHLPNLU";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

/* CURRENCY */
const money = value =>
  `৳${Number(value || 0).toLocaleString("bn-BD")}`;

const $ = id => document.getElementById(id);

/* FOOD MENU — ORIGINAL IMAGES PRESERVED */
const MENU = [
  {
    id: "malai_cha",
    name: "মালাই চা",
    price: 40,
    image: "https://i.ibb.co/VcLK5nYV/file-00000000e9a88208aa7be40259922c1c.png"
  },
  {
    id: "dudh_cha",
    name: "দুধ চা",
    price: 30,
    image: "https://i.ibb.co/bRNDZZ3K/file-000000005ccc820889393bb309440d71.png"
  },
  {
    id: "pora_roti_10",
    name: "পোড়া রুটি (৳১০)",
    price: 10,
    image: "https://i.ibb.co/Df9P5mS3/file-000000000830820897010f7871918eb4.png"
  },
  {
    id: "pora_roti_15",
    name: "পোড়া রুটি (৳১৫)",
    price: 15,
    image: "https://i.ibb.co/99X1SkxX/file-000000008dbc8208b998a942475980d9.png"
  },
  {
    id: "chotpoti",
    name: "চটপটি",
    price: 40,
    image: "https://i.ibb.co/q3XbrDhz/file-0000000004648211b58070faa54dd03d.png"
  },
  {
    id: "chotpoti_egg",
    name: "চটপটি (ডিম)",
    price: 60,
    image: "https://i.ibb.co/V01TCgLQ/file-000000003354820899f2e4c773b57782.png"
  },
  {
    id: "fuchka",
    name: "ফুচকা",
    price: 50,
    image: "https://i.ibb.co/5h7kHJ6n/file-0000000017748208bf7b9981383311f1.png"
  }
];

/* GLOBAL STATE */
let user = null;
let profile = null;
let cart = {};
let authMode = "login";
let authRole = "customer";
let liveChannel = null;
let currentApproval = null;
let phoneInput = null;
let audioCtx = null;
let reportDate = new Date().toISOString().slice(0, 10);

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

/* TOAST */
function toast(message) {
  const element = $("toast");
  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    element.classList.remove("show");
  }, 3000);
}

/* MODALS */
function show(id) {
  const element = $(id);
  if (!element) return;

  element.classList.add("show");
  document.body.classList.add("modal-open");
}

function hide(id) {
  const element = $(id);
  if (!element) return;

  element.classList.remove("show");

  if (!document.querySelector(".modal.show")) {
    document.body.classList.remove("modal-open");
  }
}

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => {
    hide(button.dataset.close);
  });
});

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) hide(modal.id);
  });
});

/* MENU */
function renderMenu() {
  $("menuGrid").innerHTML = MENU.map(item => `
    <article class="menu-card">
      <img
        src="${item.image}"
        alt="${escapeHTML(item.name)}"
        loading="lazy"
        onerror="this.src='https://placehold.co/700x450/171717/d8b45d?text=Padma+Cafe'"
      >
      <div class="menu-card-body">
        <h3>${escapeHTML(item.name)}</h3>
        <div class="price">${money(item.price)}</div>
        <button class="gold-btn wide" onclick="addCart('${item.id}')">
          কার্টে যোগ করুন
        </button>
      </div>
    </article>
  `).join("");
}

/* CART */
window.addCart = id => {
  const item = MENU.find(product => product.id === id);
  if (!item) return;

  cart[id] = (cart[id] || 0) + 1;
  renderCart();
  toast("কার্টে যোগ হয়েছে");
};

window.changeQty = (id, difference) => {
  cart[id] = Math.max(0, (cart[id] || 0) + difference);

  if (!cart[id]) delete cart[id];

  renderCart();
};

function cartRows() {
  return Object.entries(cart)
    .filter(([id, qty]) => MENU.some(item => item.id === id) && qty > 0)
    .map(([id, qty]) => {
      const item = MENU.find(product => product.id === id);

      return {
        ...item,
        qty,
        subtotal: item.price * qty
      };
    });
}

function renderCart() {
  const rows = cartRows();

  $("cartCount").textContent = rows.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  $("cartLines").innerHTML = rows.length
    ? rows.map(item => `
      <div class="cart-line">
        <div>
          <b>${escapeHTML(item.name)}</b>
          <div>${money(item.price)} × ${item.qty} = ${money(item.subtotal)}</div>
        </div>
        <div class="qty-controls">
          <button onclick="changeQty('${item.id}',-1)">−</button>
          ${item.qty}
          <button onclick="changeQty('${item.id}',1)">+</button>
        </div>
      </div>
    `).join("")
    : "<p>কার্ট এখনো খালি।</p>";

  $("cartTotal").textContent = money(
    rows.reduce((sum, item) => sum + item.subtotal, 0)
  );

  $("checkoutBtn").disabled = !rows.length;
}

$("cartBtn").onclick = () => {
  renderCart();
  show("cartModal");
};

/* INTERNATIONAL PHONE INPUT */
function initializePhoneInput() {
  const input = $("authPhone");

  if (!input || !window.intlTelInput) return;

  if (phoneInput) return;

  phoneInput = window.intlTelInput(input, {
    initialCountry: "in",
    separateDialCode: true,
    nationalMode: true,
    autoPlaceholder: "polite",
    formatOnDisplay: true,
    countrySearch: true,
    loadUtils: () =>
      import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/utils.js")
  });
}

/* AUTHENTICATION */
$("customerLoginBtn").onclick = () => {
  authRole = "customer";
  openAuth("login");
};

$("adminLoginBtn").onclick = () => {
  authRole = "admin";
  openAuth("login");
};

$("accountBtn").onclick = () => {
  if (user) {
    openDashboard();
  } else {
    authRole = "customer";
    openAuth("login");
  }
};

function openAuth(mode) {
  authMode = mode;

  const isAdmin = authRole === "admin";
  const isSignup = mode === "signup";

  if (isAdmin && isSignup) {
    authMode = "login";
  }

  $("authRoleLabel").textContent = isAdmin
    ? "ADMIN ACCOUNT"
    : "CUSTOMER ACCOUNT";

  $("authTitle").textContent = isAdmin
    ? "অ্যাডমিন লগইন"
    : isSignup
      ? "কাস্টমার রেজিস্ট্রেশন"
      : "কাস্টমার লগইন";

  ["nameWrap", "phoneWrap", "addressWrap"].forEach(id => {
    $(id).classList.toggle("hidden", !isSignup);
  });

  $("switchAuthWrap").classList.toggle("hidden", isAdmin);

  $("authSwitchText").textContent = isSignup
    ? "আগে অ্যাকাউন্ট আছে?"
    : "নতুন কাস্টমার?";

  $("authSwitch").textContent = isSignup
    ? "লগইন করুন"
    : "রেজিস্টার করুন";

  $("authSubmitBtn").textContent = isSignup
    ? "রেজিস্টার করুন"
    : "লগইন করুন";

  $("authHint").textContent = isAdmin
    ? "শুধু অনুমোদিত অ্যাডমিন অ্যাকাউন্ট দিয়ে প্রবেশ করা যাবে।"
    : "কাস্টমার অ্যাকাউন্ট দিয়ে অর্ডার করুন ও অর্ডারের অবস্থা দেখুন।";

  $("authPassword").autocomplete = isSignup
    ? "new-password"
    : "current-password";

  if (isSignup) initializePhoneInput();

  show("authModal");
}

$("authSwitch").onclick = () => {
  openAuth(authMode === "signup" ? "login" : "signup");
};

/* AUTH FORM SUBMIT */
$("authForm").onsubmit = async event => {
  event.preventDefault();

  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;

  const submitButton = $("authSubmitBtn");
  submitButton.disabled = true;

  try {
    if (authMode === "signup") {
      if (authRole !== "customer") {
        throw new Error("অ্যাডমিন রেজিস্ট্রেশন এখানে অনুমোদিত নয়।");
      }

      if (!phoneInput || !phoneInput.isValidNumber()) {
        throw new Error("সঠিক মোবাইল নম্বর নির্বাচন করুন।");
      }

      const phone = phoneInput.getNumber();

      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: $("authName").value.trim(),
            phone,
            address: $("authAddress").value.trim()
          }
        }
      });

      if (error) throw error;

      if (data.session) {
        user = data.user;
        await loadProfile();
      }

      hide("authModal");
      toast("রেজিস্ট্রেশন সম্পন্ন। ইমেইল ভেরিফিকেশন চাইলে ইনবক্স দেখুন।");

    } else {
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      user = data.user;

      await loadProfile();

      if (authRole === "admin" && profile.role !== "admin") {
        await db.auth.signOut();
        user = null;
        profile = null;

        throw new Error("এই অ্যাকাউন্টের অ্যাডমিন অনুমতি নেই।");
      }

      if (authRole === "customer" && profile.role === "admin") {
        await db.auth.signOut();
        user = null;
        profile = null;

        throw new Error("এই অ্যাকাউন্টটি অ্যাডমিন অ্যাকাউন্ট। অ্যাডমিন লগইন ব্যবহার করুন।");
      }

      hide("authModal");
      await openDashboard();
    }

  } catch (error) {
    toast(error.message || "অনুরোধ সম্পন্ন হয়নি");
  } finally {
    submitButton.disabled = false;
  }
};

/* LOAD PROFILE */
async function loadProfile() {
  if (!user) return;

  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  profile = data;

  $("accountBtn").textContent =
    profile.full_name || user.email;

  $("accountBtn").classList.remove("hidden");
}

async function ensureUser() {
  if (!user || !profile) {
    authRole = "customer";
    openAuth("login");
    return false;
  }

  return true;
}

/* CHECKOUT */
$("checkoutBtn").onclick = async () => {
  if (!(await ensureUser())) return;

  const rows = cartRows();
  if (!rows.length) return;

  try {
    const total = rows.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const { data: order, error } = await db
      .from("orders")
      .insert({
        customer_id: user.id,
        customer_name: profile.full_name || user.email,
        customer_phone: profile.phone || "",
        customer_address: profile.address || "",
        total_amount: total,
        status: "pending",
        approval_status: "not_required"
      })
      .select()
      .single();

    if (error) throw error;

    const payload = rows.map(item => ({
      order_id: order.id,
      item_id: item.id,
      item_name: item.name,
      unit_price: item.price,
      quantity: item.qty,
      line_total: item.subtotal,
      item_status: "active"
    }));

    const { error: itemError } = await db
      .from("order_items")
      .insert(payload);

    if (itemError) throw itemError;

    cart = {};
    renderCart();
    hide("cartModal");

    toast("অর্ডার সফলভাবে পাঠানো হয়েছে");
    await openDashboard();

  } catch (error) {
    toast(error.message || "অর্ডার পাঠানো যায়নি");
  }
};

/* STATUS LABEL */
function statusLabel(status) {
  return ({
    pending: "অপেক্ষমাণ",
    confirmed: "কনফার্মড",
    cancelled: "বাতিল",
    awaiting_customer: "আপনার অনুমতির অপেক্ষায়",
    preparing: "প্রস্তুত হচ্ছে",
    completed: "সম্পন্ন"
  })[status] || status;
}

/* DASHBOARD */
async function openDashboard() {
  if (!user) return;

  try {
    await loadProfile();

    $("dashTitle").textContent =
      profile.role === "admin"
        ? "অ্যাডমিন ড্যাশবোর্ড"
        : "আমার অর্ডার";

    show("dashboardModal");

    await renderDashboard();
    subscribeLive();

  } catch (error) {
    toast(error.message);
  }
}

async function renderDashboard() {
  if (!profile) return;

  if (profile.role === "admin") {
    await renderAdmin();
  } else {
    await renderCustomer();
  }
}

/* FETCH ORDER ITEMS */
async function fetchItems(orderId) {
  const { data, error } = await db
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at");

  if (error) throw error;

  return data || [];
}

/* CUSTOMER DASHBOARD */
async function renderCustomer() {
  const { data, error } = await db
    .from("orders")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!data.length) {
    $("dashboardContent").innerHTML =
      "<p>এখনো কোনো অর্ডার করেননি। মেনু থেকে খাবার অর্ডার করুন।</p>";
    return;
  }

  let output = "";

  for (const order of data) {
    const items = await fetchItems(order.id);

    output += `
      <article class="order-card">
        <h3>অর্ডার #${escapeHTML(order.id.slice(0, 8))}</h3>

        <span class="status ${escapeHTML(order.status)}">
          ${statusLabel(order.status)}
        </span>

        <p>${new Date(order.created_at).toLocaleString("bn-BD")}</p>

        <div class="order-items">
          ${items.map(item => `
            <div class="order-item-row">
              <span>
                ${escapeHTML(item.item_name)} × ${item.quantity}
                ${item.item_status === "unavailable" ? " (বাদ)" : ""}
              </span>
              <span>${money(item.line_total)}</span>
            </div>
          `).join("")}
        </div>

        <div class="total-line">
          <b>মোট</b>
          <b>${money(order.total_amount)}</b>
        </div>

        ${order.approval_status === "awaiting_customer" ? `
          <button class="gold-btn wide"
            onclick="openApproval('${order.id}')">
            অর্ডার পরিবর্তনের অনুমতি দিন
          </button>
        ` : ""}

        <button class="outline" onclick="showReceipt('${order.id}')">
          রসিদ দেখুন
        </button>
      </article>
    `;
  }

  $("dashboardContent").innerHTML = output;
}

/* ADMIN DASHBOARD */
async function renderAdmin() {
  const { data, error } = await db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const orders = data || [];

  $("dashboardContent").innerHTML = `
    <section class="sales-section">
      <h2>দৈনিক বিক্রির রিপোর্ট</h2>
      <p>শুধু সম্পন্ন (Delivered/Completed) অর্ডার বিক্রির হিসাবে গণনা হবে।</p>

      <div class="report-filters">
        <label>
          রিপোর্টের তারিখ
          <input type="date" id="reportDate" value="${reportDate}">
        </label>

        <button class="gold-btn" id="loadReport">রিপোর্ট দেখুন</button>
        <button class="outline" id="printReport">রিপোর্ট প্রিন্ট</button>
      </div>

      <div id="salesReport">
        রিপোর্ট লোড হচ্ছে...
      </div>
    </section>

    <hr>

    <h2>সকল অর্ডার (${orders.length})</h2>

    <div id="adminOrders">
      ${orders.length ? "" : "<p>নতুন অর্ডার নেই।</p>"}
    </div>
  `;

  $("reportDate").onchange = event => {
    reportDate = event.target.value;
  };

  $("loadReport").onclick = async () => {
    reportDate = $("reportDate").value;
    await renderSalesReport();
  };

  $("printReport").onclick = () => {
    printSalesReport();
  };

  await renderSalesReport();

  let output = "";

  for (const order of orders) {
    const items = await fetchItems(order.id);

    output += `
      <article class="admin-card">
        <h3>
          অর্ডার #${escapeHTML(order.id.slice(0, 8))}
          · ${escapeHTML(order.customer_name || "Customer")}
        </h3>

        <span class="status ${escapeHTML(order.status)}">
          ${statusLabel(order.status)}
        </span>

        <p>
          ফোন: ${escapeHTML(order.customer_phone || "—")}<br>
          ঠিকানা: ${escapeHTML(order.customer_address || "—")}
        </p>

        <div class="order-items">
          ${items.map(item => `
            <div class="order-item-row">
              <span>
                ${escapeHTML(item.item_name)} × ${item.quantity}
                ${item.item_status === "unavailable" ? " · পাওয়া যায়নি" : ""}
              </span>

              <span>${money(item.line_total)}</span>

              ${order.status === "pending" &&
                item.item_status === "active" ? `
                  <button class="outline"
                    onclick="markUnavailable('${item.id}')">
                    স্টক নেই
                  </button>
                ` : ""}
            </div>
          `).join("")}
        </div>

        <div class="total-line">
          <b>মোট</b>
          <b>${money(order.total_amount)}</b>
        </div>

        <div class="order-actions">
          ${order.status === "pending" ? `
            <button class="gold-btn"
              onclick="adminStatus('${order.id}','confirmed')">
              কনফার্ম
            </button>

            <button class="danger-btn"
              onclick="adminStatus('${order.id}','cancelled')">
              অর্ডার বাতিল
            </button>
          ` : ""}

          ${order.status === "confirmed" ? `
            <button class="gold-btn"
              onclick="adminStatus('${order.id}','preparing')">
              প্রস্তুত হচ্ছে
            </button>
          ` : ""}

          ${order.status === "preparing" ? `
            <button class="gold-btn"
              onclick="adminStatus('${order.id}','completed')">
              ডেলিভারি সম্পন্ন
            </button>
          ` : ""}

          <button class="outline"
            onclick="showReceipt('${order.id}')">
            রসিদ
          </button>
        </div>

        ${order.approval_status === "awaiting_customer" ? `
          <p>কাস্টমারের অনুমতির অপেক্ষায়।</p>
        ` : ""}

        ${order.approval_status === "accepted" ? `
          <p>কাস্টমার বাকি আইটেম গ্রহণ করেছেন।</p>
        ` : ""}
      </article>
    `;
  }

  $("adminOrders").innerHTML = output;
}

/* SALES REPORT */
function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function getSalesForPeriod(start, end) {
  const { data, error } = await db
    .from("orders")
    .select("id,total_amount,status,created_at")
    .eq("status", "completed")
    .gte("created_at", start)
    .lt("created_at", end);

  if (error) throw error;

  return data || [];
}

async function renderSalesReport() {
  const report = $("salesReport");
  if (!report) return;

  report.innerHTML = "রিপোর্ট লোড হচ্ছে...";

  try {
    const selected = new Date(`${reportDate}T00:00:00`);

    if (Number.isNaN(selected.getTime())) {
      throw new Error("সঠিক তারিখ নির্বাচন করুন।");
    }

    const start = new Date(selected);
    const end = new Date(selected);
    end.setDate(end.getDate() + 1);

    const monthStart = new Date(
      selected.getFullYear(),
      selected.getMonth(),
      1
    );

    const nextMonth = new Date(
      selected.getFullYear(),
      selected.getMonth() + 1,
      1
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [daily, monthly, allTime, allOrders] = await Promise.all([
      getSalesForPeriod(start.toISOString(), end.toISOString()),
      getSalesForPeriod(monthStart.toISOString(), nextMonth.toISOString()),
      getSalesForPeriod("2000-01-01T00:00:00.000Z", "2100-01-01T00:00:00.000Z"),
      db.from("orders").select("id,status,created_at")
    ]);

    if (allOrders.error) throw allOrders.error;

    const todaySales = allTime.filter(order => {
      const time = new Date(order.created_at);
      return time >= todayStart && time < tomorrow;
    });

    const sum = rows =>
      rows.reduce((total, order) => total + Number(order.total_amount || 0), 0);

    const totalOrders = allOrders.data || [];
    const completed = totalOrders.filter(o => o.status === "completed");
    const cancelled = totalOrders.filter(o => o.status === "cancelled");

    report.innerHTML = `
      <div class="report-grid">
        <div class="report-card">
          <small>${reportDate} তারিখের বিক্রি</small>
          <strong>${money(sum(daily))}</strong>
        </div>

        <div class="report-card">
          <small>আজকের বিক্রি</small>
          <strong>${money(sum(todaySales))}</strong>
        </div>

        <div class="report-card">
          <small>নির্বাচিত দিনের সম্পন্ন অর্ডার</small>
          <strong>${daily.length}</strong>
        </div>

        <div class="report-card">
          <small>এই মাসের বিক্রি</small>
          <strong>${money(sum(monthly))}</strong>
        </div>

        <div class="report-card">
          <small>সর্বমোট বিক্রি</small>
          <strong>${money(sum(allTime))}</strong>
        </div>

        <div class="report-card">
          <small>সর্বমোট অর্ডার</small>
          <strong>${totalOrders.length}</strong>
        </div>

        <div class="report-card">
          <small>সম্পন্ন অর্ডার</small>
          <strong>${completed.length}</strong>
        </div>

        <div class="report-card">
          <small>বাতিল অর্ডার</small>
          <strong>${cancelled.length}</strong>
        </div>
      </div>

      <h3>নির্বাচিত দিনের সম্পন্ন অর্ডার</h3>

      ${daily.length ? daily.map(order => `
        <div class="order-item-row">
          <span>অর্ডার #${escapeHTML(order.id.slice(0, 8))}</span>
          <b>${money(order.total_amount)}</b>
        </div>
      `).join("") : "<p>এই তারিখে কোনো সম্পন্ন অর্ডার নেই।</p>"}

      <p class="field-hint">
        বিক্রির হিসাবে শুধু completed অর্ডার ধরা হয়েছে।
      </p>
    `;

  } catch (error) {
    report.innerHTML = `<p>রিপোর্ট পাওয়া যায়নি: ${escapeHTML(error.message)}</p>`;
  }
}

/* PRINT SALES REPORT */
function printSalesReport() {
  const report = $("salesReport");
  if (!report) return;

  const popup = window.open("", "_blank");

  if (!popup) {
    toast("প্রিন্ট করার জন্য পপআপ অনুমতি দিন।");
    return;
  }

  popup.document.write(`
    <!doctype html>
    <html lang="bn">
    <head>
      <meta charset="utf-8">
      <title>Padma Cafe Sales Report</title>
      <style>
        body{font-family:Arial,sans-serif;padding:25px;color:#111}
        h1,h2{color:#8b6824}
        .report-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .report-card{border:1px solid #bbb;padding:15px}
        .report-card strong{display:block;font-size:22px;margin-top:8px}
        .order-item-row{display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #ddd}
      </style>
    </head>
    <body>
      <h1>PADMA CAFE</h1>
      <h2>দৈনিক বিক্রির রিপোর্ট</h2>
      <p>তারিখ: ${escapeHTML(reportDate)}</p>
      ${report.innerHTML}
      <script>window.onload=()=>window.print();<\/script>
    </body>
    </html>
  `);

  popup.document.close();
}

/* ADMIN CONFIRM / CANCEL / STATUS */
window.adminStatus = async (id, status) => {
  if (!profile || profile.role !== "admin") {
    toast("অ্যাডমিন অনুমতি প্রয়োজন।");
    return;
  }

  try {
    const { error } = await db
      .from("orders")
      .update({ status })
      .eq("id", id);

    if (error) throw error;

    toast("অর্ডার আপডেট হয়েছে");
    await renderDashboard();

  } catch (error) {
    toast(error.message);
  }
};

/* MARK ITEM UNAVAILABLE */
window.markUnavailable = async itemId => {
  if (!profile || profile.role !== "admin") {
    toast("অ্যাডমিন অনুমতি প্রয়োজন।");
    return;
  }

  try {
    const { error } = await db.rpc(
      "admin_mark_item_unavailable",
      { p_item_id: itemId }
    );

    if (error) throw error;

    toast("কাস্টমারের অনুমতির জন্য আপডেট পাঠানো হয়েছে");
    await renderDashboard();

  } catch (error) {
    toast(error.message);
  }
};

/* CUSTOMER PARTIAL ORDER APPROVAL */
window.openApproval = async orderId => {
  try {
    const { data, error } = await db
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) throw error;

    if (data.customer_id !== user.id ||
        data.approval_status !== "awaiting_customer") {
      throw new Error("এই অর্ডারের অনুমতি দেওয়া যাবে না।");
    }

    const items = await fetchItems(orderId);
    currentApproval = orderId;

    $("approvalMessage").textContent =
      "আপনার অর্ডারের কিছু আইটেম পাওয়া যাচ্ছে না। নিচে সংশোধিত অর্ডারটি দেখুন।";

    $("approvalItems").innerHTML = items.map(item => `
      <div class="order-item-row">
        <span>
          ${escapeHTML(item.item_name)} × ${item.quantity}
          ${item.item_status === "unavailable" ? " · পাওয়া যাচ্ছে না" : ""}
        </span>
        <span>${money(item.line_total)}</span>
      </div>
    `).join("");

    $("approvalTotal").textContent = money(data.total_amount);

    show("approvalModal");

  } catch (error) {
    toast(error.message);
  }
};

/* CUSTOMER ACCEPT REMAINING ITEMS */
$("approveRemaining").onclick = async () => {
  if (!currentApproval) return;

  try {
    const { error } = await db.rpc(
      "customer_approve_remaining_order",
      { p_order_id: currentApproval }
    );

    if (error) throw error;

    hide("approvalModal");
    currentApproval = null;

    toast("বাকি আইটেমগুলো গ্রহণ করেছেন");
    await renderDashboard();

  } catch (error) {
    toast(error.message);
  }
};

/* CUSTOMER CANCEL WHOLE ORDER */
$("cancelWholeOrder").onclick = async () => {
  if (!currentApproval) return;

  try {
    const { error } = await db.rpc(
      "customer_cancel_changed_order",
      { p_order_id: currentApproval }
    );

    if (error) throw error;

    hide("approvalModal");
    currentApproval = null;

    toast("সম্পূর্ণ অর্ডার বাতিল হয়েছে");
    await renderDashboard();

  } catch (error) {
    toast(error.message);
  }
};

/* RECEIPT */
window.showReceipt = async id => {
  try {
    const { data: order, error } = await db
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    const items = await fetchItems(id);

    $("receiptContent").innerHTML = `
      <div class="receipt">
        <h2>PADMA CAFE</h2>
        <p>অর্ডার রসিদ</p>

        <p>
          অর্ডার: ${escapeHTML(id.slice(0, 8))}<br>
          তারিখ: ${new Date(order.created_at).toLocaleString("bn-BD")}
        </p>

        <p>
          নাম: ${escapeHTML(order.customer_name || "")}<br>
          ফোন: ${escapeHTML(order.customer_phone || "")}<br>
          ঠিকানা: ${escapeHTML(order.customer_address || "")}
        </p>

        <table>
          <thead>
            <tr>
              <th>আইটেম</th>
              <th>পরিমাণ</th>
              <th>মূল্য</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>
                  ${escapeHTML(item.item_name)}
                  ${item.item_status === "unavailable" ? "(বাদ)" : ""}
                </td>
                <td>${item.quantity}</td>
                <td>${money(item.line_total)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <p><b>সর্বমোট: ${money(order.total_amount)}</b></p>
        <p>অর্ডারের অবস্থা: ${statusLabel(order.status)}</p>
        <p>ধন্যবাদ, আবার আসবেন।</p>
      </div>
    `;

    show("receiptModal");

  } catch (error) {
    toast(error.message);
  }
};

$("printReceipt").onclick = () => window.print();

/* REALTIME NOTIFICATIONS */
function subscribeLive() {
  if (!user) return;

  if (liveChannel) {
    db.removeChannel(liveChannel);
    liveChannel = null;
  }

  liveChannel = db
    .channel("padma-live-" + user.id)

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders"
      },
      async payload => {
        const order = payload.new || {};

        if (
          profile?.role === "admin" ||
          order.customer_id === user.id ||
          payload.old?.customer_id === user.id
        ) {
          await renderDashboard();

          if (
            profile?.role === "admin" &&
            payload.eventType === "INSERT"
          ) {
            playAlert();
            toast("নতুন অর্ডার এসেছে!");
          }

          if (
            profile?.role !== "admin" &&
            order.approval_status === "awaiting_customer"
          ) {
            toast("আপনার অর্ডারে পরিবর্তন হয়েছে। ড্যাশবোর্ড দেখুন।");
          }
        }
      }
    )

    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "order_items"
      },
      () => {
        renderDashboard().catch(error => console.error(error));
      }
    )

    .subscribe();
}

/* ADMIN SOUND ALERT */
function playAlert() {
  try {
    audioCtx = audioCtx || new (
      window.AudioContext || window.webkitAudioContext
    )();

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    [0, 0.22, 0.44].forEach(time => {
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      oscillator.connect(gain);
      gain.connect(audioCtx.destination);

      oscillator.frequency.value = 880;

      gain.gain.setValueAtTime(
        0.001,
        audioCtx.currentTime + time
      );

      gain.gain.exponentialRampToValueAtTime(
        0.18,
        audioCtx.currentTime + time + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + time + 0.16
      );

      oscillator.start(audioCtx.currentTime + time);
      oscillator.stop(audioCtx.currentTime + time + 0.17);
    });

  } catch (error) {
    console.info("Sound requires browser interaction.", error);
  }
}

/* LOGOUT */
$("logoutBtn").onclick = async () => {
  try {
    const { error } = await db.auth.signOut();
    if (error) throw error;

    user = null;
    profile = null;

    if (liveChannel) {
      await db.removeChannel(liveChannel);
      liveChannel = null;
    }

    hide("dashboardModal");

    $("accountBtn").textContent = "আমার অ্যাকাউন্ট";
    $("accountBtn").classList.add("hidden");

    toast("লগআউট হয়েছে");

  } catch (error) {
    toast(error.message);
  }
};

/* INITIALIZE */
(async function initializeWebsite() {
  renderMenu();
  renderCart();
  initializePhoneInput();

  try {
    const { data, error } = await db.auth.getSession();

    if (error) throw error;

    if (data.session) {
      user = data.session.user;

      try {
        await loadProfile();
      } catch (profileError) {
        console.warn("Profile load error:", profileError);
      }
    }

  } catch (error) {
    console.error("Initialization error:", error);
    toast("ওয়েবসাইট সংযোগে সমস্যা হয়েছে।");
  }
})();

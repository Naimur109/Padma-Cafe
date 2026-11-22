
// ======================================================
// PADMA CAFE — COMPLETE WEBSITE SCRIPT
// File: script.js
// Menu: 26 items | Currency: BDT | Timezone: Asia/Dhaka
// ======================================================

// SUPABASE CONFIGURATION
const SUPABASE_URL = "https://qeoxoujxdptjiwgxhvbb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mjf3B4SkF1kOXwhVxy_veA_oTHLPNLU";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ------------------------------------------------------
// HELPERS
// ------------------------------------------------------

const $ = id => document.getElementById(id);

const money = value =>
  `৳${Number(value || 0).toLocaleString("bn-BD")}`;

const numberBN = value =>
  Number(value || 0).toLocaleString("bn-BD");

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

const dhakaDate = date => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const values = {};
  parts.forEach(part => values[part.type] = part.value);

  return `${values.year}-${values.month}-${values.day}`;
};

// Bangladesh time is UTC+6.
function dhakaDayRange(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);

  const start = new Date(
    Date.UTC(year, month - 1, day) - 6 * 60 * 60 * 1000
  );

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

function dhakaMonthRange(dateString) {
  const [year, month] = dateString.split("-").map(Number);

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  const endDate =
    `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  return {
    start: dhakaDayRange(startDate).start,
    end: dhakaDayRange(endDate).start
  };
}

function dateTime(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("bn-BD", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function toast(message) {
  const element = $("toast");
  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    element.classList.remove("show");
  }, 3500);
}

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

function setLoading(button, loading, text = "অপেক্ষা করুন...") {
  if (!button) return;

  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = text;
    button.disabled = true;
  } else {
    button.textContent =
      button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function showError(error) {
  console.error(error);
  toast(error?.message || "কাজটি সম্পন্ন করা যায়নি।");
}

// ------------------------------------------------------
// MENU — 26 ITEMS
// Original seven image URLs preserved from repository.
// ------------------------------------------------------

const MENU = [
  // PADMA SPECIAL — 11
  {
    id: "hot_coffee",
    name: "হট কফি",
    category: "পদ্মা স্পেশাল",
    price: 50
  },
  {
    id: "malai_cha",
    name: "মালাই চা",
    category: "পদ্মা স্পেশাল",
    price: 40,
    image: "https://i.ibb.co/VcLK5nYV/file-00000000e9a88208aa7be40259922c1c.png"
  },
  {
    id: "dudh_cha",
    name: "দুধ চা",
    category: "পদ্মা স্পেশাল",
    price: 30,
    image: "https://i.ibb.co/bRNDZZ3K/file-000000005ccc820889393bb309440d71.png"
  },
  {
    id: "pora_roti_10",
    name: "পোড়া রুটি",
    category: "পদ্মা স্পেশাল",
    price: 10,
    image: "https://i.ibb.co/Df9P5mS3/file-000000000830820897010f7871918eb4.png"
  },
  {
    id: "pora_roti_15",
    name: "পোড়া রুটি",
    category: "পদ্মা স্পেশাল",
    price: 15,
    image: "https://i.ibb.co/99X1SkxX/file-000000008dbc8208b998a942475980d9.png"
  },
  {
    id: "malai_cha_roti",
    name: "মালাই চা + পোড়া রুটি",
    category: "পদ্মা স্পেশাল",
    price: 50
  },
  {
    id: "chotpoti",
    name: "চটপটি",
    category: "পদ্মা স্পেশাল",
    price: 40,
    image: "https://i.ibb.co/q3XbrDhz/file-0000000004648211b58070faa54dd03d.png"
  },
  {
    id: "chotpoti_egg",
    name: "চটপটি (ডিম)",
    category: "পদ্মা স্পেশাল",
    price: 60,
    image: "https://i.ibb.co/V01TCgLQ/file-000000003354820899f2e4c773b57782.png"
  },
  {
    id: "fuchka",
    name: "ফুচকা",
    category: "পদ্মা স্পেশাল",
    price: 50,
    image: "https://i.ibb.co/5h7kHJ6n/file-0000000017748208bf7b9981383311f1.png"
  },
  {
    id: "doi_fuchka",
    name: "দই ফুচকা",
    category: "পদ্মা স্পেশাল",
    price: 90
  },
  {
    id: "doi_chira",
    name: "দই চিড়া",
    category: "পদ্মা স্পেশাল",
    price: 80
  },

  // BURGER — 2
  {
    id: "chicken_tikka_burger",
    name: "চিকেন টিক্কা বার্গার",
    category: "বার্গার",
    price: 80
  },
  {
    id: "beef_burger",
    name: "বিফ বার্গার",
    category: "বার্গার",
    price: 130
  },

  // STARTER — 5
  {
    id: "kolija_singara",
    name: "কলিজা সিঙ্গারা",
    category: "স্টাটার",
    price: 25
  },
  {
    id: "french_fries",
    name: "ফ্রেন্স ফ্রাই",
    category: "স্টাটার",
    price: 50
  },
  {
    id: "chicken_spring_roll",
    name: "চিকেন স্প্রিং রোল",
    category: "স্টাটার",
    price: 80
  },
  {
    id: "chicken_momos",
    name: "চিকেন মমস",
    category: "স্টাটার",
    price: 100
  },
  {
    id: "chicken_fry_3pcs",
    name: "চিকেন ফ্রাই (৩ পিস)",
    category: "স্টাটার",
    price: 120
  },

  // SHAKES — 6
  {
    id: "cold_coffee",
    name: "কোল্ড কফি",
    category: "শেক",
    price: 80
  },
  {
    id: "chocolate_shake",
    name: "চকলেট শেক",
    category: "শেক",
    price: 90
  },
  {
    id: "vanilla_shake",
    name: "ভ্যানিলা শেক",
    category: "শেক",
    price: 99
  },
  {
    id: "oreo_shake",
    name: "অরিও শেক",
    category: "শেক",
    price: 110
  },
  {
    id: "kitkat_shake",
    name: "কিটক্যাট শেক",
    category: "শেক",
    price: 110
  },
  {
    id: "butterscotch_shake",
    name: "বাটারস্কচ শেক (Padma Special)",
    category: "শেক",
    price: 110
  },

  // SOFT DRINKS — 2
  {
    id: "water",
    name: "পানি",
    category: "সফট ড্রিঙ্কস",
    price: 20
    image: "https://i.ibb.co/V01TCgLQ/file-000000003354820899f2e4c773b57782.png"
  },
  {
    id: "mojo",
    name: "মজো",
    category: "সফট ড্রিঙ্কস",
    price: 20
  }
];

const CATEGORIES = [
  "সব খাবার",
  "পদ্মা স্পেশাল",
  "বার্গার",
  "স্টাটার",
  "শেক",
  "সফট ড্রিঙ্কস"
];

let selectedCategory = "সব খাবার";

// ------------------------------------------------------
// GLOBAL STATE
// ------------------------------------------------------

let user = null;
let profile = null;
let cart = {};
let authMode = "login";
let authRole = "customer";
let phoneInput = null;
let liveChannel = null;
let currentApproval = null;
let currentReceipt = null;
let audioCtx = null;
let reportDate = dhakaDate(new Date());
let offlineCart = {};

// ------------------------------------------------------
// MODAL EVENTS
// ------------------------------------------------------

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

// ------------------------------------------------------
// MENU DISPLAY
// ------------------------------------------------------

function renderCategories() {
  const container = $("menuCategories");
  if (!container) return;

  container.innerHTML = CATEGORIES.map(category => `
    <button
      type="button"
      class="category-btn ${selectedCategory === category ? "active" : ""}"
      data-category="${escapeHTML(category)}"
    >
      ${escapeHTML(category)}
    </button>
  `).join("");
}

function renderMenu() {
  const container = $("menuGrid");
  if (!container) return;

  const items = selectedCategory === "সব খাবার"
    ? MENU
    : MENU.filter(item => item.category === selectedCategory);

  container.innerHTML = items.map(item => `
    <article class="menu-card">
      ${
        item.image
          ? `<img
              src="${escapeHTML(item.image)}"
              alt="${escapeHTML(item.name)}"
              loading="lazy"
              onerror="this.outerHTML='<div class=&quot;menu-card-placeholder&quot;><i class=&quot;fa-solid fa-utensils&quot;></i></div>'"
            >`
          : `<div class="menu-card-placeholder">
              <i class="fa-solid fa-utensils"></i>
            </div>`
      }

      <div class="menu-card-body">
        <span class="menu-category-label">
          ${escapeHTML(item.category)}
        </span>

        <h3>${escapeHTML(item.name)}</h3>

        <div class="menu-card-bottom">
          <span class="menu-price">${money(item.price)}</span>

          <button
            class="add-cart-btn"
            type="button"
            data-add="${escapeHTML(item.id)}"
          >
            <i class="fa-solid fa-plus"></i>
            কার্টে যোগ
          </button>
        </div>
      </div>
    </article>
  `).join("");
}

$("menuCategories")?.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  selectedCategory = button.dataset.category;
  renderCategories();
  renderMenu();
});

$("menuGrid")?.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (!button) return;

  addCart(button.dataset.add);
});

// ------------------------------------------------------
// CART
// ------------------------------------------------------

function addCart(id) {
  const item = MENU.find(product => product.id === id);
  if (!item) return;

  cart[id] = (cart[id] || 0) + 1;

  renderCart();
  toast(`${item.name} কার্টে যোগ হয়েছে`);
}

function changeQty(id, difference) {
  cart[id] = Math.max(0, (cart[id] || 0) + difference);

  if (!cart[id]) delete cart[id];

  renderCart();
}

function cartRows() {
  return Object.entries(cart)
    .map(([id, qty]) => {
      const item = MENU.find(product => product.id === id);
      if (!item || qty < 1) return null;

      return {
        ...item,
        qty,
        subtotal: item.price * qty
      };
    })
    .filter(Boolean);
}

function cartTotal() {
  return cartRows().reduce(
    (sum, item) => sum + item.subtotal,
    0
  );
}

function renderCart() {
  const rows = cartRows();

  $("cartCount").textContent = numberBN(
    rows.reduce((sum, item) => sum + item.qty, 0)
  );

  $("cartLines").innerHTML = rows.length
    ? rows.map(item => `
        <div class="cart-line">
          <div class="cart-line-info">
            <strong>${escapeHTML(item.name)}</strong>
            <small>${money(item.price)} × ${numberBN(item.qty)}</small>
            <b>${money(item.subtotal)}</b>
          </div>

          <div class="quantity-controls">
            <button type="button" data-cart-change="${item.id}" data-diff="-1">−</button>
            <span>${numberBN(item.qty)}</span>
            <button type="button" data-cart-change="${item.id}" data-diff="1">+</button>
          </div>
        </div>
      `).join("")
    : `<p class="empty-state">আপনার কার্ট এখনো খালি।</p>`;

  $("cartTotal").textContent = money(cartTotal());
  $("checkoutBtn").disabled = !rows.length;
}

$("cartLines")?.addEventListener("click", event => {
  const button = event.target.closest("[data-cart-change]");
  if (!button) return;

  changeQty(button.dataset.cartChange, Number(button.dataset.diff));
});

$("cartBtn").onclick = () => {
  renderCart();
  show("cartModal");
};

// ------------------------------------------------------
// INTERNATIONAL PHONE INPUT
// ------------------------------------------------------

function initializePhoneInput() {
  const input = $("authPhone");

  if (!input || !window.intlTelInput || phoneInput) return;

  phoneInput = window.intlTelInput(input, {
    initialCountry: "in",
    separateDialCode: true,
    nationalMode: true,
    autoPlaceholder: "polite",
    formatOnDisplay: true,
    countrySearch: true,
    loadUtils: () =>
      import(
        "https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/utils.js"
      )
  });
}

// ------------------------------------------------------
// AUTHENTICATION
// ------------------------------------------------------

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
  const isSignup = mode === "signup" && !isAdmin;

  $("authRoleLabel").textContent =
    isAdmin ? "ADMIN ACCOUNT" : "CUSTOMER ACCOUNT";

  $("authTitle").textContent = isAdmin
    ? "অ্যাডমিন লগইন"
    : isSignup
      ? "কাস্টমার রেজিস্ট্রেশন"
      : "কাস্টমার লগইন";

  ["nameWrap", "phoneWrap", "addressWrap", "confirmPasswordWrap"]
    .forEach(id => {
      $(id).classList.toggle("hidden", !isSignup);
    });

  $("forgotPasswordWrap").classList.toggle("hidden", isSignup);
  $("switchAuthWrap").classList.toggle("hidden", isAdmin);

  $("authSwitchText").textContent =
    isSignup ? "আগে অ্যাকাউন্ট আছে?" : "নতুন কাস্টমার?";

  $("authSwitch").textContent =
    isSignup ? "লগইন করুন" : "রেজিস্টার করুন";

  $("authSubmitBtn").textContent =
    isSignup ? "রেজিস্টার করুন" : "লগইন করুন";

  $("authHint").textContent = isAdmin
    ? "শুধু অনুমোদিত অ্যাডমিন অ্যাকাউন্ট দিয়ে প্রবেশ করা যাবে।"
    : "আপনার অ্যাকাউন্ট দিয়ে অর্ডার করুন ও অর্ডারের অবস্থা দেখুন।";

  $("authPassword").autocomplete =
    isSignup ? "new-password" : "current-password";

  if (isSignup) initializePhoneInput();

  show("authModal");
}

$("authSwitch").onclick = () => {
  openAuth(authMode === "signup" ? "login" : "signup");
};

$("authForm").onsubmit = async event => {
  event.preventDefault();

  const button = $("authSubmitBtn");
  setLoading(button, true);

  try {
    const email = $("authEmail").value.trim().toLowerCase();
    const password = $("authPassword").value;

    if (authMode === "signup") {
      if (authRole !== "customer") {
        throw new Error("অ্যাডমিন রেজিস্ট্রেশন অনুমোদিত নয়।");
      }

      const name = $("authName").value.trim();
      const address = $("authAddress").value.trim();
      const confirmPassword = $("authConfirmPassword").value;

      if (!name || !address) {
        throw new Error("নাম ও ঠিকানা পূরণ করুন।");
      }

      if (password.length < 6) {
        throw new Error("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      }

      if (password !== confirmPassword) {
        throw new Error("দুইটি পাসওয়ার্ড মিলছে না।");
      }

      if (!phoneInput || !phoneInput.isValidNumber()) {
        throw new Error("সঠিক মোবাইল নম্বর দিন।");
      }

      const phone = phoneInput.getNumber();

      const { data, error } = await db.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone,
            address
          }
        }
      });

      if (error) throw error;

      hide("authModal");

      if (data.session) {
        user = data.user;
        await loadProfile();
        await openDashboard();
        toast("রেজিস্ট্রেশন সফল হয়েছে।");
      } else {
        toast("রেজিস্ট্রেশন হয়েছে। ইমেইল ইনবক্সে ভেরিফিকেশন লিংক দেখুন।");
      }

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

        throw new Error("এই অ্যাকাউন্টটি অ্যাডমিন। অ্যাডমিন লগইন ব্যবহার করুন।");
      }

      hide("authModal");
      await openDashboard();
      toast("লগইন সফল হয়েছে।");
    }

  } catch (error) {
    showError(error);
  } finally {
    setLoading(button, false);
  }
};

// ------------------------------------------------------
// FORGOT PASSWORD
// ------------------------------------------------------

$("forgotPasswordBtn").onclick = async () => {
  const email = $("authEmail").value.trim().toLowerCase();

  if (!email) {
    toast("প্রথমে আপনার ইমেইল লিখুন।");
    $("authEmail").focus();
    return;
  }

  try {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    });

    if (error) throw error;

    toast("পাসওয়ার্ড রিসেট লিংক ইমেইলে পাঠানো হয়েছে।");

  } catch (error) {
    showError(error);
  }
};

$("resetPasswordForm").onsubmit = async event => {
  event.preventDefault();

  const password = $("newPassword").value;
  const confirmPassword = $("confirmNewPassword").value;

  if (password.length < 6) {
    toast("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
    return;
  }

  if (password !== confirmPassword) {
    toast("দুইটি পাসওয়ার্ড মিলছে না।");
    return;
  }

  try {
    const { error } = await db.auth.updateUser({ password });
    if (error) throw error;

    hide("resetPasswordModal");
    toast("নতুন পাসওয়ার্ড সেট হয়েছে।");

  } catch (error) {
    showError(error);
  }
};

// ------------------------------------------------------
// PROFILE
// ------------------------------------------------------

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
    profile.full_name || user.email || "আমার অ্যাকাউন্ট";

  $("accountBtn").classList.remove("hidden");
}

async function ensureCustomer() {
  if (!user || !profile) {
    authRole = "customer";
    openAuth("login");
    return false;
  }

  if (profile.role !== "customer") {
    toast("কাস্টমার অ্যাকাউন্ট প্রয়োজন।");
    return false;
  }

  return true;
}

function ensureAdmin() {
  if (!user || !profile || profile.role !== "admin") {
    toast("এই কাজের জন্য অ্যাডমিন অনুমতি প্রয়োজন।");
    return false;
  }

  return true;
}

// ------------------------------------------------------
// PLACE CUSTOMER ORDER
// Server-side RPC calculates the real prices.
// ------------------------------------------------------

$("checkoutBtn").onclick = async () => {
  if (!(await ensureCustomer())) return;

  const rows = cartRows();
  if (!rows.length) return;

  const button = $("checkoutBtn");
  setLoading(button, true, "অর্ডার পাঠানো হচ্ছে...");

  try {
    const items = rows.map(item => ({
      id: item.id,
      quantity: item.qty
    }));

    const { data, error } = await db.rpc(
      "place_customer_order",
      { p_items: items }
    );

    if (error) throw error;

    cart = {};
    renderCart();
    hide("cartModal");

    toast("আপনার অর্ডার সফলভাবে পাঠানো হয়েছে।");
    await openDashboard();

  } catch (error) {
    showError(error);
  } finally {
    setLoading(button, false);
  }
};

// ------------------------------------------------------
// STATUS LABELS
// ------------------------------------------------------

function statusLabel(status) {
  return ({
    pending: "অপেক্ষমাণ",
    confirmed: "কনফার্মড",
    preparing: "প্রস্তুত হচ্ছে",
    completed: "সম্পন্ন",
    cancelled: "বাতিল",
    awaiting_customer: "আপনার অনুমতির অপেক্ষায়",
    not_required: "অনুমতি প্রয়োজন নেই",
    accepted: "গ্রহণ করা হয়েছে",
    rejected: "বাতিল করা হয়েছে"
  })[status] || status || "—";
}

// ------------------------------------------------------
// DASHBOARD
// ------------------------------------------------------

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
    showError(error);
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

async function fetchItems(orderId) {
  const { data, error } = await db
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at");

  if (error) throw error;

  return data || [];
}

// ------------------------------------------------------
// CUSTOMER DASHBOARD
// ------------------------------------------------------

async function renderCustomer() {
  const container = $("dashboardContent");

  container.innerHTML = `<p class="loading">আপনার অর্ডার লোড হচ্ছে...</p>`;

  const { data, error } = await db
    .from("orders")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  if (!data.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-bag-shopping"></i>
        <p>এখনো কোনো অর্ডার করেননি।</p>
      </div>
    `;
    return;
  }

  let output = `
    <div class="dashboard-panel">
      <h3>স্বাগতম, ${escapeHTML(profile.full_name || "কাস্টমার")}</h3>
      <p>আপনার অর্ডারের অবস্থা ও রসিদ এখানে দেখতে পারবেন।</p>
    </div>
  `;

  for (const order of data) {
    const items = await fetchItems(order.id);

    output += `
      <article class="order-card">
        <h3>অর্ডার #${escapeHTML(order.id.slice(0, 8))}</h3>

        <span class="status ${escapeHTML(order.status)}">
          ${statusLabel(order.status)}
        </span>

        <p>${dateTime(order.created_at)}</p>

        ${items.map(item => `
          <div class="cart-line">
            <div class="cart-line-info">
              <strong>${escapeHTML(item.item_name)}</strong>
              <small>
                ${numberBN(item.quantity)} × ${money(item.unit_price)}
                ${item.item_status === "unavailable" ? " · পাওয়া যাচ্ছে না" : ""}
              </small>
            </div>
            <b>${money(item.line_total)}</b>
          </div>
        `).join("")}

        <div class="total-line">
          <b>মোট</b>
          <b>${money(order.total_amount)}</b>
        </div>

        ${
          order.approval_status === "awaiting_customer"
            ? `<button
                 class="gold-btn wide"
                 type="button"
                 data-approval="${order.id}"
               >
                 পরিবর্তিত অর্ডার দেখুন
               </button>`
            : ""
        }

        <button
          class="outline wide"
          type="button"
          data-receipt="${order.id}"
        >
          <i class="fa-solid fa-receipt"></i>
          রসিদ দেখুন
        </button>
      </article>
    `;
  }

  container.innerHTML = output;
}

// ------------------------------------------------------
// ADMIN DASHBOARD
// ------------------------------------------------------

async function renderAdmin() {
  const container = $("dashboardContent");

  container.innerHTML = `<p class="loading">অ্যাডমিন ড্যাশবোর্ড লোড হচ্ছে...</p>`;

  const { data, error } = await db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  const orders = data || [];

  container.innerHTML = `
    <div class="dashboard-panel">
      <h3>অ্যাডমিন কন্ট্রোল</h3>

      <div class="order-actions">
        <button id="openOfflineSale" class="gold-btn" type="button">
          <i class="fa-solid fa-cash-register"></i>
          নতুন অফলাইন বিক্রি
        </button>

        <button id="openSalesReport" class="outline" type="button">
          <i class="fa-solid fa-chart-column"></i>
          বিক্রির রিপোর্ট
        </button>
      </div>
    </div>

    <div class="dashboard-panel">
      <h3>অর্ডার ব্যবস্থাপনা</h3>
      <p>মোট প্রদর্শিত অর্ডার: ${numberBN(orders.length)}</p>
    </div>

    <div id="adminOrders">
      ${orders.length ? "" : `<p class="empty-state">এখনো কোনো অর্ডার নেই।</p>`}
    </div>
  `;

  $("openOfflineSale").onclick = openOfflineSale;
  $("openSalesReport").onclick = openSalesReport;

  let output = "";

  for (const order of orders) {
    const items = await fetchItems(order.id);

    output += `
      <article class="order-card">
        <h3>
          অর্ডার #${escapeHTML(order.id.slice(0, 8))}
          · ${escapeHTML(order.customer_name || "কাস্টমার")}
        </h3>

        <span class="status ${escapeHTML(order.status)}">
          ${statusLabel(order.status)}
        </span>

        <p>
          ইমেইল: ${escapeHTML(order.customer_email || "—")}<br>
          ফোন: ${escapeHTML(order.customer_phone || "—")}<br>
          ঠিকানা: ${escapeHTML(order.customer_address || "—")}<br>
          সময়: ${dateTime(order.created_at)}
        </p>

        <div>
          ${items.map(item => `
            <div class="cart-line">
              <div class="cart-line-info">
                <strong>${escapeHTML(item.item_name)}</strong>
                <small>
                  ${numberBN(item.quantity)} × ${money(item.unit_price)}
                  ${item.item_status === "unavailable" ? " · পাওয়া যাচ্ছে না" : ""}
                </small>
              </div>

              <div>
                <b>${money(item.line_total)}</b>

                ${
                  order.status === "pending" &&
                  item.item_status === "active"
                    ? `<button
                         class="outline"
                         type="button"
                         data-unavailable="${item.id}"
                       >স্টক নেই</button>`
                    : ""
                }
              </div>
            </div>
          `).join("")}
        </div>

        <div class="total-line">
          <b>মোট</b>
          <b>${money(order.total_amount)}</b>
        </div>

        ${
          order.approval_status === "awaiting_customer"
            ? `<p class="status waiting">কাস্টমারের অনুমতির অপেক্ষায়</p>`
            : ""
        }

        <div class="order-actions">
          ${
            order.status === "pending"
              ? `
                <button class="gold-btn" data-order-status="${order.id}" data-status="confirmed">
                  কনফার্ম
                </button>
                <button class="danger-btn" data-order-status="${order.id}" data-status="cancelled">
                  বাতিল
                </button>
              `
              : ""
          }

          ${
            order.status === "confirmed"
              ? `<button class="gold-btn" data-order-status="${order.id}" data-status="preparing">
                   প্রস্তুত হচ্ছে
                 </button>`
              : ""
          }

          ${
            order.status === "preparing"
              ? `<button class="gold-btn" data-order-status="${order.id}" data-status="completed">
                   সম্পন্ন / ডেলিভারি
                 </button>`
              : ""
          }

          <button class="outline" data-receipt="${order.id}">
            রসিদ
          </button>
        </div>
      </article>
    `;
  }

  $("adminOrders").innerHTML = output;
}

// ------------------------------------------------------
// DASHBOARD BUTTON EVENTS
// ------------------------------------------------------

$("dashboardContent").addEventListener("click", async event => {
  const statusButton = event.target.closest("[data-order-status]");
  const unavailableButton = event.target.closest("[data-unavailable]");
  const receiptButton = event.target.closest("[data-receipt]");
  const approvalButton = event.target.closest("[data-approval]");

  try {
    if (statusButton) {
      await adminStatus(
        statusButton.dataset.orderStatus,
        statusButton.dataset.status
      );
    }

    if (unavailableButton) {
      await markUnavailable(unavailableButton.dataset.unavailable);
    }

    if (receiptButton) {
      await showReceipt(receiptButton.dataset.receipt);
    }

    if (approvalButton) {
      await openApproval(approvalButton.dataset.approval);
    }

  } catch (error) {
    showError(error);
  }
});

// ------------------------------------------------------
// ADMIN ORDER STATUS
// Server-side function checks admin role and transitions.
// ------------------------------------------------------

async function adminStatus(orderId, status) {
  if (!ensureAdmin()) return;

  const allowed = ["confirmed", "preparing", "completed", "cancelled"];

  if (!allowed.includes(status)) {
    throw new Error("অবৈধ অর্ডার স্ট্যাটাস।");
  }

  const { error } = await db.rpc("admin_update_order_status", {
    p_order_id: orderId,
    p_status: status
  });

  if (error) throw error;

  toast("অর্ডারের অবস্থা আপডেট হয়েছে।");
  await renderDashboard();
}

// ------------------------------------------------------
// ADMIN MARK ITEM UNAVAILABLE
// ------------------------------------------------------

async function markUnavailable(itemId) {
  if (!ensureAdmin()) return;

  const { error } = await db.rpc("admin_mark_item_unavailable", {
    p_item_id: itemId
  });

  if (error) throw error;

  toast("কাস্টমারের অনুমতির জন্য পরিবর্তন পাঠানো হয়েছে।");
  await renderDashboard();
}

// ------------------------------------------------------
// CUSTOMER APPROVAL OF CHANGED ORDER
// ------------------------------------------------------

async function openApproval(orderId) {
  if (!user || profile?.role !== "customer") {
    throw new Error("কাস্টমার লগইন প্রয়োজন।");
  }

  const { data: order, error } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) throw error;

  if (
    order.customer_id !== user.id ||
    order.approval_status !== "awaiting_customer"
  ) {
    throw new Error("এই অর্ডারের অনুমতি দেওয়ার সুযোগ নেই।");
  }

  const items = await fetchItems(orderId);
  currentApproval = orderId;

  $("approvalMessage").textContent =
    "কিছু খাবার পাওয়া যাচ্ছে না। নিচে সংশোধিত অর্ডার দেখে সিদ্ধান্ত নিন।";

  $("approvalItems").innerHTML = items.map(item => `
    <div class="approval-line ${item.item_status === "unavailable" ? "unavailable" : ""}">
      <span>
        ${escapeHTML(item.item_name)} × ${numberBN(item.quantity)}
        ${item.item_status === "unavailable" ? " · পাওয়া যাচ্ছে না" : ""}
      </span>
      <b>${money(item.line_total)}</b>
    </div>
  `).join("");

  $("approvalTotal").textContent = money(order.total_amount);

  show("approvalModal");
}

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

    toast("বাকি আইটেমগুলো গ্রহণ করেছেন।");
    await renderDashboard();

  } catch (error) {
    showError(error);
  }
};

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

    toast("সম্পূর্ণ অর্ডার বাতিল হয়েছে।");
    await renderDashboard();

  } catch (error) {
    showError(error);
  }
};

// ------------------------------------------------------
// RECEIPTS
// ------------------------------------------------------

async function showReceipt(orderId) {
  const { data: order, error } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) throw error;

  const items = await fetchItems(orderId);

  currentReceipt = {
    type: "online",
    order,
    items
  };

  $("receiptContent").innerHTML = `
    <div class="receipt-header">
      <h2>PADMA CAFE</h2>
      <p>অনলাইন অর্ডার রসিদ</p>
    </div>

    <div class="receipt-meta">
      রসিদ: ${escapeHTML(order.id.slice(0, 8))}<br>
      তারিখ: ${dateTime(order.created_at)}<br>
      নাম: ${escapeHTML(order.customer_name || "—")}<br>
      ফোন: ${escapeHTML(order.customer_phone || "—")}<br>
      ঠিকানা: ${escapeHTML(order.customer_address || "—")}<br>
      অবস্থা: ${statusLabel(order.status)}
    </div>

    <table class="receipt-table">
      <thead>
        <tr>
          <th>আইটেম</th>
          <th>পরিমাণ</th>
          <th>দাম</th>
          <th>মোট</th>
        </tr>
      </thead>

      <tbody>
        ${items.map(item => `
          <tr>
            <td>
              ${escapeHTML(item.item_name)}
              ${item.item_status === "unavailable" ? " (পাওয়া যায়নি)" : ""}
            </td>
            <td>${numberBN(item.quantity)}</td>
            <td>${money(item.unit_price)}</td>
            <td>${money(item.line_total)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    <div class="receipt-total">
      সর্বমোট: ${money(order.total_amount)}
    </div>

    <div class="receipt-footer">
      ধন্যবাদ, আবার আসবেন।<br>
      PADMA CAFE
    </div>
  `;

  show("receiptModal");
}

$("printReceipt").onclick = () => {
  if (!currentReceipt) return;

  const content = $("receiptContent").innerHTML;
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
      <title>Padma Cafe Receipt</title>
      <style>
        body{font-family:Arial,sans-serif;color:#111;padding:20px}
        h2{text-align:center}
        table{width:100%;border-collapse:collapse;margin:15px 0}
        th,td{padding:8px;border-bottom:1px solid #ddd;text-align:left}
        .receipt-total{text-align:right;font-size:20px;font-weight:bold;margin-top:15px}
        .receipt-footer{text-align:center;margin-top:25px}
      </style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = () => window.print();
      <\/script>
    </body>
    </html>
  `);

  popup.document.close();
};

// ------------------------------------------------------
// OFFLINE SALE
// No customer name, phone or address required.
// ------------------------------------------------------

function openOfflineSale() {
  if (!ensureAdmin()) return;

  offlineCart = {};

  const categories = CATEGORIES.filter(category => category !== "সব খাবার");

  $("offlineSaleContent").innerHTML = `
    <p class="field-hint">কাস্টমারের কোনো তথ্য লাগবে না। শুধু খাবার ও পরিমাণ দিন।</p>

    <label>
      ক্যাটাগরি
      <select id="offlineCategory">
        ${categories.map(category => `
          <option value="${escapeHTML(category)}">${escapeHTML(category)}</option>
        `).join("")}
      </select>
    </label>

    <div id="offlineMenuList"></div>

    <div class="dashboard-panel">
      <h3>বিক্রির তালিকা</h3>
      <div id="offlineCartLines"></div>

      <div class="total-line">
        <b>সর্বমোট</b>
        <b id="offlineTotal">৳০</b>
      </div>
    </div>

    <button id="saveOfflineSale" class="gold-btn wide" type="button">
      বিক্রি সংরক্ষণ ও রসিদ তৈরি
    </button>
  `;

  $("offlineCategory").onchange = renderOfflineMenu;
  $("offlineSaleContent").onclick = handleOfflineClick;
  $("offlineSaleContent").onchange = handleOfflineChange;
  $("saveOfflineSale").onclick = saveOfflineSale;

  renderOfflineMenu();
  show("offlineSaleModal");
}

function renderOfflineMenu() {
  const category = $("offlineCategory").value;

  const items = MENU.filter(item => item.category === category);

  $("offlineMenuList").innerHTML = items.map(item => `
    <div class="offline-line">
      <div>
        <strong>${escapeHTML(item.name)}</strong>
        <small>${money(item.price)}</small>
      </div>

      <div class="quantity-controls">
        <button type="button" data-offline-change="${item.id}" data-diff="-1">−</button>
        <span>${numberBN(offlineCart[item.id] || 0)}</span>
        <button type="button" data-offline-change="${item.id}" data-diff="1">+</button>
      </div>
    </div>
  `).join("");

  renderOfflineCart();
}

function handleOfflineClick(event) {
  const button = event.target.closest("[data-offline-change]");
  if (!button) return;

  const id = button.dataset.offlineChange;
  const difference = Number(button.dataset.diff);

  offlineCart[id] = Math.max(0, (offlineCart[id] || 0) + difference);

  if (!offlineCart[id]) delete offlineCart[id];

  renderOfflineMenu();
}

function handleOfflineChange() {
  renderOfflineCart();
}

function offlineRows() {
  return Object.entries(offlineCart)
    .map(([id, qty]) => {
      const item = MENU.find(product => product.id === id);
      if (!item || qty < 1) return null;

      return {
        ...item,
        qty,
        subtotal: item.price * qty
      };
    })
    .filter(Boolean);
}

function renderOfflineCart() {
  const rows = offlineRows();

  $("offlineCartLines").innerHTML = rows.length
    ? rows.map(item => `
        <div class="offline-line">
          <span>${escapeHTML(item.name)} × ${numberBN(item.qty)}</span>
          <b>${money(item.subtotal)}</b>
        </div>
      `).join("")
    : `<p class="empty-state">এখনো কোনো আইটেম যোগ করা হয়নি।</p>`;

  $("offlineTotal").textContent = money(
    rows.reduce((sum, item) => sum + item.subtotal, 0)
  );
}

async function saveOfflineSale() {
  if (!ensureAdmin()) return;

  const rows = offlineRows();

  if (!rows.length) {
    toast("অন্তত একটি খাবার নির্বাচন করুন।");
    return;
  }

  const button = $("saveOfflineSale");
  setLoading(button, true, "বিক্রি সংরক্ষণ হচ্ছে...");

  try {
    const items = rows.map(item => ({
      id: item.id,
      quantity: item.qty
    }));

    const { data, error } = await db.rpc(
      "create_offline_sale",
      { p_items: items }
    );

    if (error) throw error;

    const saleId = typeof data === "string"
      ? data
      : data?.id || data?.sale_id;

    if (!saleId) {
      throw new Error("বিক্রির রসিদ নম্বর পাওয়া যায়নি।");
    }

    const { data: sale, error: saleError } = await db
      .from("offline_sales")
      .select("*")
      .eq("id", saleId)
      .single();

    if (saleError) throw saleError;

    const { data: saleItems, error: itemsError } = await db
      .from("offline_sale_items")
      .select("*")
      .eq("offline_sale_id", saleId)
      .order("created_at");

    if (itemsError) throw itemsError;

    currentReceipt = {
      type: "offline",
      sale,
      items: saleItems || []
    };

    $("receiptContent").innerHTML = `
      <div class="receipt-header">
        <h2>PADMA CAFE</h2>
        <p>অফলাইন বিক্রির রসিদ</p>
      </div>

      <div class="receipt-meta">
        রসিদ নম্বর: ${escapeHTML(sale.receipt_no || sale.id.slice(0, 8))}<br>
        তারিখ: ${dateTime(sale.created_at)}<br>
        বিক্রির ধরন: অফলাইন
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th>আইটেম</th>
            <th>পরিমাণ</th>
            <th>দাম</th>
            <th>মোট</th>
          </tr>
        </thead>

        <tbody>
          ${(saleItems || []).map(item => `
            <tr>
              <td>${escapeHTML(item.item_name)}</td>
              <td>${numberBN(item.quantity)}</td>
              <td>${money(item.unit_price)}</td>
              <td>${money(item.line_total)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div class="receipt-total">
        সর্বমোট: ${money(sale.total_amount)}
      </div>

      <div class="receipt-footer">
        ধন্যবাদ, আবার আসবেন।<br>
        PADMA CAFE
      </div>
    `;

    offlineCart = {};
    hide("offlineSaleModal");
    show("receiptModal");

    toast("অফলাইন বিক্রি সংরক্ষণ হয়েছে।");

  } catch (error) {
    showError(error);
  } finally {
    setLoading(button, false);
  }
}

// ------------------------------------------------------
// SALES REPORT
// Online completed sales + offline sales.
// ------------------------------------------------------

async function getOnlineSales(start, end) {
  const { data, error } = await db
    .from("orders")
    .select("id,total_amount,status,completed_at,created_at")
    .eq("status", "completed")
    .gte("completed_at", start)
    .lt("completed_at", end);

  if (error) throw error;

  return data || [];
}

async function getOfflineSales(start, end) {
  const { data, error } = await db
    .from("offline_sales")
    .select("id,receipt_no,total_amount,created_at")
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

function sumSales(rows) {
  return rows.reduce(
    (sum, row) => sum + Number(row.total_amount || 0),
    0
  );
}

async function openSalesReport() {
  if (!ensureAdmin()) return;

  $("salesReportContent").innerHTML = `
    <div class="report-filters">
      <label>
        রিপোর্টের তারিখ
        <input id="salesDate" type="date" value="${reportDate}">
      </label>

      <button id="loadSalesReport" class="gold-btn" type="button">
        রিপোর্ট দেখুন
      </button>
    </div>

    <div id="salesReport"></div>
  `;

  $("loadSalesReport").onclick = async () => {
    reportDate = $("salesDate").value;
    await renderSalesReport();
  };

  $("salesDate").onchange = event => {
    reportDate = event.target.value;
  };

  show("salesReportModal");
  await renderSalesReport();
}

async function renderSalesReport() {
  if (!ensureAdmin()) return;

  const report = $("salesReport");
  if (!report) return;

  report.innerHTML = `<p class="loading">রিপোর্ট লোড হচ্ছে...</p>`;

  try {
    const day = dhakaDayRange(reportDate);
    const month = dhakaMonthRange(reportDate);

    const allStart = "2000-01-01T00:00:00.000Z";
    const allEnd = "2100-01-01T00:00:00.000Z";

    const [
      dailyOnline,
      dailyOffline,
      monthlyOnline,
      monthlyOffline,
      allOnline,
      allOffline,
      allOrders
    ] = await Promise.all([
      getOnlineSales(day.start, day.end),
      getOfflineSales(day.start, day.end),
      getOnlineSales(month.start, month.end),
      getOfflineSales(month.start, month.end),
      getOnlineSales(allStart, allEnd),
      getOfflineSales(allStart, allEnd),
      db.from("orders").select("id,status")
    ]);

    if (allOrders.error) throw allOrders.error;

    const onlineToday = sumSales(dailyOnline);
    const offlineToday = sumSales(dailyOffline);

    const monthlyTotal =
      sumSales(monthlyOnline) + sumSales(monthlyOffline);

    const allTimeTotal =
      sumSales(allOnline) + sumSales(allOffline);

    const orders = allOrders.data || [];

    const completedCount =
      orders.filter(order => order.status === "completed").length;

    const cancelledCount =
      orders.filter(order => order.status === "cancelled").length;

    const totalReceipts =
      allOnline.length + allOffline.length;

    report.innerHTML = `
      <div class="dashboard-grid">
        <div class="stat-card">
          <span>নির্বাচিত দিনের মোট বিক্রি</span>
          <strong>${money(onlineToday + offlineToday)}</strong>
        </div>

        <div class="stat-card">
          <span>অনলাইন বিক্রি</span>
          <strong>${money(onlineToday)}</strong>
        </div>

        <div class="stat-card">
          <span>অফলাইন বিক্রি</span>
          <strong>${money(offlineToday)}</strong>
        </div>

        <div class="stat-card">
          <span>এই মাসের মোট বিক্রি</span>
          <strong>${money(monthlyTotal)}</strong>
        </div>

        <div class="stat-card">
          <span>সর্বমোট বিক্রি</span>
          <strong>${money(allTimeTotal)}</strong>
        </div>

        <div class="stat-card">
          <span>মোট রসিদ</span>
          <strong>${numberBN(totalReceipts)}</strong>
        </div>

        <div class="stat-card">
          <span>সম্পন্ন অনলাইন অর্ডার</span>
          <strong>${numberBN(completedCount)}</strong>
        </div>

        <div class="stat-card">
          <span>বাতিল অনলাইন অর্ডার</span>
          <strong>${numberBN(cancelledCount)}</strong>
        </div>
      </div>

      <div class="dashboard-panel">
        <h3>নির্বাচিত দিনের অনলাইন বিক্রি</h3>

        ${
          dailyOnline.length
            ? dailyOnline.map(row => `
                <div class="cart-line">
                  <span>অর্ডার #${escapeHTML(row.id.slice(0, 8))}</span>
                  <b>${money(row.total_amount)}</b>
                </div>
              `).join("")
            : `<p>এই দিনে কোনো সম্পন্ন অনলাইন বিক্রি নেই।</p>`
        }
      </div>

      <div class="dashboard-panel">
        <h3>নির্বাচিত দিনের অফলাইন বিক্রি</h3>

        ${
          dailyOffline.length
            ? dailyOffline.map(row => `
                <div class="cart-line">
                  <span>রসিদ #${escapeHTML(row.receipt_no || row.id.slice(0, 8))}</span>
                  <b>${money(row.total_amount)}</b>
                </div>
              `).join("")
            : `<p>এই দিনে কোনো অফলাইন বিক্রি নেই।</p>`
        }
      </div>

      <p class="field-hint">
        ব্যবসার সময় অঞ্চল: Asia/Dhaka। অনলাইন বিক্রির হিসাবে শুধু সম্পন্ন অর্ডার ধরা হয়েছে।
      </p>
    `;

  } catch (error) {
    report.innerHTML = `
      <p class="empty-state">
        রিপোর্ট লোড করা যায়নি: ${escapeHTML(error.message)}
      </p>
    `;
  }
}

// ------------------------------------------------------
// PRINT SALES REPORT
// ------------------------------------------------------

$("printSalesReport").onclick = () => {
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
        h1,h2,h3{color:#8b6824}
        .dashboard-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .stat-card,.dashboard-panel{border:1px solid #bbb;padding:12px;margin:8px 0}
        .stat-card strong{display:block;font-size:20px;margin-top:8px}
        .cart-line{display:flex;justify-content:space-between;padding:8px;border-bottom:1px solid #ddd}
      </style>
    </head>
    <body>
      <h1>PADMA CAFE</h1>
      <h2>বিক্রির রিপোর্ট</h2>
      <p>তারিখ: ${escapeHTML(reportDate)}</p>
      ${report.innerHTML}
      <script>window.onload=()=>window.print();<\/script>
    </body>
    </html>
  `);

  popup.document.close();
};

// ------------------------------------------------------
// REALTIME NOTIFICATIONS
// ------------------------------------------------------

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
        const oldOrder = payload.old || {};

        const relevant =
          profile?.role === "admin" ||
          order.customer_id === user.id ||
          oldOrder.customer_id === user.id;

        if (!relevant) return;

        if (
          profile?.role === "admin" &&
          payload.eventType === "INSERT"
        ) {
          playAlert();
          toast("নতুন অনলাইন অর্ডার এসেছে!");
        }

        if (
          profile?.role === "customer" &&
          order.approval_status === "awaiting_customer"
        ) {
          toast("আপনার অর্ডারে পরিবর্তন হয়েছে। ড্যাশবোর্ড দেখুন।");
        }

        if ($("dashboardModal").classList.contains("show")) {
          try {
            await renderDashboard();
          } catch (error) {
            console.error(error);
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
      async () => {
        if ($("dashboardModal").classList.contains("show")) {
          try {
            await renderDashboard();
          } catch (error) {
            console.error(error);
          }
        }
      }
    )

    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "offline_sales"
      },
      () => {
        if (profile?.role === "admin") {
          toast("নতুন অফলাইন বিক্রি সংরক্ষণ হয়েছে।");
        }
      }
    )

    .subscribe();
}

// ------------------------------------------------------
// ADMIN SOUND ALERT
// Browser may require prior user interaction for sound.
// ------------------------------------------------------

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

// ------------------------------------------------------
// LOGOUT
// ------------------------------------------------------

$("logoutBtn").onclick = async () => {
  try {
    const { error } = await db.auth.signOut();
    if (error) throw error;

    user = null;
    profile = null;
    currentApproval = null;
    currentReceipt = null;

    if (liveChannel) {
      await db.removeChannel(liveChannel);
      liveChannel = null;
    }

    hide("dashboardModal");
    hide("approvalModal");

    $("accountBtn").textContent = "আমার অ্যাকাউন্ট";
    $("accountBtn").classList.add("hidden");

    toast("লগআউট সম্পন্ন হয়েছে।");

  } catch (error) {
    showError(error);
  }
};

// ------------------------------------------------------
// AUTH STATE LISTENER
// ------------------------------------------------------

db.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    show("resetPasswordModal");
    return;
  }

  if (event === "SIGNED_OUT") {
    user = null;
    profile = null;
    return;
  }

  if (session?.user && !user) {
    user = session.user;

    // Defer profile query to avoid auth callback lock issues.
    setTimeout(async () => {
      try {
        await loadProfile();
      } catch (error) {
        console.error("Profile loading:", error);
      }
    }, 0);
  }
});

// ------------------------------------------------------
// INITIALIZE WEBSITE
// ------------------------------------------------------

(async function initializeWebsite() {
  $("footerYear").textContent = new Date().getFullYear();

  renderCategories();
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

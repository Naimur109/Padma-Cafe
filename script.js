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
  parts.forEach(part => {
    values[part.type] = part.value;
  });

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
let currentReceipt = null;
let audioCtx = null;
let reportDate = dhakaDate(new Date());
let reportType = "daily";
let offlineCart = {};
let orderTimerInterval = null;

// ------------------------------------------------------
// MODAL CLOSE EVENTS
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

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;

  document.querySelectorAll(".modal.show").forEach(modal => {
    modal.classList.remove("show");
  });

  document.body.classList.remove("modal-open");
});

// ------------------------------------------------------
// MENU DISPLAY & SEARCH
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

function menuCardHTML(item) {
  return `
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
  `;
}

function renderMenu() {
  const container = $("menuGrid");
  if (!container) return;

  const query = ($("menuSearch")?.value || "").trim().toLowerCase();

  const items = MENU.filter(item => {
    const matchesCategory =
      selectedCategory === "সব খাবার" || item.category === selectedCategory;

    if (!matchesCategory) return false;
    if (!query) return true;

    return (
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });

  container.innerHTML = items.length
    ? items.map(menuCardHTML).join("")
    : `<p class="empty-state">কোনো খাবার পাওয়া যায়নি।</p>`;
}

$("menuCategories")?.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  selectedCategory = button.dataset.category;
  renderCategories();
  renderMenu();
});

$("menuSearch")?.addEventListener("input", renderMenu);

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
  return cartRows().reduce((sum, item) => sum + item.subtotal, 0);
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
            <button type="button" data-cart-change="${escapeHTML(item.id)}" data-diff="-1">−</button>
            <span>${numberBN(item.qty)}</span>
            <button type="button" data-cart-change="${escapeHTML(item.id)}" data-diff="1">+</button>
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

$("continueShoppingBtn")?.addEventListener("click", () => {
  hide("cartModal");
  $("menuSection")?.scrollIntoView({ behavior: "smooth" });
});

// ------------------------------------------------------
// PASSWORD SHOW / HIDE
// ------------------------------------------------------

document.querySelectorAll("[data-toggle-password]").forEach(button => {
  button.addEventListener("click", () => {
    const input = $(button.dataset.togglePassword);
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";

    button.innerHTML = isPassword
      ? '<i class="fa-solid fa-eye-slash"></i>'
      : '<i class="fa-solid fa-eye"></i>';

    button.setAttribute(
      "aria-label",
      isPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"
    );
  });
});

// ------------------------------------------------------
// INTERNATIONAL PHONE INPUT
// ------------------------------------------------------

function initializePhoneInput() {
  const input = $("authPhone");
  if (!input || !window.intlTelInput || phoneInput) return;

  phoneInput = window.intlTelInput(input, {
    initialCountry: "bd",
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

$("heroLoginBtn")?.addEventListener("click", () => {
  authRole = "customer";
  openAuth("login");
});

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

      if (!phoneInput) {
        throw new Error("মোবাইল নম্বরের কান্ট্রি কোড নির্বাচন করুন।");
      }

      if (phoneInput.promise) {
        await phoneInput.promise;
      }

      if (!phoneInput.isValidNumber()) {
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
// FORGOT & RESET PASSWORD
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

    const { error } = await db.rpc(
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
// STATUS & TIMERS
// ------------------------------------------------------

function statusLabel(status) {
  return ({
    pending: "অপেক্ষমাণ",
    confirmed: "অর্ডার কনফার্ম — খাবার তৈরি হচ্ছে",
    preparing: "খাবার তৈরি হচ্ছে",
    out_for_delivery: "ডেলিভারির পথে",
    completed: "ডেলিভারি সম্পন্ন",
    cancelled: "বাতিল",
    awaiting_customer: "আপনার অনুমতির অপেক্ষায়",
    not_required: "অনুমতি প্রয়োজন নেই",
    accepted: "গ্রহণ করা হয়েছে",
    rejected: "বাতিল করা হয়েছে"
  })[status] || status || "—";
}

function countdownText(endAt) {
  if (!endAt) return "সময় নির্ধারণ করা হয়নি";

  const remaining = Math.max(
    0,
    Math.ceil((new Date(endAt).getTime() - Date.now()) / 1000)
  );

  if (remaining <= 0) return "সময় শেষ";

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function timerMarkup(label, endAt, id) {
  if (!endAt) return "";

  return `
    <div class="preparation-timer">
      <span>${escapeHTML(label)}</span>
      <strong
        data-countdown="${escapeHTML(id)}"
        data-end="${escapeHTML(endAt)}"
      >${countdownText(endAt)}</strong>
    </div>
  `;
}

function deliveryTrackingMarkup(order, prefix = "customer") {
  if (order.status !== "out_for_delivery") return "";

  const endAt = order.delivery_ends_at || "";
  const timerId = `${prefix}-${order.id}`;

  return `
    <section
      class="delivery-tracking"
      data-delivery-panel="${escapeHTML(order.id)}"
    >
      <div class="delivery-heading">
        <h3>
          <i class="fa-solid fa-motorcycle"></i>
          খাবার আপনার পথে!
        </h3>
        <span class="delivery-subtitle">Padma Cafe Delivery</span>
      </div>

      <div class="delivery-road">
        <div class="delivery-start">
          <i class="fa-solid fa-store"></i>
          ক্যাফে
        </div>

        <div class="delivery-end">
          <i class="fa-solid fa-house"></i>
          আপনার ঠিকানা
        </div>

        <div class="delivery-bike" aria-label="ডেলিভারি বাইক">
          <i class="fa-solid fa-motorcycle"></i>
        </div>
      </div>

      <div class="delivery-time">
        <span>আনুমানিক ডেলিভারি সময়</span>

        <strong
          data-countdown="${escapeHTML(timerId)}"
          data-end="${escapeHTML(endAt)}"
        >${countdownText(endAt)}</strong>

        <span class="delivery-note">
          GPS ব্যবহার করা হচ্ছে না; এটি অ্যানিমেশনভিত্তিক ট্র্যাকিং।
        </span>
      </div>
    </section>
  `;
}

function startOrderTimerTicker() {
  if (orderTimerInterval) {
    clearInterval(orderTimerInterval);
  }

  const tick = () => {
    document.querySelectorAll("[data-countdown]").forEach(element => {
      const value = countdownText(element.dataset.end);
      element.textContent = value;

      if (value === "সময় শেষ") {
        element.classList.add("delivery-finished");

        const panel = element.closest(".delivery-tracking");
        const note = panel?.querySelector(".delivery-note");

        if (note) {
          note.textContent =
            "আনুমানিক সময় শেষ — ডেলিভারি সম্পন্ন হলে অ্যাডমিন নিশ্চিত করবেন।";
        }
      }
    });
  };

  tick();
  orderTimerInterval = setInterval(tick, 1000);
}

function readMinutesInput(id, fallback = 15) {
  const value = Number($(id)?.value ?? fallback);

  if (!Number.isInteger(value) || value < 1 || value > 180) {
    throw new Error("সময় ১ থেকে ১৮০ মিনিটের মধ্যে দিন।");
  }

  return value;
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
    .neq("sale_type", "offline")
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
          ["confirmed", "preparing"].includes(order.status)
            ? timerMarkup(
                "খাবার তৈরির বাকি সময়",
                order.preparation_ends_at,
                `prep-customer-${order.id}`
              )
            : ""
        }

        ${deliveryTrackingMarkup(order, "customer")}

        ${
          order.approval_status === "awaiting_customer"
            ? `<button
                 class="gold-btn wide"
                 type="button"
                 data-approval="${escapeHTML(order.id)}"
               >
                 পরিবর্তিত অর্ডার দেখুন
               </button>`
            : ""
        }

        <button
          class="outline wide"
          type="button"
          data-receipt="${escapeHTML(order.id)}"
        >
          <i class="fa-solid fa-receipt"></i>
          রসিদ দেখুন
        </button>
      </article>
    `;
  }

  container.innerHTML = output;
  startOrderTimerTicker();
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
    .neq("sale_type", "offline")
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
      <h3>অনলাইন অর্ডার ব্যবস্থাপনা</h3>
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
                         data-unavailable="${escapeHTML(item.id)}"
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

        ${
          ["confirmed", "preparing"].includes(order.status)
            ? timerMarkup(
                "খাবার তৈরির বাকি সময়",
                order.preparation_ends_at,
                `prep-admin-${order.id}`
              )
            : ""
        }

        ${deliveryTrackingMarkup(order, "admin")}

        <div class="order-actions">
          ${
            order.status === "pending"
              ? `
                <div class="preparation-timer">
                  <label for="prep-min-${escapeHTML(order.id)}">খাবার তৈরির সময় (মিনিট)</label>
                  <div class="timer-controls">
                    <button type="button"
                      data-minute-adjust="prep-min-${escapeHTML(order.id)}"
                      data-diff="-1">−</button>

                    <input id="prep-min-${escapeHTML(order.id)}"
                      type="number" min="1" max="180" value="15">

                    <button type="button"
                      data-minute-adjust="prep-min-${escapeHTML(order.id)}"
                      data-diff="1">+</button>
                  </div>
                </div>

                <button class="gold-btn"
                  data-order-status="${escapeHTML(order.id)}"
                  data-status="confirmed">
                  <i class="fa-solid fa-check"></i>
                  অর্ডার কনফার্ম ও কাউন্টডাউন শুরু
                </button>

                <button class="danger-btn"
                  data-order-status="${escapeHTML(order.id)}"
                  data-status="cancelled">
                  বাতিল
                </button>
              `
              : ""
          }

          ${
            ["confirmed", "preparing"].includes(order.status)
              ? `
                <div class="preparation-timer">
                  <label for="delivery-min-${escapeHTML(order.id)}">
                    ডেলিভারির আনুমানিক সময় (মিনিট)
                  </label>

                  <div class="timer-controls">
                    <button type="button"
                      data-minute-adjust="delivery-min-${escapeHTML(order.id)}"
                      data-diff="-1">−</button>

                    <input id="delivery-min-${escapeHTML(order.id)}"
                      type="number" min="1" max="180" value="15">

                    <button type="button"
                      data-minute-adjust="delivery-min-${escapeHTML(order.id)}"
                      data-diff="1">+</button>
                  </div>
                </div>

                <button class="gold-btn delivery-btn"
                  data-order-status="${escapeHTML(order.id)}"
                  data-status="out_for_delivery">
                  <i class="fa-solid fa-motorcycle"></i>
                  খাবার তৈরি হয়েছে — ডেলিভারি শুরু
                </button>
              `
              : ""
          }

          ${
            order.status === "out_for_delivery"
              ? `<button class="gold-btn complete-delivery-btn"
                   data-order-status="${escapeHTML(order.id)}"
                   data-status="completed">
                   <i class="fa-solid fa-check-double"></i>
                   ডেলিভারি সম্পন্ন
                 </button>`
              : ""
          }

          <button class="outline" data-receipt="${escapeHTML(order.id)}">
            রসিদ
          </button>
        </div>
      </article>
    `;
  }

  $("adminOrders").innerHTML = output;
  startOrderTimerTicker();
}

// ------------------------------------------------------
// DASHBOARD BUTTON EVENTS
// ------------------------------------------------------

$("dashboardContent").addEventListener("click", async event => {
  const statusButton = event.target.closest("[data-order-status]");
  const unavailableButton = event.target.closest("[data-unavailable]");
  const receiptButton = event.target.closest("[data-receipt]");
  const approvalButton = event.target.closest("[data-approval]");
  const minuteButton = event.target.closest("[data-minute-adjust]");

  try {
    if (minuteButton) {
      const input = $(minuteButton.dataset.minuteAdjust);

      if (input) {
        input.value = Math.min(
          180,
          Math.max(
            1,
            Number(input.value || 15) + Number(minuteButton.dataset.diff)
          )
        );
      }
      return;
    }

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
// ADMIN ORDER STATUS & UNAVAILABLE ITEM
// ------------------------------------------------------

async function adminStatus(orderId, status) {
  if (!ensureAdmin()) return;

  const allowed = [
    "confirmed",
    "preparing",
    "out_for_delivery",
    "completed",
    "cancelled"
  ];

  if (!allowed.includes(status)) {
    throw new Error("অবৈধ অর্ডার স্ট্যাটাস।");
  }

  let preparationMinutes = null;
  let deliveryMinutes = null;

  if (status === "confirmed") {
    preparationMinutes = readMinutesInput(`prep-min-${orderId}`, 15);
  }

  if (status === "out_for_delivery") {
    deliveryMinutes = readMinutesInput(`delivery-min-${orderId}`, 15);

    if (!confirm("খাবার তৈরি হয়েছে এবং ডেলিভারি ম্যান খাবার নিয়ে বের হয়েছেন?")) {
      return;
    }
  }

  if (status === "completed") {
    if (!confirm("এই অর্ডারের ডেলিভারি সম্পন্ন হয়েছে নিশ্চিত করছেন?")) {
      return;
    }
  }

  const { error } = await db.rpc("admin_update_order_status", {
    p_order_id: orderId,
    p_status: status,
    p_preparation_minutes: preparationMinutes,
    p_delivery_minutes: deliveryMinutes
  });

  if (error) throw error;

  toast(
    status === "out_for_delivery"
      ? "ডেলিভারি শুরু হয়েছে। কাস্টমার বাইক অ্যানিমেশন দেখতে পাবেন।"
      : status === "completed"
        ? "ডেলিভারি সম্পন্ন হয়েছে।"
        : "অর্ডারের অবস্থা আপডেট হয়েছে।"
  );

  await renderDashboard();
}

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
// CUSTOMER APPROVAL FOR CHANGED ORDER
// ------------------------------------------------------

async function openApproval(orderId) {
  if (!(await ensureCustomer())) return;

  const { data: order, error } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .single();

  if (error) throw error;

  if (order.approval_status !== "awaiting_customer") {
    toast("এই অর্ডারে এখন অনুমতি প্রয়োজন নেই।");
    return;
  }

  const items = await fetchItems(orderId);

  const availableItems = items.filter(
    item => item.item_status !== "unavailable"
  );

  const unavailableItems = items.filter(
    item => item.item_status === "unavailable"
  );

  const availableTotal = availableItems.reduce(
    (sum, item) => sum + Number(item.line_total || 0),
    0
  );

  $("approvalContent").innerHTML = `
    <div class="approval-box">
      <p>দুঃখিত! নিচের কিছু খাবার বর্তমানে পাওয়া যাচ্ছে না।</p>

      <h4>পাওয়া যাচ্ছে না</h4>
      ${
        unavailableItems.length
          ? unavailableItems.map(item => `
              <div class="approval-line unavailable-item">
                <span>${escapeHTML(item.item_name)}</span>
                <b>স্টক নেই</b>
              </div>
            `).join("")
          : "<p>কোনো খাবার বাদ দেওয়া হয়নি।</p>"
      }

      <h4>যেসব খাবার পাওয়া যাবে</h4>
      ${
        availableItems.length
          ? availableItems.map(item => `
              <div class="approval-line">
                <span>${escapeHTML(item.item_name)} × ${numberBN(item.quantity)}</span>
                <b>${money(item.line_total)}</b>
              </div>
            `).join("")
          : "<p>কোনো খাবার অবশিষ্ট নেই।</p>"
      }

      <div class="total-line">
        <strong>নতুন মোট বিল</strong>
        <strong>${money(availableTotal)}</strong>
      </div>

      <p>আপনি অবশিষ্ট খাবার নিতে পারেন অথবা সম্পূর্ণ অর্ডার বাতিল করতে পারেন।</p>

      <button
        type="button"
        class="gold-btn wide"
        id="acceptChangedOrder"
        ${availableItems.length ? "" : "disabled"}
      >
        অবশিষ্ট খাবার গ্রহণ করুন
      </button>

      <button
        type="button"
        class="danger-btn wide"
        id="rejectChangedOrder"
      >
        সম্পূর্ণ অর্ডার বাতিল করুন
      </button>
    </div>
  `;

  $("acceptChangedOrder").onclick = () => respondToChangedOrder(orderId, true);
  $("rejectChangedOrder").onclick = () => respondToChangedOrder(orderId, false);

  show("approvalModal");
}

async function respondToChangedOrder(orderId, accepted) {
  if (!(await ensureCustomer())) return;

  const button = accepted
    ? $("acceptChangedOrder")
    : $("rejectChangedOrder");

  setLoading(button, true, "অপেক্ষা করুন...");

  try {
    const { error } = await db.rpc(
      "customer_respond_to_order_change",
      {
        p_order_id: orderId,
        p_accept: accepted
      }
    );

    if (error) throw error;

    hide("approvalModal");

    toast(
      accepted
        ? "পরিবর্তিত অর্ডার গ্রহণ করা হয়েছে।"
        : "আপনার সম্পূর্ণ অর্ডার বাতিল করা হয়েছে।"
    );

    await renderDashboard();
  } catch (error) {
    showError(error);
  } finally {
    setLoading(button, false);
  }
}

// ------------------------------------------------------
// RECEIPT & PRINT
// ------------------------------------------------------

async function getOrderForReceipt(orderId) {
  const { data: order, error } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) throw error;

  if (profile.role !== "admin" && order.customer_id !== user.id) {
    throw new Error("এই রসিদ দেখার অনুমতি আপনার নেই।");
  }

  const items = await fetchItems(orderId);
  return { order, items };
}

function receiptHTML(order, items) {
  const isOffline = order.sale_type === "offline";

  const rows = items.map(item => `
    <tr>
      <td>
        ${escapeHTML(item.item_name)}
        ${item.item_status === "unavailable" ? " (স্টক নেই)" : ""}
      </td>
      <td>${numberBN(item.quantity)}</td>
      <td>${money(item.unit_price)}</td>
      <td>${money(item.line_total)}</td>
    </tr>
  `).join("");

  return `
    <div class="receipt-paper">
      <div class="receipt-header">
        <img
          src="https://i.ibb.co/4nW7J6d0/IMG-20261121-WA0000.jpg"
          alt="Padma Cafe"
        >
        <h2>PADMA CAFE</h2>
        <p>স্বাদে ও আতিথেয়তায় আপনাদের পাশে</p>
        <p>${isOffline ? "অফলাইন বিক্রির রসিদ" : "অনলাইন অর্ডার রসিদ"}</p>
      </div>

      <div class="receipt-info">
        <p>রসিদ: ${escapeHTML(order.id.slice(0, 8))}</p>
        <p>তারিখ: ${dateTime(order.created_at)}</p>
        ${
          isOffline
            ? `<p>বিক্রির ধরন: অফলাইন</p>`
            : `
              <p>কাস্টমার: ${escapeHTML(order.customer_name || "কাস্টমার")}</p>
              <p>ফোন: ${escapeHTML(order.customer_phone || "—")}</p>
              <p>ঠিকানা: ${escapeHTML(order.customer_address || "—")}</p>
              <p>অবস্থা: ${statusLabel(order.status)}</p>
            `
        }
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th>খাবার</th>
            <th>পরিমাণ</th>
            <th>দাম</th>
            <th>মোট</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="receipt-total">
        <strong>সর্বমোট</strong>
        <strong>${money(order.total_amount)}</strong>
      </div>

      <div class="receipt-footer">
        <p>আপনাকে ধন্যবাদ! আবার আসবেন।</p>
        <small>Powered by Padma Cafe</small>
      </div>
    </div>
  `;
}

async function showReceipt(orderId) {
  try {
    const { order, items } = await getOrderForReceipt(orderId);
    currentReceipt = { order, items };
    $("receiptContent").innerHTML = receiptHTML(order, items);
    show("receiptModal");
  } catch (error) {
    showError(error);
  }
}

$("printReceiptBtn").onclick = () => {
  if (!currentReceipt) {
    toast("প্রথমে একটি রসিদ খুলুন।");
    return;
  }

  const content = $("receiptContent").innerHTML;
  const printWindow = window.open("", "_blank", "width=450,height=700");

  if (!printWindow) {
    toast("পপ-আপ অনুমতি দিন, তারপর আবার চেষ্টা করুন।");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <title>Padma Cafe Receipt</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 8px;
          color: #111;
          background: #fff;
          font-family: Arial, sans-serif;
        }
        .receipt-paper {
          width: 100%;
          max-width: 320px;
          margin: auto;
          padding: 8px;
          font-size: 12px;
        }
        .receipt-header {
          text-align: center;
          border-bottom: 1px dashed #555;
          padding-bottom: 10px;
        }
        .receipt-header img {
          width: 65px;
          height: 65px;
          object-fit: cover;
          border-radius: 50%;
          display: block;
          margin: 0 auto 8px;
        }
        .receipt-header h2 {
          margin: 5px 0;
          font-size: 20px;
        }
        .receipt-header p,
        .receipt-info p {
          margin: 4px 0;
        }
        .receipt-info {
          padding: 8px 0;
          border-bottom: 1px dashed #555;
          overflow-wrap: anywhere;
        }
        .receipt-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 11px;
        }
        .receipt-table th,
        .receipt-table td {
          padding: 5px 2px;
          text-align: left;
          border-bottom: 1px dotted #aaa;
        }
        .receipt-table th:last-child,
        .receipt-table td:last-child {
          text-align: right;
        }
        .receipt-total {
          display: flex;
          justify-content: space-between;
          border-top: 1px dashed #333;
          margin-top: 10px;
          padding-top: 8px;
          font-size: 15px;
        }
        .receipt-footer {
          text-align: center;
          margin-top: 20px;
          border-top: 1px dashed #555;
          padding-top: 8px;
        }
        @page {
          size: 80mm auto;
          margin: 2mm;
        }
      </style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      <\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
};

// ------------------------------------------------------
// OFFLINE SALE
// ------------------------------------------------------

function openOfflineSale() {
  if (!ensureAdmin()) return;

  offlineCart = {};

  const categoryOptions = CATEGORIES
    .filter(category => category !== "সব খাবার")
    .map(category => `
      <option value="${escapeHTML(category)}">
        ${escapeHTML(category)}
      </option>
    `).join("");

  $("offlineSaleContent").innerHTML = `
    <div class="offline-sale">
      <p class="field-hint">কাস্টমারের কোনো তথ্য লাগবে না। শুধু খাবার ও পরিমাণ দিন।</p>

      <label for="offlineCategory">ক্যাটাগরি</label>
      <select id="offlineCategory">
        <option value="সব খাবার">সব খাবার</option>
        ${categoryOptions}
      </select>

      <div id="offlineMenuList"></div>

      <div class="dashboard-panel">
        <h3>বিক্রির তালিকা</h3>
        <div id="offlineCartList"></div>

        <div class="total-line">
          <strong>মোট</strong>
          <strong id="offlineTotal">${money(0)}</strong>
        </div>
      </div>

      <button class="gold-btn wide" id="saveOfflineSaleBtn" type="button">
        <i class="fa-solid fa-print"></i>
        বিক্রি সংরক্ষণ ও রসিদ তৈরি
      </button>
    </div>
  `;

  renderOfflineMenu();
  renderOfflineCart();

  $("offlineCategory").onchange = renderOfflineMenu;

  $("offlineMenuList").onclick = event => {
    const button = event.target.closest("[data-offline-add]");
    if (!button) return;

    const id = button.dataset.offlineAdd;
    offlineCart[id] = (offlineCart[id] || 0) + 1;
    renderOfflineCart();
  };

  $("offlineCartList").onclick = event => {
    const button = event.target.closest("[data-offline-change]");
    if (!button) return;

    const id = button.dataset.offlineChange;
    const diff = Number(button.dataset.diff);

    offlineCart[id] = Math.max(0, (offlineCart[id] || 0) + diff);
    if (!offlineCart[id]) delete offlineCart[id];

    renderOfflineCart();
  };

  $("saveOfflineSaleBtn").onclick = saveOfflineSale;

  show("offlineSaleModal");
}

function renderOfflineMenu() {
  const container = $("offlineMenuList");
  if (!container) return;

  const category = $("offlineCategory").value;
  const items = category === "সব খাবার"
    ? MENU
    : MENU.filter(item => item.category === category);

  container.innerHTML = items.map(item => `
    <div class="offline-line">
      <div class="cart-line-info">
        <strong>${escapeHTML(item.name)}</strong>
        <small>${money(item.price)}</small>
      </div>

      <button
        class="add-cart-btn"
        type="button"
        data-offline-add="${escapeHTML(item.id)}"
      >
        যোগ করুন
      </button>
    </div>
  `).join("");
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

  $("offlineCartList").innerHTML = rows.length
    ? rows.map(item => `
        <div class="offline-line">
          <div class="cart-line-info">
            <strong>${escapeHTML(item.name)}</strong>
            <small>${money(item.price)} × ${numberBN(item.qty)}</small>
          </div>

          <div class="quantity-controls">
            <button
              type="button"
              data-offline-change="${escapeHTML(item.id)}"
              data-diff="-1"
            >−</button>

            <span>${numberBN(item.qty)}</span>

            <button
              type="button"
              data-offline-change="${escapeHTML(item.id)}"
              data-diff="1"
            >+</button>
          </div>

          <b>${money(item.subtotal)}</b>
        </div>
      `).join("")
    : `<p class="empty-state">এখনো কোনো খাবার যোগ করা হয়নি।</p>`;

  $("offlineTotal").textContent = money(
    rows.reduce((sum, item) => sum + item.subtotal, 0)
  );
}

async function saveOfflineSale() {
  if (!ensureAdmin()) return;

  const rows = offlineRows();
  if (!rows.length) {
    toast("প্রথমে খাবার যোগ করুন।");
    return;
  }

  const button = $("saveOfflineSaleBtn");
  setLoading(button, true, "বিক্রি সংরক্ষণ হচ্ছে...");

  try {
    const payload = rows.map(item => ({
      id: item.id,
      quantity: item.qty
    }));

    const { data, error } = await db.rpc(
      "admin_create_offline_sale",
      { p_items: payload }
    );

    if (error) throw error;

    const saleId = typeof data === "string"
      ? data
      : data?.id || data?.sale_id;

    if (!saleId) {
      throw new Error("বিক্রির রসিদ নম্বর পাওয়া যায়নি।");
    }

    const sale = {
      id: saleId,
      created_at: new Date().toISOString(),
      customer_name: "অফলাইন বিক্রি",
      customer_phone: "",
      customer_address: "",
      status: "completed",
      sale_type: "offline",
      total_amount: rows.reduce((sum, item) => sum + item.subtotal, 0)
    };

    const receiptItems = rows.map(item => ({
      item_name: item.name,
      quantity: item.qty,
      unit_price: item.price,
      line_total: item.subtotal,
      item_status: "active"
    }));

    currentReceipt = { order: sale, items: receiptItems };
    $("receiptContent").innerHTML = receiptHTML(sale, receiptItems);

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
// ------------------------------------------------------

async function openSalesReport() {
  if (!ensureAdmin()) return;

  $("salesReportContent").innerHTML = `
    <div class="report-panel">
      <div class="report-filters">
        <label for="reportDate">
          তারিখ নির্বাচন করুন
          <input
            type="date"
            id="reportDate"
            value="${escapeHTML(reportDate)}"
          >
        </label>
      </div>

      <div class="report-actions">
        <button type="button" id="dailyReportBtn" class="gold-btn">
          দৈনিক রিপোর্ট
        </button>

        <button type="button" id="monthlyReportBtn" class="outline">
          মাসিক রিপোর্ট
        </button>

        <button type="button" id="allTimeReportBtn" class="outline">
          সর্বমোট রিপোর্ট
        </button>
      </div>

      <div id="reportResults">
        <p class="loading">রিপোর্ট লোড হচ্ছে...</p>
      </div>
    </div>
  `;

  $("reportDate").onchange = event => {
    reportDate = event.target.value || dhakaDate(new Date());
  };

  $("dailyReportBtn").onclick = () => loadSalesReport("daily");
  $("monthlyReportBtn").onclick = () => loadSalesReport("monthly");
  $("allTimeReportBtn").onclick = () => loadSalesReport("all");

  show("salesReportModal");
  await loadSalesReport(reportType);
}

async function loadSalesReport(type) {
  if (!ensureAdmin()) return;

  reportType = type;
  const date = $("reportDate")?.value || reportDate;

  if (type !== "all" && !date) {
    toast("একটি তারিখ নির্বাচন করুন।");
    return;
  }

  const result = $("reportResults");
  result.innerHTML = `<p class="loading">রিপোর্ট তৈরি হচ্ছে...</p>`;

  try {
    let query = db
      .from("orders")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (type === "daily") {
      const range = dhakaDayRange(date);
      query = query.gte("created_at", range.start).lt("created_at", range.end);
    } else if (type === "monthly") {
      const range = dhakaMonthRange(date);
      query = query.gte("created_at", range.start).lt("created_at", range.end);
    }

    const { data, error } = await query;
    if (error) throw error;

    const orders = data || [];

    const onlineOrders = orders.filter(order => order.sale_type !== "offline");
    const offlineOrders = orders.filter(order => order.sale_type === "offline");

    const onlineTotal = onlineOrders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0
    );

    const offlineTotal = offlineOrders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0
    );

    const total = onlineTotal + offlineTotal;

    let cancelledQuery = db
      .from("orders")
      .select("id,status,created_at")
      .eq("status", "cancelled");

    if (type === "daily") {
      const range = dhakaDayRange(date);
      cancelledQuery = cancelledQuery
        .gte("created_at", range.start)
        .lt("created_at", range.end);
    } else if (type === "monthly") {
      const range = dhakaMonthRange(date);
      cancelledQuery = cancelledQuery
        .gte("created_at", range.start)
        .lt("created_at", range.end);
    }

    const { data: cancelledData, error: cancelledError } = await cancelledQuery;
    if (cancelledError) throw cancelledError;

    const cancelledCount = (cancelledData || []).length;

    const periodTitle = type === "daily"
      ? `দৈনিক রিপোর্ট (${escapeHTML(date)})`
      : type === "monthly"
        ? `মাসিক রিপোর্ট (${escapeHTML(date.slice(0, 7))})`
        : "সর্বমোট রিপোর্ট";

    result.innerHTML = `
      <div class="dashboard-panel">
        <h3>${periodTitle}</h3>
      </div>

      <div class="report-summary">
        <div class="report-card">
          <span>সর্বমোট বিক্রি</span>
          <strong>${money(total)}</strong>
        </div>

        <div class="report-card">
          <span>অনলাইন বিক্রি</span>
          <strong>${money(onlineTotal)}</strong>
          <small>${numberBN(onlineOrders.length)} টি অর্ডার</small>
        </div>

        <div class="report-card">
          <span>অফলাইন বিক্রি</span>
          <strong>${money(offlineTotal)}</strong>
          <small>${numberBN(offlineOrders.length)} টি বিক্রি</small>
        </div>

        <div class="report-card">
          <span>সম্পন্ন অর্ডার</span>
          <strong>${numberBN(orders.length)}</strong>
        </div>

        <div class="report-card">
          <span>বাতিল অর্ডার</span>
          <strong>${numberBN(cancelledCount)}</strong>
        </div>
      </div>

      <h3>সম্পন্ন বিক্রির তালিকা</h3>

      ${
        orders.length
          ? orders.map(order => `
              <div class="cart-line report-order">
                <div class="cart-line-info">
                  <strong>
                    ${escapeHTML(order.customer_name || (order.sale_type === "offline" ? "অফলাইন বিক্রি" : "কাস্টমার"))}
                  </strong>

                  <small>
                    ${dateTime(order.created_at)}
                    · ${order.sale_type === "offline" ? "অফলাইন" : "অনলাইন"}
                  </small>
                </div>

                <b>${money(order.total_amount)}</b>
              </div>
            `).join("")
          : `<p class="empty-state">এই সময়ে কোনো সম্পন্ন বিক্রি নেই।</p>`
      }
    `;
  } catch (error) {
    result.innerHTML = `
      <p class="empty-state">
        রিপোর্ট তৈরি করা যায়নি: ${escapeHTML(error.message)}
      </p>
    `;
    showError(error);
  }
}

$("printSalesReport").onclick = () => {
  const results = $("reportResults");
  if (!results) return;

  const printWindow = window.open("", "_blank", "width=700,height=800");
  if (!printWindow) {
    toast("পপ-আপ অনুমতি দিন, তারপর আবার চেষ্টা করুন।");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <title>Padma Cafe Sales Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 24px;
          color: #111;
        }
        h1, h2, h3 {
          color: #8b6824;
        }
        .report-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin: 16px 0;
        }
        .report-card {
          border: 1px solid #bbb;
          padding: 12px;
        }
        .report-card strong {
          display: block;
          font-size: 20px;
          margin-top: 6px;
        }
        .cart-line {
          display: flex;
          justify-content: space-between;
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }
      </style>
    </head>
    <body>
      <h1>PADMA CAFE</h1>
      <h2>বিক্রির রিপোর্ট</h2>
      ${results.innerHTML}
      <script>
        window.onload = function() {
          window.print();
        };
      <\/script>
    </body>
    </html>
  `);

  printWindow.document.close();
};

// ------------------------------------------------------
// REALTIME, SOUND ALERT & AUTH
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

      gain.gain.setValueAtTime(0.001, audioCtx.currentTime + time);
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

function subscribeLive() {
  if (!user || !profile) return;

  if (liveChannel) {
    db.removeChannel(liveChannel);
    liveChannel = null;
  }

  liveChannel = db
    .channel(`padma-live-${user.id}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders"
      },
      async payload => {
        const order = payload.new || payload.old || {};

        if (
          profile.role === "customer" &&
          order.customer_id !== user.id
        ) {
          return;
        }

        if (
          profile.role === "admin" &&
          payload.eventType === "INSERT" &&
          order.sale_type !== "offline"
        ) {
          playAlert();
          toast("নতুন অনলাইন অর্ডার এসেছে!");
        }

        if (
          profile.role === "customer" &&
          order.approval_status === "awaiting_customer"
        ) {
          toast("আপনার অর্ডারে পরিবর্তন হয়েছে। ড্যাশবোর্ড দেখুন।");
        }

        if (
          profile.role === "customer" &&
          order.status === "out_for_delivery"
        ) {
          toast("আপনার খাবার ডেলিভারির পথে!");
        }

        if ($("dashboardModal")?.classList.contains("show")) {
          try {
            await renderDashboard();
          } catch (error) {
            console.error("Live dashboard update failed:", error);
          }
        }
      }
    )
    .subscribe();
}

$("refreshDashboardBtn")?.addEventListener("click", async () => {
  try {
    await renderDashboard();
    toast("ড্যাশবোর্ড আপডেট হয়েছে।");
  } catch (error) {
    showError(error);
  }
});

$("logoutBtn").onclick = async () => {
  if (!user) return;

  try {
    const { error } = await db.auth.signOut();
    if (error) throw error;

    user = null;
    profile = null;
    currentReceipt = null;

    if (liveChannel) {
      await db.removeChannel(liveChannel);
      liveChannel = null;
    }

    $("accountBtn").textContent = "আমার অ্যাকাউন্ট";
    $("accountBtn").classList.add("hidden");

    hide("dashboardModal");
    hide("approvalModal");
    toast("আপনি লগআউট হয়েছেন।");
  } catch (error) {
    showError(error);
  }
};

db.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    show("resetPasswordModal");
    return;
  }

  if (event === "SIGNED_OUT") {
    user = null;
    profile = null;

    if (liveChannel) {
      await db.removeChannel(liveChannel);
      liveChannel = null;
    }

    $("accountBtn").textContent = "আমার অ্যাকাউন্ট";
    $("accountBtn").classList.add("hidden");
    return;
  }

  if (session?.user && !user) {
    user = session.user;

    setTimeout(async () => {
      try {
        await loadProfile();
      } catch (error) {
        console.error("Profile loading error:", error);
      }
    }, 0);
  }
});

// ------------------------------------------------------
// CONNECTION STATUS, BACK TO TOP & INITIALIZATION
// ------------------------------------------------------

function updateConnectionStatus() {
  const element = $("connectionStatus");
  if (!element) return;

  if (navigator.onLine) {
    element.textContent = "অনলাইন";
    element.classList.remove("offline");
    element.classList.add("online");
  } else {
    element.textContent = "ইন্টারনেট সংযোগ নেই";
    element.classList.remove("online");
    element.classList.add("offline");
  }
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

$("backToTopBtn")?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("scroll", () => {
  $("backToTopBtn")?.classList.toggle("visible", window.scrollY > 400);
});

(async function initializeWebsite() {
  if ($("footerYear")) {
    $("footerYear").textContent = new Date().getFullYear();
  }

  renderCategories();
  renderMenu();
  renderCart();
  initializePhoneInput();
  updateConnectionStatus();
  startOrderTimerTicker();

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

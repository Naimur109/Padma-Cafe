const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
const ADMIN_EMAIL = "admin@padmacafe.com";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Menu items: Original 7 i.ibb.co URLs preserved; Chicken Spring Roll image & Combo Package (হাঁস+খিচুড়ি রেগুলার ও স্পেশাল) added
const MENU_ITEMS = [
  // কম্বো প্যাকেজ (নতুন ক্যাটাগরি — নিচের image লিংকগুলো পরবর্তীতে সহজেই পরিবর্তন করা যাবে)
  {
    id: "combo-hans-regular",
    category: "কম্বো প্যাকেজ",
    name: "হাঁস+খিচুড়ি (রেগুলার)",
    price: 230,
    desc: "সুগন্ধি খিচুড়ির সাথে ঐতিহ্যবাহী হাঁসের মাংস—রেগুলার প্যাকেজ।",
    image: "https://i.ibb.co/yB758d7H/images-2026-03-04-T003950-108.jpg"
  },
  {
    id: "combo-hans-special",
    category: "কম্বো প্যাকেজ",
    name: "হাঁস+খিচুড়ি (স্পেশাল)",
    price: 270,
    desc: "বাড়তি পিস ও স্পেশাল মসলায় রান্না হাঁসের মাংস ও ভুনা খিচুড়ি।",
    image: "https://i.ibb.co/yB758d7H/images-2026-03-04-T003950-108.jpg"
  },

  // স্টার্টার ও স্ন্যাক্স
  {
    id: "chicken-spring-roll",
    category: "স্টার্টার",
    name: "চিকেন স্প্রিং রোল",
    price: 120,
    desc: "মচমচে ক্রিস্পি রোল, ভেতরে জুসি চিকেন ও সবজির পুর।",
    image: "https://i.ibb.co/yB758d7H/images-2026-03-04-T003950-108.jpg"
  },
  {
    id: "porota-platter",
    category: "ব্রেড ও রুটি",
    name: "পোড়া রুটি",
    price: 45,
    desc: "গরম ও নরম হাতে তৈরি বিশেষ রুটি।",
    image: "https://i.ibb.co/yB758d7H/images-2026-03-04-T003950-108.jpg"
  },
  {
    id: "hot-coffee",
    category: "কফি ও পানীয়",
    name: "হট কফি",
    price: 90,
    desc: "সতেজ রোস্টেড কফির গাঢ় ও সুগন্ধি কাপ।",
    image: "https://i.ibb.co/yB758d7H/images-2026-03-04-T003950-108.jpg"
  },
  {
    id: "beef-burger",
    category: "বার্গার",
    name: "রয়্যাল বিফ বার্গার",
    price: 240,
    desc: "সফট বান, জুসি বিফ প্যাটি, চিজ ও বিশেষ সস।",
    image: "https://i.ibb.co/yB758d7H/images-2026-03-04-T003950-108.jpg"
  },
  {
    id: "chicken-pasta",
    category: "পাস্তা",
    name: "ক্রিমি চিকেন পাস্তা",
    price: 260,
    desc: "রিচ হোয়াইট সস, চিকেন ও চিজ দিয়ে বেকড পাস্তা।",
    image: "https://i.ibb.co/yB758d7H/images-2026-03-04-T003950-108.jpg"
  },
  {
    id: "cheese-pizza",
    category: "পিজ্জা",
    name: "চিজ লাভার পিজ্জা",
    price: 390,
    desc: "মোৎজারেলা চিজ ও সিজনড টপিংসে তৈরি পিজ্জা।",
    image: "https://i.ibb.co/yB758d7H/images-2026-03-04-T003950-108.jpg"
  },
  {
    id: "blue-mojito",
    category: "কফি ও পানীয়",
    name: "ব্লু লেগুন মজিটো",
    price: 130,
    desc: "পুদিনা, লেবু ও বরফে ঠান্ডা রিফ্রেশিং মজিটো।",
    image: "https://i.ibb.co/yB758d7H/images-2026-03-04-T003950-108.jpg"
  }
];

const CATEGORIES = [
  "সব",
  "কম্বো প্যাকেজ",
  "স্টার্টার",
  "বার্গার",
  "পাস্তা",
  "পিজ্জা",
  "ব্রেড ও রুটি",
  "কফি ও পানীয়"
];

const state = {
  selectedCategory: "সব",
  searchQuery: "",
  cart: [],
  sessionUser: null,
  profile: {
    full_name: "",
    email: "",
    avatar_url: "",
    role: "customer"
  },
  authMode: "customer", // 'customer' | 'admin'
  pendingOtpEmail: "",
  pendingOtpName: "",
  storeOnline: true,
  orders: [],
  activeDayKey: getLocalDayKey(new Date()),
  selectedMonth: getCurrentMonthValue(),
  timerInterval: null
};

// Helpers
function toast(message) {
  const container = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = "toast-msg";
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function formatBDT(amount) {
  const num = Number(amount || 0);
  return `${num.toLocaleString("bn-BD")}৳`;
}

function getLocalDayKey(dateObj) {
  const d = new Date(dateObj);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getCurrentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function isTodayOrder(isoString) {
  if (!isoString) return false;
  return getLocalDayKey(new Date(isoString)) === getLocalDayKey(new Date());
}

function isAdminUser() {
  const email = (state.sessionUser?.email || "").toLowerCase();
  return Boolean(email && email === ADMIN_EMAIL.toLowerCase());
}

function isCustomerUser() {
  return Boolean(state.sessionUser && !isAdminUser());
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }
}

function openCustomerDrawer() {
  if (!isCustomerUser()) return;
  const drawer = document.getElementById("customerDrawer");
  const backdrop = document.getElementById("customerDrawerBackdrop");

  document.getElementById("customerProfileNameInput").value =
    state.profile.full_name || state.sessionUser.email.split("@")[0];
  document.getElementById("customerProfileEmailInput").value = state.sessionUser.email || "";
  syncDrawerAvatarPreview(state.profile.avatar_url || "");

  backdrop.hidden = false;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
}

function closeCustomerDrawer() {
  const drawer = document.getElementById("customerDrawer");
  const backdrop = document.getElementById("customerDrawerBackdrop");
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  backdrop.hidden = true;
}

function syncDrawerAvatarPreview(url) {
  const img = document.getElementById("drawerAvatarPreview");
  const fallback = document.getElementById("drawerAvatarFallback");
  if (url) {
    img.src = url;
    img.hidden = false;
    fallback.hidden = true;
  } else {
    img.removeAttribute("src");
    img.hidden = true;
    fallback.hidden = false;
  }
}

// Render Store Online/Offline Single Button (Never shows both green & red together)
function renderStoreStatusUI() {
  const btn = document.getElementById("storeStatusBtn");
  const label = document.getElementById("storeStatusLabel");
  const checkoutLabel = document.getElementById("checkoutBtnLabel");

  btn.classList.remove("is-online", "is-offline");

  if (state.storeOnline) {
    btn.classList.add("is-online");
    label.textContent = "অনলাইন";
    btn.title = isAdminUser()
      ? "রেস্টুরেন্ট অনলাইন আছে — অফলাইন করতে ক্লিক করুন"
      : "রেস্টুরেন্ট এখন অনলাইন";
  } else {
    btn.classList.add("is-offline");
    label.textContent = "অফলাইন";
    btn.title = isAdminUser()
      ? "রেস্টুরেন্ট অফলাইন আছে — অনলাইন করতে ক্লিক করুন"
      : "রেস্টুরেন্ট এখন অফলাইন";
  }

  if (isAdminUser()) {
    checkoutLabel.textContent = "অফলাইন সেল ও রসিদ";
  } else if (!state.storeOnline) {
    checkoutLabel.textContent = "রেস্টুরেন্ট অফলাইন";
  } else {
    checkoutLabel.textContent = "অর্ডার করুন";
  }
}

// Render Header Buttons according to Customer vs Admin login state
function renderHeaderAuthUI() {
  const custBtn = document.getElementById("customerLoginBtn");
  const custLabel = document.getElementById("customerLoginLabel");
  const custAvatarWrap = document.getElementById("customerHeaderAvatar");
  const adminBtn = document.getElementById("adminLoginBtn");
  const adminLabel = document.getElementById("adminLoginLabel");

  if (isCustomerUser()) {
    const displayName =
      state.profile.full_name?.trim() || state.sessionUser.email.split("@")[0];
    custLabel.textContent = displayName;
    custBtn.style.display = "inline-flex";
    adminBtn.style.display = "none";

    if (state.profile.avatar_url) {
      custAvatarWrap.innerHTML = `<img src="${state.profile.avatar_url}" alt="${displayName}" class="header-avatar-img" />`;
    } else {
      custAvatarWrap.innerHTML = `<span class="header-avatar-placeholder"><i class="fa-regular fa-user"></i></span>`;
    }
  } else if (isAdminUser()) {
    const adminName = state.profile.full_name?.trim() || "Amir Hamza";
    adminLabel.textContent = adminName;
    adminBtn.style.display = "inline-flex";
    custBtn.style.display = "none";
  } else {
    custLabel.textContent = "কাস্টমার লগইন";
    custAvatarWrap.innerHTML = `<span class="header-avatar-placeholder"><i class="fa-regular fa-user"></i></span>`;
    custBtn.style.display = "inline-flex";

    adminLabel.textContent = "অ্যাডমিন লগইন";
    adminBtn.style.display = "inline-flex";
  }

  renderStoreStatusUI();
}

// Menu Rendering
function renderCategoryTabs() {
  const container = document.getElementById("categoryTabs");
  container.innerHTML = CATEGORIES.map((cat) => {
    const activeClass = state.selectedCategory === cat ? "active" : "";
    return `<button type="button" class="cat-tab ${activeClass}" data-cat="${cat}">${cat}</button>`;
  }).join("");

  container.querySelectorAll(".cat-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedCategory = btn.dataset.cat;
      renderCategoryTabs();
      renderMenu();
    });
  });
}

function renderMenu() {
  const grid = document.getElementById("menuGrid");
  const q = state.searchQuery.trim().toLowerCase();

  const filtered = MENU_ITEMS.filter((item) => {
    const matchCat =
      state.selectedCategory === "সব" || item.category === state.selectedCategory;
    const matchSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  if (!filtered.length) {
    grid.innerHTML = `<p class="empty-state">কোনো খাবার পাওয়া যায়নি।</p>`;
    return;
  }

  grid.innerHTML = filtered
    .map(
      (item) => `
      <article class="menu-card">
        <img src="${item.image}" alt="${item.name}" class="menu-thumb" loading="lazy" />
        <div class="menu-body">
          <span class="menu-cat-tag">${item.category}</span>
          <h3 class="menu-title">${item.name}</h3>
          <p class="menu-desc">${item.desc}</p>
          <div class="menu-foot">
            <strong class="menu-price">${formatBDT(item.price)}</strong>
            <button type="button" class="gold-btn small-btn add-to-order-btn" data-id="${item.id}">
              <i class="fa-solid fa-plus"></i>
              <span>যুক্ত করুন</span>
            </button>
          </div>
        </div>
      </article>
    `
    )
    .join("");

  grid.querySelectorAll(".add-to-order-btn").forEach((btn) => {
    btn.addEventListener("click", () => addToOrderList(btn.dataset.id));
  });
}

// Order List (Cart) Logic
function addToOrderList(itemId) {
  const item = MENU_ITEMS.find((m) => m.id === itemId);
  if (!item) return;

  const existing = state.cart.find((c) => c.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ ...item, qty: 1 });
  }
  renderOrderList();
  toast(`${item.name} অর্ডার তালিকায় যোগ হয়েছে`);
}

function updateOrderListQty(itemId, delta) {
  const idx = state.cart.findIndex((c) => c.id === itemId);
  if (idx === -1) return;
  state.cart[idx].qty += delta;
  if (state.cart[idx].qty <= 0) {
    state.cart.splice(idx, 1);
  }
  renderOrderList();
}

function renderOrderList() {
  const countEl = document.getElementById("cartCount");
  const linesEl = document.getElementById("cartLines");
  const totalEl = document.getElementById("cartTotal");

  const totalQty = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const totalAmount = state.cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  countEl.textContent = totalQty.toLocaleString("bn-BD");
  totalEl.textContent = formatBDT(totalAmount);

  if (!state.cart.length) {
    linesEl.innerHTML = `<p class="empty-state">আপনার অর্ডার তালিকা এখনো খালি।</p>`;
    return;
  }

  linesEl.innerHTML = state.cart
    .map(
      (item) => `
      <div class="cart-line">
        <div>
          <strong>${item.name}</strong>
          <div class="hint-text">${formatBDT(item.price)} × ${item.qty} = ${formatBDT(item.price * item.qty)}</div>
        </div>
        <div class="qty-controls">
          <button type="button" class="qty-btn" data-action="dec" data-id="${item.id}">-</button>
          <span>${item.qty}</span>
          <button type="button" class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
        </div>
      </div>
    `
    )
    .join("");

  linesEl.querySelectorAll(".qty-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      updateOrderListQty(btn.dataset.id, btn.dataset.action === "inc" ? 1 : -1);
    });
  });
}

// Auth (6-Digit OTP)
function openAuthModal(mode) {
  state.authMode = mode;
  document.getElementById("authStepEmail").hidden = false;
  document.getElementById("authStepOtp").hidden = true;
  document.getElementById("otpCodeInput").value = "";

  if (mode === "admin") {
    document.getElementById("authEyebrow").textContent = "ADMIN ACCESS";
    document.getElementById("authTitle").textContent = "অ্যাডমিন লগইন";
    document.getElementById("authNameGroup").hidden = true;
    document.getElementById("authEmailInput").value = ADMIN_EMAIL;
  } else {
    document.getElementById("authEyebrow").textContent = "CUSTOMER ACCOUNT";
    document.getElementById("authTitle").textContent = "কাস্টমার লগইন";
    document.getElementById("authNameGroup").hidden = false;
    document.getElementById("authEmailInput").value = "";
    document.getElementById("authNameInput").value = "";
  }
  openModal("authModal");
}

async function handleSendOtp() {
  const email = document.getElementById("authEmailInput").value.trim();
  const fullName = document.getElementById("authNameInput").value.trim();

  if (!email) {
    toast("অনুগ্রহ করে ইমেইল ঠিকানা লিখুন");
    return;
  }
  if (state.authMode === "admin" && email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    toast("সঠিক অ্যাডমিন ইমেইল ব্যবহার করুন");
    return;
  }

  state.pendingOtpEmail = email;
  state.pendingOtpName =
    state.authMode === "admin" ? "Amir Hamza" : fullName || email.split("@")[0];

  const { error } = await db.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: { full_name: state.pendingOtpName }
    }
  });

  if (error) {
    toast(`OTP পাঠাতে সমস্যা হয়েছে: ${error.message}`);
    return;
  }

  document.getElementById("authStepEmail").hidden = true;
  document.getElementById("authStepOtp").hidden = false;
  toast("ইমেইলে ৬ সংখ্যার OTP পাঠানো হয়েছে");
}

async function handleVerifyOtp() {
  const token = document.getElementById("otpCodeInput").value.trim();
  if (!token || token.length < 6) {
    toast("৬ সংখ্যার OTP কোড লিখুন");
    return;
  }

  const { data, error } = await db.auth.verifyOtp({
    email: state.pendingOtpEmail,
    token,
    type: "email"
  });

  if (error) {
    toast(`ভেরিফিকেশন ব্যর্থ: ${error.message}`);
    return;
  }

  state.sessionUser = data.user || data.session?.user || null;
  await ensureAndLoadProfile();
  renderHeaderAuthUI();
  closeModal("authModal");
  toast("সফলভাবে লগইন সম্পন্ন হয়েছে");
}

async function ensureAndLoadProfile() {
  if (!state.sessionUser) {
    state.profile = { full_name: "", email: "", avatar_url: "", role: "customer" };
    return;
  }

  const uid = state.sessionUser.id;
  const email = state.sessionUser.email || "";
  const defaultName =
    state.pendingOtpName ||
    state.sessionUser.user_metadata?.full_name ||
    email.split("@")[0];

  const { data } = await db
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .maybeSingle();

  if (data) {
    state.profile = {
      full_name: data.full_name || defaultName,
      email: data.email || email,
      avatar_url: data.avatar_url || "",
      role: isAdminUser() ? "admin" : "customer"
    };
  } else {
    const newRow = {
      id: uid,
      email,
      full_name: defaultName,
      avatar_url: "",
      role: isAdminUser() ? "admin" : "customer"
    };
    await db.from("profiles").upsert(newRow);
    state.profile = newRow;
  }
}

async function saveCustomerProfileChanges() {
  if (!isCustomerUser()) return;
  const newName = document.getElementById("customerProfileNameInput").value.trim();
  if (!newName) {
    toast("নাম খালি রাখা যাবে না");
    return;
  }

  const updated = {
    id: state.sessionUser.id,
    email: state.sessionUser.email,
    full_name: newName,
    avatar_url: state.profile.avatar_url || "",
    role: "customer"
  };

  const { error } = await db.from("profiles").upsert(updated);
  if (error) {
    toast(`প্রোফাইল সেভ হয়নি: ${error.message}`);
    return;
  }

  state.profile.full_name = newName;
  renderHeaderAuthUI();
  closeCustomerDrawer();
  toast("প্রোফাইল আপডেট সেভ হয়েছে");
}

async function handleCustomerAvatarUpload(event) {
  const file = event.target.files?.[0];
  if (!file || !isCustomerUser()) return;

  const fileExt = file.name.split(".").pop() || "jpg";
  const filePath = `${state.sessionUser.id}/avatar-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await db.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    toast(`ছবি আপলোড হয়নি: ${uploadError.message}`);
    return;
  }

  const { data: pubData } = db.storage.from("avatars").getPublicUrl(filePath);
  const publicUrl = pubData?.publicUrl || "";

  state.profile.avatar_url = publicUrl;
  syncDrawerAvatarPreview(publicUrl);

  await db.from("profiles").upsert({
    id: state.sessionUser.id,
    email: state.sessionUser.email,
    full_name: state.profile.full_name || state.sessionUser.email.split("@")[0],
    avatar_url: publicUrl,
    role: "customer"
  });

  renderHeaderAuthUI();
  toast("প্রোফাইল ছবি আপডেট হয়েছে");
}

async function handleLogout() {
  await db.auth.signOut();
  state.sessionUser = null;
  state.profile = { full_name: "", email: "", avatar_url: "", role: "customer" };
  closeCustomerDrawer();
  renderHeaderAuthUI();
  toast("লগআউট সম্পন্ন হয়েছে");
}

// Store Online / Offline Status
async function fetchStoreStatus() {
  const { data, error } = await db.rpc("get_store_status");
  if (!error && typeof data === "boolean") {
    state.storeOnline = data;
  } else if (!error && data && typeof data.is_online === "boolean") {
    state.storeOnline = data.is_online;
  }
  renderStoreStatusUI();
}

async function handleStoreStatusClick() {
  if (!isAdminUser()) {
    toast(
      state.storeOnline
        ? "রেস্টুরেন্ট এখন অনলাইন — অর্ডার করতে পারবেন"
        : "রেস্টুরেন্ট এখন অফলাইন — সাময়িকভাবে অর্ডার বন্ধ আছে"
    );
    return;
  }

  const nextStatus = !state.storeOnline;
  const { error } = await db.rpc("set_store_status", { p_is_online: nextStatus });
  if (error) {
    toast(`স্ট্যাটাস বদলানো যায়নি: ${error.message}`);
    return;
  }

  state.storeOnline = nextStatus;
  renderStoreStatusUI();
  toast(nextStatus ? "রেস্টুরেন্ট অনলাইন করা হয়েছে" : "রেস্টুরেন্ট অফলাইন করা হয়েছে");
}

// Checkout: Offline Sale for Admin, Online Order for Customer
async function handleCheckoutClick() {
  if (!state.cart.length) {
    toast("আপনার অর্ডার তালিকা খালি");
    return;
  }

  if (isAdminUser()) {
    await createAdminOfflineSaleAndReceipt();
    return;
  }

  if (!state.storeOnline) {
    toast("রেস্টুরেন্ট বর্তমানে অফলাইন রয়েছে, অর্ডার করা যাচ্ছে না");
    return;
  }

  if (!isCustomerUser()) {
    closeModal("cartModal");
    openAuthModal("customer");
    toast("অর্ডার করতে আগে কাস্টমার লগইন করুন");
    return;
  }

  document.getElementById("custNameInput").value = state.profile.full_name || "";
  document.getElementById("custPhoneInput").value = "";
  document.getElementById("custAddressInput").value = "";
  document.getElementById("custNoteInput").value = "";

  closeModal("cartModal");
  openModal("checkoutModal");
}

async function submitCustomerOrder() {
  if (!state.storeOnline) {
    toast("রেস্টুরেন্ট অফলাইন থাকায় অর্ডার প্লেস করা যায়নি");
    return;
  }
  if (!isCustomerUser()) {
    toast("কাস্টমার অ্যাকাউন্ট প্রয়োজন");
    return;
  }

  const customerName = document.getElementById("custNameInput").value.trim();
  const phone = document.getElementById("custPhoneInput").value.trim();
  const address = document.getElementById("custAddressInput").value.trim();
  const note = document.getElementById("custNoteInput").value.trim();

  if (!customerName || !phone || !address) {
    toast("নাম, ফোন নম্বর এবং ঠিকানা লিখুন");
    return;
  }

  const totalAmount = state.cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const { data, error } = await db.rpc("place_customer_order", {
    p_customer_name: customerName,
    p_customer_email: state.sessionUser.email,
    p_customer_phone: phone,
    p_delivery_address: address,
    p_note: note,
    p_items: state.cart,
    p_total_amount: totalAmount
  });

  if (error) {
    toast(`অর্ডার সম্পন্ন হয়নি: ${error.message}`);
    return;
  }

  state.cart = [];
  renderOrderList();
  closeModal("checkoutModal");
  toast("আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে");

  if (data) {
    openReceiptModal(data);
  }
  await loadOrdersAndReports();
  openModal("ordersModal");
}

async function createAdminOfflineSaleAndReceipt() {
  const totalAmount = state.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const salePayload = {
    sale_type: "offline",
    customer_name: "অফলাইন কাস্টমার",
    customer_email: state.sessionUser?.email || ADMIN_EMAIL,
    customer_phone: "Counter Sale",
    delivery_address: "Padma Cafe Counter (Offline)",
    items: state.cart,
    total_amount: totalAmount,
    status: "completed",
    created_at: new Date().toISOString()
  };

  const { data, error } = await db.rpc("admin_create_offline_sale", {
    p_items: state.cart,
    p_total_amount: totalAmount,
    p_customer_name: "অফলাইন কাস্টমার",
    p_customer_email: state.sessionUser?.email || ADMIN_EMAIL
  });

  const savedRecord = data && typeof data === "object" ? data : { id: `OFF-${Date.now().toString().slice(-6)}`, ...salePayload };

  if (error) {
    toast(`অফলাইন সেল সেভ হয়নি: ${error.message}`);
    return;
  }

  state.cart = [];
  renderOrderList();
  closeModal("cartModal");
  toast("অফলাইন বিক্রি হিসেবে সেভ হয়েছে ও রসিদ প্রস্তুত");
  openReceiptModal(savedRecord);
  await loadOrdersAndReports();
}

// Orders, Daily Reset at 12:00 AM, and Monthly Report & History
async function loadOrdersAndReports() {
  if (!state.sessionUser) {
    document.getElementById("ordersListContainer").innerHTML =
      `<p class="empty-state">অর্ডার দেখতে লগইন করুন।</p>`;
    return;
  }

  const query = isAdminUser()
    ? db.from("orders").select("*").order("created_at", { ascending: false })
    : db
        .from("orders")
        .select("*")
        .eq("customer_email", state.sessionUser.email)
        .order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) {
    toast(`অর্ডার লোড করতে সমস্যা হয়েছে: ${error.message}`);
    return;
  }

  state.orders = data || [];
  renderOrdersAndReports();
}

function renderOrdersAndReports() {
  const isAdmin = isAdminUser();
  const reportsPanel = document.getElementById("adminReportsPanel");
  const container = document.getElementById("ordersListContainer");

  document.getElementById("ordersEyebrow").textContent = isAdmin
    ? "ADMIN KITCHEN & SALES DASHBOARD"
    : "YOUR ORDERS & TRACKING";
  document.getElementById("ordersTitle").textContent = isAdmin
    ? "সকল অর্ডার"
    : "আমার অর্ডারসমূহ";

  reportsPanel.hidden = !isAdmin;

  // Today's orders (automatically fresh after 12:00 AM midnight)
  const todayOrders = state.orders.filter((o) => isTodayOrder(o.created_at));

  if (isAdmin) {
    const onlineToday = todayOrders
      .filter((o) => o.sale_type !== "offline")
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const offlineToday = todayOrders
      .filter((o) => o.sale_type === "offline")
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    document.getElementById("todayOnlineTotal").textContent = formatBDT(onlineToday);
    document.getElementById("todayOfflineTotal").textContent = formatBDT(offlineToday);
    document.getElementById("todayGrandTotal").textContent = formatBDT(onlineToday + offlineToday);

    renderMonthlyReportAndHistory();
  }

  const visibleOrders = isAdmin ? todayOrders : state.orders;
  updateDeliveryTracker(visibleOrders);

  if (!visibleOrders.length) {
    container.innerHTML = `<p class="empty-state">আজকের কোনো অর্ডার এখনো আসেনি।</p>`;
    return;
  }

  container.innerHTML = visibleOrders
    .map((order) => {
      const emailText = order.customer_email || order.email || "—";
      const itemsHtml = Array.isArray(order.items)
        ? order.items
            .map((it) => `<div>${it.name} — ${it.qty} × ${formatBDT(it.price)}</div>`)
            .join("")
        : "";
      const timeStr = order.created_at
        ? new Date(order.created_at).toLocaleString("bn-BD")
        : "";

      return `
        <div class="order-card">
          <div class="order-card-head">
            <div>
              <strong>অর্ডার #${String(order.id).slice(0, 8)} • ${order.customer_name || "কাস্টমার"}</strong>
              <span class="order-badge">${order.sale_type === "offline" ? "অফলাইন সেল" : order.status || "নতুন"}</span>
            </div>
            <strong>${formatBDT(order.total_amount)}</strong>
          </div>

          <div class="order-meta">
            <div>ইমেইল: ${emailText}</div>
            <div>ফোন: ${order.customer_phone || "—"}</div>
            <div>ঠিকানা: ${order.delivery_address || "—"}</div>
            <div>সময়: ${timeStr}</div>
          </div>

          <div class="order-items-list">${itemsHtml}</div>

          <div class="admin-controls-box">
            <button type="button" class="ghost-btn small-btn view-receipt-btn" data-order-id="${order.id}">
              <i class="fa-solid fa-receipt"></i>
              <span>রসিদ</span>
            </button>

            ${
              isAdmin && order.sale_type !== "offline"
                ? `
                <label class="hint-text">ডেলিভারি মিনিট:</label>
                <input type="number" min="1" max="180" value="${order.delivery_minutes || 15}" id="delivery-min-${order.id}" class="minutes-input" />
                <button type="button" class="gold-btn small-btn start-delivery-btn" data-order-id="${order.id}">
                  <i class="fa-solid fa-motorcycle"></i>
                  <span>খাবার তৈরি হয়েছে — ডেলিভারি শুরু</span>
                </button>
              `
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll(".view-receipt-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const found = state.orders.find((o) => String(o.id) === String(btn.dataset.orderId));
      if (found) openReceiptModal(found);
    });
  });

  // Direct start without browser confirm() popup
  container.querySelectorAll(".start-delivery-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      adminStartDelivery(btn.dataset.orderId);
    });
  });
}

function renderMonthlyReportAndHistory() {
  const monthVal = state.selectedMonth || getCurrentMonthValue();
  const monthOrders = state.orders.filter((o) => {
    if (!o.created_at) return false;
    const d = new Date(o.created_at);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return ym === monthVal;
  });

  const onlineSum = monthOrders
    .filter((o) => o.sale_type !== "offline")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const offlineSum = monthOrders
    .filter((o) => o.sale_type === "offline")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  document.getElementById("monthlyReportTitle").textContent = `মাসিক হিসাব (${monthVal})`;
  document.getElementById("monthlyReportTotals").innerHTML = `
    <span>অনলাইন: ${formatBDT(onlineSum)}</span>
    <span>অফলাইন: ${formatBDT(offlineSum)}</span>
    <strong>মোট: ${formatBDT(onlineSum + offlineSum)}</strong>
  `;

  const historyList = document.getElementById("monthlyHistoryList");
  if (!monthOrders.length) {
    historyList.innerHTML = `<p class="empty-state">এই মাসের কোনো রেকর্ড নেই।</p>`;
    return;
  }

  historyList.innerHTML = monthOrders
    .map((o) => {
      const dt = new Date(o.created_at).toLocaleString("bn-BD");
      const tag = o.sale_type === "offline" ? "অফলাইন" : "অনলাইন";
      return `
        <div class="history-row">
          <div>
            <strong>#${String(o.id).slice(0, 8)}</strong> • ${o.customer_name || "কাস্টমার"} (${tag})
            <div class="hint-text">${dt}</div>
          </div>
          <strong>${formatBDT(o.total_amount)}</strong>
        </div>
      `;
    })
    .join("");
}

// No confirm() dialog when starting delivery
async function adminStartDelivery(orderId) {
  const minInput = document.getElementById(`delivery-min-${orderId}`);
  const deliveryMinutes = Math.max(1, Number(minInput?.value || 15));

  const { error } = await db
    .from("orders")
    .update({
      status: "out_for_delivery",
      delivery_minutes: deliveryMinutes,
      delivery_started_at: new Date().toISOString()
    })
    .eq("id", orderId);

  if (error) {
    toast(`ডেলিভারি শুরু করা যায়নি: ${error.message}`);
    return;
  }

  toast(`ডেলিভারি শুরু হয়েছে (${deliveryMinutes} মিনিট)`);
  await loadOrdersAndReports();
}

function updateDeliveryTracker(ordersList) {
  const activeDelivery = ordersList.find((o) => o.status === "out_for_delivery");
  const titleEl = document.getElementById("trackerStatusTitle");
  const timerEl = document.getElementById("trackerTimerValue");
  const progressEl = document.getElementById("roadProgressFill");
  const bikeEl = document.getElementById("deliveryBike");

  if (!activeDelivery || !activeDelivery.delivery_started_at) {
    titleEl.textContent = "সক্রিয় ডেলিভারি নেই";
    timerEl.textContent = "--:--";
    progressEl.style.width = "0%";
    bikeEl.style.left = "0%";
    return;
  }

  const totalMs = Math.max(1, Number(activeDelivery.delivery_minutes || 15)) * 60 * 1000;
  const startMs = new Date(activeDelivery.delivery_started_at).getTime();
  const elapsedMs = Math.max(0, Date.now() - startMs);
  const ratio = Math.min(1, elapsedMs / totalMs);
  const remainingSec = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000));

  const mins = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const secs = String(remainingSec % 60).padStart(2, "0");

  titleEl.textContent = `ডেলিভারির পথে • #${String(activeDelivery.id).slice(0, 8)}`;
  timerEl.textContent = `${mins}:${secs}`;

  const pct = `${(ratio * 92).toFixed(1)}%`;
  progressEl.style.width = pct;
  bikeEl.style.left = pct;
}

// Receipt Modal
function openReceiptModal(order) {
  const itemsHtml = Array.isArray(order.items)
    ? order.items
        .map(
          (it) => `
          <div class="receipt-line">
            <span>${it.name} × ${it.qty}</span>
            <span>${formatBDT(it.price * it.qty)}</span>
          </div>
        `
        )
        .join("")
    : "";

  document.getElementById("receiptContent").innerHTML = `
    <div class="receipt-box">
      <h3 style="text-align:center; margin-bottom:4px;">PADMA CAFE</h3>
      <p style="text-align:center; font-size:12px; color:#555; margin-bottom:12px;">
        ${order.sale_type === "offline" ? "অফলাইন কাউন্টার রসিদ" : "অনলাইন অর্ডার রসিদ"}
      </p>
      <hr/>
      <div class="receipt-line"><span>অর্ডার আইডি:</span><strong>#${String(order.id).slice(0, 8)}</strong></div>
      <div class="receipt-line"><span>নাম:</span><span>${order.customer_name || "কাস্টমার"}</span></div>
      <div class="receipt-line"><span>ইমেইল:</span><span>${order.customer_email || "—"}</span></div>
      <div class="receipt-line"><span>সময়:</span><span>${new Date(order.created_at || Date.now()).toLocaleString("bn-BD")}</span></div>
      <hr style="margin:10px 0;"/>
      ${itemsHtml}
      <hr style="margin:10px 0;"/>
      <div class="receipt-line" style="font-size:16px; font-weight:700;">
        <span>সর্বমোট</span>
        <span>${formatBDT(order.total_amount)}</span>
      </div>
    </div>
  `;
  openModal("receiptModal");
}

// Midnight Auto-Reset Watcher (Every 30 seconds)
function startMidnightWatcher() {
  setInterval(() => {
    const nowDay = getLocalDayKey(new Date());
    if (nowDay !== state.activeDayKey) {
      state.activeDayKey = nowDay;
      renderOrdersAndReports();
      toast("নতুন দিন শুরু হয়েছে — আজকের সামারি ফ্রেশ করা হয়েছে");
    }
  }, 30000);

  setInterval(() => {
    const visibleOrders = isAdminUser()
      ? state.orders.filter((o) => isTodayOrder(o.created_at))
      : state.orders;
    updateDeliveryTracker(visibleOrders);
  }, 1000);
}

// Event Bindings & Init
function bindEvents() {
  document.getElementById("menuSearch").addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderMenu();
  });

  document.getElementById("cartBtn").addEventListener("click", () => openModal("cartModal"));
  document.getElementById("checkoutBtn").addEventListener("click", handleCheckoutClick);
  document.getElementById("confirmOrderBtn").addEventListener("click", submitCustomerOrder);

  document.getElementById("storeStatusBtn").addEventListener("click", handleStoreStatusClick);

  document.getElementById("allOrdersBtn").addEventListener("click", async () => {
    if (!state.sessionUser) {
      openAuthModal("customer");
      toast("অর্ডার দেখতে আগে লগইন করুন");
      return;
    }
    await loadOrdersAndReports();
    openModal("ordersModal");
  });

  document.getElementById("customerLoginBtn").addEventListener("click", () => {
    if (isCustomerUser()) {
      openCustomerDrawer();
    } else {
      openAuthModal("customer");
    }
  });

  document.getElementById("adminLoginBtn").addEventListener("click", () => {
    if (isAdminUser()) {
      loadOrdersAndReports().then(() => openModal("ordersModal"));
    } else {
      openAuthModal("admin");
    }
  });

  // Customer Profile Drawer Events
  document.getElementById("closeCustomerDrawerBtn").addEventListener("click", closeCustomerDrawer);
  document.getElementById("customerDrawerBackdrop").addEventListener("click", closeCustomerDrawer);
  document
    .getElementById("customerAvatarInput")
    .addEventListener("change", handleCustomerAvatarUpload);
  document
    .getElementById("saveCustomerProfileBtn")
    .addEventListener("click", saveCustomerProfileChanges);
  document.getElementById("drawerLogoutBtn").addEventListener("click", handleLogout);

  // Auth Events
  document.getElementById("sendOtpBtn").addEventListener("click", handleSendOtp);
  document.getElementById("verifyOtpBtn").addEventListener("click", handleVerifyOtp);
  document.getElementById("backToEmailBtn").addEventListener("click", () => {
    document.getElementById("authStepEmail").hidden = false;
    document.getElementById("authStepOtp").hidden = true;
  });

  // Monthly Picker
  const monthInput = document.getElementById("monthlyReportInput");
  monthInput.value = state.selectedMonth;
  monthInput.addEventListener("change", (e) => {
    state.selectedMonth = e.target.value || getCurrentMonthValue();
    renderMonthlyReportAndHistory();
  });

  // Print Receipt
  document.getElementById("printReceiptBtn").addEventListener("click", () => {
    window.print();
  });

  // Modal Close Triggers
  document.querySelectorAll("[data-close-modal]").forEach((el) => {
    el.addEventListener("click", () => closeModal(el.dataset.closeModal));
  });
}

async function initApp() {
  renderCategoryTabs();
  renderMenu();
  renderOrderList();
  bindEvents();
  startMidnightWatcher();

  await fetchStoreStatus();

  const { data } = await db.auth.getSession();
  state.sessionUser = data?.session?.user || null;
  if (state.sessionUser) {
    await ensureAndLoadProfile();
  }
  renderHeaderAuthUI();
}

document.addEventListener("DOMContentLoaded", initApp);

// ======================================================
// PADMA CAFE — COMPLETE WEBSITE SCRIPT
// File: script.js
// Currency: BDT | Timezone: Asia/Dhaka
// ======================================================

// SUPABASE CONFIGURATION
const SUPABASE_URL = "https://qeoxoujxdptjiwgxhvbb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mjf3B4SkF1kOXwhVxy_veA_oTHLPNLU";

// ONLINE CUSTOMER ORDER RECEIPT ONLY
const CAFE_CONTACT_PHONE = "+8801304178943";
const CAFE_LOGO_URL = "https://i.ibb.co/4nW7J6d0/IMG-20261121-WA0000.jpg";

// SONALI BANK BANGLA QR BASE EMVCO STRING (PADMA CAFE, KUSHTIA)
const BANGLA_QR_BASE_PAYLOAD =
  "00020101021126570017sonalibank.com.bd0102000204020003189020028089304039945204581253030505802BD5911PADMA  CAFE6007KUSHTIA6104704062290211017608703920310QR31777678630418AC";

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
  }, 3800);
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

  if (!document.querySelector(".modal.show") && !document.querySelector(".side-drawer.show")) {
    document.body.classList.remove("modal-open");
  }
}

function setLoading(button, loading, text = "অপেক্ষা করুন...") {
  if (!button) return;

  if (loading) {
    button.dataset.originalText = button.innerHTML;
    button.textContent = text;
    button.disabled = true;
  } else {
    button.innerHTML =
      button.dataset.originalText || button.innerHTML;
    button.disabled = false;
  }
}

function showError(error) {
  console.error(error);
  toast(error?.message || "কাজটি সম্পন্ন করা যায়নি।");
}

// ------------------------------------------------------
// SOUND ALERTS (ADMIN LOUD ALERT + CUSTOMER STAGE CHIMES)
// ------------------------------------------------------

function playToneSequence(notes) {
  try {
    audioCtx = audioCtx || new (
      window.AudioContext || window.webkitAudioContext
    )();

    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const baseTime = audioCtx.currentTime;

    notes.forEach(({ delay, duration, freq, volume }) => {
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      oscillator.type = "triangle";
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);

      oscillator.frequency.setValueAtTime(freq, baseTime + delay);

      gain.gain.setValueAtTime(0.001, baseTime + delay);
      gain.gain.exponentialRampToValueAtTime(
        volume,
        baseTime + delay + 0.02
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        baseTime + delay + duration
      );

      oscillator.start(baseTime + delay);
      oscillator.stop(baseTime + delay + duration + 0.02);
    });
  } catch (error) {
    console.info("Sound requires browser interaction.", error);
  }
}

// Loud alarm for Admin when a new order or payment verification arrives
function playAdminLoudAlert() {
  playToneSequence([
    { delay: 0.00, duration: 0.22, freq: 987.77, volume: 0.45 },
    { delay: 0.25, duration: 0.22, freq: 1318.51, volume: 0.45 },
    { delay: 0.50, duration: 0.22, freq: 987.77, volume: 0.45 },
    { delay: 0.75, duration: 0.30, freq: 1567.98, volume: 0.50 }
  ]);
}

// Notification chime for Customer on status / payment verification updates
function playCustomerNotifySound(kind = "info") {
  if (kind === "paid" || kind === "completed") {
    playToneSequence([
      { delay: 0.00, duration: 0.16, freq: 659.25, volume: 0.28 },
      { delay: 0.18, duration: 0.16, freq: 880.00, volume: 0.28 },
      { delay: 0.36, duration: 0.26, freq: 1174.66, volume: 0.32 }
    ]);
  } else {
    playToneSequence([
      { delay: 0.00, duration: 0.18, freq: 783.99, volume: 0.26 },
      { delay: 0.21, duration: 0.24, freq: 1046.50, volume: 0.30 }
    ]);
  }
}

// ------------------------------------------------------
// EMVCo BANGLA QR PAYLOAD & CRC16 HELPER
// ------------------------------------------------------

function crc16Ccitt(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function buildDynamicBanglaQrPayload(basePayload, amount) {
  const numericAmount = Number(amount || 0);
  const amountStr = Number.isInteger(numericAmount)
    ? String(numericAmount)
    : numericAmount.toFixed(2).replace(/\.?0+$/, "");

  const rawWithoutCrc = basePayload.includes("6304")
    ? basePayload.slice(0, basePayload.indexOf("6304"))
    : basePayload;

  let updated = rawWithoutCrc.replace("010211", "010212");

  const amountTag = `54${String(amountStr.length).padStart(2, "0")}${amountStr}`;
  const countryIdx = updated.indexOf("5802BD");
  if (countryIdx !== -1) {
    updated = updated.slice(0, countryIdx) + amountTag + updated.slice(countryIdx);
  } else {
    updated = updated + amountTag;
  }

  const prefixWithCrcHeader = `${updated}6304`;
  const checksum = crc16Ccitt(prefixWithCrcHeader);
  return `${prefixWithCrcHeader}${checksum}`;
}

async function renderBanglaQrCode(amount) {
  const wrap = $("banglaQrCanvasWrap");
  if (!wrap) return;

  wrap.innerHTML = "";
  const payload = buildDynamicBanglaQrPayload(BANGLA_QR_BASE_PAYLOAD, amount);

  if (window.QRCode && typeof window.QRCode.toCanvas === "function") {
    const canvas = document.createElement("canvas");
    wrap.appendChild(canvas);
    await window.QRCode.toCanvas(canvas, payload, {
      width: 190,
      margin: 1,
      errorCorrectionLevel: "M"
    });
  } else {
    const img = document.createElement("img");
    img.alt = "Bangla QR Code";
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payload)}`;
    wrap.appendChild(img);
  }
}

// ------------------------------------------------------
// MENU
// ------------------------------------------------------

const MENU = [
  // PADMA SPECIAL — 11
  {
    id: "hot_coffee",
    name: "হট কফি",
    category: "পদ্মা স্পেশাল",
    price: 50,
    image: "https://i.ibb.co/8LXCtYvL/2-CA2-CB11-2-A5-C-4381-BA5-F-75545-BC1-A432.png"
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
    price: 50,
    image: "https://i.ibb.co/5gVjYxnd/2-F219-EBE-0-E4-F-4-A8-E-AD8-D-93-F03-EC9-FF7-B.png"
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
    price: 90,
    image: "https://i.ibb.co/jvk38nz1/1389-A25-D-894-C-4-A34-8-EE5-F309-F4234-A0-B.png"
  },
  {
    id: "doi_chira",
    name: "দই চিড়া",
    category: "পদ্মা স্পেশাল",
    price: 80,
    image: "https://i.ibb.co/WN4FLbWy/D91-BB4-A4-D5-CC-468-E-8420-A78-D02702-D04.png"
  },

  // BURGER — 2
  {
    id: "chicken_tikka_burger",
    name: "চিকেন টিক্কা বার্গার",
    category: "বার্গার",
    price: 80,
    image: "https://i.ibb.co/W4DqWBZ6/EE2-B31-AA-4-DF9-44-BD-ADD8-5573-CB16-F6-CC.png"
  },
  {
    id: "beef_burger",
    name: "বিফ বার্গার",
    category: "বার্গার",
    price: 130,
    image: "https://i.ibb.co/FkHC1P73/4-FCDE463-3752-4-D94-AF80-38949321-EB08.png"
  },

  // STARTER — 5
  {
    id: "kolija_singara",
    name: "কলিজা সিঙ্গারা",
    category: "স্টাটার",
    price: 25,
    image: "https://i.ibb.co/n81jGdmZ/624327-CB-CAF9-4595-ADC8-29-AED104761-F.png"
  },
  {
    id: "french_fries",
    name: "ফ্রেন্স ফ্রাই",
    category: "স্টাটার",
    price: 50,
    image: "https://i.ibb.co/qYwytJ2H/0-FC2562-A-E630-4056-8679-94-C3244-F4693.png"
  },
  {
    id: "chicken_spring_roll",
    name: "চিকেন স্প্রিং রোল",
    category: "স্টাটার",
    price: 80,
    image: "https://i.ibb.co/LXFwxr8B/5-D1-E5792-4978-4-C91-A3-BF-B77-F1-AD40-E1-E.png"
  },
  {
    id: "chicken_momos",
    name: "চিকেন মমস",
    category: "স্টাটার",
    price: 100,
    image: "https://i.ibb.co/d47K3SHR/7458-C286-F52-D-4091-800-B-00-F5-F50-B38-A2.png"
  },
  {
    id: "chicken_fry_3pcs",
    name: "চিকেন ফ্রাই (৩ পিস)",
    category: "স্টাটার",
    price: 120,
    image: "https://i.ibb.co/twkB2HdJ/5-F87576-A-63-DE-4-B7-B-939-A-77-FBA368-D63-B.png"
  },

  // SHAKES — 6
  {
    id: "cold_coffee",
    name: "কোল্ড কফি",
    category: "শেক",
    price: 80,
    image: "https://i.ibb.co/9HMwr8JZ/8-D88-E5-DA-53-BD-486-A-9-F4-E-57-E1-CE6029-FD.png"
  },
  {
    id: "chocolate_shake",
    name: "চকলেট শেক",
    category: "শেক",
    price: 90,
    image: "https://i.ibb.co/DHL1JrGq/7-AB0-CD26-2-A65-4-A62-8626-F57-EEEF367-BC.png"
  },
  {
    id: "vanilla_shake",
    name: "ভ্যানিলা শেক",
    category: "শেক",
    price: 99,
    image: "https://i.ibb.co/Q3sRqntj/DFE6-D029-F56-E-43-AD-8021-7793-C5-DD9-FBB.png"
  },
  {
    id: "oreo_shake",
    name: "অরিও শেক",
    category: "শেক",
    price: 110,
    image: "https://i.ibb.co/CsvJJYxk/3418542-C-F907-4-F9-E-8-C5-E-33-C948-D56-DBC.png"
  },
  {
    id: "kitkat_shake",
    name: "কিটক্যাট শেক",
    category: "শেক",
    price: 110,
    image: "https://i.ibb.co/5XXwtkkd/96-EE5-C94-0335-4697-B189-AD25573-A1452.png"
  },
  {
    id: "butterscotch_shake",
    name: "বাটারস্কচ শেক (Padma Special)",
    category: "শেক",
    price: 110,
    image: "https://i.ibb.co/Q7C1KMrG/6-DBE446-F-C5-F0-40-CD-988-D-399-DD37-CFCC8.png"
  },

  // SOFT DRINKS — 2
  {
    id: "water",
    name: "পানি",
    category: "সফট ড্রিঙ্কস",
    price: 20,
    image: "https://i.ibb.co/1hGL88J/78-BAED40-1575-4-DC9-AC0-A-0-DE09893-FC46.png"
  },
  {
    id: "mojo",
    name: "মজো",
    category: "সফট ড্রিঙ্কস",
    price: 20,
    image: "https://i.ibb.co/tPcx817T/D763-AE66-BB05-4-D47-87-C0-BB6-AC2-C1-E0-AA.png"
  },

  // COMBO PACKAGE — 2
  {
    id: "combo_hash_khichuri_regular",
    name: "হাঁস+খিচুড়ি (রেগুলার)",
    category: "কম্বো প্যাকেজ",
    price: 230,
    image: "https://i.ibb.co/zhwSK12Z/7543-F983-42-F6-4-A40-AC24-7905-E953-E10-B.png"
  },
  {
    id: "combo_hash_khichuri_special",
    name: "হাঁস+খিচুড়ি (স্পেশাল)",
    category: "কম্বো প্যাকেজ",
    price: 270,
    image: "https://i.ibb.co/prf7qKPk/34-C78-C43-2008-4279-BD93-FAD7-C5300544.png"
  }
];

const CATEGORIES = [
  "সব খাবার",
  "কম্বো প্যাকেজ",
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
let checkoutDeliveryDraft = {
  recipient_name: "",
  recipient_phone: "",
  recipient_address: ""
};
let authMode = "login";
let pendingOtpEmail = "";
let phoneInput = null;
let liveChannel = null;
let storeChannel = null;
let currentReceipt = null;
let audioCtx = null;
let reportDate = dhakaDate(new Date());
let reportType = "daily";
let offlineCart = {};
let offlineSelectedCategory = "সব খাবার";
let offlinePaymentMethod = "cod"; // "cod" | "online_qr"
let offlineQrActive = false;
let hasUnprintedOfflineReceipt = false;
let printerBridgeState = {
  connected: false,
  printerName: "POSIFLOW PSF-KP206",
  paperWidth: "58mm",
  devices: []
};
let orderTimerInterval = null;
let storeOnline = true;
let draftPhotoDataUrl = "";
let profileCacheById = {};
let previousOrderSnapshot = {};

// ------------------------------------------------------
// MODAL & DRAWER CLOSE EVENTS
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

function openProfileSlide() {
  if (!user || !profile) return;

  draftPhotoDataUrl = "";
  const currentAvatar = profile.avatar_url || CAFE_LOGO_URL;
  $("profileSlidePreview").src = currentAvatar;
  $("profilePhotoUrlInput").value = profile.avatar_url || "";
  $("profileNameInput").value = profile.full_name || "";

  $("profileSlideDrawer").classList.add("show");
  $("profileSlideDrawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeProfileSlide() {
  $("profileSlideDrawer")?.classList.remove("show");
  $("profileSlideDrawer")?.setAttribute("aria-hidden", "true");
  if (!document.querySelector(".modal.show")) {
    document.body.classList.remove("modal-open");
  }
}

$("closeProfileSlideBtn")?.addEventListener("click", closeProfileSlide);
$("profileSlideBackdrop")?.addEventListener("click", closeProfileSlide);

document.addEventListener("keydown", event => {
  if (event.key !== "Escape") return;

  if ($("profileSlideDrawer")?.classList.contains("show")) {
    closeProfileSlide();
    return;
  }

  document.querySelectorAll(".modal.show").forEach(modal => {
    modal.classList.remove("show");
  });

  document.body.classList.remove("modal-open");
});

// ------------------------------------------------------
// RECEIPT NOTIFICATION DOT & HEADER VISIBILITY
// ------------------------------------------------------

function setOfflineReceiptNotification(active) {
  hasUnprintedOfflineReceipt = Boolean(active);
  const dot = $("offlineReceiptDot");
  if (dot) {
    dot.classList.toggle("hidden", !hasUnprintedOfflineReceipt);
  }
}

function updatePrinterHeaderBadge() {
  const btn = $("adminPrinterBtn");
  if (!btn) return;
  btn.classList.toggle("connected", Boolean(printerBridgeState.connected));
}

// ------------------------------------------------------
// STORE ONLINE / OFFLINE STATUS SYNC
// ------------------------------------------------------

function applyStoreStatusUI() {
  const isAdmin = Boolean(user && profile && profile.role === "admin");

  $("adminStoreSwitchWrap")?.classList.toggle("hidden", !isAdmin);
  $("customerStoreBadge")?.classList.toggle("hidden", isAdmin);

  $("storeOnlineBtn")?.classList.toggle("active", storeOnline);
  $("storeOfflineBtn")?.classList.toggle("active", !storeOnline);

  const badge = $("customerStoreBadge");
  const badgeText = $("customerStoreBadgeText");
  if (badge && badgeText) {
    badge.classList.toggle("online", storeOnline);
    badge.classList.toggle("offline", !storeOnline);
    badgeText.textContent = storeOnline ? "অনলাইন" : "অফলাইন";
  }
}

async function fetchStoreStatus() {
  try {
    const { data, error } = await db
      .from("store_settings")
      .select("is_online")
      .eq("id", 1)
      .maybeSingle();

    if (!error && data && typeof data.is_online === "boolean") {
      storeOnline = data.is_online;
      localStorage.setItem("padma_store_online", String(storeOnline));
      applyStoreStatusUI();
      return;
    }
  } catch (_) {}

  const saved = localStorage.getItem("padma_store_online");
  if (saved !== null) {
    storeOnline = saved === "true";
  }
  applyStoreStatusUI();
}

function subscribeStoreStatus() {
  if (storeChannel) {
    db.removeChannel(storeChannel);
    storeChannel = null;
  }

  storeChannel = db
    .channel("padma-store-status")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "store_settings"
      },
      payload => {
        const row = payload.new;
        if (row && typeof row.is_online === "boolean") {
          storeOnline = row.is_online;
          localStorage.setItem("padma_store_online", String(storeOnline));
          applyStoreStatusUI();
        }
      }
    )
    .subscribe();
}

async function setStoreOnlineStatus(nextOnline) {
  if (!ensureAdmin()) return;

  const previousState = storeOnline;
  storeOnline = Boolean(nextOnline);
  localStorage.setItem("padma_store_online", String(storeOnline));
  applyStoreStatusUI();

  try {
    const { data, error } = await db
      .from("store_settings")
      .upsert({
        id: 1,
        is_online: storeOnline,
        updated_at: new Date().toISOString()
      })
      .select("is_online")
      .single();

    if (error) throw error;
    if (data && typeof data.is_online === "boolean") {
      storeOnline = data.is_online;
      localStorage.setItem("padma_store_online", String(storeOnline));
      applyStoreStatusUI();
    }

    toast(storeOnline ? "স্টোর অনলাইন করা হয়েছে।" : "স্টোর অফলাইন করা হয়েছে।");
  } catch (err) {
    storeOnline = previousState;
    localStorage.setItem("padma_store_online", String(storeOnline));
    applyStoreStatusUI();
    showError(err);
  }
}

$("storeOnlineBtn")?.addEventListener("click", () => setStoreOnlineStatus(true));
$("storeOfflineBtn")?.addEventListener("click", () => setStoreOnlineStatus(false));

// ------------------------------------------------------
// UNIFIED HEADER BUTTONS & PROFILE SLIDE
// ------------------------------------------------------

function updateHeaderAuthButtons() {
  const accLabel = $("authAccountLabel");
  const accAvatar = $("customerHeaderAvatar");
  const allOrdersBtn = $("allOrdersBtn");
  const printerBtn = $("adminPrinterBtn");
  const offlineReceiptBtn = $("adminOfflineReceiptBtn");
  const cartBtn = $("cartBtn");

  if (!user || !profile) {
    accLabel.textContent = "লগইন / রেজিস্টার";
    accAvatar.classList.add("hidden");
    accAvatar.src = "";
    allOrdersBtn.classList.add("hidden");
    printerBtn?.classList.add("hidden");
    offlineReceiptBtn?.classList.add("hidden");
    cartBtn?.classList.remove("hidden");
    setOfflineReceiptNotification(false);
    applyStoreStatusUI();
    return;
  }

  const isAdmin = profile.role === "admin";

  accLabel.textContent = profile.full_name || user.email || "অ্যাকাউন্ট";
  if (profile.avatar_url) {
    accAvatar.src = profile.avatar_url;
    accAvatar.classList.remove("hidden");
  } else {
    accAvatar.classList.add("hidden");
  }

  allOrdersBtn.classList.remove("hidden");
  printerBtn?.classList.toggle("hidden", !isAdmin);
  offlineReceiptBtn?.classList.toggle("hidden", !isAdmin);
  cartBtn?.classList.toggle("hidden", isAdmin);

  if (!isAdmin) {
    setOfflineReceiptNotification(false);
  }

  updatePrinterHeaderBadge();
  applyStoreStatusUI();
}

$("authAccountBtn").onclick = () => {
  if (user && profile) {
    openProfileSlide();
    return;
  }
  openAuth("login");
};

$("allOrdersBtn").onclick = async () => {
  if (!user) {
    openAuth("login");
    return;
  }
  await openDashboard();
};

$("adminPrinterBtn")?.addEventListener("click", async () => {
  if (!ensureAdmin()) return;
  await openPrinterModal();
});

$("adminOfflineReceiptBtn")?.addEventListener("click", () => {
  if (!ensureAdmin()) return;
  setOfflineReceiptNotification(false);
  openOfflineSale();
});

$("profilePhotoInput")?.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    draftPhotoDataUrl = String(reader.result || "");
    $("profileSlidePreview").src = draftPhotoDataUrl;
    $("profilePhotoUrlInput").value = "";
  };
  reader.readAsDataURL(file);
});

$("profilePhotoUrlInput")?.addEventListener("input", event => {
  const url = event.target.value.trim();
  draftPhotoDataUrl = "";
  $("profileSlidePreview").src =
    url || profile?.avatar_url || CAFE_LOGO_URL;
});

$("profileSlideForm")?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!user || !profile) return;

  const newName = $("profileNameInput").value.trim();
  if (!newName) {
    toast("নাম লিখুন।");
    return;
  }

  const typedUrl = $("profilePhotoUrlInput").value.trim();
  const finalAvatar = draftPhotoDataUrl || typedUrl || profile.avatar_url || "";

  const btn = $("saveProfileSlideBtn");
  setLoading(btn, true, "সেভ হচ্ছে...");

  try {
    const { error } = await db
      .from("profiles")
      .update({
        full_name: newName,
        avatar_url: finalAvatar
      })
      .eq("id", user.id);

    if (error) {
      await db.auth.updateUser({
        data: { full_name: newName, avatar_url: finalAvatar }
      });
    }

    profile.full_name = newName;
    profile.avatar_url = finalAvatar;
    updateHeaderAuthButtons();
    closeProfileSlide();
    toast("প্রোফাইল সেভ হয়েছে।");
  } catch (err) {
    showError(err);
  } finally {
    setLoading(btn, false);
  }
});

$("slideLogoutBtn")?.addEventListener("click", async () => {
  try {
    await db.auth.signOut();
  } catch (_) {}
  user = null;
  profile = null;
  previousOrderSnapshot = {};
  closeProfileSlide();
  hide("dashboardModal");
  updateHeaderAuthButtons();
  toast("লগআউট সম্পন্ন হয়েছে।");
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
            তালিকায় যোগ
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
// ORDER LIST ("অর্ডার তালিকা")
// ------------------------------------------------------

function addCart(id) {
  const item = MENU.find(product => product.id === id);
  if (!item) return;

  cart[id] = (cart[id] || 0) + 1;

  renderCart();
  toast(`${item.name} অর্ডার তালিকায় যোগ হয়েছে`);
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
    : `<p class="empty-state">আপনার অর্ডার তালিকা এখনো খালি।</p>`;

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
// UNIFIED AUTHENTICATION & 6-DIGIT OTP VERIFICATION
// ------------------------------------------------------

function openAuth(mode) {
  authMode = mode;
  const isSignup = mode === "signup";

  $("authRoleLabel").textContent = "PADMA CAFE ACCOUNT";
  $("authTitle").textContent = isSignup ? "নতুন অ্যাকাউন্ট রেজিস্টার" : "লগইন করুন";

  ["nameWrap", "phoneWrap", "addressWrap", "confirmPasswordWrap"]
    .forEach(id => {
      $(id).classList.toggle("hidden", !isSignup);
    });

  $("forgotPasswordWrap").classList.toggle("hidden", isSignup);
  $("switchAuthWrap").classList.remove("hidden");

  $("authSwitchText").textContent =
    isSignup ? "আগে অ্যাকাউন্ট আছে?" : "নতুন অ্যাকাউন্ট খুলতে চান?";

  $("authSwitch").textContent =
    isSignup ? "লগইন করুন" : "রেজিস্টার করুন";

  $("authSubmitBtn").textContent =
    isSignup ? "রেজিস্টার করুন" : "লগইন করুন";

  $("authHint").textContent = isSignup
    ? "রেজিস্ট্রেশনের পর ইমেইলে পাঠানো ৬ সংখ্যার কোড দিয়ে ভেরিফাই করুন।"
    : "আপনার জিমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন। অ্যাডমিন নির্ধারিত জিমেইল হলে স্বয়ংক্রিয়ভাবে অ্যাডমিন প্যানেল খুলবে।";

  $("authPassword").autocomplete =
    isSignup ? "new-password" : "current-password";

  if (isSignup) initializePhoneInput();

  show("authModal");
}

$("authSwitch").onclick = () => {
  openAuth(authMode === "signup" ? "login" : "signup");
};

function openOtpModal(email) {
  pendingOtpEmail = email;
  $("otpEmailDisplay").textContent = email;
  $("otpCodeInput").value = "";
  show("otpVerifyModal");
  setTimeout(() => $("otpCodeInput")?.focus(), 100);
}

$("authForm").onsubmit = async event => {
  event.preventDefault();

  const button = $("authSubmitBtn");
  setLoading(button, true);

  try {
    const email = $("authEmail").value.trim().toLowerCase();
    const password = $("authPassword").value;

    if (authMode === "signup") {
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
            address,
            email
          }
        }
      });

      if (error) throw error;

      hide("authModal");

      if (data.session) {
        user = data.user;
        await loadProfile();
        subscribeLive();
        toast("রেজিস্ট্রেশন সফল হয়েছে।");
      } else {
        openOtpModal(email);
        toast("আপনার ইমেইলে ৬ সংখ্যার কোড পাঠানো হয়েছে।");
      }
    } else {
      const { data, error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message?.toLowerCase().includes("email not confirmed")) {
          hide("authModal");
          openOtpModal(email);
          toast("প্রথমে ইমেইলের ৬ সংখ্যার কোড দিয়ে ভেরিফাই করুন।");
          return;
        }
        throw error;
      }

      user = data.user;
      await loadProfile();

      hide("authModal");
      subscribeLive();
      toast(
        profile?.role === "admin"
          ? "অ্যাডমিন প্যানেলে স্বাগতম।"
          : "লগইন সফল হয়েছে।"
      );
    }
  } catch (error) {
    showError(error);
  } finally {
    setLoading(button, false);
  }
};

$("otpVerifyForm").onsubmit = async event => {
  event.preventDefault();

  const token = $("otpCodeInput").value.trim().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(token)) {
    toast("সঠিক ৬ সংখ্যার কোড লিখুন।");
    $("otpCodeInput").focus();
    return;
  }

  const button = $("verifyOtpBtn");
  setLoading(button, true, "যাচাই হচ্ছে...");

  try {
    const { data, error } = await db.auth.verifyOtp({
      email: pendingOtpEmail,
      token,
      type: "signup"
    });

    if (error) throw error;

    user = data.user || data.session?.user;
    hide("otpVerifyModal");

    if (user) {
      await loadProfile();
      subscribeLive();
    }

    toast("ইমেইল ভেরিফিকেশন সফল হয়েছে!");
  } catch (error) {
    showError(error);
  } finally {
    setLoading(button, false);
  }
};

$("resendOtpBtn").onclick = async () => {
  if (!pendingOtpEmail) return;

  const button = $("resendOtpBtn");
  setLoading(button, true, "কোড পাঠানো হচ্ছে...");

  try {
    const { error } = await db.auth.resend({
      type: "signup",
      email: pendingOtpEmail
    });

    if (error) throw error;

    toast("নতুন ৬ সংখ্যার কোড ইমেইলে পাঠানো হয়েছে।");
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

  profile = {
    ...data,
    full_name: data.full_name || user.user_metadata?.full_name || "",
    avatar_url: data.avatar_url || user.user_metadata?.avatar_url || "",
    email: data.email || user.email || "",
    phone: data.phone || user.user_metadata?.phone || "",
    address: data.address || user.user_metadata?.address || ""
  };

  if (profile.id) {
    profileCacheById[profile.id] = profile;
  }

  updateHeaderAuthButtons();
}

async function resolveCustomerEmail(order) {
  const direct = order.customer_email || order.email || "";
  if (direct) return direct;

  if (!order.customer_id) return "—";

  if (profileCacheById[order.customer_id]?.email) {
    return profileCacheById[order.customer_id].email;
  }

  try {
    const { data } = await db
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", order.customer_id)
      .maybeSingle();

    if (data) {
      profileCacheById[order.customer_id] = data;
      if (data.email) return data.email;
    }
  } catch (_) {}

  return "—";
}

async function ensureCustomer() {
  if (!user || !profile) {
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
// MULTI-STEP CUSTOMER ORDER CHECKOUT (DELIVERY -> PAYMENT -> COD / BANGLA QR)
// ------------------------------------------------------

$("checkoutBtn").onclick = async () => {
  const rows = cartRows();
  if (!rows.length) return;

  if (!storeOnline) {
    toast("ক্যাফে/রেস্টুরেন্ট এখন বন্ধ আছে। এই মুহূর্তে অর্ডার নেওয়া যাচ্ছে না।");
    return;
  }

  if (!(await ensureCustomer())) return;

  offlineQrActive = false;
  hide("cartModal");
  openCheckoutDetailsModal();
};

function openCheckoutDetailsModal() {
  const defaultName =
    checkoutDeliveryDraft.recipient_name || profile?.full_name || "";
  const defaultPhone =
    checkoutDeliveryDraft.recipient_phone || profile?.phone || "";
  const defaultAddress =
    checkoutDeliveryDraft.recipient_address || profile?.address || "";

  $("deliveryNameInput").value = defaultName;
  $("deliveryPhoneInput").value = defaultPhone;
  $("deliveryAddressInput").value = defaultAddress;
  $("checkoutDetailsTotal").textContent = money(cartTotal());

  show("checkoutDetailsModal");
}

$("backToCartBtn")?.addEventListener("click", () => {
  hide("checkoutDetailsModal");
  renderCart();
  show("cartModal");
});

$("checkoutDetailsForm")?.addEventListener("submit", event => {
  event.preventDefault();

  const name = $("deliveryNameInput").value.trim();
  const phone = $("deliveryPhoneInput").value.trim();
  const address = $("deliveryAddressInput").value.trim();

  if (!name || !phone || !address) {
    toast("নাম, মোবাইল নম্বর এবং ঠিকানা সঠিকভাবে পূরণ করুন।");
    return;
  }

  checkoutDeliveryDraft = {
    recipient_name: name,
    recipient_phone: phone,
    recipient_address: address
  };

  $("summaryRecipientName").textContent = name;
  $("summaryRecipientPhone").textContent = phone;
  $("summaryRecipientAddress").textContent = address;
  $("paymentMethodTotal").textContent = money(cartTotal());

  hide("checkoutDetailsModal");
  show("paymentMethodModal");
});

$("paymentMethodBackBtn")?.addEventListener("click", () => {
  hide("paymentMethodModal");
  openCheckoutDetailsModal();
});

$("selectCodBtn")?.addEventListener("click", () => {
  $("codRecipientName").textContent = checkoutDeliveryDraft.recipient_name;
  $("codRecipientPhone").textContent = checkoutDeliveryDraft.recipient_phone;
  $("codRecipientAddress").textContent = checkoutDeliveryDraft.recipient_address;
  $("codTotalAmount").textContent = money(cartTotal());

  hide("paymentMethodModal");
  show("codConfirmModal");
});

$("codBackBtn")?.addEventListener("click", () => {
  hide("codConfirmModal");
  show("paymentMethodModal");
});

$("selectOnlinePayBtn")?.addEventListener("click", async () => {
  offlineQrActive = false;
  const total = cartTotal();
  $("qrExactAmount").textContent = money(total);
  $("qrReferenceInput").required = true;
  $("qrReferenceInput").value = "";
  $("qrRefFieldWrap")?.classList.remove("hidden");
  $("banglaQrHintText").textContent =
    "QR কোডটি স্ক্যান করলে আপনার পেমেন্ট অ্যাপে স্বয়ংক্রিয়ভাবে এই টাকা বসে যাবে; আলাদা করে টাকা লিখতে হবে না। পেমেন্ট শেষে Transaction ID দিয়ে ভেরিফিকেশনের জন্য পাঠান।";
  $("confirmQrPaidOrderBtn").innerHTML =
    '<i class="fa-solid fa-paper-plane"></i> ভেরিফিকেশনের জন্য পাঠান — অর্ডার করুন';

  hide("paymentMethodModal");
  show("banglaQrModal");
  await renderBanglaQrCode(total);
});

$("qrBackBtn")?.addEventListener("click", () => {
  hide("banglaQrModal");
  if (offlineQrActive) {
    offlineQrActive = false;
    renderOfflineSaleView();
    show("offlineSaleModal");
    return;
  }
  show("paymentMethodModal");
});

$("confirmCodOrderBtn")?.addEventListener("click", async () => {
  await submitCustomerOrder({
    paymentMethod: "cod",
    paymentStatus: "unpaid",
    paymentReference: "",
    buttonEl: $("confirmCodOrderBtn"),
    sourceModalId: "codConfirmModal"
  });
});

$("banglaQrConfirmForm")?.addEventListener("submit", async event => {
  event.preventDefault();

  if (offlineQrActive) {
    await finalizeOfflineSale("online_qr");
    return;
  }

  const refText = ($("qrReferenceInput")?.value || "").trim();

  if (!refText) {
    toast("অনুগ্রহ করে Transaction ID লিখুন।");
    $("qrReferenceInput")?.focus();
    return;
  }

  // Starts as pending_verification until Admin verifies payment
  await submitCustomerOrder({
    paymentMethod: "online_qr",
    paymentStatus: "pending_verification",
    paymentReference: refText,
    buttonEl: $("confirmQrPaidOrderBtn"),
    sourceModalId: "banglaQrModal"
  });
});

async function submitCustomerOrder({
  paymentMethod,
  paymentStatus,
  paymentReference,
  buttonEl,
  sourceModalId
}) {
  const rows = cartRows();
  if (!rows.length) {
    toast("আপনার অর্ডার তালিকা খালি।");
    return;
  }

  if (!storeOnline) {
    toast("ক্যাফে/রেস্টুরেন্ট এখন বন্ধ আছে।");
    return;
  }

  if (!(await ensureCustomer())) return;

  const deliveryInfo = { ...checkoutDeliveryDraft };
  if (!deliveryInfo.recipient_name || !deliveryInfo.recipient_phone || !deliveryInfo.recipient_address) {
    hide(sourceModalId);
    openCheckoutDetailsModal();
    toast("আগে ডেলিভারির তথ্য দিন।");
    return;
  }

  setLoading(buttonEl, true, "অর্ডার পাঠানো হচ্ছে...");

  try {
    const items = rows.map(item => ({
      id: item.id,
      quantity: item.qty
    }));

    const { data, error } = await db.rpc("place_customer_order", {
      p_items: items,
      p_delivery_name: deliveryInfo.recipient_name,
      p_delivery_phone: deliveryInfo.recipient_phone,
      p_delivery_address: deliveryInfo.recipient_address,
      p_payment_method: paymentMethod,
      p_payment_status: paymentStatus,
      p_payment_reference: paymentReference
    });

    if (error) throw error;

    const orderId = typeof data === "string"
      ? data
      : data?.id || data?.order_id || crypto.randomUUID();

    const totalAmt = rows.reduce((sum, item) => sum + item.subtotal, 0);

    const createdOrder = {
      id: orderId,
      created_at: new Date().toISOString(),
      customer_id: user.id,
      customer_name: deliveryInfo.recipient_name,
      customer_email: profile?.email || user.email || "",
      customer_phone: deliveryInfo.recipient_phone,
      customer_address: deliveryInfo.recipient_address,
      status: "pending",
      sale_type: "online",
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      payment_reference: paymentReference,
      total_amount: totalAmt
    };

    const receiptItems = rows.map(item => ({
      item_name: item.name,
      quantity: item.qty,
      unit_price: item.price,
      line_total: item.subtotal,
      item_status: "active"
    }));

    cart = {};
    checkoutDeliveryDraft = {
      recipient_name: "",
      recipient_phone: "",
      recipient_address: ""
    };
    renderCart();
    hide(sourceModalId);

    currentReceipt = { order: createdOrder, items: receiptItems };
    $("receiptContent").innerHTML = receiptHTML(createdOrder, receiptItems);
    show("receiptModal");

    toast(
      paymentStatus === "pending_verification"
        ? "Transaction ID পাঠানো হয়েছে! অ্যাডমিন ভেরিফাই করলে PAID দেখাবে।"
        : "আপনার অর্ডার সফলভাবে পাঠানো হয়েছে।"
    );
  } catch (error) {
    showError(error);
  } finally {
    setLoading(buttonEl, false);
  }
}

// ------------------------------------------------------
// STATUS, PAYMENT BADGES, TIMERS & DELIVERY PROGRESS
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

function paymentMethodLabel(order) {
  if (order.sale_type === "offline") {
    return order.payment_method === "online_qr"
      ? "অনলাইন QR (অফলাইন)"
      : "ক্যাশ পেমেন্ট (অফলাইন)";
  }
  return order.payment_method === "online_qr"
    ? "অনলাইন পেমেন্ট (Bangla QR)"
    : "ক্যাশ অন ডেলিভারি";
}

function paymentBadgeHTML(order) {
  if (order.sale_type === "offline") {
    return `<span class="status paid"><i class="fa-solid fa-cash-register"></i> ${escapeHTML(paymentMethodLabel(order))}</span>`;
  }
  if (order.payment_status === "paid") {
    return `<span class="status paid"><i class="fa-solid fa-circle-check"></i> PAID</span>`;
  }
  if (order.payment_method === "online_qr" || order.payment_status === "pending_verification") {
    return `<span class="status pending_verification"><i class="fa-solid fa-clock"></i> পেমেন্ট যাচাইাধীন</span>`;
  }
  return `<span class="status cod">ক্যাশ অন ডেলিভারি</span>`;
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

function calculateDeliveryProgress(startAt, endAt, minutes) {
  if (!endAt) return 0;

  const endMs = new Date(endAt).getTime();
  const totalMs = startAt
    ? Math.max(1000, endMs - new Date(startAt).getTime())
    : Math.max(1000, Number(minutes || 15) * 60 * 1000);

  const startMs = startAt
    ? new Date(startAt).getTime()
    : endMs - totalMs;

  const elapsed = Math.max(0, Date.now() - startMs);
  return Math.min(1, Math.max(0, elapsed / totalMs));
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

  const startAt = order.delivery_started_at || "";
  const endAt = order.delivery_ends_at || "";
  const mins = Number(order.delivery_minutes || 15);
  const timerId = `${prefix}-${order.id}`;

  const progress = calculateDeliveryProgress(startAt, endAt, mins);
  const bikeLeft = (8 + progress * 68).toFixed(2);
  const fillWidth = (progress * 100).toFixed(1);

  return `
    <section
      class="delivery-tracking"
      data-delivery-panel="${escapeHTML(order.id)}"
      data-start="${escapeHTML(startAt)}"
      data-end="${escapeHTML(endAt)}"
      data-mins="${escapeHTML(mins)}"
    >
      <div class="delivery-heading">
        <h3>
          <i class="fa-solid fa-motorcycle"></i>
          খাবার আপনার পথে!
        </h3>
        <span class="delivery-subtitle">Padma Cafe Delivery (${numberBN(mins)} মিনিট)</span>
      </div>

      <div class="delivery-road">
        <div class="delivery-progress-fill" style="width: ${fillWidth}%;"></div>

        <div class="delivery-start">
          <i class="fa-solid fa-store"></i>
          ক্যাফে
        </div>

        <div class="delivery-end">
          <i class="fa-solid fa-house"></i>
          আপনার ঠিকানা
        </div>

        <div class="delivery-bike" style="left: ${bikeLeft}%;" aria-label="ডেলিভারি বাইক">
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
          নির্ধারিত সময় অনুযায়ী বাইকটি ক্যাফে থেকে আপনার ঠিকানার দিকে এগোচ্ছে।
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

    document.querySelectorAll(".delivery-tracking").forEach(panel => {
      const progress = calculateDeliveryProgress(
        panel.dataset.start,
        panel.dataset.end,
        panel.dataset.mins
      );

      const bike = panel.querySelector(".delivery-bike");
      const fill = panel.querySelector(".delivery-progress-fill");

      if (bike) {
        bike.style.left = `${(8 + progress * 68).toFixed(2)}%`;
      }
      if (fill) {
        fill.style.width = `${(progress * 100).toFixed(1)}%`;
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

        <div class="order-badges">
          <span class="status ${escapeHTML(order.status)}">
            ${statusLabel(order.status)}
          </span>
          ${paymentBadgeHTML(order)}
        </div>

        <p>
          প্রাপক: ${escapeHTML(order.customer_name || "কাস্টমার")}<br>
          ফোন: ${escapeHTML(order.customer_phone || "—")}<br>
          ঠিকানা: ${escapeHTML(order.customer_address || "—")}<br>
          পেমেন্ট মাধ্যম: ${escapeHTML(paymentMethodLabel(order))}<br>
          ${order.payment_reference ? `Transaction ID: ${escapeHTML(order.payment_reference)}<br>` : ""}
          সময়: ${dateTime(order.created_at)}
        </p>

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

  const todayStr = dhakaDate(new Date());
  const dayRange = dhakaDayRange(todayStr);
  const startMs = new Date(dayRange.start).getTime();
  const endMs = new Date(dayRange.end).getTime();

  const { data, error } = await db
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) throw error;

  const allOrders = data || [];
  const todayOrders = allOrders.filter(o => {
    const t = new Date(o.created_at).getTime();
    return t >= startMs && t < endMs;
  });

  const todayOnlineOrders = todayOrders.filter(o => o.sale_type !== "offline");
  const todayOfflineOrders = todayOrders.filter(o => o.sale_type === "offline");

  const todayPendingCount = todayOnlineOrders.filter(
    o => o.status === "pending"
  ).length;

  const todayCompletedOnlineSale = todayOnlineOrders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const todayCompletedOfflineSale = todayOfflineOrders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const todayCancelledCount = todayOrders.filter(
    o => o.status === "cancelled"
  ).length;

  container.innerHTML = `
    <div class="dashboard-panel">
      <h3>অ্যাডমিন কন্ট্রোল</h3>

      <div class="order-actions">
        <button id="openOfflineSale" class="gold-btn" type="button">
          <i class="fa-solid fa-receipt"></i>
          অফলাইন রিসিট
        </button>

        <button id="openPrinterModalDash" class="outline" type="button">
          <i class="fa-solid fa-print"></i>
          Printer সেটআপ
        </button>

        <button id="openSalesReport" class="outline" type="button">
          <i class="fa-solid fa-chart-column"></i>
          বিক্রির রিপোর্ট ও মান্থলি সেল
        </button>
      </div>
    </div>

    <div class="dashboard-panel">
      <h3>আজকের ফ্রেশ সামারি (${escapeHTML(todayStr)} · রাত ১২টার পর রিসেট)</h3>
      <div class="dashboard-grid">
        <div class="stat-card">
          <span>আজকের অনলাইন অর্ডার</span>
          <strong>${numberBN(todayOnlineOrders.length)}</strong>
        </div>

        <div class="stat-card">
          <span>আজকের অফলাইন অর্ডার</span>
          <strong>${numberBN(todayOfflineOrders.length)}</strong>
        </div>

        <div class="stat-card">
          <span>আজকের অপেক্ষমাণ</span>
          <strong>${numberBN(todayPendingCount)}</strong>
        </div>

        <div class="stat-card">
          <span>আজকের সম্পন্ন অনলাইন বিক্রি</span>
          <strong>${money(todayCompletedOnlineSale)}</strong>
        </div>

        <div class="stat-card">
          <span>আজকের অফলাইন সম্পূর্ণ বিক্রি</span>
          <strong>${money(todayCompletedOfflineSale)}</strong>
        </div>

        <div class="stat-card">
          <span>আজকের বাতিল অর্ডার</span>
          <strong>${numberBN(todayCancelledCount)}</strong>
        </div>
      </div>
      <p class="field-hint">পুরনো সব হিসাব সংরক্ষিত আছে—মান্থলি সেল ও হিস্টোরি দেখতে "বিক্রির রিপোর্ট ও মান্থলি সেল" বাটনে ক্লিক করুন।</p>
    </div>

    <div id="adminOrders">
      ${todayOnlineOrders.length ? "" : `<p class="empty-state">আজকের (${escapeHTML(todayStr)}) কোনো নতুন অনলাইন অর্ডার নেই। পুরনো হিস্টোরি রিপোর্টে সংরক্ষিত আছে।</p>`}
    </div>
  `;

  $("openOfflineSale").onclick = () => {
    setOfflineReceiptNotification(false);
    openOfflineSale();
  };
  $("openPrinterModalDash").onclick = async () => {
    await openPrinterModal();
  };
  $("openSalesReport").onclick = openSalesReport;

  let output = "";

  for (const order of todayOnlineOrders) {
    const items = await fetchItems(order.id);
    const emailDisplay = await resolveCustomerEmail(order);
    const showVerifyPaidBtn =
      order.payment_method === "online_qr" && order.payment_status !== "paid";

    output += `
      <article class="order-card">
        <h3>
          অর্ডার #${escapeHTML(order.id.slice(0, 8))}
          · ${escapeHTML(order.customer_name || "কাস্টমার")}
        </h3>

        <div class="order-badges">
          <span class="status ${escapeHTML(order.status)}">
            ${statusLabel(order.status)}
          </span>
          ${paymentBadgeHTML(order)}
        </div>

        <p>
          পেমেন্ট মাধ্যম: ${escapeHTML(paymentMethodLabel(order))}<br>
          ${order.payment_reference ? `Transaction ID: <strong>${escapeHTML(order.payment_reference)}</strong><br>` : ""}
          ইমেইল: ${escapeHTML(emailDisplay)}<br>
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
            showVerifyPaidBtn
              ? `<button class="gold-btn verify-paid-btn"
                   type="button"
                   data-verify-paid="${escapeHTML(order.id)}">
                   <i class="fa-solid fa-circle-check"></i>
                   পেমেন্ট ভেরিফাই (PAID)
                 </button>`
              : ""
          }

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
  const verifyPaidButton = event.target.closest("[data-verify-paid]");
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

    if (verifyPaidButton) {
      await adminVerifyPaymentPaid(verifyPaidButton.dataset.verifyPaid);
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
// ADMIN PAYMENT VERIFICATION & ORDER STATUS
// ------------------------------------------------------

async function adminVerifyPaymentPaid(orderId) {
  if (!ensureAdmin()) return;

  const { error } = await db.rpc("admin_mark_payment_paid", {
    p_order_id: orderId
  });

  if (error) throw error;

  toast("পেমেন্ট ভেরিফাই (PAID) সম্পন্ন হয়েছে।");
  await renderDashboard();
}

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
      ? `ডেলিভারি শুরু হয়েছে (${numberBN(deliveryMinutes)} মিনিট)। বাইকটি ঠিকানার দিকে এগোচ্ছে।`
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
// FLUTTER BLUETOOTH THERMAL BRIDGE (POSIFLOW PSF-KP206, 58mm)
// ------------------------------------------------------

window.onFlutterPrinterStatus = function(statusPayload) {
  try {
    const parsed = typeof statusPayload === "string"
      ? JSON.parse(statusPayload)
      : (statusPayload || {});

    printerBridgeState = {
      connected: Boolean(parsed.connected),
      printerName: parsed.printerName || parsed.name || "POSIFLOW PSF-KP206",
      paperWidth: parsed.paperWidth || "58mm",
      devices: Array.isArray(parsed.devices) ? parsed.devices : printerBridgeState.devices
    };
    updatePrinterHeaderBadge();
    if ($("printerModal")?.classList.contains("show")) {
      renderPrinterModalContent();
    }
  } catch (_) {}
};

function sendFlutterBridgeCommand(action, payload = {}) {
  const message = JSON.stringify({ action, ...payload });

  if (window.PadmaPrinterBridge && typeof window.PadmaPrinterBridge.postMessage === "function") {
    window.PadmaPrinterBridge.postMessage(message);
    return true;
  }

  if (window.PrintChannel && typeof window.PrintChannel.postMessage === "function") {
    window.PrintChannel.postMessage(message);
    return true;
  }

  return false;
}

async function openPrinterModal() {
  if (!ensureAdmin()) return;
  show("printerModal");
  renderPrinterModalContent();
  sendFlutterBridgeCommand("refreshStatus");
  sendFlutterBridgeCommand("scanPairedPrinters");
}

function renderPrinterModalContent() {
  const wrap = $("printerModalContent");
  if (!wrap) return;

  const devicesHtml = printerBridgeState.devices.length
    ? printerBridgeState.devices.map(dev => `
        <div class="printer-device-item">
          <div class="printer-device-meta">
            <strong>${escapeHTML(dev.name || "Bluetooth Printer")}</strong>
            <small>${escapeHTML(dev.mac || dev.macAdress || "")}</small>
          </div>
          <button
            type="button"
            class="gold-btn"
            data-connect-printer-mac="${escapeHTML(dev.mac || dev.macAdress || "")}"
            data-connect-printer-name="${escapeHTML(dev.name || "POSIFLOW PSF-KP206")}"
          >
            Connect
          </button>
        </div>
      `).join("")
    : `<p class="field-hint">Paired Bluetooth Printer দেখতে "Scan Paired" বাটন চাপুন অথবা Flutter App থেকে Printer Pair করুন।</p>`;

  wrap.innerHTML = `
    <div class="printer-status-box">
      <div class="printer-status-row">
        <strong>Printer Model:</strong>
        <span>POSIFLOW PSF-KP206 (58mm)</span>
      </div>
      <div class="printer-status-row">
        <strong>Connection Status:</strong>
        <span class="status ${printerBridgeState.connected ? "paid" : "pending"}">
          ${printerBridgeState.connected ? `Connected (${escapeHTML(printerBridgeState.printerName)})` : "Disconnected"}
        </span>
      </div>
      <small class="field-hint">
        Android WebView App-এর Bluetooth Bridge ব্যবহার করে সরাসরি 58mm Thermal Printer-এ প্রিন্ট হবে।
      </small>
    </div>

    <div class="order-actions" style="margin-bottom: 14px;">
      <button type="button" class="gold-btn" id="scanPairedPrintersBtn">
        <i class="fa-brands fa-bluetooth"></i>
        Scan Paired Printers
      </button>

      <button type="button" class="outline" id="testThermalPrinterBtn">
        <i class="fa-solid fa-receipt"></i>
        Test Print
      </button>

      ${
        printerBridgeState.connected
          ? `<button type="button" class="danger-btn" id="disconnectThermalPrinterBtn">
               <i class="fa-solid fa-link-slash"></i>
               Disconnect
             </button>`
          : ""
      }
    </div>

    <div class="dashboard-panel">
      <h3>Paired Bluetooth Devices</h3>
      <div id="pairedPrintersList">${devicesHtml}</div>
    </div>

    <div class="dashboard-panel">
      <h3>Printer Settings (58mm)</h3>
      <p class="field-hint">
        • Model: POSIFLOW PSF-KP206<br>
        • Paper Roll: 58mm Thermal<br>
        • Offline Sale Print: Kitchen Copy + Customer Copy (পরপর ২টি কপি)<br>
        • Online Order Print: শুধু Customer Copy (১টি কপি)
      </p>
    </div>
  `;

  $("scanPairedPrintersBtn")?.addEventListener("click", () => {
    const sent = sendFlutterBridgeCommand("scanPairedPrinters");
    if (!sent) {
      toast("Flutter WebView অ্যাপে খুলে Bluetooth Printer Connect করুন।");
    } else {
      toast("Paired Bluetooth Printer খোঁজা হচ্ছে...");
    }
  });

  $("testThermalPrinterBtn")?.addEventListener("click", () => {
    const sent = sendFlutterBridgeCommand("testPrint", {
      printerModel: "POSIFLOW PSF-KP206",
      paperWidth: "58mm"
    });
    if (!sent) {
      toast("Test Print পাঠাতে Flutter WebView অ্যাপ ব্যবহার করুন।");
    }
  });

  $("disconnectThermalPrinterBtn")?.addEventListener("click", () => {
    sendFlutterBridgeCommand("disconnectPrinter");
  });

  wrap.querySelectorAll("[data-connect-printer-mac]").forEach(btn => {
    btn.addEventListener("click", () => {
      const mac = btn.dataset.connectPrinterMac;
      const name = btn.dataset.connectPrinterName;
      const sent = sendFlutterBridgeCommand("connectPrinter", { mac, name });
      if (!sent) {
        toast("Flutter WebView অ্যাপে Printer Connect করুন।");
      }
    });
  });
}

function buildThermalPrintPayload(order, items) {
  const isOffline = order.sale_type === "offline";
  const receiptNo = String(order.id || "").slice(0, 8).toUpperCase();
  const formattedDateTime = dateTime(order.created_at);

  const normalizedItems = (items || []).map(item => ({
    name: String(item.item_name || item.name || ""),
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unit_price ?? item.price ?? 0),
    lineTotal: Number(item.line_total ?? (Number(item.unit_price ?? item.price ?? 0) * Number(item.quantity || 1)))
  }));

  const totalAmount = Number(
    order.total_amount ?? normalizedItems.reduce((sum, i) => sum + i.lineTotal, 0)
  );

  // Offline sale prints TWO copies sequentially:
  // 1) Kitchen Copy (NO prices or total)
  // 2) Customer Copy (With logo, receipt ID, date/time, items, qty, individual price, total, payment method)
  // Online order prints ONLY ONE Customer Copy.
  if (isOffline) {
    return {
      type: "offline_dual_receipt",
      copies: ["kitchen", "customer"],
      paperWidth: "58mm",
      printerModel: "POSIFLOW PSF-KP206",
      kitchenCopy: {
        cafeName: "PADMA CAFE",
        copyTitle: "Kitchen Copy",
        receiptNumber: receiptNo,
        dateTime: formattedDateTime,
        items: normalizedItems.map(i => ({
          name: i.name,
          quantity: i.quantity
        }))
      },
      customerCopy: {
        cafeName: "PADMA CAFE",
        logoUrl: CAFE_LOGO_URL,
        copyTitle: "Customer Copy",
        receiptId: receiptNo,
        dateTime: formattedDateTime,
        paymentMethod: paymentMethodLabel(order),
        items: normalizedItems,
        totalAmount
      }
    };
  }

  return {
    type: "online_single_receipt",
    copies: ["customer"],
    paperWidth: "58mm",
    printerModel: "POSIFLOW PSF-KP206",
    customerCopy: {
      cafeName: "PADMA CAFE",
      logoUrl: CAFE_LOGO_URL,
      copyTitle: "Customer Copy",
      receiptId: receiptNo,
      dateTime: formattedDateTime,
      customerName: order.customer_name || "কাস্টমার",
      customerPhone: order.customer_phone || "",
      customerAddress: order.customer_address || "",
      paymentMethod: paymentMethodLabel(order),
      paymentStatus: order.payment_status || "unpaid",
      items: normalizedItems,
      totalAmount
    }
  };
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

  order.customer_email = await resolveCustomerEmail(order);
  const items = await fetchItems(orderId);
  return { order, items };
}

function receiptHTML(order, items) {
  const isOffline = order.sale_type === "offline";
  const isOnlinePaid = !isOffline && order.payment_status === "paid";
  const isOnlinePendingVerify =
    !isOffline &&
    order.payment_method === "online_qr" &&
    order.payment_status !== "paid";

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
          src="${CAFE_LOGO_URL}"
          alt="Padma Cafe"
        >
        <h2>PADMA CAFE</h2>
        <p>স্বাদে ও আতিথেয়তায় আপনাদের পাশে</p>
        <p>${isOffline ? "অফলাইন বিক্রির রসিদ" : "অনলাইন অর্ডার রসিদ"}</p>
        ${
          !isOffline
            ? `<p>ক্যাফে যোগাযোগ: ${escapeHTML(CAFE_CONTACT_PHONE)}</p>`
            : ""
        }
        ${
          isOnlinePaid
            ? `<span class="paid-stamp">PAID</span>`
            : isOnlinePendingVerify
              ? `<span class="pending-stamp">পেমেন্ট যাচাইাধীন</span>`
              : ""
        }
      </div>

      <div class="receipt-info">
        <p>রসিদ: ${escapeHTML(order.id.slice(0, 8))}</p>
        <p>তারিখ: ${dateTime(order.created_at)}</p>
        ${
          isOffline
            ? `
              <p>বিক্রির ধরন: অফলাইন</p>
              <p>পেমেন্ট মাধ্যম: ${escapeHTML(paymentMethodLabel(order))}</p>
            `
            : `
              <p>প্রাপক: ${escapeHTML(order.customer_name || "কাস্টমার")}</p>
              <p>ইমেইল: ${escapeHTML(order.customer_email || order.email || "—")}</p>
              <p>ফোন: ${escapeHTML(order.customer_phone || "—")}</p>
              <p>ঠিকানা: ${escapeHTML(order.customer_address || "—")}</p>
              <p>পেমেন্ট মাধ্যম: ${escapeHTML(paymentMethodLabel(order))}</p>
              <p>পেমেন্ট স্ট্যাটাস: ${isOnlinePaid ? "PAID" : isOnlinePendingVerify ? "পেমেন্ট যাচাইাধীন" : "ক্যাশ অন ডেলিভারি"}</p>
              ${order.payment_reference ? `<p>Transaction ID: ${escapeHTML(order.payment_reference)}</p>` : ""}
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

  const payload = buildThermalPrintPayload(currentReceipt.order, currentReceipt.items);
  const bridged = sendFlutterBridgeCommand("printReceipt", {
    receiptData: payload,
    html: $("receiptContent").innerHTML
  });

  if (bridged) {
    setOfflineReceiptNotification(false);
    toast(
      currentReceipt.order.sale_type === "offline"
        ? "Kitchen Copy ও Customer Copy প্রিন্টারে পাঠানো হয়েছে!"
        : "Customer Copy প্রিন্টারে পাঠানো হয়েছে!"
    );
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
        .paid-stamp {
          display: inline-block;
          margin-top: 6px;
          padding: 3px 10px;
          border: 2px solid #1b7a46;
          color: #1b7a46;
          font-weight: 800;
          letter-spacing: 2px;
        }
        .pending-stamp {
          display: inline-block;
          margin-top: 6px;
          padding: 3px 10px;
          border: 2px solid #966309;
          color: #966309;
          font-weight: 700;
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
// OFFLINE SALE / POS (3-COL VERTICAL GRID + CASH / BANGLA QR)
// ------------------------------------------------------

function openOfflineSale() {
  if (!ensureAdmin()) return;

  offlineCart = {};
  offlineSelectedCategory = "সব খাবার";
  offlinePaymentMethod = "cod";
  offlineQrActive = false;

  renderOfflineSaleView();
  show("offlineSaleModal");
}

function renderOfflineSaleView() {
  const categoryChips = CATEGORIES.map(category => `
    <button
      type="button"
      class="category-btn ${offlineSelectedCategory === category ? "active" : ""}"
      data-offline-cat="${escapeHTML(category)}"
    >
      ${escapeHTML(category)}
    </button>
  `).join("");

  $("offlineSaleContent").innerHTML = `
    <div class="offline-sale">
      <p class="field-hint">খাবারের ছবি বা কার্ডে চাপ দিলেই তালিকায় যোগ হবে। কাস্টমারের নাম, ফোন বা ঠিকানা বাধ্যতামূলক নয়।</p>

      <div class="menu-categories" id="offlineCategoryChips" style="margin-bottom: 14px;">
        ${categoryChips}
      </div>

      <div class="offline-menu-scroll" id="offlineMenuScroll">
        <div class="offline-pos-grid" id="offlineMenuList"></div>
      </div>

      <div class="dashboard-panel">
        <h3>নির্বাচিত খাবারের তালিকা</h3>
        <div id="offlineCartList"></div>

        <div class="total-line">
          <strong>সর্বমোট</strong>
          <strong id="offlineTotal">${money(0)}</strong>
        </div>

        <label style="margin-top: 10px;">
          পেমেন্ট মাধ্যম নির্বাচন করুন
        </label>
        <div class="offline-payment-options">
          <button
            type="button"
            id="offlinePayCashBtn"
            class="offline-pay-choice ${offlinePaymentMethod === "cod" ? "active" : ""}"
          >
            <i class="fa-solid fa-money-bill-wave"></i>
            Cash Payment
          </button>

          <button
            type="button"
            id="offlinePayQrBtn"
            class="offline-pay-choice ${offlinePaymentMethod === "online_qr" ? "active" : ""}"
          >
            <i class="fa-solid fa-qrcode"></i>
            Online Payment (Bangla QR)
          </button>
        </div>
      </div>

      <button class="gold-btn wide" id="saveOfflineSaleBtn" type="button">
        <i class="fa-solid fa-check-double"></i>
        ${offlinePaymentMethod === "online_qr" ? "Bangla QR দেখুন ও পেমেন্ট কনফার্ম করুন" : "Cash পেমেন্ট কনফার্ম ও রসিদ তৈরি"}
      </button>
    </div>
  `;

  renderOfflineMenu();
  renderOfflineCart();

  $("offlineCategoryChips").onclick = event => {
    const chip = event.target.closest("[data-offline-cat]");
    if (!chip) return;
    offlineSelectedCategory = chip.dataset.offlineCat;
    renderOfflineSaleView();
  };

  $("offlineMenuList").onclick = event => {
    const card = event.target.closest("[data-offline-add]");
    if (!card) return;

    const id = card.dataset.offlineAdd;
    offlineCart[id] = (offlineCart[id] || 0) + 1;
    renderOfflineMenu();
    renderOfflineCart();
  };

  $("offlineCartList").onclick = event => {
    const changeBtn = event.target.closest("[data-offline-change]");
    const removeBtn = event.target.closest("[data-offline-remove]");

    if (changeBtn) {
      const id = changeBtn.dataset.offlineChange;
      const diff = Number(changeBtn.dataset.diff);

      offlineCart[id] = Math.max(0, (offlineCart[id] || 0) + diff);
      if (!offlineCart[id]) delete offlineCart[id];

      renderOfflineMenu();
      renderOfflineCart();
      return;
    }

    if (removeBtn) {
      const id = removeBtn.dataset.offlineRemove;
      delete offlineCart[id];
      renderOfflineMenu();
      renderOfflineCart();
    }
  };

  $("offlinePayCashBtn").onclick = () => {
    offlinePaymentMethod = "cod";
    renderOfflineSaleView();
  };

  $("offlinePayQrBtn").onclick = () => {
    offlinePaymentMethod = "online_qr";
    renderOfflineSaleView();
  };

  $("saveOfflineSaleBtn").onclick = handleOfflinePrimaryAction;
}

function renderOfflineMenu() {
  const container = $("offlineMenuList");
  if (!container) return;

  const items = offlineSelectedCategory === "সব খাবার"
    ? MENU
    : MENU.filter(item => item.category === offlineSelectedCategory);

  container.innerHTML = items.map(item => {
    const qtyInCart = offlineCart[item.id] || 0;
    return `
      <button
        type="button"
        class="offline-pos-card-item ${qtyInCart > 0 ? "in-cart" : ""}"
        data-offline-add="${escapeHTML(item.id)}"
      >
        <div class="offline-pos-thumb">
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
          ${
            qtyInCart > 0
              ? `<span class="offline-qty-badge">${numberBN(qtyInCart)}</span>`
              : ""
          }
        </div>

        <div class="offline-pos-info">
          <strong>${escapeHTML(item.name)}</strong>
          <span>${money(item.price)}</span>
        </div>
      </button>
    `;
  }).join("");
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

            <button
              type="button"
              class="remove-item-btn"
              data-offline-remove="${escapeHTML(item.id)}"
              aria-label="বাদ দিন"
            ><i class="fa-solid fa-trash"></i></button>
          </div>

          <b>${money(item.subtotal)}</b>
        </div>
      `).join("")
    : `<p class="empty-state">খাবারের কার্ডে চাপ দিয়ে তালিকায় যোগ করুন।</p>`;

  const total = rows.reduce((sum, item) => sum + item.subtotal, 0);
  $("offlineTotal").textContent = money(total);
  if ($("saveOfflineSaleBtn")) {
    $("saveOfflineSaleBtn").disabled = !rows.length;
  }
}

async function handleOfflinePrimaryAction() {
  if (!ensureAdmin()) return;

  const rows = offlineRows();
  if (!rows.length) {
    toast("প্রথমে খাবার নির্বাচন করুন।");
    return;
  }

  if (offlinePaymentMethod === "online_qr") {
    const total = rows.reduce((sum, item) => sum + item.subtotal, 0);
    offlineQrActive = true;
    $("qrExactAmount").textContent = money(total);
    $("qrReferenceInput").required = false;
    $("qrReferenceInput").value = "";
    $("qrRefFieldWrap")?.classList.add("hidden");
    $("banglaQrHintText").textContent =
      "Sonali Bank Bangla QR স্ক্যান করে পেমেন্ট যাচাই করুন। Transaction ID প্রয়োজন নেই। পেমেন্ট যাচাই হলে নিচের বাটনে চাপুন।";
    $("confirmQrPaidOrderBtn").innerHTML =
      '<i class="fa-solid fa-check-circle"></i> পেমেন্ট কনফার্ম করুন';

    hide("offlineSaleModal");
    show("banglaQrModal");
    await renderBanglaQrCode(total);
    return;
  }

  await finalizeOfflineSale("cod");
}

async function finalizeOfflineSale(paymentMethodChoice) {
  if (!ensureAdmin()) return;

  const rows = offlineRows();
  if (!rows.length) {
    toast("প্রথমে খাবার নির্বাচন করুন।");
    return;
  }

  const isQr = paymentMethodChoice === "online_qr";
  const button = isQr ? $("confirmQrPaidOrderBtn") : $("saveOfflineSaleBtn");
  setLoading(button, true, "সংরক্ষণ হচ্ছে...");

  try {
    const payload = rows.map(item => ({
      id: item.id,
      quantity: item.qty
    }));

    const { data, error } = await db.rpc(
      "admin_create_offline_sale",
      {
        p_items: payload,
        p_payment_method: isQr ? "online_qr" : "cod"
      }
    );

    if (error) throw error;

    const saleId = typeof data === "string"
      ? data
      : data?.id || data?.sale_id || crypto.randomUUID();

    const totalAmt = rows.reduce((sum, item) => sum + item.subtotal, 0);

    const sale = {
      id: saleId,
      created_at: new Date().toISOString(),
      customer_name: "অফলাইন বিক্রি",
      customer_phone: "",
      customer_address: "",
      status: "completed",
      sale_type: "offline",
      payment_method: isQr ? "online_qr" : "cod",
      payment_status: "paid",
      total_amount: totalAmt
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
    offlineQrActive = false;
    hide("offlineSaleModal");
    hide("banglaQrModal");
    setOfflineReceiptNotification(true);
    show("receiptModal");

    toast("অফলাইন বিক্রি সংরক্ষণ ও রসিদ তৈরি হয়েছে।");

    if ($("dashboardModal")?.classList.contains("show")) {
      await renderAdmin();
    }
  } catch (error) {
    showError(error);
  } finally {
    setLoading(button, false);
  }
}

// ------------------------------------------------------
// SALES REPORT (DAILY, MONTHLY & FULL HISTORY)
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
          মান্থলি সেল রিপোর্ট
        </button>

        <button type="button" id="allTimeReportBtn" class="outline">
          সম্পূর্ণ হিস্টোরি রিপোর্ট
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
        ? `মান্থলি সেল রিপোর্ট (${escapeHTML(date.slice(0, 7))})`
        : "সম্পূর্ণ হিস্টোরি রিপোর্ট";

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

      <h3>সম্পন্ন বিক্রির হিস্টোরি</h3>

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
                    · ${order.sale_type === "offline" ? `অফলাইন (${order.payment_method === "online_qr" ? "QR" : "Cash"})` : "অনলাইন"}
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
// REALTIME, SOUND ALERTS & AUTH
// ------------------------------------------------------

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
        if (!order.id) return;

        const prev = previousOrderSnapshot[order.id] || {};
        previousOrderSnapshot[order.id] = {
          status: order.status,
          payment_status: order.payment_status
        };

        if (profile.role === "admin" && order.sale_type !== "offline") {
          if (payload.eventType === "INSERT") {
            playAdminLoudAlert();
            toast(
              order.payment_status === "pending_verification"
                ? "নতুন অনলাইন পেমেন্ট ভেরিফিকেশনের জন্য এসেছে!"
                : "নতুন অনলাইন অর্ডার এসেছে!"
            );
          } else if (
            order.payment_status === "pending_verification" &&
            prev.payment_status !== "pending_verification"
          ) {
            playAdminLoudAlert();
            toast("একটি পেমেন্ট ভেরিফিকেশনের জন্য এসেছে!");
          }
        }

        if (profile.role === "customer" && order.customer_id === user.id) {
          if (
            order.payment_status === "paid" &&
            prev.payment_status !== "paid"
          ) {
            playCustomerNotifySound("paid");
            toast("আপনার পেমেন্ট ভেরিফাই (PAID) সম্পন্ন হয়েছে!");
          }

          if (order.status && order.status !== prev.status) {
            if (order.status === "confirmed" || order.status === "preparing") {
              playCustomerNotifySound("info");
              toast("আপনার অর্ডার কনফার্ম হয়েছে ও খাবার তৈরি শুরু হয়েছে!");
            } else if (order.status === "out_for_delivery") {
              playCustomerNotifySound("info");
              toast("খাবার রেডি হয়েছে এবং ডেলিভারির জন্য বের হয়েছে!");
            } else if (order.status === "completed") {
              playCustomerNotifySound("completed");
              toast("আপনার অর্ডারের ডেলিভারি সম্পন্ন হয়েছে!");
            } else if (order.status === "cancelled") {
              playCustomerNotifySound("info");
              toast("আপনার অর্ডারটি বাতিল করা হয়েছে।");
            }
          }

          if (order.approval_status === "awaiting_customer") {
            playCustomerNotifySound("info");
            toast("আপনার অর্ডারে পরিবর্তন হয়েছে। ড্যাশবোর্ড দেখুন।");
          }
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

db.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    show("resetPasswordModal");
    return;
  }

  if (event === "SIGNED_OUT") {
    user = null;
    profile = null;
    previousOrderSnapshot = {};

    if (liveChannel) {
      await db.removeChannel(liveChannel);
      liveChannel = null;
    }

    updateHeaderAuthButtons();
    return;
  }

  if (session?.user && !user) {
    user = session.user;

    setTimeout(async () => {
      try {
        await loadProfile();
        subscribeLive();
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
  await fetchStoreStatus();
  subscribeStoreStatus();
  updateHeaderAuthButtons();
  startOrderTimerTicker();
  sendFlutterBridgeCommand("refreshStatus");

  try {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;

    if (data.session) {
      user = data.session.user;

      try {
        await loadProfile();
        subscribeLive();
      } catch (profileError) {
        console.warn("Profile load error:", profileError);
      }
    }
  } catch (error) {
    console.error("Initialization error:", error);
    toast("ওয়েবসাইট সংযোগে সমস্যা হয়েছে।");
  }
})();

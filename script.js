// ==========================================
// PADMA CAFE - CUSTOMER & ADMIN SYSTEM
// Supabase URL এবং Anon Key বসাতে হবে
// কখনো Service Role Key ব্যবহার করবে না
// ==========================================

const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ==========================================
// CURRENCY
// ==========================================

const money = n =>
  `৳${Number(n || 0).toLocaleString("bn-BD")}`;

// ==========================================
// FOOD MENU
// প্রতিটি আইটেমের image URL আলাদা করে পরিবর্তন করা যাবে
// ==========================================

const MENU = [
  {
    id: "malai_cha",
    name: "মালাই চা",
    price: 40,
    image: "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=900"
  },
  {
    id: "dudh_cha",
    name: "দুধ চা",
    price: 30,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900"
  },
  {
    id: "pora_roti_10",
    name: "পোড়া রুটি (৳১০)",
    price: 10,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900"
  },
  {
    id: "pora_roti_15",
    name: "পোড়া রুটি (৳১৫)",
    price: 15,
    image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=900"
  },
  {
    id: "chotpoti",
    name: "চটপটি",
    price: 40,
    image: "https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?w=900"
  },
  {
    id: "chotpoti_egg",
    name: "চটপটি (ডিম)",
    price: 60,
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=900"
  },
  {
    id: "fuchka",
    name: "ফুচকা",
    price: 50,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=900"
  }
];

// ==========================================
// GLOBAL VARIABLES
// ==========================================

let user = null;
let profile = null;
let cart = {};
let authMode = "login";
let liveChannel = null;
let currentApproval = null;

const $ = id => document.getElementById(id);

// ==========================================
// TOAST MESSAGE
// ==========================================

function toast(message) {
  const t = $("toast");

  t.textContent = message;
  t.classList.add("show");

  setTimeout(() => {
    t.classList.remove("show");
  }, 2800);
}

// ==========================================
// MODAL
// ==========================================

function show(id) {
  $(id).classList.add("open");
}

function hide(id) {
  $(id).classList.remove("open");
}

document.querySelectorAll("[data-close]").forEach(button => {
  button.onclick = () => hide(button.dataset.close);
});

// ==========================================
// RENDER FOOD MENU
// ==========================================

function renderMenu() {
  $("menuGrid").innerHTML = MENU.map(item => `
    <article class="menu-card">

      <img
        src="${item.image}"
        alt="${item.name}"
        loading="lazy"
        onerror="this.src='https://placehold.co/700x450/171717/d8b45d?text=Padma+Cafe'"
      >

      <div class="menu-info">

        <h3>${item.name}</h3>

        <div class="menu-price">
          ${money(item.price)}
        </div>

        <button
          class="gold-btn"
          onclick="addCart('${item.id}')"
        >
          কার্টে যোগ করুন
        </button>

      </div>
    </article>
  `).join("");
}

// ==========================================
// CART SYSTEM
// ==========================================

window.addCart = id => {
  cart[id] = (cart[id] || 0) + 1;

  renderCart();
  toast("কার্টে যোগ হয়েছে");
};

function cartRows() {
  return Object.entries(cart)
    .filter(([id, quantity]) => quantity > 0)
    .map(([id, quantity]) => {

      const item = MENU.find(x => x.id === id);

      return {
        ...item,
        qty: quantity,
        subtotal: item.price * quantity
      };
    });
}

function renderCart() {
  const rows = cartRows();

  $("cartCount").textContent =
    rows.reduce((total, item) => total + item.qty, 0);

  $("cartLines").innerHTML = rows.length
    ? rows.map(item => `
      <div class="cart-line">

        <div>
          <b>${item.name}</b>

          <div class="muted">
            ${money(item.price)} × ${item.qty}
            = ${money(item.subtotal)}
          </div>
        </div>

        <div class="qty-controls">

          <button onclick="changeQty('${item.id}',-1)">−</button>

          ${item.qty}

          <button onclick="changeQty('${item.id}',1)">+</button>

        </div>
      </div>
    `).join("")
    : `<div class="empty">কার্ট এখনো খালি</div>`;

  $("cartTotal").textContent = money(
    rows.reduce((total, item) => total + item.subtotal, 0)
  );

  $("checkoutBtn").disabled = !rows.length;
}

window.changeQty = (id, difference) => {

  cart[id] = Math.max(
    0,
    (cart[id] || 0) + difference
  );

  if (!cart[id]) {
    delete cart[id];
  }

  renderCart();
};

$("cartBtn").onclick = () => {
  renderCart();
  show("cartModal");
};

// ==========================================
// LOGIN / REGISTER
// ==========================================

$("accountBtn").onclick = () => {

  if (user) {
    openDashboard();
  } else {
    openAuth("login");
  }

};

function openAuth(mode) {

  authMode = mode;

  $("authTitle").textContent =
    mode === "signup"
      ? "কাস্টমার রেজিস্ট্রেশন"
      : "লগইন";

  ["nameWrap", "phoneWrap", "addressWrap"].forEach(id => {

    $(id).classList.toggle(
      "hidden",
      mode !== "signup"
    );

  });

  $("authSwitchText").textContent =
    mode === "signup"
      ? "আগে অ্যাকাউন্ট আছে?"
      : "নতুন কাস্টমার?";

  $("authSwitch").textContent =
    mode === "signup"
      ? "লগইন করুন"
      : "রেজিস্টার করুন";

  $("authPassword").autocomplete =
    mode === "signup"
      ? "new-password"
      : "current-password";

  show("authModal");
}

$("authSwitch").onclick = () => {

  openAuth(
    authMode === "signup"
      ? "login"
      : "signup"
  );

};

// ==========================================
// AUTH FORM SUBMIT
// ==========================================

$("authForm").onsubmit = async event => {

  event.preventDefault();

  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;

  try {

    if (authMode === "signup") {

      const { data, error } =
        await db.auth.signUp({

          email,
          password,

          options: {
            data: {
              full_name: $("authName").value.trim(),
              phone: $("authPhone").value.trim(),
              address: $("authAddress").value.trim()
            }
          }

        });

      if (error) throw error;

      if (data.session) {

        user = data.user;

        await loadProfile();

      }

      toast(
        "রেজিস্ট্রেশন সম্পন্ন। ইমেইল ভেরিফিকেশন চাইলে ইনবক্স দেখুন।"
      );

      hide("authModal");

    } else {

      const { data, error } =
        await db.auth.signInWithPassword({

          email,
          password

        });

      if (error) throw error;

      user = data.user;

      await loadProfile();

      hide("authModal");

      openDashboard();

    }

  } catch (error) {

    toast(error.message || "লগইন করা যায়নি");

  }

};

// ==========================================
// LOAD CUSTOMER PROFILE
// ==========================================

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

}

async function ensureUser() {

  if (!user) {

    openAuth("login");

    return false;

  }

  return true;

}

// ==========================================
// CHECKOUT / CREATE ORDER
// ==========================================

$("checkoutBtn").onclick = async () => {

  if (!(await ensureUser())) return;

  const rows = cartRows();

  if (!rows.length) return;

  try {

    const total = rows.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const { data: order, error } =
      await db
        .from("orders")
        .insert({

          customer_id: user.id,

          customer_name:
            profile.full_name || user.email,

          customer_phone:
            profile.phone || "",

          customer_address:
            profile.address || "",

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

    const { error: itemError } =
      await db
        .from("order_items")
        .insert(payload);

    if (itemError) throw itemError;

    cart = {};

    renderCart();

    hide("cartModal");

    toast("অর্ডার সফলভাবে পাঠানো হয়েছে");

    openDashboard();

  } catch (error) {

    toast(error.message || "অর্ডার পাঠানো যায়নি");

  }

};

// ==========================================
// ORDER STATUS
// ==========================================

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

// ==========================================
// DASHBOARD
// ==========================================

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

  if (profile.role === "admin") {

    return renderAdmin();

  }

  return renderCustomer();

}

// ==========================================
// FETCH ORDER ITEMS
// ==========================================

async function fetchItems(orderId) {

  const { data, error } = await db
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at");

  if (error) throw error;

  return data || [];

}

// ==========================================
// CUSTOMER DASHBOARD
// ==========================================

async function renderCustomer() {

  const { data, error } = await db
    .from("orders")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", {
      ascending: false
    });

  if (error) throw error;

  if (!data.length) {

    $("dashboardContent").innerHTML =
      '<div class="empty">এখনো কোনো অর্ডার করেননি।</div>';

    return;

  }

  let output = "";

  for (const order of data) {

    const items = await fetchItems(order.id);

    output += `

      <article class="order-card">

        <h3>
          অর্ডার #${order.id.slice(0, 8)}
        </h3>

        <span class="status ${order.status}">
          ${statusLabel(order.status)}
        </span>

        <p class="muted">
          ${new Date(order.created_at).toLocaleString("bn-BD")}
        </p>

        ${items.map(item => `

          <div class="muted">

            ${item.item_name} × ${item.quantity}
            — ${money(item.line_total)}

            ${
              item.item_status === "unavailable"
                ? "(পাওয়া যায়নি)"
                : ""
            }

          </div>

        `).join("")}

        <div class="total-line">

          <b>মোট</b>

          <b>${money(order.total_amount)}</b>

        </div>

        ${
          order.approval_status === "awaiting_customer"
            ? `
              <button
                class="gold-btn wide"
                onclick="openApproval('${order.id}')"
              >
                অর্ডার পরিবর্তনের অনুমতি দিন
              </button>
            `
            : ""
        }

        <button
          class="mini-btn"
          onclick="showReceipt('${order.id}')"
        >
          রসিদ দেখুন
        </button>

      </article>

    `;

  }

  $("dashboardContent").innerHTML = output;

}

// ==========================================
// ADMIN DASHBOARD
// ==========================================

async function renderAdmin() {

  const { data, error } = await db
    .from("orders")
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) throw error;

  if (!data.length) {

    $("dashboardContent").innerHTML =
      '<div class="empty">নতুন অর্ডার নেই।</div>';

    return;

  }

  let output = "";

  for (const order of data) {

    const items = await fetchItems(order.id);

    output += `

      <article class="admin-order">

        <h3>
          অর্ডার #${order.id.slice(0, 8)}
          · ${order.customer_name || "Customer"}
        </h3>

        <span class="status ${order.status}">
          ${statusLabel(order.status)}
        </span>

        <p class="muted">

          ফোন: ${order.customer_phone || "—"}

          <br>

          ঠিকানা: ${order.customer_address || "—"}

        </p>

        ${items.map(item => `

          <div class="approval-item">

            ${item.item_name} × ${item.quantity}

            — ${money(item.line_total)}

            ${
              item.item_status === "unavailable"
                ? "· পাওয়া যায়নি"
                : ""
            }

            ${
              order.status === "pending" &&
              item.item_status === "active"
                ? `
                  <button
                    class="mini-btn"
                    onclick="markUnavailable('${item.id}')"
                  >
                    স্টক নেই
                  </button>
                `
                : ""
            }

          </div>

        `).join("")}

        <div class="total-line">

          <b>মোট</b>

          <b>${money(order.total_amount)}</b>

        </div>

        <div class="order-actions">

          ${
            order.status === "pending"
              ? `
                <button
                  class="gold-btn"
                  onclick="adminStatus('${order.id}','confirmed')"
                >
                  কনফার্ম
                </button>

                <button
                  class="danger-btn"
                  onclick="adminStatus('${order.id}','cancelled')"
                >
                  অর্ডার বাতিল
                </button>
              `
              : ""
          }

          <button
            class="mini-btn"
            onclick="showReceipt('${order.id}')"
          >
            রসিদ
          </button>

        </div>

        ${
          order.approval_status === "awaiting_customer"
            ? `
              <p class="muted">
                কাস্টমারের অনুমতির অপেক্ষায়।
              </p>
            `
            : ""
        }

        ${
          order.approval_status === "accepted"
            ? `
              <p class="muted">
                কাস্টমার বাকি আইটেমগুলো গ্রহণ করেছেন।
                এখন অর্ডার কনফার্ম করুন।
              </p>
            `
            : ""
        }

      </article>

    `;

  }

  $("dashboardContent").innerHTML = output;

}

// ==========================================
// ADMIN CONFIRM / CANCEL ORDER
// ==========================================

window.adminStatus = async (id, status) => {

  const { error } = await db
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) {

    toast(error.message);

  } else {

    toast("অর্ডার আপডেট হয়েছে");

    renderDashboard();

  }

};

// ==========================================
// ADMIN MARK ITEM UNAVAILABLE
// ==========================================

window.markUnavailable = async itemId => {

  try {

    const { data, error } = await db.rpc(
      "admin_mark_item_unavailable",
      {
        p_item_id: itemId
      }
    );

    if (error) throw error;

    toast("কাস্টমারের অনুমতির জন্য আপডেট পাঠানো হয়েছে");

    await renderDashboard();

  } catch (error) {

    toast(error.message);

  }

};

// ==========================================
// CUSTOMER PARTIAL ORDER APPROVAL
// ==========================================

window.openApproval = async orderId => {

  const { data, error } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) {

    toast(error.message);

    return;

  }

  const items = await fetchItems(orderId);

  currentApproval = orderId;

  $("approvalMessage").textContent =
    "দুঃখিত, আপনার অর্ডারের কিছু আইটেম পাওয়া যাচ্ছে না। নিচে সংশোধিত অর্ডারটি দেখুন।";

  $("approvalItems").innerHTML = items.map(item => `

    <div class="approval-item">

      ${item.item_name} × ${item.quantity}

      — ${money(item.line_total)}

      ${
        item.item_status === "unavailable"
          ? "· পাওয়া যাচ্ছে না"
          : ""
      }

    </div>

  `).join("");

  $("approvalTotal").textContent =
    money(data.total_amount);

  show("approvalModal");

};

// ==========================================
// CUSTOMER ACCEPT REMAINING ITEMS
// ==========================================

$("approveRemaining").onclick = async () => {

  const { error } = await db.rpc(
    "customer_approve_remaining_order",
    {
      p_order_id: currentApproval
    }
  );

  if (error) {

    toast(error.message);

  } else {

    hide("approvalModal");

    toast("বাকি আইটেমগুলো গ্রহণ করেছেন");

    renderDashboard();

  }

};

// ==========================================
// CUSTOMER CANCEL WHOLE ORDER
// ==========================================

$("cancelWholeOrder").onclick = async () => {

  const { error } = await db.rpc(
    "customer_cancel_changed_order",
    {
      p_order_id: currentApproval
    }
  );

  if (error) {

    toast(error.message);

  } else {

    hide("approvalModal");

    toast("সম্পূর্ণ অর্ডার বাতিল হয়েছে");

    renderDashboard();

  }

};

// ==========================================
// RECEIPT
// ==========================================

window.showReceipt = async id => {

  const { data: order, error } = await db
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {

    toast(error.message);

    return;

  }

  const items = await fetchItems(id);

  $("receiptContent").innerHTML = `

    <div class="receipt">

      <h2>PADMA CAFE</h2>

      <p>অর্ডার রসিদ</p>

      <p>

        অর্ডার: ${id.slice(0, 8)}

        <br>

        ${new Date(order.created_at).toLocaleString()}

      </p>

      <p>

        নাম: ${order.customer_name || ""}

        <br>

        ফোন: ${order.customer_phone || ""}

        <br>

        ঠিকানা: ${order.customer_address || ""}

      </p>

      <table>

        <tr>

          <th>আইটেম</th>

          <th>পরিমাণ</th>

          <th>মূল্য</th>

        </tr>

        ${items.map(item => `

          <tr>

            <td>

              ${item.item_name}

              ${
                item.item_status === "unavailable"
                  ? "(বাদ)"
                  : ""
              }

            </td>

            <td>${item.quantity}</td>

            <td>${money(item.line_total)}</td>

          </tr>

        `).join("")}

      </table>

      <p class="rtotal">

        সর্বমোট: ${money(order.total_amount)}

      </p>

      <p>ধন্যবাদ, আবার আসবেন।</p>

    </div>

  `;

  show("receiptModal");

};

$("printReceipt").onclick = () => {

  window.print();

};

// ==========================================
// REALTIME ORDER NOTIFICATION
// ==========================================

function subscribeLive() {

  if (liveChannel) {

    db.removeChannel(liveChannel);

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

        if (
          profile.role === "admin" ||
          payload.new?.customer_id === user.id
        ) {

          await renderDashboard();

          if (
            profile.role === "admin" &&
            payload.eventType === "INSERT"
          ) {

            playAlert();

          }

          if (
            profile.role !== "admin" &&
            payload.new?.approval_status === "awaiting_customer"
          ) {

            toast(
              "আপনার অর্ডারে পরিবর্তন হয়েছে—ড্যাশবোর্ড দেখুন"
            );

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

      () => renderDashboard()

    )

    .subscribe();

}

// ==========================================
// SOUND ALERT FOR ADMIN
// ==========================================

let audioCtx;

function playAlert() {

  try {

    audioCtx = audioCtx ||
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

    if (audioCtx.state === "suspended") {

      audioCtx.resume();

    }

    [0, 0.22, 0.44].forEach(time => {

      const oscillator =
        audioCtx.createOscillator();

      const gain =
        audioCtx.createGain();

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

      oscillator.start(
        audioCtx.currentTime + time
      );

      oscillator.stop(
        audioCtx.currentTime + time + 0.17
      );

    });

  } catch (error) {

    console.info(
      "Sound needs browser interaction",
      error
    );

  }

}

// ==========================================
// LOGOUT
// ==========================================

$("logoutBtn").onclick = async () => {

  await db.auth.signOut();

  user = null;

  profile = null;

  if (liveChannel) {

    db.removeChannel(liveChannel);

  }

  hide("dashboardModal");

  $("accountBtn").textContent =
    "লগইন / রেজিস্টার";

  toast("লগআউট হয়েছে");

};

// ==========================================
// INITIALIZE WEBSITE
// ==========================================

(async () => {

  renderMenu();

  renderCart();

  if (
    SUPABASE_URL.startsWith("https://") &&
    !SUPABASE_ANON_KEY.startsWith("YOUR_")
  ) {

    const { data } = await db.auth.getSession();

    if (data.session) {

      user = data.session.user;

      try {

        await loadProfile();

      } catch (error) {

        console.warn(error);

      }

    }

  } else {

    toast(
      "প্রথমে script.js-এ Supabase URL ও Anon Key বসান"
    );

  }

})();

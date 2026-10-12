// طبقة البيانات: محتوى الموقع، سجل النشاط، وسلة المتجر.
// في نسخة العرض الحفظ في متصفح الجهاز (localStorage). عند النشر تُستبدل
// دوال القراءة والحفظ هنا بنداءات لخادم وقاعدة بيانات، والباقي يبقى كما هو.
import { useSyncExternalStore } from 'react';
import * as defaults from './data/club.js';

const SITE_KEY = 'den.site.v4';
const LOG_KEY = 'den.log.v1';
const CART_KEY = 'den.cart.v1';

const base = {
  club: defaults.club,
  hero: defaults.hero,
  theme: defaults.theme,
  plans: defaults.plans,
  features: defaults.features,
  programs: defaults.programs,
  gallery: defaults.gallery,
  shop: defaults.shop,
  products: defaults.products,
  referral: defaults.referral,
  reviews: defaults.reviews,
};
// days: عدد الزيارات لكل يوم بصيغة YYYY-MM-DD. demo: السجل مملوء ببيانات تجريبية.
const emptyLog = { leads: [], codes: [], orders: [], subs: [], clicks: {}, visits: 0, days: {}, demo: false };

export const dayKey = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // التخزين غير متاح (وضع خاص مثلاً): التغيير يبقى للجلسة الحالية فقط.
  }
}

let saved = read(SITE_KEY, {});
let site = { ...base, ...saved };
let log = { ...emptyLog, ...read(LOG_KEY, {}) };
let cart = read(CART_KEY, []);
let cartOpen = false;

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// تعديل من تبويب آخر (لوحة المالك مثلاً) ينعكس هنا مباشرة.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (![SITE_KEY, LOG_KEY, CART_KEY].includes(event.key)) return;
    saved = read(SITE_KEY, {});
    site = { ...base, ...saved };
    log = { ...emptyLog, ...read(LOG_KEY, {}) };
    cart = read(CART_KEY, []);
    emit();
  });
}

/* ---------- محتوى الموقع ---------- */
export const getSite = () => site;
export const useSite = () => useSyncExternalStore(subscribe, getSite);

export function updateSite(section, value) {
  saved = { ...saved, [section]: value };
  site = { ...base, ...saved };
  write(SITE_KEY, saved);
  emit();
}
export function resetSite() {
  saved = {};
  site = { ...base };
  write(SITE_KEY, saved);
  emit();
}

/* ---------- سجل النشاط ---------- */
const getLog = () => log;
export const useLog = () => useSyncExternalStore(subscribe, getLog);

function setLog(next) {
  log = next;
  write(LOG_KEY, log);
  emit();
}
const stamp = () => new Date().toISOString();
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function addLead(lead) {
  setLog({ ...log, leads: [{ id: newId(), at: stamp(), done: false, ...lead }, ...log.leads] });
}
export function toggleLead(id) {
  setLog({ ...log, leads: log.leads.map((l) => (l.id === id ? { ...l, done: !l.done } : l)) });
}
export function removeLead(id) {
  setLog({ ...log, leads: log.leads.filter((l) => l.id !== id) });
}

export function addCode(phone, code) {
  if (log.codes.some((c) => c.code === code)) return;
  setLog({ ...log, codes: [{ code, phone, at: stamp(), uses: 0 }, ...log.codes] });
}
export function setCodeUses(code, uses) {
  setLog({
    ...log,
    codes: log.codes.map((c) => (c.code === code ? { ...c, uses: Math.max(0, uses) } : c)),
  });
}

export function trackPlanClick(planId) {
  setLog({ ...log, clicks: { ...log.clicks, [planId]: (log.clicks[planId] || 0) + 1 } });
}
// زيارة واحدة لكل جلسة تصفح.
export function trackVisit() {
  try {
    if (sessionStorage.getItem('den.visited')) return;
    sessionStorage.setItem('den.visited', '1');
  } catch {
    return;
  }
  const today = dayKey(new Date());
  setLog({
    ...log,
    visits: log.visits + 1,
    days: { ...log.days, [today]: (log.days[today] || 0) + 1 },
  });
}
export function clearLog() {
  setLog({ ...emptyLog });
}

// يملأ السجل بنشاط تجريبي لآخر 28 يوماً حتى تظهر اللوحة كما ستكون بعد التشغيل.
// الأرقام مولّدة وليست بيانات حقيقية، واللوحة تعرض تنبيهاً بذلك.
export function seedDemo() {
  const { plans, products } = site;
  const DAY = 86400000;
  const now = Date.now();
  // لحظة داخل الأسبوع (week) موزعة بالتساوي على عدد العناصر.
  const moment = (week, index, count) =>
    new Date(now - (week * 7 + ((index + 0.5) * 7) / count) * DAY);

  const days = {};
  let visits = 0;
  for (let ago = 27; ago >= 0; ago--) {
    const step = 27 - ago;
    const count = 16 + Math.round(step * 0.9) + (step % 7 > 4 ? 9 : 0);
    days[dayKey(new Date(now - ago * DAY))] = count;
    visits += count;
  }

  // عدد العناصر لكل أسبوع، من هذا الأسبوع إلى قبل ثلاثة أسابيع: نمو هادئ.
  const weekly = { subs: [5, 4, 3, 3], orders: [6, 5, 4, 3], leads: [7, 6, 5, 4] };
  const reasons = ['حصة تجريبية', 'اشتراك جديد', 'استفسار'];
  const leads = [];
  const subs = [];
  const orders = [];

  for (let week = 3; week >= 0; week--) {
    for (let i = weekly.leads[week] - 1; i >= 0; i--) {
      const date = moment(week, i, weekly.leads[week]);
      leads.unshift({
        id: newId(),
        at: date.toISOString(),
        done: week > 0 || i > 2,
        name: `عميل تجريبي ${leads.length + 1}`,
        phone: '0500000000',
        reason: reasons[(week + i) % 3],
        note: '',
      });
    }
    for (let i = weekly.subs[week] - 1; plans.length && i >= 0; i--) {
      const date = moment(week, i, weekly.subs[week]);
      const plan = plans[(week + i) % plans.length];
      subs.unshift({
        id: newId(),
        no: 2001 + subs.length,
        at: date.toISOString(),
        status: week === 0 && i === 0 ? 'new' : 'active',
        planId: plan.id,
        plan: plan.title,
        price: Number(plan.price) || 0,
        months: plan.paid + plan.gift,
        start: dayKey(date),
        name: `عميل تجريبي ${subs.length + 1}`,
        phone: '0500000000',
        code: '',
        codeOk: false,
        pay: i % 2 ? 'online' : 'club',
      });
    }
    for (let i = weekly.orders[week] - 1; products.length && i >= 0; i--) {
      const date = moment(week, i, weekly.orders[week]);
      const product = products[(week * 2 + i) % products.length];
      const qty = 1 + (i % 2);
      const delivery = i % 3 === 0;
      const fee = delivery ? Number(site.shop.deliveryFee) || 0 : 0;
      const subtotal = (Number(product.price) || 0) * qty;
      orders.unshift({
        id: newId(),
        no: 1001 + orders.length,
        at: date.toISOString(),
        status: week > 0 ? 'done' : i === 0 ? 'new' : i === 1 ? 'ready' : 'done',
        items: [{ name: product.name, size: product.sizes?.[1] || '', qty, price: Number(product.price) || 0 }],
        subtotal,
        fee,
        total: subtotal + fee,
        method: delivery ? 'delivery' : 'pickup',
        address: delivery ? 'عنوان تجريبي' : '',
        name: `عميل تجريبي ${orders.length + 1}`,
        phone: '0500000000',
      });
    }
  }

  const clicks = {};
  plans.forEach((plan, i) => {
    clicks[plan.id] = [14, 41, 27][i % 3];
  });
  setLog({ ...emptyLog, leads, subs, orders, days, visits, clicks, demo: true });
}

/* ---------- طلبات الاشتراك ---------- */
export function addSubscription(sub) {
  const no = 2001 + log.subs.length;
  setLog({ ...log, subs: [{ id: newId(), no, at: stamp(), status: 'new', ...sub }, ...log.subs] });
  return no;
}
export function setSubStatus(id, status) {
  setLog({ ...log, subs: log.subs.map((s) => (s.id === id ? { ...s, status } : s)) });
}
export function removeSub(id) {
  setLog({ ...log, subs: log.subs.filter((s) => s.id !== id) });
}

/* ---------- السلة ---------- */
const getCart = () => cart;
export const useCart = () => useSyncExternalStore(subscribe, getCart);
const getCartOpen = () => cartOpen;
export const useCartOpen = () => useSyncExternalStore(subscribe, getCartOpen);
export function setCartOpen(open) {
  cartOpen = open;
  emit();
}

function setCart(next) {
  cart = next;
  write(CART_KEY, cart);
  emit();
}
// سطر السلة يُعرّف بالمنتج والمقاس معاً.
const lineKey = (productId, size) => `${productId}:${size || ''}`;

export function addToCart(productId, size) {
  const key = lineKey(productId, size);
  const found = cart.find((l) => l.key === key);
  setCart(
    found
      ? cart.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l))
      : [...cart, { key, productId, size: size || '', qty: 1 }],
  );
}
export function setLineQty(key, qty) {
  setCart(qty < 1 ? cart.filter((l) => l.key !== key) : cart.map((l) => (l.key === key ? { ...l, qty } : l)));
}
export function clearCart() {
  setCart([]);
}

// سطور السلة مع بيانات المنتج الحالية. المنتج المحذوف من المتجر يسقط من السلة.
export function cartLines(currentCart, products) {
  return currentCart
    .map((line) => {
      const product = products.find((p) => p.id === line.productId);
      return product ? { ...line, name: product.name, price: Number(product.price) || 0 } : null;
    })
    .filter(Boolean);
}

/* ---------- طلبات المتجر ---------- */
export function placeOrder(order) {
  const no = 1001 + log.orders.length;
  setLog({ ...log, orders: [{ id: newId(), no, at: stamp(), status: 'new', ...order }, ...log.orders] });
  clearCart();
  return no;
}
export function setOrderStatus(id, status) {
  setLog({ ...log, orders: log.orders.map((o) => (o.id === id ? { ...o, status } : o)) });
}
export function removeOrder(id) {
  setLog({ ...log, orders: log.orders.filter((o) => o.id !== id) });
}

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
const emptyLog = { leads: [], codes: [], orders: [], subs: [], clicks: {}, visits: 0 };

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
  setLog({ ...log, visits: log.visits + 1 });
}
export function clearLog() {
  setLog({ ...emptyLog });
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

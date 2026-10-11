import { useEffect, useState } from 'react';
import { Field } from '@base-ui/react/field';
import { Switch } from '@base-ui/react/switch';
import { Tabs } from '@base-ui/react/tabs';
import {
  clearLog,
  removeLead,
  removeOrder,
  removeSub,
  resetSite,
  setCodeUses,
  setOrderStatus,
  setSubStatus,
  toggleLead,
  updateSite,
  useLog,
  useSite,
} from '../store.js';

const accents = [
  { name: 'بني', value: '#9a6a3c' },
  { name: 'رصاصي', value: '#9ea3aa' },
  { name: 'أخضر', value: '#1fb866' },
  { name: 'ذهبي', value: '#f5b400' },
  { name: 'أحمر', value: '#e5252a' },
  { name: 'أزرق', value: '#2f7bff' },
  { name: 'فضي', value: '#c9ccd1' },
];

const orderStatuses = [
  { id: 'new', label: 'جديد' },
  { id: 'ready', label: 'جاهز' },
  { id: 'done', label: 'تم التسليم' },
  { id: 'cancelled', label: 'ملغي' },
];
const money = (n) => Number(n).toLocaleString('en');

const when = (iso) =>
  new Date(iso).toLocaleString('ar-SA-u-nu-latn-ca-gregory', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

/* ---------- عناصر صغيرة مشتركة ---------- */
function Text({ label, value, onChange, ltr, area, type = 'text', hint }) {
  return (
    <Field.Root className="a-field">
      <Field.Label className="label">{label}</Field.Label>
      <Field.Control
        className={`input ${ltr ? 'is-ltr' : ''} ${area ? 'is-area' : ''}`}
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        render={area ? <textarea rows={3} /> : undefined}
      />
      {hint && <Field.Description className="a-hint">{hint}</Field.Description>}
    </Field.Root>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="a-toggle">
      <Switch.Root className="switch" checked={checked} onCheckedChange={onChange}>
        <Switch.Thumb className="switch-thumb" />
      </Switch.Root>
      <span>{label}</span>
    </label>
  );
}

// زر الحذف يطلب ضغطة ثانية خلال ثلاث ثوانٍ.
function Confirm({ children, onConfirm, className = 'a-danger' }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const id = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(id);
  }, [armed]);
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (armed) onConfirm();
        setArmed(!armed);
      }}
    >
      {armed ? 'اضغط مرة ثانية للتأكيد' : children}
    </button>
  );
}

function Stat({ label, value, note }) {
  return (
    <div className="a-stat">
      <p>{label}</p>
      <strong className="num">{value}</strong>
      {note && <span>{note}</span>}
    </div>
  );
}

/* ---------- نظرة عامة ---------- */
function Overview() {
  const { plans } = useSite();
  const log = useLog();
  const waiting = log.leads.filter((l) => !l.done).length;
  const clicks = plans.map((p) => ({ ...p, count: log.clicks[p.id] || 0 }));
  const most = Math.max(1, ...clicks.map((c) => c.count));
  const used = log.codes.reduce((sum, c) => sum + c.uses, 0);
  const live = log.orders.filter((o) => o.status !== 'cancelled');
  const sales = live.reduce((sum, o) => sum + o.total, 0);
  const fresh = log.orders.filter((o) => o.status === 'new').length;

  return (
    <>
      <div className="a-stats">
        <Stat label="زيارات الموقع" value={log.visits} />
        <Stat
          label="طلبات الاشتراك"
          value={log.subs.length}
          note={`${log.subs.filter((s) => s.status === 'new').length} جديد`}
        />
        <Stat label="طلبات المتجر" value={log.orders.length} note={`${fresh} جديد`} />
        <Stat label="مبيعات المتجر (ريال)" value={money(sales)} note="بدون الملغي" />
        <Stat label="طلبات التواصل" value={log.leads.length} note={`${waiting} بانتظار الرد`} />
        <Stat label="أكواد الإحالة" value={log.codes.length} note={`${used} اشتراك عن طريقها`} />
        <Stat
          label="ضغطات زر الاشتراك"
          value={clicks.reduce((sum, c) => sum + c.count, 0)}
        />
      </div>

      <section className="a-card">
        <h2>أي باقة تجذب أكثر؟</h2>
        {clicks.map((c) => (
          <div className="a-meter" key={c.id}>
            <span>{c.title}</span>
            <div>
              <i style={{ width: `${(c.count / most) * 100}%` }} />
            </div>
            <b className="num">{c.count}</b>
          </div>
        ))}
      </section>

      <section className="a-card">
        <h2>آخر الطلبات</h2>
        {log.leads.length === 0 ? (
          <p className="a-empty">ما فيه طلبات إلى الآن. أول ما أحد يعبي نموذج التواصل يطلع هنا.</p>
        ) : (
          <ul className="a-list">
            {log.leads.slice(0, 4).map((l) => (
              <li key={l.id}>
                <b>{l.name}</b>
                <span>{l.reason}</span>
                <span className="a-muted">{when(l.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/* ---------- الطلبات ---------- */
function Leads() {
  const { leads } = useLog();
  if (leads.length === 0) {
    return <p className="a-empty">ما فيه طلبات إلى الآن.</p>;
  }
  return (
    <ul className="a-rows">
      {leads.map((l) => (
        <li key={l.id} className={l.done ? 'a-row is-done' : 'a-row'}>
          <div className="a-row-main">
            <b>{l.name}</b>
            <a className="num" href={`tel:${l.phone}`}>
              {l.phone}
            </a>
            <span className="a-tag">{l.reason}</span>
            <span className="a-muted">{when(l.at)}</span>
          </div>
          {l.note && <p className="a-note">{l.note}</p>}
          <div className="a-row-actions">
            <a
              className="a-link"
              href={`https://wa.me/966${l.phone.slice(1)}`}
              target="_blank"
              rel="noopener"
            >
              راسله واتساب
            </a>
            <Toggle label="تم التواصل" checked={l.done} onChange={() => toggleLead(l.id)} />
            <Confirm onConfirm={() => removeLead(l.id)}>حذف</Confirm>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- طلبات المتجر ---------- */
function Orders() {
  const { orders } = useLog();
  if (orders.length === 0) {
    return <p className="a-empty">ما فيه طلبات من المتجر إلى الآن.</p>;
  }
  return (
    <ul className="a-rows">
      {orders.map((o) => (
        <li key={o.id} className={o.status === 'done' || o.status === 'cancelled' ? 'a-row is-done' : 'a-row'}>
          <div className="a-row-main">
            <b className="num">#{o.no}</b>
            <b>{o.name}</b>
            <a className="num" href={`tel:${o.phone}`}>
              {o.phone}
            </a>
            <span className="a-tag">{o.method === 'delivery' ? 'توصيل' : 'استلام من النادي'}</span>
            <span className="a-muted">{when(o.at)}</span>
          </div>
          <p className="a-note">
            {o.items.map((i) => `${i.qty} × ${i.name}${i.size ? ` (${i.size})` : ''}`).join('، ')}
          </p>
          {o.method === 'delivery' && <p className="a-note">العنوان: {o.address}</p>}
          <p>
            الإجمالي: <b className="num">{money(o.total)}</b> ريال
            {o.fee > 0 && (
              <span className="a-muted">
                {' '}
                (منها <span className="num">{money(o.fee)}</span> توصيل)
              </span>
            )}
          </p>
          <div className="a-row-actions">
            <div className="a-pills" role="radiogroup" aria-label={`حالة الطلب ${o.no}`}>
              {orderStatuses.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  role="radio"
                  aria-checked={o.status === s.id}
                  className={o.status === s.id ? 'is-on' : ''}
                  onClick={() => setOrderStatus(o.id, s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <a className="a-link" href={`https://wa.me/966${o.phone.slice(1)}`} target="_blank" rel="noopener">
              راسله واتساب
            </a>
            <Confirm onConfirm={() => removeOrder(o.id)}>حذف</Confirm>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- طلبات الاشتراك ---------- */
const subStatuses = [
  { id: 'new', label: 'جديد' },
  { id: 'active', label: 'مفعّل' },
  { id: 'cancelled', label: 'ملغي' },
];

function Subs() {
  const { subs } = useLog();
  if (subs.length === 0) {
    return <p className="a-empty">ما فيه طلبات اشتراك إلى الآن.</p>;
  }
  return (
    <ul className="a-rows">
      {subs.map((s) => (
        <li key={s.id} className={s.status === 'cancelled' ? 'a-row is-done' : 'a-row'}>
          <div className="a-row-main">
            <b className="num">#{s.no}</b>
            <b>{s.name}</b>
            <a className="num" href={`tel:${s.phone}`}>
              {s.phone}
            </a>
            <span className="a-tag">{s.pay === 'online' ? 'دفع أونلاين' : 'دفع في النادي'}</span>
            <span className="a-muted">{when(s.at)}</span>
          </div>
          <p className="a-note">
            {s.plan}، <span className="num">{money(s.price)}</span> ريال، يبدأ{' '}
            <span className="num">{s.start}</span>
          </p>
          {s.code && (
            <p className={s.codeOk ? 'a-ok' : 'a-bad'}>
              كود الإحالة: <span className="num">{s.code}</span>{' '}
              {s.codeOk ? '(صحيح، طبّق الخصم للطرفين)' : '(غير موجود في السجل)'}
            </p>
          )}
          <div className="a-row-actions">
            <div className="a-pills" role="radiogroup" aria-label={`حالة الاشتراك ${s.no}`}>
              {subStatuses.map((st) => (
                <button
                  type="button"
                  key={st.id}
                  role="radio"
                  aria-checked={s.status === st.id}
                  className={s.status === st.id ? 'is-on' : ''}
                  onClick={() => setSubStatus(s.id, st.id)}
                >
                  {st.label}
                </button>
              ))}
            </div>
            <a className="a-link" href={`https://wa.me/966${s.phone.slice(1)}`} target="_blank" rel="noopener">
              راسله واتساب
            </a>
            <Confirm onConfirm={() => removeSub(s.id)}>حذف</Confirm>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- المنتجات ---------- */
function ProductsEditor() {
  const { products, shop } = useSite();
  const set = (i, patch) =>
    updateSite(
      'products',
      products.map((p, n) => (n === i ? { ...p, ...patch } : p)),
    );
  const add = () =>
    updateSite('products', [
      ...products,
      { id: `p-${Date.now()}`, name: 'منتج جديد', category: 'gear', price: 0 },
    ]);

  return (
    <>
      <section className="a-card">
        <h2>التوصيل والاستلام</h2>
        <div className="a-grid">
          <Text
            label="رسوم التوصيل (ريال)"
            type="number"
            value={shop.deliveryFee}
            onChange={(v) => updateSite('shop', { ...shop, deliveryFee: Math.max(0, v) })}
            ltr
          />
          <Text
            label="ملاحظة التوصيل"
            value={shop.deliveryNote}
            onChange={(v) => updateSite('shop', { ...shop, deliveryNote: v })}
          />
        </div>
        <Text
          label="ملاحظة الاستلام من النادي"
          value={shop.pickupNote}
          onChange={(v) => updateSite('shop', { ...shop, pickupNote: v })}
        />
      </section>

      {products.map((p, i) => (
        <section className="a-card" key={p.id}>
          <div className="a-grid">
            <Text label="اسم المنتج" value={p.name} onChange={(v) => set(i, { name: v })} />
            <Text label="السعر (ريال)" type="number" value={p.price} onChange={(v) => set(i, { price: Math.max(0, v) })} ltr />
            <Text
              label="المقاسات (افصل بينها بفاصلة، واتركها فاضية لو ما له مقاس)"
              value={(p.sizes || []).join(', ')}
              onChange={(v) => set(i, { sizes: v.split(/[،,]/).map((s) => s.trim()).filter(Boolean) })}
              ltr
            />
            <Text label="رابط صورة المنتج" value={p.image} onChange={(v) => set(i, { image: v })} ltr />
          </div>
          <div className="a-row-actions">
            <div className="a-pills" role="radiogroup" aria-label={`قسم ${p.name}`}>
              {[
                { id: 'gear', label: 'أطقم' },
                { id: 'fuel', label: 'مكملات' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  role="radio"
                  aria-checked={p.category === c.id}
                  className={p.category === c.id ? 'is-on' : ''}
                  onClick={() => set(i, { category: c.id })}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <Confirm onConfirm={() => updateSite('products', products.filter((_, n) => n !== i))}>
              حذف المنتج
            </Confirm>
          </div>
        </section>
      ))}
      <button type="button" className="btn btn-ghost" onClick={add}>
        أضف منتج
      </button>
    </>
  );
}

/* ---------- أكواد الإحالة ---------- */
function Codes() {
  const { codes } = useLog();
  const { referral } = useSite();
  const [query, setQuery] = useState('');
  const wanted = query.trim().toUpperCase();
  const match = wanted ? codes.find((c) => c.code === wanted) : null;

  return (
    <>
      <section className="a-card">
        <h2>تحقق من كود</h2>
        <p className="a-muted">الموظف يكتب الكود اللي جابه العميل الجديد قبل ما يطبق الخصم.</p>
        <Text label="الكود" value={query} onChange={setQuery} ltr />
        {wanted && (
          <p className={match ? 'a-ok' : 'a-bad'} role="status">
            {match
              ? `كود صحيح، صاحبه ${match.phone}. طبّق الخصم${referral.discount ? ` (${referral.discount})` : ''} للطرفين ثم زد عدد الاستخدام.`
              : 'الكود غير موجود.'}
          </p>
        )}
      </section>

      {codes.length === 0 ? (
        <p className="a-empty">ما أحد طلّع كود إلى الآن.</p>
      ) : (
        <ul className="a-rows">
          {codes.map((c) => (
            <li key={c.code} className="a-row">
              <div className="a-row-main">
                <b className="num">{c.code}</b>
                <span className="num">{c.phone}</span>
                <span className="a-muted">{when(c.at)}</span>
              </div>
              <div className="a-row-actions">
                <span>اشتراكات عن طريقه</span>
                <div className="a-stepper">
                  <button type="button" onClick={() => setCodeUses(c.code, c.uses - 1)} aria-label="نقص">
                    −
                  </button>
                  <b className="num">{c.uses}</b>
                  <button type="button" onClick={() => setCodeUses(c.code, c.uses + 1)} aria-label="زيادة">
                    +
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ---------- الاشتراكات ---------- */
function PlansEditor() {
  const { plans } = useSite();
  const set = (i, patch) =>
    updateSite(
      'plans',
      plans.map((p, n) => (n === i ? { ...p, ...patch } : p)),
    );
  const add = () =>
    updateSite('plans', [
      ...plans,
      { id: `plan-${Date.now()}`, title: 'باقة جديدة', paid: 1, gift: 0, price: 0, note: '', url: '' },
    ]);

  return (
    <>
      {plans.map((p, i) => (
        <section className="a-card" key={p.id}>
          <div className="a-grid">
            <Text label="اسم الباقة" value={p.title} onChange={(v) => set(i, { title: v })} />
            <Text label="السعر (ريال)" type="number" value={p.price} onChange={(v) => set(i, { price: v })} ltr />
            <Text label="الشهور المدفوعة" type="number" value={p.paid} onChange={(v) => set(i, { paid: Math.max(1, v) })} ltr />
            <Text label="الشهور الهدية" type="number" value={p.gift} onChange={(v) => set(i, { gift: Math.max(0, v) })} ltr />
            <Text label="الشارة فوق الاسم" value={p.note} onChange={(v) => set(i, { note: v })} />
            <Text label="رابط الدفع" value={p.url} onChange={(v) => set(i, { url: v })} ltr />
          </div>
          <div className="a-row-actions">
            <Toggle label="باقة مميزة" checked={!!p.featured} onChange={(v) => set(i, { featured: v })} />
            <Confirm onConfirm={() => updateSite('plans', plans.filter((_, n) => n !== i))}>
              حذف الباقة
            </Confirm>
          </div>
        </section>
      ))}
      <button type="button" className="btn btn-ghost" onClick={add}>
        أضف باقة
      </button>
    </>
  );
}

/* ---------- بيانات النادي ---------- */
function ClubEditor() {
  const { club, hero, theme, referral } = useSite();
  const setClub = (patch) => updateSite('club', { ...club, ...patch });

  return (
    <>
      <section className="a-card">
        <h2>معلومات التواصل</h2>
        <div className="a-grid">
          <Text label="اسم النادي" value={club.name} onChange={(v) => setClub({ name: v })} />
          <Text label="المدينة" value={club.city} onChange={(v) => setClub({ city: v })} />
          <Text label="العنوان" value={club.address} onChange={(v) => setClub({ address: v })} />
          <Text label="الدوام" value={club.hours} onChange={(v) => setClub({ hours: v })} />
          <Text
            label="رقم واتساب النادي"
            value={club.whatsapp}
            onChange={(v) => setClub({ whatsapp: v.replace(/[^\d]/g, '') })}
            hint="بالصيغة الدولية بدون +، مثال: 9665XXXXXXXX"
            ltr
          />
          <Text label="رابط خرائط قوقل" value={club.mapsUrl} onChange={(v) => setClub({ mapsUrl: v })} ltr />
          <Text
            label="حساب إنستقرام"
            value={club.instagram.handle}
            onChange={(v) => setClub({ instagram: { ...club.instagram, handle: v } })}
            ltr
          />
          <Text
            label="رابط إنستقرام"
            value={club.instagram.url}
            onChange={(v) => setClub({ instagram: { ...club.instagram, url: v } })}
            ltr
          />
        </div>
      </section>

      <section className="a-card">
        <h2>الواجهة الرئيسية</h2>
        <div className="a-grid">
          <Text label="العنوان، السطر الأول" value={hero.lineOne} onChange={(v) => updateSite('hero', { ...hero, lineOne: v })} />
          <Text label="العنوان، السطر الملون" value={hero.lineTwo} onChange={(v) => updateSite('hero', { ...hero, lineTwo: v })} />
        </div>
        <Text label="الوصف تحت العنوان" value={hero.lede} onChange={(v) => updateSite('hero', { ...hero, lede: v })} area />
      </section>

      <section className="a-card">
        <h2>خصم "جيب صاحبك"</h2>
        <Text
          label="قيمة الخصم كما تظهر للزوار"
          value={referral.discount}
          onChange={(v) => updateSite('referral', { ...referral, discount: v })}
          hint="مثال: 10% أو 50 ريال. الخصم للطرفين: صاحب الكود واللي جابه."
        />
      </section>

      <section className="a-card">
        <h2>لون الموقع</h2>
        <div className="a-swatches">
          {accents.map((a) => (
            <button
              type="button"
              key={a.value}
              className={theme.accent === a.value ? 'is-on' : ''}
              onClick={() => updateSite('theme', { ...theme, accent: a.value })}
            >
              <i style={{ background: a.value }} />
              {a.name}
            </button>
          ))}
          <label>
            <input
              type="color"
              value={theme.accent}
              onChange={(e) => updateSite('theme', { ...theme, accent: e.target.value })}
            />
            لون آخر
          </label>
        </div>
      </section>
    </>
  );
}

/* ---------- المحتوى ---------- */
function ContentEditor() {
  const { programs, reviews } = useSite();
  const [draft, setDraft] = useState({ name: '', text: '' });
  const setProgram = (i, patch) =>
    updateSite(
      'programs',
      programs.map((p, n) => (n === i ? { ...p, ...patch } : p)),
    );

  function addReview() {
    if (draft.name.trim().length < 2 || draft.text.trim().length < 5) return;
    updateSite('reviews', [...reviews, { name: draft.name.trim(), text: draft.text.trim() }]);
    setDraft({ name: '', text: '' });
  }

  return (
    <>
      <section className="a-card">
        <h2>البرامج</h2>
        {programs.map((p, i) => (
          <div className="a-block" key={p.id}>
            <Text label="اسم البرنامج" value={p.title} onChange={(v) => setProgram(i, { title: v })} />
            <Text label="الوصف" value={p.text} onChange={(v) => setProgram(i, { text: v })} area />
            <Text
              label="النقاط (افصل بينها بفاصلة)"
              value={p.points.join('، ')}
              onChange={(v) => setProgram(i, { points: v.split(/[،,]/).map((s) => s.trim()).filter(Boolean) })}
            />
          </div>
        ))}
      </section>

      <section className="a-card">
        <h2>آراء الأعضاء</h2>
        <p className="a-muted">أضف هنا آراء حقيقية فقط، وبعد موافقة أصحابها.</p>
        {reviews.map((r, i) => (
          <div className="a-row" key={`${r.name}-${i}`}>
            <div className="a-row-main">
              <b>{r.name}</b>
            </div>
            <p className="a-note">{r.text}</p>
            <div className="a-row-actions">
              <Confirm onConfirm={() => updateSite('reviews', reviews.filter((_, n) => n !== i))}>
                حذف
              </Confirm>
            </div>
          </div>
        ))}
        <div className="a-block">
          <Text label="اسم العضو" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <Text label="رأيه" value={draft.text} onChange={(v) => setDraft({ ...draft, text: v })} area />
          <button type="button" className="btn btn-ghost" onClick={addReview}>
            أضف الرأي
          </button>
        </div>
      </section>
    </>
  );
}

/* ---------- اللوحة ---------- */
const sections = [
  { id: 'overview', label: 'نظرة عامة', view: Overview },
  { id: 'subs', label: 'طلبات الاشتراك', view: Subs },
  { id: 'orders', label: 'طلبات المتجر', view: Orders },
  { id: 'leads', label: 'طلبات التواصل', view: Leads },
  { id: 'codes', label: 'أكواد الإحالة', view: Codes },
  { id: 'products', label: 'المنتجات', view: ProductsEditor },
  { id: 'plans', label: 'الاشتراكات', view: PlansEditor },
  { id: 'club', label: 'بيانات النادي', view: ClubEditor },
  { id: 'content', label: 'المحتوى', view: ContentEditor },
];

export default function Admin() {
  const { club } = useSite();
  const { leads, orders, subs } = useLog();
  const badges = {
    subs: subs.filter((s) => s.status === 'new').length,
    leads: leads.filter((l) => !l.done).length,
    orders: orders.filter((o) => o.status === 'new').length,
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="admin on-light is-tint">
      <header className="a-top">
        <div>
          <p className="eyebrow">لوحة المالك</p>
          <h1>نادي {club.name}</h1>
        </div>
        <a className="btn btn-ghost btn-small" href="#top">
          عرض الموقع
        </a>
      </header>

      <p className="a-banner">
        نسخة عرض: التعديلات والطلبات محفوظة على هذا الجهاز فقط. عند النشر تنتقل لقاعدة بيانات ويصير
        الدخول بحساب المالك.
      </p>

      <Tabs.Root defaultValue="overview">
        <Tabs.List className="tabs-list a-tabs" aria-label="أقسام اللوحة">
          {sections.map((s) => (
            <Tabs.Tab key={s.id} value={s.id} className="tab">
              {s.label}
              {badges[s.id] > 0 && <b className="a-badge num">{badges[s.id]}</b>}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {sections.map((s) => (
          <Tabs.Panel key={s.id} value={s.id} className="a-panel">
            <s.view />
          </Tabs.Panel>
        ))}
      </Tabs.Root>

      <footer className="a-foot">
        <p className="a-muted">كل تعديل ينحفظ تلقائياً ويظهر في الموقع مباشرة.</p>
        <div className="a-row-actions">
          <Confirm onConfirm={resetSite}>استرجع المحتوى الأصلي</Confirm>
          <Confirm onConfirm={clearLog}>امسح سجل النشاط</Confirm>
        </div>
      </footer>
    </div>
  );
}

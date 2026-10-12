import { useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { updateSite, useSite } from '../store.js';
import { Confirm, Empty, money, Pills, Text, Toggle } from './ui.jsx';

const categories = [
  { id: 'gear', label: 'أطقم' },
  { id: 'fuel', label: 'مكملات' },
];
const categoryName = (id) => categories.find((c) => c.id === id)?.label || id;
const blank = { name: '', price: '', category: 'gear', sizes: '', image: '' };

// نصغّر الصورة قبل الحفظ حتى لا تملأ مساحة التخزين.
function shrinkImage(file, maxSide = 700) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ProductForm({ draft, setDraft, error }) {
  const [busy, setBusy] = useState(false);

  async function pickImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      setDraft({ ...draft, image: await shrinkImage(file) });
    } catch {
      // ملف غير صالح كصورة: نترك الصورة الحالية كما هي.
    }
    setBusy(false);
  }

  return (
    <div className="form">
      <Text label="اسم المنتج" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
      <div className="a-grid">
        <Text
          label="السعر (ريال)"
          type="number"
          value={draft.price}
          onChange={(v) => setDraft({ ...draft, price: v })}
          ltr
        />
        <div className="a-field">
          <span className="label">القسم</span>
          <Pills
            label="قسم المنتج"
            options={categories}
            value={draft.category}
            onChange={(category) => setDraft({ ...draft, category })}
          />
        </div>
      </div>
      <Text
        label="المقاسات"
        value={draft.sizes}
        onChange={(v) => setDraft({ ...draft, sizes: v })}
        hint="افصل بينها بفاصلة، مثال: S, M, L, XL. اتركها فاضية لو المنتج ما له مقاس."
        ltr
      />

      <div className="a-field">
        <span className="label">صورة المنتج</span>
        <div className="upload">
          <div className="upload-preview">
            {draft.image ? <img src={draft.image} alt="" /> : <span>بدون صورة</span>}
          </div>
          <div className="upload-actions">
            <label className="btn btn-ghost btn-small">
              {busy ? 'جاري التجهيز' : draft.image ? 'غيّر الصورة' : 'ارفع صورة'}
              <input type="file" accept="image/*" onChange={pickImage} hidden />
            </label>
            {draft.image && (
              <button type="button" className="a-danger" onClick={() => setDraft({ ...draft, image: '' })}>
                احذف الصورة
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="a-bad" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Products() {
  const { products, shop } = useSite();
  // editing: null مغلق، 'new' منتج جديد، أو معرّف المنتج الجاري تعديله.
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(blank);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  function open(product) {
    setError('');
    setDraft(
      product
        ? {
            name: product.name,
            price: product.price,
            category: product.category,
            sizes: (product.sizes || []).join(', '),
            image: product.image || '',
          }
        : blank,
    );
    setEditing(product ? product.id : 'new');
  }

  function save() {
    const name = String(draft.name).trim();
    const price = Number(draft.price);
    if (name.length < 2) return setError('اكتب اسم المنتج.');
    if (!(price > 0)) return setError('اكتب سعر أكبر من صفر.');

    const fields = {
      name,
      price,
      category: draft.category,
      sizes: String(draft.sizes)
        .split(/[،,]/)
        .map((s) => s.trim())
        .filter(Boolean),
      image: draft.image,
    };
    updateSite(
      'products',
      editing === 'new'
        ? [...products, { id: `p-${Date.now()}`, available: true, ...fields }]
        : products.map((p) => (p.id === editing ? { ...p, ...fields } : p)),
    );
    return setEditing(null);
  }

  const patch = (id, change) =>
    updateSite(
      'products',
      products.map((p) => (p.id === id ? { ...p, ...change } : p)),
    );
  const shown = products.filter((p) => filter === 'all' || p.category === filter);

  return (
    <>
      <div className="a-toolbar">
        <Pills
          label="تصفية المنتجات"
          options={[{ id: 'all', label: `الكل (${products.length})` }, ...categories]}
          value={filter}
          onChange={setFilter}
        />
        <button type="button" className="btn btn-light" onClick={() => open(null)}>
          أضف منتج جديد
        </button>
      </div>

      {shown.length === 0 ? (
        <Empty>ما فيه منتجات هنا. اضغط "أضف منتج جديد".</Empty>
      ) : (
        <ul className="p-list">
          {shown.map((p) => (
            <li key={p.id} className={p.available === false ? 'p-item is-off' : 'p-item'}>
              <div className="p-thumb">{p.image ? <img src={p.image} alt="" /> : <span>بدون صورة</span>}</div>
              <div className="p-info">
                <b>{p.name}</b>
                <span className="a-tag">{categoryName(p.category)}</span>
                {p.sizes?.length > 0 && <span className="a-muted num">{p.sizes.join(' · ')}</span>}
              </div>
              <p className="p-price">
                <b className="num">{money(p.price)}</b> ريال
              </p>
              <div className="p-actions">
                <Toggle
                  label={p.available === false ? 'مخفي من المتجر' : 'معروض في المتجر'}
                  checked={p.available !== false}
                  onChange={(available) => patch(p.id, { available })}
                />
                <button type="button" className="btn btn-ghost btn-small" onClick={() => open(p)}>
                  تعديل
                </button>
                <Confirm onConfirm={() => updateSite('products', products.filter((x) => x.id !== p.id))}>
                  حذف
                </Confirm>
              </div>
            </li>
          ))}
        </ul>
      )}

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

      <Dialog.Root open={editing !== null} onOpenChange={(next) => !next && setEditing(null)}>
        <Dialog.Portal>
          <Dialog.Backdrop className="modal-backdrop" />
          <Dialog.Popup className="modal on-light a-modal">
            <Dialog.Title className="modal-title">
              {editing === 'new' ? 'منتج جديد' : 'تعديل المنتج'}
            </Dialog.Title>
            <ProductForm draft={draft} setDraft={setDraft} error={error} />
            <div className="actions a-modal-actions">
              <button type="button" className="btn btn-light" onClick={save}>
                {editing === 'new' ? 'أضف المنتج' : 'احفظ التعديل'}
              </button>
              <Dialog.Close className="btn btn-ghost">إلغاء</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

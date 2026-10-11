import { useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import {
  cartLines,
  placeOrder,
  setCartOpen,
  setLineQty,
  useCart,
  useCartOpen,
  useSite,
} from '../store.js';
import { phoneError, validPhone, whatsappLink } from '../lib.js';

const money = (n) => Number(n).toLocaleString('en');

function Checkout({ lines, subtotal }) {
  const { shop } = useSite();
  const [method, setMethod] = useState('pickup');
  const fee = method === 'delivery' ? Number(shop.deliveryFee) || 0 : 0;
  const total = subtotal + fee;
  const [done, setDone] = useState(null);

  function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const phone = validPhone(data.get('phone'));
    const address = String(data.get('address') || '').trim();
    if (name.length < 2 || !phone) return;
    if (method === 'delivery' && address.length < 5) return;

    const items = lines.map(({ name: item, size, qty, price }) => ({ name: item, size, qty, price }));
    const no = placeOrder({ items, subtotal, fee, total, method, address, name, phone });
    const text = [
      `طلب رقم ${no} من متجر النادي`,
      ...items.map((i) => `${i.qty} × ${i.name}${i.size ? ` (${i.size})` : ''}`),
      `الإجمالي: ${money(total)} ريال`,
      method === 'delivery' ? `توصيل إلى: ${address}` : 'استلام من النادي',
      `الاسم: ${name}، الجوال: ${phone}`,
    ].join('\n');
    setDone({ no, total, method, link: whatsappLink(text) });
  }

  if (done) {
    return (
      <div className="cart-done" role="status">
        <p className="eyebrow">تم الطلب</p>
        <h3>
          طلبك رقم <span className="num">{done.no}</span>
        </h3>
        <p>
          {done.method === 'delivery'
            ? 'نتواصل معك لتأكيد موعد التوصيل.'
            : 'نبلغك أول ما يجهز وتستلمه من استقبال النادي.'}{' '}
          الدفع عند الاستلام: <span className="num">{money(done.total)}</span> ريال.
        </p>
        <div className="actions">
          <a className="btn btn-light" href={done.link} target="_blank" rel="noopener">
            أرسل الطلب واتساب
          </a>
          <Dialog.Close className="btn btn-ghost">إغلاق</Dialog.Close>
        </div>
      </div>
    );
  }

  return (
    <Form className="form cart-form" onSubmit={onSubmit}>
      <Field.Root name="method">
        <Field.Label className="label" id="method-label">
          طريقة الاستلام
        </Field.Label>
        <RadioGroup
          name="method"
          value={method}
          onValueChange={setMethod}
          className="choices is-stack"
          aria-labelledby="method-label"
        >
          <label className="choice">
            <Radio.Root value="pickup" className="choice-radio" />
            <span>
              استلام من النادي <small>مجاناً</small>
            </span>
          </label>
          <label className="choice">
            <Radio.Root value="delivery" className="choice-radio" />
            <span>
              توصيل{' '}
              <small>
                <span className="num">{money(shop.deliveryFee)}</span> ريال
              </small>
            </span>
          </label>
        </RadioGroup>
        <Field.Description className="cart-note">
          {method === 'delivery' ? shop.deliveryNote : shop.pickupNote}
        </Field.Description>
      </Field.Root>

      {method === 'delivery' && (
        <Field.Root
          name="address"
          validate={(v) => (!v || String(v).trim().length > 4 ? null : 'اكتب العنوان بتفصيل أكثر.')}
        >
          <Field.Label className="label">عنوان التوصيل</Field.Label>
          <Field.Control
            className="input is-area"
            required
            placeholder="الحي، الشارع، رقم المنزل"
            render={<textarea rows={2} />}
          />
          <Field.Error className="error" match="valueMissing">
            اكتب عنوان التوصيل.
          </Field.Error>
          <Field.Error className="error" match="customError" />
        </Field.Root>
      )}

      <Field.Root
        name="name"
        validate={(v) => (!v || String(v).trim().length > 1 ? null : 'الاسم قصير، اكتبه كامل.')}
      >
        <Field.Label className="label">الاسم</Field.Label>
        <Field.Control className="input" autoComplete="name" required />
        <Field.Error className="error" match="valueMissing">
          اكتب اسمك.
        </Field.Error>
        <Field.Error className="error" match="customError" />
      </Field.Root>

      <Field.Root name="phone" validate={(v) => (!v || validPhone(v) ? null : phoneError)}>
        <Field.Label className="label">رقم الجوال</Field.Label>
        <Field.Control
          className="input is-ltr"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="05XXXXXXXX"
          required
        />
        <Field.Error className="error" match="valueMissing">
          اكتب رقم جوالك.
        </Field.Error>
        <Field.Error className="error" match="customError" />
      </Field.Root>

      <dl className="totals">
        <div>
          <dt>المنتجات</dt>
          <dd>
            <span className="num">{money(subtotal)}</span> ريال
          </dd>
        </div>
        <div>
          <dt>{method === 'delivery' ? 'التوصيل' : 'الاستلام من النادي'}</dt>
          <dd>{fee ? <><span className="num">{money(fee)}</span> ريال</> : 'مجاناً'}</dd>
        </div>
        <div className="is-total">
          <dt>الإجمالي</dt>
          <dd>
            <span className="num">{money(total)}</span> ريال
          </dd>
        </div>
      </dl>

      <p className="cart-note">الدفع عند الاستلام حالياً.</p>
      <button type="submit" className="btn btn-light">
        أكّد الطلب
      </button>
    </Form>
  );
}

export function CartButton() {
  const count = useCart().reduce((sum, l) => sum + l.qty, 0);
  return (
    <button
      type="button"
      className="cart-btn"
      onClick={() => setCartOpen(true)}
      aria-label={`السلة، ${count} منتج`}
    >
      السلة
      {count > 0 && <b className="num">{count}</b>}
    </button>
  );
}

export default function Cart() {
  const open = useCartOpen();
  const cart = useCart();
  const { products } = useSite();
  const lines = cartLines(cart, products);
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
  // بعد تأكيد الطلب تفرغ السلة، لكن شاشة التأكيد تبقى إلى أن تُغلق النافذة.
  const [session, setSession] = useState(0);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setCartOpen(next);
        if (!next) setSession((n) => n + 1);
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="modal-backdrop" />
        <Dialog.Popup className="drawer on-light">
          <div className="drawer-head">
            <Dialog.Title className="drawer-title">سلتك</Dialog.Title>
            <Dialog.Close className="link-btn">إغلاق</Dialog.Close>
          </div>

          <div className="drawer-body" key={session}>
            <CartContent lines={lines} subtotal={subtotal} />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CartContent({ lines, subtotal }) {
  // نثبّت السطور وقت بدء الدفع حتى تبقى شاشة التأكيد بعد تفريغ السلة.
  const [checkout, setCheckout] = useState(null);

  if (checkout) {
    return <Checkout lines={checkout.lines} subtotal={checkout.subtotal} />;
  }
  if (lines.length === 0) {
    return (
      <div className="cart-empty">
        <p>سلتك فاضية.</p>
        <Dialog.Close className="btn btn-ghost" render={<a href="#shop" />}>
          تصفح المتجر
        </Dialog.Close>
      </div>
    );
  }

  return (
    <>
      <ul className="lines">
        {lines.map((l) => (
          <li key={l.key}>
            <div>
              <b>{l.name}</b>
              {l.size && <span className="num"> · {l.size}</span>}
              <p>
                <span className="num">{money(l.price * l.qty)}</span> ريال
              </p>
            </div>
            <div className="a-stepper">
              <button type="button" onClick={() => setLineQty(l.key, l.qty - 1)} aria-label={`نقص ${l.name}`}>
                −
              </button>
              <b className="num">{l.qty}</b>
              <button type="button" onClick={() => setLineQty(l.key, l.qty + 1)} aria-label={`زيادة ${l.name}`}>
                +
              </button>
            </div>
          </li>
        ))}
      </ul>

      <dl className="totals">
        <div className="is-total">
          <dt>المجموع</dt>
          <dd>
            <span className="num">{money(subtotal)}</span> ريال
          </dd>
        </div>
      </dl>
      <button type="button" className="btn btn-light" onClick={() => setCheckout({ lines, subtotal })}>
        كمّل الطلب
      </button>
    </>
  );
}

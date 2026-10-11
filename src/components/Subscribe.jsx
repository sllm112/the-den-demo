import { useEffect, useState } from 'react';
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { addSubscription, useLog, useSite } from '../store.js';
import { monthsLabel, phoneError, validPhone, whatsappLink } from '../lib.js';

const money = (n) => Number(n).toLocaleString('en');

function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function endOf(start, months) {
  const date = new Date(`${start}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date;
}
const longDate = (date) =>
  date.toLocaleDateString('ar-SA-u-nu-latn-ca-gregory', { dateStyle: 'long' });

function Summary({ plan, start }) {
  const total = plan.paid + plan.gift;
  return (
    <aside className="sub-summary plan is-featured" aria-label="ملخص الاشتراك">
      <p className="plan-note">اشتراكك</p>
      <h3>{plan.title}</h3>

      <div className="plan-bar" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i < plan.paid ? 'is-paid' : 'is-gift'} />
        ))}
      </div>
      <p className="plan-legend">
        <span>{monthsLabel(plan.paid)} تدفعها</span>
        {plan.gift > 0 && <span>{monthsLabel(plan.gift)} هدية</span>}
      </p>

      <dl className="totals">
        <div>
          <dt>المدة</dt>
          <dd>{monthsLabel(total)}</dd>
        </div>
        <div>
          <dt>يبدأ</dt>
          <dd>{longDate(endOf(start, 0))}</dd>
        </div>
        <div>
          <dt>ينتهي</dt>
          <dd>{longDate(endOf(start, total))}</dd>
        </div>
        <div className="is-total">
          <dt>المبلغ</dt>
          <dd>
            <span className="num">{money(plan.price)}</span> ريال
          </dd>
        </div>
      </dl>
      <p className="sub-per">
        يعني الشهر بـ <span className="num">{Math.round(plan.price / Math.max(total, 1))}</span> ريال
      </p>
    </aside>
  );
}

export default function Subscribe() {
  const { club, plans, referral } = useSite();
  const { codes } = useLog();
  const wanted = window.location.hash.split('/')[2];
  const [planId, setPlanId] = useState(
    () => (plans.find((p) => p.id === wanted) || plans.find((p) => p.featured) || plans[0])?.id,
  );
  const [start, setStart] = useState(todayISO);
  const [code, setCode] = useState('');
  const [pay, setPay] = useState('club');
  const [done, setDone] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [done]);

  const plan = plans.find((p) => p.id === planId) || plans[0];
  if (!plan) {
    return (
      <div className="subscribe on-light is-tint">
        <p className="a-empty">ما فيه باقات متاحة حالياً.</p>
      </div>
    );
  }

  const typed = code.trim().toUpperCase();
  const codeOk = typed ? codes.some((c) => c.code === typed) : null;
  const canPayOnline = Boolean(plan.url);

  function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') || '').trim();
    const phone = validPhone(data.get('phone'));
    if (name.length < 2 || !phone || !start) return;

    const months = plan.paid + plan.gift;
    const method = canPayOnline ? pay : 'club';
    const no = addSubscription({
      planId: plan.id,
      plan: plan.title,
      price: plan.price,
      months,
      start,
      name,
      phone,
      code: typed,
      codeOk: Boolean(codeOk),
      pay: method,
    });
    const text = [
      `طلب اشتراك رقم ${no}`,
      `الباقة: ${plan.title} (${money(plan.price)} ريال)`,
      `البداية: ${start}`,
      typed && `كود الإحالة: ${typed}`,
      `الاسم: ${name}، الجوال: ${phone}`,
    ]
      .filter(Boolean)
      .join('\n');
    setDone({ no, name: name.split(' ')[0], method, link: whatsappLink(text) });
  }

  return (
    <div className="subscribe on-light is-tint">
      <header className="sub-top">
        <a href="#top" aria-label={`نادي ${club.name}، الصفحة الرئيسية`}>
          <img src="logo.png" alt={club.nameLatin} width="900" height="263" />
        </a>
        <a className="link-btn" href="#plans">
          رجوع للموقع
        </a>
      </header>

      {done ? (
        <section className="sub-done">
          <p className="eyebrow">وصلنا طلبك</p>
          <h1>
            أهلاً بك في العرين يا {done.name}.
          </h1>
          <p className="lede">
            رقم طلبك <b className="num">{done.no}</b>.{' '}
            {done.method === 'online'
              ? 'كمّل الدفع من الزر تحت ويتفعل اشتراكك.'
              : 'ادفع في استقبال النادي عند أول زيارة ويتفعل اشتراكك، وإحنا فاتحين 24 ساعة.'}
          </p>
          <div className="actions">
            {done.method === 'online' && (
              <a className="btn btn-light" href={plan.url} target="_blank" rel="noopener">
                كمّل الدفع
              </a>
            )}
            <a
              className={done.method === 'online' ? 'btn btn-ghost' : 'btn btn-light'}
              href={done.link}
              target="_blank"
              rel="noopener"
            >
              أرسل الطلب واتساب
            </a>
            <a className="btn btn-ghost" href="#top">
              رجوع للموقع
            </a>
          </div>
          <Summary plan={plan} start={start} />
        </section>
      ) : (
        <>
          <div className="sub-head">
            <p className="eyebrow">الاشتراك</p>
            <h1>ثلاث خطوات وتبدأ.</h1>
          </div>

          <div className="sub-grid">
            <Form className="form sub-form" onSubmit={onSubmit}>
              <section className="sub-card">
                <h2>
                  <b className="num">1</b> اختر باقتك
                </h2>
                <RadioGroup
                  name="plan"
                  value={planId}
                  onValueChange={setPlanId}
                  className="sub-plans"
                  aria-label="الباقة"
                >
                  {plans.map((p) => (
                    <label key={p.id} className="sub-plan">
                      <Radio.Root value={p.id} className="choice-radio" />
                      <span className="sub-plan-name">
                        {p.title}
                        {p.note && <small>{p.note}</small>}
                      </span>
                      <span className="sub-plan-price">
                        <b className="num">{money(p.price)}</b> ريال
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </section>

              <section className="sub-card">
                <h2>
                  <b className="num">2</b> بياناتك
                </h2>
                <div className="sub-fields">
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

                  <Field.Root name="start">
                    <Field.Label className="label">متى تبي تبدأ؟</Field.Label>
                    <Field.Control
                      className="input is-ltr"
                      type="date"
                      min={todayISO()}
                      value={start}
                      onChange={(e) => setStart(e.target.value || todayISO())}
                      required
                    />
                  </Field.Root>

                  <Field.Root name="code">
                    <Field.Label className="label">كود صاحبك (اختياري)</Field.Label>
                    <Field.Control
                      className="input is-ltr"
                      placeholder={`${referral.prefix}-XXXX`}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                    {codeOk === true && (
                      <Field.Description className="sub-ok">
                        كود صحيح. الخصم{referral.discount ? ` (${referral.discount})` : ''} لك ولصاحبك،
                        ويتطبق عند التفعيل.
                      </Field.Description>
                    )}
                    {codeOk === false && (
                      <Field.Description className="cart-note">
                        ما لقينا هذا الكود. تأكد منه، والاستقبال يراجعه معك.
                      </Field.Description>
                    )}
                  </Field.Root>
                </div>
              </section>

              <section className="sub-card">
                <h2>
                  <b className="num">3</b> الدفع
                </h2>
                <RadioGroup
                  name="pay"
                  value={canPayOnline ? pay : 'club'}
                  onValueChange={setPay}
                  className="choices is-stack"
                  aria-label="طريقة الدفع"
                >
                  <label className="choice">
                    <Radio.Root value="club" className="choice-radio" />
                    <span>
                      أدفع في النادي <small>عند أول زيارة</small>
                    </span>
                  </label>
                  {canPayOnline && (
                    <label className="choice">
                      <Radio.Root value="online" className="choice-radio" />
                      <span>
                        أدفع أونلاين <small>مدى، Apple Pay، أو تابي على 4 دفعات</small>
                      </span>
                    </label>
                  )}
                </RadioGroup>
              </section>

              <button type="submit" className="btn btn-light sub-submit">
                أكّد الاشتراك · <span className="num">{money(plan.price)}</span> ريال
              </button>
            </Form>

            <Summary plan={plan} start={start} />
          </div>
        </>
      )}
    </div>
  );
}

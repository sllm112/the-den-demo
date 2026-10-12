import { useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { Toast } from '@base-ui/react/toast';
import { addToCart, setCartOpen, useSite } from '../store.js';
import Reveal from './Reveal.jsx';

const categories = [
  { id: 'all', label: 'الكل' },
  { id: 'gear', label: 'الأطقم' },
  { id: 'fuel', label: 'المكملات' },
];

function Product({ product }) {
  const sizes = product.sizes || [];
  const [size, setSize] = useState(sizes[0] || '');
  const toast = Toast.useToastManager();

  function add() {
    addToCart(product.id, size);
    toast.add({ title: 'انضاف للسلة', description: product.name });
  }

  return (
    <article className="product">
      <div className="product-photo">
        {product.image ? <img src={product.image} alt="" loading="lazy" /> : <span>{product.name}</span>}
      </div>
      <div className="product-body">
        <h3>{product.name}</h3>
        <p className="product-price">
          <span className="num">{Number(product.price).toLocaleString('en')}</span> ريال
        </p>

        {sizes.length > 0 && (
          <div className="sizes" role="radiogroup" aria-label={`مقاس ${product.name}`}>
            {sizes.map((s) => (
              <button
                type="button"
                key={s}
                role="radio"
                aria-checked={size === s}
                className={size === s ? 'size is-on' : 'size'}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <button type="button" className="btn btn-ghost" onClick={add}>
          أضف للسلة
        </button>
      </div>
    </article>
  );
}

export default function Shop() {
  const { products } = useSite();

  return (
    <section className="section shop on-light is-tint" id="shop">
      <Reveal className="section-head">
        <p className="eyebrow">المتجر</p>
        <h2>من داخل العرين.</h2>
        <p className="lede">اطلب من هنا، واستلم من النادي أو نوصله لك.</p>
      </Reveal>

      <Reveal>
        <Tabs.Root defaultValue="all">
          <Tabs.List className="tabs-list" aria-label="أقسام المتجر">
            {categories.map((c) => (
              <Tabs.Tab key={c.id} value={c.id} className="tab">
                {c.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {categories.map((c) => {
            const list = products.filter(
              (p) => p.available !== false && (c.id === 'all' || p.category === c.id),
            );
            return (
              <Tabs.Panel key={c.id} value={c.id} className="products">
                {list.length === 0 ? (
                  <p className="products-empty">ما فيه منتجات في هذا القسم حالياً.</p>
                ) : (
                  list.map((p) => <Product key={p.id} product={p} />)
                )}
              </Tabs.Panel>
            );
          })}
        </Tabs.Root>
      </Reveal>

      <p className="shop-foot">
        <button type="button" className="text-link" onClick={() => setCartOpen(true)}>
          افتح السلة
        </button>
      </p>
    </section>
  );
}

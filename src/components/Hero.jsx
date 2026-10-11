import { useSite } from '../store.js';
import { useClubClock } from '../lib.js';

export default function Hero() {
  const { club, hero } = useSite();
  const clock = useClubClock();

  return (
    <section className="hero" id="top">
      <div className="hero-grid">
        <div className="hero-copy">
          <p className="status">
            <i aria-hidden="true" />
            مفتوح الآن · <span className="num">{clock.time}</span> {clock.part}
          </p>
          <h1>
            <span>{hero.lineOne}</span> <span>{hero.lineTwo}</span>
          </h1>
          <p className="hero-lede">{hero.lede}</p>
          <div className="actions">
            <a className="btn btn-light" href="#plans">
              اشترك الآن
            </a>
            <a className="btn btn-ghost" href="#contact">
              احجز حصة تجريبية
            </a>
          </div>
        </div>

        <div className="hero-media">
          <video
            src="media/hero.mp4"
            poster="media/hero-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
        </div>
      </div>

      <dl className="hero-facts">
        <div>
          <dt>الدوام</dt>
          <dd>{club.hours}</dd>
        </div>
        <div>
          <dt>العرض الحالي</dt>
          <dd>اشترك وخذ نفس المدة هدية</dd>
        </div>
        <div>
          <dt>الموقع</dt>
          <dd>{club.city}</dd>
        </div>
      </dl>
    </section>
  );
}

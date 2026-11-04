import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { WhatsAppLink } from '../../components/common/Shared.jsx';

const heroBackdrops = [
  { id: 'airpods-pro-3', image: '/images/hero/airpods-pro-3-hero-v2.webp' },
  { id: 'airpods-pro-2', image: '/images/hero/airpods-pro-2-hero.webp' },
  { id: 'airpods-3', image: '/images/hero/airpods-3-hero.webp' },
  { id: 'airpods-4', image: '/images/hero/airpods-4-hero.webp' },
  { id: 'galaxy-buds3-pro', image: '/images/hero/galaxy-buds3-pro-hero-white.png' },
  { id: 'airpods-max', image: '/images/hero/airpods-max-hero.webp' },
  { id: 'apple-pencil', image: '/images/hero/apple-pencil-hero.webp' },
];

export function Hero({ settings, reducedMotion }) {
  const title = settings.heroTitle;
  const lastSpace = title.lastIndexOf(' ');
  const [activeBackdrop, setActiveBackdrop] = useState(0);

  useEffect(() => {
    if (reducedMotion) return undefined;
    const intervalId = window.setInterval(() => {
      setActiveBackdrop((current) => (current + 1) % heroBackdrops.length);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [reducedMotion]);

  return <section className="hero" id="inicio" aria-labelledby="hero-title">
    <div className="hero__backdrops" aria-hidden="true">
      {heroBackdrops.map((backdrop, index) => <div
        className={`hero__backdrop hero__backdrop--${backdrop.id} ${index === activeBackdrop ? 'hero__backdrop--active' : ''}`}
        key={backdrop.id}
      >
        <img src={backdrop.image} alt="" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
      </div>)}
    </div>
    <div className="container hero__inner">
      <motion.div className="hero__copy" initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.62, ease: 'easeOut' }}>
        <h1 id="hero-title">{lastSpace > 0 ? <>{title.slice(0, lastSpace)} <span className="hero__blue">{title.slice(lastSpace + 1)}</span></> : title}</h1>
        <div className="hero__actions">
          <a className="button button--dark" href="#productos">Explorar productos <ArrowRight size={18} aria-hidden="true" /></a>
          <WhatsAppLink phone={settings.whatsappPhone} className="button button--light">Hablemos</WhatsAppLink>
        </div>
      </motion.div>
    </div>
  </section>;
}

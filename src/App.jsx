import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useSpring } from 'motion/react';
import {
  ArrowRight, AudioLines, BatteryFull, Bluetooth, Check, ChevronDown, Droplets, Headphones, Info,
  MapPin, Menu, MessageCircle, PenLine, Phone,
  Sparkles, X,
} from 'lucide-react';
import { ProductService } from './domain/catalog.js';
import { getFallbackData } from './data/fallback.js';

const service = new ProductService();
const iconMap = { headphones: Headphones, info: Info, pen: PenLine, audio: AudioLines, bluetooth: Bluetooth, battery: BatteryFull, droplet: Droplets, sparkles: Sparkles };
const heroBackdrops = [
  { id: 'airpods-background', image: '/images/hero/airpods-hero-background.webp' },
  { id: 'airpods-pro-3', image: '/images/hero/airpods-pro-3-hero-v2.webp' },
  { id: 'airpods-pro-2', image: '/images/hero/airpods-pro-2-hero.webp' },
  { id: 'airpods-3', image: '/images/hero/airpods-3-hero.webp' },
  { id: 'airpods-4', image: '/images/hero/airpods-4-hero.webp' },
  { id: 'airpods-max', image: '/images/hero/airpods-max-hero.webp' },
  { id: 'apple-pencil', image: '/images/hero/apple-pencil-hero.webp' },
];

function ScrollProgress({ reducedMotion }) {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.25 });
  return <motion.div className="scroll-progress" style={{ scaleX: reducedMotion ? scrollYProgress : smoothProgress }} aria-hidden="true" />;
}

function Brand({ compact = false }) {
  if (compact) return <span className="footer-wordmark" aria-label="Drop Zone CR">
    DROP<span className="footer-wordmark__accent">_</span>ZONE <small>CR</small>
  </span>;
  return <span className="brand">
    <img className="brand__logo" src="/images/logo-dropzone.png?v=2" alt="Drop Zone" width="800" height="125" />
  </span>;
}

function InstagramBrandIcon() {
  return <svg className="instagram-brand-icon" viewBox="0 0 24 24" role="img" aria-label="Instagram">
    <defs>
      <linearGradient id="instagram-brand-gradient" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ffd600" />
        <stop offset=".28" stopColor="#ff7a00" />
        <stop offset=".52" stopColor="#ff0169" />
        <stop offset=".78" stopColor="#d300c5" />
        <stop offset="1" stopColor="#7638fa" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6.5" fill="url(#instagram-brand-gradient)" />
    <rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4.2" fill="none" stroke="#fff" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="3.25" fill="none" stroke="#fff" strokeWidth="1.7" />
    <circle cx="16.75" cy="7.45" r="1.05" fill="#fff" />
  </svg>;
}

function WhatsAppLink({ phone, product, children, className = '' }) {
  const href = product
    ? product.whatsappUrl(phone)
    : `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quisiera consultar sobre los productos de Drop_Zone CR.')}`;
  return <a className={className} href={href} target="_blank" rel="noopener noreferrer" aria-label={product ? `Consultar por WhatsApp sobre ${product.name}` : 'Escribir a Drop Zone CR por WhatsApp'}>
    <MessageCircle size={18} aria-hidden="true" />{children}
  </a>;
}

function Header({ settings, sections }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return <header className="site-header">
    <div className="container site-header__inner">
      <a href="#inicio" className="brand-link" onClick={() => setOpen(false)}><Brand /></a>
      <nav className={`primary-nav ${open ? 'primary-nav--open' : ''}`} id="main-navigation" aria-label="Navegación principal">
        {sections.filter((item) => item.enabled).map((item) => <a key={item.id} href={`#${item.id}`} onClick={() => setOpen(false)}>{item.label}</a>)}
      </nav>
      <div className="site-header__actions">
        <WhatsAppLink phone={settings.whatsappPhone} className="button button--whatsapp header-whatsapp"><span className="header-whatsapp__long">Escríbenos</span><span className="header-whatsapp__short">WhatsApp</span></WhatsAppLink>
        <button ref={menuRef} className="menu-toggle" type="button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-controls="main-navigation" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
    </div>
  </header>;
}

function Hero({ settings, reducedMotion }) {
  const title = settings.heroTitle;
  const lastSpace = title.lastIndexOf(' ');
  const [activeBackdrop, setActiveBackdrop] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveBackdrop((current) => (current + 1) % heroBackdrops.length);
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

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

function ProductImage({ product, className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [product.image]);
  if (failed) return <div className={`${className} image-fallback`} role="img" aria-label={`Imagen no disponible de ${product.name}`}><Headphones size={40} aria-hidden="true" /><span>Imagen por actualizar</span></div>;
  return <img className={className} src={product.image} alt={product.imageAlt} width="900" height="900" loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />;
}

function ProductCard({ product, selected, onSelect, index, reducedMotion }) {
  return <motion.button type="button" className={`product-card ${selected ? 'product-card--selected' : ''}`} onClick={() => onSelect(product.id)} aria-label={`Ver detalles de ${product.name}, ${product.formattedPrice}`} aria-pressed={selected}
    initial={reducedMotion ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.42, delay: reducedMotion ? 0 : Math.min(index * 0.055, 0.28), ease: 'easeOut' }} whileHover={reducedMotion ? undefined : { y: -6 }} whileTap={reducedMotion ? undefined : { scale: 0.985 }}>
    <div className="product-card__image"><ProductImage product={product} /></div>
    <div className="product-card__meta"><span className="product-card__category">{product.category}</span><span className="product-card__arrow"><ArrowRight size={17} /></span></div>
    <h3>{product.name}</h3>
    <p>{product.formattedPrice}</p>
  </motion.button>;
}

function Catalog({ catalog, selectedId, onSelect, reducedMotion }) {
  return <section id="productos" className="catalog section" aria-labelledby="catalog-title">
    <div className="container">
      <div className="section-heading">
        <div><p className="eyebrow"><span className="eyebrow__line" />NUESTROS PRODUCTOS</p><h2 id="catalog-title">Una selección para vos.</h2></div>
        <a href="#comparar" className="text-link">Comparar modelos <ArrowRight size={17} /></a>
      </div>
      <div className="product-grid">{catalog.featured.map((product, index) => <ProductCard key={product.id} product={product} selected={selectedId === product.id} onSelect={onSelect} index={index} reducedMotion={reducedMotion} />)}</div>
      <p className="catalog__note">Imágenes ilustrativas. Consultá la versión y características del artículo disponible.</p>
    </div>
  </section>;
}

function ProductDetail({ product, settings, onTabChange, tab, reducedMotion }) {
  const tabRefs = useRef([]);
  const selectTab = (next) => {
    onTabChange(next);
    tabRefs.current[next]?.focus();
  };
  const handleTabKey = (event, index) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      selectTab((index + (event.key === 'ArrowRight' ? 1 : -1) + 2) % 2);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      selectTab(event.key === 'Home' ? 0 : 1);
    }
  };
  return <section id="caracteristicas" className="detail-section section" aria-labelledby="detail-section-title">
    <div className="container">
      <div className="section-heading section-heading--detail"><div><p className="eyebrow"><span className="eyebrow__line" />EN DETALLE</p><h2 id="detail-section-title">Encontrá tu próximo favorito.</h2></div><p>Elegí un producto para descubrirlo de cerca.</p></div>
      <motion.div className="detail-panel" initial={reducedMotion ? false : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.58, ease: 'easeOut' }}>
        <div className={`detail-showcase detail-showcase--${product.id}`}>
          <div className="detail-showcase__heading"><span>DROP_ZONE CR</span></div>
          <AnimatePresence mode="wait"><motion.div key={product.id} initial={reducedMotion ? false : { opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} exit={reducedMotion ? undefined : { opacity: 0 }} transition={{ duration: 0.24 }} className="detail-showcase__image"><img src={product.detailImage || product.image} alt={product.imageAlt} width="900" height="900" loading="lazy" /></motion.div></AnimatePresence>
          <div className="detail-showcase__caption"><span>DISEÑADO PARA ACOMPAÑARTE</span><strong>{product.name}</strong></div>
        </div>
        <div className="detail-content">
          <div className="detail-content__top"><span className="detail-content__eyebrow">EXPLORÁ EL PRODUCTO</span></div>
          <div className="tabs" role="tablist" aria-label={`Información de ${product.name}`}>
            {['Características', 'Precio'].map((label, index) => <button key={label} ref={(element) => { tabRefs.current[index] = element; }} type="button" id={`tab-${index}`} role="tab" aria-selected={tab === index} aria-controls="product-tabpanel" tabIndex={tab === index ? 0 : -1} className={tab === index ? 'tab tab--active' : 'tab'} onClick={() => onTabChange(index)} onKeyDown={(event) => handleTabKey(event, index)}>{label}</button>)}
          </div>
          <div id="product-tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex="0" className="detail-content__body">
            <AnimatePresence mode="wait"><motion.div key={`${product.id}-${tab}`} initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0 }} transition={{ duration: 0.22 }}>
              {tab === 0 ? <>
                <p className="detail-content__category">{product.category.toUpperCase()} / {product.name.toUpperCase()}</p>
                <h3>{product.name}</h3><p className="detail-content__description">{product.shortDescription}</p>
                <p className="detail-content__category detail-content__category--features">CARACTERÍSTICAS DEL MODELO SEGÚN APPLE</p>
                <ul className="feature-list">{(product.referenceFeatures.length ? product.referenceFeatures : product.verifiedFeatures).map((feature) => { const Icon = iconMap[feature.icon] || Info; return <li key={feature.label}><span><Icon size={19} strokeWidth={1.7} aria-hidden="true" /></span>{feature.label}</li>; })}</ul>
                {product.specSourceUrl && <p className="detail-reference">Especificaciones de referencia. Confirmá la versión y funciones del artículo disponible con la tienda. <a href={product.specSourceUrl} target="_blank" rel="noopener noreferrer">Ver ficha oficial de Apple <ArrowRight size={13} aria-hidden="true" /></a></p>}
              </> : <>
                <p className="detail-content__category">PRECIO PUBLICADO</p>
                <h3>{product.name}</h3><p className="price-big">{product.formattedPrice}</p>
                <p className="detail-content__description">{settings.shippingMessage}</p>
                <p className="detail-content__small">La versión, disponibilidad y detalles finales se confirman directamente con la tienda.</p>
              </>}
            </motion.div></AnimatePresence>
          </div>
          <div className="detail-content__footer"><div><span>PRECIO</span><strong>{product.formattedPrice}</strong></div><WhatsAppLink phone={settings.whatsappPhone} product={product} className="button button--whatsapp">Consultar este producto <ArrowRight size={17} /></WhatsAppLink></div>
        </div>
      </motion.div>
    </div>
  </section>;
}

function Comparison({ catalog, onSelect, reducedMotion }) {
  const [firstId, setFirstId] = useState(catalog.products[0]?.id);
  const [secondId, setSecondId] = useState(catalog.products[1]?.id);
  const first = catalog.find(firstId) || catalog.products[0];
  const second = catalog.find(secondId) || catalog.products[1];
  const difference = Math.abs(first.priceCRC - second.priceCRC);
  const differenceLabel = difference === 0
    ? 'Ambos tienen el mismo precio publicado.'
    : `Diferencia de precio: ₡${new Intl.NumberFormat('es-CR').format(difference).replace(/[\s\u00a0\u202f]/g, '.')}`;

  const compareCard = (product, index, value, onChange) => <motion.article className="compare-card" key={`${index}-${product.id}`} initial={reducedMotion ? false : { opacity: 0, y: 22, scale: 0.985 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.46, delay: reducedMotion ? 0 : index * 0.1, ease: 'easeOut' }}>
    <div className="compare-card__top"><span>0{index + 1} / {index === 0 ? 'TU ELECCIÓN' : 'COMPARAR CON'}</span><span className="compare-card__category">{product.category}</span></div>
    <div className="compare-card__select-wrap"><select aria-label={index === 0 ? 'Primer producto para comparar' : 'Segundo producto para comparar'} value={value} onChange={(event) => onChange(event.target.value)}>{catalog.products.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select><ChevronDown size={19} aria-hidden="true" /></div>
    <div className="compare-card__visual"><img src={product.image} alt={product.imageAlt} width="900" height="900" loading="lazy" decoding="async" /></div>
    <div className="compare-card__info"><p>{product.verifiedFeatures[0]?.label || product.category}</p><div><strong>{product.formattedPrice}</strong><button type="button" onClick={() => onSelect(product.id)} aria-label={`Ver detalles de ${product.name}`}>Ver detalles <ArrowRight size={16} aria-hidden="true" /></button></div></div>
  </motion.article>;

  return <section id="comparar" className="comparison section" aria-labelledby="compare-title"><div className="container">
    <div className="section-heading comparison__heading"><div><p className="eyebrow"><span className="eyebrow__line" />ENCONTRÁ TU MEJOR OPCIÓN</p><h2 id="compare-title">Dos modelos. Una decisión más clara.</h2></div><p>Elegí dos productos y compará sus precios de un vistazo.</p></div>
    <div className="comparison-stage">
      {compareCard(first, 0, firstId, setFirstId)}
      <div className="comparison-stage__versus" aria-hidden="true">VS</div>
      {compareCard(second, 1, secondId, setSecondId)}
    </div>
    <div className="comparison-summary"><span className="comparison-summary__mark"><Check size={18} aria-hidden="true" /></span><div><strong>{differenceLabel}</strong><p>Precio en colones. Confirmá versiones y disponibilidad con la tienda.</p></div><span className="comparison-summary__count">{catalog.products.length} MODELOS PARA EXPLORAR</span></div>
  </div></section>;
}

function Footer({ settings }) {
  return <footer id="contacto" className="footer"><div className="container footer__main"><div className="footer__brand"><Brand compact /><p>{settings.tagline}</p></div><div className="footer__links"><span className="location-link"><MapPin size={17} />{settings.location}</span><a className="phone-link" href={`tel:+${settings.whatsappPhone}`}><Phone size={17} />{settings.displayPhone}</a><a className="instagram-link" href={settings.instagramUrl} target="_blank" rel="noopener noreferrer"><InstagramBrandIcon />{settings.instagramHandle}</a></div><WhatsAppLink phone={settings.whatsappPhone} className="button button--whatsapp">Escribenos a nuestro WhatsApp <ArrowRight size={17} /></WhatsAppLink></div><div className="container footer__bottom"><span>© {new Date().getFullYear()} Drop_Zone CR</span><span>Comercio independiente. Las marcas mencionadas pertenecen a sus titulares.</span></div></footer>;
}

export default function App() {
  const [data, setData] = useState(() => getFallbackData());
  const [loadState, setLoadState] = useState('loading');
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get('producto') || 'airpods-pro-3');
  const [tab, setTab] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const controller = new AbortController();
    service.load(controller.signal).then((next) => { setData(next); setLoadState('ready'); }).catch((error) => { if (error.name !== 'AbortError') setLoadState('fallback'); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onPopState = () => setSelectedId(new URLSearchParams(window.location.search).get('producto') || 'airpods-pro-3');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const selectProduct = (id) => {
    setSelectedId(id);
    setTab(0);
    const url = new URL(window.location.href);
    url.searchParams.set('producto', id);
    window.history.pushState({}, '', url);
    requestAnimationFrame(() => document.getElementById('caracteristicas')?.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' }));
  };
  const product = data.catalog.find(selectedId) || data.catalog.featured[0];

  return <>
    <ScrollProgress reducedMotion={reducedMotion} />
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <Header settings={data.settings} sections={data.siteSections} />
    <main id="contenido">
      {loadState === 'loading' && <div className="api-loading" role="status">Actualizando catálogo…</div>}
      {loadState === 'fallback' && <div className="api-notice" role="status">Vista de respaldo: el catálogo local no está conectado. Los datos mostrados proceden de la copia incluida en la web.</div>}
      <Hero settings={data.settings} reducedMotion={reducedMotion} />
      <Catalog catalog={data.catalog} selectedId={product.id} onSelect={selectProduct} reducedMotion={reducedMotion} />
      <ProductDetail product={product} settings={data.settings} tab={tab} onTabChange={setTab} reducedMotion={reducedMotion} />
      <Comparison catalog={data.catalog} onSelect={selectProduct} reducedMotion={reducedMotion} />
    </main>
    <Footer settings={data.settings} />
    <span className="sr-only" role="status" aria-live="polite">{product.name} seleccionado, precio {product.formattedPrice}</span>
  </>;
}

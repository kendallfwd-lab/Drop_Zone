import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useSpring } from 'motion/react';
import {
  ArrowRight, AudioLines, BatteryFull, Bluetooth, Check, ChevronDown, Droplets, Headphones, Info,
  MapPin, Menu, Package, Palette, PenLine, Phone,
  Minus, Plus, ShoppingCart, Sparkles, Trash2, X,
} from 'lucide-react';
import AccessiblePicker from './components/AccessiblePicker.jsx';
import { ProductService } from './domain/catalog.js';
import {
  addCartItem, cartItemCount, cartTotal, clampQuantity, createCartItem, createCartWhatsAppUrl,
  applePencilProductCount, audioProductCount, cartDiscountBreakdown, cartSubtotal, caseProductCount, formatCRC, iphoneCaseProductCount, quantityDiscountForProduct, readStoredCart, removeCartItem, updateCartItemQuantity,
} from './domain/cart.js';
import { compareProducts } from './domain/comparison.js';
import { getFallbackData } from './data/fallback.js';

const service = new ProductService();
const iconMap = { headphones: Headphones, info: Info, pen: PenLine, audio: AudioLines, bluetooth: Bluetooth, battery: BatteryFull, droplet: Droplets, sparkles: Sparkles, package: Package, palette: Palette };
const heroBackdrops = [
  { id: 'airpods-pro-3', image: '/images/hero/airpods-pro-3-hero-v2.webp' },
  { id: 'airpods-pro-2', image: '/images/hero/airpods-pro-2-hero.webp' },
  { id: 'airpods-3', image: '/images/hero/airpods-3-hero.webp' },
  { id: 'airpods-4', image: '/images/hero/airpods-4-hero.webp' },
  { id: 'galaxy-buds3-pro', image: '/images/hero/galaxy-buds3-pro-hero-white.png' },
  { id: 'airpods-max', image: '/images/hero/airpods-max-hero.webp' },
  { id: 'apple-pencil', image: '/images/hero/apple-pencil-hero.webp' },
];

// Keep the Accessories group editorial so its products can change without
// rewriting the filtering behavior or its interface.
const accessoryProductIds = new Set([
  'apple-pencil',
  'estuches-airpods',
  'estuches-iphone',
]);

const samsungProductIds = new Set([
  'galaxy-buds3-pro',
  'samsung-cargador-45w',
  'samsung-adaptador-45w',
  'cable-samsung-usbc-3a',
]);

const catalogFilters = [
  { id: 'all', label: 'Todos', matches: () => true },
  { id: 'audio', label: 'Audio', matches: (product) => product.category === 'Audio' },
  { id: 'accessories', label: 'Accesorios', matches: (product) => accessoryProductIds.has(product.id) },
  { id: 'apple', label: 'Apple', matches: (product) => !samsungProductIds.has(product.id) },
  { id: 'samsung', label: 'Samsung', matches: (product) => samsungProductIds.has(product.id) },
];

// Editorial configuration for the reusable promotion carousel. Keep product
// ids in sync with db.json so the carousel never invents offers or prices.
const promotionDefinitions = [
  {
    id: 'case-pair',
    eyebrow: 'Combo especial',
    title: 'Dos estuches, una sola elección',
    description: 'Elegí el modelo de iPhone y de AirPods para preparar tu combo de estuches protectores.',
    productIds: ['estuches-iphone', 'estuches-airpods'],
    accent: 'slate',
    fixedPriceCRC: 8000,
    label: 'Combo por',
  },
  {
    id: 'airpods',
    eyebrow: 'Audio premium',
    title: 'AirPods 4 + tu estuche',
    description: 'Elegí el color de tu estuche y llevate el combo completo con tus AirPods 4.',
    productIds: ['airpods-4'],
    accent: 'blue',
    fixedPriceCRC: 20000,
    label: 'Combo por',
  },
  {
    id: 'chargers',
    eyebrow: 'Carga USB-C',
    title: 'La potencia que necesitás',
    description: 'Adaptadores y kits USB-C con opciones de 20 W, 25 W, 35 W y 45 W, según el producto disponible.',
    productIds: ['kit-cargador-apple-35w', 'apple-adaptador-usb-c', 'samsung-cargador-45w', 'samsung-adaptador-45w'],
    accent: 'slate',
    label: 'Opciones desde',
  },
  {
    id: 'power-banks',
    eyebrow: 'Energía portátil',
    title: 'Más batería para tu ritmo',
    description: 'Baterías portátiles magnéticas para iPhone con capacidades de 5.000 y 10.000 mAh.',
    productIds: ['bateria-portatil-magnetica-iphone'],
    accent: 'ice',
    label: 'Desde',
  },
];

function newlyAppliedDiscountNotice(previousCart, nextCart) {
  const previousDiscountIds = new Set(cartDiscountBreakdown(previousCart).map((discount) => discount.id));
  return cartDiscountBreakdown(nextCart)
    .filter((discount) => !previousDiscountIds.has(discount.id))
    .map((discount) => discount.message)
    .join(' ');
}

function usePageScroller(reducedMotion) {
  const animationRef = useRef(null);

  const cancelScroll = useCallback(() => {
    if (animationRef.current != null) window.cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
  }, []);

  const scrollToElement = useCallback((element) => {
    if (!element) return;
    cancelScroll();
    const headerOffset = window.innerWidth <= 767 ? 76 : 88;
    const start = window.scrollY;
    const destination = Math.max(0, element.getBoundingClientRect().top + start - headerOffset);
    const distance = destination - start;
    if (reducedMotion || Math.abs(distance) < 2) {
      window.scrollTo({ top: destination, behavior: 'auto' });
      return;
    }
    const duration = Math.min(950, Math.max(650, Math.abs(distance) * 0.35));
    const startedAt = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - ((-2 * progress + 2) ** 2) / 2;
      window.scrollTo({ top: start + distance * eased, behavior: 'auto' });
      if (progress < 1) animationRef.current = window.requestAnimationFrame(animate);
      else animationRef.current = null;
    };
    animationRef.current = window.requestAnimationFrame(animate);
  }, [cancelScroll, reducedMotion]);

  useEffect(() => {
    const interrupt = () => cancelScroll();
    const handleAnchorClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor) return;
      const id = decodeURIComponent(anchor.getAttribute('href').slice(1));
      const target = id ? document.getElementById(id) : document.body;
      if (!target) return;
      event.preventDefault();
      const url = new URL(window.location.href);
      url.hash = id;
      window.history.pushState({}, '', url);
      scrollToElement(target);
    };
    document.addEventListener('click', handleAnchorClick);
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    window.addEventListener('keydown', interrupt);
    return () => {
      cancelScroll();
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('keydown', interrupt);
    };
  }, [cancelScroll, scrollToElement]);

  return scrollToElement;
}

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

function WhatsAppMark() {
  return <svg className="whatsapp-mark" viewBox="0 0 24 24" role="img" aria-label="WhatsApp">
    <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8.9 7.9c.25-.28.62-.31.9-.08l1.05.88c.3.25.37.68.16 1.02l-.5.77c.67 1.3 1.72 2.35 3.02 3.02l.77-.5c.34-.21.77-.14 1.02.16l.88 1.05c.23.28.2.65-.08.9l-.57.51c-.57.51-1.39.68-2.1.42-2.77-1.01-4.93-3.17-5.94-5.94-.26-.71-.09-1.53.42-2.1l.51-.57Z" fill="currentColor" />
  </svg>;
}

function WhatsAppLink({ phone, product, selections, children, className = '' }) {
  const href = product
    ? product.whatsappUrl(phone, selections)
    : `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quisiera consultar sobre los productos de Drop_Zone CR.')}`;
  return <a className={className} href={href} aria-label={product ? `Consultar por WhatsApp sobre ${product.name}` : 'Escribir a Drop Zone CR por WhatsApp'}>
    <WhatsAppMark />{children}
  </a>;
}

function QuantityStepper({ value, onChange, label = 'Cantidad' }) {
  return <div className="quantity-control">
    <span>{label}</span>
    <div className="quantity-stepper">
      <button type="button" onClick={() => onChange(clampQuantity(value - 1))} aria-label="Disminuir cantidad" disabled={value <= 1}><Minus size={15} aria-hidden="true" /></button>
      <input type="number" min="1" max="99" inputMode="numeric" value={value} onChange={(event) => onChange(clampQuantity(event.target.value))} aria-label={label} />
      <button type="button" onClick={() => onChange(clampQuantity(value + 1))} aria-label="Aumentar cantidad" disabled={value >= 99}><Plus size={15} aria-hidden="true" /></button>
    </div>
  </div>;
}

function Header({ settings, sections, cartCount, onOpenCart, cartButtonRef }) {
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
        <button ref={cartButtonRef} className="header-cart" type="button" onClick={onOpenCart} aria-label={`Abrir carrito, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}`}>
          <img className="header-cart__image" src="/images/cart-floating.png" alt="" aria-hidden="true" />
          <span className={cartCount > 0 ? 'header-cart__count header-cart__count--visible' : 'header-cart__count'} aria-hidden="true">{cartCount}</span>
        </button>
        <button ref={menuRef} className="menu-toggle" type="button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-controls="main-navigation" aria-expanded={open} onClick={() => setOpen((value) => !value)}>{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
    </div>
  </header>;
}

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
  const [activeFilter, setActiveFilter] = useState('all');
  const filter = catalogFilters.find((item) => item.id === activeFilter) || catalogFilters[0];
  const products = catalog.featured.filter(filter.matches);

  return <section id="productos" className="catalog section" aria-labelledby="catalog-title">
    <div className="container">
      <div className="section-heading">
        <div><p className="eyebrow">NUESTROS PRODUCTOS</p><h2 id="catalog-title">Seleccionados para vos</h2></div>
        <a href="#comparar" className="text-link">Comparar modelos <ArrowRight size={17} /></a>
      </div>
      <div className="catalog-filters" role="group" aria-label="Filtrar productos">
        {catalogFilters.map((item) => <motion.button
          type="button"
          className={`catalog-filter ${activeFilter === item.id ? 'catalog-filter--active' : ''}`}
          aria-pressed={activeFilter === item.id}
          onClick={() => setActiveFilter(item.id)}
          whileHover={reducedMotion ? undefined : { y: -3, scale: 1.025 }}
          whileTap={reducedMotion ? undefined : { y: 0, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 430, damping: 28 }}
          key={item.id}
        >
          {activeFilter === item.id && <motion.span
            className="catalog-filter__active-bg"
            layoutId="catalog-filter-active"
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
            aria-hidden="true"
          />}
          <span className="catalog-filter__label">{item.label}</span>
        </motion.button>)}
      </div>
      <p className="catalog-filter-status" aria-live="polite">{products.length} {products.length === 1 ? 'producto' : 'productos'} en {filter.label}</p>
      <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} selected={selectedId === product.id} onSelect={onSelect} index={index} reducedMotion={reducedMotion} />)}</div>
    </div>
  </section>;
}

function getDefaultColorName(product) {
  return product.colors.find((color) => color.image === product.image)?.name || product.colors[0]?.name || '';
}

function ConfiguratorPicker({ label, value, options, onChange }) {
  return <AccessiblePicker
    label={label}
    value={value}
    options={options.map((option) => ({ value: option, label: option }))}
    onChange={onChange}
    className="product-picker--configurator"
  />;
}

function ProductDetail({ product, settings, onTabChange, tab, reducedMotion, onAddToCart }) {
  const tabRefs = useRef([]);
  const features = product.referenceFeatures.length ? product.referenceFeatures : product.verifiedFeatures;
  const specificationBrand = product.specSourceBrand || 'Apple';
  const specificationLinks = product.specSourceLinks.length
    ? product.specSourceLinks
    : product.specSourceUrl ? [{ label: `Ver ficha oficial de ${specificationBrand}`, url: product.specSourceUrl }] : [];
  const [selectedModel, setSelectedModel] = useState(product.models[0] || '');
  const [selectedColor, setSelectedColor] = useState(() => getDefaultColorName(product));
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]?.name || '');
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(product.gallery[0]?.name || '');
  const [quantity, setQuantity] = useState(1);
  const selectedColorOption = product.colors.find((color) => color.name === selectedColor);
  const selectedVariantOption = product.variants.find((variant) => variant.name === selectedVariant);
  const selectedGalleryOption = product.gallery.find((item) => item.name === selectedGalleryImage);
  const activeImage = selectedVariantOption?.image || selectedColorOption?.image || selectedGalleryOption?.image || product.detailImage || product.image;
  const activeUnitPrice = selectedVariantOption?.priceCRC ?? product.priceCRC;
  const activePrice = product.formatPrice(activeUnitPrice);
  const activeQuantitySubtotal = activeUnitPrice * quantity;
  const quantityDiscount = quantityDiscountForProduct(product, quantity);
  const quantityDiscountAmount = quantityDiscount?.amount || 0;
  const activeQuantityPrice = product.formatPrice(Math.max(0, activeQuantitySubtotal - quantityDiscountAmount));
  const activeQuantitySubtotalPrice = product.formatPrice(activeQuantitySubtotal);
  const inquirySelections = { model: selectedModel, color: selectedColor, variant: selectedVariant };

  useEffect(() => {
    setSelectedModel(product.models[0] || '');
    setSelectedColor(getDefaultColorName(product));
    setSelectedVariant(product.variants[0]?.name || '');
    setSelectedGalleryImage(product.gallery[0]?.name || '');
    setQuantity(1);
  }, [product.id]);

  const chooseColor = (color) => {
    if (!color) return;
    setSelectedColor(color.name);
  };
  const handleQuantityChange = (nextQuantity) => {
    setQuantity(nextQuantity);
  };
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
      <div className="section-heading section-heading--detail"><div><p className="eyebrow"><img className="eyebrow__brand-icon" src="/favicon.svg" alt="" aria-hidden="true" />EN DETALLE</p><h2 id="detail-section-title">Conocé cada detalle de tu producto</h2></div><p>Descubrí el diseño y las características que hacen único a cada producto.</p></div>
      <motion.div className="detail-panel" initial={reducedMotion ? false : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.58, ease: 'easeOut' }}>
        <div className={`detail-showcase detail-showcase--${product.id}`}>
          <div className="detail-showcase__heading"><span>VISTA DEL PRODUCTO</span></div>
          <motion.div key={`${product.id}-${activeImage}`} initial={reducedMotion ? false : { opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.24 }} className="detail-showcase__image"><img src={activeImage} alt={selectedVariantOption ? `${product.name}, ${selectedVariantOption.name}` : selectedColorOption ? `${product.name} en color ${selectedColorOption.name}` : selectedGalleryOption ? `${product.name}, vista ${selectedGalleryOption.name}` : product.imageAlt} width="900" height="900" loading="lazy" /></motion.div>
          <div className="detail-showcase__caption"><span>{product.category}</span><strong>{product.name}</strong></div>
        </div>
        <div className="detail-content">
          <div className="detail-content__top"><span className="detail-content__eyebrow">EXPLORÁ EL PRODUCTO</span><span className="detail-content__count">{features.length} CARACTERÍSTICAS</span></div>
          <div className="tabs" role="tablist" aria-label={`Información de ${product.name}`}>
            {['Características', 'Precio'].map((label, index) => <button key={label} ref={(element) => { tabRefs.current[index] = element; }} type="button" id={`tab-${index}`} role="tab" aria-selected={tab === index} aria-controls="product-tabpanel" tabIndex={tab === index ? 0 : -1} className={tab === index ? 'tab tab--active' : 'tab'} onClick={() => onTabChange(index)} onKeyDown={(event) => handleTabKey(event, index)}>{label}</button>)}
          </div>
          <div id="product-tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex="0" className="detail-content__body">
            <AnimatePresence mode="wait"><motion.div key={`${product.id}-${tab}`} initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0 }} transition={{ duration: 0.22 }}>
              {tab === 0 ? <>
                <p className="detail-content__category">{product.category.toUpperCase()} / {product.name.toUpperCase()}</p>
                <h3>{product.name}</h3><p className="detail-content__description detail-content__description--product">{product.shortDescription}</p>
                <p className="detail-content__category detail-content__category--features">{specificationLinks.length ? (product.specReferenceTitle || `CARACTERÍSTICAS DEL MODELO SEGÚN ${specificationBrand.toUpperCase()}`) : 'CARACTERÍSTICAS DEL PRODUCTO'}</p>
                <ul className="feature-list">{features.map((feature) => { const Icon = iconMap[feature.icon] || Info; return <li key={feature.label}><span><Icon size={19} strokeWidth={1.7} aria-hidden="true" /></span><strong>{feature.label}</strong></li>; })}</ul>
                {specificationLinks.length > 0 && <p className="detail-reference">{product.specReferenceNotice || 'Especificaciones de referencia. Confirmá la versión y funciones del artículo disponible con la tienda.'} {specificationLinks.map((source, index) => <span key={source.url}>{index > 0 && ' · '}<a href={source.url}>{source.label} <ArrowRight size={13} aria-hidden="true" /></a></span>)}</p>}
              </> : <>
                <p className="detail-content__category">PRECIO PUBLICADO</p>
                <h3>{product.name}</h3><p className="price-big">{activePrice}</p>
                <p className="detail-content__description">{settings.shippingMessage}</p>
                <p className="detail-content__small">La versión, disponibilidad y detalles finales se confirman directamente con la tienda.</p>
              </>}
            </motion.div></AnimatePresence>
          </div>
          {(product.configurable || product.colorConfigurable) && <div className="product-configurator" role="group" aria-labelledby="color-configurator-title">
            <div className="product-configurator__heading"><div><span>{product.configuratorEyebrow || 'PERSONALIZÁ TU ESTUCHE'}</span><strong id="color-configurator-title">{product.configuratorTitle || 'Elegí modelo y color'}</strong></div><span>{product.colors.length} colores</span></div>
            <div className={product.models.length ? 'product-configurator__fields' : 'product-configurator__fields product-configurator__fields--single'}>
              {product.models.length > 0 && <label>{product.modelLabel || 'Modelo'}<ConfiguratorPicker label={product.modelLabel || 'Modelo'} value={selectedModel} options={product.models} onChange={setSelectedModel} /></label>}
              <label>Color<ConfiguratorPicker label="Color" value={selectedColor} options={product.colors.map((color) => color.name)} onChange={(colorName) => chooseColor(product.colors.find((color) => color.name === colorName))} /></label>
            </div>
            <div className="case-colors" role="group" aria-label="Colores disponibles">{product.colors.map((color) => <button key={color.name} type="button" className={selectedColor === color.name ? 'case-color case-color--active' : 'case-color'} onClick={() => chooseColor(color)} aria-label={`Elegir color ${color.name}`} aria-pressed={selectedColor === color.name}><span style={{ backgroundColor: color.hex }} aria-hidden="true" /><small>{color.name}</small></button>)}</div>
          </div>}
          {product.variants.length > 0 && <div className="product-configurator" role="group" aria-labelledby="variant-configurator-title">
            <div className="product-configurator__heading"><div><span>{product.configuratorEyebrow || 'ELEGÍ TU OPCIÓN'}</span><strong id="variant-configurator-title">{product.configuratorTitle || 'Seleccioná la opción que necesitás'}</strong></div><span>{product.variants.length} opciones</span></div>
            <div className="product-configurator__fields product-configurator__fields--single">
              <label>{product.variantLabel || 'Opción'}<ConfiguratorPicker label={product.variantLabel || 'Opción'} value={selectedVariant} options={product.variants.map((variant) => variant.name)} onChange={setSelectedVariant} /></label>
            </div>
            {product.showVariantPrices && <div className="variant-options" role="group" aria-label="Opciones de capacidad y precio">{product.variants.map((variant) => <button key={variant.name} type="button" className={selectedVariant === variant.name ? 'variant-option variant-option--active' : 'variant-option'} onClick={() => setSelectedVariant(variant.name)} aria-pressed={selectedVariant === variant.name}><span>{variant.name}</span><strong>{product.formatPrice(variant.priceCRC)}</strong></button>)}</div>}
          </div>}
          {product.gallery.length > 0 && <div className="product-configurator" role="group" aria-labelledby="gallery-configurator-title">
            <div className="product-configurator__heading"><div><span>GALERÍA DEL PRODUCTO</span><strong id="gallery-configurator-title">Elegí la vista que querés ver</strong></div><span>{product.gallery.length} fotos</span></div>
            <div className="image-gallery-options">{product.gallery.map((item) => <button key={item.name} type="button" className={selectedGalleryImage === item.name ? 'image-gallery-option image-gallery-option--active' : 'image-gallery-option'} onClick={() => setSelectedGalleryImage(item.name)} aria-pressed={selectedGalleryImage === item.name}><img src={item.image} alt="" aria-hidden="true" /><span>{item.name}</span></button>)}</div>
          </div>}
          <div className="purchase-row">
            <QuantityStepper value={quantity} onChange={handleQuantityChange} />
            <p>Elegí primero el modelo, tipo o color cuando corresponda.</p>
          </div>
          {quantityDiscount && <div className="quantity-discount-notice" role="status"><span className="quantity-discount-notice__icon"><Check size={16} aria-hidden="true" /></span><span className="quantity-discount-notice__copy"><strong>{quantityDiscount.label}</strong><small>Ahorrás {product.formatPrice(quantityDiscount.amount)} {quantityDiscount.description}.</small></span></div>}
          <div className="detail-content__footer">
            <div className="detail-content__price" aria-live="polite"><span>{quantityDiscount ? 'TOTAL CON DESCUENTO' : quantity > 1 ? 'PRECIO TOTAL' : 'PRECIO'}</span>{quantityDiscount && <del>{activeQuantitySubtotalPrice}</del>}<strong>{activeQuantityPrice}</strong>{quantity > 1 && <small>{activePrice} por unidad{quantityDiscount ? ` · Ahorrás ${product.formatPrice(quantityDiscount.amount)}` : ''}</small>}</div>
            <div className="detail-content__actions">
              <WhatsAppLink phone={settings.whatsappPhone} product={product} selections={inquirySelections} className="button button--whatsapp">Consultar solo este producto <ArrowRight size={17} /></WhatsAppLink>
              <button type="button" className="button button--cart" onClick={() => onAddToCart(product, inquirySelections, quantity)}><ShoppingCart size={17} aria-hidden="true" />Agregar al carrito</button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>;
}

function Comparison({ catalog, onSelect, reducedMotion }) {
  const [firstId, setFirstId] = useState(catalog.products[0]?.id);
  const [secondId, setSecondId] = useState(catalog.products[1]?.id);
  const [expanded, setExpanded] = useState(false);
  const first = catalog.find(firstId) || catalog.products[0];
  const second = catalog.find(secondId) || catalog.products[1];
  const difference = Math.abs(first.priceCRC - second.priceCRC);
  const comparison = compareProducts(first, second);
  const differenceLabel = difference === 0
    ? 'Ambos tienen el mismo precio publicado.'
    : `Diferencia de precio: ₡${new Intl.NumberFormat('es-CR').format(difference).replace(/[\s\u00a0\u202f]/g, '.')}`;

  useEffect(() => setExpanded(false), [firstId, secondId]);

  const compareCard = (product, index, value, onChange) => <motion.article className="compare-card" key={`${index}-${product.id}`} initial={reducedMotion ? false : { opacity: 0, y: 22, scale: 0.985 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.46, delay: reducedMotion ? 0 : index * 0.1, ease: 'easeOut' }}>
    <div className="compare-card__top"><span>0{index + 1} / {index === 0 ? 'TU ELECCIÓN' : 'COMPARAR CON'}</span><span className="compare-card__category">{product.category}</span></div>
    <div className="compare-card__select-wrap"><AccessiblePicker
      label={index === 0 ? 'Primer producto para comparar' : 'Segundo producto para comparar'}
      value={value}
      onChange={onChange}
      options={catalog.products.map((option) => ({ value: option.id, label: option.name, description: option.category }))}
    /></div>
    <div className="compare-card__visual"><img src={product.image} alt={product.imageAlt} width="900" height="900" loading="lazy" decoding="async" /></div>
    <div className="compare-card__info"><p>{product.verifiedFeatures[0]?.label || product.category}</p><div><strong>{product.formattedPrice}</strong><button type="button" onClick={() => onSelect(product.id)} aria-label={`Ver detalles de ${product.name}`}>Ver detalles <ArrowRight size={16} aria-hidden="true" /></button></div></div>
  </motion.article>;

  return <section id="comparar" className="comparison section" aria-labelledby="compare-title"><div className="container">
    <div className="section-heading comparison__heading"><div><p className="eyebrow"><img className="eyebrow__brand-icon" src="/favicon.svg" alt="" aria-hidden="true" />ENCONTRÁ TU MEJOR OPCIÓN</p><h2 id="compare-title">Compará dos modelos y elegí el mejor</h2></div><p>Elegí dos productos y compará sus precios de un vistazo.</p></div>
    <div className="comparison-stage">
      {compareCard(first, 0, firstId, setFirstId)}
      <div className="comparison-stage__versus" aria-hidden="true">VS</div>
      {compareCard(second, 1, secondId, setSecondId)}
    </div>
    <div className={`comparison-summary ${expanded ? 'comparison-summary--expanded' : ''}`}>
      <div className="comparison-summary__overview">
        <span className="comparison-summary__mark"><Check size={18} aria-hidden="true" /></span>
        <div className="comparison-summary__copy">
          <div className="comparison-summary__price"><strong>{differenceLabel}</strong><span>{catalog.products.length} MODELOS PARA EXPLORAR</span></div>
          <p>{comparison.conclusion}</p>
          <p className="comparison-summary__recommendation">{comparison.recommendation.first.replace(':', '')} {comparison.recommendation.second.replace(':', '')}</p>
        </div>
      </div>
      <button
        type="button"
        className="comparison-summary__toggle"
        aria-expanded={expanded}
        aria-controls="comparison-differences"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? 'Ocultar diferencias' : 'Ver diferencias'}
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {expanded && <motion.div
          id="comparison-differences"
          className="comparison-details"
          initial={reducedMotion ? false : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25, ease: 'easeInOut' }}
        >
          {comparison.rows.length ? <div className="comparison-table" role="table" aria-label={`Comparación entre ${first.name} y ${second.name}`}>
            <div className="comparison-table__row comparison-table__head" role="row">
              <span role="columnheader">Característica</span>
              <span role="columnheader">{first.name}</span>
              <span role="columnheader">{second.name}</span>
            </div>
            {comparison.rows.map((row) => <div className="comparison-table__row" role="row" key={row.key}>
              <strong role="rowheader">{row.label}</strong>
              <span role="cell" className={row.advantage === 'first' ? 'comparison-table__advantage' : ''}>
                {row.first?.value || 'No especificado'}
                {row.advantage === 'first' && <Check size={14} aria-label="Ventaja verificable" />}
              </span>
              <span role="cell" className={row.advantage === 'second' ? 'comparison-table__advantage' : ''}>
                {row.second?.value || 'No especificado'}
                {row.advantage === 'second' && <Check size={14} aria-label="Ventaja verificable" />}
              </span>
            </div>)}
          </div> : <p className="comparison-details__empty">No hay suficientes especificaciones verificadas para comparar estos productos.</p>}
          <div className="comparison-details__conclusion">
            <p><strong>{first.name}</strong> {comparison.recommendation.first.replace(`${first.name}: `, '')}</p>
            <p><strong>{second.name}</strong> {comparison.recommendation.second.replace(`${second.name}: `, '')}</p>
            <p><strong>Diferencia</strong> {formatCRC(difference)}.</p>
          </div>
          {comparison.matchingRowCount > 0 && <p className="comparison-details__matches">Las diferencias aparecen primero; después se muestran {comparison.matchingRowCount} {comparison.matchingRowCount === 1 ? 'característica compartida' : 'características compartidas'} de las fichas verificadas.</p>}
          {comparison.omittedMatchCount > 0 && <p className="comparison-details__matches">Se omitieron {comparison.omittedMatchCount} coincidencias adicionales para mantener la comparación compacta.</p>}
        </motion.div>}
      </AnimatePresence>
    </div>
  </div></section>;
}

function CartDrawer({ open, cart, settings, onClose, onUpdateQuantity, onRemove, onEditProduct, triggerRef }) {
  const closeButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const count = cartItemCount(cart);
  const subtotal = cartSubtotal(cart);
  const total = cartTotal(cart);
  const audioCount = audioProductCount(cart);
  const caseCount = caseProductCount(cart);
  const iphoneCaseCount = iphoneCaseProductCount(cart);
  const applePencilCount = applePencilProductCount(cart);
  const discountBreakdown = cartDiscountBreakdown(cart);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previouslyFocusedElement = triggerRef.current || document.activeElement;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      if (previouslyFocusedElement instanceof HTMLElement && previouslyFocusedElement.isConnected) {
        previouslyFocusedElement.focus();
      }
    };
  }, [open, onClose, triggerRef]);

  const trapDialogFocus = (event) => {
    if (event.key !== 'Tab') return;
    const focusable = dialogRef.current?.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable?.length) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;
  return <div className="cart-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside ref={dialogRef} className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" onKeyDown={trapDialogFocus}>
      <div className="cart-drawer__header">
        <div><span>TU PEDIDO</span><h2 id="cart-title">Carrito de compras</h2></div>
        <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Cerrar carrito"><X size={20} aria-hidden="true" /></button>
      </div>
      {cart.length === 0 ? <div className="cart-empty">
        <span><ShoppingCart size={25} aria-hidden="true" /></span>
        <h3>Tu carrito está vacío</h3>
        <p>Elegí un producto, configurá sus opciones y agregalo al pedido.</p>
        <button type="button" className="button button--secondary" onClick={onClose}>Explorar productos</button>
      </div> : <>
        <div className="cart-items">
          {cart.map((item) => <article className="cart-item" key={item.key}>
            <img src={item.image} alt="" aria-hidden="true" />
            <div className="cart-item__content">
              <div className="cart-item__heading"><div><h3>{item.name}</h3>{item.options.map((option) => <p key={option}>{option}</p>)}</div><button type="button" onClick={() => onRemove(item.key)} aria-label={`Eliminar ${item.name} del carrito`}><Trash2 size={16} aria-hidden="true" /></button></div>
              <div className="cart-item__controls"><QuantityStepper value={item.quantity} onChange={(quantity) => onUpdateQuantity(item.key, quantity)} /><strong>{formatCRC(item.unitPriceCRC * item.quantity)}</strong></div>
              <button type="button" className="cart-item__edit" onClick={() => onEditProduct(item.productId)}>Cambiar opciones del producto</button>
            </div>
          </article>)}
        </div>
        <div className="cart-drawer__summary">
          <div className="cart-drawer__summary-title"><span>Resumen del pedido</span><span>{count} {count === 1 ? 'producto' : 'productos'}</span></div>
          <div className="cart-drawer__summary-row"><span>Subtotal</span><strong>{formatCRC(subtotal)}</strong></div>
          {discountBreakdown.map((item) => <div className="cart-drawer__discount" key={item.id}><span><Check size={14} aria-hidden="true" />{item.label}</span><strong>-{formatCRC(item.amount)}</strong></div>)}
          <div className="cart-drawer__total"><span className="sr-only">Total</span><strong>Total: {formatCRC(total)}</strong></div>
          {discountBreakdown.length ? <p className="cart-drawer__promo cart-drawer__promo--active">{discountBreakdown.map((item) => item.message).join(' ')}</p> : audioCount === 1 ? <p className="cart-drawer__promo">Agregá otro producto de Audio y obtené ₡5.000 de descuento.</p> : caseCount === 1 ? <p className="cart-drawer__promo">Agregá otro estuche para AirPods y obtené ₡1.500 de descuento.</p> : iphoneCaseCount === 1 ? <p className="cart-drawer__promo">Agregá otro estuche para iPhone y obtené ₡2.000 de descuento.</p> : applePencilCount === 1 ? <p className="cart-drawer__promo">Agregá otro Apple Pencil y obtené ₡3.000 de descuento.</p> : null}
          <p>La disponibilidad y entrega se confirman por WhatsApp.</p>
        </div>
        <div className="cart-drawer__actions">
          <a className="button button--whatsapp" href={createCartWhatsAppUrl(settings.whatsappPhone, cart)} aria-label="Enviar pedido completo por WhatsApp"><WhatsAppMark />Hacer pedido por WhatsApp <ArrowRight size={17} aria-hidden="true" /></a>
          <button type="button" className="cart-continue" onClick={onClose}>Seguir comprando</button>
        </div>
      </>}
    </aside>
  </div>;
}

function PromotionsCarousel({ catalog, settings, onSelect, reducedMotion }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [isCasePairConfigurator, setIsCasePairConfigurator] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState('airpods-pro-3');
  const [selectedCaseColor, setSelectedCaseColor] = useState('Azul oscuro');
  const [selectedIphoneCaseModel, setSelectedIphoneCaseModel] = useState('');
  const [selectedAirpodsCaseModel, setSelectedAirpodsCaseModel] = useState('');
  const [selectedPairCaseColor, setSelectedPairCaseColor] = useState('');
  const dialogRef = useRef(null);
  const pointerStartX = useRef(null);
  const pointerDragged = useRef(false);
  const suppressClick = useRef(false);
  const resumeTimeout = useRef(null);

  const promotions = promotionDefinitions.map((definition) => ({
    ...definition,
    products: definition.productIds.map((id) => catalog.find(id)).filter(Boolean),
  })).filter((promotion) => promotion.products.length);

  const moveTo = useCallback((index) => setActiveIndex((index + promotions.length) % promotions.length), [promotions.length]);
  const pauseForInteraction = useCallback((resume = false) => {
    setIsPaused(true);
    if (resume) {
      window.clearTimeout(resumeTimeout.current);
      resumeTimeout.current = window.setTimeout(() => setIsPaused(false), 6500);
    }
  }, []);

  useEffect(() => () => window.clearTimeout(resumeTimeout.current), []);
  useEffect(() => {
    if (reducedMotion || isPaused || promotions.length < 2) return undefined;
    const intervalId = window.setInterval(() => setActiveIndex((current) => (current + 1) % promotions.length), 4000);
    return () => window.clearInterval(intervalId);
  }, [isPaused, promotions.length, reducedMotion]);
  useEffect(() => {
    const onVisibilityChange = () => setIsPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  if (!promotions.length) return null;
  const activePromotion = promotions[activeIndex] || promotions[0];
  const featuredProduct = activePromotion.products[0];
  const caseProduct = catalog.find('estuches-airpods');
  const iphoneCaseProduct = catalog.find('estuches-iphone');
  const selectedModel = catalog.find(selectedModelId) || featuredProduct;
  const selectedColor = caseProduct?.colors?.find((color) => color.name === selectedCaseColor) || caseProduct?.colors?.[0];
  const selectedPairColor = caseProduct?.colors?.find((color) => color.name === selectedPairCaseColor) || caseProduct?.colors?.[0];
  const prices = activePromotion.products.flatMap((product) => product.variants?.length ? product.variants.map((variant) => variant.priceCRC) : [product.priceCRC]).filter(Number.isFinite);
  const startingPrice = activePromotion.fixedPriceCRC || (prices.length ? Math.min(...prices) : null);
  const openConfigurator = () => {
    pauseForInteraction(true);
    if (activePromotion.id === 'case-pair') {
      setIsCasePairConfigurator(true);
      setSelectedIphoneCaseModel(iphoneCaseProduct?.models?.[0] || '');
      setSelectedAirpodsCaseModel(caseProduct?.models?.[0] || '');
      setSelectedPairCaseColor(caseProduct?.colors?.[0]?.name || '');
      setIsConfiguratorOpen(true);
      return;
    }
    if (activePromotion.id !== 'airpods') {
      onSelect(featuredProduct.id);
      return;
    }
    setIsCasePairConfigurator(false);
    setSelectedModelId(featuredProduct.id);
    setSelectedCaseColor(caseProduct?.colors?.[0]?.name || '');
    setIsConfiguratorOpen(true);
  };
  const closeConfigurator = () => setIsConfiguratorOpen(false);
  const inquiryMessage = `Hola, quiero solicitar la promoción AirPods 4 + estuche por ₡20.000.\nAudífonos: ${selectedModel.name}.\nColor del estuche: ${selectedColor?.name || 'por elegir'}.\nPrecio promocional: ₡20.000.\n¿Me confirman compatibilidad, existencias y precio final?`;
  const inquiryHref = `https://wa.me/${String(settings.whatsappPhone).replace(/\D/g, '')}?text=${encodeURIComponent(inquiryMessage)}`;
  const casePairInquiryMessage = `Hola, quiero solicitar el combo de dos estuches por ₡8.000.\nEstuche para iPhone: ${selectedIphoneCaseModel || 'por elegir'}.\nEstuche para AirPods: ${selectedAirpodsCaseModel || 'por elegir'}.\nColor del estuche de AirPods: ${selectedPairColor?.name || 'por elegir'}.\n¿Me confirman disponibilidad y compatibilidad de ambos estuches?`;
  const casePairInquiryHref = `https://wa.me/${String(settings.whatsappPhone).replace(/\D/g, '')}?text=${encodeURIComponent(casePairInquiryMessage)}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (isConfiguratorOpen && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    }
    if (!isConfiguratorOpen && dialog.open) dialog.close();
    return undefined;
  }, [isConfiguratorOpen]);

  useEffect(() => {
    if (!isConfiguratorOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const previousOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [isConfiguratorOpen]);
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); pauseForInteraction(true); moveTo(activeIndex - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); pauseForInteraction(true); moveTo(activeIndex + 1); }
  };
  const handlePointerDown = (event) => {
    if (event.target.closest('button')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStartX.current = event.clientX;
    pointerDragged.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pauseForInteraction(true);
  };
  const handlePointerMove = (event) => {
    if (pointerStartX.current == null) return;
    if (Math.abs(event.clientX - pointerStartX.current) > 8) {
      pointerDragged.current = true;
      event.preventDefault();
    }
  };
  const finishPointerGesture = (event) => {
    if (pointerStartX.current == null) return;
    const delta = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (pointerDragged.current) {
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
    }
    if (Math.abs(delta) > 45) moveTo(activeIndex + (delta < 0 ? 1 : -1));
    if (event.pointerId != null) event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return <section className="promotions section" aria-labelledby="promotions-title">
    <div className="container">
      <div className="promotions__heading">
        <div><p className="eyebrow">PROMOCIONES DROP_ZONE</p><h2 id="promotions-title">Precios exclusivos</h2></div>
      </div>
      <div className="promotion-carousel" tabIndex="0" role="region" aria-roledescription="carrusel" aria-label="Promociones destacadas" onKeyDown={handleKeyDown} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onFocus={() => setIsPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false); }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={finishPointerGesture} onPointerCancel={finishPointerGesture} onPointerLeave={finishPointerGesture} onClickCapture={(event) => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
        <div className="promotion-carousel__viewport">
          {promotions.map((promotion, index) => {
            const product = promotion.products[0];
            const isActive = index === activeIndex;
            return <article key={promotion.id} className={`promotion-slide promotion-slide--${promotion.accent} promotion-slide--${promotion.id} ${isActive ? 'promotion-slide--active' : ''}`} aria-hidden={!isActive} aria-roledescription="diapositiva" aria-label={`${index + 1} de ${promotions.length}: ${promotion.title}`}>
              <div className="promotion-slide__copy">
                {promotion.id !== 'case-pair' && <span className="promotion-slide__eyebrow">{promotion.eyebrow}</span>}<h3>{promotion.title}</h3><p>{promotion.description}</p>
                {promotion.id === 'airpods' && <span className="promotion-slide__detail">AirPods 4 · {caseProduct?.colors?.length || 0} colores de estuche</span>}
                {promotion.id === 'case-pair' && <span className="promotion-slide__detail">Estuche para iPhone + estuche para AirPods</span>}
                {startingPrice && isActive && <span className="promotion-slide__price"><small>{promotion.label}</small> {formatCRC(startingPrice)}</span>}
                <button className="button promotion-slide__cta" type="button" onClick={openConfigurator} tabIndex={isActive ? 0 : -1}>{promotion.id === 'case-pair' ? 'Elegir combo' : 'Personalizar promoción'} <ArrowRight size={17} aria-hidden="true" /></button>
              </div>
              <div className="promotion-slide__media"><div className="promotion-slide__halo" aria-hidden="true" /><ProductImage product={product} className="promotion-slide__image" eager={index === 0} />{promotion.id === 'airpods' && caseProduct?.colors?.[0] && <img className="promotion-slide__case" src={caseProduct.colors[0].image} alt="Estuche compatible para AirPods" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />}{promotion.id === 'case-pair' && caseProduct?.image && <img className="promotion-slide__case promotion-slide__case--pair" src={caseProduct.image} alt="Segundo estuche para AirPods" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />}</div>
            </article>;
          })}
        </div>
        <button className="promotion-carousel__arrow promotion-carousel__arrow--prev" type="button" aria-label="Ver promoción anterior" onClick={() => { pauseForInteraction(true); moveTo(activeIndex - 1); }}><ChevronDown size={20} aria-hidden="true" /></button>
        <button className="promotion-carousel__arrow promotion-carousel__arrow--next" type="button" aria-label="Ver siguiente promoción" onClick={() => { pauseForInteraction(true); moveTo(activeIndex + 1); }}><ChevronDown size={20} aria-hidden="true" /></button>
        <div className="promotion-carousel__dots" role="group" aria-label="Seleccionar promoción">{promotions.map((promotion, index) => <button key={promotion.id} type="button" className={`promotion-carousel__dot ${index === activeIndex ? 'promotion-carousel__dot--active' : ''}`} aria-label={`Ir a ${promotion.title}`} aria-current={index === activeIndex ? 'true' : undefined} onClick={() => { pauseForInteraction(true); moveTo(index); }} />)}</div>
        <p className="sr-only" aria-live="polite">{activePromotion.title}, {featuredProduct.name}</p>
      </div>
      <dialog ref={dialogRef} className="promotion-dialog" aria-labelledby="promotion-dialog-title" onClose={() => setIsConfiguratorOpen(false)} onClick={(event) => { if (event.target === event.currentTarget) closeConfigurator(); }}>
        <div className="promotion-dialog__shell">
          <header className="promotion-dialog__header">
            <div>{!isCasePairConfigurator && <span className="promotion-dialog__eyebrow">Elegí tu combinación</span>}<h2 id="promotion-dialog-title">{isCasePairConfigurator ? 'Personalizá tu combo' : 'Personalizá tu promoción'}</h2><p>{isCasePairConfigurator ? 'Seleccioná el modelo de iPhone y de AirPods para preparar los dos estuches.' : 'Elegí primero tus AirPods y después el color del estuche compatible.'}</p></div>
            <button type="button" className="promotion-dialog__close" onClick={closeConfigurator} aria-label="Cerrar personalización"><X size={17} aria-hidden="true" /></button>
          </header>
          {isCasePairConfigurator ? <div className="promotion-dialog__body promotion-dialog__body--case-pair">
            <div className="promotion-dialog__preview"><div className="promotion-dialog__preview-images promotion-dialog__preview-images--pair"><img src={iphoneCaseProduct?.image} alt="Estuche para iPhone" /><img src={caseProduct?.image} alt="Estuche para AirPods" /></div><strong>Dos estuches protectores</strong></div>
            <div className="promotion-dialog__options">
              <AccessiblePicker label="1. Modelo de iPhone" value={selectedIphoneCaseModel} onChange={setSelectedIphoneCaseModel} className="promotion-dialog__picker promotion-dialog__picker--iphone" options={(iphoneCaseProduct?.models || []).map((model) => ({ value: model, label: model }))} />
              <AccessiblePicker label="2. Modelo de AirPods" value={selectedAirpodsCaseModel} onChange={setSelectedAirpodsCaseModel} className="promotion-dialog__picker promotion-dialog__picker--second" options={(caseProduct?.models || []).map((model) => ({ value: model, label: model }))} />
              <div className="promotion-dialog__pair-color"><span>3. Color del estuche de AirPods</span><strong>{selectedPairColor?.name}</strong></div>
              <div className="promotion-dialog__colors" role="group" aria-label="Seleccionar color del estuche de AirPods">{caseProduct?.colors?.map((color) => <button key={`pair-${color.name}`} type="button" className={`promotion-color ${selectedPairColor?.name === color.name ? 'promotion-color--selected' : ''}`} aria-label={`Estuche de AirPods ${color.name}`} aria-pressed={selectedPairColor?.name === color.name} onClick={() => setSelectedPairCaseColor(color.name)}><span style={{ backgroundColor: color.hex }} /><small>{color.name}</small></button>)}</div>
              <div className="promotion-dialog__summary"><div><span>Estuche para iPhone</span><strong>{selectedIphoneCaseModel || 'Por elegir'}</strong></div><div><span>Estuche para AirPods</span><strong>{selectedAirpodsCaseModel || 'Por elegir'} · {selectedPairColor?.name}</strong></div><div className="promotion-dialog__total"><span>Combo de los dos</span><strong>₡8.000</strong></div><p>El precio aplica al combo de dos estuches. Confirmaremos compatibilidad y disponibilidad por WhatsApp.</p></div>
              <a className="button button--whatsapp promotion-dialog__submit" href={casePairInquiryHref} target="_blank" rel="noopener noreferrer" onClick={closeConfigurator}>Solicitar combo de estuches <ArrowRight size={17} aria-hidden="true" /></a>
            </div>
          </div> : <div className="promotion-dialog__body">
            <div className="promotion-dialog__preview"><div className="promotion-dialog__preview-images"><ProductImage product={selectedModel} eager /><img src={selectedColor?.image} alt={`Estuche ${selectedColor?.name || ''}`} /></div><strong>{selectedModel.name} + estuche {selectedColor?.name || ''}</strong><span>Compatibilidad y disponibilidad se confirman antes de pedir.</span></div>
            <div className="promotion-dialog__options">
              <AccessiblePicker
                label="1. Modelo de AirPods"
                value={selectedModel.id}
                onChange={setSelectedModelId}
                className="promotion-dialog__picker"
                options={(promotionDefinitions.find((definition) => definition.id === 'airpods')?.productIds || []).map((id) => catalog.find(id)).filter(Boolean).map((product) => ({ value: product.id, label: product.name }))}
              />
              <div className="promotion-dialog__color-heading"><label>2. Color del estuche</label><span>{selectedColor?.name}</span></div>
              <div className="promotion-dialog__colors" role="group" aria-label="Seleccionar color del estuche">{caseProduct?.colors?.map((color) => <button key={color.name} type="button" className={`promotion-color ${selectedColor?.name === color.name ? 'promotion-color--selected' : ''}`} aria-label={`Estuche ${color.name}`} aria-pressed={selectedColor?.name === color.name} onClick={() => setSelectedCaseColor(color.name)}><span style={{ backgroundColor: color.hex }} /><small>{color.name}</small></button>)}</div>
              <div className="promotion-dialog__summary"><div><span>AirPods 4</span><strong>{selectedModel.formattedPrice}</strong></div><div><span>Estuche compatible</span><strong>{caseProduct?.formattedPrice || 'Por confirmar'}</strong></div><div className="promotion-dialog__total"><span>Precio de promoción</span><strong>₡20.000</strong></div><p>Promoción AirPods 4 + estuche. Confirmaremos compatibilidad y existencias por WhatsApp.</p></div>
              <a className="button button--whatsapp promotion-dialog__submit" href={inquiryHref} target="_blank" rel="noopener noreferrer" onClick={closeConfigurator}>Solicitar esta selección <ArrowRight size={17} aria-hidden="true" /></a>
            </div>
          </div>}
        </div>
      </dialog>
    </div>
  </section>;
}

function Footer({ settings }) {
  return <>
    <div className="footer-transition" aria-hidden="true" />
    <footer id="contacto" className="footer"><div className="container footer__main"><div className="footer__brand"><Brand compact /><p>{settings.tagline}</p></div><div className="footer__links"><span className="location-link"><MapPin size={17} />{settings.location}</span><a className="phone-link" href={`tel:+${settings.whatsappPhone}`}><Phone size={17} />{settings.displayPhone}</a><a className="instagram-link" href={settings.instagramUrl}><InstagramBrandIcon />{settings.instagramHandle}</a></div><WhatsAppLink phone={settings.whatsappPhone} className="button button--whatsapp">Escribenos a nuestro WhatsApp <ArrowRight size={17} /></WhatsAppLink></div><div className="container footer__bottom"><span>© {new Date().getFullYear()} Drop_Zone CR</span><span>Comercio independiente. Las marcas mencionadas pertenecen a sus titulares.</span></div></footer>
  </>;
}

export default function App() {
  const [data, setData] = useState(() => getFallbackData());
  const [loadState, setLoadState] = useState('loading');
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get('producto') || 'airpods-pro-3');
  const [tab, setTab] = useState(0);
  const [cart, setCart] = useState(() => readStoredCart(window.localStorage));
  const [cartOpen, setCartOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState('');
  const cartButtonRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const scrollToElement = usePageScroller(reducedMotion);
  const closeCart = useCallback(() => setCartOpen(false), []);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      setLoadState('ready');
      return undefined;
    }

    const controller = new AbortController();
    service.load(controller.signal).then((next) => { setData(next); setLoadState('ready'); }).catch((error) => { if (error.name !== 'AbortError') setLoadState('fallback'); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'auto';
    const onPopState = () => {
      setSelectedId(new URLSearchParams(window.location.search).get('producto') || 'airpods-pro-3');
      setTab(0);
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    setCart((current) => {
      let changed = false;
      const hydrated = current.map((item) => {
        if (item.category) return item;
        const storedProduct = data.catalog.find(item.productId);
        if (!storedProduct?.category) return item;
        changed = true;
        return { ...item, category: storedProduct.category };
      });
      return changed ? hydrated : current;
    });
  }, [data.catalog]);

  useEffect(() => {
    try {
      window.localStorage.setItem('drop-zone-cart', JSON.stringify(cart));
    } catch {
      // The cart remains usable for the current visit when storage is unavailable.
    }
  }, [cart]);

  useEffect(() => {
    if (!cartNotice) return undefined;
    const timeoutId = window.setTimeout(() => setCartNotice(''), 2400);
    return () => window.clearTimeout(timeoutId);
  }, [cartNotice]);

  const selectProduct = (id) => {
    setSelectedId(id);
    setTab(0);
    const url = new URL(window.location.href);
    url.searchParams.set('producto', id);
    window.history.pushState({}, '', url);
    requestAnimationFrame(() => scrollToElement(document.getElementById('caracteristicas')));
  };
  const handleAddToCart = (selectedProduct, selections, quantity) => {
    const item = createCartItem(selectedProduct, selections, quantity);
    const nextCart = addCartItem(cart, item);
    const discountNotice = newlyAppliedDiscountNotice(cart, nextCart);
    setCart(nextCart);
    setCartNotice(discountNotice || `${item.name} agregado al carrito`);
  };
  const handleUpdateCartQuantity = (key, quantity) => {
    const nextCart = updateCartItemQuantity(cart, key, quantity);
    const discountNotice = newlyAppliedDiscountNotice(cart, nextCart);
    setCart(nextCart);
    if (discountNotice) setCartNotice(discountNotice);
  };
  const handleEditCartProduct = (id) => {
    closeCart();
    selectProduct(id);
  };
  const product = data.catalog.find(selectedId) || data.catalog.featured[0];
  const numberOfCartItems = cartItemCount(cart);

  return <>
    <ScrollProgress reducedMotion={reducedMotion} />
    <a className="skip-link" href="#contenido">Saltar al contenido</a>
    <Header settings={data.settings} sections={data.siteSections} cartCount={numberOfCartItems} onOpenCart={() => setCartOpen(true)} cartButtonRef={cartButtonRef} />
    <main id="contenido">
      {loadState === 'loading' && <div className="api-loading" role="status">Actualizando catálogo…</div>}
      {loadState === 'fallback' && <div className="api-notice" role="status">Vista de respaldo: el catálogo local no está conectado. Los datos mostrados proceden de la copia incluida en la web.</div>}
      <Hero settings={data.settings} reducedMotion={reducedMotion} />
      <Catalog catalog={data.catalog} selectedId={product.id} onSelect={selectProduct} reducedMotion={reducedMotion} />
      <ProductDetail product={product} settings={data.settings} tab={tab} onTabChange={setTab} reducedMotion={reducedMotion} onAddToCart={handleAddToCart} />
      <Comparison catalog={data.catalog} onSelect={selectProduct} reducedMotion={reducedMotion} />
      <PromotionsCarousel catalog={data.catalog} settings={data.settings} onSelect={selectProduct} reducedMotion={reducedMotion} />
    </main>
    <Footer settings={data.settings} />
    <CartDrawer open={cartOpen} cart={cart} settings={data.settings} onClose={closeCart} onUpdateQuantity={handleUpdateCartQuantity} onRemove={(key) => setCart((current) => removeCartItem(current, key))} onEditProduct={handleEditCartProduct} triggerRef={cartButtonRef} />
    {cartNotice && <div className="cart-toast" role="status"><Check size={16} aria-hidden="true" />{cartNotice}</div>}
    <span className="sr-only" role="status" aria-live="polite">{product.name} seleccionado, precio {product.formattedPrice}</span>
  </>;
}

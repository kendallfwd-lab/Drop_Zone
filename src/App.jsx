import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useSpring } from 'motion/react';
import {
  ArrowRight, AudioLines, BatteryFull, Bluetooth, Check, ChevronDown, Droplets, Headphones, Info,
  MapPin, Menu, MessageCircle, Package, Palette, PenLine, Phone,
  Minus, Plus, ShoppingCart, Sparkles, Trash2, X,
} from 'lucide-react';
import { ProductService } from './domain/catalog.js';
import {
  addCartItem, cartItemCount, cartTotal, clampQuantity, createCartItem, createCartWhatsAppUrl,
  AUDIO_DISCOUNT_CRC, AUDIO_DISCOUNT_THRESHOLD, audioProductCount, cartDiscount, cartSubtotal, formatCRC, readStoredCart, removeCartItem, updateCartItemQuantity,
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

function WhatsAppLink({ phone, product, selections, children, className = '' }) {
  const href = product
    ? product.whatsappUrl(phone, selections)
    : `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quisiera consultar sobre los productos de Drop_Zone CR.')}`;
  return <a className={className} href={href} aria-label={product ? `Consultar por WhatsApp sobre ${product.name}` : 'Escribir a Drop Zone CR por WhatsApp'}>
    <MessageCircle size={18} aria-hidden="true" />{children}
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

function Header({ settings, sections, cartCount, onOpenCart }) {
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
        <button className="header-cart" type="button" onClick={onOpenCart} aria-label={`Abrir carrito, ${cartCount} ${cartCount === 1 ? 'producto' : 'productos'}`}>
          <ShoppingCart size={19} aria-hidden="true" />
          <span className={cartCount > 0 ? 'header-cart__count header-cart__count--visible' : 'header-cart__count'} aria-hidden="true">{cartCount}</span>
        </button>
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
  const [activeFilter, setActiveFilter] = useState('all');
  const filter = catalogFilters.find((item) => item.id === activeFilter) || catalogFilters[0];
  const products = catalog.featured.filter(filter.matches);

  return <section id="productos" className="catalog section" aria-labelledby="catalog-title">
    <div className="container">
      <div className="section-heading">
        <div><p className="eyebrow">NUESTROS PRODUCTOS</p><h2 id="catalog-title">Una selección para vos.</h2></div>
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
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const triggerRef = useRef(null);
  const selected = options.find((option) => option === value) || options[0] || '';
  const optionsId = `configurator-${label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return <div className={`product-picker product-picker--configurator ${open ? 'product-picker--open' : ''}`} ref={pickerRef}>
    <button
      ref={triggerRef}
      type="button"
      className="product-picker__trigger"
      role="combobox"
      aria-label={label}
      aria-expanded={open}
      aria-controls={`${optionsId}-options`}
      onClick={() => setOpen((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setOpen(true);
        }
      }}
    >
      <span>{selected}</span>
      <ChevronDown size={17} aria-hidden="true" />
    </button>
    {open && <div className="product-picker__menu" role="listbox" id={`${optionsId}-options`} aria-label={label}>
      {options.map((option) => <button
        key={option}
        type="button"
        role="option"
        aria-selected={option === value}
        className={`product-picker__option ${option === value ? 'product-picker__option--selected' : ''}`}
        onClick={() => {
          onChange(option);
          setOpen(false);
          triggerRef.current?.focus();
        }}
      >
        <span><strong>{option}</strong></span>
        {option === value && <Check size={17} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
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
  const quantityDiscount = product.category === 'Audio' && quantity >= AUDIO_DISCOUNT_THRESHOLD ? AUDIO_DISCOUNT_CRC : 0;
  const activeQuantityPrice = product.formatPrice(Math.max(0, activeQuantitySubtotal - quantityDiscount));
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
      <div className="section-heading section-heading--detail"><div><p className="eyebrow"><img className="eyebrow__brand-icon" src="/favicon.svg" alt="" aria-hidden="true" />EN DETALLE</p><h2 id="detail-section-title">Cada detalle importa.</h2></div><p>Descubrí el diseño y las características que hacen único a cada producto.</p></div>
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
                <h3>{product.name}</h3><p className="detail-content__description">{product.shortDescription}</p>
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
          {quantityDiscount > 0 && <div className="quantity-discount-notice" role="status"><span className="quantity-discount-notice__icon"><Check size={16} aria-hidden="true" /></span><span className="quantity-discount-notice__copy"><strong>Descuento aplicado</strong><small>Ahorrás {product.formatPrice(quantityDiscount)} por comprar {quantity} unidades de Audio.</small></span></div>}
          <div className="detail-content__footer">
            <div className="detail-content__price" aria-live="polite"><span>{quantityDiscount > 0 ? 'TOTAL CON DESCUENTO' : quantity > 1 ? 'PRECIO TOTAL' : 'PRECIO'}</span>{quantityDiscount > 0 && <del>{activeQuantitySubtotalPrice}</del>}<strong>{activeQuantityPrice}</strong>{quantity > 1 && <small>{activePrice} por unidad{quantityDiscount > 0 ? ` · Ahorrás ${product.formatPrice(quantityDiscount)}` : ''}</small>}</div>
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

  const ProductPicker = ({ label, value, options, onChange }) => {
    const [open, setOpen] = useState(false);
    const pickerRef = useRef(null);
    const triggerRef = useRef(null);
    const selected = options.find((option) => option.id === value) || options[0];

    useEffect(() => {
      if (!open) return undefined;
      const closeOnOutsideClick = (event) => {
        if (!pickerRef.current?.contains(event.target)) setOpen(false);
      };
      const closeOnEscape = (event) => {
        if (event.key === 'Escape') {
          setOpen(false);
          triggerRef.current?.focus();
        }
      };
      document.addEventListener('mousedown', closeOnOutsideClick);
      document.addEventListener('keydown', closeOnEscape);
      return () => {
        document.removeEventListener('mousedown', closeOnOutsideClick);
        document.removeEventListener('keydown', closeOnEscape);
      };
    }, [open]);

    return <div className={`product-picker ${open ? 'product-picker--open' : ''}`} ref={pickerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="product-picker__trigger"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={`${label.replace(/\s+/g, '-').toLowerCase()}-options`}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.name}</span>
        <ChevronDown size={19} aria-hidden="true" />
      </button>
      {open && <div className="product-picker__menu" role="listbox" id={`${label.replace(/\s+/g, '-').toLowerCase()}-options`} aria-label={label}>
        {options.map((option) => <button
          key={option.id}
          type="button"
          role="option"
          aria-selected={option.id === value}
          className={`product-picker__option ${option.id === value ? 'product-picker__option--selected' : ''}`}
          onClick={() => { onChange(option.id); setOpen(false); triggerRef.current?.focus(); }}
        >
          <span><strong>{option.name}</strong><small>{option.category}</small></span>
          {option.id === value && <Check size={17} aria-hidden="true" />}
        </button>)}
      </div>}
    </div>;
  };

  const compareCard = (product, index, value, onChange) => <motion.article className="compare-card" key={`${index}-${product.id}`} initial={reducedMotion ? false : { opacity: 0, y: 22, scale: 0.985 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.46, delay: reducedMotion ? 0 : index * 0.1, ease: 'easeOut' }}>
    <div className="compare-card__top"><span>0{index + 1} / {index === 0 ? 'TU ELECCIÓN' : 'COMPARAR CON'}</span><span className="compare-card__category">{product.category}</span></div>
    <div className="compare-card__select-wrap"><ProductPicker label={index === 0 ? 'Primer producto para comparar' : 'Segundo producto para comparar'} value={value} onChange={onChange} options={catalog.products} /></div>
    <div className="compare-card__visual"><img src={product.image} alt={product.imageAlt} width="900" height="900" loading="lazy" decoding="async" /></div>
    <div className="compare-card__info"><p>{product.verifiedFeatures[0]?.label || product.category}</p><div><strong>{product.formattedPrice}</strong><button type="button" onClick={() => onSelect(product.id)} aria-label={`Ver detalles de ${product.name}`}>Ver detalles <ArrowRight size={16} aria-hidden="true" /></button></div></div>
  </motion.article>;

  return <section id="comparar" className="comparison section" aria-labelledby="compare-title"><div className="container">
    <div className="section-heading comparison__heading"><div><p className="eyebrow"><img className="eyebrow__brand-icon" src="/favicon.svg" alt="" aria-hidden="true" />ENCONTRÁ TU MEJOR OPCIÓN</p><h2 id="compare-title">Dos modelos. Una decisión más clara.</h2></div><p>Elegí dos productos y compará sus precios de un vistazo.</p></div>
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

function CartDrawer({ open, cart, settings, onClose, onUpdateQuantity, onRemove, onEditProduct }) {
  const closeButtonRef = useRef(null);
  const count = cartItemCount(cart);
  const subtotal = cartSubtotal(cart);
  const total = cartTotal(cart);
  const audioCount = audioProductCount(cart);
  const discount = cartDiscount(cart);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;
  return <div className="cart-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
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
          {discount > 0 && <div className="cart-drawer__discount"><span><Check size={14} aria-hidden="true" />Descuento Audio</span><strong>-{formatCRC(discount)}</strong></div>}
          <div className="cart-drawer__total"><span className="sr-only">Total</span><strong>Total: {formatCRC(total)}</strong></div>
          {discount > 0 ? <p className="cart-drawer__promo cart-drawer__promo--active">¡Descuento aplicado! Ahorraste {formatCRC(discount)} por comprar 2 productos de Audio.</p> : audioCount === 1 ? <p className="cart-drawer__promo">Agregá otro producto de Audio y obtené ₡5.000 de descuento.</p> : null}
          <p>La disponibilidad y entrega se confirman por WhatsApp.</p>
        </div>
        <div className="cart-drawer__actions">
          <a className="button button--whatsapp" href={createCartWhatsAppUrl(settings.whatsappPhone, cart)} aria-label="Enviar pedido completo por WhatsApp"><MessageCircle size={18} aria-hidden="true" />Hacer pedido por WhatsApp <ArrowRight size={17} aria-hidden="true" /></a>
          <button type="button" className="cart-continue" onClick={onClose}>Seguir comprando</button>
        </div>
      </>}
    </aside>
  </div>;
}

function Footer({ settings }) {
  return <footer id="contacto" className="footer"><div className="container footer__main"><div className="footer__brand"><Brand compact /><p>{settings.tagline}</p></div><div className="footer__links"><span className="location-link"><MapPin size={17} />{settings.location}</span><a className="phone-link" href={`tel:+${settings.whatsappPhone}`}><Phone size={17} />{settings.displayPhone}</a><a className="instagram-link" href={settings.instagramUrl}><InstagramBrandIcon />{settings.instagramHandle}</a></div><WhatsAppLink phone={settings.whatsappPhone} className="button button--whatsapp">Escribenos a nuestro WhatsApp <ArrowRight size={17} /></WhatsAppLink></div><div className="container footer__bottom"><span>© {new Date().getFullYear()} Drop_Zone CR</span><span>Comercio independiente. Las marcas mencionadas pertenecen a sus titulares.</span></div></footer>;
}

export default function App() {
  const [data, setData] = useState(() => getFallbackData());
  const [loadState, setLoadState] = useState('loading');
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get('producto') || 'airpods-pro-3');
  const [tab, setTab] = useState(0);
  const [cart, setCart] = useState(() => readStoredCart(window.localStorage));
  const [cartOpen, setCartOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState('');
  const reducedMotion = useReducedMotion();
  const scrollToElement = usePageScroller(reducedMotion);
  const closeCart = useCallback(() => setCartOpen(false), []);

  useEffect(() => {
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
    const previousAudioCount = audioProductCount(cart);
    const nextCart = addCartItem(cart, item);
    const nextAudioCount = audioProductCount(nextCart);
    setCart(nextCart);
    setCartNotice(nextAudioCount >= AUDIO_DISCOUNT_THRESHOLD && previousAudioCount < AUDIO_DISCOUNT_THRESHOLD
      ? '¡Descuento aplicado! Ahorraste ₡5.000 por comprar 2 productos de Audio.'
      : `${item.name} agregado al carrito`);
  };
  const handleUpdateCartQuantity = (key, quantity) => {
    const previousAudioCount = audioProductCount(cart);
    const nextCart = updateCartItemQuantity(cart, key, quantity);
    const nextAudioCount = audioProductCount(nextCart);
    setCart(nextCart);
    if (nextAudioCount >= AUDIO_DISCOUNT_THRESHOLD && previousAudioCount < AUDIO_DISCOUNT_THRESHOLD) {
      setCartNotice('¡Descuento aplicado! Ahorraste ₡5.000 por comprar 2 productos de Audio.');
    }
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
    <Header settings={data.settings} sections={data.siteSections} cartCount={numberOfCartItems} onOpenCart={() => setCartOpen(true)} />
    <main id="contenido">
      {loadState === 'loading' && <div className="api-loading" role="status">Actualizando catálogo…</div>}
      {loadState === 'fallback' && <div className="api-notice" role="status">Vista de respaldo: el catálogo local no está conectado. Los datos mostrados proceden de la copia incluida en la web.</div>}
      <Hero settings={data.settings} reducedMotion={reducedMotion} />
      <Catalog catalog={data.catalog} selectedId={product.id} onSelect={selectProduct} reducedMotion={reducedMotion} />
      <ProductDetail product={product} settings={data.settings} tab={tab} onTabChange={setTab} reducedMotion={reducedMotion} onAddToCart={handleAddToCart} />
      <Comparison catalog={data.catalog} onSelect={selectProduct} reducedMotion={reducedMotion} />
    </main>
    <Footer settings={data.settings} />
    <CartDrawer open={cartOpen} cart={cart} settings={data.settings} onClose={closeCart} onUpdateQuantity={handleUpdateCartQuantity} onRemove={(key) => setCart((current) => removeCartItem(current, key))} onEditProduct={handleEditCartProduct} />
    {cartNotice && <div className="cart-toast" role="status"><Check size={16} aria-hidden="true" />{cartNotice}</div>}
    <span className="sr-only" role="status" aria-live="polite">{product.name} seleccionado, precio {product.formattedPrice}</span>
  </>;
}

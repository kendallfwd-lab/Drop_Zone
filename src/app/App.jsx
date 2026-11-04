import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { Check } from 'lucide-react';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import { Hero } from '../features/home/Hero.jsx';
import Catalog from '../features/catalog/Catalog.jsx';
import ProductDetail from '../features/catalog/ProductDetail.jsx';
import Comparison from '../features/comparison/Comparison.jsx';
import CartDrawer from '../features/cart/CartDrawer.jsx';
import PromotionsCarousel from '../features/promotions/PromotionsCarousel.jsx';
import { ProductService } from '../features/catalog/catalog.js';
import {
  addCartItem, cartItemCount, cartDiscountBreakdown, createCartItem, readStoredCart, removeCartItem, updateCartItemQuantity,
} from '../features/cart/cart.js';
import { getFallbackData } from '../data/fallback.js';

export { Hero } from '../features/home/Hero.jsx';

const service = new ProductService();

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

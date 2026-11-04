import { useEffect, useState } from 'react';
import { Headphones, Minus, Plus } from 'lucide-react';
import { clampQuantity } from '../../features/cart/cart.js';

export function Brand({ compact = false }) {
  if (compact) return <span className="footer-wordmark" aria-label="Drop Zone CR">
    DROP<span className="footer-wordmark__accent">_</span>ZONE <small>CR</small>
  </span>;
  return <span className="brand">
    <img className="brand__logo" src="/images/logo-dropzone.png?v=2" alt="Drop Zone" width="800" height="125" />
  </span>;
}

export function InstagramBrandIcon() {
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

export function WhatsAppMark() {
  return <svg className="whatsapp-mark" viewBox="0 0 24 24" role="img" aria-label="WhatsApp">
    <circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <path d="M8.9 7.9c.25-.28.62-.31.9-.08l1.05.88c.3.25.37.68.16 1.02l-.5.77c.67 1.3 1.72 2.35 3.02 3.02l.77-.5c.34-.21.77-.14 1.02.16l.88 1.05c.23.28.2.65-.08.9l-.57.51c-.57.51-1.39.68-2.1.42-2.77-1.01-4.93-3.17-5.94-5.94-.26-.71-.09-1.53.42-2.1l.51-.57Z" fill="currentColor" />
  </svg>;
}

export function WhatsAppLink({ phone, product, selections, children, className = '' }) {
  const href = product
    ? product.whatsappUrl(phone, selections)
    : `https://wa.me/${String(phone).replace(/\D/g, '')}?text=${encodeURIComponent('Hola, quisiera consultar sobre los productos de Drop_Zone CR.')}`;
  return <a className={className} href={href} target="_blank" rel="noopener noreferrer" aria-label={product ? `Consultar por WhatsApp sobre ${product.name}` : 'Escribir a Drop Zone CR por WhatsApp'}>
    <WhatsAppMark />{children}
  </a>;
}

export function QuantityStepper({ value, onChange, label = 'Cantidad' }) {
  return <div className="quantity-control">
    <span>{label}</span>
    <div className="quantity-stepper">
      <button type="button" onClick={() => onChange(clampQuantity(value - 1))} aria-label="Disminuir cantidad" disabled={value <= 1}><Minus size={15} aria-hidden="true" /></button>
      <input type="number" min="1" max="99" inputMode="numeric" value={value} onChange={(event) => onChange(clampQuantity(event.target.value))} aria-label={label} />
      <button type="button" onClick={() => onChange(clampQuantity(value + 1))} aria-label="Aumentar cantidad" disabled={value >= 99}><Plus size={15} aria-hidden="true" /></button>
    </div>
  </div>;
}

export function ProductImage({ product, className = '', eager = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [product.image]);
  if (failed) return <div className={`${className} image-fallback`} role="img" aria-label={`Imagen no disponible de ${product.name}`}><Headphones size={40} aria-hidden="true" /><span>Imagen por actualizar</span></div>;
  return <img className={className} src={product.image} alt={product.imageAlt} width="900" height="900" loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} />;
}

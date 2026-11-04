import { useEffect, useRef } from 'react';
import { ArrowRight, Check, ShoppingCart, Trash2, X } from 'lucide-react';
import { QuantityStepper, WhatsAppMark } from '../../components/common/Shared.jsx';
import { audioProductCount, cartDiscountBreakdown, cartItemCount, cartSubtotal, cartTotal, caseProductCount, createCartWhatsAppUrl, formatCRC, applePencilProductCount, iphoneCaseProductCount } from './cart.js';

export default function CartDrawer({ open, cart, settings, onClose, onUpdateQuantity, onRemove, onEditProduct, triggerRef }) {
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
          <a className="button button--whatsapp" href={createCartWhatsAppUrl(settings.whatsappPhone, cart)} target="_blank" rel="noopener noreferrer" aria-label="Enviar pedido completo por WhatsApp"><WhatsAppMark />Hacer pedido por WhatsApp <ArrowRight size={17} aria-hidden="true" /></a>
          <button type="button" className="cart-continue" onClick={onClose}>Seguir comprando</button>
        </div>
      </>}
    </aside>
  </div>;
}

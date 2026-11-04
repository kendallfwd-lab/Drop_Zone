import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, Info, ShoppingCart } from 'lucide-react';
import AccessiblePicker from '../../components/ui/AccessiblePicker.jsx';
import { QuantityStepper, WhatsAppLink } from '../../components/common/Shared.jsx';
import { quantityDiscountForProduct } from '../cart/cart.js';
import { iconMap } from './iconMap.js';

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

export default function ProductDetail({ product, settings, onTabChange, tab, reducedMotion, onAddToCart }) {
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

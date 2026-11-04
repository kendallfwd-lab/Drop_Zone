import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, X } from 'lucide-react';
import AccessiblePicker from '../../components/ui/AccessiblePicker.jsx';
import { ProductImage } from '../../components/common/Shared.jsx';
import { formatCRC } from '../cart/cart.js';
import { promotionDefinitions } from './promotionDefinitions.js';
import { createAirpodsPromotionWhatsAppUrl, createCasePairPromotionWhatsAppUrl, PROMOTION_PRICES } from './promotionMessages.js';

export default function PromotionsCarousel({ catalog, settings, onSelect, reducedMotion }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false);
  const [isCasePairConfigurator, setIsCasePairConfigurator] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState('airpods-pro-3');
  const [selectedCaseColor, setSelectedCaseColor] = useState('Azul oscuro');
  const [selectedIphoneCaseModel, setSelectedIphoneCaseModel] = useState('');
  const [selectedIphoneCaseColor, setSelectedIphoneCaseColor] = useState('');
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
  const selectedIphonePairColor = iphoneCaseProduct?.colors?.find((color) => color.name === selectedIphoneCaseColor) || iphoneCaseProduct?.colors?.[0];
  const selectedPairColor = caseProduct?.colors?.find((color) => color.name === selectedPairCaseColor) || caseProduct?.colors?.[0];
  const prices = activePromotion.products.flatMap((product) => product.variants?.length ? product.variants.map((variant) => variant.priceCRC) : [product.priceCRC]).filter(Number.isFinite);
  const startingPrice = activePromotion.fixedPriceCRC || (prices.length ? Math.min(...prices) : null);
  const openConfigurator = () => {
    pauseForInteraction(true);
    if (activePromotion.id === 'case-pair') {
      setIsCasePairConfigurator(true);
      setSelectedIphoneCaseModel(iphoneCaseProduct?.models?.[0] || '');
      setSelectedIphoneCaseColor(iphoneCaseProduct?.colors?.[0]?.name || '');
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
  const inquiryHref = createAirpodsPromotionWhatsAppUrl(settings.whatsappPhone, { modelName: selectedModel.name, colorName: selectedColor?.name });
  const casePairInquiryHref = createCasePairPromotionWhatsAppUrl(settings.whatsappPhone, { iphoneModel: selectedIphoneCaseModel, iphoneColorName: selectedIphonePairColor?.name, airpodsModel: selectedAirpodsCaseModel, colorName: selectedPairColor?.name });

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
            <div className="promotion-dialog__preview"><div className="promotion-dialog__preview-images promotion-dialog__preview-images--pair"><img src={selectedIphonePairColor?.image || iphoneCaseProduct?.image} alt={`Estuche para iPhone ${selectedIphonePairColor?.name || ''}`} /><img src={selectedPairColor?.image || caseProduct?.image} alt={`Estuche para AirPods ${selectedPairColor?.name || ''}`} /></div><strong>Dos estuches protectores</strong></div>
            <div className="promotion-dialog__options">
              <AccessiblePicker label="1. Modelo de iPhone" value={selectedIphoneCaseModel} onChange={setSelectedIphoneCaseModel} className="promotion-dialog__picker promotion-dialog__picker--iphone" options={(iphoneCaseProduct?.models || []).map((model) => ({ value: model, label: model }))} />
              <div className="promotion-dialog__pair-color"><span>2. Color del estuche de iPhone</span><strong>{selectedIphonePairColor?.name}</strong></div>
              <div className="promotion-dialog__colors" role="group" aria-label="Seleccionar color del estuche de iPhone">{iphoneCaseProduct?.colors?.map((color) => <button key={`iphone-pair-${color.name}`} type="button" className={`promotion-color ${selectedIphonePairColor?.name === color.name ? 'promotion-color--selected' : ''}`} aria-label={`Estuche de iPhone ${color.name}`} aria-pressed={selectedIphonePairColor?.name === color.name} onClick={() => setSelectedIphoneCaseColor(color.name)}><span style={{ backgroundColor: color.hex }} /><small>{color.name}</small></button>)}</div>
              <AccessiblePicker label="3. Modelo de AirPods" value={selectedAirpodsCaseModel} onChange={setSelectedAirpodsCaseModel} className="promotion-dialog__picker promotion-dialog__picker--second" options={(caseProduct?.models || []).map((model) => ({ value: model, label: model }))} />
              <div className="promotion-dialog__pair-color"><span>4. Color del estuche de AirPods</span><strong>{selectedPairColor?.name}</strong></div>
              <div className="promotion-dialog__colors" role="group" aria-label="Seleccionar color del estuche de AirPods">{caseProduct?.colors?.map((color) => <button key={`pair-${color.name}`} type="button" className={`promotion-color ${selectedPairColor?.name === color.name ? 'promotion-color--selected' : ''}`} aria-label={`Estuche de AirPods ${color.name}`} aria-pressed={selectedPairColor?.name === color.name} onClick={() => setSelectedPairCaseColor(color.name)}><span style={{ backgroundColor: color.hex }} /><small>{color.name}</small></button>)}</div>
              <div className="promotion-dialog__summary"><div><span>Estuche para iPhone</span><strong>{selectedIphoneCaseModel || 'Por elegir'} · {selectedIphonePairColor?.name || 'Por elegir'}</strong></div><div><span>Estuche para AirPods</span><strong>{selectedAirpodsCaseModel || 'Por elegir'} · {selectedPairColor?.name || 'Por elegir'}</strong></div><div className="promotion-dialog__total"><span>Combo de los dos</span><strong>{formatCRC(PROMOTION_PRICES.casePair)}</strong></div><p>El precio aplica al combo de dos estuches. Confirmaremos compatibilidad y disponibilidad por WhatsApp.</p></div>
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
              <div className="promotion-dialog__summary"><div><span>AirPods 4</span><strong>{selectedModel.formattedPrice}</strong></div><div><span>Estuche compatible</span><strong>{caseProduct?.formattedPrice || 'Por confirmar'}</strong></div><div className="promotion-dialog__total"><span>Precio de promoción</span><strong>{formatCRC(PROMOTION_PRICES.airpods)}</strong></div><p>Promoción AirPods 4 + estuche. Confirmaremos compatibilidad y existencias por WhatsApp.</p></div>
              <a className="button button--whatsapp promotion-dialog__submit" href={inquiryHref} target="_blank" rel="noopener noreferrer" onClick={closeConfigurator}>Solicitar esta selección <ArrowRight size={17} aria-hidden="true" /></a>
            </div>
          </div>}
        </div>
      </dialog>
    </div>
  </section>;
}

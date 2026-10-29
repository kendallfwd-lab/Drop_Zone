const MAX_QUANTITY = 99;
export const AUDIO_DISCOUNT_THRESHOLD = 2;
export const AUDIO_DISCOUNT_CRC = 5000;
export const CASE_DISCOUNT_PRODUCT_ID = 'estuches-airpods';
export const CASE_DISCOUNT_THRESHOLD = 2;
export const CASE_DISCOUNT_CRC = 1500;
export const IPHONE_CASE_DISCOUNT_PRODUCT_ID = 'estuches-iphone';
export const IPHONE_CASE_DISCOUNT_THRESHOLD = 2;
export const IPHONE_CASE_DISCOUNT_CRC = 2000;
export const APPLE_PENCIL_DISCOUNT_PRODUCT_ID = 'apple-pencil';
export const APPLE_PENCIL_DISCOUNT_THRESHOLD = 2;
export const APPLE_PENCIL_DISCOUNT_CRC = 3000;

export function clampQuantity(value) {
  const quantity = Number.parseInt(value, 10);
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_QUANTITY, Math.max(1, quantity));
}

export function formatCRC(value) {
  return `₡${new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(value).replace(/[\s\u00a0\u202f]/g, '.')}`;
}

export function createCartItem(product, selections = {}, quantity = 1) {
  const selectedModel = product.models.includes(selections.model) ? selections.model : product.models[0];
  const selectedColor = product.colors.find((color) => color.name === selections.color) ?? product.colors[0];
  const selectedVariant = product.variants.find((variant) => variant.name === selections.variant) ?? product.variants[0];
  const options = [
    selectedModel ? `${product.modelLabel || 'Modelo'}: ${selectedModel}` : '',
    selectedColor ? `Color: ${selectedColor.name}` : '',
    selectedVariant ? `${product.variantLabel || 'Opción'}: ${selectedVariant.name}` : '',
  ].filter(Boolean);
  const key = [product.id, selectedModel, selectedColor?.name, selectedVariant?.name].filter(Boolean).join('::');

  return {
    key,
    productId: product.id,
    name: product.inquiryProductName || product.name,
    category: product.category,
    image: selectedVariant?.image || selectedColor?.image || product.image,
    imageAlt: product.imageAlt,
    options,
    unitPriceCRC: selectedVariant?.priceCRC ?? product.priceCRC,
    quantity: clampQuantity(quantity),
  };
}

export function audioProductCount(cart) {
  return cart.reduce((total, item) => total + (item.category === 'Audio' ? item.quantity : 0), 0);
}

export function caseProductCount(cart) {
  return cart.reduce((total, item) => total + (item.productId === CASE_DISCOUNT_PRODUCT_ID ? item.quantity : 0), 0);
}

export function iphoneCaseProductCount(cart) {
  return cart.reduce((total, item) => total + (item.productId === IPHONE_CASE_DISCOUNT_PRODUCT_ID ? item.quantity : 0), 0);
}

export function applePencilProductCount(cart) {
  return cart.reduce((total, item) => total + (item.productId === APPLE_PENCIL_DISCOUNT_PRODUCT_ID ? item.quantity : 0), 0);
}

export function quantityDiscountForProduct(product, quantity) {
  const normalizedQuantity = clampQuantity(quantity);
  const productId = product?.productId || product?.id;
  if (product?.category === 'Audio' && normalizedQuantity >= AUDIO_DISCOUNT_THRESHOLD) {
    return { id: 'audio', label: 'Descuento aplicado', amount: AUDIO_DISCOUNT_CRC, description: `por comprar ${normalizedQuantity} unidades de Audio` };
  }
  if (productId === CASE_DISCOUNT_PRODUCT_ID && normalizedQuantity >= CASE_DISCOUNT_THRESHOLD) {
    return { id: 'airpods-cases', label: 'Descuento en estuches', amount: CASE_DISCOUNT_CRC, description: `por comprar ${normalizedQuantity} estuches para AirPods` };
  }
  if (productId === IPHONE_CASE_DISCOUNT_PRODUCT_ID && normalizedQuantity >= IPHONE_CASE_DISCOUNT_THRESHOLD) {
    return { id: 'iphone-cases', label: 'Descuento en estuches para iPhone', amount: IPHONE_CASE_DISCOUNT_CRC, description: `por comprar ${normalizedQuantity} estuches para iPhone` };
  }
  if (productId === APPLE_PENCIL_DISCOUNT_PRODUCT_ID && normalizedQuantity >= APPLE_PENCIL_DISCOUNT_THRESHOLD) {
    return { id: 'apple-pencil', label: 'Descuento en Apple Pencil', amount: APPLE_PENCIL_DISCOUNT_CRC, description: `por comprar ${normalizedQuantity} unidades de Apple Pencil` };
  }
  return null;
}

export function cartDiscountBreakdown(cart) {
  const discounts = [];
  if (audioProductCount(cart) >= AUDIO_DISCOUNT_THRESHOLD) {
    discounts.push({ id: 'audio', label: 'Descuento Audio', amount: AUDIO_DISCOUNT_CRC, message: `¡Descuento aplicado! Ahorraste ${formatCRC(AUDIO_DISCOUNT_CRC)} por comprar 2 productos de Audio.` });
  }
  if (caseProductCount(cart) >= CASE_DISCOUNT_THRESHOLD) {
    discounts.push({ id: 'airpods-cases', label: 'Descuento en estuches', amount: CASE_DISCOUNT_CRC, message: `¡Descuento aplicado! Ahorraste ${formatCRC(CASE_DISCOUNT_CRC)} por comprar 2 estuches para AirPods.` });
  }
  if (iphoneCaseProductCount(cart) >= IPHONE_CASE_DISCOUNT_THRESHOLD) {
    discounts.push({ id: 'iphone-cases', label: 'Descuento en estuches para iPhone', amount: IPHONE_CASE_DISCOUNT_CRC, message: `¡Descuento aplicado! Ahorraste ${formatCRC(IPHONE_CASE_DISCOUNT_CRC)} por comprar 2 estuches para iPhone.` });
  }
  if (applePencilProductCount(cart) >= APPLE_PENCIL_DISCOUNT_THRESHOLD) {
    discounts.push({ id: 'apple-pencil', label: 'Descuento en Apple Pencil', amount: APPLE_PENCIL_DISCOUNT_CRC, message: `¡Descuento aplicado! Ahorraste ${formatCRC(APPLE_PENCIL_DISCOUNT_CRC)} por comprar 2 unidades de Apple Pencil.` });
  }
  return discounts;
}

export function cartDiscount(cart) {
  return cartDiscountBreakdown(cart).reduce((total, discount) => total + discount.amount, 0);
}

export function cartSubtotal(cart) {
  return cart.reduce((total, item) => total + item.unitPriceCRC * item.quantity, 0);
}

export function addCartItem(cart, nextItem) {
  const existing = cart.find((item) => item.key === nextItem.key);
  if (!existing) return [...cart, nextItem];
  return cart.map((item) => item.key === nextItem.key
    ? { ...item, category: item.category || nextItem.category, quantity: clampQuantity(item.quantity + nextItem.quantity) }
    : item);
}

export function updateCartItemQuantity(cart, key, quantity) {
  return cart.map((item) => item.key === key ? { ...item, quantity: clampQuantity(quantity) } : item);
}

export function removeCartItem(cart, key) {
  return cart.filter((item) => item.key !== key);
}

export function cartItemCount(cart) {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

export function cartTotal(cart) {
  return Math.max(0, cartSubtotal(cart) - cartDiscount(cart));
}

export function createCartWhatsAppUrl(phone, cart) {
  const number = String(phone).replace(/\D/g, '');
  const discounts = cartDiscountBreakdown(cart);
  const lines = cart.flatMap((item, index) => [
    `${index + 1}. ${item.name}`,
    ...item.options.map((option) => `   • ${option}`),
    `   • Cantidad: ${item.quantity}`,
    `   • Subtotal: ${formatCRC(item.unitPriceCRC * item.quantity)}`,
  ]);
  const message = [
    'Hola, quiero hacer este pedido en Drop_Zone CR:',
    '',
    ...lines,
    '',
    ...(discounts.length ? [...discounts.map((discount) => {
      const thresholdLabel = discount.id === 'audio' ? '2 o más productos' : '2 o más unidades';
      return `${discount.label} (${thresholdLabel}): -${formatCRC(discount.amount)}`;
    }), ''] : []),
    `Total publicado: ${formatCRC(cartTotal(cart))}`,
    '',
    '¿Podrían confirmarme disponibilidad y detalles de entrega?',
  ].join('\n');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function readStoredCart(storage, key = 'drop-zone-cart') {
  try {
    const value = JSON.parse(storage.getItem(key) || '[]');
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => item && typeof item.key === 'string' && typeof item.name === 'string' && Number.isInteger(item.unitPriceCRC) && item.unitPriceCRC >= 0)
      .map((item) => ({ ...item, category: typeof item.category === 'string' ? item.category : '', options: Array.isArray(item.options) ? item.options.filter((option) => typeof option === 'string') : [], quantity: clampQuantity(item.quantity) }));
  } catch {
    return [];
  }
}

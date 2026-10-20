const MAX_QUANTITY = 99;

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
    image: selectedVariant?.image || selectedColor?.image || product.image,
    imageAlt: product.imageAlt,
    options,
    unitPriceCRC: selectedVariant?.priceCRC ?? product.priceCRC,
    quantity: clampQuantity(quantity),
  };
}

export function addCartItem(cart, nextItem) {
  const existing = cart.find((item) => item.key === nextItem.key);
  if (!existing) return [...cart, nextItem];
  return cart.map((item) => item.key === nextItem.key
    ? { ...item, quantity: clampQuantity(item.quantity + nextItem.quantity) }
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
  return cart.reduce((total, item) => total + item.unitPriceCRC * item.quantity, 0);
}

export function createCartWhatsAppUrl(phone, cart) {
  const number = String(phone).replace(/\D/g, '');
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
      .map((item) => ({ ...item, options: Array.isArray(item.options) ? item.options.filter((option) => typeof option === 'string') : [], quantity: clampQuantity(item.quantity) }));
  } catch {
    return [];
  }
}

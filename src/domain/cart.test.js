import { describe, expect, it } from 'vitest';
import data from '../../db.json';
import { Product } from './catalog.js';
import {
  addCartItem, cartItemCount, cartTotal, createCartItem, createCartWhatsAppUrl,
  readStoredCart, removeCartItem, updateCartItemQuantity,
} from './cart.js';

describe('shopping cart', () => {
  it('keeps the selected model and color and combines identical items', () => {
    const product = new Product(data.products.find((item) => item.id === 'estuches-iphone'));
    const item = createCartItem(product, { model: 'iPhone 16 Pro Max', color: 'Azul oscuro' }, 2);
    const cart = addCartItem(addCartItem([], item), createCartItem(product, { model: 'iPhone 16 Pro Max', color: 'Azul oscuro' }, 1));

    expect(cart).toHaveLength(1);
    expect(cart[0].options).toEqual(['Modelo de iPhone: iPhone 16 Pro Max', 'Color: Azul oscuro']);
    expect(cart[0].quantity).toBe(3);
    expect(cartItemCount(cart)).toBe(3);
    expect(cartTotal(cart)).toBe(18000);
  });

  it('uses the selected variant price and creates a complete WhatsApp order', () => {
    const product = new Product(data.products.find((item) => item.id === 'bateria-portatil-magnetica-iphone'));
    const item = createCartItem(product, { variant: '10.000 mAh' }, 2);
    const url = new URL(createCartWhatsAppUrl(data.settings.whatsappPhone, [item]));
    const message = url.searchParams.get('text');

    expect(item.unitPriceCRC).toBe(15000);
    expect(message).toContain('Capacidad: 10.000 mAh');
    expect(message).toContain('Cantidad: 2');
    expect(message).toContain('Subtotal: ₡30.000');
    expect(message).toContain('Total publicado: ₡30.000');
  });

  it('updates, limits and removes cart quantities safely', () => {
    const product = new Product(data.products[0]);
    const item = createCartItem(product, {}, 1);
    const updated = updateCartItemQuantity([item], item.key, 120);

    expect(updated[0].quantity).toBe(99);
    expect(removeCartItem(updated, item.key)).toEqual([]);
    expect(readStoredCart({ getItem: () => '{invalid' })).toEqual([]);
  });
});

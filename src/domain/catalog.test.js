import { describe, expect, it } from 'vitest';
import { Product, ProductCatalog } from './catalog.js';
import data from '../../db.json';

describe('Product', () => {
  it('validates name, id and integer price', () => {
    expect(() => new Product({ id: '', name: 'Modelo', priceCRC: 100 })).toThrow();
    expect(() => new Product({ id: 'model', name: '', priceCRC: 100 })).toThrow();
    expect(() => new Product({ id: 'model', name: 'Modelo', priceCRC: -1 })).toThrow();
    expect(() => new Product({ id: 'model', name: 'Modelo', priceCRC: 10.5 })).toThrow();
  });

  it('formats CRC, filters unverified claims and builds a product inquiry', () => {
    const product = new Product(data.products[0]);
    expect(product.formattedPrice).toBe('₡25.000');
    expect(product.verifiedFeatures.some((feature) => feature.verified === false)).toBe(false);
    const url = new URL(product.whatsappUrl(data.settings.whatsappPhone));
    expect(url.pathname).toBe('/50683120950');
    expect(url.searchParams.get('text')).toContain('AirPods Pro 3');
    expect(url.searchParams.get('text')).toContain('₡25.000');
  });

  it('builds a configured case inquiry with a validated model and color', () => {
    const product = new Product(data.products.find((item) => item.id === 'estuches-airpods'));
    const url = new URL(product.whatsappUrl(data.settings.whatsappPhone, { model: 'AirPods 4', color: 'Turquesa' }));
    expect(url.searchParams.get('text')).toContain('color Turquesa');
    expect(url.searchParams.get('text')).toContain('modelo AirPods 4');
    expect(url.searchParams.get('text')).toContain('₡4.000');
  });

  it('builds an iPhone case inquiry with its selected model and color', () => {
    const product = new Product(data.products.find((item) => item.id === 'estuches-iphone'));
    const url = new URL(product.whatsappUrl(data.settings.whatsappPhone, { model: 'iPhone 17 Pro', color: 'Menta' }));
    expect(url.searchParams.get('text')).toContain('estuche para iPhone');
    expect(url.searchParams.get('text')).toContain('color Menta');
    expect(url.searchParams.get('text')).toContain('modelo iPhone 17 Pro');
    expect(url.searchParams.get('text')).toContain('₡6.000');
  });

  it('includes the selected AirPods Max color in the inquiry', () => {
    const product = new Product(data.products.find((item) => item.id === 'airpods-max'));
    const url = new URL(product.whatsappUrl(data.settings.whatsappPhone, { color: 'Lila' }));
    expect(url.searchParams.get('text')).toContain('AirPods Max');
    expect(url.searchParams.get('text')).toContain('color Lila');
    expect(url.searchParams.get('text')).toContain('₡27.000');
  });

  it('uses the selected adapter wattage and its individual price in WhatsApp', () => {
    const product = new Product(data.products.find((item) => item.id === 'apple-adaptador-usb-c'));
    const url = new URL(product.whatsappUrl(data.settings.whatsappPhone, { variant: '20 W' }));
    expect(url.searchParams.get('text')).toContain('potencia 20 W');
    expect(url.searchParams.get('text')).toContain('₡5.000');
  });

  it('includes the selected EarPods connector in the WhatsApp inquiry', () => {
    const product = new Product(data.products.find((item) => item.id === 'earpods-con-cable'));
    const url = new URL(product.whatsappUrl(data.settings.whatsappPhone, { variant: 'Lightning' }));
    expect(url.searchParams.get('text')).toContain('conector Lightning');
    expect(url.searchParams.get('text')).toContain('₡10.000');
  });

  it('includes the selected audio adapter connector in the WhatsApp inquiry', () => {
    const product = new Product(data.products.find((item) => item.id === 'adaptador-audio-35mm-apple'));
    const url = new URL(product.whatsappUrl(data.settings.whatsappPhone, { variant: 'Lightning' }));
    expect(url.searchParams.get('text')).toContain('conector Lightning');
    expect(url.searchParams.get('text')).toContain('₡3.700');
  });

  it('uses the selected magnetic battery capacity and price in WhatsApp', () => {
    const product = new Product(data.products.find((item) => item.id === 'bateria-portatil-magnetica-iphone'));
    const url = new URL(product.whatsappUrl(data.settings.whatsappPhone, { variant: '10.000 mAh' }));
    expect(url.searchParams.get('text')).toContain('capacidad 10.000 mAh');
    expect(url.searchParams.get('text')).toContain('₡15.000');
  });

  it('includes the selected Samsung cable color in WhatsApp', () => {
    const product = new Product(data.products.find((item) => item.id === 'cable-samsung-usbc-3a'));
    const url = new URL(product.whatsappUrl(data.settings.whatsappPhone, { variant: 'Blanco' }));
    expect(url.searchParams.get('text')).toContain('color Blanco');
    expect(url.searchParams.get('text')).toContain('₡5.000');
  });

  it('uses the selected Apple Lightning cable length and price in WhatsApp', () => {
    const product = new Product(data.products.find((item) => item.id === 'cable-apple-usbc-lightning'));
    const url = new URL(product.whatsappUrl(data.settings.whatsappPhone, { variant: '2 m' }));
    expect(url.searchParams.get('text')).toContain('longitud 2 m');
    expect(url.searchParams.get('text')).toContain('₡6.500');
  });
});

describe('ProductCatalog', () => {
  it('keeps four official reference specifications for sourced devices', () => {
    const catalog = new ProductCatalog(data.products);
    for (const product of catalog.products.filter((item) => item.specSourceUrl)) {
      expect(product.referenceFeatures).toHaveLength(4);
      expect(product.specSourceUrl).toMatch(/^https:\/\/(www\.apple\.com|support\.apple\.com|www\.samsung\.com)\//);
    }
  });

  it('sorts the twenty requested products by display order', () => {
    const catalog = new ProductCatalog([...data.products].reverse());
    expect(catalog.products.map((product) => product.id)).toEqual([
      'airpods-pro-3', 'airpods-pro-2', 'airpods-4', 'airpods-3', 'airpods-max', 'apple-pencil', 'estuches-airpods', 'estuches-iphone', 'galaxy-buds3-pro', 'samsung-cargador-45w', 'samsung-adaptador-45w', 'cable-samsung-usbc-3a', 'cable-usb-c-60w', 'cable-apple-usbc-lightning', 'apple-adaptador-usb-c', 'earpods-con-cable', 'kit-cargador-apple-35w', 'adaptador-audio-35mm-apple', 'bateria-portatil-magnetica-iphone', 'cable-apple-lightning-usb-1m',
    ]);
  });
});

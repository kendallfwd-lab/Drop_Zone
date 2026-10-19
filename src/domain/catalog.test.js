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
});

describe('ProductCatalog', () => {
  it('keeps four official reference specifications for sourced devices', () => {
    const catalog = new ProductCatalog(data.products);
    for (const product of catalog.products.filter((item) => item.specSourceUrl)) {
      expect(product.referenceFeatures).toHaveLength(4);
      expect(product.specSourceUrl).toMatch(/^https:\/\/(www\.apple\.com|support\.apple\.com|www\.samsung\.com)\//);
    }
  });

  it('sorts the eight requested products by display order', () => {
    const catalog = new ProductCatalog([...data.products].reverse());
    expect(catalog.products.map((product) => product.id)).toEqual([
      'airpods-pro-3', 'airpods-pro-2', 'airpods-3', 'airpods-4', 'airpods-max', 'apple-pencil', 'estuches-airpods', 'galaxy-buds3-pro',
    ]);
  });
});

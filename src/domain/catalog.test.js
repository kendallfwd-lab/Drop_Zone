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
});

describe('ProductCatalog', () => {
  it('keeps four sourced reference specifications for every listed product', () => {
    const catalog = new ProductCatalog(data.products);
    for (const product of catalog.products) {
      expect(product.referenceFeatures).toHaveLength(4);
      expect(product.specSourceUrl).toMatch(/^https:\/\/(www\.apple\.com|support\.apple\.com)\//);
    }
  });

  it('sorts the six requested products by display order', () => {
    const catalog = new ProductCatalog([...data.products].reverse());
    expect(catalog.products.map((product) => product.id)).toEqual([
      'airpods-pro-3', 'airpods-pro-2', 'airpods-3', 'airpods-4', 'airpods-max', 'apple-pencil',
    ]);
  });
});

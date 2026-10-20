import { describe, expect, it } from 'vitest';
import { getFallbackData } from '../data/fallback.js';
import { comparisonSpecsByProduct } from '../data/comparisonSpecs.js';
import { compareProducts, extractAttributes } from './comparison.js';

const { catalog } = getFallbackData();

describe('product comparison', () => {
  it('prioritizes verified differences and compares compatible numeric units', () => {
    const result = compareProducts(catalog.find('airpods-pro-3'), catalog.find('airpods-pro-2'));

    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows.length).toBeLessThanOrEqual(6);
    expect(result.rows[0].differs).toBe(true);
    expect(result.rows.some((row) => row.differs === false)).toBe(true);
    const battery = result.rows.find((row) => row.key === 'battery');
    expect(battery?.first.numericValue).toBe(24);
    expect(battery?.second.numericValue).toBe(30);
    expect(battery?.advantage).toBeNull();
    expect(result.conclusion).toMatch(/diferencias principales/i);
    expect(result.recommendation.first).toContain('2 h más de uso por carga');
    expect(result.recommendation.second).toContain('6 h más de autonomía total con el estuche');
  });

  it('uses category priorities and omits attributes without catalog evidence', () => {
    const cable = extractAttributes(catalog.find('cable-samsung-usbc-3a'));
    const battery = extractAttributes(catalog.find('bateria-portatil-magnetica-iphone'));

    expect(cable.category).toBe('accessories');
    expect(cable.attributes.has('port')).toBe(true);
    expect(cable.attributes.has('noiseCancellation')).toBe(false);
    expect(battery.category).toBe('batteries');
    expect(battery.attributes.has('capacity')).toBe(true);
  });

  it('keeps matching specifications out of the initial difference list', () => {
    const product = catalog.find('airpods-4');
    const result = compareProducts(product, product);

    expect(result.rows.every((row) => row.differs === false)).toBe(true);
    expect(result.matchingRowCount).toBe(result.rows.length);
    expect(result.conclusion).toMatch(/no muestran diferencias/i);
  });

  it('has structured comparison information for every catalog product', () => {
    expect(Object.keys(comparisonSpecsByProduct)).toHaveLength(catalog.products.length);

    for (const product of catalog.products) {
      const specs = comparisonSpecsByProduct[product.id];
      expect(specs, product.id).toBeDefined();
      expect(specs.length, product.id).toBeGreaterThanOrEqual(3);
      expect(new Set(specs.map((item) => item.key)).size, product.id).toBe(specs.length);
      expect(specs.every((item) => item.label && item.value)).toBe(true);
    }
  });

  it('keeps useful catalog facts when comparing products from different categories', () => {
    const result = compareProducts(
      catalog.find('bateria-portatil-magnetica-iphone'),
      catalog.find('airpods-pro-2'),
    );

    expect(result.rows.some((row) => row.key === 'capacity' && row.first?.value.includes('5.000'))).toBe(true);
    expect(result.rows.some((row) => row.key === 'noiseCancellation' && row.second?.value.includes('Activa'))).toBe(true);
    expect(result.rows.every((row) => row.first?.value || row.second?.value)).toBe(true);
  });
});

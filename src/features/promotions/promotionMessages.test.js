import { describe, expect, it } from 'vitest';
import { createAirpodsPromotionWhatsAppUrl, createCasePairPromotionWhatsAppUrl, PROMOTION_PRICES } from './promotionMessages.js';
import { formatCRC } from '../cart/cart.js';

describe('promotion WhatsApp messages', () => {
  it('keeps the AirPods promotion price and selections in the message', () => {
    const url = createAirpodsPromotionWhatsAppUrl('50688887777', { modelName: 'AirPods 4', colorName: 'Azul' });
    expect(url).toContain('50688887777');
    expect(decodeURIComponent(url)).toContain(formatCRC(PROMOTION_PRICES.airpods));
    expect(decodeURIComponent(url)).toContain('Color del estuche: Azul');
  });

  it('keeps the case-pair promotion price and models in the message', () => {
    const url = createCasePairPromotionWhatsAppUrl('50688887777', { iphoneModel: 'iPhone 15', iphoneColorName: 'Azul', airpodsModel: 'AirPods Pro 3', colorName: 'Negro' });
    expect(decodeURIComponent(url)).toContain(formatCRC(PROMOTION_PRICES.casePair));
    expect(decodeURIComponent(url)).toContain('Estuche para iPhone: iPhone 15');
    expect(decodeURIComponent(url)).toContain('Color del estuche de iPhone: Azul');
    expect(decodeURIComponent(url)).toContain('Estuche para AirPods: AirPods Pro 3');
  });
});

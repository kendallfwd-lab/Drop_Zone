import { formatCRC } from '../cart/cart.js';

export const PROMOTION_PRICES = Object.freeze({
  casePair: 8000,
  airpods: 20000,
});

function whatsappUrl(phone, message) {
  const number = String(phone).replace(/\D/g, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function createAirpodsPromotionWhatsAppUrl(phone, { modelName, colorName }) {
  const message = [
    `Hola, quiero solicitar la promoci\u00f3n AirPods 4 + estuche por ${formatCRC(PROMOTION_PRICES.airpods)}.`,
    `Aud\u00edfonos: ${modelName}.`,
    `Color del estuche: ${colorName || 'por elegir'}.`,
    `Precio promocional: ${formatCRC(PROMOTION_PRICES.airpods)}.`,
    '\u00bfMe confirman compatibilidad, existencias y precio final?',
  ].join('\\n');
  return whatsappUrl(phone, message);
}

export function createCasePairPromotionWhatsAppUrl(phone, { iphoneModel, iphoneColorName, airpodsModel, colorName }) {
  const message = [
    `Hola, quiero solicitar el combo de dos estuches por ${formatCRC(PROMOTION_PRICES.casePair)}.`,
    `Estuche para iPhone: ${iphoneModel || 'por elegir'}.`,
    `Color del estuche de iPhone: ${iphoneColorName || 'por elegir'}.`,
    `Estuche para AirPods: ${airpodsModel || 'por elegir'}.`,
    `Color del estuche de AirPods: ${colorName || 'por elegir'}.`,
    '\u00bfMe confirman disponibilidad y compatibilidad de ambos estuches?',
  ].join('\\n');
  return whatsappUrl(phone, message);
}

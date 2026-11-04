import { PROMOTION_PRICES } from './promotionMessages.js';

export const promotionDefinitions = [
  {
    id: 'case-pair',
    eyebrow: 'Combo especial',
    title: 'Dos estuches, una sola elecci\u00f3n',
    description: 'Eleg\u00ed el modelo de iPhone y de AirPods para preparar tu combo de estuches protectores.',
    productIds: ['estuches-iphone', 'estuches-airpods'],
    accent: 'slate',
    fixedPriceCRC: PROMOTION_PRICES.casePair,
    label: 'Combo por',
  },
  {
    id: 'airpods',
    eyebrow: 'Audio premium',
    title: 'AirPods 4 + tu estuche',
    description: 'Eleg\u00ed el color de tu estuche y llevate el combo completo con tus AirPods 4.',
    productIds: ['airpods-4'],
    accent: 'blue',
    fixedPriceCRC: PROMOTION_PRICES.airpods,
    label: 'Combo por',
  },
  {
    id: 'chargers',
    eyebrow: 'Carga USB-C',
    title: 'La potencia que necesit\u00e1s',
    description: 'Adaptadores y kits USB-C con opciones de 20 W, 25 W, 35 W y 45 W, seg\u00fan el producto disponible.',
    productIds: ['kit-cargador-apple-35w', 'apple-adaptador-usb-c', 'samsung-cargador-45w', 'samsung-adaptador-45w'],
    accent: 'slate',
    label: 'Opciones desde',
  },
  {
    id: 'power-banks',
    eyebrow: 'Energ\u00eda port\u00e1til',
    title: 'M\u00e1s bater\u00eda para tu ritmo',
    description: 'Bater\u00edas port\u00e1tiles magn\u00e9ticas para iPhone con capacidades de 5.000 y 10.000 mAh.',
    productIds: ['bateria-portatil-magnetica-iphone'],
    accent: 'ice',
    label: 'Desde',
  },
];

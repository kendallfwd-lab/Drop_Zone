import { comparisonSpecsByProduct } from '../data/comparisonSpecs.js';

const CATEGORY_GROUPS = {
  audio: ['audio', 'audífonos', 'audifonos'],
  chargers: ['cargador', 'adaptador'],
  batteries: ['batería', 'bateria'],
};

const ATTRIBUTE_DEFINITIONS = [
  { key: 'noiseCancellation', label: 'Cancelación de ruido', categories: ['audio'], priority: 1, patterns: [/cancelaci[oó]n.*ruido/i, /modo ambiente/i] },
  { key: 'battery', label: 'Autonomía', categories: ['audio'], priority: 2, patterns: [/hasta\s+\d+\s*h/i, /autonom[ií]a/i], metric: { pattern: /hasta\s+(\d+)\s*h/gi, unit: 'h', mode: 'max' } },
  { key: 'audioFunctions', label: 'Audio y funciones', categories: ['audio'], priority: 3, patterns: [/audio espacial/i, /audio adaptativo/i, /ecualizaci[oó]n/i, /altavoces/i, /aislamiento de voz/i, /graves/i] },
  { key: 'resistance', label: 'Resistencia', categories: ['audio', 'accessories'], priority: 4, patterns: [/resistencia/i, /ip\d{2}|ipx\d/i], metric: { pattern: /ip(?:x)?(\d+)/i, unit: 'IP', mode: 'first' } },
  { key: 'connectivity', label: 'Conexión y compatibilidad', categories: ['audio', 'accessories'], priority: 5, patterns: [/bluetooth/i, /conector/i, /puerto/i, /compatible/i, /compatibilidad/i, /usb-c/i, /lightning/i] },
  { key: 'exclusive', label: 'Diseño o función exclusiva', categories: ['audio'], priority: 6, patterns: [/chip\s+[a-z]\d/i, /diseño/i, /seguimiento din[aá]mico/i] },
  { key: 'power', label: 'Potencia de carga', categories: ['chargers', 'batteries', 'accessories'], priority: 1, patterns: [/\d+\s*w/i, /potencia/i, /carga r[aá]pida/i], metric: { pattern: /(\d+)\s*w/gi, unit: 'W', mode: 'max' } },
  { key: 'chargingStandard', label: 'Estándar de carga', categories: ['chargers', 'batteries'], priority: 2, patterns: [/power delivery|\bpd\b|pps/i, /super fast charging/i, /magn[eé]tic/i] },
  { key: 'port', label: 'Conexión', categories: ['chargers', 'accessories'], priority: 3, patterns: [/puerto/i, /conectores?/i, /usb-c/i, /lightning/i, /usb-a/i] },
  { key: 'capacity', label: 'Capacidad', categories: ['batteries'], priority: 1, patterns: [/\d[\d.]*(?:\s*)mah/i, /capacidad/i], metric: { pattern: /(\d[\d.]*)\s*mah/gi, unit: 'mAh', mode: 'max', stripDots: true } },
  { key: 'included', label: 'Contenido incluido', categories: ['chargers', 'accessories'], priority: 4, patterns: [/incluye/i, /se vende sin cable/i, /por separado/i] },
  { key: 'protection', label: 'Protección', categories: ['chargers'], priority: 5, patterns: [/protecci[oó]n/i, /sobrecorriente/i, /sobrecalentamiento/i, /cortocircuito/i] },
  { key: 'length', label: 'Longitud', categories: ['accessories'], priority: 2, patterns: [/longitud/i, /\d+(?:[,.]\d+)?\s*metros?/i, /\d+(?:[,.]\d+)?\s*m\b/i] },
  { key: 'data', label: 'Datos y sincronización', categories: ['accessories'], priority: 4, patterns: [/transferencia de datos/i, /sincroniz/i, /mb\/s/i] },
  { key: 'options', label: 'Opciones disponibles', categories: ['accessories', 'batteries'], priority: 5, patterns: [/disponible/i, /para escoger/i, /a escoger/i, /colores/i, /modelos/i] },
  { key: 'compatibility', label: 'Compatibilidad', categories: ['chargers', 'batteries', 'accessories'], priority: 6, patterns: [/compatible/i, /compatibilidad/i, /iphone/i, /ipad/i, /dispositivos/i] },
  { key: 'fit', label: 'Ajuste', categories: ['audio', 'accessories'], priority: 5, patterns: [/ajuste/i, /diadema/i, /geometr[ií]a/i] },
  { key: 'controls', label: 'Controles', categories: ['audio', 'accessories'], priority: 6, patterns: [/control/i, /sensor de fuerza/i, /digital crown/i] },
  { key: 'design', label: 'Diseño', categories: ['accessories'], priority: 5, patterns: [/diseño/i, /trenzado/i] },
];

const normalizeText = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9]+/g, ' ')
  .trim()
  .toLowerCase();

function categoryFor(product) {
  const text = normalizeText(`${product.category} ${product.name}`);
  if (CATEGORY_GROUPS.audio.some((word) => text.includes(normalizeText(word)))) return 'audio';
  if (CATEGORY_GROUPS.batteries.some((word) => text.includes(normalizeText(word)))) return 'batteries';
  if (CATEGORY_GROUPS.chargers.some((word) => text.includes(normalizeText(word)))) return 'chargers';
  return 'accessories';
}

function productFeatureText(product) {
  return [...(product.referenceFeatures || []), ...(product.verifiedFeatures || [])]
    .map((feature) => feature?.label?.trim())
    .filter(Boolean);
}

function metricValues(value, metric) {
  if (!value || !metric) return [];
  const regex = new RegExp(metric.pattern.source, metric.pattern.flags);
  const found = [];
  for (const match of value.matchAll(regex.global ? regex : new RegExp(regex.source, `${regex.flags}g`))) {
    const raw = metric.stripDots ? match[1].replace(/\./g, '') : match[1].replace(',', '.');
    const number = Number(raw);
    if (Number.isFinite(number)) found.push(number);
  }
  return found;
}

function extractAttributes(product) {
  const category = categoryFor(product);
  const structuredSpecs = comparisonSpecsByProduct[product.id];
  if (structuredSpecs?.length) {
    const attributes = new Map(structuredSpecs.map((item, index) => {
      const definition = ATTRIBUTE_DEFINITIONS.find((candidate) => candidate.key === item.key);
      const numericValues = item.numericValues || (item.numericValue != null ? [item.numericValue] : []);
      return [item.key, {
        ...definition,
        ...item,
        priority: definition?.priority ?? index + 1,
        normalizedValue: normalizeText(item.value),
        numericValues,
        numericValue: item.numericValue ?? (numericValues.length ? Math.max(...numericValues) : null),
        metric: item.unit ? { unit: item.unit } : definition?.metric,
      }];
    }));
    return { category, attributes };
  }
  const features = productFeatureText(product);
  const definitions = ATTRIBUTE_DEFINITIONS.filter((definition) => definition.categories.includes(category));
  const attributes = new Map();

  for (const definition of definitions) {
    const matches = features.filter((feature) => definition.patterns.some((pattern) => pattern.test(feature)));
    if (!matches.length) continue;
    const value = matches[0];
    const numericValues = metricValues(value, definition.metric);
    attributes.set(definition.key, {
      ...definition,
      value,
      normalizedValue: normalizeText(value),
      numericValues,
      numericValue: numericValues.length ? (definition.metric?.mode === 'max' ? Math.max(...numericValues) : numericValues[0]) : null,
    });
  }

  return { category, attributes };
}

function attributeOrder(key, categories) {
  const definition = ATTRIBUTE_DEFINITIONS.find((item) => item.key === key);
  const relevant = definition?.categories.some((category) => categories.includes(category));
  return relevant ? definition.priority : 99;
}

function advantageFor(first, second) {
  if (!first || !second || first.metric?.unit !== second.metric?.unit) return null;
  if (first.numericValue == null || second.numericValue == null || first.numericValue === second.numericValue) return null;
  if (first.numericValues.length > 1 && first.numericValues.length === second.numericValues.length) {
    const firstDominates = first.numericValues.every((value, index) => value >= second.numericValues[index]);
    const secondDominates = second.numericValues.every((value, index) => value >= first.numericValues[index]);
    if (!firstDominates && !secondDominates) return null;
  }
  return first.numericValue > second.numericValue ? 'first' : 'second';
}

function shortBenefit(row, side) {
  const attribute = side === 'first' ? row.first : row.second;
  const other = side === 'first' ? row.second : row.first;
  if (!attribute || !row.differs) return null;
  if (row.key === 'battery' && other && attribute.numericValues.length > 1 && other.numericValues.length === attribute.numericValues.length) {
    if (attribute.numericValues[0] > other.numericValues[0]) return `${attribute.numericValues[0] - other.numericValues[0]} h más de uso por carga`;
    if (attribute.numericValues.at(-1) > other.numericValues.at(-1)) return `${attribute.numericValues.at(-1) - other.numericValues.at(-1)} h más de autonomía total con el estuche`;
  }
  if (row.advantage === side) return `mayor ${row.label.toLowerCase()}`;
  if (other) return row.label.toLowerCase();
  return row.label.toLowerCase();
}

export function compareProducts(firstProduct, secondProduct, maxRows = 6) {
  const firstData = extractAttributes(firstProduct);
  const secondData = extractAttributes(secondProduct);
  const keys = new Set([...firstData.attributes.keys(), ...secondData.attributes.keys()]);
  const categories = [firstData.category, secondData.category];
  const allRows = [...keys].map((key) => {
    const first = firstData.attributes.get(key) || null;
    const second = secondData.attributes.get(key) || null;
    return {
      key,
      label: first?.label || second?.label || key,
      first,
      second,
      differs: !first || !second || first.normalizedValue !== second.normalizedValue,
      advantage: advantageFor(first, second),
      priority: Math.min(first?.priority ?? 99, second?.priority ?? 99, attributeOrder(key, categories)),
    };
  }).sort((a, b) => Number(b.differs) - Number(a.differs) || a.priority - b.priority || a.label.localeCompare(b.label, 'es'));

  const differentRows = allRows.filter((row) => row.differs);
  const rows = allRows.slice(0, maxRows);
  const differenceLabels = differentRows.slice(0, 2).map((row) => row.label.toLowerCase());
  const conclusion = differenceLabels.length
    ? `Las diferencias principales están en ${differenceLabels.join(' y ')}.`
    : 'Las fichas verificadas no muestran diferencias técnicas entre estas opciones.';
  const firstBenefit = rows.map((row) => shortBenefit(row, 'first')).find(Boolean);
  const secondBenefit = rows.map((row) => shortBenefit(row, 'second')).find(Boolean);

  return {
    rows,
    matchingRowCount: rows.filter((row) => !row.differs).length,
    omittedMatchCount: allRows.slice(maxRows).filter((row) => !row.differs).length,
    conclusion,
    recommendation: {
      first: firstBenefit ? `${firstProduct.name}: ${firstBenefit}.` : `${firstProduct.name}: confirmá compatibilidad y disponibilidad con la tienda.`,
      second: secondBenefit ? `${secondProduct.name}: ${secondBenefit}.` : `${secondProduct.name}: confirmá compatibilidad y disponibilidad con la tienda.`,
    },
  };
}

export { categoryFor, extractAttributes, normalizeText };

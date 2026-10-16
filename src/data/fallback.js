import data from '../../db.json';
import { ProductCatalog } from '../domain/catalog.js';

export function getFallbackData() {
  return {
    catalog: new ProductCatalog(data.products),
    settings: data.settings,
    siteSections: data.siteSections,
  };
}

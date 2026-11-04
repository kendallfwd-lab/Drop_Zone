export const catalogFilters = [
  { id: 'all', label: 'Todos', matches: () => true },
  { id: 'audio', label: 'Audio', matches: (product) => product.category === 'Audio' },
  { id: 'accessories', label: 'Accesorios', matches: (product) => product.productType === 'accessory' },
  { id: 'apple', label: 'Apple', matches: (product) => product.brand === 'Apple' },
  { id: 'samsung', label: 'Samsung', matches: (product) => product.brand === 'Samsung' },
];

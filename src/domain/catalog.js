export class Product {
  constructor(data) {
    if (!data?.id || !data?.name || !Number.isInteger(data.priceCRC) || data.priceCRC < 0) {
      throw new TypeError('Producto inválido: id, nombre y precio entero no negativo son obligatorios.');
    }
    Object.assign(this, data);
    this.features = Array.isArray(data.features) ? data.features : [];
    this.referenceFeatures = Array.isArray(data.referenceFeatures) ? data.referenceFeatures : [];
    this.models = Array.isArray(data.models) ? data.models : [];
    this.colors = Array.isArray(data.colors) ? data.colors : [];
  }

  get formattedPrice() {
    return `₡${new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(this.priceCRC).replace(/[\s\u00a0\u202f]/g, '.')}`;
  }

  get verifiedFeatures() {
    return this.features.filter((feature) => feature.verified === true);
  }

  whatsappUrl(phone, selections = {}) {
    const number = String(phone).replace(/\D/g, '');
    const selectedModel = this.models.includes(selections.model) ? selections.model : this.models[0];
    const selectedColor = this.colors.find((color) => color.name === selections.color) ?? this.colors[0];
    const message = this.configurable && selectedModel && selectedColor
      ? `Hola, me interesa el estuche de audífonos, color ${selectedColor.name} y modelo ${selectedModel}, con precio publicado de ${this.formattedPrice}. ¿Podrían confirmarme disponibilidad?`
      : `Hola, me interesa ${this.name} de Drop_Zone CR, con precio publicado de ${this.formattedPrice}. ¿Podrían confirmarme disponibilidad y detalles?`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  }
}

export class ProductCatalog {
  constructor(products) {
    this.products = products.map((data) => new Product(data)).sort((a, b) => a.displayOrder - b.displayOrder);
  }

  find(id) {
    return this.products.find((product) => product.id === id) ?? null;
  }

  get featured() {
    return this.products.filter((product) => product.featured);
  }
}

export class ProductService {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async getJson(path, signal) {
    const response = await fetch(`${this.baseUrl}${path}`, { signal });
    if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
    return response.json();
  }

  async load(signal) {
    const [products, settings, siteSections] = await Promise.all([
      this.getJson('/products', signal),
      this.getJson('/settings', signal),
      this.getJson('/siteSections', signal),
    ]);
    return { catalog: new ProductCatalog(products), settings, siteSections };
  }
}

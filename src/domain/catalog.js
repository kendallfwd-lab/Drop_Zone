export class Product {
  constructor(data) {
    if (!data?.id || !data?.name || !Number.isInteger(data.priceCRC) || data.priceCRC < 0) {
      throw new TypeError('Producto inválido: id, nombre y precio entero no negativo son obligatorios.');
    }
    Object.assign(this, data);
    this.features = Array.isArray(data.features) ? data.features : [];
    this.referenceFeatures = Array.isArray(data.referenceFeatures) ? data.referenceFeatures : [];
    this.specSourceLinks = Array.isArray(data.specSourceLinks) ? data.specSourceLinks : [];
    this.models = Array.isArray(data.models) ? data.models : [];
    this.colors = Array.isArray(data.colors) ? data.colors : [];
    this.variants = Array.isArray(data.variants) ? data.variants : [];
    this.gallery = Array.isArray(data.gallery) ? data.gallery : [];
  }

  get formattedPrice() {
    return this.formatPrice(this.priceCRC);
  }

  formatPrice(priceCRC) {
    return `₡${new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(priceCRC).replace(/[\s\u00a0\u202f]/g, '.')}`;
  }

  get verifiedFeatures() {
    return this.features.filter((feature) => feature.verified === true);
  }

  whatsappUrl(phone, selections = {}) {
    const number = String(phone).replace(/\D/g, '');
    const selectedModel = this.models.includes(selections.model) ? selections.model : this.models[0];
    const selectedColor = this.colors.find((color) => color.name === selections.color) ?? this.colors[0];
    const selectedVariant = this.variants.find((variant) => variant.name === selections.variant) ?? this.variants[0];
    const inquiryProductName = this.inquiryProductName || this.name;
    const selectedPrice = this.formatPrice(selectedVariant?.priceCRC ?? this.priceCRC);
    const message = selectedVariant
      ? `Hola, me interesa el ${inquiryProductName}, ${this.variantInquiryLabel || 'opción'} ${selectedVariant.name}, con precio publicado de ${selectedPrice}. ¿Podrían confirmarme disponibilidad y compatibilidad?`
      : (this.configurable || this.colorConfigurable) && selectedColor
      ? selectedModel
        ? `Hola, me interesa el ${inquiryProductName}, color ${selectedColor.name} y modelo ${selectedModel}, con precio publicado de ${this.formattedPrice}. ¿Podrían confirmarme disponibilidad?`
        : `Hola, me interesa el ${inquiryProductName}, color ${selectedColor.name}, con precio publicado de ${this.formattedPrice}. ¿Podrían confirmarme disponibilidad?`
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

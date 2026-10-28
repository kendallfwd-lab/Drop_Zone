import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App.jsx';
import data from '../db.json';

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  window.localStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const value = String(url).endsWith('/products') ? data.products : String(url).endsWith('/settings') ? data.settings : data.siteSections;
    return { ok: true, json: async () => value };
  }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function chooseConfiguratorOption(container, label, value) {
  fireEvent.click(within(container).getByRole('combobox', { name: label }));
  fireEvent.click(within(container).getByRole('option', { name: value, exact: true }));
}

describe('catalog experience', () => {
  it('shows the requested hero title without the removed lines', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('El producto que quieras de la mejor calidad');
    expect(screen.queryByText('TU TIENDA DE TECNOLOGÍA EN EL ROBLE')).not.toBeInTheDocument();
    expect(screen.queryByText('La tecnología que quieres, calidad en cada detalle.')).not.toBeInTheDocument();
  });

  it('changes the hero product background every five seconds', () => {
    const intervalCallbacks = [];
    const intervalSpy = vi.spyOn(window, 'setInterval').mockImplementation((callback, delay) => {
      if (delay === 5000) intervalCallbacks.push(callback);
      return 1;
    });
    try {
      const { container } = render(<App />);
      expect(container.querySelector('.hero__backdrop--active img')).toHaveAttribute('src', '/images/hero/airpods-pro-3-hero-v2.webp');
      expect(intervalCallbacks).not.toHaveLength(0);
      act(() => intervalCallbacks.forEach((callback) => callback()));
      expect(container.querySelector('.hero__backdrop--active img')).toHaveAttribute('src', '/images/hero/airpods-pro-2-hero.webp');
    } finally {
      intervalSpy.mockRestore();
    }
  });

  it('renders twenty prices, navigates to a product and updates its detail', async () => {
    render(<App />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    const catalog = document.getElementById('productos');
    expect(within(catalog).getAllByRole('button', { name: /^Ver detalles de/ })).toHaveLength(20);
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de AirPods Max/ }));
    expect(window.location.search).toBe('?producto=airpods-max');
    await waitFor(() => expect(within(document.getElementById('caracteristicas')).getByRole('heading', { name: 'AirPods Max' })).toBeInTheDocument());
    expect(within(document.getElementById('caracteristicas')).getAllByText('₡27.000').length).toBeGreaterThan(0);
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Apple Pencil/ }));
    await waitFor(() => expect(within(document.getElementById('caracteristicas')).getByRole('heading', { name: 'Apple Pencil' })).toBeInTheDocument());
    expect(within(document.getElementById('caracteristicas')).getAllByText('₡19.000').length).toBeGreaterThan(0);
  });

  it('filters the catalog by audio, accessories and brand', async () => {
    render(<App />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    const catalog = document.getElementById('productos');
    const productCards = () => within(catalog).getAllByRole('button', { name: /^Ver detalles de/ });

    expect(productCards()).toHaveLength(20);
    fireEvent.click(within(catalog).getByRole('button', { name: 'Audio' }));
    expect(productCards()).toHaveLength(7);
    expect(within(catalog).getByRole('button', { name: /Ver detalles de Samsung Galaxy Buds3 Pro/ })).toBeInTheDocument();
    expect(within(catalog).queryByRole('button', { name: /Ver detalles de Apple Pencil/ })).not.toBeInTheDocument();

    fireEvent.click(within(catalog).getByRole('button', { name: 'Samsung' }));
    expect(productCards()).toHaveLength(4);
    expect(within(catalog).getByRole('button', { name: /Ver detalles de Samsung Galaxy Buds3 Pro/ })).toBeInTheDocument();
    expect(within(catalog).getByRole('button', { name: /Ver detalles de Cargador Samsung 45W USB-C/ })).toBeInTheDocument();
    expect(within(catalog).getByRole('button', { name: /Ver detalles de Adaptador Samsung 45W USB-C/ })).toBeInTheDocument();
    expect(within(catalog).getByRole('button', { name: /Ver detalles de Cable Samsung USB-C a USB-C 3A/ })).toBeInTheDocument();
    expect(within(catalog).queryByRole('button', { name: /Ver detalles de AirPods Pro 3/ })).not.toBeInTheDocument();

    fireEvent.click(within(catalog).getByRole('button', { name: 'Accesorios' }));
    expect(productCards()).toHaveLength(3);
    expect(within(catalog).getByRole('button', { name: /Ver detalles de Apple Pencil/ })).toBeInTheDocument();
    expect(within(catalog).getByRole('button', { name: /Ver detalles de Estuches para AirPods/ })).toBeInTheDocument();
    expect(within(catalog).getByRole('button', { name: /Ver detalles de Estuches para iPhone/ })).toBeInTheDocument();
  });

  it('uses browser history to return to Drop Zone and restore the selected product', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    const externalLinks = screen.getAllByRole('link').filter((link) => /^https?:/.test(link.href));
    expect(externalLinks.length).toBeGreaterThan(0);
    externalLinks.forEach((link) => expect(link).not.toHaveAttribute('target'));

    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de AirPods Max/ }));
    await waitFor(() => expect(within(document.getElementById('caracteristicas')).getByRole('heading', { name: 'AirPods Max' })).toBeInTheDocument());
    window.history.replaceState({}, '', '/?producto=airpods-4');
    fireEvent.popState(window);
    await waitFor(() => expect(within(document.getElementById('caracteristicas')).getByRole('heading', { name: 'AirPods 4' })).toBeInTheDocument());
  });

  it('changes the AirPods Max image and WhatsApp inquiry by color', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    expect(within(catalog).getByRole('img', { name: /AirPods Max en color azul medianoche/ })).toHaveAttribute('src', '/images/products/airpods-max-azul-medianoche.webp');
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de AirPods Max/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('img', { name: 'AirPods Max en color Azul medianoche' })).toHaveAttribute('src', '/images/products/airpods-max-azul-medianoche.webp'));
    fireEvent.click(within(detail).getByRole('button', { name: 'Elegir color Azul medianoche' }));
    expect(within(detail).getByRole('img', { name: 'AirPods Max en color Azul medianoche' })).toHaveAttribute('src', '/images/products/airpods-max-azul-medianoche.webp');
    const link = within(detail).getByRole('link', { name: /Consultar por WhatsApp sobre AirPods Max/ });
    const message = new URL(link.href).searchParams.get('text');
    expect(message).toContain('AirPods Max');
    expect(message).toContain('color Azul medianoche');
    expect(message).toContain('₡27.000');
  });

  it('switches tabs with keyboard and shows sourced model specifications', async () => {
    render(<App />);
    fireEvent.click(within(document.getElementById('productos')).getByRole('button', { name: /Ver detalles de AirPods Pro 3/ }));
    const detail = document.getElementById('caracteristicas');
    const featureTab = within(detail).getByRole('tab', { name: 'Características' });
    fireEvent.keyDown(featureTab, { key: 'ArrowRight' });
    expect(within(detail).getByRole('tab', { name: 'Precio' })).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => expect(within(detail).getByText(/Consultá disponibilidad y opciones de entrega por WhatsApp/)).toBeInTheDocument());
    fireEvent.click(featureTab);
    expect(within(detail).queryByText('Estuche de carga incluido en la presentación ilustrada')).not.toBeInTheDocument();
    await waitFor(() => expect(within(detail).getByText('Chip H2 y conexión Bluetooth 5.3')).toBeInTheDocument());
    expect(within(detail).getByRole('link', { name: /Ver ficha oficial de Apple/ })).toHaveAttribute('href', 'https://www.apple.com/la/airpods-pro/specs/');
  });

  it('uses a visible fallback notice when the local API fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    render(<App />);
    expect(await screen.findByText(/Vista de respaldo/)).toBeInTheDocument();
  });

  it('configures an AirPods case and prepares model and color for WhatsApp', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Estuches para AirPods/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('img', { name: 'Estuches para AirPods en color Azul oscuro' })).toHaveAttribute('src', '/images/products/estuche-azul-oscuro.webp'));
    expect(within(detail).queryByRole('group', { name: 'Galería de estuches' })).not.toBeInTheDocument();
    chooseConfiguratorOption(detail, 'Modelo de AirPods', 'AirPods Pro 2');
    chooseConfiguratorOption(detail, 'Color', 'Fucsia');
    expect(within(detail).getByRole('img', { name: 'Estuches para AirPods en color Fucsia' })).toHaveAttribute('src', '/images/products/estuche-fucsia.webp');
    const link = within(detail).getByRole('link', { name: /Consultar por WhatsApp sobre Estuches para AirPods/ });
    const message = new URL(link.href).searchParams.get('text');
    expect(message).toContain('estuche de audífonos');
    expect(message).toContain('color Fucsia');
    expect(message).toContain('modelo AirPods Pro 2');
    expect(message).toContain('₡4.000');
  });

  it('configures an iPhone case, changes its image and prepares WhatsApp', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Estuches para iPhone/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('img', { name: 'Estuches para iPhone en color Azul oscuro' })).toHaveAttribute('src', '/images/products/estuche-iphone-azul-oscuro.webp'));
    chooseConfiguratorOption(detail, 'Modelo de iPhone', 'iPhone 17 Pro Max');
    chooseConfiguratorOption(detail, 'Color', 'Azul oscuro');
    expect(within(detail).getByRole('img', { name: 'Estuches para iPhone en color Azul oscuro' })).toHaveAttribute('src', '/images/products/estuche-iphone-azul-oscuro.webp');
    const link = within(detail).getByRole('link', { name: /Consultar por WhatsApp sobre Estuches para iPhone/ });
    const message = new URL(link.href).searchParams.get('text');
    expect(message).toContain('estuche para iPhone');
    expect(message).toContain('color Azul oscuro');
    expect(message).toContain('modelo iPhone 17 Pro Max');
    expect(message).toContain('₡6.000');
  });

  it('adds a configured product, edits its quantity and sends the cart through WhatsApp', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Estuches para iPhone/ }));
    const detail = document.getElementById('caracteristicas');
    chooseConfiguratorOption(detail, 'Modelo de iPhone', 'iPhone 17 Pro Max');
    chooseConfiguratorOption(detail, 'Color', 'Azul oscuro');
    fireEvent.click(within(detail).getByRole('button', { name: 'Aumentar cantidad' }));
    expect(within(detail).getByText('₡12.000')).toBeInTheDocument();
    fireEvent.click(within(detail).getByRole('button', { name: /Agregar al carrito/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Abrir carrito, 2 productos' }));
    const cart = screen.getByRole('dialog', { name: 'Carrito de compras' });
    expect(cart.querySelector('.cart-item img')).toHaveAttribute('src', '/images/products/estuche-iphone-azul-oscuro.webp');
    expect(within(cart).getByText('Modelo de iPhone: iPhone 17 Pro Max')).toBeInTheDocument();
    expect(within(cart).getByText('Color: Azul oscuro')).toBeInTheDocument();
    expect(within(cart).getByText('Total: ₡12.000')).toBeInTheDocument();

    fireEvent.change(within(cart).getByRole('spinbutton', { name: 'Cantidad' }), { target: { value: '3' } });
    expect(within(cart).getByText('Total: ₡18.000')).toBeInTheDocument();
    const orderLink = within(cart).getByRole('link', { name: 'Enviar pedido completo por WhatsApp' });
    const orderMessage = new URL(orderLink.href).searchParams.get('text');
    expect(orderMessage).toContain('Modelo de iPhone: iPhone 17 Pro Max');
    expect(orderMessage).toContain('Color: Azul oscuro');
    expect(orderMessage).toContain('Cantidad: 3');
    expect(orderMessage).toContain('Total publicado: ₡18.000');

    fireEvent.click(within(cart).getByRole('button', { name: /Eliminar estuche para iPhone del carrito/i }));
    expect(within(cart).getByText('Tu carrito está vacío')).toBeInTheDocument();
  });

  it('shows the Audio discount in the cart and notifies when the threshold is reached', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de AirPods Pro 3/ }));
    const detail = document.getElementById('caracteristicas');
    fireEvent.click(within(detail).getByRole('button', { name: 'Aumentar cantidad' }));
    expect(within(detail).getByText('TOTAL CON DESCUENTO')).toBeInTheDocument();
    expect(within(detail).getByText('₡45.000')).toBeInTheDocument();
    expect(within(detail).getByText(/¡Descuento de Audio! Ahorrás ₡5.000/)).toBeInTheDocument();
    fireEvent.click(within(detail).getByRole('button', { name: 'Disminuir cantidad' }));
    fireEvent.click(within(detail).getByRole('button', { name: /Agregar al carrito/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Abrir carrito, 1 producto' }));
    const cart = screen.getByRole('dialog', { name: 'Carrito de compras' });
    fireEvent.click(within(cart).getByRole('button', { name: 'Aumentar cantidad' }));
    expect(document.querySelector('.cart-toast')).toHaveTextContent('Descuento aplicado! Ahorraste ₡5.000');
    expect(within(cart).getByText('Subtotal')).toBeInTheDocument();
    expect(within(cart).getByText('Descuento Audio')).toBeInTheDocument();
    expect(within(cart).getByText('-₡5.000')).toBeInTheDocument();
    expect(within(cart).getByText('¡Descuento aplicado! Ahorraste ₡5.000 por comprar 2 productos de Audio.')).toBeInTheDocument();
  });

  it('restores the Audio discount for older cart items when quantity increases', () => {
    window.localStorage.setItem('drop-zone-cart', JSON.stringify([{
      key: 'airpods-4', productId: 'airpods-4', name: 'AirPods 4', unitPriceCRC: 18000,
      quantity: 1, options: [], image: '/images/products/airpods-4.webp', imageAlt: 'AirPods 4',
    }]));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir carrito, 1 producto' }));
    const cart = screen.getByRole('dialog', { name: 'Carrito de compras' });
    expect(within(cart).getByText(/Agregá otro producto de Audio/)).toBeInTheDocument();
    fireEvent.click(within(cart).getByRole('button', { name: 'Aumentar cantidad' }));
    expect(within(cart).getByText('Descuento Audio')).toBeInTheDocument();
    expect(within(cart).getByText('-₡5.000')).toBeInTheDocument();
  });

  it('shows Samsung-sourced Galaxy Buds3 Pro specifications and price', async () => {
    render(<App />);
    fireEvent.click(within(document.getElementById('productos')).getByRole('button', { name: /Ver detalles de Samsung Galaxy Buds3 Pro/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('heading', { name: 'Samsung Galaxy Buds3 Pro' })).toBeInTheDocument());
    expect(within(detail).getAllByText('₡20.000').length).toBeGreaterThan(0);
    expect(within(detail).getByText(/Bluetooth 5.4 y resistencia/)).toBeInTheDocument();
    expect(within(detail).getByRole('link', { name: /Ver ficha oficial de Samsung/ })).toHaveAttribute('href', 'https://www.samsung.com/latin/audio-sound/galaxy-buds/galaxy-buds3-pro-silver-sm-r630nzaalta/');
  });

  it('shows the Samsung 45W charger beside the Buds with official specifications', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    const cards = within(catalog).getAllByRole('button', { name: /^Ver detalles de/ });
    expect(cards[8]).toHaveAccessibleName(/Samsung Galaxy Buds3 Pro/);
    expect(cards[9]).toHaveAccessibleName(/Cargador Samsung 45W USB-C/);
    fireEvent.click(cards[9]);
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('heading', { name: 'Cargador Samsung 45W USB-C' })).toBeInTheDocument());
    expect(within(detail).getAllByText('₡8.000').length).toBeGreaterThan(0);
    expect(within(detail).getByText(/Super Fast Charging 2.0/)).toBeInTheDocument();
    expect(within(detail).getAllByText(/cable USB-C a USB-C de 5 A y 1,8 m/).length).toBeGreaterThanOrEqual(1);
    expect(within(detail).getByRole('link', { name: /Ver ficha oficial de Samsung/ })).toHaveAttribute('href', 'https://www.samsung.com/latin/mobile-accessories/45w-power-adapter-black-ep-t4510xbegca/');
  });

  it('shows the separate Samsung 45W adapter without cable for six thousand colones', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    expect(within(catalog).getAllByRole('button', { name: /^Ver detalles de/ })[10]).toHaveAccessibleName(/Adaptador Samsung 45W USB-C/);
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Adaptador Samsung 45W USB-C/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('heading', { name: 'Adaptador Samsung 45W USB-C' })).toBeInTheDocument());
    expect(within(detail).getAllByText('₡6.000').length).toBeGreaterThan(0);
    expect(within(detail).getByText('Consumo en espera inferior a 5 mW')).toBeInTheDocument();
    expect(within(detail).getByText(/Esta presentación no incluye cable/)).toBeInTheDocument();
    expect(within(detail).getByRole('link', { name: /Ver ficha oficial de Samsung/ })).toHaveAttribute('href', 'https://www.samsung.com/us/mobile-accessories/45w-pd-power-adapter-sku-ep-t4511nbegus/');
  });

  it('shows the USB-C 60W cable as a separate four-thousand-colones product', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    expect(within(catalog).getAllByRole('button', { name: /^Ver detalles de/ })[12]).toHaveAccessibleName(/Cable USB-C 60W de 1 m/);
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Cable USB-C 60W de 1 m/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('heading', { name: 'Cable USB-C 60W de 1 m' })).toBeInTheDocument());
    expect(within(detail).getAllByText('₡4.000').length).toBeGreaterThan(0);
    expect(within(detail).getByText(/Admite carga de hasta 60 W/)).toBeInTheDocument();
    expect(within(detail).getByText(/transferencia de datos a velocidad USB 2/)).toBeInTheDocument();
    expect(within(detail).getByRole('link', { name: /Ver ficha oficial de Apple/ })).toHaveAttribute('href', 'https://www.apple.com/mx/shop/product/mw493am/a/cable-de-carga-usb-c-de-60-w-1-m');
  });

  it('changes the Apple adapter price and WhatsApp message by selected wattage', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Adaptador de corriente USB-C de Apple/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('heading', { name: 'Adaptador de corriente USB-C de Apple' })).toBeInTheDocument());
    expect(within(detail).getAllByText('₡6.500').length).toBeGreaterThan(0);
    chooseConfiguratorOption(detail, 'Potencia', '20 W');
    expect(within(detail).getAllByText('₡5.000').length).toBeGreaterThan(0);
    const link = within(detail).getByRole('link', { name: /Consultar por WhatsApp sobre Adaptador de corriente USB-C de Apple/ });
    const message = new URL(link.href).searchParams.get('text');
    expect(message).toContain('potencia 20 W');
    expect(message).toContain('₡5.000');
  });

  it('switches the EarPods image and WhatsApp inquiry between USB-C and Lightning', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de EarPods con cable/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('img', { name: 'EarPods con cable, USB-C' })).toHaveAttribute('src', '/images/products/earpods-usb-c-premium.webp'));
    expect(within(detail).getAllByText('₡10.000').length).toBeGreaterThan(0);
    chooseConfiguratorOption(detail, 'Tipo de conector', 'Lightning');
    expect(within(detail).getByRole('img', { name: 'EarPods con cable, Lightning' })).toHaveAttribute('src', '/images/products/earpods-lightning-premium.webp');
    const link = within(detail).getByRole('link', { name: /Consultar por WhatsApp sobre EarPods con cable/ });
    const message = new URL(link.href).searchParams.get('text');
    expect(message).toContain('conector Lightning');
    expect(message).toContain('₡10.000');
    expect(within(detail).getByRole('link', { name: /Ver ficha USB-C de Apple/ })).toBeInTheDocument();
    expect(within(detail).getByRole('link', { name: /Ver ficha Lightning de Apple/ })).toBeInTheDocument();
  });

  it('shows the Apple 35W charger and cable kit for nine thousand five hundred colones', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Kit cargador USB-C 35W con cable/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('heading', { name: 'Kit cargador USB-C 35W con cable' })).toBeInTheDocument());
    expect(within(detail).getAllByText('₡9.500').length).toBeGreaterThan(0);
    expect(within(detail).getByText(/Incluye adaptador de corriente USB-C y cable USB-C a USB-C/)).toBeInTheDocument();
    expect(within(detail).getByText(/puede diferir de los modelos oficiales enlazados/)).toBeInTheDocument();
    expect(within(detail).getByRole('link', { name: /Referencia Apple para adaptador de 35 W/ })).toBeInTheDocument();
    expect(within(detail).getByRole('link', { name: /Referencia Apple para cable USB-C/ })).toBeInTheDocument();
    const link = within(detail).getByRole('link', { name: /Consultar por WhatsApp sobre Kit cargador USB-C 35W con cable/ });
    const message = new URL(link.href).searchParams.get('text');
    expect(message).toContain('Kit cargador USB-C 35W con cable');
    expect(message).toContain('₡9.500');
  });

  it('switches the 3.5 mm Apple audio adapter between USB-C and Lightning', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Adaptador para audífonos de 3,5 mm/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('img', { name: 'Adaptador para audífonos de 3,5 mm, USB-C' })).toHaveAttribute('src', '/images/products/adaptador-audio-usb-c.webp'));
    expect(within(detail).getAllByText('₡3.700').length).toBeGreaterThan(0);
    chooseConfiguratorOption(detail, 'Conector del dispositivo', 'Lightning');
    expect(within(detail).getByRole('img', { name: 'Adaptador para audífonos de 3,5 mm, Lightning' })).toHaveAttribute('src', '/images/products/adaptador-audio-lightning.webp');
    expect(within(detail).getByText(/iOS 10 o posterior/)).toBeInTheDocument();
    const link = within(detail).getByRole('link', { name: /Consultar por WhatsApp sobre Adaptador para audífonos de 3,5 mm/ });
    const message = new URL(link.href).searchParams.get('text');
    expect(message).toContain('conector Lightning');
    expect(message).toContain('₡3.700');
  });

  it('updates the magnetic battery image and price by selected capacity', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Batería portátil magnética para iPhone/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('img', { name: 'Batería portátil magnética para iPhone, 5.000 mAh' })).toHaveAttribute('src', '/images/products/bateria-magnetica-5000mah.webp'));
    expect(within(detail).getAllByText('₡10.000').length).toBeGreaterThan(0);
    const largeOption = within(detail).getByRole('button', { name: '10.000 mAh ₡15.000' });
    fireEvent.click(largeOption);
    expect(within(detail).getByRole('img', { name: 'Batería portátil magnética para iPhone, 10.000 mAh' })).toHaveAttribute('src', '/images/products/bateria-magnetica-10000mah.webp');
    expect(within(detail).getAllByText('₡15.000').length).toBeGreaterThan(0);
    const link = within(detail).getByRole('link', { name: /Consultar por WhatsApp sobre Batería portátil magnética para iPhone/ });
    const message = new URL(link.href).searchParams.get('text');
    expect(message).toContain('capacidad 10.000 mAh');
    expect(message).toContain('₡15.000');
  });

  it('switches the Samsung USB-C cable between black and white', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Cable Samsung USB-C a USB-C 3A/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('img', { name: 'Cable Samsung USB-C a USB-C 3A, Negro' })).toHaveAttribute('src', '/images/products/cable-samsung-usbc-negro.webp'));
    expect(within(detail).getAllByText('₡5.000').length).toBeGreaterThan(0);
    chooseConfiguratorOption(detail, 'Color', 'Blanco');
    expect(within(detail).getByRole('img', { name: 'Cable Samsung USB-C a USB-C 3A, Blanco' })).toHaveAttribute('src', '/images/products/cable-samsung-usbc-blanco.webp');
    const message = new URL(within(detail).getByRole('link', { name: /Consultar por WhatsApp sobre Cable Samsung USB-C a USB-C 3A/ }).href).searchParams.get('text');
    expect(message).toContain('color Blanco');
    expect(message).toContain('₡5.000');
  });

  it('updates the Apple USB-C to Lightning cable by selected length', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Cable USB-C a Lightning/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('img', { name: 'Cable USB-C a Lightning, 1 m' })).toHaveAttribute('src', '/images/products/cable-apple-usbc-lightning-1m.webp'));
    expect(within(detail).getAllByText('₡5.000').length).toBeGreaterThan(0);
    fireEvent.click(within(detail).getByRole('button', { name: '2 m ₡6.500' }));
    expect(within(detail).getByRole('img', { name: 'Cable USB-C a Lightning, 2 m' })).toHaveAttribute('src', '/images/products/cable-apple-usbc-lightning-2m.webp');
    expect(within(detail).getAllByText('₡6.500').length).toBeGreaterThan(0);
    const message = new URL(within(detail).getByRole('link', { name: /Consultar por WhatsApp sobre Cable USB-C a Lightning/ }).href).searchParams.get('text');
    expect(message).toContain('longitud 2 m');
    expect(message).toContain('₡6.500');
  });

  it('shows the Lightning to USB cable first and switches to its packaging image', async () => {
    render(<App />);
    const catalog = document.getElementById('productos');
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Cable Lightning a USB de 1 m/ }));
    const detail = document.getElementById('caracteristicas');
    await waitFor(() => expect(within(detail).getByRole('img', { name: 'Cable Lightning a USB de 1 m, vista Cable' })).toHaveAttribute('src', '/images/products/cable-apple-lightning-usb-1m.png'));
    expect(within(detail).getAllByText('₡4.000').length).toBeGreaterThan(0);
    fireEvent.click(within(detail).getByRole('button', { name: 'Empaque' }));
    expect(within(detail).getByRole('img', { name: 'Cable Lightning a USB de 1 m, vista Empaque' })).toHaveAttribute('src', '/images/products/cable-apple-lightning-usb-1m-empaque.png');
  });

  it('compares two selected products and opens the chosen detail', async () => {
    render(<App />);
    const comparison = document.getElementById('comparar');
    expect(within(comparison).getByText('Diferencia de precio: ₡5.000')).toBeInTheDocument();
    const differencesButton = within(comparison).getByRole('button', { name: 'Ver diferencias' });
    expect(differencesButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(differencesButton);
    expect(within(comparison).getByRole('table', { name: 'Comparación entre AirPods Pro 3 y AirPods Pro 2' })).toBeInTheDocument();
    expect(within(comparison).getByText('Autonomía')).toBeInTheDocument();
    expect(within(comparison).getByRole('button', { name: 'Ocultar diferencias' })).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(within(comparison).getByRole('combobox', { name: 'Segundo producto para comparar' }));
    fireEvent.click(within(comparison).getByRole('option', { name: /AirPods 3/ }));
    expect(within(comparison).getByText('Diferencia de precio: ₡9.000')).toBeInTheDocument();
    expect(within(comparison).getByRole('button', { name: 'Ver diferencias' })).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(within(comparison).getByRole('button', { name: 'Ver detalles de AirPods 3' }));
    await waitFor(() => expect(within(document.getElementById('caracteristicas')).getByRole('heading', { name: 'AirPods 3' })).toBeInTheDocument());
  });
});

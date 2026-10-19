import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App.jsx';
import data from '../db.json';

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    const value = String(url).endsWith('/products') ? data.products : String(url).endsWith('/settings') ? data.settings : data.siteSections;
    return { ok: true, json: async () => value };
  }));
});

afterEach(() => vi.unstubAllGlobals());

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
      expect(container.querySelector('.hero__backdrop--active img')).toHaveAttribute('src', '/images/hero/airpods-hero-background.webp');
      expect(intervalCallbacks).not.toHaveLength(0);
      act(() => intervalCallbacks.forEach((callback) => callback()));
      expect(container.querySelector('.hero__backdrop--active img')).toHaveAttribute('src', '/images/hero/airpods-pro-3-hero-v2.webp');
    } finally {
      intervalSpy.mockRestore();
    }
  });

  it('renders eight prices, navigates to a product and updates its detail', async () => {
    render(<App />);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    const catalog = document.getElementById('productos');
    expect(within(catalog).getAllByRole('button', { name: /^Ver detalles de/ })).toHaveLength(8);
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de AirPods Max/ }));
    expect(window.location.search).toBe('?producto=airpods-max');
    await waitFor(() => expect(within(document.getElementById('caracteristicas')).getByRole('heading', { name: 'AirPods Max' })).toBeInTheDocument());
    expect(within(document.getElementById('caracteristicas')).getAllByText('₡27.000').length).toBeGreaterThan(0);
    fireEvent.click(within(catalog).getByRole('button', { name: /Ver detalles de Apple Pencil/ }));
    await waitFor(() => expect(within(document.getElementById('caracteristicas')).getByRole('heading', { name: 'Apple Pencil' })).toBeInTheDocument());
    expect(within(document.getElementById('caracteristicas')).getAllByText('₡22.000').length).toBeGreaterThan(0);
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
    await waitFor(() => expect(within(detail).getByRole('img', { name: 'Estuches para AirPods en color Verde pino' })).toHaveAttribute('src', '/images/products/estuche-verde-pino.webp'));
    expect(within(detail).queryByRole('group', { name: 'Galería de estuches' })).not.toBeInTheDocument();
    fireEvent.change(within(detail).getByLabelText('Modelo de AirPods'), { target: { value: 'AirPods Pro 2' } });
    fireEvent.change(within(detail).getByLabelText('Color'), { target: { value: 'Fucsia' } });
    expect(within(detail).getByRole('img', { name: 'Estuches para AirPods en color Fucsia' })).toHaveAttribute('src', '/images/products/estuche-fucsia.webp');
    const link = within(detail).getByRole('link', { name: /Consultar por WhatsApp sobre Estuches para AirPods/ });
    const message = new URL(link.href).searchParams.get('text');
    expect(message).toContain('estuche de audífonos');
    expect(message).toContain('color Fucsia');
    expect(message).toContain('modelo AirPods Pro 2');
    expect(message).toContain('₡4.000');
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

  it('compares two selected products and opens the chosen detail', async () => {
    render(<App />);
    const comparison = document.getElementById('comparar');
    expect(within(comparison).getByText('Diferencia de precio: ₡5.000')).toBeInTheDocument();
    fireEvent.change(within(comparison).getByRole('combobox', { name: 'Segundo producto para comparar' }), { target: { value: 'airpods-3' } });
    expect(within(comparison).getByText('Diferencia de precio: ₡9.000')).toBeInTheDocument();
    fireEvent.click(within(comparison).getByRole('button', { name: 'Ver detalles de AirPods 3' }));
    await waitFor(() => expect(within(document.getElementById('caracteristicas')).getByRole('heading', { name: 'AirPods 3' })).toBeInTheDocument());
  });
});

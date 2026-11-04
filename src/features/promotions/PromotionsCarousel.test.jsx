import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getFallbackData } from '../../data/fallback.js';
import PromotionsCarousel from './PromotionsCarousel.jsx';

function renderPromotions() {
  const { catalog, settings } = getFallbackData();
  return render(<PromotionsCarousel catalog={catalog} settings={settings} onSelect={vi.fn()} reducedMotion />);
}

describe('PromotionsCarousel', () => {
  afterEach(cleanup);
  it('moves between promotion slides with the carousel controls', () => {
    renderPromotions();

    expect(screen.getByText('Dos estuches, una sola elección')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver siguiente promoción' }));

    expect(screen.getByText('AirPods 4 + tu estuche')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Promociones destacadas' })).toHaveAttribute('aria-roledescription', 'carrusel');
  });

  it('opens the case-pair configurator and exposes its WhatsApp action', () => {
    renderPromotions();
    fireEvent.click(screen.getByRole('button', { name: 'Elegir combo' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Personalizá tu combo' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Seleccionar color del estuche de iPhone' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Seleccionar color del estuche de AirPods' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Solicitar combo de estuches/ })).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });

  it('opens the AirPods configurator after selecting its slide', () => {
    renderPromotions();
    fireEvent.click(screen.getByRole('button', { name: 'Ver siguiente promoción' }));
    fireEvent.click(screen.getByRole('button', { name: 'Personalizar promoción' }));

    expect(screen.getByRole('heading', { name: 'Personalizá tu promoción' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Solicitar esta selección/ })).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });
});

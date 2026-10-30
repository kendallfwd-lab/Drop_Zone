import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AccessiblePicker from './AccessiblePicker.jsx';

afterEach(cleanup);

const options = [
  { value: 'first', label: 'Primer producto', description: 'Audio' },
  { value: 'second', label: 'Segundo producto', description: 'Accesorios' },
  { value: 'third', label: 'Tercer producto', description: 'Audio' },
];

describe('AccessiblePicker', () => {
  it('opens and selects options with arrow keys and Enter', () => {
    const onChange = vi.fn();
    render(<AccessiblePicker label="Producto" value="first" options={options} onChange={onChange} />);
    const trigger = screen.getByRole('combobox', { name: 'Producto' });

    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-activedescendant');

    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('second');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('supports Home and End and closes with Escape', () => {
    render(<AccessiblePicker label="Producto" value="first" options={options} onChange={vi.fn()} />);
    const trigger = screen.getByRole('combobox', { name: 'Producto' });

    fireEvent.keyDown(trigger, { key: 'End' });
    expect(trigger.getAttribute('aria-activedescendant')).toMatch(/option-2$/);
    fireEvent.keyDown(trigger, { key: 'Home' });
    expect(trigger.getAttribute('aria-activedescendant')).toMatch(/option-0$/);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });
});

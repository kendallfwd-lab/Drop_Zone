import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function AccessiblePicker({ label, value, options, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const pickerRef = useRef(null);
  const triggerRef = useRef(null);
  const listboxId = `picker-${useId()}`;
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options[selectedIndex];

  const openAt = (index = selectedIndex) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const selectOption = (option) => {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!pickerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const handleKeyDown = (event) => {
    if (!options.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      if (!open) {
        openAt((selectedIndex + direction + options.length) % options.length);
        return;
      }
      setActiveIndex((current) => (current + direction + options.length) % options.length);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1);
    } else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault();
      if (options[activeIndex]) selectOption(options[activeIndex]);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openAt();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return <div className={`product-picker ${className} ${open ? 'product-picker--open' : ''}`.trim()} ref={pickerRef}>
    <button
      ref={triggerRef}
      type="button"
      className="product-picker__trigger"
      role="combobox"
      aria-label={label}
      disabled={!options.length}
      aria-expanded={open}
      aria-haspopup="listbox"
      aria-controls={listboxId}
      aria-activedescendant={open ? `${listboxId}-option-${activeIndex}` : undefined}
      onClick={() => (open ? setOpen(false) : openAt())}
      onKeyDown={handleKeyDown}
    >
      <span>{selected?.label}</span>
      <ChevronDown size={19} aria-hidden="true" />
    </button>
    {open && <div className="product-picker__menu" role="listbox" id={listboxId} aria-label={label}>
      {options.map((option, index) => <div
        key={option.value}
        id={`${listboxId}-option-${index}`}
        role="option"
        aria-selected={option.value === value}
        className={`product-picker__option ${option.value === value ? 'product-picker__option--selected' : ''} ${index === activeIndex ? 'product-picker__option--active' : ''}`}
        onMouseMove={() => setActiveIndex(index)}
        onClick={() => selectOption(option)}
      >
        <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
        {option.value === value && <Check size={17} aria-hidden="true" />}
      </div>)}
    </div>}
  </div>;
}

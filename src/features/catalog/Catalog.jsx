import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { catalogFilters } from './catalogFilters.js';
import { ProductImage } from '../../components/common/Shared.jsx';

function ProductCard({ product, selected, onSelect, index, reducedMotion }) {
  return <motion.button type="button" className={`product-card ${selected ? 'product-card--selected' : ''}`} onClick={() => onSelect(product.id)} aria-label={`Ver detalles de ${product.name}, ${product.formattedPrice}`} aria-pressed={selected}
    initial={reducedMotion ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.42, delay: reducedMotion ? 0 : Math.min(index * 0.055, 0.28), ease: 'easeOut' }} whileHover={reducedMotion ? undefined : { y: -6 }} whileTap={reducedMotion ? undefined : { scale: 0.985 }}>
    <div className="product-card__image"><ProductImage product={product} /></div>
    <div className="product-card__meta"><span className="product-card__category">{product.category}</span><span className="product-card__arrow"><ArrowRight size={17} /></span></div>
    <h3>{product.name}</h3>
    <p>{product.formattedPrice}</p>
  </motion.button>;
}

export default function Catalog({ catalog, selectedId, onSelect, reducedMotion }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const filter = catalogFilters.find((item) => item.id === activeFilter) || catalogFilters[0];
  const products = catalog.featured.filter(filter.matches);

  return <section id="productos" className="catalog section" aria-labelledby="catalog-title">
    <div className="container">
      <div className="section-heading">
        <div><p className="eyebrow">NUESTROS PRODUCTOS</p><h2 id="catalog-title">Seleccionados para vos</h2></div>
        <a href="#comparar" className="text-link">Comparar modelos <ArrowRight size={17} /></a>
      </div>
      <div className="catalog-filters" role="group" aria-label="Filtrar productos">
        {catalogFilters.map((item) => <motion.button
          type="button"
          className={`catalog-filter ${activeFilter === item.id ? 'catalog-filter--active' : ''}`}
          aria-pressed={activeFilter === item.id}
          onClick={() => setActiveFilter(item.id)}
          whileHover={reducedMotion ? undefined : { y: -3, scale: 1.025 }}
          whileTap={reducedMotion ? undefined : { y: 0, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 430, damping: 28 }}
          key={item.id}
        >
          {activeFilter === item.id && <motion.span
            className="catalog-filter__active-bg"
            layoutId="catalog-filter-active"
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
            aria-hidden="true"
          />}
          <span className="catalog-filter__label">{item.label}</span>
        </motion.button>)}
      </div>
      <p className="catalog-filter-status" aria-live="polite">{products.length} {products.length === 1 ? 'producto' : 'productos'} en {filter.label}</p>
      <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} selected={selectedId === product.id} onSelect={onSelect} index={index} reducedMotion={reducedMotion} />)}</div>
    </div>
  </section>;
}

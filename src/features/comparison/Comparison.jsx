import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import AccessiblePicker from '../../components/ui/AccessiblePicker.jsx';
import { compareProducts } from './comparison.js';
import { formatCRC } from '../cart/cart.js';

export default function Comparison({ catalog, onSelect, reducedMotion }) {
  const [firstId, setFirstId] = useState(catalog.products[0]?.id);
  const [secondId, setSecondId] = useState(catalog.products[1]?.id);
  const [expanded, setExpanded] = useState(false);
  const first = catalog.find(firstId) || catalog.products[0];
  const second = catalog.find(secondId) || catalog.products[1];
  const difference = Math.abs(first.priceCRC - second.priceCRC);
  const comparison = compareProducts(first, second);
  const differenceLabel = difference === 0
    ? 'Ambos tienen el mismo precio publicado.'
    : `Diferencia de precio: ₡${new Intl.NumberFormat('es-CR').format(difference).replace(/[\s\u00a0\u202f]/g, '.')}`;

  useEffect(() => setExpanded(false), [firstId, secondId]);

  const compareCard = (product, index, value, onChange) => <motion.article className="compare-card" key={`${index}-${product.id}`} initial={reducedMotion ? false : { opacity: 0, y: 22, scale: 0.985 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.46, delay: reducedMotion ? 0 : index * 0.1, ease: 'easeOut' }}>
    <div className="compare-card__top"><span>0{index + 1} / {index === 0 ? 'TU ELECCIÓN' : 'COMPARAR CON'}</span><span className="compare-card__category">{product.category}</span></div>
    <div className="compare-card__select-wrap"><AccessiblePicker
      label={index === 0 ? 'Primer producto para comparar' : 'Segundo producto para comparar'}
      value={value}
      onChange={onChange}
      options={catalog.products.map((option) => ({ value: option.id, label: option.name, description: option.category }))}
    /></div>
    <div className="compare-card__visual"><img src={product.image} alt={product.imageAlt} width="900" height="900" loading="lazy" decoding="async" /></div>
    <div className="compare-card__info"><p>{product.verifiedFeatures[0]?.label || product.category}</p><div><strong>{product.formattedPrice}</strong><button type="button" onClick={() => onSelect(product.id)} aria-label={`Ver detalles de ${product.name}`}>Ver detalles <ArrowRight size={16} aria-hidden="true" /></button></div></div>
  </motion.article>;

  return <section id="comparar" className="comparison section" aria-labelledby="compare-title"><div className="container">
    <div className="section-heading comparison__heading"><div><p className="eyebrow"><img className="eyebrow__brand-icon" src="/favicon.svg" alt="" aria-hidden="true" />ENCONTRÁ TU MEJOR OPCIÓN</p><h2 id="compare-title">Compará dos modelos y elegí el mejor</h2></div><p>Elegí dos productos y compará sus precios de un vistazo.</p></div>
    <div className="comparison-stage">
      {compareCard(first, 0, firstId, setFirstId)}
      <div className="comparison-stage__versus" aria-hidden="true">VS</div>
      {compareCard(second, 1, secondId, setSecondId)}
    </div>
    <div className={`comparison-summary ${expanded ? 'comparison-summary--expanded' : ''}`}>
      <div className="comparison-summary__overview">
        <span className="comparison-summary__mark"><Check size={18} aria-hidden="true" /></span>
        <div className="comparison-summary__copy">
          <div className="comparison-summary__price"><strong>{differenceLabel}</strong><span>{catalog.products.length} MODELOS PARA EXPLORAR</span></div>
          <p>{comparison.conclusion}</p>
          <p className="comparison-summary__recommendation">{comparison.recommendation.first.replace(':', '')} {comparison.recommendation.second.replace(':', '')}</p>
        </div>
      </div>
      <button
        type="button"
        className="comparison-summary__toggle"
        aria-expanded={expanded}
        aria-controls="comparison-differences"
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? 'Ocultar diferencias' : 'Ver diferencias'}
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {expanded && <motion.div
          id="comparison-differences"
          className="comparison-details"
          initial={reducedMotion ? false : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.25, ease: 'easeInOut' }}
        >
          {comparison.rows.length ? <div className="comparison-table" role="table" aria-label={`Comparación entre ${first.name} y ${second.name}`}>
            <div className="comparison-table__row comparison-table__head" role="row">
              <span role="columnheader">Característica</span>
              <span role="columnheader">{first.name}</span>
              <span role="columnheader">{second.name}</span>
            </div>
            {comparison.rows.map((row) => <div className="comparison-table__row" role="row" key={row.key}>
              <strong role="rowheader">{row.label}</strong>
              <span role="cell" className={row.advantage === 'first' ? 'comparison-table__advantage' : ''}>
                {row.first?.value || 'No especificado'}
                {row.advantage === 'first' && <Check size={14} aria-label="Ventaja verificable" />}
              </span>
              <span role="cell" className={row.advantage === 'second' ? 'comparison-table__advantage' : ''}>
                {row.second?.value || 'No especificado'}
                {row.advantage === 'second' && <Check size={14} aria-label="Ventaja verificable" />}
              </span>
            </div>)}
          </div> : <p className="comparison-details__empty">No hay suficientes especificaciones verificadas para comparar estos productos.</p>}
          <div className="comparison-details__conclusion">
            <p><strong>{first.name}</strong> {comparison.recommendation.first.replace(`${first.name}: `, '')}</p>
            <p><strong>{second.name}</strong> {comparison.recommendation.second.replace(`${second.name}: `, '')}</p>
            <p><strong>Diferencia</strong> {formatCRC(difference)}.</p>
          </div>
          {comparison.matchingRowCount > 0 && <p className="comparison-details__matches">Las diferencias aparecen primero; después se muestran {comparison.matchingRowCount} {comparison.matchingRowCount === 1 ? 'característica compartida' : 'características compartidas'} de las fichas verificadas.</p>}
          {comparison.omittedMatchCount > 0 && <p className="comparison-details__matches">Se omitieron {comparison.omittedMatchCount} coincidencias adicionales para mantener la comparación compacta.</p>}
        </motion.div>}
      </AnimatePresence>
    </div>
  </div></section>;
}

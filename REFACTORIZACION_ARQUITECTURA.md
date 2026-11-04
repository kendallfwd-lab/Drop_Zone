# Refactorización progresiva de la arquitectura React

## Arquitectura final

```text
src/
├─ app/
│  ├─ App.jsx
│  └─ App.test.jsx
├─ components/
│  ├─ common/
│  │  └─ Shared.jsx
│  ├─ layout/
│  │  ├─ Header.jsx
│  │  └─ Footer.jsx
│  └─ ui/
│     └─ AccessiblePicker.jsx
├─ features/
│  ├─ home/Hero.jsx
│  ├─ catalog/
│  │  ├─ Catalog.jsx
│  │  ├─ ProductDetail.jsx
│  │  ├─ catalog.js
│  │  ├─ catalogFilters.js
│  │  └─ iconMap.js
│  ├─ cart/
│  │  ├─ CartDrawer.jsx
│  │  └─ cart.js
│  ├─ comparison/
│  │  ├─ Comparison.jsx
│  │  └─ comparison.js
│  └─ promotions/
│     ├─ PromotionsCarousel.jsx
│     ├─ promotionDefinitions.js
│     └─ promotionMessages.js
├─ data/
├─ styles/
│  ├─ index.css
│  └─ promotions.css
└─ test/
```

## Cambios estructurales

- `App.jsx` quedó como componente de composición: conserva carga de datos, selección por URL, localStorage y coordinación del carrito.
- Navegación, hero, catálogo, detalle, comparador, promociones, carrito y footer viven en módulos separados.
- Las reglas existentes de catálogo, carrito y comparación se conservaron.
- Los filtros ahora usan propiedades derivadas del producto (`brand` y `productType`) en vez de listas de IDs dentro de la interfaz.
- Los precios y mensajes de las promociones AirPods + estuche y combo de estuches están centralizados.
- El bloque CSS de promociones se separó sin cambiar sus selectores ni valores visuales.

## Archivos originales y nuevos

- `src/App.jsx` se convirtió en `src/app/App.jsx` y se redujo a composición.
- Las implementaciones visuales que estaban dentro de ese archivo ahora están en `components/layout`, `components/common` y `features`.
- `src/domain/` ya estaba organizado en `features`; sus módulos `catalog.js`, `cart.js` y `comparison.js` se mantuvieron sin cambiar sus reglas principales.
- `src/data/comparisonSpecs.js` permanece dentro de `features/comparison/` junto con su consumidor.
- `src/styles.css` ya estaba en `src/styles/index.css`; se extrajo adicionalmente `src/styles/promotions.css`.

## Auditoría pendiente

- `public/images/products/` y `public/images/products - copia/` contienen archivos con nombres duplicados. La aplicación referencia únicamente `/images/products/`; la copia no se elimina todavía para evitar perder material de trabajo.
- `@react-three/fiber`, `@react-three/drei`, `three` y `gsap` no tienen referencias en `src` durante esta fase. Se conservan en `package.json` hasta confirmar si forman parte de una iteración futura.

## Migración posterior a TypeScript

1. Convertir primero los módulos puros (`cart.js`, `catalog.js`, `comparison.js`, `promotionMessages.js`) y definir tipos para `Product`, `CartItem`, `PromotionDefinition` y `Settings`.
2. Tipar después los componentes de features y sus props, manteniendo los contratos actuales.
3. Migrar `App.jsx` al final, cuando los tipos de datos y callbacks estén estabilizados.
4. Activar `allowJs` durante la transición y endurecer `strict` de forma gradual.

La rama de trabajo no se publica ni se mezcla con `main` en esta fase.

# Drop_Zone CR

Catálogo editorial de audio y accesorios creado con React 19, JavaScript, Vite, CSS, Motion, Lucide y `json-server`. Incluye comparación visual de dos modelos con diferencia de precio. No procesa compras ni envía mensajes: los enlaces abren WhatsApp con una consulta preparada para que la persona decida si la envía.

## Ejecutar

Requiere Node.js LTS (20 o superior) y npm.

```bash
npm install
```

En una terminal:

```bash
npm run api
```

En otra:

```bash
npm run dev
```

Abrí la URL que indique Vite, normalmente `http://127.0.0.1:5173/`. La API local usa el puerto 3001. Si no está disponible, la página muestra un aviso y utiliza una copia de `db.json` incluida en el build. En una web estática publicada esa copia queda congelada hasta la siguiente compilación; `json-server` no es una base de datos persistente de producción.

## Editar el catálogo

`db.json` concentra precios en colones, productos, orden, descripciones, características, WhatsApp, Instagram, ubicación y enlaces de navegación. Cambiá `priceCRC` como número entero, sin símbolo de moneda. `displayOrder` define el orden. `referenceFeatures` contiene las características del modelo publicadas por Apple y `specSourceUrl` enlaza la ficha oficial. Estas características son una referencia, no una verificación del artículo disponible en la tienda. Confirmá físicamente la versión y sus funciones antes de anunciar especificaciones como propias del inventario.

Las imágenes están en `public/images/products/` y `public/images/hero/`. Sustituí los archivos WebP por fotos autorizadas del artículo real manteniendo el nombre, o actualizá las rutas de cada producto en `db.json`. Para optimizar imágenes PNG nuevas, guardalas en esas carpetas y ejecutá `npm run optimize:images`.

Los datos de WhatsApp e Instagram están en `settings` de `db.json`. Si cambian los datos de la empresa, actualizá también el JSON-LD de `index.html`.

## Verificar

```bash
npm run test
npm run build
```

La API responde en `http://127.0.0.1:3001/products` y `http://127.0.0.1:3001/settings`. Las pruebas cubren validación de productos, orden, precio CRC, enlace WhatsApp, selección, pestañas y estado de respaldo. El diseño fue inspeccionado en navegador a 1440, 390 y 320 px.

## Datos comerciales pendientes

Las imágenes actuales son **ilustraciones originales generadas para esta demo**, no fotos del inventario real. Faltan por confirmar generación exacta del Apple Pencil, versión y color de AirPods Max, funciones técnicas del artículo ofrecido, compatibilidad, contenido de cada caja, disponibilidad, estado y cualquier garantía. La web no afirma autorización comercial de Apple.

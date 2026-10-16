# Dirección visual

La página interpreta la referencia proporcionada con una composición editorial propia: fondo blanco perla, hero dividido entre mensaje y producto, catálogo de seis tarjetas, ficha de dos mitades y cierre de contacto. Se conserva la marca Drop_Zone CR y se usan los datos comerciales del master prompt. La página de Apple se consultó como referencia de ritmo, escala y espacio en blanco; no se copiaron textos, imágenes ni código.

## Sistema de diseño

- Tipografía: Inter local con pesos 400, 500, 600, 700 y 800; titulares compactos con tracking negativo.
- Colores: `#fbfcfe` para fondo, `#10151f` para texto, `#1662eb` para enlaces y precios, `#0d9e49` solo para WhatsApp.
- Contenedor: 1280 px máximo y margen lateral adaptable de 20 a 72 px.
- Radios: 18 px en tarjetas y 26 px en el panel principal; botones redondeados.
- Espaciado: secciones de 62 a 104 px y separación amplia entre hero, catálogo y detalle.
- Movimiento: entradas breves y fundido al seleccionar producto; `prefers-reduced-motion` reduce efectos.

## Recursos

El hero y las seis imágenes de catálogo son **renders ilustrativos originales generados con IA para este proyecto** y optimizados en WebP. No son fotografías exactas de las unidades vendidas. Los iconos provienen de `lucide-react`; las formas ambientales son CSS. La referencia adjunta se usó para dirección de arte, nunca como fondo de la web. Los archivos originales PNG se omiten del proyecto final para reducir peso.

## Componentes

`Header` y `Footer` resuelven navegación y contacto. `Hero` presenta el mensaje principal. `Catalog` y `ProductCard` permiten seleccionar un producto. `ProductDetail` muestra imagen, características oficiales del modelo de referencia, fuente enlazada y precio mediante pestañas accesibles. `Comparison` permite elegir dos de los seis productos y ver imágenes, tipo de producto, precios y diferencia de precio en un panel editorial. Las clases `Product`, `ProductCatalog` y `ProductService` gobiernan validación, formato, orden y acceso a la API.

## Responsive y diferencias con la referencia

Seis tarjetas comparten fila desde 1280 px; pasan a tres columnas en tabletas y dos en móvil. El hero se apila antes de 768 px, y el panel editorial se convierte en una columna. La referencia es un mockup horizontal; esta versión da más altura a textos y controles táctiles y añade comparación porque el encargo la solicita. Las características publicadas proceden de las fichas oficiales de Apple y están rotuladas como referencia del modelo; la versión y las funciones del artículo disponible deben confirmarse con la tienda.

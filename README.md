# Alacon Formación — Landing "Prueba tu suerte"

Landing page promocional de fidelización para alumnos de [Alacon Formación](https://alaconformacion.es), con un rasca y gana interactivo hecho en Canvas puro (sin librerías externas).

## Demo

Abre `index.html` en cualquier navegador moderno, o publícalo en cualquier hosting estático (GitHub Pages, Hostinger, Netlify, Vercel...).

## Características

- **Rasca y gana en Canvas**: el logo del centro cubre el premio; se revela al pasar el ratón (o el dedo en móvil) por encima, sin necesidad de hacer clic. Al completarse, salta un efecto de confeti en los colores de la marca.
- **Premio siempre proporcional**: cada importe ganado (300 / 400 / 500 / 600 €) es válido para formaciones de más del doble de ese valor. La lógica vive en `PRIZES` dentro de `script.js`.
- **Persistencia de premio (lista para activar)**: `getOrAssignPrize()` y `maybeResetPrizeFromUrl()` permiten fijar el mismo premio por navegador vía `localStorage`, con un modo de reseteo administrativo (`?reset=1` en la URL). Actualmente `initScratchCard()` usa `pickRandomPrize()` directamente; para activar la persistencia, cambia esa llamada por `getOrAssignPrize()`.
- **Hero a dos columnas en escritorio**: texto y tarjeta del rasca y gana lado a lado a partir de 860px de ancho; apilados en móvil.
- **Tipografía editorial**: Instrument Serif (con cursivas para cifras y acentos) combinada con Instrument Sans, su pareja diseñada por la misma fundición.
- **Cómo funciona**: sección de 3 pasos numerados explicando el proceso completo de la promoción.
- **Testimonio real**: cita de una alumna, parafraseada a partir de una reseña real del centro.
- **Cursos destacados**: 3 tarjetas con cursos reales y sus precios, enlazando a la web principal.
- **Sellos de confianza**: logos reales del SEPE y FUNDAE con los códigos de registro del centro.
- **Scroll interactivo**: barra de progreso de lectura, menú flotante que aparece al bajar, parallax suave en el header, contadores animados y aparición progresiva ("scroll reveal") de las secciones mediante `IntersectionObserver`.
- **Botón flotante de WhatsApp** visible en toda la página.
- **SEO y redes sociales**: favicon completo (incluye Apple touch icon) y metaetiquetas Open Graph / Twitter Card con imagen de vista previa propia (`og-image.jpg`) para que el enlace se vea bien al compartirlo.
- **Cookies y analítica opcional**: banner de consentimiento que solo activa Google Analytics 4 si el visitante acepta. Registra dos eventos de conversión: `prize_revealed` (al completar el rasca y gana) y `whatsapp_click`.
- **Enlaces legales**: aviso legal, privacidad y cookies enlazados en el footer.
- **100% responsive**: probado desde 360px de ancho hasta escritorio.
- **Accesible**: respeta `prefers-reduced-motion`, contraste de texto en fondos de color, `alt` en imágenes, foco visible en enlaces y botones.
- **Sin dependencias ni build step**: HTML, CSS y JS planos. Solo carga las tipografías desde Google Fonts.

## Estructura del proyecto

.

├── index.html

├── styles.css

├── script.js

├── img/

│   ├── logo.png              # Logo del centro (máscara del rasca y gana)

│   ├── logo-sepe.png          # Logo del SEPE (sello de confianza)

│   ├── logo-fundae.png        # Logo de FUNDAE (sello de confianza)

│   ├── og-image.jpg           # Imagen de vista previa al compartir el enlace

│   ├── favicon.ico

│   ├── favicon-16.png

│   ├── favicon-32.png

│   ├── favicon-48.png

│   ├── favicon-180.png        # Apple touch icon

│   ├── favicon-192.png

│   └── favicon-512.png

├── LICENSE

└── README.md

## Cómo editar el contenido

- **Premios y condiciones**: edita el array `PRIZES` al principio de `script.js`.
- **Textos, estadísticas, cursos y contacto**: todo está directamente en `index.html`, sin plantillas ni datos externos.
- **Colores**: definidos como variables CSS al principio de `styles.css` (`--blue`, `--blue-deep`, `--blue-logo`, `--gold`, etc).
- **Analítica**: sustituye `G-XXXXXXXXXX` en `index.html` por tu ID de medición real de Google Analytics 4 (Administrar → Flujos de datos → tu web, en [analytics.google.com](https://analytics.google.com)). Mientras el ID no se cambie, el script de analítica no se activa aunque se acepten las cookies.
- **URLs de Open Graph**: antes de publicar, actualiza `og:image`, `og:url` y `twitter:image` en `index.html` con el dominio real donde vaya a vivir la landing (ahora mismo tienen `https://oferta.alaconformacion.es/` como marcador de posición).

## Despliegue

Al ser un sitio estático, puedes subir toda la carpeta (`index.html`, `styles.css`, `script.js`, `img/`) a cualquier hosting, manteniendo la estructura de subcarpetas:

- **GitHub Pages**: activa Pages en la configuración del repositorio, apuntando a la rama `main` y a la carpeta raíz.
- **Hostinger / cualquier hosting compartido**: sube estos archivos juntos, en la misma carpeta y con la misma estructura, vía el administrador de archivos o FTP. Recomendado: usar un subdominio (por ejemplo `oferta.alaconformacion.es`) para no afectar a la web principal.

No requiere backend, base de datos ni proceso de compilación.

## Licencia

MIT — consulta el archivo [LICENSE](./LICENSE).
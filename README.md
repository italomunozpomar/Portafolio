# Portafolio de Ítalo Muñoz Pomar

[Sitio web](https://italomunozpomar.github.io/Portafolio/) · [Repositorio público](https://github.com/italomunozpomar/Portafolio)

Portafolio estático en español: seis casos profesionales, cuatro proyectos públicos y una experiencia visual que conecta producto, infraestructura e IA. HTML, CSS, SVG, Canvas y JavaScript con GSAP local; sin backend ni build.

## Archivos de publicación

Copiar **solo** este conjunto a la raíz de un repositorio público de GitHub Pages:

```text
index.html
styles.css
script.js
.nojekyll
assets/
  favicon.svg
  social-preview.svg
  social-preview.png
  fonts/
    manrope.ttf
    OFL.txt
  vendor/
    gsap.min.js
    ScrollTrigger.min.js
    NOTICE.txt
```

Este README puede acompañar el repositorio. `docs/`, `tasks/`, `.research/` y `.superpowers/` no forman parte del sitio. `.research/` contiene fuentes de trabajo privadas y queda excluida de Git; no publicar el directorio de trabajo completo.

## Vista previa

Abrir `index.html` permite ver el sitio directamente. Para probarlo por HTTP, copiar los archivos públicos a una carpeta dedicada y servir esa carpeta. En PowerShell, desde este proyecto:

```powershell
New-Item -ItemType Directory -Force .research/preview-public | Out-Null
Copy-Item -LiteralPath index.html,styles.css,script.js,.nojekyll -Destination .research/preview-public -Force
Copy-Item -LiteralPath assets -Destination .research/preview-public -Recurse -Force
python -m http.server 4173 --bind 127.0.0.1 --directory .research/preview-public
```

El comando HTTP requiere una instalación local de Python. Abrir `http://127.0.0.1:4173/` y detener con Ctrl+C. El servidor usado durante la entrega ya está disponible en `http://127.0.0.1:4173/Portafolio/`; es una herramienta local de revisión, no parte del frontend.

## GitHub Pages

El repositorio `italomunozpomar/Portafolio` publica desde la rama **main** y **/ (root)**. Los cambios enviados a esa rama activan la publicación de GitHub Pages.

Para actualizar desde este directorio de trabajo, copiar exclusivamente los archivos de publicación al checkout de publicación `.research/publish-github`, revisarlos, guardarlos en Git y subirlos a `main`.

Estos pasos siguen la [documentación oficial de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Las rutas relativas permiten servir el portafolio tanto en la raíz como bajo un nombre de repositorio, por ejemplo `/Portafolio/`. No requiere configurar variables de entorno.

El título, la descripción, la URL canónica y la imagen para compartir están configurados para `https://italomunozpomar.github.io/Portafolio/`. `og:image` utiliza la URL absoluta del PNG de 1200 × 630 px. Si cambia el dominio, actualizar esas etiquetas en `index.html`.

## Editar contenido y diseño

- `index.html`: presentación, casos, proyectos, formación y contacto. Todo el contenido existe sin JavaScript.
- `styles.css`: paleta, Manrope local, composición, adaptación móvil y estados de foco/movimiento.
- `script.js`: escultura 3D original en Canvas, sus tres geometrías, cambio de capítulos, animaciones GSAP/ScrollTrigger y control de pausa. Los destinos y sus descripciones están en `tracks`.
- `assets/`: marca y gráfico originales, fuente local y licencia SIL OFL. `vendor/` conserva GSAP y ScrollTrigger 3.15.0 sin modificaciones, con sus avisos originales y referencia a la licencia oficial.

Los niveles de DevOps/Full Stack semi senior e IA junior reflejan el posicionamiento solicitado. Los casos distinguen funcionalidades productivas, cambios en desarrollo y demos. El perfil describe formación y certificados sin afirmar una titulación no confirmada.

## Experiencia visual

La apertura combina tipografía grande con una escultura tridimensional original que gira, responde al cursor y cambia de geometría al elegir Producto, Infraestructura o IA. El scroll conserva el desplazamiento nativo: anima capas, cambia el sistema por capítulos y desplaza una franja tipográfica. Los proyectos tienen ilustraciones conceptuales originales; no son capturas de interfaces de clientes.

El botón Pausar detiene la escultura, las secuencias GSAP y los bucles decorativos. La preferencia del sistema `prefers-reduced-motion` tiene prioridad y presenta el contenido sin animaciones. Sin JavaScript, los textos, enlaces y detalles nativos siguen disponibles, con una ilustración SVG de respaldo.

GSAP y ScrollTrigger se sirven desde `assets/vendor/`, sin CDN ni peticiones externas. Ver la [licencia oficial de GSAP](https://gsap.com/standard-license/). No es necesario instalar paquetes para publicar o usar el portafolio.

## Verificación de esta entrega

La entrega se verifica en el navegador de Codex en escritorio y móvil, con selección de las tres áreas, anclas, detalles y pausa/reanudación por teclado. La pausa también se comprueba comparando capturas separadas en el tiempo. Se prueban fuentes y scripts bloqueados por CSP y texto al 200% mediante la fuente raíz.

La preferencia de movimiento del sistema se revisa en código; la herramienta de prueba no ofrece emulación de esa preferencia. El botón de pausa sí se prueba en el navegador real. No se afirma una auditoría exhaustiva con lector de pantalla ni pruebas en dispositivos físicos.

El sitio no solicita datos de ClickUp, Bitbucket, Drive ni servicios de analítica. El Canvas deja de dibujar fuera de pantalla o con la pestaña oculta, limita la densidad de píxeles y utiliza una malla menor en móvil. Los enlaces externos admiten la apertura normal del navegador en otra pestaña.

El repositorio público contiene exclusivamente el sitio y este README. El historial de investigación y los archivos locales permanecen en este directorio de trabajo.

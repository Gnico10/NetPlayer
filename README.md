## NetPlayer Bookmarklet

Controles personalizados para el reproductor de video (pensado para Netflix).

### Por qué no usar un script externo

Sitios como Netflix aplican **Content Security Policy (CSP)** y bloquean `<script src="...">` y `<link href="...">` de otros dominios. En DevTools puede aparecer **CORB** u otros avisos, pero el fallo real es que el navegador no permite cargar recursos externos en esa página.

**Solución:** usar el bookmarklet autocontenido que inyecta CSS y JS inline (sin peticiones cross-origin).

### Crear el bookmarklet

1. Genera el bookmarklet:

```bash
node scripts/build-bookmarklet.mjs
```

2. Copia el contenido de `dist/bookmarklet.txt` como URL del marcador.

3. Abre Netflix (u otra página con `<video>`), haz clic en el marcador y listo.

### Cómo funciona

- El bookmarklet inyecta `styles/netplayer.css` como `<style>`.
- Luego inyecta, en orden: `config.js` → `icons.js` → `adapters/netflix.js` → `netplayer.js`.
- La UI aparece sobre el `<video>` de la página.

### Desarrollo

Edita los archivos en `logic/` y `styles/`, vuelve a ejecutar el build y actualiza el marcador.

`logic/loader.js` sigue disponible para hostear el proyecto en un servidor propio (páginas sin CSP estricta), pero **no funciona en Netflix**.

### Estructura

```
logic/
  config.js              # Constantes y selectores
  icons.js               # Iconos SVG (window.NetPlayerIcons)
  adapters/
    netflix.js           # keySim, seek, navegación, fullscreen
  netplayer.js           # UI, controles y destroy()
  loader.js              # Carga remota legacy (solo sitios sin CSP)
styles/
  netplayer.css
scripts/
  build-bookmarklet.mjs
dist/
  bookmarklet.txt        # URL lista para el marcador
  bookmarklet.js         # Código bootstrap legible
```

### Notas

- Al cerrar el panel se ejecuta `destroy()`: elimina listeners, timers y nodos del DOM.
- La navegación prev/next solo aparece si hay patrón `/watch/{id}` o botones nativos detectables.
- El seek en la barra simula flechas de 10 s (máx. 60 pulsaciones), igual que el reproductor nativo de Netflix.

# AgroSense actualizado

## Qué incluye
- Tres sectores de ejemplo y posibilidad de agregar sectores.
- Umbral mínimo de humedad configurable por sector.
- Alertas visuales cuando una lectura cae bajo el umbral.
- Simulación de nuevas lecturas y de riego.
- Solicitud de permiso para notificaciones de prueba.
- Manifest y service worker para instalación tipo PWA y caché básica.

**Importante:** las lecturas son simuladas y se guardan en el navegador de este dispositivo. No hay conexión con sensores reales ni sincronización entre dispositivos.

## Cómo probar en el computador
1. Descomprime el ZIP.
2. Abre la carpeta `web` en Visual Studio Code.
3. Ejecuta `index.html` con Live Server.
4. Pulsa "Simular nuevas lecturas" para probar cambios y alertas.

## Cómo actualizar tu GitHub Pages
1. Entra a tu repositorio `AgroSense` en GitHub.
2. Abre la carpeta raíz donde actualmente están `index.html`, `app.js` y `styles.css`.
3. Sube los archivos de esta carpeta `web` y acepta reemplazar los existentes.
4. Verifica que también queden `manifest.webmanifest`, `sw.js` e `icon.svg` en la raíz del repositorio.
5. Espera a que GitHub Pages publique los cambios.
6. En el iPhone, cierra AgroSense y vuelve a abrirla desde su icono. Si ves la versión anterior, cierra Safari y vuelve a cargar el sitio.

## Notificaciones en iPhone: alcance de esta versión
El botón "Activar avisos de prueba" solicita permiso y puede mostrar notificaciones locales de prueba mientras la página está activa. **No implementa notificaciones push reales con la app cerrada.**

Para push en segundo plano falta:
- Un proveedor push y configuración de suscripción.
- Un backend seguro que reciba eventos y envíe mensajes push.
- Una fuente de datos permanente. Para datos reales, el ESP32 deberá enviar las lecturas a ese backend por Wi-Fi o mediante una pasarela.

No publiques claves privadas ni credenciales de servidor en GitHub. La configuración de Firebase u otro proveedor debe hacerse con credenciales apropiadas y funciones de servidor.

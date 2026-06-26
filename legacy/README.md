# Gaze MVP - Heatmap sobre vídeo

Esta es una demostración de seguimiento ocular (eye-tracking) en el navegador usando WebGazer.js. La demo reproduce un vídeo vertical de stock y genera un mapa de calor (heatmap) basado en dónde mira el usuario dentro del vídeo, además de calcular una métrica simple del porcentaje de miradas en la mitad superior frente a la mitad inferior.

## Requisitos

- **Navegador**: Google Chrome (recomendado para escritorio).
- **Hardware**: Webcam funcional.
- **Servidor Web Local**: Debe servirse por HTTP/HTTPS. La cámara web no funcionará correctamente abriendo el archivo con `file://`.

## Instalación y Configuración

1. **Clonar o descargar** este repositorio.
2. **Obtener un vídeo**: 
   - Descarga un vídeo vertical de stock (ratio 9:16) libre de derechos de sitios como [Pexels](https://www.pexels.com/) o [Mixkit](https://mixkit.co/).
   - Guarda el archivo de vídeo en la misma carpeta que `index.html` y nómbralo exactamente `video.mp4`.
   - *Nota: Si no incluyes el vídeo, la aplicación seguirá funcionando mostrando un fondo de color y un mensaje.*
3. **Iniciar un servidor local**:
   Abre una terminal en la carpeta del proyecto y ejecuta:
   ```bash
   python -m http.server 8000
   ```
   *(Requiere Python instalado).*
4. **Abrir en el navegador**:
   Ve a [http://localhost:8000](http://localhost:8000).

## Instrucciones de Uso

1. **Permitir Cámara**: Al abrir la página, es posible que el navegador te pida permiso para usar la cámara. Acéptalo.
2. **Calibrar**: 
   - Haz clic en el botón "Calibrar".
   - Aparecerán 9 puntos en la pantalla.
   - **Míralos fijamente y haz clic 5 veces en cada uno de ellos.**
   - Una vez completados los 9 puntos, la calibración habrá finalizado. Trata de mantener la cabeza quieta y la iluminación constante.
3. **Empezar a Medir**: 
   - Haz clic en "Empezar a medir" y mira el vídeo.
   - Verás cómo se dibuja un mapa de calor rojo sobre las zonas del vídeo que estás mirando.
4. **Métricas**:
   - Observa en tiempo real el panel de métricas para ver el porcentaje de miradas que caen en la mitad superior frente a la mitad inferior del vídeo.
5. **Limpiar**:
   - Usa "Limpiar heatmap" para reiniciar el dibujo y las métricas.

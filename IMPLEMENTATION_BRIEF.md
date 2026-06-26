# Brief de implementación — MVP "Gaze Heatmap sobre vídeo"

> Instrucciones para una IA de desarrollo. Ejecuta en orden. No amplíes el alcance.
> Tiempo objetivo: ~1 hora. Entregable: una demo web que funciona de principio a fin.

## 0. Objetivo y alcance (LEER PRIMERO)

Construir una demo **en navegador** que:
1. Accede a la webcam.
2. Estima la mirada del usuario con **WebGazer.js** (NO entrenar ningún modelo).
3. Reproduce un vídeo vertical de stock dentro de un contenedor fijo.
4. Acumula los puntos de mirada que caen dentro del vídeo y los pinta como **heatmap**.
5. Calcula una métrica simple: % de mirada en mitad superior vs inferior del vídeo.

### Fuera de alcance — NO implementar
- Sin backend, sin base de datos, sin autenticación, sin pagos.
- Sin integración con TikTok / Reels / YouTube reales (solo vídeo local de stock).
- Sin móvil (solo Chrome de escritorio).
- Sin entrenamiento de modelos ni datasets de gaze.
- Sin consentimiento RGPD / cookies (es una demo local, se menciona como roadmap, no se codifica).

Si una tarea no está en este brief, NO la hagas. Pregunta o déjala como TODO comentado.

## 1. Stack y restricciones técnicas

- **Una sola página**: `index.html` con CSS y JS inline. Sin build, sin npm, sin frameworks.
- **WebGazer.js** vía CDN: `https://webgazer.cs.brown.edu/webgazer.js`.
- Render del heatmap con **Canvas 2D** (no librerías externas).
- **Debe servirse por HTTP** (la webcam no funciona con `file://`). Incluir instrucción de `python3 -m http.server`.
- Probar en **Chrome**. Permiso de cámara obligatorio.

## 2. Estructura de archivos

```
gaze-mvp/
├── index.html      ← toda la app
├── video.mp4       ← vídeo vertical de stock (descargar de Pexels/Mixkit, CC/libre)
└── README.md       ← cómo arrancar
```

Si no hay `video.mp4`, el código debe degradar con elegancia: mostrar un fondo de color y un texto "coloca video.mp4", no romperse.

## 3. Especificación de la UI

- Contenedor `#stage` de **360×640 px** (ratio 9:16), fondo negro, esquinas redondeadas.
- Dentro: `<video>` (loop, muted, playsinline, object-fit:cover) + `<canvas id="heat">` transparente superpuesto (pointer-events:none).
- Barra de botones: **Calibrar**, **Empezar a medir** (deshabilitado hasta calibrar), **Limpiar heatmap**.
- Línea de estado de texto que va informando ("Calibrando…", "Midiendo…", etc.).
- Panel de métrica: muestra "% mirada arriba / % abajo" actualizándose.
- Ocultar el preview de webcam de WebGazer (opacity 0) salvo un modo debug.

## 4. Lógica — implementar en este orden

### 4.1 Inicializar WebGazer
- `setRegression('ridge')`, `setGazeListener(cb)`, `.begin()`.
- `showVideoPreview(false)`, `showPredictionPoints(false)`.
- El listener recibe `{x, y}` en **coordenadas de pantalla**.

### 4.2 Calibración (CRÍTICO para que la precisión no sea basura)
- Overlay a pantalla completa con **9 puntos** en rejilla (15/50/85 % en X e Y).
- Cada punto requiere **5 clics** (el usuario mira el punto y clica).
- Al completar los 9, cerrar overlay y habilitar "Empezar a medir".
- WebGazer aprende de los clics automáticamente; no hace falta lógica extra de entrenamiento.

### 4.3 Captura de mirada → coordenadas del vídeo
En el listener, solo si `measuring === true`:
1. Convertir `{x,y}` de pantalla a coords relativas a `#stage` usando `getBoundingClientRect()`.
2. Descartar si cae fuera del rectángulo (mirada fuera del vídeo).
3. Normalizar al tamaño del canvas y guardar en un array `points[]`.

> Concepto clave a preservar: como controlamos el reproductor, conocemos el rectángulo del
> vídeo en todo momento, así que mapear mirada→zona-del-vídeo es una transformación de
> coordenadas. (No hace falta nada más sofisticado para el MVP.)

### 4.4 Render del heatmap
- Loop con `requestAnimationFrame`.
- Por cada punto: `radialGradient` rojo semitransparente (alpha bajo ~0.18) radio ~26 px.
- La superposición de muchos puntos crea la sensación de "zonas calientes".
- "Limpiar heatmap" vacía `points[]`.

### 4.5 Métrica simple (el "dato vendible" de la demo)
- Contar puntos con `y < canvas.height/2` (arriba) vs resto (abajo).
- Mostrar porcentajes en el panel de métrica, actualizado cada ~500 ms.

## 5. Criterios de aceptación (la demo está "lista" si…)

- [ ] Al pulsar Calibrar, el navegador pide cámara y aparecen los 9 puntos.
- [ ] Tras 5 clics por punto, se habilita "Empezar a medir".
- [ ] Al medir y mirar el vídeo, aparecen manchas rojas donde miras.
- [ ] Las manchas caen aproximadamente donde está la mirada (tras buena calibración).
- [ ] El panel muestra un reparto arriba/abajo coherente.
- [ ] "Limpiar heatmap" borra las manchas.
- [ ] Funciona servido por HTTP en Chrome de principio a fin sin errores en consola.

## 6. Plan de tiempo sugerido (60 min)

| Min | Tarea |
|-----|-------|
| 0–5   | Estructura de archivos + esqueleto HTML/CSS del `#stage` y botones |
| 5–10  | Descargar/colocar `video.mp4` vertical de stock libre |
| 10–25 | Integrar WebGazer + listener + estado measuring |
| 25–40 | Calibración de 9 puntos × 5 clics |
| 40–50 | Captura→coords del vídeo + render de heatmap |
| 50–55 | Métrica arriba/abajo + panel |
| 55–60 | Prueba E2E en Chrome, arreglar errores de consola, escribir README |

## 7. Riesgos conocidos y mitigaciones

- **Precisión baja de WebGazer**: es esperado; la demo enseña el *concepto*. Mitigar con buena calibración.
- **Cámara no carga**: casi siempre es por usar `file://`. Servir por HTTP.
- **Mirada descentrada**: recalibrar; pedir al usuario que no mueva la cabeza.
- **Plan B para la presentación**: grabar la pantalla cuando funcione una vez, por si falla el permiso en directo.

## 8. README.md a generar

Incluir: requisitos (Chrome, webcam), cómo conseguir `video.mp4`, comando
`python3 -m http.server 8000`, URL `http://localhost:8000`, y los 4 pasos de uso
(Calibrar → clicar 9 puntos → Empezar a medir → mirar el vídeo).

## 9. Extensiones SOLO si sobra tiempo (en este orden, como TODO si no da tiempo)

1. Etiqueta manual del vídeo ("rostro arriba, texto centro") mostrada junto al heatmap → ilustra la capa de metadatos.
2. Exportar `points[]` a JSON (botón "descargar datos") → ilustra el producto de datos.
3. Modo debug que muestra el preview de la webcam y los prediction points.

> Nota de roadmap (no implementar): producto real = consentimiento RGPD para datos biométricos,
> modelo de gaze propio entrenado con datos de los usuarios, fuente de vídeo con licencia
> comercial, y backend para agregar heatmaps entre usuarios.

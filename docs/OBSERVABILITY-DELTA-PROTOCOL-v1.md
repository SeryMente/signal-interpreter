# Protocolo de delta semántico de observabilidad

**Schema:** \`signal-interpreter-platform-delta/v1\`  
**Aplicación:** Signal Interpreter — ciclos de desarrollo

## 1. Propósito

El paquete de observabilidad no se considera solamente un archivo histórico. Debe producir conocimiento nuevo de manera acumulativa.

Para cada superficie observable de Cloud Interpreter se conserva la última observación conocida y, cuando la superficie cambia, se genera un delta semántico.

El delta responde:

**¿Qué cambió desde la última superficie conocida de esta misma identidad de página?**

## 2. Identidad de superficie

La identidad se construye a partir de:

\`origin | route/path normalizado | query keys normalizadas\`

Los valores de query parameters no se almacenan como parte de la identidad.

Esto permite distinguir, por ejemplo:

- una ruta de estadísticas;
- una ruta de llamadas;
- una misma ruta que utiliza conjuntos distintos de parámetros;

sin almacenar valores potencialmente sensibles.

## 3. Tipos de delta

### initial

Primera observación conocida de una identidad.

Sirve para establecer el baseline estructural.

### changed

Existe una observación anterior y se detectaron diferencias.

El delta puede contener:

- elementos DOM agregados;
- elementos DOM eliminados;
- atributos o estados modificados;
- hojas CSS nuevas/eliminadas/modificadas;
- scripts nuevos/eliminados/modificados;
- recursos nuevos;
- cambios de framework hints;
- cambios de controles, enlaces o campos;
- cambios de metadata o información estructural de página.

### unchanged

La superficie actual no contiene diferencias respecto del baseline.

No es necesario persistir un archivo de delta para este caso.

## 4. Regla de evidencia

Cada delta contiene:

- identidad;
- snapshot anterior;
- snapshot nuevo;
- hash anterior;
- hash nuevo;
- timestamp;
- clasificación;
- resumen cuantitativo;
- cambios estructurales.

El delta no declara causalidad. Un cambio observado es evidencia de cambio, no prueba automática de por qué ocurrió.

## 5. Límites

El motor limita el número de diferencias almacenadas por delta para evitar que una mutación masiva genere archivos ilimitados.

Cuando se alcanza el límite se marca:

\`truncated: true\`

La superficie completa sigue disponible en el snapshot correspondiente.

## 6. Historial

La arquitectura mantiene:

\`observations/platform-snapshots/YYYY-MM-DD/\`

para evidencia de superficies, y:

\`observations/platform-deltas/YYYY-MM-DD/\`

para diferencias semánticas.

\`observations/platform-index.json\` conserva el índice de las últimas superficies conocidas por identidad.

\`observations/platform-latest.json\` ofrece un resumen consumible rápidamente por el siguiente ciclo.

## 7. Protocolo obligatorio de cada ciclo

Al iniciar un nuevo ciclo de desarrollo:

1. Leer \`observations/manifest.json\`.
2. Leer \`observations/platform-index.json\`.
3. Leer \`observations/platform-latest.json\`.
4. Identificar la última observación conocida del área funcional relevante.
5. Inspeccionar los deltas nuevos desde la última versión/estado procesado.
6. Separar:
   - novedades;
   - cambios;
   - anomalías;
   - oportunidades;
   - huecos.
7. Determinar qué novedades son técnicamente accionables.
8. Incorporar ese conocimiento a la estrategia del ciclo.
9. Registrar el resultado de la explotación del conocimiento cuando corresponda.

## 8. Diferencia entre desconocido y ausencia

No encontrar una señal no significa que la señal no exista.

Los estados válidos para conocimiento son:

- \`observed\`: observado directamente;
- \`inferred\`: inferido desde observaciones;
- \`hypothesis\`: hipótesis pendiente de evidencia;
- \`unknown\`: no observado o no determinable;
- \`not-applicable\`: fuera del alcance de la superficie.

Esta distinción es obligatoria en análisis posteriores.

## 9. Regla de aprendizaje incremental

El objetivo no es almacenar indefinidamente copias idénticas.

El sistema debe favorecer:

**baseline → cambio → delta → nuevo baseline**

manteniendo los snapshots históricos necesarios para poder reconstruir la evolución.

Una misma estructura observada repetidamente no debe interpretarse como conocimiento nuevo; un recurso, control, ruta, estado o transición nunca visto sí debe elevarse como novedad.

## 10. Relación con la telemetría operacional

El delta de plataforma debe poder correlacionarse con los eventos de Signal Interpreter por:

- timestamp;
- \`tabId\`;
- ruta;
- sesión;
- secuencia;
- \`traceId\` cuando exista.

Esto permite responder preguntas del tipo:

> ¿Qué cambió en Cloud Interpreter inmediatamente antes de que Auto-Answer dejara de funcionar?

y:

> ¿Qué nueva estructura apareció después de una modificación de la plataforma?

## 11. Criterio de utilidad

Un delta es útil para desarrollo cuando permite hacer al menos una de estas cosas:

- explicar un fallo;
- identificar una regresión;
- descubrir una nueva ruta o estado;
- detectar una modificación de UI;
- detectar un cambio de recursos;
- mejorar un selector;
- mejorar una máquina de estados;
- diseñar una nueva prueba;
- o reducir una incertidumbre relevante.


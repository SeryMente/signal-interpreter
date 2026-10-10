# Especificación del paquete de observabilidad v1

## 1. Propósito

El paquete de observabilidad es el artefacto persistente que conecta la operación de Signal Interpreter con el ciclo de desarrollo siguiente.

Debe contener evidencia operacional y conocimiento incremental de la superficie observable de Cloud Interpreter.

## 2. Directorio canónico

\`observations/\`

- \`inbox/\`: batches recibidos directamente desde la extensión mediante GitHub API.
- \`batches/\`: batches originales saneados y publicados.
- \`platform-snapshots/YYYY-MM-DD/\`: snapshots de superficies observadas.
- \`platform-deltas/YYYY-MM-DD/\`: diferencias semánticas entre snapshots.
- \`platform-index.json\`: índice de última superficie por identidad.
- \`platform-latest.json\`: resumen rápido de conocimiento de plataforma.
- \`manifest.json\`: índice del paquete.
- \`health/github-build.json\`: estado del build remoto que transforma el inbox.

- `call-reports/index.json` y `call-reports/YYYY-MM-DD/`: informes por llamada con referencia opaca, estado de completitud y cobertura.
- `latest/latest-call-report.json` y `latest/latest-call-report.md`: último informe estructurado y resumen legible para reanudar desarrollo.

## 3. Manifest

Schema:

\`signal-interpreter-observability-package/v1\`

Campos mínimos:

| Campo | Significado |
|---|---|
| generatedAt | momento de generación del índice |
| lastBatchId | último batch operacional |
| lastSequence | última secuencia conocida |
| extensionVersion | versión de Signal Interpreter |
| eventCount | eventos contenidos en el último batch |
| platform.observations | número de superficies estructuralmente nuevas |
| platform.deltas | número de deltas generados |
| platform.identities | número de identidades de plataforma conocidas |

## 4. Batch

Schema:

\`signal-interpreter-observation-batch/v1\`

Todo evento operacional puede conservar:

- schema;
- id;
- sequence;
- timestamp;
- ingestedAt;
- level;
- category;
- component;
- phase;
- action;
- outcome;
- traceId;
- operationId;
- parentEventId;
- attempt;
- durationMs;
- tabId;
- extensionVersion;
- host;
- url;
- session;
- environment;
- expected;
- observed;
- reasonCode;
- error;
- metrics;
- context;
- privacy;
- payload.

## 5. Platform surface

Schema:

\`signal-interpreter-platform-surface/v1\`

La superficie describe únicamente lo observable desde el cliente.

### page

- origin;
- URL normalizada;
- path;
- route;
- searchKeys;
- hashPresent;
- title sanitizado;
- language;
- charset;
- readyState;
- visibility;
- nodeCount;
- viewport.

### dom

- tagCounts;
- elementos estructurales limitados;
- selector estructural;
- tag;
- atributos permitidos;
- clases;
- fingerprint de texto;
- visibilidad;
- estado disabled;
- geometría limitada;
- perfil de estilos computados acotado;
- fingerprint de texto estructural.

### controls

- botones;
- enlaces;
- campos;
- headings.

### css
- inlineStyles: longitud y fingerprint de bloques `<style>`; no se almacena su fuente.


- stylesheets;
- URL;
- media;
- owner;
- ruleCount;
- selectorCount;
- atRuleCount;
- muestra limitada de selectors;
- posibilidad de lectura desde mismo origen.

No se almacena CSS fuente completo.

### javascript

- scripts;
- URL;
- type;
- async/defer/noModule;
- presencia de integrity;
- longitud de inline script;
- fingerprint de inline script.

No se almacena código JavaScript fuente completo.

### resources

- URL normalizada;
- initiatorType;
- duración;
- tamaños;
- protocolo.

### frameworkHints

Indicadores heurísticos de frameworks o bundlers visibles.

## 6. Privacy contract

No forman parte del paquete:

- cookies;
- authorization headers;
- API keys;
- passwords;
- tokens;
- credenciales;
- audio crudo;
- transcripciones crudas;
- HTML completo;
- CSS completo;
- JavaScript fuente completo;
- request/response bodies.

Los valores de identificación sensible deben ser minimizados o reemplazados por fingerprints cuando el valor diagnóstico se conserve así.

## 7. Identity

La identidad de superficie es:

\`origin | route/path normalizado | query keys ordenadas\`

Los valores de query parameters no forman parte de la identidad.

## 8. Snapshot hash

El hash representa la estructura observada, no su timestamp.

Dos capturas estructuralmente idénticas en momentos distintos deben producir el mismo hash.

## 9. Delta

Schema:

\`signal-interpreter-platform-delta/v1\`

Tipos:

- \`initial\`
- \`changed\`
- \`unchanged\`

Solo \`initial\` y \`changed\` generan archivo persistente.

Un delta debe poder señalar:

- añadido;
- eliminado;
- modificado.

El delta no declara causalidad.

## 10. Health

El estado del pipeline debe permitir determinar al menos:

- última entrada procesada desde GitHub API;
- último build/publicación derivada en GitHub Actions;
- último error de build/publicación;
- último error;
- número de intentos;
- inbox/backlog pendiente;
- bytes pendientes;
- número de superficies;
- número de deltas.

## 11. Reproducibilidad

El paquete debe ser interpretable sin depender del proceso local que lo generó.

Un desarrollador debe poder leer:

\`manifest → latest/index → delta → snapshot → batch/event\`

y reconstruir la evidencia necesaria para orientar un ciclo.

## 12. Call reports de cierre

Los checkpoints de llamada generan un informe durable sin cambiar el contrato de batch `signal-interpreter-observation-batch/v1`. El informe se compone en GitHub Actions a partir de los eventos previamente saneados; no se publica desde un proceso adicional del equipo local.

Rutas canónicas:

- `call-reports/YYYY-MM-DD/call-<opaque-ref>.json`: informe individual por llamada, sin el ID bruto de Cloud Interpreter en el nombre.
- `call-reports/index.json`: índice de referencias, rutas, timestamps, completitud y estado de confirmación de estrellas.
- `latest/latest-call-report.json`: informe JSON más reciente.
- `latest/latest-call-report.md`: resumen humano del informe más reciente.
- `manifest.json.calls` y `health/github-build.json`: cantidad de informes, últimos punteros, estado y evidencia de checkpoint.

Schema del informe: `signal-interpreter-call-report/v1`. El índice utiliza `signal-interpreter-call-report-index/v1`.

### Disparadores y completitud

- `CALL_RATING_STARS_CONFIRMED` genera o refresca un informe parcial con evidencia estructural acotada de que las estrellas eran visibles.
- `CALL_TIMER_STOPPED` y el checkpoint `CALL_OBSERVABILITY_CHECKPOINT` de `call-ended` permiten enriquecer el informe con duración, modalidad, fuente de cierre, conciliación de ingresos, métricas y eventos tardíos.
- Un informe solo pasa a `complete` si incluye el checkpoint final, el registro final de llamada y un timestamp de fin. En otro caso permanece `partial`, enumerando las señales ausentes.
- Ver las estrellas no equivale a conocer la puntuación seleccionada ni a demostrar el envío de la valoración. Esos atributos permanecen explícitamente false/no observados si no hay evidencia de ello.
- El transporte de checkpoint drena varios batches hasta el número de secuencia de cierre. Si hay fallo de red, cuota o límite de batches, persiste el objetivo y reintenta; no marca la captura como entregada antes del ACK.

### Contenido diagnóstico

El informe consolida la hora de inicio/fin, duración observada frente a la medida por plataforma, duración facturable asumida, modalidad e ingresos estimados; conteos por acción/categoría/componente/severidad; errores/advertencias con reason codes; grupos de señales de auto-answer, micrófono, media/captura, transcripción/captions, rendimiento/red, superficie de plataforma, facturación y recuperación del runtime; últimos y máximos de performance; salud agregada de media; y una lista de lagunas de evidencia.

### Privacidad e integridad

El informe no puede contener audio crudo, texto de transcripción, cuerpos de request/response, HTML/CSS/JavaScript fuente completos, credenciales, valor seleccionado de rating ni una afirmación de que el rating se envió. La identidad se representa mediante un hash opaco; los recursos se normalizan y los mensajes de error no se copian en bruto. La auditoría verifica schema, punteros, completitud y las invariantes de privacidad. Los batches siguen siendo la fuente reproducible que permite reconstruir el informe.

## 13. Evolución

Cambios incompatibles deben crear una nueva versión de schema.

Cambios aditivos compatibles pueden permanecer dentro del mismo schema mientras no alteren el significado de campos existentes.


## 14. Delta de ciclo

El paquete puede consumirse mediante `tools/observability-cycle-delta.mjs`.

El checkpoint de ciclo representa el último estado que ya fue analizado y utilizado para una decisión de desarrollo. El tool compara el estado actual con ese checkpoint y produce:

- nuevos eventos;
- nuevas acciones y categorías;
- nuevas rutas;
- nuevas identidades de plataforma;
- nuevas observaciones y deltas;
- errores y warnings nuevos;
- foco recomendado para análisis.

El estado `uninitialized` es válido cuando todavía no existe un paquete generado por el runtime.

## 15. Transporte y runtime

El paquete no depende de un reporter local ni de un proceso residente. Chrome publica los batches en `observations/inbox/` mediante GitHub API. GitHub Actions construye y publica los artefactos derivados.

La observabilidad de producción no requiere Node.js, Native Messaging, Scheduled Tasks, watchdogs, supervisores, hosts nativos ni servidores localhost en Windows.

# Especificación del paquete de observabilidad v1

## 1. Propósito

El paquete de observabilidad es el artefacto persistente que conecta la operación de Signal Interpreter con el ciclo de desarrollo siguiente.

Debe contener evidencia operacional y conocimiento incremental de la superficie observable de Cloud Interpreter.

## 2. Directorio canónico

\`observations/\`

- \`batches/\`: batches originales saneados y publicados.
- \`latest/\`: punteros resumidos al estado operacional reciente.
- \`platform-snapshots/YYYY-MM-DD/\`: snapshots de superficies observadas.
- \`platform-deltas/YYYY-MM-DD/\`: diferencias semánticas entre snapshots.
- \`platform-index.json\`: índice de última superficie por identidad.
- \`platform-latest.json\`: resumen rápido de conocimiento de plataforma.
- \`manifest.json\`: índice del paquete.

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
- geometría limitada.

### controls

- botones;
- enlaces;
- campos;
- headings.

### css

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
- longitud de inline script.

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

- última recepción;
- última publicación Git;
- último fallback;
- último error;
- número de intentos;
- backlog;
- bytes pendientes;
- número de superficies;
- número de deltas.

## 11. Reproducibilidad

El paquete debe ser interpretable sin depender del proceso local que lo generó.

Un desarrollador debe poder leer:

\`manifest → latest/index → delta → snapshot → batch/event\`

y reconstruir la evidencia necesaria para orientar un ciclo.

## 12. Evolución

Cambios incompatibles deben crear una nueva versión de schema.

Cambios aditivos compatibles pueden permanecer dentro del mismo schema mientras no alteren el significado de campos existentes.

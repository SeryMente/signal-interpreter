# Signal Interpreter — Extension README de continuidad

> **Propósito de este archivo:** permitir que otro modelo de IA retome el desarrollo de la extensión sin depender de la conversación previa.
>
> **Estado documentado:** 2026-10-03.
> **Versión instalada en el repositorio y en la carpeta de carga manual:** 0.9.22.
> **Rama de desarrollo:** feat/operational-metrics-v0914.
> **Revisión de código previa a esta pasada de documentación:** eee7582 `feat: show last manual observability export`.
> **Repositorio:** SeryMente/signal-interpreter.
> **Revisión de esta documentación:** debe confirmarse con `git log -1`; no se fija aquí para evitar que el README envejezca por autocitar su propio commit.
>
> Este README describe el estado real del código. Cuando exista una discrepancia entre esta documentación y el código, **el código actual debe inspeccionarse y este README debe actualizarse en la misma modificación**.

---

## 0. LEER PRIMERO: contexto de continuidad

Signal Interpreter es una extensión Chrome Manifest V3 para asistir en interpretación médica en tiempo real sobre:

`https://app.cloudinterpreter.com/*`

La extensión combina cinco subsistemas principales:

1. **Auto-Answer** para detectar solicitudes de interpretación y, bajo reglas estrictas, conectar llamadas OPI.
2. **Métricas operativas** de sesión, disponibilidad, llamadas, llamadas perdidas y duración.
3. **Transcripción Groq** de dos canales:
   - CLIENTE = audio de la pestaña de Cloud Interpreter.
   - YO = micrófono físico.
4. **Datos oficiales / earnings** obtenidos desde el contexto autenticado de Cloud Interpreter sin abrir ni recargar pestañas.
5. **Observabilidad persistente** local + publicación automática a GitHub, más exportación manual de diagnóstico.

### Regla de oro durante una llamada

**No abrir `chrome://extensions`, no cambiar de pestaña, no crear una pestaña auxiliar, no navegar a Statistics y no recargar la pestaña de la llamada para diagnosticar, versionar o comprobar la extensión.**

La extensión está diseñada para soportar hot-load seguro durante una llamada, pero la operación humana de desarrollo debe respetar la misma filosofía: **no interferir con una llamada activa**.

---

# 1. Arquitectura actual

## 1.1 Flujo global

```
Cloud Interpreter tab
       │
       ├── content.js
       │      ├── detección Auto-Answer
       │      ├── métricas de plataforma
       │      ├── mirror de páginas visibles
       │      ├── observabilidad
       │      └── overlay de ingresos
       │
       └── audio de pestaña
                │
                ▼
        chrome.tabCapture
                │
                ▼
        offscreen document
          │             │
          │             └── microphone getUserMedia
          │
          └── MediaRecorder (audio WebM/Opus)
                         │
                         ▼
                   background.js
                         │
                         ▼
                 groq-transcriber.js
                         │
                         ▼
                 Groq Whisper API
                         │
                         ▼
          sesiones / segmentos persistentes
                         │
                         ▼
                    ui/live.html
```

Observabilidad:

```
eventos de extensión
       │
       ▼
telemetry-db.js / IndexedDB
       │
       ▼
observation-sync.js
       │
       ▼
http://127.0.0.1:8788
       │
       ├── almacenamiento local de observaciones
       │
       └── publisher aislado
              │
              ▼
        GitHub origin/main
```

Diagnóstico manual:

```
popup.js
   │
   ▼
Chrome Native Messaging
   │
   ▼
SignalInterpreterObservabilityHost.exe
   │
   ▼
gh api
   │
   ▼
GitHub branch: observability
   │
   ▼
diagnostics/latest.json
```

**Estas dos rutas no deben confundirse:**

- Automática = observaciones operativas que publica el reporter local.
- Manual = snapshot de desarrollo completo solicitado por el usuario.
- Revisión IA = timestamp registrado de una revisión humana/IA; no implica que el reporter realice una revisión IA por sí mismo.

---

# 2. Rutas locales canónicas de Windows

Repositorio de trabajo:

`C:\Users\fila4\Desktop\signal-interpreter`

Carpeta que se carga manualmente en Chrome:

`C:\Users\fila4\Desktop\Signal-Interpreter-Extension`

Directorio local de infraestructura persistente:

`C:\Users\fila4\.signal-interpreter`

Publisher aislado de observabilidad automática:

`C:\Users\fila4\.signal-interpreter\observation-publisher`

Estado persistente del reporter:

`C:\Users\fila4\.signal-interpreter\observation-reporter-status.json`

Token Groq cifrado con la cuenta Windows:

`C:\Users\fila4\.signal-interpreter\groq-token.dat`

Host nativo de diagnóstico manual:

`C:\Users\fila4\.signal-interpreter\observability-native\SignalInterpreterObservabilityHost.exe`

Puerto local del reporter:

`127.0.0.1:8788`

---

# 3. Regla de versionado: NO NEGOCIABLE

Cada modificación que cambie archivos bajo `extension/` debe aumentar la versión de:

`extension/manifest.json`

La versión actual es:

`0.9.21`

El guard está en:

`tools/extension-version-guard.mjs`

También existe:

`\.githooks/pre-commit`

y el repositorio utiliza:

`git config core.hooksPath .githooks`

El guard tiene dos funciones:

- revisar cambios staged antes del commit;
- revisar el historial de la rama de desarrollo contra `origin/main`.

Ejemplos:

```
node tools/extension-version-guard.mjs --staged
node tools/extension-version-guard.mjs --history
```

**No reutilizar una misma versión para otra modificación de extensión.**

La carpeta de carga manual debe reflejar exactamente la versión del repositorio antes de pedir al usuario que la recargue.

---

# 4. Estructura de la extensión

## `manifest.json`

Manifest V3.

Versión actual: 0.9.21.

Permisos principales:

- storage
- tabs
- activeTab
- tabCapture
- offscreen
- alarms
- unlimitedStorage
- webRequest
- nativeMessaging
- scripting

Host permissions:

- `https://app.cloudinterpreter.com/*`
- APIs de Groq y tipo de cambio
- `http://127.0.0.1:8788/*`

Content script:

`content.js` sobre:

`https://app.cloudinterpreter.com/*`

Service worker:

`background.js`

Popup:

`ui/popup.html`

Atajo:

`Ctrl+Shift+9` para alternar Auto-Answer.

---

## `background.js`

Es el núcleo de coordinación.

Responsabilidades:

- estado operativo persistente;
- sesiones de plataforma;
- online/active/call metrics;
- llamadas perdidas;
- reconciliación periódica;
- Auto-Answer telemetry;
- lifecycle de llamadas;
- sincronización oficial de Statistics;
- exchange rate;
- hot-load;
- creación/control del offscreen;
- pipeline Groq;
- sesiones de transcripción;
- persistencia de segmentos;
- eventos de observabilidad;
- scheduler de alarms;
- sincronización automática de observabilidad.

Schemas importantes:

```
HOTLOAD_SCHEMA = signal-hotload/v1
METRICS_SCHEMA = signal-operational-metrics/v2
event schema = khora-effectif-event/v4
```

---

## `content.js`

Se ejecuta dentro de Cloud Interpreter.

Responsabilidades:

- identificar que el host sea `app.cloudinterpreter.com`;
- observar dialogs de solicitud de interpretación;
- Auto-Answer;
- detección de llamadas perdidas;
- observar availability Online/Offline;
- detectar rutas `/call/<ID>`;
- medir timer visible de la plataforma;
- producir snapshots de estructura visible;
- producir snapshots/mirror de páginas oficiales;
- telemetry de red/performance/interacción;
- overlay de ingresos;
- beep de llamada dentro de la página;
- integrity checks;
- eventos de lifecycle.

### Restricción deliberada

La política es esencialmente:

```
read-only except validated Connect
```

El código registra y audita que no:

- reemplace tracks originales;
- modifique constraints de media de la plataforma;
- detenga tracks originales;
- use tabCapture desde el content script;
- abra el micrófono desde el content script;
- llame APIs privadas de la plataforma.

---

## `offscreen.js`

Documento offscreen para APIs que no deben vivir directamente en el service worker.

Responsabilidades actuales:

- capturar audio de pestaña;
- capturar micrófono;
- crear `MediaRecorder`;
- emitir blobs WebM/Opus al background;
- reproducir tonos.

Para captura:

- audio de pestaña: `chrome.tabCapture` → `getUserMedia({chromeMediaSource:"tab"...})`;
- micrófono: `getUserMedia({audio:true})`.

Usa dos grabadores:

- source `cliente`
- source `yo`

Cada recorder corta aproximadamente cada 18 segundos y entrega un chunk.

No existe grabación silenciosa permanente activada solo por entrar a una página. La captura Groq se inicia desde la consola LIVE.

---

## `groq-transcriber.js`

Cliente mínimo para:

`https://api.groq.com/openai/v1/audio/transcriptions`

Modelo por defecto:

`whisper-large-v3-turbo`

También se permite:

`whisper-large-v3`

Parámetros actuales:

- language = `es`
- temperature = `0`
- response_format = `verbose_json`
- timestamp_granularities = segment
- prompt orientado a interpretación médica en español.

Timeout por defecto:

30 segundos.

No debe registrar credenciales.

Los errores redactan:

- Bearer tokens;
- claves `gsk_`;
- otros secrets relevantes.

---

## `groq-secret.local.js`

Este archivo contiene el token Groq local y **NO debe ser versionado**.

Está expresamente ignorado en `.gitignore`:

`extension/groq-secret.local.js`

En la implementación local se genera a partir de:

`tools/setup-groq-key.ps1`

El almacenamiento persistente seguro en Windows es:

`%USERPROFILE%\.signal-interpreter\groq-token.dat`

Ese archivo usa protección de credencial basada en la cuenta Windows.

**Nunca copiar un token real al README, a GitHub, a un commit ni a un diagnóstico.**

---

## `dialogue-engine.js`

Biblioteca pequeña para:

- normalización de texto;
- ordenamiento temporal de segmentos.

La exportación pública es:

`SignalDialogue`

---

## `telemetry-db.js`

IndexedDB:

`signal-interpreter-telemetry`

Versión actual de DB:

2.

Object stores:

- `events`
- `snapshots`
- `signalSegments`
- `metadata`

Los eventos usan `sequence` como key.

También conserva índices por:

- timestamp;
- action;
- level;
- sessionId.

Los snapshots tienen:

- capturedAt;
- key.

Los signal segments tienen:

- sessionId;
- timestamp.

La base admite:

- lectura incremental;
- snapshots;
- segmentos;
- estadísticas de almacenamiento;
- pruning por antigüedad;
- trimming por volumen.

Defaults relevantes:

- retención: 180 días;
- máximo eventos: 250,000;
- máximo signal segments: 100,000;
- heartbeat configurable, default 30 s.

El código usa `navigator.storage.estimate()` para conocer uso/cuota del almacenamiento.

---

# 5. Transcripción: comportamiento exacto

## Canales

### CLIENTE

Audio que sale de la pestaña de Cloud Interpreter.

Pipeline:

```
tabCapture → MediaRecorder → WebM/Opus → Groq → CLIENTE
```

### YO

Audio del micrófono físico.

Pipeline:

```
getUserMedia(audio:true) → MediaRecorder → WebM/Opus → Groq → YO
```

No se usa Chrome Live Caption para esta ruta.

No se usa Windows UI Automation para esta ruta.

No se usa el bridge histórico para esta ruta.

---

## Sesiones

Una sesión de transcripción tiene:

- id;
- sourceKey;
- sourceUrl;
- title;
- sourceTabId;
- sourceWindowId;
- traceId;
- activationCount;
- segmentos;
- speaker state;
- vista;
- tamaño de fuente;
- auto-scroll;
- densidad.

Perfil actual:

`groq-audio-2p`

Participantes esperados:

2.

Roles:

`CLIENTE`, `YO`

La extensión conserva hasta 50 sesiones en storage y hasta 100 segmentos embebidos por sesión.

La UI LIVE representa hasta los últimos 200 segmentos en pantalla.

---

## Consola LIVE

Archivo principal:

`ui/live.html`

Controlador:

`ui/live.js`

Incluye:

- timeline;
- vista tripartita/lateral por participante;
- CLIENTE;
- YO;
- tamaño compacto;
- tamaño normal;
- modo lectura;
- ventana movible;
- persistencia de bounds;
- focus mode;
- auto-scroll;
- densidad compacta;
- inicio/paro de captura;
- borrado de sesión;
- envío manual de texto;
- exportación diagnóstica;
- sincronización manual de observabilidad.

Tamaños predefinidos:

- compact: 430 × 700
- normal: 760 × 760
- reading: 1200 × 820

La ventana reutiliza una ventana popup existente si ya está abierta.

---

# 6. Persistencia de transcripción

Cada segmento de transcripción tiene, en esencia:

- id;
- sessionId;
- text;
- timestamp;
- reason;
- source;
- speaker;
- speakerId;
- audioSource;
- model;
- chunkSequence.

Los segmentos Groq usan:

`reason = groq-transcription`

Los segmentos manuales usan:

`reason = manual`

Los segmentos persistidos se copian:

1. a IndexedDB;
2. al objeto de sesión en `chrome.storage.local`.

La persistencia trata DB y cache como rutas separadas para poder diagnosticar si una falla es exclusivamente IndexedDB o exclusivamente storage.

---

# 7. Auto-Answer

## Dominio

Solo:

`app.cloudinterpreter.com`

## Solicitud entrante

Busca dialogs que contengan texto equivalente a:

`requesting interpretation`

y distingue:

- Audio interpreting → OPI
- Video interpreting → VRI
- desconocido → UNKNOWN

## Regla vigente

**Auto-Answer solo está autorizado para OPI verificado.**

VRI no se conecta automáticamente.

Eso genera el evento:

`AUTO_ANSWER_SKIPPED_UNVERIFIED_MODALITY`

cuando corresponde.

## Click autorizado

Solo se permite:

`button[aria-label="Connect"]`

con botón visible y habilitado.

Antes del click se crea:

`signal-hotload / answer lease`

con:

- flowId;
- clickAt;
- modality;
- fingerprint;
- routeConfirmed;
- runtimeVersion.

El click genera:

`CONNECT_CLICKED`

Después se espera la entrada real a:

`/call/<ID>`

Watchdog de conexión:

aprox. 7 segundos.

Si no aparece la ruta:

`CONNECT_ROUTE_TIMEOUT`

No se debe realizar un segundo click automático.

---

# 8. Llamadas perdidas

Una llamada perdida solo incrementa la métrica cuando aparece realmente un dialog visible con la frase:

`Missed Call`

La detección vive en `content.js`.

El background:

- aplica fingerprint;
- evita duplicados;
- persiste registro;
- incrementa contador total;
- incrementa contador diario.

No se infiere una llamada perdida solo porque:

- hubo incoming;
- hubo click;
- no apareció la ruta;
- transcurrió tiempo.

Específicamente:

`CALL_NOT_CONNECTED_WITHOUT_MISSED_DIALOG`

**no incrementa missedCalls**.

Esto es intencional.

---

# 9. Métricas operativas

Schema:

`signal-operational-metrics/v2`

## Sesión

Se inicia cuando existe una observación autenticada válida de Cloud Interpreter.

Termina cuando:

- ya no existe la pestaña fuente;
- la pestaña deja de estar autenticada;
- o se elimina la pestaña fuente.

Los intervalos se guardan como segmentos.

## Online

En la UI, Online representa el tiempo acumulado de sesiones reconocidas, incluida la sesión actual.

Es:

`sessionSegments + sessionStartedAt...`

No es lo mismo que Active.

## Active

Representa tiempo disponible para recibir llamadas.

Se considera activo cuando el sistema observa:

`You are Online`

o:

`Click to go Offline`

Es decir, disponibilidad operativa.

No debe seguir contando cuando existe evidencia explícita de Offline.

## Llamada actual

Se basa en:

`state.callStartedAt`

y, cuando existe, retrocede el inicio usando el timer visible de la plataforma.

La ruta normal:

`/call/<ID>`

produce:

`CALL_ROUTE_ENTERED`

La finalización usa la señal de rating cuando está disponible y fallback de ruta/reconciliación cuando es necesario.

## Cierre por desaparición

Si la pestaña fuente de una llamada se cierra, se registra y se cierra la llamada desde el background sin marcarla como perdida.

---

# 10. Reconciliación de plataforma

La reconciliación vive en:

`reconcilePlatformTelemetry()`

Obtiene tabs de:

`https://app.cloudinterpreter.com/*`

y obtiene datos observables mediante `chrome.scripting.executeScript` en contexto aislado.

Comprueba:

- autenticación;
- disponibilidad;
- ruta;
- callId;
- End call visible;
- timer;
- modalidad;
- cantidad de media elements.

Se ejecuta:

- al inicio;
- al cambiar/activar tabs;
- por alarm;
- al abrir popup;
- por eventos de plataforma.

No crea una nueva pestaña para hacerlo.

---

# 11. Statistics / datos oficiales

La fuente oficial se consulta desde una pestaña ya existente de Cloud Interpreter.

Método principal:

`readOfficialStatsViaTrpc()`

Endpoint funcional:

`/api/trpc/logFetcher.fetchInterpreterLogs`

La llamada se ejecuta desde:

`chrome.scripting.executeScript(... world:"MAIN")`

para reutilizar la sesión autenticada del sitio.

### Política crítica

La sincronización oficial:

- no crea pestañas;
- no navega;
- no recarga;
- no abre una segunda llamada;
- no cambia manualmente la pestaña activa durante una llamada.

Si existe una llamada activa, la operación debe ser call-safe.

Por eso existe el evento:

`PLATFORM_OFFICIAL_SYNC_CALL_SAFE_BLOCKED`

si no se puede identificar una pestaña de llamada segura.

## Datos oficiales manejados

- earned / earnedUsd;
- total number of calls;
- total call length.

También se calculan diferencias contra estimaciones locales:

- deltaUsd;
- deltaCallCount;
- deltaCallSeconds.

El mirror vive en:

`effectifPlatformMirror.statistics`

---

# 12. Earnings / overlay

Rates default:

- OPI = US$0.20/min
- VRI = US$0.25/min

Billing rule almacenada:

`pro_rata_by_second_assumed`

El ingreso local es una estimación.

Cuando existe una cifra oficial de Statistics:

**la cifra oficial tiene prioridad.**

Durante una llamada se muestra una estimación incremental si todavía no está disponible el snapshot oficial.

El overlay:

`signal-interpreter-earnings-overlay`

se crea solo durante una llamada reconocida.

Tiene:

- monto;
- resumen;
- incremento live;
- estado de Statistics;
- USD/MXN;
- modo compacto;
- cerrar.

Al entrar en la pantalla de estrellas/rating se detiene.

Esto genera:

`EARNINGS_OVERLAY_STOPPED`

---

# 13. USD/MXN

Se actualiza aproximadamente cada hora.

Orden de fuentes actual:

1. ExchangeRate.fun
2. Frankfurter
3. ExchangeRate-API

Si una fuente falla, se prueba la siguiente.

La configuración guarda:

- usdMxnRate;
- exchangeRateDate;
- exchangeRateUpdatedAt;
- exchangeRateSource.

Errores generan:

`EXCHANGE_RATE_ERROR`

---

# 14. Hot-load transaccional seguro

Schema:

`signal-hotload/v1`

## Objetivo

Permitir actualización del runtime sin romper una llamada activa ni perder el estado de transcripción.

## Lease de llamada

`state.hotLoadLease`

incluye:

- schema;
- phase;
- leaseId;
- callId;
- callStartedAt;
- callSourceTabId;
- modality;
- transcriptionSessionId;
- captureExpected;
- captureStatus;
- runtimeVersion;
- acquiredAt;
- lastHeartbeatAt;
- closedAt.

## Update descriptor

`state.hotLoadUpdate`

incluye:

- availableVersion;
- detectedAt;
- deferredForCallId;
- applyingAt;
- applyTrigger;
- currentVersion;
- phase.

## Política

Si Chrome anuncia `onUpdateAvailable`:

### Sin llamada activa

Se puede aplicar el runtime de forma segura.

### Con llamada activa

La actualización se defiere.

No se ejecuta:

`chrome.runtime.reload()`

durante la llamada.

Se registra:

`HOTLOAD_UPDATE_DEFERRED_ACTIVE_CALL`

y se conserva el lease.

## Después de terminar la llamada

Si había update pendiente:

1. se libera el update en el límite seguro;
2. se aplica runtime reload;
3. la nueva instancia recupera estado;
4. rehidrata `content.js` sobre la misma pestaña si es válida;
5. reutiliza una captura existente si sigue activa;
6. si es necesario, vuelve a obtener el stream de la **misma pestaña**;
7. nunca crea una segunda llamada.

Eventos relevantes:

- HOTLOAD_CAPTURE_REUSE_EXISTING
- HOTLOAD_CAPTURE_STREAM_REACQUIRE_OK
- HOTLOAD_CAPTURE_RECOVERY_COMPLETED
- HOTLOAD_CAPTURE_RECOVERY_ERROR

---

# 15. Observabilidad persistente

## Base

`telemetry-db.js`

## Sync

`observation-sync.js`

Endpoint:

`http://127.0.0.1:8788/v1/observation-batch`

Cada batch tiene schema:

`signal-interpreter-observation-batch/v1`

Máximo:

200 eventos por batch.

Características:

- eventos normales se agrupan;
- ventana de evento de ~30 s;
- alarma periódica cada 2 min;
- máximo retraso configurado de ~120 s;
- separación mínima entre envíos de ~10 s;
- errores/critical pueden disparar flush acelerado;
- reintentos mediante el estado persistente del sync.

Estado local:

`signalObservationSyncState`

incluye:

- ackedSequence;
- pendingCount;
- lastAttemptAt;
- lastSuccessAt;
- lastBatchId;
- consecutiveFailures;
- lastError.

---

# 16. Sanitización de observabilidad

La observabilidad automática NO debe transportar texto bruto de conversación.

La función de scrub elimina/redacta campos sensibles.

Se omiten/redactan especialmente:

- text;
- caption;
- snapshot;
- transcript;
- dialog;
- utterance;
- content;
- html/body;
- api key;
- authorization;
- cookie;
- password;
- secret;
- bearer;
- credential.

También se redactan emails y tokens.

El reporter vuelve a filtrar el batch antes de escribirlo.

---

# 17. Reporter local 127.0.0.1:8788

Archivo:

`tools/observation-reporter/server.mjs`

El reporter es una capa de infraestructura, no un componente funcional de la interpretación.

## Por qué existe

- desacopla GitHub de la extensión;
- permite buffer local;
- permite retry;
- evita ejecutar Git desde la extensión;
- conserva estado de sincronización;
- mantiene publicación fuera de la rama de desarrollo;
- sigue funcionando aunque el popup esté cerrado.

## Publisher aislado

Ruta:

`%USERPROFILE%\.signal-interpreter\observation-publisher`

El reporter:

1. clona solo `main`;
2. hace fetch de `origin/main`;
3. hace reset duro a `origin/main`;
4. limpia el worktree;
5. copia solo observaciones nuevas/modificadas;
6. hace commit solo de esos paths;
7. publica con:

`git push origin HEAD:main`

**No debe publicar directamente desde la rama de desarrollo.**

---

# 18. Reporter en segundo plano y silencioso

La tarea de Windows:

`Signal Interpreter Observation Reporter`

está configurada para:

- ejecutarse al iniciar sesión;
- usuario operativo `fila4`;
- privilegios limitados;
- reinicios automáticos;
- ignorar instancias duplicadas;
- funcionar con batería.

La acción ejecuta directamente:

`C:\Program Files\nodejs\node.exe`

con:

`tools/observation-reporter/server.mjs`

Esto significa:

**No es necesario mantener abierta una ventana de Command Prompt ni PowerShell.**

El script:

`tools/observation-reporter/run.ps1`

solo es útil como ruta manual; no debe mantenerse abierto en uso normal.

---

# 19. Estado del reporter visible en la UI

La franja discreta del popup contiene:

### GitHub automático

Última sincronización automática confirmada por el reporter.

### Último envío manual

Última publicación manual confirmada por el host nativo.

### Última revisión IA

Último timestamp registrado de una revisión IA.

La UI muestra edad relativa:

- ahora
- hace N min
- hace N h
- hace N d

El tooltip conserva fecha/hora local exacta.

---

# 20. Exportación MANUAL de desarrollo

Botón en popup:

`↗ Diagnóstico`

Esto ejecuta:

`buildDevelopmentDiagnostic()`

y produce un bundle con:

- schema;
- generatedAt;
- baseline;
- runtime;
- counts;
- eventSummary;
- state sanitizado;
- config;
- telemetryHealth;
- lastEvent;
- sessions;
- events;
- platformSnapshots;
- platformMirror;
- signal segment metadata;
- portal observation.

En esta ruta, los segmentos se compactan principalmente para diagnóstico y no deben asumirse como transcript bruto.

Después intenta Native Messaging:

`com.serymente.signal_interpreter.observability`

El host publica:

`diagnostics/latest.json`

en la rama:

`observability`

El host usa:

`gh api`

y reintenta si recibe un 422 por SHA obsoleto.

Solo después de confirmación positiva la extensión guarda:

`effectifObservabilityExport`

con:

- at;
- sequence;
- commit.

La UI usa este storage para mostrar:

**Último envío manual**.

---

# 21. Exportación de la consola LIVE: distinta y más sensible

`ui/live.js` también tiene:

`exportDiagnostic()`

Esta exportación tiene propósito de diagnóstico específico de captura/transcripción.

Incluye más información, incluyendo:

- sessions;
- events;
- platformSnapshots;
- signalSegments.

Por tanto:

**NO asumir que el export de LIVE tiene la misma minimización que el export de desarrollo del popup.**

Debe tratarse como artefacto sensible y no publicarse automáticamente.

---

# 22. Host nativo de observabilidad manual

Fuente:

`tools/observability-native-host/SignalInterpreterObservabilityHost.cs`

Native host:

`com.serymente.signal_interpreter.observability`

Restricciones integradas:

- valida origen `chrome-extension://...`;
- valida el extension ID contra el manifiesto instalado;
- solo acepta repository `SeryMente/signal-interpreter`;
- solo acepta path `diagnostics/latest.json`;
- limita tamaño de input;
- limita tamaño del diagnóstico;
- usa Native Messaging stdio;
- ejecuta `gh.exe` con `CreateNoWindow=true`.

No debe usarse para publicar observaciones automáticas.

---

# 23. Instalación / recuperación del entorno

## Bootstrap general

`tools/bootstrap-windows.ps1`

Puede instalar/verificar:

- Git;
- GitHub CLI;
- .NET SDK 8;
- Node LTS.

También:

- autentica GitHub;
- prepara Git;
- clona/actualiza el repositorio;
- prepara la key Groq;
- copia la extensión a Desktop;
- instala el host nativo;
- ejecuta validaciones.

El bootstrap protege cambios locales: si el repo ya existe y está dirty, no debe sobrescribir trabajo.

## Key Groq

`tools/setup-groq-key.ps1`

Ruta segura recomendada para regenerar:

`extension/groq-secret.local.js`

No editar esa clave manualmente en el README.

## Host manual

`tools/install-observability-host.ps1`

Instala:

- binario self-contained;
- manifest Native Messaging;
- registro HKCU de Chrome;
- validación de `gh auth status`.

## Reporter automático

`tools/observation-reporter/install-autostart.ps1`

Instala la tarea:

`Signal Interpreter Observation Reporter`

La acción debe permanecer en ejecución silenciosa bajo `fila4`.

---

# 24. Carga manual en Chrome

La carpeta canónica:

`C:\Users\fila4\Desktop\Signal-Interpreter-Extension`

se carga como **Load unpacked**.

El usuario hace manualmente la recarga de la extensión.

El agente NO debe abrir automáticamente:

`chrome://extensions`

ni recargar la extensión mientras el usuario esté trabajando en una llamada.

Antes de pedir una recarga manual, comprobar por filesystem que:

`repo/extension/manifest.json`

y:

`Desktop/Signal-Interpreter-Extension/manifest.json`

tengan la misma versión.

---

# 25. Verificación de archivos antes de una recarga manual

Chequeo mínimo recomendado:

```
node --check extension/background.js
node --check extension/content.js
node --check extension/offscreen.js
node --check extension/groq-transcriber.js
node --check extension/ui/popup.js
node --check extension/ui/live.js
node --check extension/dialogue-engine.js
node tools/groq-transcriber-tests.mjs
node tools/observability-static-audit.mjs
node tools/extension-version-guard.mjs --history
git diff --check
```

Luego comprobar que el Desktop deployment tiene la misma versión.

No es necesario ejecutar todo esto durante una llamada activa.

---

# 26. Auditoría estática actual

Archivo:

`tools/observability-static-audit.mjs`

Actualmente comprueba, entre otras cosas:

- versión de manifest;
- host permission de localhost;
- Native Messaging;
- scripting;
- dominio autorizado;
- funciones de telemetría;
- tRPC official stats;
- reconcilePlatformTelemetry;
- probes;
- fuentes de session/online/active;
- observabilidad del popup;
- export manual.

En la última modificación verificada:

`OBSERVABILITY_STATIC_AUDIT=PASS`

El audit debe actualizarse cuando se agreguen nuevos invariantes importantes.

---

# 27. Prueba de Groq

Archivo:

`tools/groq-transcriber-tests.mjs`

Prueba:

- falta de token;
- endpoint correcto;
- modelo correcto;
- language;
- temperature;
- verbose_json;
- prompt;
- segmentos;
- redacción de credenciales en errores.

No necesita un token real.

Última prueba conocida:

`GROQ_TRANSCRIBER_TEST=PASS`

---

# 28. Reglas de cambios futuros

## Antes de modificar

1. comprobar rama;
2. comprobar `git status`;
3. comprobar versión;
4. inspeccionar el código real;
5. no asumir que la conversación contiene el estado completo;
6. no asumir que un subsistema histórico sigue activo.

## Al modificar extension/

1. incrementar manifest version;
2. actualizar deployment de Desktop;
3. ejecutar syntax checks;
4. ejecutar tests relevantes;
5. ejecutar static audit;
6. ejecutar version guard;
7. revisar `git diff --check`;
8. commit;
9. push a la rama de trabajo;
10. nunca pedir reload durante una llamada.

## No hacer

- no trabajar sobre `main` para cambios de desarrollo;
- no abrir tabs auxiliares durante llamadas;
- no modificar `signal-interpreter` para resolver trabajo que pertenece a Khora;
- no reintroducir Live Caption/UIA como ruta activa sin una decisión arquitectónica explícita;
- no introducir un nuevo bridge local para sustituir Groq;
- no guardar secretos en Git;
- no aumentar el alcance del Auto-Answer sin pruebas específicas;
- no inferir missed calls por timeout;
- no hacer oficial una métrica basada solo en estimación local.

---

# 29. Arquitecturas HISTÓRICAS / DEPRECADO

Hubo una arquitectura anterior basada en:

```
Chrome Live Caption
    ↓
Windows UI Automation
    ↓
bridge local
    ↓
caption.delta / caption.revision / caption.segment
```

Esto está documentado en:

`docs/PROTOCOL-v1.md`

pero **NO es la ruta activa de transcripción actual**.

La ruta activa es:

```
audio de pestaña + micrófono
        ↓
MediaRecorder
        ↓
Groq Whisper
        ↓
CLIENTE / YO
```

No volver a conectar la arquitectura antigua por inercia.

---

# 30. Observabilidad: separación de responsabilidades

## IndexedDB

Fuente local de eventos y snapshots.

## observation-sync.js

Agrupa y envía batches a localhost.

## reporter

Recibe, almacena y publica automáticamente.

## publisher repo

Aísla `main` de la rama de desarrollo.

## native host

Publica el diagnóstico manual en branch `observability`.

## IA

La IA revisa el diagnóstico fuera de esta cadena. El reporter **no es el revisor IA**.

---

# 31. Señales/eventos importantes

Eventos de llamadas:

- INCOMING_DIALOG_DETECTED
- CONNECT_BUTTON_FOUND
- AUTO_ANSWER_ELIGIBLE
- CONNECT_CLICKED
- ANSWER_FLOW_ROUTE_CONFIRMED
- CONNECT_ROUTE_TIMEOUT
- CALL_ROUTE_ENTERED
- CALL_TIMER_STARTED
- CALL_TIMER_STOPPED
- CALL_END_SIGNAL_PREPARED
- CALL_NOT_CONNECTED_WITHOUT_MISSED_DIALOG

Eventos missed:

- MISSED_CALL_DIALOG_DETECTED
- MISSED_CALL_CLASSIFIED
- MISSED_CALL_DUPLICATE_IGNORED
- MISSED_CALL_DIALOG_CLOSED

Eventos de plataforma:

- PLATFORM_SESSION_RECONCILED_STARTED
- PLATFORM_SESSION_RECONCILED_ENDED
- PLATFORM_ACTIVE_TIME_STARTED
- PLATFORM_ACTIVE_TIME_ENDED
- PLATFORM_TELEMETRY_RECONCILED
- TAB_LIFECYCLE

Official stats:

- PLATFORM_OFFICIAL_SYNC_REQUESTED
- PLATFORM_OFFICIAL_SYNC_COMPLETED
- PLATFORM_OFFICIAL_PAGE_TRPC_ERROR
- PLATFORM_OFFICIAL_HOURLY_SYNC_STARTED
- PLATFORM_OFFICIAL_HOURLY_SYNC_COMPLETED
- PLATFORM_OFFICIAL_HOURLY_SYNC_ERROR

Groq:

- SIGNAL_GROQ_CAPTURE_STARTED
- SIGNAL_GROQ_CAPTURE_STOPPED
- SIGNAL_GROQ_CAPTURE_ERROR
- SIGNAL_GROQ_TRANSCRIPTION_OK
- SIGNAL_GROQ_TRANSCRIPTION_ERROR
- SIGNAL_GROQ_CHUNK_ERROR

Hot-load:

- HOTLOAD_UPDATE_DEFERRED_ACTIVE_CALL
- HOTLOAD_UPDATE_READY_SAFE
- HOTLOAD_RELOAD_BLOCKED_ACTIVE_CALL
- HOTLOAD_INSTALL_BOUNDARY_ACTIVE_CALL
- HOTLOAD_RUNTIME_BOUNDARY_RECOVERY_STARTED
- HOTLOAD_CAPTURE_REUSE_EXISTING
- HOTLOAD_CAPTURE_STREAM_REACQUIRE_OK
- HOTLOAD_CAPTURE_RECOVERY_COMPLETED

Observabilidad:

- NETWORK_ACTIVITY_WINDOW
- OBSERVABILITY_CHECKPOINT_ERROR
- telemetry maintenance events
- observation sync state

---

# 32. Estado persistente importante en chrome.storage.local

Clave principal:

`effectifState`

Contiene, entre otros:

### Métricas

- metricsSchema
- sessionStartedAt
- sessionSegments
- sessionSourceTabId
- onlineStartedAt
- onlineSegments
- onlineSourceTabId
- activeStartedAt
- activeSegments
- activeSourceTabId
- callStartedAt
- callId
- callModality
- callSourceTabId
- completedCalls
- totalCalls
- dailyCalls
- missedCalls
- dailyMissedCalls
- missedCallRecords

### Official stats

- callStartOfficialStats

### Groq

- groqCapture
- groqTranscript
- transcriptionActive
- transcriptionTabId
- transcriptionStatus
- transcriptionMetrics
- groqUsage

### Hot-load

- hotLoadLease
- hotLoadUpdate

### Telemetry

- telemetryHealth
- eventSequence
- autoAnswerTelemetry

Clave:

`effectifConfig`

incluye defaults de:

- Auto-Answer;
- telemetry;
- transcription;
- sound;
- rates;
- overlay;
- USD/MXN;
- Groq model.

Claves de observabilidad:

`effectifObservabilityUpdate`

`effectifObservabilityExport`

Clave de sync:

`signalObservationSyncState`

Claves del mirror:

`effectifPlatformMirror`

---

# 33. Sesiones de interpretación persistentes

Claves:

`signalInterpreterSessions`

`signalInterpreterActiveSessionId`

La extensión mantiene sesiones separadas por origen/tab.

Una sesión se identifica principalmente por:

- source origin;
- source URL;
- source tabId.

El source URL se normaliza para reducir variaciones.

---

# 34. Privacidad y seguridad

La extensión trata como sensibles:

- Groq API key;
- texto de transcripción;
- audio;
- identificadores de sesión;
- datos autenticados de Cloud Interpreter.

Reglas:

- no meter keys en logs;
- no exportar raw audio desde el reporter;
- redactar tokens;
- redacción de emails/números;
- no escribir transcript bruto en eventos automáticos;
- mantener secrets fuera del repositorio;
- separar diagnóstico manual de observabilidad automática.

El reporter escucha exclusivamente en loopback:

`127.0.0.1`

No debe exponerse en:

`0.0.0.0`

---

# 35. UI del popup

`ui/popup.html`

Estructura:

- encabezado;
- control de transcripción;
- switches;
- métricas;
- earnings;
- overlay;
- acciones;
- official data;
- observabilidad;
- desarrollo.

La franja de observabilidad está deliberadamente cerca de la parte inferior-media, visible sin abrir "Desarrollo".

Campos actuales:

- OBSERVABILIDAD v0.9.21
- GitHub automático
- Último envío manual
- Última revisión IA
- ↗ Diagnóstico

Los detalles técnicos permanecen ocultos salvo tooltip o diagnóstico.

---

# 36. UI del LIVE console

`ui/live.html`

No debe ser una side panel fija.

Es una popup independiente, redimensionable/movible.

Controles importantes:

- captura;
- timeline/triptych;
- speaker;
- font size;
- auto-scroll;
- compact density;
- focus;
- export;
- clear;
- send YO.

Atajos dentro de LIVE:

- 1 = CLIENTE
- 2 = YO
- T = timeline
- G = triptych
- F = focus
- Escape = salir de focus.

---

# 37. Qué significa "perfectamente funcionando" en observabilidad

Se consideran cuatro capas separadas:

### A. Captura

La extensión produce eventos persistentes.

### B. Envío

`observation-sync.js` los entrega al localhost.

### C. Publicación automática

El reporter confirma publicación en GitHub.

### D. Revisión

Existe un registro del último snapshot revisado.

Una falla en D no debe implicar que A/B/C estén rotas.

Una falla en C tampoco debe impedir la captura local de observabilidad.

---

# 38. Estado operativo conocido al cerrar esta etapa

La extensión está en:

`0.9.21`

La carpeta Desktop de carga manual también está en:

`0.9.21`

La versión del repositorio y deployment deben permanecer sincronizadas.

La auditoría estática pasó.

El guard de versión pasó.

El commit de la última modificación:

`eee7582 feat: show last manual observability export`

La rama de desarrollo es:

`feat/operational-metrics-v0914`

El reporter local está diseñado como tarea silenciosa de Windows y no requiere una consola visible.

---

# 39. Cambios recientes relevantes para el siguiente modelo

Secuencia de evolución reciente:

- `97cf188` — correct operational activity metrics
  - 0.9.14 → 0.9.15
- `d71c207` — harden operational activity metrics
  - 0.9.15 → 0.9.16
- `60d645d` — initialize earnings overlay from official stats
  - 0.9.16 → 0.9.17
- `f3e5d2e` — surface observability sync status
  - 0.9.17 → 0.9.18
- `079e5de` — harden observability export and version boundaries
  - 0.9.18 → 0.9.19
- `5ce2ae4` — harden automatic observability reporter
  - 0.9.19 → 0.9.20
- `99823bd` — canonize silent observability reporter
  - documentación del reporter local silencioso
- `eee7582` — show last manual observability export
  - 0.9.20 → 0.9.21
  - UI ahora distingue automático/manual/IA.
- `0.9.22` — cierre documental de continuidad
  - README exhaustivo de la extensión para transferencia entre modelos.
  - Se documentan arquitectura, contratos, estado persistente, seguridad, hot-load, observabilidad, instalación, pruebas y reglas operativas.

---

# 40. Estado de Git y observaciones locales

El reporter automático genera archivos bajo:

`observations/`

en el repositorio fuente.

Es normal encontrar modificaciones/untracked allí producidas por la operación del reporter.

**No hacer `git add .` por reflejo.**

Antes de decidir qué hacer con esos archivos:

1. determinar si son observaciones generadas automáticamente;
2. comprobar si ya fueron publicadas por el publisher aislado;
3. no mezclarlas con un commit de desarrollo de extensión sin motivo explícito.

El archivo:

`diagnostics/last-ui-sync-check.txt`

también puede quedar untracked como artefacto local de diagnóstico.

---

# 41. Procedimiento recomendado para otro modelo

Al iniciar una sesión de continuidad:

### Paso 1

Leer:

`extension/README.md`

completo.

### Paso 2

Leer:

`docs/OBSERVABILITY.md`

### Paso 3

Leer:

`tools/extension-version-guard.mjs`

### Paso 4

Comprobar:

```
git branch --show-current
git status --short
git log -12 --oneline --decorate
```

### Paso 5

Comprobar versión:

```
Get-Content extension/manifest.json
Get-Content C:\Users\fila4\Desktop\Signal-Interpreter-Extension\manifest.json
```

### Paso 6

Revisar primero el código real del subsistema que se vaya a tocar.

### Paso 7

Ejecutar los tests específicos antes y después.

### Paso 8

Si se cambió `extension/`, incrementar versión.

### Paso 9

No manipular Chrome automáticamente.

---

# 42. Política de interacción con llamadas activas

Esta política tiene prioridad operacional.

Durante una llamada activa:

**permitido:**

- inspeccionar archivos;
- ejecutar tests que no toquen Chrome;
- revisar Git;
- revisar reporter;
- revisar localhost;
- consultar archivos de estado;
- realizar operaciones de filesystem;
- preparar una nueva versión sin recargarla.

**no permitido salvo petición explícita:**

- cerrar Chrome;
- cerrar VS Code;
- cambiar de tab;
- abrir Statistics;
- abrir una segunda llamada;
- recargar la extensión;
- navegar la llamada;
- lanzar `chrome://extensions`;
- matar procesos de captura;
- cerrar el offscreen;
- detener audio.

La arquitectura de hot-load existe precisamente porque una actualización puede coincidir con una llamada, pero la operación debe esperar un límite seguro antes de aplicar cambios destructivos.

---

# 43. Alcance fuera de esta extensión

Este repositorio es:

`SeryMente/signal-interpreter`

Khora es otro proyecto.

El trabajo de Khora usa Signal Interpreter como referencia arquitectónica en algunos casos, pero **no modificar Signal Interpreter para implementar funcionalidades de Khora**.

No asumir que la antigua arquitectura de Signal Interpreter debe reintroducirse para Khora.

---

# 44. Señal de éxito de la etapa actual

Al terminar esta etapa debe ser posible que un modelo nuevo entienda, sin conversación previa:

- qué hace la extensión;
- cómo captura audio;
- cómo transcribe;
- cómo guarda sesiones;
- cómo cuenta llamadas;
- cómo distingue missed call;
- cómo obtiene Statistics;
- cómo funciona el overlay;
- cómo funciona hot-load;
- cómo funciona observabilidad;
- por qué existe localhost;
- por qué hay publisher separado;
- cómo se diferencia el export automático del manual;
- dónde queda el timestamp de revisión IA;
- cómo versionar;
- cómo probar;
- qué no debe tocar durante una llamada.

**Ese es el criterio de completitud de este README.**

---

# 45. Archivos de referencia rápida

### Extensión

```
extension/manifest.json
extension/background.js
extension/content.js
extension/offscreen.js
extension/groq-transcriber.js
extension/groq-secret.local.js      # LOCAL ONLY
extension/observation-sync.js
extension/telemetry-db.js
extension/dialogue-engine.js
extension/ui/popup.html
extension/ui/popup.css
extension/ui/popup.js
extension/ui/live.html
extension/ui/live.css
extension/ui/live.js
```

### Herramientas

```
tools/setup-groq-key.ps1
tools/groq-transcriber-tests.mjs
tools/extension-version-guard.mjs
tools/observability-static-audit.mjs
tools/bootstrap-windows.ps1
tools/run-versioned.ps1
tools/install-observability-host.ps1
tools/observation-reporter/server.mjs
tools/observation-reporter/install-autostart.ps1
tools/observation-reporter/run.ps1
tools/observability-native-host/SignalInterpreterObservabilityHost.cs
```

### Documentación raíz

```
docs/OBSERVABILITY.md
docs/PROTOCOL-v1.md
```

---

# 46. Última advertencia para continuidad

No confundir estos tres hechos:

1. **GitHub automático reciente** = publicación de observaciones por reporter.
2. **Último envío manual** = exportación manual confirmada a `diagnostics/latest.json` en branch `observability`.
3. **Última revisión IA** = timestamp de una revisión registrada.

No son el mismo evento ni deben compartir una sola marca temporal.

No confundir tampoco:

- transcripción actual = Groq;
- protocolo histórico = Live Caption/UIA;
- observabilidad automática = localhost 8788;
- diagnóstico manual = Native Messaging + gh api.

Y, sobre todo:

**una nueva versión de la extensión siempre debe tener un nuevo número en `manifest.json`, verificarse contra la carpeta Desktop y probarse antes de pedir al usuario que la recargue.**

# Reglas operativas — Signal Interpreter

**Estado:** PROVISIONAL · regla operativa por defecto para materializaciones Windows  
**Ámbito:** frente Signal Interpreter; Chrome en el usuario operativo de Windows  
**Identificador:** SI-OP-01

## SI-OP-01 — Native Messaging host obligatorio al materializar en Windows

### Regla

Cuando el operador solicite materializar, actualizar o preparar para cargar Signal Interpreter en el Escritorio de un usuario operativo de Windows, la rutina estándar debe instalar y verificar también el Chrome Native Messaging host `com.signalinterpreter.captionhost`, bajo el mismo perfil de Windows que utilizará Chrome.

Copiar la carpeta de la extensión o cargarla como “unpacked” no basta para declarar completa la materialización. La instalación del host nativo es una fase obligatoria de la misma rutina, no una tarea opcional o un seguimiento que pueda olvidarse.

### Rutina normativa

1. **Identidad y titularidad.** Confirmar PC, usuario de Windows operativo y ruta destino autorizada. El host debe registrarse en el perfil del mismo usuario que ejecutará Chrome. No instalarlo bajo otra cuenta, en `HKLM`, ni elevar privilegios por conveniencia. Si Chrome pertenece a otro usuario o no puede verificarse la identidad, detenerse.
2. **Integridad del paquete.** Preservar la versión anterior y sus artefactos; verificar `manifest.json`, ID estable de la extensión e inventario SHA-256 antes de instalar. No sobrescribir respaldos ni artefactos ajenos al paquete.
3. **Entrada única.** Ejecutar `PREPARAR-Y-CARGAR.cmd` desde la raíz materializada (la que contiene `manifest.json`). El wrapper invoca `INSTALAR.ps1` sin opción de omitir el puente y detiene la rutina si el instalador devuelve error.
4. **Instalación Native Messaging.** `INSTALAR.ps1` debe validar el SHA-256 fijado del ejecutable embebido, materializarlo en `%LOCALAPPDATA%\SignalInterpreter\NativeMessagingHost`, generar el manifiesto con la ruta absoluta y el `allowed_origins` exacto de la extensión, registrar la ruta del manifiesto en `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.signalinterpreter.captionhost` y ejecutar la prueba de protocolo sobre la ruta registrada.
5. **Fail-closed.** No continuar a la carga/reload de la extensión si falla hash, manifiesto, registro, identidad de origen, prueba de protocolo o verificación del usuario. No detener por la fuerza un host activo ni manipular una llamada. Si existe un conflicto, preservar el estado y reportarlo.
6. **Read-back.** Leer de vuelta la clave `HKCU`, el manifiesto registrado y el ejecutable estable; comprobar ruta, origen permitido y SHA-256. Guardar recibo con versión, usuario, rutas y resultado de protocolo. La instalación solo se declara verificada cuando todas estas comprobaciones pasan.
7. **Carga de Chrome.** Después del PASS del puente, el operador carga o recarga manualmente la carpeta de la extensión desde Chrome. No abrir ni manipular GUI mediante RDC salvo autorización explícita independiente. No declarar Chrome activo ni aceptación funcional hasta verificar la versión efectivamente cargada y la prueba de uso correspondiente.

### Compuerta de aceptación

La materialización Windows queda en estado **PREPARADA, NO COMPLETA** mientras falte cualquiera de estos puntos:

- ejecutable nativo materializado y SHA-256 coincidente;
- manifiesto Native Messaging con ruta absoluta y origen Chrome exacto;
- registro presente en el `HKCU` del usuario operativo;
- prueba del protocolo sobre la ruta registrada con resultado PASS;
- read-back conservado;
- carga manual de la extensión y versión activa confirmadas por el operador.

### Separación de componentes

El Native Messaging host `com.signalinterpreter.captionhost` es el puente entre Chrome y el proceso nativo declarado por la extensión. No debe confundirse con el lector Windows UI Automation de `bridge/windows-uia`, que es un componente separado con transporte y ciclo de vida propios. Instalar uno no demuestra que el otro esté instalado o ejecutándose.

### Excepción

Solo una instrucción expresa del operador puede dispensar SI-OP-01 para una materialización concreta. La excepción debe registrarse con su alcance y no cambia la regla por defecto.

### Evidencia de implementación del procedimiento

En el paquete 0.10.43 revisado, `PREPARAR-Y-CARGAR.cmd` llama directamente a `INSTALAR.ps1` y se detiene si falla; el instalador valida el host, registra bajo `HKCU` y realiza una prueba de protocolo. Este documento formaliza que esa vía debe utilizarse en toda materialización Windows.

**Límite de verificación actual:** la inspección de solo lectura en PC-13 encontró ausente la clave Native Messaging del usuario de esa sesión. No se ejecutó el instalador ni se modificó el registro en esta retoma; por tanto, SI-OP-01 queda documentada, pero la instalación del host en PC-13 permanece **NO EJECUTADA / NO VERIFICADA**.


## SI-OP-02 — Workspace SeryMente y ubicación de Signal Interpreter

**Estado:** RATIFICADA por instrucción directa del operador · 2026-11-09 · G14  
**Ámbito:** directorio local de trabajo del frente Signal Interpreter en Windows.

### Estructura obligatoria

La raíz de trabajo del workspace es:

`%USERPROFILE%\\Desktop\\SeryMente`

Dentro de esa raíz, la carpeta exclusiva del frente/repositorio es:

`%USERPROFILE%\\Desktop\\SeryMente\\signal-interpreter`

La carpeta que el operador destina a cargar como extensión desempaquetada en Chrome es:

`%USERPROFILE%\\Desktop\\SeryMente\\signal-interpreter\\extension`

El nombre de carpeta del repositorio usa el slug `signal-interpreter` ya creado en el workspace; no crear otro clon paralelo llamado `Signal Interpreter` ni una segunda raíz de proyecto por diferencias de mayúsculas/minúsculas. El repositorio completo y sus documentos permanecen en `signal-interpreter`; `extension` es su subdirectorio designado para el paquete que carga Chrome.

### Reglas de identidad, autenticación y persistencia

1. Antes de escribir, verificar hostname, identidad Windows, perfil, ruta real de Desktop, Device ID RDC y contenido existente. No deducir identidad persistente a partir del nombre `PC-N`.
2. Los equipos `PC-N` de Cyber son instancias efímeras. Una reconexión con el mismo nombre puede ser otra máquina/sesión y no recupera archivos anteriores. El contenido local no se considera durable ni se presume continuidad.
3. El repositorio remoto GitHub, sus commits y sus lecturas de vuelta son la superficie durable. Antes de que una instancia Cyber expire, sincronizar los cambios autorizados al remoto y verificar SHA/read-back; no dejar la única copia de trabajo en el Escritorio efímero.
4. Para clonar o sincronizar mediante Git, usar la identidad y autenticación GitHub del usuario Windows propietario. No eludir la compuerta de autenticación, no incrustar PAT/tokens en URL, comandos, scripts o documentación y no copiar credenciales desde otro perfil.
5. Este workspace de Cyber está materializado en claro y el volumen C: no está cifrado. Se permite código fuente, clones Git y documentación técnica no sensible. Se prohíben contraseñas, tokens, claves API/B2, archivos `.env` con secretos, material DPAPI, bóvedas, notas de custodia, datos personales/sensibles y contenido de llamadas/transcripciones privadas.
6. Si no existe autenticación, si el repo no es un clon válido o si el destino contiene datos no conciliados, detener la escritura y reportar el bloqueo; nunca inicializar un Git nuevo encima del scaffold ni sobrescribir archivos sin inventario y preservación.

### Compuerta de carga de Chrome

La ruta destinada por el operador es `signal-interpreter\\extension`. Antes de indicar que está lista para **Cargar descomprimida**, comprobar en esa carpeta:

- existe `manifest.json` directamente en la raíz de `extension`;
- todos los archivos referidos por el manifiesto existen y sus rutas son relativas a esa misma raíz;
- el ID de extensión, la versión, los hashes y el inventario coinciden con la candidata;
- se cumplen SI-OP-01 y las comprobaciones del Native Messaging host en el mismo usuario Windows de Chrome.

**Resolución de layout verificada en rama candidata (PR #80 draft; no integrada):** el manifiesto canónico permanece en la raíz como fuente del paquete; `extension/manifest.json` es su variante normalizada y **la única carpeta que debe cargarse en Chrome es `extension/`**. Los scripts de preparación abren esa carpeta y el probe compara la ruta Chrome contra ella. Validación local actual: inventario 60/60 SHA-256; verify-release-package PASS; unpacked-layout 18 referencias PASS; presence-connect 35 checks PASS; presence-guard 83 checks PASS; microphone-guard PASS; overlay regression PASS; JavaScript 5/5 syntax PASS; PowerShell 5.1 parser 7/7 scripts relevantes PASS con BOM donde corresponde. `main` conserva código 0.10.47; PR #80 sigue draft y no está fusionada. La aceptación Chrome sigue a cargo del operador.

### Estado de la instancia inspeccionada · 2026-11-10 · G14

- Equipo RDC observado: `PC10RCIF4EI4`, device ID `b573344f-c68f-47c9-9c2e-ae67f2e63bdb`; identidad operadora `CENTRAL\\MantenimientoRCI`. Destino materializado: `CENTRAL\\fila4`, perfil `C:\\Users\\fila4`.
- El usuario revalidó explícitamente el uso de RDC bajo MantenimientoRCI solo para operar/elevación y la obligación de materializar todo bajo fila4. La discrepancia de device ID frente al registro anterior se documentó en el control G14; no se usó la ruta de MantenimientoRCI como destino.
- Workspace: `C:\\Users\\fila4\\Desktop\\SeryMente\\signal-interpreter`. Es un paquete materializado sin metadatos `.git`; no debe tratarse como clon Git. Versión de paquete 0.10.47 candidata PR #80.
- Carpeta de carga Chrome: `C:\\Users\\fila4\\Desktop\\SeryMente\\signal-interpreter\\extension`. El README de SeryMente y los scripts de preparación designan esa subcarpeta, no la raíz.
- Native Messaging host ya estaba presente y registrado para fila4. Se verificaron en solo lectura el manifiesto, el valor de registro, el origen permitido y el SHA-256 del ejecutable; no se modificó.
- Se preservó el estado previo en `Temporal\\SI-backup-pre-PR80-20261110.zip`; SHA-256 cotejado. El inventario del paquete candidato es 60/60.
- Chrome no se cargó/recargó en este ciclo; no se realizó llamada real ni captura de audio. La aceptación manual del operador permanece pendiente. No se autorizó merge, deploy o release.

### Registro histórico de inspección · 2026-11-09 (PC13/PC14)


- Workspace: `C:\\Users\\PC 13\\Desktop\\SeryMente`, equipo observado `PC-14`, identidad `pc-14\\pc 13`; esta identidad corresponde a la instancia Cyber activa y no es persistente.
- Scaffold: `C:\\Users\\PC 13\\Desktop\\SeryMente\\signal-interpreter` existe y estaba vacío (cero elementos); todavía no es un clon Git.
- Git for Windows 2.56.0 está instalado en `C:\\Program Files\\Git\\cmd\\git.exe`; GitHub CLI 2.103.3 en `C:\\Program Files\\GitHub CLI\\gh.exe`. `gh auth status` devolvió **NOT LOGGED IN**. No se clonó ni se escribió payload en esa carpeta.
- La presente regla fija la ubicación futura; no certifica que la extensión esté materializada/cargable, que el host nativo esté instalado ni que Chrome se haya actualizado.

La instrucción autoriza este workspace como superficie provisional para código y documentación técnica no sensible. No autoriza guardar secretos, capturar audio/micrófono real, intervenir llamadas, recargar/reiniciar Chrome, declarar aceptación funcional, fusionar PR, desplegar o crear release.

## SI-OP-03 — Transcripción dual Groq y diálogo cronológico único

**Estado:** PROVISIONAL · decisión operativa del operador · 2026-11-10  
**Ámbito:** captura y transcripción de la llamada en Signal Interpreter; no sustituye SI-OP-01 ni SI-OP-02.

### Regla

El requisito de transcripción es un único diálogo cronológico que combine:
1. la salida de audio remota de la pestaña de Cloud Interpreter; y
2. la entrada del micrófono propio del intérprete.

Ambas fuentes deben mantenerse separadas durante la captura y enviarse simultáneamente al endpoint Groq de transcripción. La fusión ocurre después de recibir segmentos y aplicarles el reloj común. No mezclar pistas antes de Whisper ni serializar una fuente detrás de la otra.

### Motor por defecto

- whisper-large-v3 en ambos canales.
- verbose_json, temperatura 0, timestamps por segmento.
- Omitir language para permitir autodetección por fragmento cuando la lengua no esté verificada.
- No usar Turbo como default ni activar fallback silencioso.
- Word timestamps fuera del camino crítico por su latencia adicional documentada.
- Live Caption nativo como alternativa/híbrido queda P3 y desactivado como segundo motor paralelo por defecto.

### Captura y envío

- La fuente remota debe limitarse a la pestaña de la llamada elegida por el operador; el audio no se debe capturar de forma oculta ni fuera de una llamada activa.
- La fuente propia se captura con getUserMedia en una acción visible y explícita; etiqueta INTÉRPRETE por procedencia, nunca por idioma.
- Preferir ventanas de audio autónomas, mono, WAV 16 kHz, generadas mediante AudioWorklet. No subir fragmentos timesliced de MediaRecorder como archivos independientes sin verificar que cada uno sea decodificable/autónomo.
- Dos colas y límites de concurrencia por fuente; backpressure, secuencia, offset de captura, timeout y errores visibles. La ventana/cadencia se decide contra RPM/ASH reales y la factura mínima de 10 s por solicitud.
- Reloj monotónico común cuando ambas fuentes compartan AudioContext; en contextos distintos, mapear a una época de sesión y medir deriva. Guardar startMs/endMs/source/sequence/requestId/model por segmento.
- Fusionar por startMs; conservar solapamientos; actualizar parciales por identidad estable; deduplicar solo dentro de la misma fuente/ventana cuando se demuestre que es un duplicado de reconciliación.

### Atribución y presentación

- Micrófono propio → INTÉRPRETE.
- Salida de pestaña mixta → AUDIO REMOTO · HABLANTE NO VERIFICADO.
- No asignar LEP/proveedor por idioma, voz aparente, contenido o inferencia. Solo separar roles si Cloud Interpreter expone pistas o metadatos de participante verificables y los tests lo demuestran.
- Renderizar todas las fuentes en el mismo diálogo; conservar texto bruto; puntuación conservadora; no alterar dosis, cifras, nombres, direcciones ni contenido clínico.

### Privacidad y cierre

- La captura requiere llamada activa reconocida, acción explícita, preflight, clave Groq disponible y confirmación ZDR como compuerta local. La casilla ZDR es una declaración del operador, no prueba independiente de la configuración de la consola.
- Audio y texto clínico se excluyen de telemetría/observabilidad, exportes diagnósticos, bases generales y logs.
- Detener y liberar las dos pistas al fin de llamada, cambio de ruta, pagehide, pérdida/denegación de permiso, mute o error de pipeline. No declarar la sesión completa si una fuente falla.
- Cualquier cambio de permisos de extensión, paquete y hash de distribución requiere actualizar inventarios y pasar todas las suites existentes.

### Compuerta de aceptación

La función no se declara completa hasta que: (a) ambas fuentes operen simultáneamente; (b) ambas transcripciones aparezcan en el mismo diálogo; (c) el orden y los solapamientos sean correctos; (d) los tests sintéticos/headless validen archivos WAV, sincronización, errores y ciclo de vida; (e) CI verde sobre la cabeza exacta; (f) se reporte WER/CER, latencia p50/p95, pérdida, duplicación, RPM y coste sobre corpus autorizado; y (g) el operador acepte la prueba real.

**Procedencia y estado actual:** instrucciones literales A-01/A-02/A-03 y decisiones en el OCP y registro verbatim. Integración dual, captura y diálogo en runtime todavía pendientes.

### Reconciliación de estado · 2026-11-10 · G14

La descripción de procedencia y estado que figura en la redacción histórica anterior queda actualizada por el corte de inspección estática de PR #83 HEAD 4737823873f826f80346cd817b877c6664769f20:

- La candidata contiene módulos de captura dual, WAV 16 kHz, colas Groq separadas, motor de fusión, handlers de service worker y receptor de segmentos en el overlay. Su presencia/conexión se verificó por lectura de código; no equivale a ejecución real.
- La cabeza actual de PR #83 no pasa CI: Package integrity, signal-observability-audit y native-caption-host-build finalizaron en failure. No declarar la compuerta sintética aprobada hasta corregir y repetir sobre el HEAD exacto.
- La función no está publicada en main ni aceptada en Chrome. No se hicieron permisos reales, llamada, audio, credencial, prueba del endpoint ni aceptación.
- La prioridad inmediata es corregir hashes/invariantes y regresión overlay/hotload, ejecutar las suites nuevas y portar solo los deltas revisados; la PR está 115 commits ahead y 783 behind respecto de main.
- La decisión ZDR sigue siendo una compuerta local declarativa que debe reflejar una comprobación real del operador en la consola de Groq; el flag de UI no demuestra la configuración del proveedor.


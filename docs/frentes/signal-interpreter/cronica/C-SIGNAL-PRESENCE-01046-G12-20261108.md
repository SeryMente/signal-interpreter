# Crónica G12 — corrección de falsos positivos del guard de presencia · 0.10.46

Fecha: 2026-11-08 · Zona horaria de observación: America/Mexico_City
Frente: Signal Interpreter · generación G12 ACTIVA · FOL1 PREPARADA, NO ACTIVA.

## Hecho observado

La telemetría local de Chrome registró una llamada OPI entrante a las 11:53:55.810. La extensión detectó el diálogo y el evento de timbrado; encontró el botón Connect y lo observó habilitado. No registró CONNECT_CLICKED y clasificó el diálogo como llamada perdida (`dialog_closed_without_connect`).

En ese intento Auto-Answer estaba configurado, el perfil y la disponibilidad online eran válidos, el bloqueo de laboratorio estaba desactivado y el guard de presencia figuraba desarmado. El motivo publicado fue `IDLE_OR_LOCKED_CONFIRM_AGAIN`.

La preferencia local `presenceIdleSeconds` era 60. Chrome Idle API mide tiempo desde la última entrada de teclado/ratón; no puede distinguir entre escuchar/leer sin interactuar y estar ausente. La consulta de Security Log para eventos Windows 4800/4801 durante 11:50–11:56 no devolvió eventos; esto no prueba que no ocurriera un bloqueo ni identifica por sí solo el estado devuelto por Chrome.

## Causa técnica

El guard G12 anterior usaba una sola salida `idle-or-locked-confirm-again` para tres resultados distintos de su consulta: `idle`, `locked` y `unavailable` (timeout, API no disponible, error o estado inesperado). También desarmaba la autorización ante errores transitorios de APIs de almacenamiento/pestañas durante la revalidación.

La evidencia no permite asegurar retrospectivamente cuál de esos resultados originó el incidente; sí demuestra que la instrumentación anterior no los distinguía. Además, el límite configurado de 60 segundos es suficientemente corto para activarse durante tareas pasivas.

## Cambio 0.10.46

- `idle`, `locked` y `unavailable` tienen estados y motivos independientes.
- Una transición confirmada de Windows a idle o locked sigue revocando la autorización y elimina su marcador de sesión. El retorno a active no rearma.
- Una consulta unavailable bloquea esa llamada concreta (fail-closed), pero no destruye la autorización explícita de la sesión; programa una comprobación de restauración y vuelve a verificar antes de permitir intentos posteriores.
- Las excepciones transitorias de las APIs de almacenamiento o pestañas bloquean el intento actual, pero no se confunden con una transición confirmada de ausencia.
- Se registra solo estado, origen de comprobación, marca temporal y código de error saneado; no se añade audio, texto de llamada, subtítulos, teléfono ni contenido de diálogo.
- El popup explica que el límite mide ausencia de teclado/ratón. Se conservan opciones explícitas de 1/3/5/10 minutos sin imponer un nuevo valor por defecto.
- Se preservan OPI exclusivo, perfil autorizado, consentimiento explícito, lease de un solo uso, validación de ruta y protección de laboratorio.

Este cambio no desactiva el control de presencia, no convierte un resultado incierto en autorización para contestar y no garantiza que todas las llamadas se contesten. La opción actual de 60 segundos puede seguir pausando la disponibilidad cuando no haya entrada de teclado/ratón durante ese periodo.

## Verificación

- `presence-guard-test`: 81/81 PASS, Node VM con APIs Chrome sintéticas.
- `presence-connect-test`: 33/33 PASS, DOM sintético.
- `node --check`: 25/25 archivos JavaScript del paquete.
- `verify-release-package`: 59/59 SHA-256, identidad y hash del host nativo PASS.
- Inventario del instalador y regresión de indicadores globales PASS.
- Call export, caption lab, cloud login bootstrap, hotload-active-call, live-caption static audit, microphone feedback, overlay activation, pipeline hotkey y portable root PASS.
- `observability-static-audit`: NO EJECUTADO localmente; el ZIP de instalación no incluye el workflow que ese test busca (`.github/workflows/observability-build.yml`). La auditoría GitHub Actions reportada previamente para PR #73/0.10.43 no sustituye la CI del nuevo commit.
- `earnings-overlay-tests`: FAIL no relacionado; la prueba espera `syncOfficialEarningsRangeUnsafe`, que no encuentra en esta base.

## Límites y estado

Candidata 0.10.46 en la rama G12 `work/g12-autoanswer-revalidation`, PR #73 abierta. No fusionada ni liberada. La carpeta staging temporal de PC-8 fue validada; la carpeta de escritorio cargada por Chrome no se ha actualizado aún en este checkpoint. Chrome no fue recargado, no se manipuló ninguna llamada real y no existe aceptación funcional Windows/Chrome. La recarga del navegador y la aceptación real siguen pendientes del operador.

El paquete de 0.10.45 incluye también la corrección de propagación del indicador global: azul externo solo cuando Cloud Interpreter está verde; rojo/gris/ámbar se propagan según el estado global.
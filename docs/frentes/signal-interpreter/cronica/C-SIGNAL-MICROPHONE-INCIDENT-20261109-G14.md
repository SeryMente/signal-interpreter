# Incidente MIC OFF / MIC ERR · 2026-11-09 · G14

## Resumen ejecutivo

La observabilidad capturó dos denegaciones `EXTENSION_MICROPHONE_UNMUTE_BLOCKED` a las 17:00:49.794Z y 17:00:50.670Z, ambas originadas por `popup-button`, con `reasonCode=call-not-active`, `callId=null`, `tabId=null`. La extensión no estaba asociando la petición con una llamada activa. La política de seguridad mantuvo el mute; no hay indicio de que intentara abrir el micrófono ni de que Windows denegara acceso al dispositivo.

El defecto confirmado fue de clasificación de estado en el popup: una denegación esperada de política se mostraba como error de verificación/hardware (`MIC ERR`).

## 1. Suficiencia de observabilidad

**DICTAMEN: LIMITADA, con utilidad diagnóstica puntual; no abundante.**

Capturó:
- versión 0.10.45, Chrome 156 / Win32;
- origen del intento: `popup-button`;
- motivo de bloqueo: `call-not-active`;
- ausencia de `callId` y `tabId`;
- persistencia del estado de bloqueo en dos intentos próximos.

No capturó:
- evidencia independiente de que Cloud Interpreter estuviera en una ruta activa;
- `MediaStreamTrack.enabled`, pistas/senders asociados ni resultado de prueba de dispositivo;
- correlación con un identificador de llamada o captura de pantalla útil del control.

**Límite del dictamen:** no se puede distinguir con certeza si el clic ocurrió fuera de una llamada aceptada o si el operador estaba en llamada y el detector no registró `callId/callSourceTabId`. Los errores de screenshot por falta de `activeTab/<all_urls>` son eventos de otro componente, no causa demostrada de micrófono.

## 2. Diagnóstico

En `background.js:setExtensionMicrophoneMutedInternal`, cualquier intento de unmute con `hasActiveCall(state)=false` o ruta origen no confirmada toma el camino de bloqueo. En la evidencia, el estado no tenía `callId` ni `callSourceTabId`, por lo que devolvió `call-not-active`; el código no llegó a `setMainClientMicrophoneMuted`, no controló pista/sender y no pidió permiso de hardware.

El popup en `extension/ui/popup.js` clasificaba todo resultado `ok:false` como error, guardando `microphoneMuteStatus=error` y `microphoneOutputStatus=error`, aun cuando el resultado fuera una denegación segura verificada. Por ello el operador veía `MIC ERR` en vez de una explicación de `MIC OFF` protegido.

## 3. Corrección aplicada a la carpeta de trabajo PC-14

Raíz única: `C:\\Users\\PC 13\\Desktop\\SeryMente\\signal-interpreter`.

- `extension/background.js`: respuesta de bloqueo añade `blocked=true`, `applied=false`, `outputMuted=true`, `verified=true`; se mantienen mute y fail-closed. La denegación registra booleans saneados `activeCallDetected`, `callIdPresent`, `sourceTabIdPresent`, `routeVerified`, `captureActive`, `outputControlAttempted=false`, `hardwarePermissionRequested=false`, `micRemainsMuted=true`.
- `extension/ui/popup.js`: distingue bloqueo de política de error de pista; muestra MIC OFF protegido si no existe llamada confirmada. Solo fallos reales de verificación muestran MIC ERR.
- `payload-sha256.json`: recalculado para popup y background; test nuevo incluido.
- `tools/microphone-popup-policy-test.mjs`: nuevo test de regresión (4 estados, 12 checks).

No se debilitó la compuerta de seguridad ni se intentó abrir el micrófono.

## 4. Pruebas

- 45/45 archivos de test locales PASS.
- 25/25 archivos JS de extensión pasan `node --check`.
- `microphone-popup-policy-test.mjs`: PASS, 4 escenarios y 12 comprobaciones.
- `verify-release-package.mjs`: PASS, 62 hashes de paquete y hash de host nativo PASS.
- Node v24.22.2.

## 5. Observabilidad actualizada

El próximo evento de bloqueo incluirá booleanos suficientes para determinar si fue detectada una llamada, si había identificador/tab fuente, si la URL de origen pasó validación y si se intentó tocar una pista o solicitar permiso. No se registra ruta URL, audio, texto hablado, credenciales ni contenido clínico. Esto mejora clasificación sin ampliar captura de datos sensibles.

## 6. Estado y siguiente paso seguro

- PR #75 permanece OPEN/DRAFT; no merge, no release.
- El parche local ya fue persistido en la rama de trabajo de la PR; CI del nuevo HEAD debe verificarse aparte.
- Chrome sigue usando la versión cargada antes del parche hasta reload. No se recargó ni reinició porque no se debía interrumpir una posible llamada.
- Tras finalizar la llamada/sesión actual, el operador debe recargar la extensión en `chrome://extensions`. Después se verificará: fuera de llamada, MIC OFF protegido sin MIC ERR; dentro de una ruta `/call/:id` reconocida, estado y pista de salida verificados.
- Si se mantiene MIC OFF/denegación con una llamada real activa, el problema restante será la detección del estado de llamada (`callId/callSourceTabId`), no el puente Native Messaging.



### Refinamiento de observabilidad · categoría explícita · 2026-11-09

Los eventos cuyo nombre incluye `MICROPHONE` ahora se clasifican como `category=MICROPHONE` en vez de caer en `RUNTIME`. La prueba de regresión también exige esta categoría; el inventario SHA-256 fue recalculado y el verificador local volvió a pasar (62/62 archivos). No se añaden rutas, audio, texto, ni credenciales al evento.

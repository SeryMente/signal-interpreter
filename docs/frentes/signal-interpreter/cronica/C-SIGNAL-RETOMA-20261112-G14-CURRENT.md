# Crónica de retoma G14 · Signal Interpreter · 2026-11-12

## 1. Objeto y continuidad

Esta crónica actualiza el estado operativo de **Signal Interpreter (SI)**. No pertenece a RAP. Se conserva la titularidad vigente G14 como agente único; no se transfiere responsabilidad, no se crea corresponsable y no se asignan folios.

- **Frente:** Signal Interpreter.
- **Gobierno registrado:** G14 ACTIVO · agente único.
- **FOL1:** PREPARADA / NO ACTIVA.
- **Folio:** PENDIENTE / NO ASIGNADO.
- **MCP normativo:** DESACTIVADO.
- **Fuente canónica:** `main` de `SeryMente/signal-interpreter`; este registro complementa el OCP, no crea un estado paralelo.
- **DUG de referencia en el OCP anterior:** Samantha v389 · NX-389m · Metacanon 1.30 · GOW 2.19. No se recalcula edad d.h.m. sin evidencia de fuente/reloj/zona vigentes.

## 2. Exportación conversacional y custodia privada

Se recuperó desde Descargas el archivo `ChatGPT-SI (1)-20261112-1125.md`.

| Propiedad | Valor |
|---|---|
| Bytes | 69,731 |
| Líneas | 1,778 |
| SHA-256 | `1D3DCFE0BC98F310DAE873ACE5F9DB925959B26E46AC3B7D7F9E0D72E8896D77` |
| Creación declarada | 2026-11-11 16:10:26 |
| Última actualización declarada | 2026-11-12 11:20:05 |
| Exportación declarada | 2026-11-12 11:25:15 |

El original se copió byte por byte al directorio local privado `originales/ChatGPT-SI-20261112-1125.md`; SHA-256 de fuente y destino coincide. Se generó además `originales/ChatGPT-SI-20261112-1125-FORMATEADO.md`, con título y encabezados de turno normalizados como «Operador» y «Asistente». Se conservaron orden, fechas y cuerpos de mensaje. Ambos archivos se excluyeron mediante la exclusión local de Git; **no se sube el diálogo completo al repositorio público**.

El recibo público contiene metadatos de custodia y hash, no el contenido de la conversación: [RECIBO-EXPORT-CHATGPT-SI-20261112-1125.json](../evidencias/RECIBO-EXPORT-CHATGPT-SI-20261112-1125.json).

## 3. Solicitud operativa reanudada

El operador señaló que necesita comprobar el micrófono antes de aceptar llamadas. El diseño anterior confundía la prueba del dispositivo físico con el toggle de la pista saliente durante una llamada. La corrección requerida consiste en una **prueba previa independiente**, explícita y local, que no habilite el micrófono de la llamada ni dependa de que exista un `callId`.

Criterios de la prueba previa:

1. Iniciar captura solo cuando el operador pulse **Probar micrófono**.
2. Solicitar permiso de micrófono a Chrome en ese momento, no al abrir una llamada.
3. Mostrar un medidor de nivel para confirmar que llega señal.
4. No transmitir ni guardar audio; el flujo alimenta únicamente el analizador local.
5. Detener por orden explícita, al cerrar el popup o al alcanzar el watchdog de 15 segundos; liberar pistas y cerrar el AudioContext.
6. Mantener separado el estado de prueba local del mute de la pista saliente de llamada.

## 4. Integración formal en main

La solución ya estaba implementada y fue integrada formalmente:

- **PR #90:** [Release Signal Interpreter 0.10.48 — local microphone preflight](https://github.com/SeryMente/signal-interpreter/pull/90).
- Estado: **CLOSED / MERGED**.
- Rama de la propuesta: `release/mic-preflight-0.10.48`.
- HEAD de la PR: `a4ae9292a4a41daa56dcc7b68569b8fefaa2bd98`.
- Merge commit: `86c93a656c6abc09e11041d27d91c20e8208a31b`.
- La lectura de `main/manifest.json` confirma **0.10.48**.

### CI sobre el HEAD exacto de la PR

Los cuatro checks asociados al HEAD `a4ae9292a4a41daa56dcc7b68569b8fefaa2bd98` concluyeron SUCCESS:

| Check / workflow | Run |
|---|---:|
| Package integrity | 43267521149 |
| Signal Interpreter extension package | 43267521045 |
| Native caption host build | 43267520805 |
| Signal observability audit | 43267520781 |

**Resultado: 4/4 checks SUCCESS** en el HEAD de la PR. Esto valida las comprobaciones automatizadas y la generación del artefacto, no una llamada real ni la aceptación física del micrófono.

## 5. Artefacto y materialización local

Se recuperó el artefacto `SignalInterpreter-extension-package` del workflow de paquete:

- Artifact ID: `13966403258`.
- ZIP del artefacto: 915,535 bytes.
- SHA-256 del contenedor de artefacto: `b48f905aa666cda5cc79166fcc6474a8d5a6aff22d8749d4f43558a0b16a30ca`.
- Paquete interno: `SignalInterpreter-0.10.48.zip`, 922,894 bytes.
- SHA-256 del ZIP interno y del sidecar: `d34b2035c5dc9233a0ddf7f29894f9cd90394deac23df7d8a4552b5812a69be0`.

En el entorno local de Fila 4 se preparó una carpeta limpia `Desktop/SeryMente/SignalInterpreter-0.10.48/`, cuya raíz contiene `manifest.json`. Se mantuvo sin modificación la carpeta anterior 0.10.47 como rollback. Se dejó además el ZIP y su sidecar SHA-256 en Descargas, junto con una hoja de instrucciones de carga manual.

El paquete es autocontenido para **Cargar descomprimida** desde la raíz que contiene `manifest.json`. No debe seleccionarse la subcarpeta `extension/`.

### Verificación local de la copia aislada y del destino

- `MICROPHONE_PREFLIGHT_TEST=PASS`.
- Sintaxis JavaScript: **26/26 PASS**.
- Referencias de archivos del manifiesto: **13/13 PASS**.
- Versión: `0.10.48`.
- Identidad Chrome: `ldpbjhobnfgmhdoehehdmnbhhjckebmj`, consistente con la identidad previamente registrada.
- La copia final contiene 49 archivos y 1,699,594 bytes.

La prueba unitaria se descargó desde el repositorio para ejecutar el fixture contra el artefacto exacto; el directorio de pruebas temporal fue retirado antes de materializar la carpeta final.

## 6. Comportamiento incorporado

La prueba está en `extension/ui/microphone-preflight.js`, integrada al popup. Solicita `getUserMedia({ audio: true, video: false })` después de la acción explícita, alimenta un analizador RMS local y refleja el nivel en el medidor. No envía mensajes de control a `chrome.runtime`, no usa Groq ni Cloud Interpreter, y no cambia el estado de mute de la llamada.

La liberación contempla detención explícita, cierre del popup y límite de 15 segundos. La regresión unitaria contempla además un permiso concedido de forma tardía después de cerrar la prueba: la pista se detiene y el AudioContext se cierra; la prueba no se reactiva tardíamente.

El mecanismo mantiene dos verificaciones distintas:

- **Prueba previa:** comprueba acceso local al dispositivo físico y presencia de señal.
- **Micrófono de llamada:** sigue sujeto al mute inicial y al control de la pista saliente durante una llamada activa.

La prueba previa no certifica por sí sola que la pista saliente funcione en una llamada real.

## 7. Límites y aceptación pendiente

- No se cargó ni recargó la extensión en Chrome.
- No se concedió permiso de micrófono en Chrome durante esta ejecución.
- No se probó físicamente el micrófono; el operador debe pulsar el nuevo control y verificar que el medidor reacciona.
- No se realizó una llamada real ni se verificó la pista saliente durante una llamada.
- No se declara aceptación funcional del operador.
- No se llamó a Groq ni se capturó audio de llamada.
- No se manipuló Native Messaging ni el registro de Windows.
- La versión anterior 0.10.47 se conserva como rollback local.

La acción manual pendiente es cargar en Chrome la carpeta `SignalInterpreter-0.10.48`, abrir el popup y probar el dispositivo. Para la aceptación de llamada habrá que verificar por separado el mute inicial y la reversibilidad del toggle dentro de una llamada controlada. La desinstalación/retirada completa del guard no se certifica con esta prueba previa.

## 8. Separación del trabajo Groq dual

La PR #90 implementa únicamente la prueba previa local del micrófono. No integra la rama de transcripción dual Groq ni sustituye su benchmark de calidad. La PR #84 conserva su estado separado; sus condiciones externas y acústicas no quedan aceptadas por la entrega 0.10.48.

## 9. Estado al cierre

- **Integración formal:** PR #90 fusionada en `main`.
- **Versión:** 0.10.48.
- **CI de propuesta:** 4/4 SUCCESS.
- **Artefacto:** descargado, SHA cotejado y extraído.
- **Destino local:** preparado, con raíz de carga identificada.
- **Chrome / permiso físico / llamada real:** pendientes.
- **G14:** ACTIVO · agente único.
- **FOL1:** PREPARADA / NO ACTIVA.
- **Folios:** PENDIENTES / NO ASIGNADOS.
- **MCP normativo:** DESACTIVADO.

Esta crónica no cambia titularidad ni convierte la verificación sintética en aceptación real.

## 10. Corrección del switch global · hotfix local y release candidato 0.10.49

### 10.1 Contrato precisado

El operador aclaró que el control debe aceptar un clic desde la pantalla de espera, aunque sin llamada activa el canal saliente deba seguir en mute. Se separan por tanto dos estados:

- **Intención del switch:** en espera puede quedar ON/verde como `prepared`; el segundo clic lo devuelve a OFF.
- **Salida efectiva:** sin llamada activa permanece muted; no se habilita `MediaStreamTrack`, sender saliente ni captura de llamada. Al detectar cada llamada nueva se reinicia el switch y la salida a OFF/mute. El operador debe activar manualmente dentro de una llamada confirmada.
- **Prueba física previa:** `Probar micrófono` sigue siendo independiente; confirma dispositivo/nivel local, no la pista saliente de una llamada.

En llamada activa, el éxito visual depende de la verificación de pista/sender por el guard, no solo de la etiqueta CSS. Fin de llamada, desconexión, pérdida de ruta/sesión y error mantienen el remute fail-closed.

### 10.2 Hotfix provisional local

Se modificó la carpeta descomprimida que Chrome carga desde el directorio `signal-interpreter/extension`, preservando antes la versión anterior en un ZIP de rollback:

- Respaldo: `SI-extension-pre-global-mic-toggle-hotfix-20261112.zip`.
- Bytes: 918,856.
- SHA-256 cotejado con read-back: `88BFF761269D0D98AEB9354574CC7B737C2191FDE0D4643B8B0FB0CEE3F0BABF`.
- Sintaxis JavaScript: **26/26 PASS**.
- Referencias del manifiesto: **13/13 PASS**.
- `MICROPHONE_GLOBAL_TOGGLE_TEST=PASS` sobre el código provisional.

Chrome no se recargó desde esta ejecución; la actualización física del código del directorio no equivale a que el runtime de Chrome ya esté ejecutándolo. Queda pendiente pulsar Reload en `chrome://extensions` y comprobar el switch verde/preparado en la pantalla de espera. No se realizó llamada real ni se verificó pista acústica en este ciclo.

### 10.3 Integración formal y CI · 0.10.49

- Versión del manifiesto: **0.10.49**.
- Rama sincronizada: fix/global-mic-toggle-precall-20261112-main-sync.
- PR #92: [Release Signal Interpreter 0.10.49 — global microphone toggle](https://github.com/SeryMente/signal-interpreter/pull/92) · **CLOSED / MERGED**.
- Merge commit: 95f2fffedf4989eec451258f745178910089bcd1.
- HEAD probado de la PR: 8125e07c270f690c715bd56284a9035c64b643cc. La rama se creó desde el main vigente y preservó las actualizaciones concurrentes de observations/**. PR #91 se cerró sin merge por quedar divergente; PR #92 fue su reemplazo sincronizado.
- CI del HEAD exacto de PR #92:
  - Package integrity run 43280502635: **SUCCESS (8/8)**.
  - Signal Interpreter extension package run 43280502686: **SUCCESS (11/11)**.
  - Signal observability audit run 43280502833: **SUCCESS (46/46)**.
  - Native caption host build run 43280502873: **SUCCESS (10/10)**; el paso de sincronizar payload embebido fue omitido porque la fuente del host no cambió.
- Artefacto SignalInterpreter-extension-package, ID 13972461935, 916,294 bytes; SHA-256 del ZIP exterior 75d335b41b0ba0ed27923cc54bdfe29af4dfd7c7caec4f525fa6c0ab3509bed5. Paquete interno SignalInterpreter-0.10.49.zip, 923,661 bytes; SHA-256 d2956b3d95dd8d467735a8569ad0daba67b066e9e3bb71506231366adf06390d, coincidente con el sidecar.
- payload-sha256.json y los verificadores de release quedaron alineados con los hashes finales. Lectura de vuelta desde main: manifest 0.10.49; worker y popup contienen la semántica de intención preparada, salida bloqueada sin llamada, mute explícito al inicio y deadlines finitos.

### 10.4 Materialización local y aceptación pendiente

- El ZIP de release se descargó, se extrajo y se verificaron SHA-256 exterior/interior/sidecar antes de copiarlo.
- La carpeta de carga Chrome fue sustituida en C:\Users\fila4\Desktop\SeryMente\Repositorios\signal-interpreter\extension. Read-back: versión **0.10.49**, **49 archivos**, **1,702,759 bytes**.
- Hashes locales: manifiesto A019D2C9F584128AFE2334A5B15AA4DC209C03E54E3B7CA3C7DE65369298D2B4; worker FDCE9F7F50A75DCA1DA1E6C91B7D9EE4E0214118779B7A793DD1CC2E101FBD04; popup 6C9AA756486B59E98569C0EC4907F23661A6D9F7EC30030902306749F94454D4.
- Rollback previo a la sustitución formal: SI-extension-pre-0.10.49-20261112.zip, 919,287 bytes; SHA-256 cotejado FFBC3F9EA66CD4444902F736979976E6EFE59532AEE9693B9F69DC09348C7155. Se conserva también el respaldo anterior del paquete 0.10.48 y el backup previo al hotfix.
- **Aceptación operativa aún pendiente:** Chrome no se ha recargado después de sustituir la carpeta. Falta pulsar Reload en chrome://extensions, verificar visualmente el primer clic verde/preparado y el segundo clic OFF desde la pantalla de espera, y probar en una llamada controlada MIC OFF inicial, unmute manual, toggle de regreso a OFF y remute al cierre.
- También sigue pendiente verificar la salida de emergencia: desactivar/desinstalar la extensión, confirmar liberación de recursos y recargar la pestaña Cloud Interpreter para limpiar el wrapper MAIN-world del documento. No hubo llamada real ni captura acústica durante este ciclo; CI y hashes no equivalen a aceptación física del operador.

La versión 0.10.48 fue sustituida por 0.10.49 en la carpeta de carga local; no atribuir a 0.10.48 la corrección formal ni la aceptación de este contrato.


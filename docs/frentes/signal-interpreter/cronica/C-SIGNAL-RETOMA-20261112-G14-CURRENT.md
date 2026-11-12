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

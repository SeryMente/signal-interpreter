# Signal Interpreter · retoma 0.10.51 y prueba previa de salida de audio · 2026-11-14

## Procedencia de la retoma

- Export original: `C:\Users\fila4\Downloads\ChatGPT-SI-20261114-1437.md`.
- Perfil de destino verificado por RDC: `C:\Users\fila4`; dispositivo observado: `PC10RCIF4EI4`.
- Tamaño: 64,925 bytes. Última escritura observada: 2026-11-14 14:37:42, America/Mexico_City.
- SHA-256 del archivo original: `2137268ADDE3DFB2FC6AAA599EE0BE3448C2EE01A32F3F6A16CF17D5F0F56684`.
- El archivo permaneció privado en Downloads. Se leyó completo; no se copió el transcript íntegro al repositorio.

## Última salida visible del ciclo anterior — literal del export

14/11/2026, 2:13:46 p.m. · gpt-6-t-mini-mini

La revisión de escritura encontró un límite de operaciones del conector antes de poder confirmar cambios. Estoy comprobando el estado de la rama para asegurar que no haya quedado ninguna actualización parcial; si sigue intacta, aplicaré el paquete en lotes pequeños con comparación de SHA antes de avanzar.

La rama sigue intacta: no quedó ninguna escritura parcial. Estoy aplicando ahora una candidata `0.10.51` con permiso explícito de captura de pestaña, controles y una prueba de regresión; se mantiene en la PR de borrador y no altera `main`.

El código y las pruebas ya están en la rama; ahora estoy recalculando el inventario SHA-256 con los bytes efectivamente guardados por GitHub. No voy a actualizar el inventario hasta cotejar cada archivo, porque es la compuerta que impide distribuir una mezcla de versiones.

El export termina durante este ciclo; no contiene una respuesta final posterior.

## Gobierno y titularidad contrastados

- DUG canónico: Samantha v398; blob `410c85c9afd36202c1e56cb519c677f3bc0205a1`. El encabezado declara expresamente `Firma de Carga: NX-398m`, mientras que una línea posterior del mismo documento declara `Firma NX-397m`; discrepancia conservada, no corregida por inferencia.
- GOW: v2.25. Metacanon: 1.31. §ARR, ART-031, CNP (P044/P001/P004/P005/P038/P043), Metacanon §4 y ART-032 fueron consultados desde la fuente canónica.
- Control de responsabilidad: blob `2f02cab6b3697f31b2af3d141204c4431fbc05cb`; G14 ACTIVO, agente único; G13 SUSTITUIDO; alias UUIDv7 local `01a1bd8b-8291-7906-b862-6088593acfe5`. FOL1 PREPARADA/NO ACTIVA; folio PENDIENTE/NO ASIGNADO.
- El campo `revision_objeto_observada` del control aún apunta al blob OCP `6d1aeb99f3f710986b032a03073e02ee0f55d578`; el OCP leído en main antes de este asiento tenía blob `9d97fab8e3332c5e82b01e96d42f27a138189b8e`. Se registra como referencia interna desactualizada; el control no se modificó.
- MCP-NORMATIVO: DESACTIVADO. No se efectuó transferencia de titularidad ni se asignaron folios.

## Candidata y estado técnico verificado

- PR #95: https://github.com/SeryMente/signal-interpreter/pull/95
- Estado: OPEN / DRAFT / NOT MERGED; `mergeable=true`. Rama `fix/call-audio-isolation-20261113`; base `2ad9886878278a800d351dfde76a707d1f46e2e2`.
- `manifest.json` de la rama declara `0.10.51` (blob `a10b9f755193906efe7a9ea72ec34d88776d8b2d`). `payload-sha256.json` contiene 61 entradas (blob `c0b18de6dfe9d528cc5b6fe5db01bfdda9ddd8b6`).
- El preflight añade una prueba local de salida de audio de pestaña en la pantalla `/profile/<id>): `tabCapture` solicita audio solamente; inyecta un tono sintético, devuelve la captura a la salida, mide señal y requiere confirmación audible del operador. Bloquea llamada/ruta `/call/`, cancela y limpia la captura cuando comienza una llamada o cambia la ruta; no solicita micrófono, no graba ni transmite audio.
- En el HEAD previo `583d01171cee92c3cb02302f696b8ac0caa83730`, `Package integrity` verificó 61/61 SHA-256 y PASS de identidad/manifest/host y del contrato estático del preflight (run `43637790671`). También pasaron `Signal Interpreter extension package` y `native-caption-host-build`. `signal-observability-audit` falló solo en `Live Caption static audit`: la aserción buscaba la subcadena literal `/call/`, aunque la guarda de implementación usa el patrón escapado `^\\/call\\/` dentro de `activeCall()`. La regresión `tab-audio-preflight-test` sí pasó.
- Corrección en el único archivo `tools/live-caption-static-audit.mjs`: ahora verifica el bloque `activeCall()`, el estado `callState.callStartedAt`, el patrón escapado de ruta y `test(path)`. Commit `96a960f96d770486dca65aca8b96af0347d38fd7`; blob leído de vuelta `e5f79cf4b3fc4809f6ec1fe0307944d07d401e98`. La lectura de vuelta coincidió exactamente con el contenido escrito.
- El HEAD actual de la PR es `96a960f96d770486dca65aca8b96af0347d38fd7`, con 36 commits y 28 archivos modificados; GitHub informa `mergeable=true`. La consulta de workflows para este HEAD aún no devolvió ejecuciones. Los resultados del HEAD anterior no se atribuyen al nuevo commit.

## Límites y siguiente acción

- No hubo llamadas reales, captura/reproducción acústica en Chrome, recarga, aceptación del operador, merge, rebase, deploy ni release.
- El control G14 vigente prohíbe audio/captura real, llamadas reales y manipulación/recarga de Chrome. La función queda implementada y cubierta por pruebas sintéticas, no aceptada en dispositivo.
- La candidata usa manifiesto en la raíz del paquete y el README describe cargar esa raíz; antes de una futura carga debe reconciliarse esta disposición con la ruta operativa de extensión declarada en las reglas del frente. No se dio instrucción de carga ni se materializó localmente la candidata.
- Siguiente paso autorizado: revisar CI del HEAD `96a960f...`; mantener PR #95 en draft. La prueba acústica real requiere ampliar expresamente el alcance G14 y aceptación humana posterior.

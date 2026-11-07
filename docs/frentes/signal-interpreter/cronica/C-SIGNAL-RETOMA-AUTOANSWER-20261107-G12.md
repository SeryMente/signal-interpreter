# Crónica de retoma y diagnóstico Auto-Answer · G12 · 2026-11-07

## 1. Autoridad y continuidad

El operador indicó directamente retomar la responsabilidad del frente Signal Interpreter y continuar el trabajo en curso. Se ejecutó la sustitución cooperativa G11 → G12 en el único `CONTROL-RESPONSABILIDAD.json`.

- Evento: `SIGNAL-INTERPRETER-TRANSFER-20261107-G12-3DC1E417`.
- G11 `SES-20261107-6495BAA5`: `SUSTITUIDO`.
- G12: alias operativo `chatgpt-signal-interpreter-01a1b793-ab9f-70bc-bd23-03e83dc1e417`, UUIDv7 local `01a1b793-ab9f-70bc-bd23-03e83dc1e417`, generación 12, rol `agente_unico`, estado `ACTIVO`.
- Escritura condicionada al SHA del control observado y lectura de vuelta del blob/estado: PASS.
- No se expone ID nativo de conversación. El UUIDv7 es local y no lo sustituye.
- FOL1 sigue `PREPARADA, NO ACTIVA`; por ello no se asignan folios nuevos de conversación, ciclo, A ni B.

## 2. Ingesta del export 1350

Se leyó el archivo completo mediante RDC desde Downloads del perfil del operador. Se preservó una copia byte-exacta bajo la ruta privada heredada `originales/ChatGPT-SI-20261107-1350.txt`.

| Dato | Resultado |
|---|---|
| Tamaño | 33.818 bytes |
| Líneas físicas | 753 |
| SHA-256 del origen | `CDF60CA3DEBDE34EC74CAB6769376C0514362C8910FCD003A0EE698D3D9C60FC` |
| SHA-256 de la copia | `CDF60CA3DEBDE34EC74CAB6769376C0514362C8910FCD003A0EE698D3D9C60FC` |
| Cotejo origen/copia | MATCH EXACTO |
| Exclusión de Git | PASS mediante `.git/info/exclude` local |

El repositorio `SeryMente/signal-interpreter` es público. El TXT íntegro no se publica porque contiene conversación privada y telemetría operativa. Solo se publica este recibo saneado. La copia original queda verificada en el equipo del operador; **no debe describirse como respaldo remoto privado ni como persistencia remota del original**.

Recibo: [`evidencias/RECIBO-EXPORT-CHATGPT-SI-20261107-1350.json`](../evidencias/RECIBO-EXPORT-CHATGPT-SI-20261107-1350.json), blob `e707dea206a2b67a8ed98b4d6fc7f40aef9f1dcd`.

## 3. Estado técnico recuperado del último ciclo

La versión 0.10.42 y el hotfix de la ruta del popup constan en el export como estado local reportado. La lectura de `main` de este OCP muestra `manifest.json` 0.10.40; la candidata local 0.10.42 no se reconcilió con `main` en esta retoma. No se declara que ambas superficies sean equivalentes.

La llamada perdida observada alrededor de las 13:41 quedó descrita en la telemetría transcrita del export:

1. `INCOMING_DIALOG_DETECTED`: presente.
2. `CONNECT_BUTTON_FOUND`: presente.
3. `AUTO_ANSWER_AUTHORIZATION_BLOCKED`: repetido; razón agrupada `post-authorization-revalidation-failed`.
4. No consta `CONNECT_CLICKED` ni confirmación de conexión.

La evidencia apunta al segundo control de autorización, entre la concesión del permiso en `presence-guard.js` y la revalidación inmediatamente anterior al clic en `content.js`. El registro genérico no demuestra cuál predicado falló. El export reporta 12 bloqueos en el intervalo; no se infiere de ello una condición causal más específica.

## 4. Decisión técnica y límites

Siguiente corrección autorizada: instrumentar individualmente, con datos mínimos y sin contenido de llamada, los predicados de la revalidación posterior a la autorización: armado/disponibilidad, generación de presencia, preparación del runtime, vigencia del permiso, perfil/origen/ruta autorizados, continuidad del mismo diálogo/intento y estado/visibilidad/habilitación del botón. Añadir regresiones para cada razón y conservar el comportamiento fail-closed.

No debilitar OPI/VRI ni las condiciones de seguridad; no crear un clic alternativo; no registrar audio, transcripciones ni texto de diálogo. No recargar ni reiniciar Chrome, instalar una candidata, actuar sobre llamadas reales o declarar aceptación funcional desde esta instancia. El operador conserva las decisiones de ventana real, prueba funcional y liberación.

El clon local consultado estaba 29 commits detrás de `origin/main` y contenía cuatro archivos modificados y dos archivos no seguidos. No se sobrescribió ni se utilizó para cambios de código. El desarrollo siguiente debe partir de una base aislada y conservar ese estado local.

## 5. Fuentes metodológicas y checkpoint

- DUG canónico: v378 · NX-378m; Metacanon 1.28; GOW 2.17.
- Fuente normativa: `SeryMente/metodologia/main:gobernanza/METAPROMPT-CANONICO-SAMANTHA.html`, blob `ab64924bdf64dce8155a0be1655b92bfaa2bae01`.
- Aplicados §ARR, P004, P005, P037, P038, P041, P043 y remisiones ART-012/014/022/024.
- Ruta heredada del OCP conservada: `docs/frentes/signal-interpreter/`.
- Estado de producto observado en `main`: 0.10.40. Estado local 0.10.42: reportado por el export, pendiente de reconciliación.
- Estado real de llamada, aceptación funcional y liberación: pendientes del operador.

## 6. Estado de persistencia y salida visible

- Control G12: escritura y read-back verificados.
- Original del export: copia privada local exacta y excluida de Git; persistencia remota privada no establecida.
- Recibo público saneado: creado y leído de vuelta; crónica, núcleo y README quedan vinculados al cierre de esta transacción.
- Sin instalación, recarga de Chrome, manipulación de llamada real, despliegue o release.

IPZ: v0.7 · edad NO VERIFICADA.  
DUG: v378 · NX-378m · edad por calcular al cierre.  
CONV: CV-G PENDIENTE/NO ASIGNADO · OCP: CV-OCP-SI PENDIENTE/NO ASIGNADO.  
CICLO: CY-G PENDIENTE/NO ASIGNADO · OCP: CY-OCP-SI PENDIENTE/NO ASIGNADO.  
A: A-G PENDIENTE/NO ASIGNADO · OCP: A-OCP-SI PENDIENTE/NO ASIGNADO.  
B: B-G PENDIENTE/NO ASIGNADO · OCP: B-OCP-SI PENDIENTE/NO ASIGNADO.

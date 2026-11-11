# Crónica de recuperación del hilo Groq dual · G14 · 2026-11-10

## Identidad y procedencia

- Frente: Signal Interpreter.
- Responsable operativo registrado: G14, agente único, según CONTROL-RESPONSABILIDAD.json. No se modificó el control ni se creó una segunda instancia.
- Operador recuperó y pegó en la conversación actual el diálogo previo completo que empieza con “Cargando mensajes anteriores…” y termina solicitando asumir el frente Signal Interpreter.
- Original literal persistido: originales/CHATGPT-SI-RECUPERADO-GROQ-20261110.txt.
- Plan provisional persistido y reconciliado: INSTRUCCIONES-Y-PLAN-PROVISIONAL-GROQ-DIALOGO-20261110.md.
- No se afirma que el texto sea una exportación nativa de ChatGPT; es la transcripción literal suministrada por el operador.
- Fuente normativa leída: SeryMente/metodologia/main, gobernanza/METAPROMPT-CANONICO-SAMANTHA.html, blob 4db0ebadfd1e48b2bdec9236ba7f344921e4a865: DUG v388 · NX-388m; Metacanon 1.29; GOW 2.18. MCP normativo desactivado.

## Cambios documentales persistidos en main

| Artefacto | Acción | Commit | Read-back |
|---|---|---|---|
| originales/CHATGPT-SI-RECUPERADO-GROQ-20261110.txt | Creado, 18,830 caracteres del bloque recuperado | ab36c1589338d6c7a43f6d696d5b21642244b9bb | Coincidencia exacta de contenido |
| INSTRUCCIONES-Y-PLAN-PROVISIONAL-GROQ-DIALOGO-20261110.md | Recuperado de la rama candidata, copiado a main y ampliado con §8 de reconciliación | 419597f08fce5de1d8693695079550cc8397dd3d | Coincidencia exacta de contenido |
| REGLAS-OPERATIVAS.md | Incorporada SI-OP-03 desde candidata y añadido estado reconciliado | ca8f58eede5d2379971900d5cff325d958131f5f | Coincidencia exacta de contenido |
| OBJETO-CANONICO.md | Añadido §10 con propósito vigente, evidencia candidata, CI fallida, límites y pendientes | 0be467075e87cd29bfc6834beda7b41548b011b3 | Coincidencia exacta de contenido |

No se modificó código, paquete, manifest de producto, configuración local, control de responsabilidad ni metodología.

## Reconciliación del contexto constructor

La conversación recuperada contiene salidas previas que informaban distintos estados de implementación y CI. Esas salidas se preservan literalmente, pero sus afirmaciones no se tratan como evidencia actual hasta verificar el repositorio.

### Candidata revisada

- PR #83: OPEN/DRAFT/no merged.
- Rama: candidate/whisper-interpreter-live-20261110.
- HEAD: 4737823873f826f80346cd817b877c6664769f20.
- Última actualización visible de PR: 2026-11-10T23:58:56Z (17:58:56, Ciudad de México).
- 115 commits; 39 archivos cambiados; 2,489 adiciones y 145 eliminaciones.
- Comparación contra main: 115 ahead, 783 behind, diverged.

### Implementación inspeccionada estáticamente

Hay código para captura explícita de audio remoto y micrófono en pistas separadas; AudioWorklet y ventanas WAV mono PCM16 a 16 kHz; transcriptor Groq Large V3; compuertas de llamada activa, configuración, ZDR declarativo y credencial; colas separadas/concurrentes; reconciliación cronológica; handlers del service worker; envío de segmentos y recepción en overlay.

El core visual mapea groq-interpreter → INTÉRPRETE y groq-remote → AUDIO REMOTO · NO VERIFICADO. Esto confirma el mapeo de código, no la identidad de participantes remotos.

La hipótesis anterior de que los handlers del worker no existían quedó corregida: en el HEAD revisado sí están presentes los manejadores SIGNAL_GROQ_DIALOGUE_POLICY_GET, SIGNAL_GROQ_DIALOGUE_CAPTURE_START, SIGNAL_GROQ_DIALOGUE_CHUNK y SIGNAL_GROQ_DIALOGUE_CAPTURE_STOP, además del flujo de segmentos del overlay.

### Estado de CI en el HEAD actual

| Workflow | Run | Resultado |
|---|---:|---|
| Package integrity | 42927711704 | FAILURE: discrepancias SHA-256/invariantes |
| signal-observability-audit | 42927711800 | FAILURE: Global overlay toggle and hotload lifecycle regression |
| native-caption-host-build | 42927712133 | FAILURE: Payload SHA-256 mismatch en extension/background.js |

Varias pruebas específicas de Groq/captura quedan omitidas al detenerse etapas anteriores. No se repitió CI durante esta recuperación. Los 3/3 SUCCESS presentes en salidas históricas pertenecen a una cabeza anterior, no al HEAD actual.

### Límite de lo demostrado

La inspección de código y archivos de prueba es evidencia estática. No demuestra ejecución de pruebas locales, permisos reales, calidad acústica, captura física, endpoint Groq, cuenta/clave, ZDR de proveedor, llamada real, vista real en Chrome ni aceptación funcional.

## Decisiones vigentes

1. Un diálogo único, cronológico y bien presentado con dos fuentes separadas: audio remoto y micrófono propio del intérprete.
2. Ambas fuentes deben progresar en paralelo; no mezclar pistas antes de transcribir ni serializar canales.
3. whisper-large-v3 es el default operativo de calidad para ambos canales; Turbo no es fallback silencioso.
4. Usar verbose_json, temperatura 0 y timestamps por segmento en el camino crítico.
5. Etiquetar micrófono propio como INTÉRPRETE por procedencia.
6. Salida remota sin speaker metadata verificable: AUDIO REMOTO · HABLANTE NO VERIFICADO; no inferir LEP/proveedor.
7. Conservar solapamientos reales y deduplicar solo solapamientos idénticos de la misma fuente/ventana.
8. La casilla ZDR solo es una declaración local; debe activarse únicamente después de que el operador verifique ZDR en la consola de Groq.
9. Mantener audio crudo y texto clínico fuera de telemetría, exportes diagnósticos, logs, repositorio y bases generales.
10. El micrófono saliente, Connect, presencia y controles de llamada conservan sus guards fail-closed. La captura para transcripción es un carril independiente y no autoriza a habilitar el audio saliente.
11. Sin captura real, llamadas reales, credenciales, reload de Chrome, merge, deploy, release o aceptación por parte de este ciclo.

## Pendientes de siguiente ejecución

1. Corregir hashes e invariantes del paquete y leer de vuelta cada actualización.
2. Corregir la regresión overlay/hotload sin debilitar controles de seguridad.
3. Resolver el SHA mismatch del instalador y volver a ejecutar los tres workflows en un solo HEAD exacto.
4. Ejecutar suites sintéticas de captura, WAV, Groq mock, motor, colas y overlay; separar PASS ejecutado de test existente.
5. Revisar flujo nuevo versus legacy native-text-only para eliminar rutas ambiguas.
6. Verificar UI/role labels, parciales, cronología y ciclo de vida en pruebas controladas/headless.
7. Medir RPM/ASH, coste, latencia p50/p95, WER/CER, pérdida/duplicados y deriva sobre corpus autorizado.
8. Preparar compuerta de aceptación manual para el operador; no activar el producto sin su autorización.

## Cierre del evento

- Conversación recuperada: PERSISTIDA y read-back exacto.
- Plan provisional: PERSISTIDO y read-back exacto.
- SI-OP-03: PERSISTIDA en reglas y read-back exacto.
- OCP §10: PERSISTIDO y read-back exacto.
- PR #83: sin cambios.
- Código/CI/Chrome: sin cambios ni nuevas ejecuciones.
- G14: se mantiene el control preexistente; no se simula transferencia ni nuevo folio.
- FOL1: PREPARADA, NO ACTIVA; no asignado.

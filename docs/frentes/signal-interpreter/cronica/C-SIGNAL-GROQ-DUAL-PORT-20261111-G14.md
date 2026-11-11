# Crónica de integración selectiva Groq dual · G14 · 2026-11-11

## Propósito y autorización

El operador autorizó expresamente resolver el frente de extremo a extremo y asumió la responsabilidad del manejo de datos. La autorización permitió inspección, reparación, pruebas sintéticas, trabajo local en una copia temporal, actualización de ramas y PRs. No se infiere que existan credenciales o acceso a una cuenta Groq: no se encontró una clave disponible en el entorno de prueba conectado y no se ejecutó ninguna llamada con audio real.

La especificación funcional sigue siendo la conversación recuperada y SI-OP-03: un diálogo cronológico, dos fuentes independientes y concurrentes, audio remoto neutral cuando no hay metadata verificable y micrófono propio etiquetado INTÉRPRETE.

## Corrección de trazabilidad A-01

Se detectó que el bloque A-01 del plan no reproducía exactamente la última frase del operador. Se corrigió en `main` y en la rama candidata:

- Texto recuperado: `Calidad maxima. Reportame en 10 minutos.`
- Texto previo incorrecto: `Calidad maxima. No me conformare con menos`

Se efectuó lectura de vuelta exacta. A-02, A-03 y A-04 ya coincidían con la conversación preservada. El archivo recuperado sigue siendo texto aportado por el operador, no una exportación nativa de ChatGPT.

## Diagnóstico y reparaciones

1. La CI original de PR #83 fallaba por nueve SHA-256 desactualizados en el inventario. Se reconciliaron contra los valores calculados por el propio job de integridad para ese HEAD.
2. La suite dual tenía dos fixtures mal escapados: uno no introducía el carácter Unicode de ancho cero y otro buscaba los caracteres literales `\\n\\n` en vez de saltos de párrafo. Se corrigieron los fixtures y sus hashes.
3. La prueba del overlay fallaba antes de alcanzar sus aserciones funcionales porque verificaba el mismo inventario inconsistente. Tras la corrección, la prueba pasó sin debilitar los guards.
4. La revisión de captura detectó un caso fail-open: la ausencia de `displaySurface` se aceptaba. Se cambió a exigir exactamente `displaySurface === "browser"`; metadata ausente, ventana o monitor rechazan la captura antes de solicitar el micrófono. Se añadieron pruebas sintéticas para metadata ausente y superficie no-browser.
5. Se confirmó que el camino legacy `startGroqCapture/handleGroqAudioChunk` responde `native-text-only`; no se encontró un emisor activo desde la UI para esos mensajes. La nueva ruta usa `SIGNAL_GROQ_DIALOGUE_*`.

## Integración selectiva sobre main

PR #83 contenía una historia divergente y no se fusionó. Se creó una rama nueva desde el `main` vigente y se portaron selectivamente los archivos de producto, manifiestos, guards, pruebas e inventario necesarios.

- PR #83: cerrada sin merge, supersedida por PR #84.
- PR #84: https://github.com/SeryMente/signal-interpreter/pull/84
- Rama: `feat/groq-dual-main-20261111`
- Base main observada al crearla: `6285e325fad6032360f171187839c2948fff6b43`
- HEAD documentado: `03fc895dbe682be3bd9f944ee68951a4e815bc16`
- 30 archivos cambiados; 1,686 adiciones y 109 eliminaciones al crear el PR.
- PR #84 permanece draft, abierto y sin merge. `main` no recibió código de producto.

## Evidencia de ejecución

### Pruebas locales en la rama basada en main

- Inventario: 66/66 SHA-256 PASS.
- Verificador de paquete y ocho suites de seguridad/regresión: PASS.
- 43 pruebas de observabilidad, regresión, overlay, guards y layout: PASS.
- Cuatro suites Groq/diálogo dual: captura, WAV, transcriptor y motor: PASS.
- Prueba de revocación de política y liberación de pistas: PASS.
- Prueba de superficie de navegador fail-closed: PASS.
- JavaScript syntax en CI: PASS.
- Parser Windows PowerShell 5.1 e identidad de extensión: PASS.
- Archivo de distribución: manifiestos root/subcarpeta presentes y directorio de observabilidad excluido: PASS.

### CI de PR #84 · HEAD 03fc895d

- Package integrity · run `42939190917`: SUCCESS.
- signal-observability-audit · run `42939190945`: SUCCESS.
- native-caption-host-build · run `42939191050`: SUCCESS.

Los tres workflows corresponden al mismo HEAD `03fc895dbe682be3bd9f944ee68951a4e815bc16`.

### Prueba de Chrome

Se intentó cargar la extensión desde la subcarpeta `extension` en un perfil Chrome temporal, aislado del perfil habitual. El navegador está administrado por la organización y muestra que Developer Mode / Load unpacked están controlados por política. No se consiguió cargar la extensión en ese entorno. Se eliminaron el perfil y los procesos temporales; el perfil habitual no fue modificado. Esto es un bloqueo del entorno, no una prueba de fallo de la extensión.

## Groq: cuota, coste y compuertas aún pendientes

La documentación pública consultada el 2026-11-11 confirma:

- Speech-to-Text: `whisper-large-v3` cuesta USD 0.111 por hora de audio; longitud mínima facturada 10 segundos; el modelo recomendado por Groq para casos multilingües sensibles a errores.
- La página Rate Limits publica para Whisper 20 RPM y 7.2K ASH en su tabla base.
- La página Supported Models publica valores distintos (300 RPM y 200K ASH). La documentación pública no es consistente; los límites exactos de la organización deben verificarse en la consola de la cuenta.

Referencias oficiales:
- https://console.groq.com/docs/speech-to-text
- https://console.groq.com/docs/rate-limits
- https://console.groq.com/docs/models

Con la ventana candidata actual de 6.5 s, paso de 6 s y dos fuentes, el máximo teórico es 20 peticiones/minuto y 7,800 segundos de audio enviados por hora de reloj si ambas pistas están activas continuamente. Aplicando el mínimo facturable de 10 s, 1,200 peticiones/hora equivaldrían a 12,000 segundos facturables y aproximadamente USD 0.37 por hora de llamada simultánea, antes de reintentos u otros cargos. Es una estimación derivada de la tarifa pública, no un cargo observado.

Por ello, 6.5 s / 500 ms de solapamiento sigue siendo un parámetro candidato, no un óptimo ratificado. No se ha confirmado la cuota real de la cuenta ni se ha medido WER/CER, latencia p50/p95, deriva, pérdidas, duplicados o coste real.

## Límites de aceptación

- No se encontró `GROQ_API_KEY`, `SIGNAL_GROQ_API_KEY` ni `extension/groq-secret.local.js` en el entorno temporal conectado.
- No se usó la API Groq con audio; no se capturó audio real ni se abrió una llamada.
- ZDR no fue verificado en la cuenta; la casilla sigue siendo una declaración operativa del usuario.
- Los toggles `groqDialogueEnabled` y `groqZeroDataRetentionConfirmed` permanecen false por defecto.
- No se persistió audio ni texto clínico en logs, telemetría, repositorio o bases generales.
- No hubo aceptación funcional en Chrome, merge, deploy o release.

## Siguiente secuencia

1. Verificar en la cuenta Groq ZDR y límites exactos (RPM, ASH, tamaño, coste).
2. Colocar la clave en el archivo local ignorado `extension/groq-secret.local.js`; nunca enviarla por chat ni publicarla.
3. Ejecutar una prueba real con audio sintético bilingüe no clínico, medir WER/CER y latencia por fuente y revisar el coste.
4. Cargar la extensión en un Chrome donde el operador tenga permiso de Load unpacked y verificar el flujo completo en una llamada controlada.
5. Obtener aceptación explícita del operador antes de merge, activación de producción o release.

G14 permanece como agente único. FOL1 continúa PREPARADA / NO ACTIVA; no se asigna folio nuevo ni se simula transferencia de titularidad. MCP normativo permanece DESACTIVADO.

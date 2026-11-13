# Signal Interpreter · continuidad y aislamiento de audio · 2026-11-13

## Resultado del ciclo

- PR #95 permanece OPEN / DRAFT / NOT MERGED y mergeable=true.
- HEAD exacto verificado: `c6dc398cf66c2f081e3eea151e78241cf54cba44`.
- Base de PR: `2ad9886878278a800d351dfde76a707d1f46e2e2` (main, 0.10.50).
- Los cuatro workflows de GitHub Actions terminaron SUCCESS sobre el mismo HEAD:
  - Package integrity: run `43460003877`.
  - Signal Interpreter extension package: run `43460003924`.
  - signal-observability-audit: run `43460004062`.
  - native-caption-host-build: run `43460003922`.
- No reutilizar ni atribuir esos checks a un SHA distinto.

## Incidencia CI y corrección

El primer HEAD de PR (`664d64d94f1fbb322cc63c6a0429406f729f5a26`) produjo 3/4 workflows SUCCESS. El audit falló en `tools/call-earnings-baseline-tests.mjs`: la prueba localizaba el final de `startCall` buscando `var callAlertInFlight`, pero el helper ya no existía tras eliminar las alertas de llamada. Se cambió el delimitador por `function alertOnConnect(event)`, límite funcional estable que permanece después de `startCall`. La prueba local `CALL_EARNINGS_BASELINE_TEST=PASS`; commit adicional `c6dc398cf66c2f081e3eea151e78241cf54cba44`. Los cuatro workflows se volvieron a ejecutar y finalizaron SUCCESS.

## Diagnóstico estático de audio

- No se encontró uso de `setSinkId`, `RTCRtpSender.setParameters`, `createMediaStreamDestination` ni `DynamicsCompressorNode` en el código de extensión inspeccionado.
- `extension/mic-guard-main.js` envuelve `getUserMedia`, `RTCPeerConnection.addTrack/addTransceiver/getSenders`, `RTCRtpSender.replaceTrack` y `MediaStreamTrack.clone` únicamente para identificar las pistas de audio y aplicar/verificar `MediaStreamTrack.enabled` según el estado mute. No inserta procesadores de audio, no cambia restricciones de captura y no sustituye la pista RTP por una pista procesada.
- No se encontró inserción de filtro, compresión, limitador, ecualización o resampling en la ruta RTP original de micrófono. Es una conclusión de inspección estática, no una medición de señal enviada.
- La captura Groq de PR #84 usa un `getUserMedia` independiente para el micrófono y solicita `echoCancellation=true`, `noiseSuppression=true`, `autoGainControl=true`; esa pista es para transcripción y no se ha demostrado idéntica a la pista saliente que recibe el cliente.
- El AudioWorklet de Groq pone a cero su salida y no reinyecta esa captura en `context.destination`.
- En la extensión principal, la alerta/beep/TTS post-respuesta y post-confirmación de ruta se retiraron; los tonos MIC se suprimen si existe llamada activa; el control manual de prueba de sonido se bloquea mientras la llamada permanece activa. El evento `CONNECT_ACCEPTED_PENDING` no reproduce audio.
- Los tonos de feedback MIC y la prueba manual de sonido se mantienen fuera de llamada activa. No se alteró la lógica del guard ni el flujo de mute/unmute.

## Validación local sobre el HEAD de PR #95

- `CALL_AUDIO_ISOLATION=PASS`.
- `MICROPHONE_MAIN_GUARD_TEST=PASS`.
- `MICROPHONE_GLOBAL_TOGGLE_TEST=PASS`.
- `MICROPHONE_FEEDBACK_TEST=PASS`.
- `CALL_CAPTION_NATIVE_ONLY_RUNTIME_TEST=PASS`.
- `autoanswer-runtime-guard`: 15 checks PASS sobre Node VM/APIs sintéticas.
- `HOTLOAD_CAPTION_RUNTIME_TEST=PASS`.
- `HOTLOAD_ACTIVE_CALL_PREFLIGHT=PASS`.
- `CALL_EARNINGS_BASELINE_TEST=PASS` después de actualizar su delimitador estructural.
- `SIGNAL_INTERPRETER_LONGITUDINAL_REGRESSION=PASS`.
- `node --check` de los JS runtime y pruebas modificadas/nuevas: PASS.
- `verify-release-package`: 60/60 SHA-256 PASS; identidad del manifiesto y hash del host nativo PASS.
- `git diff --check`: PASS.
- Worktree de PR limpio tras publicar `c6dc398c...`.

## Límites: calidad y aceptación

- No se ejecutó llamada real ni captura de micrófono/audio remoto real.
- No se midió nivel, clipping, SNR, frecuencia, jitter, pérdida, ganancia, latencia acústica ni calidad perceptual con A/B.
- No se verificó en el extremo receptor del cliente la forma de onda RTP ni la reproducción en auriculares del intérprete.
- La inspección respalda que el guard de extensión no procesa el audio RTP; no excluye procesamiento interno de Cloud Interpreter, del navegador, del dispositivo de audio o de la plataforma remota.
- No se llamó a Groq con audio, no se verificó ZDR/cuotas en consola y no se habilitaron claves/flags.
- No se cargó/recargó Chrome, no hubo aceptación humana, merge, deploy ni release.
- El checkout divergente preexistente permaneció intacto; la rama de PR se trabajó en un worktree limpio en Fila 4.

## Siguiente acción

El bloqueo que queda no es de CI ni de integridad del paquete. Es la validación acústica real y controlada en Chrome autorizado: medir por separado (1) el audio remoto que escucha el intérprete y (2) el micrófono que recibe el cliente. Registrar dispositivo, ruta, formato, nivel RMS/peak, clipping y comparación A/B, sin conservar audio clínico ni transcripciones privadas. Mantener PR #95 en draft hasta que exista esa evidencia y aceptación explícita.

## Gobierno

DUG v393 · NX-393m; Metacanon 1.31; GOW 2.21; fuente blob `844fc507a2a9a0bfc8f4e68884cca9f6d2912c96`. Control reread: G14 ACTIVO, agente único; G13 SUSTITUIDO; FOL1 PREPARADA/NO ACTIVA; folios PENDIENTES/NO ASIGNADOS. MCP normativo DESACTIVADO.

## Reconciliación final de base y archivos de PR

- `main` avanzó a `163d79cf867b0fc4ffb5a9385fa8cdcacd48ed6c` por tres commits documentales posteriores al base de PR; no se incorporaron cambios de producto adicionales en ese avance.
- Comparación `main...fix/call-audio-isolation-20261113`: rama 2 commits adelante y 3 detrás, con merge-base `2ad9886878278a800d351dfde76a707d1f46e2e2`.
- Lectura directa de `GET /pulls/95`: `mergeable=true`, `mergeable_state=clean`; la discrepancia de una lectura normalizada previa (`mergeable=false`) no se mantuvo en la respuesta REST actual.
- Archivos del diff de PR (7): workflow de audit, background, content, inventario SHA-256, prueba nueva de aislamiento, prueba de earnings actualizada y prueba del guard de micrófono. `observations/**` no forma parte del diff.
- PR #95 sigue OPEN / DRAFT / NOT MERGED. No se hizo merge, rebase, release ni deploy.


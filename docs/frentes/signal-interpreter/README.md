# Frente de trabajo — Signal Interpreter

El [núcleo operativo único](OBJETO-CANONICO.md) contiene propósito, gobierno, permisos, estado, aceptación, pendientes y mapa de consulta. Leerlo primero y adquirir sus fuentes obligatorias; este README no es otro estado.

- `antecedentes/`: corte íntegro histórico, no gobierno activo paralelo.
- `originales/`: mensajes disponibles con procedencia, secuencia y límites.
- `cronica/`: explicación de acciones, evidencia, límites y checkpoint.
- `evidencias/`: recibo de fuentes/migración y comprobaciones.
- [Prompt operativo único de Signal Interpreter](PROMPT-SIGNAL-INTERPRETER.md) · una instancia responsable; no hay prompts ni papeles paralelos.
- [Backlog provisional de retroalimentación de llamada · 2026-10-30](BACKLOG-RETROALIMENTACION-LLAMADA-20261030.md) · persistido en `main`; seis tareas pendientes, no implementadas.

Repositorio público: no cargar originales privados, secretos ni datos de llamadas. Código/artefactos operativos permanecen en sus rutas de distribución; sus referencias están en el núcleo. La ruta antigua remite aquí sin sostener estado.

- [Cronica de retoma G9 a G10 - 2026-11-06](cronica/C-SIGNAL-RETOMA-20261106-G10-95D9F8B5.md) y [recibo del export](evidencias/RECIBO-EXPORT-CHATGPT-SI-20261106-1517.json). El original se conserva byte-exacto solo en la copia local originales/ChatGPT-SI-20261106-1517.txt, excluida de Git; no se publica por contener detalles privados y telemetria relacionada con llamadas.
- [Crónica de retoma G10→G11 - 2026-11-07](cronica/C-SIGNAL-RETOMA-20261107-G11-6495BAA5.md) y [recibo saneado del export](evidencias/RECIBO-EXPORT-CHATGPT-SI-20261107-1105.json). El original fue leído y su SHA cotejado, pero no se copió al OCP ni se publicó; custodia privada pendiente.

- [PR #71 fusionada](https://github.com/SeryMente/signal-interpreter/pull/71) en `main` mediante merge commit `2546d967f15759c2eabac7b4026cc5b4f1cbd081`; `manifest.json` declara 0.10.40. CI de PR y post-merge PASS. La carpeta registrada por Chrome ya contiene 0.10.40 y está preparada para recarga manual; la aceptación funcional real, observabilidad E2E y liberación siguen pendientes. Véase [crónica G11, sección 14](cronica/C-SIGNAL-RETOMA-20261107-G11-6495BAA5.md).

- [Crónica de retoma G11→G12 · 2026-11-07](cronica/C-SIGNAL-RETOMA-AUTOANSWER-20261107-G12.md) y [recibo saneado del export 13:50](evidencias/RECIBO-EXPORT-CHATGPT-SI-20261107-1350.json). El original se copió byte-exacto a `originales/ChatGPT-SI-20261107-1350.txt` en custodia local privada; SHA-256 origen/destino coincide (`CDF60CA3DEBDE34EC74CAB6769376C0514362C8910FCD003A0EE698D3D9C60FC`) y quedó excluido de Git. No se publicó ni se estableció respaldo remoto privado del original.
- [Crónica de corrección urgente de missed calls / Auto-Answer G13 · 2026-11-08](cronica/C-SIGNAL-MISSED-CALL-AUTOANSWER-20261108-G13-D8FB3E62.md): diagnóstico, cambio 0.10.41, pruebas sintéticas, paquete local y límites de aceptación.
- **Responsabilidad actual:** G13 ACTIVO, generación 13, evento `SIGNAL-INTERPRETER-TRANSFER-20261108-G13-D8FB3E62`; UUIDv7 local `01a1bca3-e123-74f7-b884-5792d8fb3e62`; folio pendiente mientras FOL1 no esté activa.
- **Estado de producto:** `main/manifest.json` continúa en 0.10.40. La candidata 0.10.41 está en PR [#74](https://github.com/SeryMente/signal-interpreter/pull/74), aún no fusionada. La carpeta local `EP/Signal-Interpreter/extension` de PC-13 quedó preparada y verificada con 59/59 hashes SHA-256; el operador conserva la recarga manual y la aceptación funcional. El backlog SI-FB-01–SI-FB-06 se abordará en el siguiente ciclo.

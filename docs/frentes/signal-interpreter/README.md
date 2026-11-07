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

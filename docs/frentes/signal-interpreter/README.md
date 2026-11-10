# Frente de trabajo — Signal Interpreter

El [núcleo operativo único](OBJETO-CANONICO.md) contiene propósito, gobierno, permisos, estado, aceptación, pendientes y mapa de consulta. Leerlo primero y adquirir sus fuentes obligatorias; este README no es otro estado.

- `antecedentes/`: corte íntegro histórico, no gobierno activo paralelo.
- `originales/`: mensajes disponibles con procedencia, secuencia y límites.
- `cronica/`: explicación de acciones, evidencia, límites y checkpoint.
- `evidencias/`: recibo de fuentes/migración y comprobaciones.
- [Prompt operativo único de Signal Interpreter](PROMPT-SIGNAL-INTERPRETER.md) · una instancia responsable; no hay prompts ni papeles paralelos.
- [Backlog provisional de retroalimentación de llamada · 2026-10-30](BACKLOG-RETROALIMENTACION-LLAMADA-20261030.md) · persistido en `main`; estados SI-FB-01–06 reconciliados y SI-REG-01–04 añadidas para las regresiones reportadas el 2026-11-10. Véase [crónica G14](cronica/C-SIGNAL-BACKLOG-REGRESIONES-20261110-G14.md).

Repositorio público: no cargar originales privados, secretos ni datos de llamadas. Código/artefactos operativos permanecen en sus rutas de distribución; sus referencias están en el núcleo. La ruta antigua remite aquí sin sostener estado.

- [Cronica de retoma G9 a G10 - 2026-11-06](cronica/C-SIGNAL-RETOMA-20261106-G10-95D9F8B5.md) y [recibo del export](evidencias/RECIBO-EXPORT-CHATGPT-SI-20261106-1517.json). El original se conserva byte-exacto solo en la copia local originales/ChatGPT-SI-20261106-1517.txt, excluida de Git; no se publica por contener detalles privados y telemetria relacionada con llamadas.
- [Crónica de retoma G10→G11 - 2026-11-07](cronica/C-SIGNAL-RETOMA-20261107-G11-6495BAA5.md) y [recibo saneado del export](evidencias/RECIBO-EXPORT-CHATGPT-SI-20261107-1105.json). El original fue leído y su SHA cotejado, pero no se copió al OCP ni se publicó; custodia privada pendiente.

- [PR #71 fusionada](https://github.com/SeryMente/signal-interpreter/pull/71) en `main` mediante merge commit `2546d967f15759c2eabac7b4026cc5b4f1cbd081`; la referencia 0.10.40 y su preparación de carpeta son un corte histórico, no la versión actual. Véase [crónica G11, sección 14](cronica/C-SIGNAL-RETOMA-20261107-G11-6495BAA5.md).

- [Crónica de retoma G11→G12 · 2026-11-07](cronica/C-SIGNAL-RETOMA-AUTOANSWER-20261107-G12.md) y [recibo saneado del export 13:50](evidencias/RECIBO-EXPORT-CHATGPT-SI-20261107-1350.json). El original se copió byte-exacto a `originales/ChatGPT-SI-20261107-1350.txt` en custodia local privada; SHA-256 origen/destino coincide (`CDF60CA3DEBDE34EC74CAB6769376C0514362C8910FCD003A0EE698D3D9C60FC`) y quedó excluido de Git. No se publicó ni se estableció respaldo remoto privado del original.
- [Crónica de corrección urgente de missed calls / Auto-Answer G13 · 2026-11-08](cronica/C-SIGNAL-MISSED-CALL-AUTOANSWER-20261108-G13-D8FB3E62.md): diagnóstico, cambio 0.10.41, pruebas sintéticas, paquete local y límites de aceptación.
- **Responsabilidad actual:** G14 ACTIVO, agente único, según `CONTROL-RESPONSABILIDAD.json`; FOL1 PREPARADA, NO ACTIVA; folio pendiente/no asignado.
- **Estado actual de producto:** `main/manifest.json` declara 0.10.47; PR #79/#78 fusionadas; PR #80 draft/no mergeable. El workspace fila4 repitió pruebas sintéticas: Presence Guard 85, Presence Connect 35, Auto-Answer Runtime 15, Microphone Guard PASS y paquete 60/60. No hubo reload Chrome ni aceptación E2E. SI-REG-05 registra conflicto estático entre unmute inmediato prellamada y política de mute durante espera/timbrado.
- **Backlog vigente:** SI-FB-01–SI-FB-06 y SI-REG-01–SI-REG-05. Véase [crónica de retoma G14 · 2026-11-10](cronica/C-SIGNAL-RETOMA-20261110-G14-CURRENT.md) para la salida literal, pruebas repetidas, CI observado, límites y checkpoint.

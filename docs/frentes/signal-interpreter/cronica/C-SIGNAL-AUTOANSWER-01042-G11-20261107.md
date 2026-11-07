# Crónica · Auto-Answer 0.10.42 · G11 · 2026-11-07

## Disparador y diagnóstico

Tras instalar la candidata 0.10.41, el operador informó que el switch «Estoy disponible» se apagaba inmediatamente. La inspección de la carpeta exacta cargada por Chrome mostró un desacuerdo entre el manifiesto instalado (`action.default_popup = ui/popup.html`) y el valor fijo exigido por `popup(sender)` (`extension/ui/popup.html`).

La discrepancia hacía que el worker respondiera `popup-only` a `SIGNAL_PRESENCE_STATUS` y `SIGNAL_PRESENCE_ARM`. El popup recibía un estado no autorizado y volvía a representarse desarmado. La causa se reprodujo leyendo ambos manifiestos y el guard; no fue necesario inferir un fallo de idle ni del sistema operativo.

## Cambio 0.10.42

`popup(sender)` obtiene ahora la ruta autorizada de `chrome.runtime.getManifest().action.default_popup` y la resuelve con `chrome.runtime.getURL()`. Se mantienen la comprobación de ID de extensión y la prohibición de remitentes con tab. No se amplía la superficie de autorización: solo se acepta la página popup declarada por el manifiesto activo.

Se agregaron pruebas para las dos estructuras: manifiesto de raíz de repositorio (`extension/ui/popup.html`) y manifiesto ya instalado en la raíz de la carpeta de extensión (`ui/popup.html`). También se prueba que una página de extensión distinta siga recibiendo `popup-only`.

## Pruebas y paquete

- `presence-guard`: 65/65 PASS.
- `presence-connect`: 33/33 PASS.
- `autoanswer-runtime-guard`: 15/15 PASS.
- Verificador del paquete: 59/59 hashes PASS; ID de extensión y hash del host nativo PASS.
- Suites focalizadas adicionales: 13 PASS, para 16 comandos de prueba en total.
- Inventario SHA-256 regenerado íntegramente desde los 59 payloads.
- Sintaxis del guard y `git diff --check`: PASS.

Las pruebas no ejecutan Chrome real ni aceptan llamadas reales.

## Escritura local, custodia y límites

La carpeta activa es `C:\Users\fila4\Desktop\SeryMente\Signal Interpreter\extension`. Se respaldaron primero `manifest.json` y `presence-guard.js` de 0.10.41 en `C:\Users\fila4\Desktop\SI-backups\SI-0.10.41-before-0.10.42-popup-path-fix-20261107\extension`, cotejando SHA-256 y tamaño de ambos archivos. Después se instalaron solo esos dos archivos. Read-back:
- versión del manifiesto: 0.10.42;
- ruta del popup instalado: `ui/popup.html`;
- clave/ID de extensión conservados;
- `presence-guard.js` SHA-256: `A875587577E3829ABA8DCC070351DA96DE4702BD6CB1D7D4C79E14201320C34C`.

No se modificó Native Messaging. Chrome no se recargó por RDC ni se reinició. El operador debe recargar manualmente y volver a confirmar disponibilidad. No se generó, aceptó ni manipuló ninguna llamada real; la aceptación funcional continúa pendiente.

Rama: `work/g11-presence-continuity`. PR [#72](https://github.com/SeryMente/signal-interpreter/pull/72), abierta y no fusionada. `main` permanece en 0.10.40; no hay release.

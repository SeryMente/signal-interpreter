# Crónica · corrección urgente de missed call / Auto-Answer · 2026-11-08 · G13

## Identidad y alcance

- Frente: Signal Interpreter · repositorio `SeryMente/signal-interpreter`.
- Responsable: G13 ACTIVO, instancia única. Evento de transferencia: `SIGNAL-INTERPRETER-TRANSFER-20261108-G13-D8FB3E62`.
- Alias operativo: `chatgpt-signal-interpreter-01a1bca3-e123-74f7-b884-5792d8fb3e62`; UUIDv7 local `01a1bca3-e123-74f7-b884-5792d8fb3e62`. Folio de sesión y folios CV/CY/A/B: PENDIENTES/NO ASIGNADOS porque FOL1 sigue PREPARADA, NO ACTIVA.
- Gobierno consultado desde `SeryMente/metodologia/main`: DUG v383 · NX-383m, blob `cad464717c43733aa84b49f8c9c3af0875597fbd`; Metacanon 1.29; GOW 2.18. §ARR consultado. MCP-NORMATIVO DESACTIVADO.
- Alcance autorizado: resolver el bloqueo de Auto-Answer que causó llamadas perdidas, preparar la carpeta `EP/Signal-Interpreter/extension` en PC-13 para recarga manual y dejar el backlog SI-FB-01–SI-FB-06 para el siguiente ciclo. Sin GUI, Chrome reload, llamada real, aceptación, release ni deploy.

## A. Evidencia del incidente

Fuente principal: [batch-a44813e8-0477-4952-a398-a99f6443b1d1.json](https://github.com/SeryMente/signal-interpreter/blob/main/observations/batches/batch-a44813e8-0477-4952-a398-a99f6443b1d1.json), blob `9418b9611eec2a1e8dfe45fac0a35d7865ab871f`; informe correlacionado [incoming-calls-10m.json](https://github.com/SeryMente/signal-interpreter/blob/main/observations/latest/incoming-calls-10m.json), snapshot de 2026-11-08 19:40:35.716Z. La telemetría declara reloj cliente no verificado; las marcas no se deben presentar como hora local exacta.

Intento `471263e4-f995-429c-9358-eed8ed6b94b6`, modalidad OPI:
- Diálogo detectado y botón Connect encontrado/habilitado.
- `AUTO_ANSWER_READINESS`: ready=true, Online, perfil autorizado según el content script, configuración habilitada, guardia de presencia armada, laboratorio desbloqueado.
- El service worker rechazó dos solicitudes con `sender-not-authorized` a 19:33:38.179Z y 19:33:38.878Z.
- Cero clics. El diálogo se cerró y se clasificó como missed.

**Causa inmediata verificada:** el módulo de seguridad rechazó el mensaje antes de autorizar el clic. La detección y el botón no fueron el problema.

**Defecto de código identificado:** en 0.10.40, `content.js` consideraba autorizado el perfil raíz con o sin barra final, pero `presence-guard.js` exigía igualdad literal de la URL del frame y de la pestaña con una única cadena, tras retirar query/hash. No normalizaba la barra final ni admitía rutas internas legítimas. Por tanto, las dos capas podían discrepar y el guardián podía rechazar un perfil que el content script acababa de considerar autorizado.

La telemetría histórica no guardó los campos individuales del remitente. No se puede probar retrospectivamente si el dato discordante fue `sender.url`, `sender.tab.url` u otra condición de identidad/frame/tab. No se asigna a posteriori una causa de campo que no quedó registrada.

## B. Corrección implementada

Rama: `fix/autoanswer-missed-call-guard-20261108`. PR [#74](https://github.com/SeryMente/signal-interpreter/pull/74), abierta contra `main`, no fusionada.

1. `presence-guard.js` ahora normaliza la URL con el parser URL y valida origen exacto + perfil autorizado + sus subrutas. Rechaza perfiles ajenos, otros dominios, frames secundarios y rutas de llamada; la revalidación de la pestaña viva usa la misma regla.
2. Al rechazar un remitente, el guardián devuelve el primer predicado fallido y un inventario de resultados booleanos: remitente presente, ID de extensión, frame principal, pestaña, ID de pestaña, URL de frame y URL de pestaña. No registra URL cruda ni identificadores personales.
3. `content.js` adjunta esos booleanos al evento de rechazo para que, si vuelve a ocurrir un bloqueo, la causa precisa quede observada sin exponer datos sensibles.
4. Tras un clic humano confiable en el control Online de Cloud Interpreter, la extensión espera la confirmación DOM de que el estado cambió a Online y entonces pide al guardián activar Auto-Answer. Conserva la selección existente de inactividad; no inventa un umbral.
5. El estado de Auto-Answer tiene overlay persistente en el perfil autorizado incluso cuando no hay llamada, distingue NO CALL de llamada activa y comunica estados pausado/activo/bloqueado. Las protecciones de idle, lock, continuidad, modalidad y reinicio del worker permanecen fail-closed.

La hipótesis de URL era sólida y congruente con el rechazo observado, pero el campo histórico exacto sigue indeterminado. La instrumentación nueva permitirá identificarlo en futuros eventos si reaparece.

## C. Pruebas y resultado

Ejecutadas localmente en PC-13 con Node.js v24.22.2:
- `autoanswer-runtime-guard`: 15 checks PASS.
- `presence-guard`: 59 checks PASS.
- `presence-connect`: 33 checks PASS.
- `platform-availability-overlay`: 20 checks PASS.
- Contrato de inventario del instalador: PASS.
- Verificador del paquete: 59/59 hashes PASS, identidad de extensión conservada, SHA del ejecutable Native Messaging correcto.
- Sintaxis JavaScript de `content.js` y `presence-guard.js`: PASS.

Total de regresiones específicas: 127 checks PASS. Son pruebas automatizadas con APIs/DOM sintéticos y contratos de fuente; **no** equivalen a un test en Chrome, llamada entrante real ni aceptación funcional.

GitHub no devolvió workflow runs ni checks de estado para el head al consultar PR #74. La PR estaba `mergeable=true` al releer; no se fusionó. `main` permanece en 0.10.40 mientras PR #74 mantiene la candidata 0.10.41.

## D. Paquete local

- Paquete preparado en la carpeta autorizada `EP/Signal-Interpreter/extension` de PC-13.
- Manifiesto raíz: versión 0.10.41; ID de extensión conservado.
- Inventario regenerado: 59 entradas SHA-256, verificado 59/59.
- Instalador y verificador alineados a 0.10.41.
- Respaldo reversible de 9 archivos anteriores: `.rollback-0.10.40-20261108`.
- El puente Native Messaging y su registro no se modificaron.
- Chrome no fue recargado ni reiniciado; la extensión no está declarada cargada en 0.10.41.

## E. Pendientes y continuidad

**Bloqueo de aceptación:** el operador debe recargar manualmente la carpeta de extensión en Chrome y verificar que Chrome carga 0.10.41. Después se requiere una aceptación funcional controlada y limitada a una OPI elegible, con casos negativos para VRI, modalidad desconocida, perfil no autorizado, idle/lock y pérdida de disponibilidad. No se ejecutó ni simuló una llamada real.

**Siguiente ciclo, según instrucción del operador:** continuar el backlog SI-FB-01–SI-FB-06, sin trabajarlo en este ciclo de corrección urgente. El backlog permanece pendiente; no se cierra por esta entrega.

## F. Persistencia y límites

- Commit de la rama al cierre: `c938decb70888c1ecc7a6b8eb096fc1a0d139975`.
- PR #74: abierta, sin merge.
- Rama `main`: paquete 0.10.40; no se declara integración.
- Paquete local 0.10.41: escrito, inventario actualizado y lectura/verificación local PASS.
- Recarga Chrome, E2E real, aceptación del operador, release y deploy: NO EJECUTADOS.

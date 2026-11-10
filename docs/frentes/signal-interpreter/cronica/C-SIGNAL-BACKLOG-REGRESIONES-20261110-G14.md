# Reconciliación del backlog provisional y regresiones reportadas — 2026-11-10

## Alcance de este corte

Se revisa el backlog provisional de retroalimentación de llamada y las tareas abiertas del repositorio Signal Interpreter, incorporando el último reporte del operador: el micrófono no se habilita y el interruptor de Auto-Answer no funciona después de la actualización. Se separan los cambios integrados en `main`, los reportes de un hotfix local y las pruebas de aceptación que siguen pendientes.

Este corte es documental. No modifica código de producto, no fusiona ni cierra PR, no actúa sobre una llamada y no recarga Chrome.

## Fuente y estado de control

- Repositorio: `SeryMente/signal-interpreter`, rama `main`.
- Producto verificado en `main/manifest.json`: **0.10.47**; blob SHA observado `ee0df8e5a3b822c14a30e61da98dc2fddd3ba8de`.
- PR #79: fusionada el 2026-11-09; commit de merge/squash `10a7f1b1f8c48d290ce8f4df5639109efe571c22`.
- PR #78: fusionada; la prueba de autorización paralela y la optimización están descritas en la PR. La inclusión en #79 está documentada.
- Control de responsabilidad leído desde `CONTROL-RESPONSABILIDAD.json`, blob `8b65e9d6886b248df90d9d879d9b982635046ed1`: G14 ACTIVO, rol agente único; FOL1 PREPARADA, NO ACTIVA; folio PENDIENTE/NO ASIGNADO.
- Gobierno leído desde `SeryMente/metodologia/main:gobernanza/METAPROMPT-CANONICO-SAMANTHA.html`, blob `22dca684830a36dff019b47811d9b800cc9bea0a`: DUG v386 · NX-386m; Metacanon 1.29; GOW 2.18. Se consultó §ARR y el CNP. MCP normativo permanece DESACTIVADO.
- No se encontraron GitHub Issues abiertos en el repositorio. El backlog provisional vive en `docs/frentes/signal-interpreter/BACKLOG-RETROALIMENTACION-LLAMADA-20261030.md`; por tanto, la ausencia de Issues no equivale a ausencia de backlog.

## Evidencia diferenciada

### Integrado en main 0.10.47

La descripción de PR #79 confirma la integración selectiva de:
- Continuidad de la autorización explícita de presencia durante suspensiones/reinicios MV3, con revalidación.
- Estados de presencia diferenciados y bloqueo fail-closed ante fallos.
- Revalidación de autorización, generación, runtime, intento, readiness, modalidad, llamada activa y botón Connect justo antes del clic.
- Lease de un solo uso y un único clic autorizado.
- Ciclo fail-closed del micrófono: mute por defecto/en espera; bloqueo de unmute fuera de llamada; solicitud de unmute tras confirmar ruta activa; remute antes de limpiar la fuente al terminar; errores vuelven a mute.
- Lector LIVE en pestaña Chrome normal y reutilizable, de ancho completo, con captions nativos e historial temporal de sesión.
- Minimización reversible de overlays y preferencia de colapso.
- Indicador azul contextual condicionado al estado global activo, sin conceder autorización de Auto-Answer.

La integración de estas rutas no demuestra que la aceptación funcional en Chrome se haya realizado. La propia PR #79 declara que no se recargó Chrome y que no hubo aceptación E2E con llamada real.

### Reportado en la conversación, no re-verificado en este corte

La respuesta inmediatamente anterior informó un hotfix local en PC-7 para:
- Habilitar una pista de audio que aparece después de confirmarse la llamada activa, sin permitir unmute fuera de llamada.
- Dar un fallback al handler del interruptor Auto-Answer para que no dependa de que el selector termine de cargar.
- Serializar escrituras de presencia.
- Reportó 7/7 suites, inventario 59/59 y 4/4 comparaciones SHA-256.

Ese hotfix y su recibo fueron mencionados en la conversación, pero no se leyeron de nuevo ni se cotejaron desde esta sesión. No hay evidencia actual de que esos cambios estén en `main`; tampoco se declara que estén integrados. El paquete Chrome podría mantener código previo en memoria mientras no se recargue manualmente.

## Backlog reconciliado

### SI-FB-01 — Política de mute vinculada al estado de llamada · P0
**Estado: IMPLEMENTACIÓN PARCIAL EN MAIN; REGRESIÓN FUNCIONAL REPORTADA; ACEPTACIÓN PENDIENTE.**

Main 0.10.47 contiene la política fail-closed de mute descrita arriba. El operador reportó después que el micrófono no enciende. El hotfix local de activación tardía de pistas está reportado, pero no fue re-leído en este corte ni integrado en main. Mantener mute fuera de llamada y durante espera/timbrado; no debilitar ese guard para corregir la habilitación dentro de una llamada.

### SI-FB-02 — Captura y transcripción bilingüe del canal INTÉRPRETE · P1
**Estado: NO IMPLEMENTADO EN MAIN; BLOQUEADO POR COMPuERTAS TÉCNICAS Y DE PRIVACIDAD.**

La captura propia mediante Groq continúa deshabilitada en main 0.10.47. PR #75 conserva una candidata amplia, pero permanece draft/no fusionada y no mergeable; la configuración de credencial y la confirmación efectiva de Zero Data Retention (ZDR) siguen sin evidencia de aceptación. La autorización registrada para estudiar/implementar el flujo no prueba que ZDR esté activo ni que la ruta de audio sea segura. No capturar fuera de llamada activa, no persistir audio crudo ni publicar audio/texto clínico en observabilidad.

### SI-FB-03 — Calidad, continuidad y atribución de la transcripción · P1
**Estado: PARCIAL PARA CAPTIONS NATIVOS; CALIDAD BILINGÜE DEL CANAL INTÉRPRETE PENDIENTE.**

Main contiene captions nativos, metadatos separados de fuente/idioma/hablante e historial de sesión; el lector usa identidad de segmento para actualizar parciales. Siguen pendientes métricas WER/CER, corpus autorizado bilingüe, evaluación de nombres/números/direcciones, solapamientos y validación de habla del intérprete. No atribuir hablante solo por idioma.

### SI-FB-04 — Densidad visual y redistribución del overlay · P2
**Estado: PARCIAL EN MAIN; AJUSTE DE DENSIDAD Y ACEPTACIÓN VISUAL PENDIENTES.**

Main incluye minimización reversible del overlay de ingresos y estado colapsado del overlay de captions. La reducción integral de metadatos repetidos/espaciado y la validación visual/teclado no se consideran cerradas por esa implementación parcial.

### SI-FB-05 — Lector de transcripción en pestaña independiente de Chrome · P2
**Estado: IMPLEMENTADO A NIVEL DE CÓDIGO EN MAIN 0.10.47; ACEPTACIÓN REAL PENDIENTE.**

Main incluye la pestaña LIVE normal/reutilizable, de ancho completo, hidratación de historial nativo de sesión y actualizaciones de captions nativos. Sigue pendiente verificar en Chrome real scroll histórico, recepción en vivo, ausencia de duplicados y que cerrar el lector no afecte la llamada.

### SI-FB-06 — Matriz integrada de pruebas y aceptación · P1
**Estado: PARCIAL; PRUEBAS SINTÉTICAS DISPONIBLES, E2E REAL PENDIENTE.**

La PR #79 y el historial previo registran pruebas sintéticas, verificador de paquete e integridad de CI. La conversación reportó 27/27 suites, 59/59 hashes y pruebas específicas de Auto-Answer, pero este corte no las volvió a ejecutar. Ninguna prueba sintética sustituye la recarga manual de Chrome, la comprobación de versión activa y una llamada controlada aceptada por el operador.

### SI-REG-01 — Recuperar el interruptor de Auto-Answer · P0
**Estado: REGRESIÓN REPORTADA; HOTFIX LOCAL REPORTADO, NO RE-VERIFICADO NI INTEGRADO EN MAIN.**

Revisar el flujo completo del toggle del popup: carga del control, listener/event handler, estado visible, persistencia y comunicación con background/service worker. El fallback de handler informado debe cotejarse contra el código y convertirse en una prueba de regresión. Verificar también el atajo configurado. No autoarmar por el mero estado Online ni eliminar el consentimiento explícito; toda transición de presencia debe conservar los guards y el fail-closed.

**Aceptación:** activar/desactivar desde UI y atajo; read-back del estado; estado visible coherente; persistencia correcta; no rearme tras idle/locked, pausa, fin de sesión o reinicio de Chrome; sin clic Connect sin grant válido.

### SI-REG-02 — Reparar habilitación del micrófono con pista tardía · P0
**Estado: REGRESIÓN REPORTADA; HOTFIX LOCAL REPORTADO, NO RE-VERIFICADO NI INTEGRADO EN MAIN.**

Comprobar la secuencia real: llamada aceptada/ruta activa antes de que Cloud Interpreter cree la pista; llegada tardía de MediaStreamTrack; estado del botón; propiedad `MediaStreamTrack.enabled`; y pista saliente. El mecanismo debe habilitar únicamente la pista elegible en una llamada confirmada y mantener mute si la llamada termina, se pierde la ruta o el estado queda desconocido.

**Aceptación:** pruebas con pista previa y tardía, llamada aceptada, fin/desconexión, pérdida de contexto y pista ausente; estado visual y estado de pista coincidentes; remute antes de limpiar fuente; cero unmute fuera de llamada.

Esta tarea es el micrófono operativo de la llamada. No equivale a SI-FB-02, que es la captura separada del audio propio para transcripción.

### SI-REG-03 — Restaurar la prueba permanente de autorización paralela · P1
**Estado: FALTA RESTAURAR COBERTURA PERMANENTE.**

PR #78 documentó y fusionó la optimización que arranca simultáneamente cuatro verificaciones independientes: configuración, inactividad/bloqueo, otra llamada activa y perfil correcto. En la revisión posterior se detectó que la comprobación explícita de ese paralelismo ya no está en la prueba permanente; se comprobó temporalmente en conversación, pero no existe evidencia de que esa prueba temporal haya sido incorporada al repositorio.

**Aceptación:** test determinista con promesas diferidas que demuestre que las cuatro comprobaciones se inician antes de resolver la primera; test falla ante ejecución secuencial; mantener los guards y el único clic autorizado.

### SI-REG-04 — Aceptación integrada 0.10.47 + hotfix · P0
**Estado: BLOQUEADO HASTA RE-VERIFICAR PAQUETE Y ACEPTACIÓN DEL OPERADOR.**

Una vez revisado el hotfix y aprobadas pruebas automatizadas: generar paquete desde la fuente integrada, validar inventario/hashes, preservar backup, preparar la misma carpeta que Chrome carga y solicitar al operador la recarga manual fuera de llamada activa. Después, el operador debe verificar la versión realmente cargada, el interruptor, la presencia armada y una llamada controlada; no se declara aceptación por CI ni por la existencia de archivos en disco.

## PR abiertas: reconciliación sin merge indiscriminado

| PR | Estado observado | Tratamiento |
| --- | --- | --- |
| #79 | Fusionada en main; commit `10a7f1b1f8c48d290ce8f4df5639109efe571c22` | Fuente de producto 0.10.47 en este corte. |
| #78 | Fusionada; commit `0c2ec207f60d4e4a9b49ff5a5562b839f400149e` | Mantener optimización y test de autorización paralela; SI-REG-03 protege su cobertura. |
| #72 | Abierta, no mergeable | Continuidad MV3 fue integrada selectivamente en #79; no fusionar rama completa sin comparar diff. |
| #73 | Abierta, no mergeable | Estados idle/locked/unavailable fueron integrados selectivamente; revisar solo deltas no cubiertos. |
| #74 | Abierta, no mergeable | No portar activación automática al pulsar Online; requiere revisión del delta sin debilitar consentimiento explícito. |
| #75 | Abierta, draft, no mergeable; 55 archivos cambiados en la metadata consultada | Mantener draft. No fusionar la rama amplia; aislar cambios de micrófono/ASR, privacidad, densidad y lector. |
| #76 | Abierta, no mergeable | El indicador azul contextual ya se describe integrado por #79; comprobar diff restante antes de cerrar o descartar. |
| #70 | Abierta, draft, no mergeable; candidata documental antigua 0.11.0 | No fusionar completa; su sección 7 es antecedente, no fuente vigente del estado. |

No se fusiona una PR solo porque tenga trabajo útil: primero se reconcilia cada diff contra main y se ejecutan pruebas dirigidas. No se cierra ninguna PR en este corte.

## Orden de ejecución

1. **P0 — Auto-Answer toggle y micrófono:** cotejar los archivos reales del hotfix local contra main; aislar cambios mínimos y pruebas; conservar fail-closed.
2. **P1 — Restaurar el test permanente de paralelismo** de SI-REG-03.
3. **P0 — Revalidar paquete y carpeta destino** solo con autorización vigente para el perfil/equipo correcto; no reutilizar autorización de PC-7.
4. **P0 — Aceptación manual de Chrome y llamada controlada** por el operador.
5. **P1/P2 — SI-FB-02/03/04 y validación completa de SI-FB-05**, sin enviar audio/texto clínico a observabilidad.

## Límites de este ciclo

- No se modificó código de extensión ni se fusionó/cerró ninguna PR.
- No se leyó de nuevo el recibo local del hotfix reportado en la conversación; su ejecución y sus hashes permanecen **REPORTADOS, NO RE-VERIFICADOS** en este corte.
- No se realizó acceso RDC a PC-7 ni a PC-14. El control vigente G14 limita la operación remota al destino registrado bajo `C:\Users\fila4`; no se heredan autorizaciones de equipos anteriores.
- No se recargó Chrome, no se manipuló ninguna llamada, no se capturó audio real y no se declaró aceptación funcional.
- La búsqueda de Issues abiertos devolvió cero; el backlog persistente es el archivo canónico del frente, no un GitHub Issue.

## Persistencia

Este documento registra el corte reconciliado y distingue integrado, reportado, candidato, verificado y aceptado. La lectura de vuelta de este archivo y de los documentos canónicos que lo referencian es la compuerta de persistencia.


## Addendum · 2026-11-10 · PR #80 y materialización en fila4

La candidata PR #80 se preparó en rama aislada, sin merge. El defecto de Auto-Answer se localizó en la ausencia del valor por defecto `presenceIdleSeconds`: el popup podía mandar `0`, que el guard rechaza. Se añadió el default de 180 s. Para micrófono, el reintento tardío solo se permite con llamada activa, intención explícita de unmute aún vigente y pista viva que el guard verifica como silenciada; fuera de esa condición permanece muteado.

Se materializó la rama candidata en `C:\\Users\\fila4\\Desktop\\SeryMente\\signal-interpreter`, con carga manual en `extension/`. Backup completo previo y SHA/read-back verificados. Inventario 60/60 y suites locales sintéticas: presence-connect 35, presence-guard 83, microphone-guard, overlay regression, unpacked-layout 18 referencias y verificación del paquete; sintaxis JS 5/5 y parser Windows PowerShell 5.1 7/7 scripts relevantes.

**No aceptado todavía:** Chrome no se recargó, Native Messaging host ya estaba presente y registrado para CENTRAL\\fila4; registro, manifiesto, origen permitido y SHA-256 del ejecutable se verificaron en solo lectura, sin modificarlo. No hubo llamada real ni captura de audio. La PR permanece abierta en borrador; main no incorpora estas correcciones. La aceptación manual pertenece al operador.

# Retoma G14 · continuidad integral y aceleración segura de Groq dual · 2026-11-11

## 0. Propósito de este checkpoint

Este registro permite que una conversación nueva continúe el frente Signal Interpreter sin reconstruir desde cero el hilo anterior, sin confundir un estado histórico con el vigente y sin repetir verificaciones que ya tienen evidencia.

**Estado de cierre de este ciclo:**
- La autorización técnica amplia del operador quedó preservada literalmente.
- El registro de tareas provisionales de Groq dual quedó creado y leído de vuelta.
- La CI y las pruebas independientes en Fila 4 permanecen verdes para el HEAD documentado.
- Se optimizó la ejecución de CI mediante paralelismo completo de suites, job agregador obligatorio y cancelación de runs obsoletos.
- PR #84 sigue abierta, draft y no fusionada.
- No hubo llamada real, audio real, solicitud/uso de clave Groq, comprobación ZDR de cuenta, aceptación Chrome, merge, deploy ni release.
- G14 sigue siendo el único agente responsable. No se creó corresponsable ni se asignó folio.

## 1. Procedencia e instrucciones literales

### 1.1 Original recuperado del hilo constructor

Archivo preservado: [CHATGPT-SI-RECUPERADO-GROQ-20261110.txt](../originales/CHATGPT-SI-RECUPERADO-GROQ-20261110.txt)

- Blob Git observado: a24d696207dfb357f12e90151d64ce1a35fc084c
- Contiene la conversación recuperada y pegada por el operador.
- Es texto aportado por el operador; no se presenta como exportación nativa de ChatGPT.
- A-01, A-02, A-03 y A-04 están conservadas en el plan provisional. A-01 fue cotejada con el original y corregida para que su frase final sea exactamente «Calidad maxima. Reportame en 10 minutos.»; no añadir la frase que había aparecido en un borrador previo.

### 1.2 Instrucciones de esta retoma

Archivo: [CHATGPT-SI-AUTORIZACIONES-RETOMA-20261110-G14.txt](../originales/CHATGPT-SI-AUTORIZACIONES-RETOMA-20261110-G14.txt)

- Commit de creación: 112e94fdcaf5a62b7fd805fab1173e3a5967845b
- Blob de lectura de vuelta: a55caa4f2659fdee3fafb198b3b1317e1774f859
- Longitud leída: 1,133 caracteres.
- Lectura de vuelta: igualdad literal exacta con el contenido enviado a GitHub.
- Conserva literalmente las cuatro instrucciones recientes sobre autorización, uso de Fila 4/CI, aceleración sin degradar calidad y persistencia ultra-recuperable.

### 1.3 Instrucción operativa interpretada

El operador autorizó que se resolviera de extremo a extremo el trabajo técnico y asumió la responsabilidad del manejo de datos. Esa autorización se aplicó a inspección, desarrollo offline, pruebas, ramas/PR, GitHub Actions, trabajo documental y uso del entorno Fila 4 dentro del control vigente.

No equivale a evidencia de que existan credenciales, que ZDR esté habilitado en la cuenta, que Chrome permita cargar la extensión o que una llamada real haya sido ejecutada. No se usaron datos de llamadas ni se envió audio al proveedor durante este ciclo.

La petición de “delegar en Fila 4 o en Hiku” se implementó como **paralelización de pruebas sobre checkouts separados**, no como transferencia de responsabilidad:
- una sola instancia G14 conserva la titularidad, decisiones y escritura del frente;
- el checkout principal vive en el perfil autorizado de fila4;
- un segundo checkout temporal, bajo MantenimientoRCI, se usó exclusivamente para ejecutar validación independiente de solo lectura;
- no hay CLI Hiku ni herramienta Hiku expuesta en esta sesión. Claude Code fue localizado en otro perfil, pero su estado de autenticación era loggedIn=false; no se usó ni se contabiliza como agente.

## 2. Gobierno y control de responsabilidad adquiridos

Fuente metodológica canónica:
SeryMente/metodologia/main:gobernanza/METAPROMPT-CANONICO-SAMANTHA.html

- DUG: v388 · NX-388m.
- Blob: 4db0ebadfd1e48b2bdec9236ba7f344921e4a865.
- Metacanon: 1.29.
- GOW: 2.18.
- Evento documental DUG: C-GOBERNANZA-ART027-SINK-LOCAL-RECONCILIACION-20261110-01.
- §ARR fue leído desde la representación estructurada del DUG (gow-sec-14); prepara la comprensión lingüística y no contiene autoridad de gobernanza.
- Reglas metodológicas aplicadas: CNP P001, P004, P005, P038 y P043; Metacanon §§4, 28, 42 y 47–48.
- GOW se revisó al inicio y se volvió a consultar para cierre. MCP normativo permanece DESACTIVADO.

Control de responsabilidad:
docs/frentes/signal-interpreter/CONTROL-RESPONSABILIDAD.json

- Blob leído: 2f02cab6b3697f31b2af3d141204c4431fbc05cb.
- G14: ACTIVO.
- Rol: agente_unico.
- UUIDv7/alias operativo local registrado: 01a1bd8b-8291-7906-b862-6088593acfe5. No es ID nativo de plataforma.
- G13: SUSTITUIDO.
- FOL1: PREPARADA, NO ACTIVA.
- Folio de sesión y folios CV/CY/A/B: PENDIENTES / NO ASIGNADOS.
- No se cambió la titularidad, no se creó un segundo responsable ni se hizo transferencia en este ciclo.

La autorización de Fila 4 conserva ese alias funcional como destino del trabajo y los artefactos. La función de elevación administrativa se mantiene separada de la ejecución operativa; no se persisten nombres de cuenta, endpoints, sesiones ni rutas de perfil.

## 3. Estado de código, PR y CI

### 3.1 Integración selectiva

- PR #83: cerrada sin merge; su rama histórica divergente no se integró.
- PR #84: https://github.com/SeryMente/signal-interpreter/pull/84
- Estado: OPEN, DRAFT, no fusionada.
- Rama: feat/groq-dual-main-20261111.
- HEAD validado: 1c7aca92cc89337aeb4c9907426847f941fa35bd.
- La lista de archivos modificados devuelve 33 rutas de código, manifiestos, tests, inventario y workflows.
- observations/ no forma parte del diff del PR.
- main/manifest.json y extension/manifest.json declaran versión 0.10.47.

La rama deriva de un port selectivo sobre main y no incorpora los 115 commits divergentes de PR #83. Mantener esa separación.

### 3.2 Checks exactos de GitHub Actions

Todos los runs siguientes corresponden al mismo HEAD 1c7aca92cc89337aeb4c9907426847f941fa35bd:

| Workflow | Run | Resultado |
|---|---:|---|
| Package integrity | 42941191180 | SUCCESS |
| signal-observability-audit | 42941191052 | SUCCESS |
| native-caption-host-build | 42941191195 | SUCCESS |

El job signal-observability-audit se comprobó en detalle: syntax, guards, observability, captions y aggregate audit completaron SUCCESS.

Las ejecuciones anteriores 42941184668 y 42941184677 quedaron CANCELLED porque llegó una ejecución nueva para el mismo workflow/rama. La cancelación de trabajos obsoletos funcionó según diseño; no se canceló la batería final exitosa.

### 3.3 Aceleración CI incorporada

Commit en la rama PR #84:
1c7aca92cc89337aeb4c9907426847f941fa35bd

Cambio en .github/workflows/observability-audit.yml:
- syntax: 56 comandos.
- guards: 16 suites.
- observability: 14 suites.
- captions: 13 suites.
- audit: job agregado con needs explícitas; falla si cualquiera de los cuatro jobs no termina SUCCESS.

Total: 99 comandos originales preservados. El contenido de test no se redujo. Los tres workflows tienen concurrency por workflow/branch con cancel-in-progress=true.

Validación adicional:
- Parser YAML en Python/PyYAML 6.0.3: PASS.
- Jobs esperados: syntax, guards, observability, captions, audit.
- Dependencias del agregador: los cuatro jobs requeridos.
- Conteos reconstruidos desde YAML: 56/16/14/13.
- Total de comandos: 99.

## 4. Evidencia de ejecución local independiente en Fila 4

### 4.1 Superficies y cuentas

- Destino operativo: Fila 4, alias funcional designado por el operador; identificadores técnicos efímeros omitidos.
- Checkout candidato: rama `feat/groq-dual-main-20261111`, HEAD `1c7aca92...`, limpio al último read-back; se omite la ruta local y la cuenta.
- Checkout principal de trabajo: alias funcional Fila 4, rama main; se requería sincronización posterior. Se omite ruta local y perfil.
- Se detectó una carpeta adicional de nombre parecido, pero no se asumió como checkout Git ni se modificó; su ubicación no se conserva.
- Checkout secundario de pruebas: entorno efímero usado solo para lectura/pruebas y eliminado después; no se conservan ruta, cuenta ni identificador del endpoint.
- El checkout secundario se eliminó al terminar. El read-back final confirmó que no quedaban directorios SI-G14-* ni scripts temporales de las pruebas bajo ese perfil.

### 4.2 Batería local y verificación

En el checkout independiente:
- 42 suites de regresión/observabilidad/layout: 42 PASS, 0 FAIL.
- Una suite adicional observability-package-audit.mjs observations: PASS.
- Total de suites: 43/43 PASS.
- 56 comprobaciones node --check: 56/56 PASS.
- tools/verify-release-package.mjs: PASS.
- Inventario: 66/66 SHA-256 coincidentes.
- Audio/Connect/presence gate: 8 suites PASS.
- Identidad de extensión y hash del host nativo: PASS.
- Global overlay switch/shortcut y hotload-disposal guards: PASS.
- YAML parse de workflow paralelo y job agregado: PASS.

Advertencia no bloqueante observada en Node: algunos archivos .js del relay bajo tools/ tienen package.json sin type=module; Node los reinterpreta como ES module, con warning de overhead. Las pruebas pasaron. No se modificó esa configuración porque no se necesitó para resolver el alcance y requiere análisis separado de packaging.

La prueba independiente usó el mismo SHA que la rama; no fue una auditoría de otra versión.

## 5. Estado de runtime, audio, privacidad y aceptación

### 5.1 Captura

- La captura exige exactamente displaySurface === "browser".
- Ausencia de metadata, window o monitor: rechazo fail-closed antes de pedir el micrófono.
- Las pistas y colas de audio remoto e intérprete permanecen independientes hasta transcribir.
- La fusión temporal ocurre después de la transcripción.
- Se conservan guards de llamada activa, autorización, revocación y liberación de pistas.
- Los controles de Groq y declaración ZDR permanecen false por defecto.

### 5.2 Chrome

Se intentó cargar la extensión desde un perfil Chrome temporal aislado. El navegador está administrado por la organización y bloqueó Developer Mode / Load unpacked mediante política. El perfil temporal fue eliminado; el perfil Chrome habitual no fue tocado. No se declara extensión cargada ni runtime aceptado.

### 5.3 Groq

- No había extension/groq-secret.local.js.
- No se encontró GROQ_API_KEY, SIGNAL_GROQ_API_KEY ni __SIGNAL_GROQ_TOKEN.
- No hubo llamada al endpoint con audio real o sintético.
- ZDR no se verificó en la consola de la cuenta.
- Las cuotas efectivas de organización no están verificadas. La documentación pública consultada presentaba valores discrepantes entre Rate Limits y Supported Models; la consola de la cuenta es la fuente definitiva.
- No se midió WER/CER acústico, latencia p50/p95, jitter, pérdida/duplicación, drift ni calidad por fuente.

Parámetros 6.5 s / 500 ms overlap / 6 s hop son candidatos, no óptimos demostrados. Coste/cómputo teórico previo (incluido el mínimo de facturación pública de 10 s) no constituye coste observado ni cuota confirmada. Verificar los términos vigentes antes de tomar decisiones operativas.

### 5.4 No ejecutado / no aceptado

- No llamada real.
- No captura de audio real.
- No uso del endpoint Groq con audio.
- No verificación de ZDR.
- No carga/recarga del perfil Chrome habitual.
- No aceptación funcional del operador.
- No merge, deploy ni release.

## 6. Aceleración: decisión y límites de delegación

La aceleración material conseguida fue:
1. runners GitHub Actions paralelos sin omitir comandos;
2. agregador obligatorio para impedir falsos verdes;
3. cancelación de runs antiguos por workflow/rama;
4. checkout secundario aislado para repetición independiente de pruebas, eliminado tras finalizar.

No hay CLI/tool Hiku accesible en esta sesión. Claude Code encontrado en otro perfil indicó loggedIn=false. Ninguno fue usado. No afirmar que otro agente revisó o programó el código. La titularidad sigue G14 único agente.

## 7. Persistencia documental realizada durante este ciclo

- Archivo literal de nuevas instrucciones: commit 112e94fdcaf5a62b7fd805fab1173e3a5967845b; blob a55caa4f2659fdee3fafb198b3b1317e1774f859; 1,133 caracteres; read-back exacto.
- Registro provisional de tareas: commit 4182742a1ee197d62c7ee36096cc1a93be4b6b55; blob 1aa2792ac5e497af72770b1d30d64889f1878d51; 21,811 caracteres; read-back exacto.
- La actualización de OCP, plan, prompt operativo y README queda registrada en commits posteriores de este cierre; sus SHA finales se consignan en el propio OCP al terminar el ciclo.
- El último resultado visible exacto de la instancia previa no ha sido recuperado de una fuente literal persistida y cotejada. Se marca NO DISPONIBLE / NO VERIFICADO; no se reconstruye desde este resumen ni desde memoria.
- La conversación recuperada del operador no es export nativo de ChatGPT.

## 8. Próxima secuencia

1. Revalidar DUG/§ARR/control/OCP desde main al abrir una conversación nueva.
2. Leer este checkpoint, TAREAS-PROVISIONALES-GROQ-DUAL-G14.md y los originales verbatim antes de ejecutar.
3. Reconsultar PR #84 y checks del HEAD actual; el HEAD aquí registrado puede cambiar.
4. Mantener PR draft y no fusionar todavía.
5. Resolver el bloqueo de Chrome autorizado y confirmar ZDR/cuotas en consola.
6. Preparar credencial local ignorada por Git, solo después de ZDR.
7. Ejecutar smoke tests con corpus sintético no clínico y medir exactitud/latencia/coste.
8. Completar prueba visual y ciclo de vida en Chrome autorizado.
9. Fijar umbrales de aceptación y solicitar revisión del operador.
10. Persistir toda nueva evidencia y read-back en OCP/crónica antes de proclamar cierre.

## 9. Estado final del checkpoint

**Producto:** candidato integrado selectivamente en PR #84, HEAD 1c7aca92..., CI 3/3 SUCCESS.  
**Pruebas:** 43/43 suites locales independientes, 56/56 sintaxis, paquete 66/66, 8 suites de seguridad crítica y YAML paralelo validado.  
**Aceleración:** CI paralela y cancelación de ejecuciones obsoletas implementadas y probadas.  
**Privacidad:** sin clave, sin audio real, sin transcripción clínica, sin uso de API durante este ciclo.  
**Aceptación:** Chrome/Groq/acústica pendientes.  
**Responsabilidad:** G14 ACTIVO, agente único; FOL1 PREPARADA / NO ACTIVA; folios sin asignar.  
**MCP normativo:** DESACTIVADO.  
**Continuidad:** este documento, el registro provisional, las instrucciones literales, el plan y el OCP constituyen la ruta de reanudación; la conversación previa no debe reconstruirse de memoria.


## 10. Reconciliación final de persistencia y checkout local

### 10.1 Materiales publicados y cotejados

| Artefacto | Commit de materialización | Blob SHA-1 leído de main | Verificación |
|---|---|---|---|
| Instrucciones nuevas verbatim | 112e94fdcaf5a62b7fd805fab1173e3a5967845b | a55caa4f2659fdee3fafb198b3b1317e1774f859 | 1,133 caracteres; read-back exacto |
| Registro provisional de 12 tareas | 4182742a1ee197d62c7ee36096cc1a93be4b6b55 | 1aa2792ac5e497af72770b1d30d64889f1878d51 | 21,811 caracteres; read-back exacto |
| Crónica G14 (primera materialización) | dd10792ebe6dbfc76ac9902dc906f481bf405ae5 | 4274b0c0718f6f877b26d9c9f76e54570a99d50e | 14,296 caracteres; read-back exacto; esta crónica recibió después la sección 10 |
| OCP tras sección 12 y corrección del estado inicial | dc54619dad4697486b1f5f35d15b999f994c53d6 | b0e2f728a6014b8d3ac380c05eee9e85a2a15e17 | read-back exacto |
| Plan provisional, sección 10 | a023a76d75d359b88b68c00481e36407fc59845f | 84ac5c8ff67369495ab86d0b69a767d8dc847392 | read-back exacto |
| Prompt operativo G14 | actualización cotejada | read-back exacto; marcadores de generaciones anteriores: 0 |
| README con navegación vigente | 7bb9f0e098f2d743e1f079ff4b6a43647b37466d | 96e09691ee5f6a2b95bb406d52ef271ae322f2cd | read-back exacto |
| CONTROL-RESPONSABILIDAD.json | sin escritura en este ciclo | 2f02cab6b3697f31b2af3d141204c4431fbc05cb | leído de main; G14 y generación 14 conservados |

Las cifras anteriores identifican materializaciones concretas de cada documento; los archivos que recibieron una segunda actualización se deben leer por su blob actual en main, no asumir que su blob de creación sigue siendo la última revisión. El historial de Git conserva las revisiones consecutivas.

### 10.2 Sincronización del checkout principal de Fila 4

- Ruta de trabajo: alias funcional Fila 4; ubicación de perfil no conservada.
- Checkout principal: rama main; identidad operativa y ruta de perfil omitidas conforme a ART-013.
- Cabeza previa comprobada: 0a9f3917178415d22a81163f1c159e04b080ceb9.
- Se hizo fast-forward, sin reset destructivo, y sin cambios locales previos; la primera alineación fue b9e7cbe6af9b7cb5bf866c9371f372626cb995f0.
- Después, main recibió más commits automáticos de observations/. Se volvió a fetch/revisar diff; las 25 rutas nuevas entre b9e7cbe y 05a12cde eran exclusivamente observations/, sin cambios de código, OCP, prompt, plan o tareas. Se hizo un segundo fast-forward limpio.
- Última cabeza local/remote verificada: 05a12cde497ecb1110211d225fa41d3fab2c9efb. Worktree limpio.
- Los blobs esperados de ocho rutas fueron cotejados desde el checkout local contra los blobs publicados: OCP, plan, prompt, README, tareas, crónica, original de instrucciones y control; 8/8 PASS.
- El repositorio tiene snapshots/batches automáticos que pueden continuar avanzando independientemente. El checkout se alineó a la cabeza observada al momento del read-back; una retoma posterior debe volver a fetch y confirmar la cabeza antes de escribir.

### 10.3 PR y estado del entorno al cierre

- PR #84 se relee como OPEN/DRAFT, HEAD 1c7aca92cc89337aeb4c9907426847f941fa35bd; la lista de archivos modificados conserva 33 rutas y no contiene observations/.
- Checks vigentes para ese SHA: 42941191180, 42941191052, 42941191195 SUCCESS. Las ejecuciones antiguas 42941184668 y 42941184677 constan CANCELLED.
- Fila 4 permanece como entorno de trabajo. La copia temporal usada bajo MantenimientoRCI fue borrada y su ruta ya no existe; no se dejó un checkout secundario.
- No había secreto Groq en el perfil Fila 4 ni variables GROQ_API_KEY/SIGNAL_GROQ_API_KEY/__SIGNAL_GROQ_TOKEN; no se transmitió audio ni se ejecutó API real.
- La carga Chrome no se completó por política corporativa; el perfil temporal fue eliminado y el perfil habitual no se modificó.
- La única titularidad sigue G14; FOL1 PREPARADA/NO ACTIVA; folios PENDIENTES/NO ASIGNADOS; no aceptación, merge, deploy ni release.


### 10.4 Límite de read-back del checkout local tras el pin final del OCP

- El checkout principal de Fila 4 completó un fast-forward y un cotejo local de ocho blobs en HEAD 05a12cde497ecb1110211d225fa41d3fab2c9efb. Ese cotejo fue anterior al último pin del OCP, por lo que comprobó el blob OCP anterior b0e2f728a6014b8d3ac380c05eee9e85a2a15e17, no el blob final actual.
- Después se publicó un pin del OCP en commit 45d3ec872ed83f5aaafe2d5a58ce75181ef04189, blob entonces observado 3e1697711cd3f578ead7601232d5c33ea9d3f6c8. Ese pin fue supersedido por actualizaciones posteriores de referencias; consultar el blob vigente desde GitHub main, no reutilizar ese SHA histórico.
- Se intentó verificar/sincronizar el checkout después de ese commit, pero la sesión RDC no completó la lectura de vuelta. No se cambió `safe.directory`, ACL ni propiedad, ni se escribió desde una identidad elevada en el checkout operativo.
- Resultado preciso: **GitHub main contiene y relee el OCP final; el checkout local de escritorio después del pin final queda NO VERIFICADO**. No usarlo como fuente vigente ni afirmar que ya está alineado a 3e169771...
- Acción pendiente: con el canal autorizado de Fila 4, comprobar que el checkout esté limpio en `main`, realizar `fetch` y `pull --ff-only`, confirmar `HEAD==origin/main` y cotejar el blob del OCP vigente. No cambiar propiedad/ACL ni modificar configuración global de Git.

## 11. Retoma de continuidad · exportación recuperada 2026-11-11

### 11.1 Custodia del TXT

Se localizó en Descargas de Fila 4 el archivo `ChatGPT-SI-20261111-0913.txt` (exportado el 2026-11-11 a las 09:13:07, hora America/Mexico_City; creado el 2026-11-10 a las 18:44:33; actualizado a las 20:06:13). Contiene 1,626 líneas y 75,289 bytes. Se copió mediante RDC, sin mover ni alterar el original, a `docs/frentes/signal-interpreter/originales/ChatGPT-SI-20261111-0913.txt` dentro del checkout de Fila 4.

La huella SHA-256 de la fuente, copia de destino y relectura coincide exactamente: `1564338E578D32EA685831521627FE58BC0DA8B3DC59920225939D02ED73E955`. Verificación local: 2026-11-11T09:18:30.9567506-06:00. Se añadió una exclusión específica en `.git/info/exclude`; el TXT completo permanece **LOCAL / PRIVADO / NO PUBLICADO** porque este repositorio es público. El recibo público de custodia, sin contenido conversacional, está en [RECIBO-EXPORT-CHATGPT-SI-20261111-0913.json](../evidencias/RECIBO-EXPORT-CHATGPT-SI-20261111-0913.json).

### 11.2 Última salida visible del modelo anterior · copia literal

Fuente: exportación indicada, última respuesta visible, 10/11/2026 a las 19:42:55, modelo `gpt-6-t-mini-mini`. El texto se conserva literalmente; no es un resumen ni una reconstrucción:

```text
La paralelización ya quedó validada en GitHub, no solo en local. En el HEAD 1c7aca92 pasaron los tres workflows y la auditoría se ejecutó en 4 jobs independientes $syntax, guards, observability, captions$ más un quinto job agregado (audit) que exige el éxito de los cuatro. Los comandos originales se conservaron: 56 chequeos de sintaxis y 43 suites de regresión/auditoría. La cancelación de ejecuciones obsoletas también funcionó: las dos ejecuciones duplicadas quedaron cancelled y se completaron las más nuevas.

Estoy cerrando también el problema de continuidad, no solo el código. El control de responsabilidad sigue en G14 como agente único, sin inventar un corresponsable ni folio nuevo. El checkout independiente que usé bajo el perfil operador de MantenimientoRCI ya fue eliminado después de las pruebas; la verificación quedó registrada como evidencia y no queda allí una copia de trabajo.
```

### 11.3 Contexto de trabajo recuperado y estado de referencia

El propósito no cambió: construir **un único diálogo cronológico** con dos fuentes independientes y concurrentes: (1) audio remoto de la pestaña seleccionada y (2) micrófono propio del intérprete. Cada fuente se transcribe separadamente con Groq Whisper; después se fusionan los segmentos por reloj común, secuencia y offsets, conservando solapamientos reales y reconciliando límites/parciales sin duplicaciones. La fuente del micrófono se rotula `INTÉRPRETE`; el canal remoto, `AUDIO REMOTO · HABLANTE NO VERIFICADO`, salvo metadata verificable. No inferir LEP/proveedor por idioma, voz, acento o contenido.

Decisiones heredadas vigentes: `whisper-large-v3` como modelo predeterminado de calidad en ambos carriles; no sustituir silenciosamente por Turbo; dos colas concurrentes; ventanas WAV autónomas; timestamps por segmento en el camino crítico; backpressure/reintentos explícitos; captura únicamente con inicio explícito y llamada activa; terminar al finalizar la llamada o perder permisos; no interferir con el micrófono saliente. La ventana candidata 6.5 s / overlap 500 ms / hop 6 s no está ratificada como óptima: debe medirse WER/CER, latencia p50/p95, pérdidas, duplicados, deriva, cuota y costo.

Estado GitHub reconsultado durante esta retoma (2026-11-11, aprox. 09:16 America/Mexico_City): main estaba en `83c477eff650f33deec98b6545448e3f464d2acc`, commit automático de diagnóstico `diagnostic: enqueue observation batch`; esto no acredita avance de producto. PR #84 seguía OPEN / DRAFT / NOT MERGED, rama `feat/groq-dual-main-20261111`, HEAD `1c7aca92cc89337aeb4c9907426847f941fa35bd`, 33 archivos. Los tres workflows de ese HEAD figuraban SUCCESS: Package integrity run `42941191180`, signal-observability-audit run `42941191052` y native-caption-host-build run `42941191195`. Auditoría: syntax 56, guards 16, observability 14, captions 13 y agregador; se preservan los 99 comandos originales. La verificación local previamente registrada fue 43/43 suites, 56/56 sintaxis y 66/66 hashes. Estos resultados pertenecen a ese SHA, no a una cabeza futura.

Límites sin cambio: no se cargó la extensión en Chrome por política administrada; no había credencial Groq verificada; no se llamó a la API con audio; no se capturó audio real ni se probó una llamada real; ZDR/cuotas no fueron comprobados en la consola de cuenta; no existen mediciones acústicas WER/CER o latencia real; no hubo aceptación del operador, merge, deploy ni release. Los toggles permanecen false por defecto. No se publica audio ni texto clínico.

La autorización G14 y los límites de RDC se conservan: trabajo y artefactos bajo el alias funcional Fila 4; MantenimientoRCI únicamente como identidad operadora elevada. No se persisten cuentas, identificadores de endpoint, SID ni rutas de perfil. El intento de Git bajo la identidad elevada devolvió `dubious ownership`; no se cambió `safe.directory`, ACL ni propiedad.

### 11.4 Instrucción de continuidad

Continuar en la misma titularidad G14, sin redescubrir arquitectura ni reabrir PR #83 (cerrada sin merge). La superficie canónica vigente es GitHub `main`; al iniciar el siguiente trabajo, releer PR #84, HEAD y checks actuales antes de reutilizar evidencia. Después continuar con validación técnica del runtime/ciclo de vida y compuertas pendientes, sin degradar cobertura ni habilitar audio/Groq/Chrome real por inferencia. La ventana de 40 minutos mencionada en A-03 pertenecía al 10/11/2026 y es histórica, no un límite vigente para esta sesión.

## 12. Retoma posterior · cabeza 9301dade · 2026-11-11

### 12.1 Gobierno y continuidad comprobados

- Metodología releída en `SeryMente/metodologia/main`: DUG v388 · NX-388m; Metacanon 1.29; GOW 2.18; blob `4db0ebadfd1e48b2bdec9236ba7f344921e4a865`. §ARR / `gow-sec-14` consultado. CNP pertinente: P001, P004, P005, P038 y P043.
- `CONTROL-RESPONSABILIDAD.json` releído en `main`, blob `2f02cab6b3697f31b2af3d141204c4431fbc05cb`: G14 ACTIVO, agente único; alias UUIDv7 local `01a1bd8b-8291-7906-b862-6088593acfe5`; G13 SUSTITUIDO; FOL1 PREPARADA/NO ACTIVA; folio PENDIENTE/NO ASIGNADO. Sin transferencia ni corresponsable.
- Confirmación operativa del operador: Fila 4 es el destino funcional de repositorios y artefactos; la identidad elevada solo opera como autorización administrativa. La ejecución y materialización se mantienen separadas. No se conservan nombres de cuenta ni rutas del perfil.
- RDC preflight completado en el destino funcional Fila 4; la verificación de identidad efectiva y rutas se realizó en vivo. No se guardan Device IDs, hostname, cuenta ni ruta de perfil.

### 12.2 Integración Git y PR

- Rama local de trabajo: `work/g14-groq-dual-clean-20261111`.
- Rama remota de PR: `feat/groq-dual-main-20261111`.
- Se observó que `main` avanzó desde `1db0b7b26fad41b017f35c5a4af3d3811a7e7060` hasta `5f80297e1b08bcca4736e549363f47187748df11`; los cinco commits nuevos eran de `observations/`.
- Se integró la nueva base mediante merge normal, sin conflictos; HEAD resultante `9301dade6cde46a181a7260397223d2d45ea0478`. El árbol de trabajo quedó limpio.
- Push normal y read-back remoto completados: `feat/groq-dual-main-20261111` ahora apunta a `9301dade6cde46a181a7260397223d2d45ea0478`.
- GitHub PR #84 releída: OPEN / DRAFT / NOT MERGED; base `5f80297e1b08bcca4736e549363f47187748df11`; head `9301dade6cde46a181a7260397223d2d45ea0478`; 36 archivos; 7 commits adelante, 0 detrás; mergeable=true. `observations/` permanece fuera del diff.
- La descripción del PR se reemplazó y leyó de vuelta para reflejar la base/head nuevos, el evaluador y las compuertas pendientes.

### 12.3 Cambios y pruebas nuevos

- Motor de diálogo: normalización Unicode NFKC y clases Unicode de letras/marcas/números; impide que texto CJK o solo símbolos se convierta en clave vacía y se elimine como duplicado. Regresiones: frases japonesas diferentes, frase idéntica en ventanas contiguas y símbolos distintos.
- Ciclo de cierre: el estado cambia a `Captura INCOMPLETA` cuando el flush final no se confirma en 2 s o quedan transcripciones pendientes al agotar 25 s de drenaje. Se identifica la cola afectada y se liberan pistas y AudioContext. Regresiones para cierre normal/incompleto, revocación y superficie de captura inválida.
- Se añadió `tools/evaluate-dialogue-quality.mjs`, `tools/dialogue-quality-evaluation-tests.mjs` y `tools/README-dialogue-quality.md`. Contrato bilingüe por segmento; WER/CER general y por fuente; recall de términos críticos por fuente/idioma; atribución de hablante sobre tokens alineados; latencia p50/p95/máxima global y por canal. La salida contiene métricas únicamente.
- El evaluador pasó fixtures sintéticos bilingües y CJK y una ejecución CLI con fixture temporal; se verificó que no imprimiera texto de conversación y el fixture temporal se eliminó.
- Workflow `signal-observability-audit` ampliado a 58 comprobaciones `node --check` y 14 suites en el job captions, una de ellas el evaluador. No se eliminaron suites previas.
- Validación local en la cabeza integrada antes del último merge de sincronización: 58/58 sintaxis, 43/43 suites ejecutables del workflow, `verify-release-package.mjs` 66/66 hashes y ocho suites críticas PASS. La auditoría `observability-package-audit.mjs observations` no se ejecutó localmente porque `observations/` está deliberadamente fuera del sparse-checkout; su prueba fixture sí se ejecutó. CI usa el checkout íntegro.
- La compilación y protocolo Native Messaging del host ya se habían validado independientemente; no se ejecutó el instalador ni se modificó el registro.

### 12.4 CI, límites y estado

- Para SHA `9301dade6cde46a181a7260397223d2d45ea0478`, `fetch_commit_workflow_runs` no devolvió ejecuciones y el estado combinado no devolvió checks en el último read-back. Estado de CI: **NO OBSERVADO / PENDIENTE**, no SUCCESS ni FAIL.
- No hubo merge, deploy o release. La PR continúa draft.
- No se hizo llamada real, no se capturó audio real, no se llamó al endpoint Groq con audio, no se verificó ZDR/cuotas en la consola, no existe clave Groq local verificada y no se cargó la extensión en Chrome autorizado. Los switches Groq/ZDR permanecen false.
- No existen resultados acústicos reales WER/CER, latencia p50/p95, jitter, drift, pérdida/duplicación ni aceptación funcional. El evaluador facilita medirlos, pero los fixtures sintéticos no sustituyen un corpus acústico.
- El perfil habitual de Chrome no se modificó y no se eludió la política organizacional que bloquea Developer Mode / Load unpacked.

### 12.5 Siguiente acción

Reconsultar Actions para el SHA `9301dade6cde46a181a7260397223d2d45ea0478`; exigir 3/3 workflows SUCCESS sobre esa misma cabeza y agregado obligatorio. Si se detecta fallo, revisar el job/log concreto y corregir en la misma rama. Después continuar SI-GROQ-02/03/04 por sus dependencias externas; no activar audio ni flags por inferencia. Mantener G14 como agente único y folios pendientes.

## 13. Recuperación de contexto y criterio de calidad del diálogo · 2026-11-11

### 13.1 Referencias explicadas por el operador

El operador aclaró que **Limitless.ai es un ejemplo del nivel de calidad esperado en la transcripción de un diálogo en vivo**. No pidió integrar Limitless. La referencia sirve para fijar la expectativa de resultado: el producto debe presentar una conversación continua y útil, no solo reconocer palabras aisladas.

También explicó el antecedente de haber usado **Voicemeeter y VB-CABLE** para enrutar el audio de una llamada hacia una entrada de audio y construir una solución de transcripción. Se registra como experiencia previa de ruteo, no como requisito de adoptar esos componentes. La arquitectura actual de SI conserva dos pistas separadas: audio remoto de navegador y micrófono propio del intérprete.

### 13.2 Criterio rector de calidad

La salida principal de SI debe ser un **diálogo fiel, legible y cronológicamente correcto en vivo**. No debe resumir, parafrasear ni completar lo inaudible. Debe conservar negaciones, cifras, nombres, términos críticos, cambios de idioma, correcciones, interrupciones y solapamientos. Los turnos deben leerse naturalmente sin cortes arbitrarios ni fusiones entre hablantes. La puntuación y agrupación pueden mejorar legibilidad, pero no cambiar el contenido.

La atribución es una dimensión independiente de la exactitud léxica: INTÉRPRETE se asigna por procedencia del micrófono propio; el audio remoto conserva AUDIO REMOTO · HABLANTE NO VERIFICADO mientras no haya pista separada o metadata verificable. No inferir identidades de participantes por voz, idioma, acento, género o contenido.

### 13.3 Puerta de benchmark

El harness existente de WER/CER, términos críticos, atribución y latencia es una base instrumental; no acredita por sí solo calidad acústica alta. La aceptación exige un corpus autorizado y referencia humana alineada por fuente/segmento que incluya español e inglés, cambios de idioma, nombres y cifras, ruido, variación de volumen, interrupciones y voces simultáneas. Medir WER/CER por canal y global, recall de términos críticos, atribución con ground truth, turnos incorrectos, pérdida/duplicación, cronología/desfase y latencia p50/p95. Revisar además legibilidad del diálogo completo. Los umbrales deben fijarse antes de la prueba, no ajustarse después de ver el resultado.

La ventana de 6.5 s / overlap de 500 ms / hop de 6 s sigue siendo candidata: no se declara óptima sin medir precisión, latencia, pérdida, duplicados, cuota y coste.

### 13.4 Estado GitHub revalidado en esta retoma

- RDC comprobado para el alias funcional Fila 4; árbol limpio al inicio, rama `work/g14-groq-dual-clean-20261111`, HEAD local `366fdd8514cd5e027b702864ab331e8ca27efcbc`. Se omiten identificadores efímeros y la ubicación del checkout.
- PR #84 reconsultada: OPEN / DRAFT / NOT MERGED; head 366fdd8514cd5e027b702864ab331e8ca27efcbc; GitHub devolvió mergeable=false. Los runs exactos 43100336938, 43100336979, 43100337042 finalizaron SUCCESS. La auditoría tuvo jobs guards, captions, syntax, observability y audit; el host nativo y package integrity también pasaron.
- main observado en 7fc3597ac734976b3b9fe0491841ccdf0561bc72. La comparación desde el merge-base 8bfc2eaf5feb277ca821f12958df5f96e5845e0f identifica 19 commits adicionales en main, todos limitados a observations/**; por eso se mantiene separada la rama de código y no se absorbe cada snapshot automático.
- Issue #85 sigue abierta como seguimiento interno de ejecuciones antiguas de Actions sin jobs/cancelación coherente. No se ha abierto un ticket de soporte de GitHub.
- Persisten las compuertas: no hay prueba acústica real, llamada Groq con audio, credencial local verificada, ZDR/cuotas de cuenta confirmados ni carga Chrome autorizada. Flags false; sin aceptación, merge, deploy o release.

### 13.5 Continuidad

Retomar desde PR #84 y desde el benchmark de calidad de extremo a extremo; no redescubrir arquitectura ni convertir Limitless/Voicemeeter en dependencias. La siguiente mejora útil debe aportar evidencia de fidelidad/legibilidad/latencia por fuente, sin rebajar controles de privacidad ni atribuir hablantes sin ground truth. La última salida del modelo anterior continúa preservada literalmente en §11.2; no volver a reconstruirla.

## 14. Nueva mejora del evaluador y CI en curso · 2026-11-11 · HEAD 305d8d86

### 14.1 Trabajo publicado

- Desde el entorno funcional Fila 4 se amplió `tools/evaluate-dialogue-quality.mjs`, junto con `tools/dialogue-quality-evaluation-tests.mjs` y `tools/README-dialogue-quality.md`; la ruta del repositorio y la cuenta de Windows no se conservan.
- Commit local y remoto de la rama de PR: `305d8d862be629af0fc96e35701adc29be15013c`; push normal/fast-forward confirmado a `feat/groq-dual-main-20261111`. Árbol de trabajo local limpio tras el commit.
- Nuevas métricas estructurales: turnos agrupados por fuente/`speakerId` con silencio configurable; precisión/recall/F1 y turnos omitidos/extra; inversiones cronológicas adyacentes en el orden original; pares de solapamiento entre audio remoto e intérprete preservados/omitidos/extra y diferencia en milisegundos. El informe continúa sin emitir texto.
- La heurística de turnos no constituye diarización ni inventa hablantes. Con referencia sin identidad, el track se mantiene como desconocido. Los defaults 1,200 ms / 100 ms son parámetros de evaluación, no umbrales de producto aprobados.

### 14.2 Evidencia local Fila 4

- Suite captions del workflow: 14/14 PASS.
- Inventario/verificador del paquete: 66/66 SHA-256 PASS.
- Regresiones críticas de audio/Connect/presence: 8/8 PASS.
- Syntax check del evaluador y su suite, prueba estructural, suite CLI del evaluador y `git diff --check`: PASS.
- No se ejecutó localmente `observability-package-audit.mjs observations` por sparse checkout; el resultado CI remoto queda pendiente.

### 14.3 Estado remoto revalidado

- PR #84 OPEN / DRAFT / NOT MERGED; head `305d8d862be629af0fc96e35701adc29be15013c`; último read-back de metadata `mergeable=true`.
- CI de este SHA se observó IN_PROGRESS: Package integrity run `43115403310`; native-caption-host-build `43115403381`; signal-observability-audit `43115404314`. No trasladar los PASS del SHA anterior `366fdd85` a este commit.
- `main` observado: `496cbb928fdef71468efe51562a94812f3b4d57b`. Compare rama→main: `main` 47 commits delante y rama 12 commits delante; cambios del lado main: snapshots `observations/**` y actualizaciones de `OBJETO-CANONICO.md`/esta crónica. No hacer merge/sync automático de los snapshots.
- Issue #85 permanece abierta como seguimiento interno de colas Actions históricas sin jobs; no es ticket de soporte GitHub.

### 14.4 Compuertas externas y continuidad

Siguen sin ejecutarse audio/captura real, llamada Groq con audio, verificación de ZDR/cuotas, credencial local ni instalación en Chrome autorizado. Flags false. No hay WER/CER acústico ni latencia real; no aceptación, merge, deploy o release. Próximo paso: recoger los tres workflows del SHA `305d8d86`, diagnosticar fallos si los hubiera y no declarar aceptación de calidad sin corpus humano autorizado.

## 15. Cierre CI del HEAD 305d8d86 · 2026-11-11

### 15.1 CI remoto

Los tres workflows del SHA exacto `305d8d862be629af0fc96e35701adc29be15013c` completaron correctamente:

- Package integrity `43115403310`: SUCCESS, job `package-integrity`.
- native-caption-host-build `43115403381`: SUCCESS, job `compile-and-protocol-smoke-test`.
- signal-observability-audit `43115404314`: SUCCESS, jobs `guards`, `syntax`, `observability`, `captions` y `audit`.

Total: siete jobs de tres workflows, todos completed/success en la misma cabeza. Esto valida código, regresiones y pipeline CI de ese SHA, no permisos reales de Chrome, API Groq con audio, calidad acústica ni aceptación del producto.

### 15.2 Estado de PR y base

PR #84 OPEN / DRAFT / NOT MERGED; HEAD `305d8d862be629af0fc96e35701adc29be15013c`; metadata consultada dos veces `mergeable=true`. El punto de comparación antes de esta actualización documental era main `aad9da320e8e9df7015c3627a893b21f49329119`, 50 commits del lado main, 12 de rama y merge-base `8bfc2eaf5feb277ca821f12958df5f96e5845e0f`. Los archivos del lado main consistían en `observations/**` y las tres rutas documentales del frente; no hay rutas `observations/` en la PR. Evitar sincronización automática del flujo de snapshots.

### 15.3 Continuidad y límites

El evaluador estructural queda implementado, documentado, probado localmente y validado por CI. Falta benchmark acústico con referencia humana autorizada y umbrales predefinidos. Continúan pendientes Chrome autorizado, ZDR/cuotas, secreto local y smoke test API; no hubo llamada Groq con audio ni captura real. Flags false, sin aceptación, merge, deploy o release. G14 continúa agente único; FOL1 preparada/no activa; folios pendientes/no asignados; MCP normativo desactivado.

## 16. Reconciliación de gobernanza v389 y retoma limpia · 2026-11-11

### 16.1 Fuente normativa

Se releyó `SeryMente/metodologia/main:gobernanza/METAPROMPT-CANONICO-SAMANTHA.html`: Samantha v389 · NX-389m · Metacanon 1.30 · GOW 2.19; blob `bcd99e72113f444a045d7f1c91b4ad36865b8ea8`. §ARR (`gow-sec-14`) es vocabulario de entrada, no autoridad: Ser y Mente, GOW, DUG, principios/anexos, IPZ, frente/módulo, repositorio/main, OCP, control, ciclo/conversación, MCP-NORMATIVO, MCP-OCP, binomio A/B, CNP y PAI.

### 16.2 Principios y límites aplicados

- CNP leído en texto normativo: P001 cascada/precedencia; P004 no-simulación; P005 autorización previa para cambiar normas del MP; P038 autoridad de `metodologia/main`; P043 PAI.
- ART-013 §§2–4: Fila 4 es el alias funcional autorizado por el operador. Los identificadores técnicos de RDC son efímeros y se usan solo durante el preflight vivo; no persistir hostnames, Device IDs, nombres de sesión, SID, cuentas ni rutas de perfil en OCP, crónica o backlog. No inferir continuidad entre conexiones.
- GOW §37.3: no calcular edad d.h.m., duración, latencia ni intervalos; se conserva la revisión/versión y su hash.
- Control leído: G14 ACTIVO / agente único / generación 14; FOL1 PREPARADA / NO ACTIVA; folio PENDIENTE / NO ASIGNADO; MCP normativo DESACTIVADO. El UUID/folio son metadatos de auditoría, no IDs nativos ni permisos.

### 16.3 Estado del frente tras la corrección

PR #84 OPEN / DRAFT / NOT MERGED; HEAD `305d8d862be629af0fc96e35701adc29be15013c`; CI 3/3 workflows / 7/7 jobs SUCCESS. Evaluador estructural publicado y documentado; sigue pendiente el benchmark acústico humano autorizado. Las compuertas Chrome autorizado, ZDR/cuotas Groq, credencial local y prueba API controlada no se han abierto. Flags siguen false; no aceptación, merge, deploy ni release.
## 17. Benchmark de alta calidad, latencia visible y CI final · 2026-11-11

### 17.1 Runner y protocolo

El HEAD 6b14c0fad64cbc8eef364c496a6a96043c9dbbf1 incorpora tools/evaluate-dialogue-benchmark.mjs, tools/verify-dialogue-media.mjs, sus regresiones y tools/README-dialogue-benchmark.md. El runner agrega múltiples grabaciones con WER/CER ponderado y macro, bootstrap por grabación, términos críticos, atribución, turnos, cronología, solapamientos y cortes por estratos. El verificador exige WAV PCM s16le mono 16 kHz y manifiesto/audio privados fuera del repo, cotejando SHA-256 y duración.

El protocolo diferencia purpose=tuning + split=validation (salida TUNING_ONLY, sin PASS/FAIL) y purpose=acceptance + split=test (requiere perfil ratificado, muestra suficiente y test congelado). El perfil tools/dialogue-benchmark-acceptance-profile-high-quality.json sigue PROPOSED_NOT_RATIFIED: ≥60 grabaciones, ≥20 por estrato, ≥10.000 palabras por fuente, WER ≤10%, macro-WER bootstrap upper ≤12%, CER ≤5%, recall crítico 100%, F1 de turnos ≥95%, recall de overlap ≥95%, cronología 0 inversiones, peor p95 visible ≤2.500 ms y peor máximo ≤5.000 ms. No está aprobado ni se ejecutó el test.

### 17.2 Latencia visible instrumentada

La ventana de audio marca el evento ready con reloj monotónico. El overlay confirma segmentos nuevos tras dos frames cuando el documento está visible; el background calcula la diferencia solo si ambos eventos comparten performance.timeOrigin. Se excluye la latencia si la página está oculta, el overlay no está disponible o los relojes no coinciden. La captura mantiene p50/p95/max y número de ventanas por fuente en memoria hasta detenerse. La latencia HTTP de Groq queda separada y no sustituye la latencia percibida. Los segmentos guardan offsets relativos al inicio de grabación para benchmark; no se persisten transcripciones ni audio.

### 17.3 CI final

En el SHA exacto 6b14c0fad64cbc8eef364c496a6a96043c9dbbf1: Package integrity 43119571803 SUCCESS; Observability audit 43119571875 SUCCESS con guards/captions/syntax/observability/audit; Native caption host build 43119571912 SUCCESS con compilación, empaquetado, framing Native Messaging y cierre limpio. Total 3/3 workflows y 7/7 jobs SUCCESS.

### 17.4 Estado y bloqueos

PR #84 OPEN / DRAFT / NOT MERGED; HEAD 6b14c0fad64cbc8eef364c496a6a96043c9dbbf1; última metadata mergeable=true. CI sintético/estructural PASS no es aceptación acústica. No hay corpus no clínico consentido, dos anotadores y gold adjudicado, credencial local, ZDR/cuotas verificadas ni Chrome autorizado. No se invocó Groq con audio ni se capturó audio real; flags siguen false. G14 conserva titularidad única; FOL1 preparada/no activa; folios pendientes/no asignados; MCP normativo desactivado. No merge, deploy ni release.
# Crónica · housekeeping y preparación de prueba 0.10.38 · 2026-10-30 · generación 5

## Entrada del operador (literal)

```text
El laboratorio ya no me interesa tanto, este, nada más me interesa que funcione. CUando la pruebe yo en vivo. Haz expedito est eproceso de house keeping de not ener prs pejndientes, y el maina cutalizado, y la extension servida en escritorio para usarse via rdc.

Cionfoirmame si aun tengo que insrtalr el puente manual.
```

## Identidad y gobierno adquiridos

- Repositorio/FT: `SeryMente/signal-interpreter`, OCP `docs/frentes/signal-interpreter/OBJETO-CANONICO.md`.
- Rol de esta sesión: Samantha · constructor.
- Folio activo: `SES-20261030-3B3868DF`; generación 5 · ACTIVA. Control `docs/frentes/signal-interpreter/CONTROL-RESPONSABILIDAD.json`, blob SHA `d057a5db249939c381892f831d76a81103190074`; transferencia G5 ya estaba verificada. UUIDv7 local `01a18d7d-1369-7059-b029-8a9104b94647`, no ID nativo.
- Gobierno releído desde `SeryMente/metodologia/main`: Samantha v363 · NX-363m; Metacanon 1.25; GOW 2.12; blob de `gobernanza/METAPROMPT-CANONICO-SAMANTHA.html`: `35c0f8f12d7c7f417cd6986f55851759667bd4ca`. P001, P037–P039; Metacanon §§4, 24 y 28 revisados. `MCP-NORMATIVO: DESACTIVADO`.
- Metacanon §24 reserva RDC al rol asistente y prohíbe que el constructor lo use para descubrimiento, lectura o escritura. El objeto de SI mantiene Samantha como constructor y Claudia como asistente.

## Estado previo verificado

- `main` antes de la integración: `bfbc1ecbf5d183100d3201602e168f0af76bf432`; manifiesto 0.10.37.
- PR #67 abierta, draft, mergeable; head `6057c1709341f1cd10b175c901765ea7017fff79`, diff de 40 archivos, 72 commits por delante y 0 por detrás. No tenía reviews ni review threads pendientes.
- Tres workflows de PR #67 concluyeron `success` sobre ese head exacto: `signal-observability-audit` run 41086786306; `Package integrity` run 41086786317; `native-caption-host-build` run 41086786398. Son checks de la cabeza de PR, no se reinterpretan como una ejecución nueva sobre el merge commit.
- PR #59 estaba abierta y draft; su diff se limitaba a `extension/caption-lab.js`, `extension/live-caption-bridge.js`, `extension/live-caption-overlay.js`, `extension/ui/lab.js`, `payload-sha256.json`, `tools/caption-lab-test.mjs` y `tools/native-path-evidence-test.mjs`. Comparación remota: rama con 1 commit propio y 8,020 commits de divergencia frente a main. No se asumió que sus cambios estuvieran integrados en #67.
- No había otros issues abiertos relevantes en la consulta de issues; la consulta de PRs abiertas dio inicialmente #59 y #67.

## Directiva e integración ejecutada

1. El operador indicó que el laboratorio deja de ser prioritario y pidió housekeeping: ninguna PR abierta y `main` actualizado para la prueba real. Se tomó esa instrucción como autorización expresa para cerrar #59 sin merge y fusionar #67 para preparar la prueba, no como aceptación ni liberación.
2. Se añadió a PR #59 un comentario de cierre que explica la decisión del operador (comentario 6527583731) y se cerró sin fusionar. Estado releído: `closed`, `merged=false`, `merged_at=null`. La rama/historial no se borraron.
3. Se añadió a PR #67 una adenda que distingue la autorización de merge de la aceptación local y de la liberación; se pasó de draft a ready.
4. Se fusionó PR #67 con método `merge` y precondición `expected_head_sha=6057c1709341f1cd10b175c901765ea7017fff79`. Resultado del host GitHub: `merged=true`, merge commit `a61eb7e7c1bba98d42fad31e0af5e3a6e861c968`.
5. Lectura posterior de GitHub: PR #67 `closed/merged=true`, fecha `2026-10-30T16:16:26Z`; PR #59 `closed/merged=false`; búsqueda `is:pr is:open` devolvió cero resultados. `manifest.json` releído en `main`: versión `0.10.38`, blob SHA `e4ffa2056971f19ce8275fc30a8cb97cf00f7415`.
6. No se creó release. La aceptación de Windows/Chrome, Live Caption real y comportamiento en llamada sigue pendiente del operador.

## Puente Native Messaging — conclusión documental

Inspección de `INSTALAR.ps1`, `PREPARAR-Y-CARGAR.cmd` y sus recibos en el head integrado:

- No se requiere una instalación manual separada del puente. `PREPARAR-Y-CARGAR.cmd` invoca el `INSTALAR.ps1` de la raíz.
- El instalador verifica el manifiesto/identidad e inventario SHA-256, decodifica y valida el ejecutable incluido, corre el probe de protocolo, instala el host en `%LOCALAPPDATA%\SignalInterpreter\NativeMessagingHost`, crea el manifiesto Native Messaging y registra su ubicación en HKCU; después hace probe contra el ejecutable instalado.
- La preparación debe ejecutarse con la misma cuenta de Windows que utiliza Chrome. El script no reinicia Chrome y no necesita Node.js, Python, compilador ni elevación administrativa.
- Sigue siendo una acción manual cargar la carpeta raíz (la que contiene `manifest.json`) en `chrome://extensions` mediante **Cargar descomprimida**. No cargar la subcarpeta `extension/` ni mover la raíz después.
- Esto describe el comportamiento del código; no demuestra que el puente haya sido instalado en el equipo del operador ni que Chrome haya cargado la extensión.

## Escritorio / RDC — límite y no-acción

- No se materializó ni se instaló la extensión en el Escritorio. No se leyó, escribió ni ejecutó ningún archivo/proceso remoto.
- Se realizó una sola consulta de inventario de dispositivos antes de detectar en el OCP y Metacanon §24 la prohibición de RDC para el rol constructor. La respuesta mostraba PC-14 Online y las entradas PC-8 Offline; no se seleccionó equipo ni se realizaron operaciones sobre ellos. Registrar la consulta como desviación de compuerta, no como trabajo remoto ejecutado.
- La operación RDC queda bloqueada para este rol. No se delegó a una instancia Claudia ni se fingió que existiera una. El despliegue en Escritorio debe ser realizado por la instancia/rol asistente autorizado con su propia verificación de identidad, vinculación, equipo y alcance; o por el operador localmente.
- Se actualizó la guía del repositorio para que el paso manual del puente no se interprete mal.

## Límites de evidencia y próximo checkpoint

- Observado/verificado: PRs cerradas con estados distintos; cero PR abiertas en la consulta posterior; merge commit de #67; manifiesto 0.10.38 en main; tres workflows verdes sobre el SHA pre-merge; contenido del instalador automático.
- No verificado: estado actual del escritorio del usuario, instalación del host, carga de extensión en Chrome, disponibilidad del árbol UI Automation y recepción de captions reales.
- Siguiente acción humana: obtener la carpeta raíz de `main` 0.10.38 en el equipo destino, ejecutar `PREPARAR-Y-CARGAR.cmd` una sola vez fuera de llamada y con la cuenta de Chrome, cargar raíz en Chrome, y realizar la prueba viva. Reportar PASS/FAIL, SHA/versión y telemetría saneada; no compartir audio ni texto hablado.
- Criterio de salida de este ciclo: housekeeping GitHub completado; despliegue físico y aceptación de producto permanecen pendientes. No afirmar «todo terminado» ni «liberado».

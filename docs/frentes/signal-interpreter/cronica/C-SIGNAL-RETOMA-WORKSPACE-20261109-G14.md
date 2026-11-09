# Retoma SI · custodia del export y raíz de trabajo · 2026-11-09 · G14

## Resultado de custodia

Se localizó `ChatGPT-SI-20261109-1036.md` en Downloads de una instancia Cyber efímera etiquetada `PC-14`. La conexión no se considera persistente por nombre.

- Tamaño de origen: **53,383 bytes**.
- Conteo informado por Desktop Commander: **1,301 líneas**.
- SHA-256 de origen y destino: `54F720A283CA87AA0B7255D5C2F4F4EEA68F006E10F825E0737A8ECE6649D809`.
- Copia preservada en perfil fila4: `C:\\Users\\fila4\\Desktop\\SI-backups\\source-exports\\ChatGPT-SI-20261109-1036.md`.
- Resultado: **cotejo SHA-256 exacto**; el archivo privado fue leído de vuelta en su inicio y cierre.
- El export crudo no se incorpora al repositorio público. El recibo de evidencia contiene sólo metadatos de custodia y hash.

## Instrucción operativa consolidada

El último prompt del export fija la raíz de trabajo bajo la carpeta ya instanciada de SeryMente:

- Raíz del repositorio: `C:\\Users\\fila4\\Desktop\\SeryMente\\Signal Interpreter`.
- Extensión para carga manual en Chrome: `C:\\Users\\fila4\\Desktop\\SeryMente\\Signal Interpreter\\extension`.

La regla quedó formalizada como **SI-OP-02** en `REGLAS-OPERATIVAS.md`. No se debe crear una raíz paralela `Desktop\\Signal Interpreter` ni cargar la raíz del repositorio en lugar de `extension`.

## Estado real del Escritorio fila4

La raíz normativa existe y contiene `extension`; por lo tanto, no fue necesario clonar ni crear una estructura duplicada.

La inspección observó:
- Checkout `SeryMente\\Signal Interpreter`: rama `main`, 892 commits detrás de `origin/main`, cuatro archivos tracked modificados y dos archivos no seguidos. Se preservó intacto; no se ejecutó reset, clean, reemplazo ni sincronización sobre él.
- `manifest.json` de la raíz: versión **0.10.40**.
- `extension\\manifest.json`: versión **0.10.42**. Esta es la carpeta que el operador puede seleccionar para carga manual conforme a la instrucción registrada.
- Worktree automatizado separado: `SeryMente\\SI-G14-RECONCILE`, rama `work/g14-pr75-reconcile`, commit observado antes de esta documentación `4645281ce204f05d2f824da3bf1ef97dadce8851`, limpio en esa observación.
- Carpeta distinta `Desktop\\Signal Interpreter`: no es un clon Git y declara versión **0.10.36**; no se adopta como raíz del frente.

## Límites

No se reemplazó el checkout operativo ni se recargó Chrome. No se ejecutó instalador Native Messaging, no se abrió ni alteró una llamada real y no se declaró aceptación funcional. La disponibilidad de la carpeta `extension` sólo acredita que existe una carpeta materializada; la versión activa de Chrome debe confirmarse por separado.

La conexión `PC-14` se utilizó únicamente como fuente de lectura del export. El original fue preservado en fila4 antes de finalizar esta sesión; las instancias Cyber `PC-N` siguen clasificadas como efímeras.

## Referencias

- Regla operativa: `SI-OP-02` en `REGLAS-OPERATIVAS.md`.
- Recibo de custodia: `evidencias/RECIBO-EXPORT-CHATGPT-SI-20261109-1036.json`.
- PR: #75, rama `fix/performance-overlays-autoanswer-01043-20261108`; permanece en borrador y sin merge.

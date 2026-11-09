# Reglas operativas — Signal Interpreter

**Estado:** PROVISIONAL · regla operativa por defecto para materializaciones Windows  
**Ámbito:** frente Signal Interpreter; Chrome en el usuario operativo de Windows  
**Identificador:** SI-OP-01

## SI-OP-01 — Native Messaging host obligatorio al materializar en Windows

### Regla

Cuando el operador solicite materializar, actualizar o preparar para cargar Signal Interpreter en el Escritorio de un usuario operativo de Windows, la rutina estándar debe instalar y verificar también el Chrome Native Messaging host `com.signalinterpreter.captionhost`, bajo el mismo perfil de Windows que utilizará Chrome.

Copiar la carpeta de la extensión o cargarla como “unpacked” no basta para declarar completa la materialización. La instalación del host nativo es una fase obligatoria de la misma rutina, no una tarea opcional o un seguimiento que pueda olvidarse.

### Rutina normativa

1. **Identidad y titularidad.** Confirmar PC, usuario de Windows operativo y ruta destino autorizada. El host debe registrarse en el perfil del mismo usuario que ejecutará Chrome. No instalarlo bajo otra cuenta, en `HKLM`, ni elevar privilegios por conveniencia. Si Chrome pertenece a otro usuario o no puede verificarse la identidad, detenerse.
2. **Integridad del paquete.** Preservar la versión anterior y sus artefactos; verificar `manifest.json`, ID estable de la extensión e inventario SHA-256 antes de instalar. No sobrescribir respaldos ni artefactos ajenos al paquete.
3. **Entrada única.** Ejecutar `PREPARAR-Y-CARGAR.cmd` desde la raíz materializada (la que contiene `manifest.json`). El wrapper invoca `INSTALAR.ps1` sin opción de omitir el puente y detiene la rutina si el instalador devuelve error.
4. **Instalación Native Messaging.** `INSTALAR.ps1` debe validar el SHA-256 fijado del ejecutable embebido, materializarlo en `%LOCALAPPDATA%\SignalInterpreter\NativeMessagingHost`, generar el manifiesto con la ruta absoluta y el `allowed_origins` exacto de la extensión, registrar la ruta del manifiesto en `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.signalinterpreter.captionhost` y ejecutar la prueba de protocolo sobre la ruta registrada.
5. **Fail-closed.** No continuar a la carga/reload de la extensión si falla hash, manifiesto, registro, identidad de origen, prueba de protocolo o verificación del usuario. No detener por la fuerza un host activo ni manipular una llamada. Si existe un conflicto, preservar el estado y reportarlo.
6. **Read-back.** Leer de vuelta la clave `HKCU`, el manifiesto registrado y el ejecutable estable; comprobar ruta, origen permitido y SHA-256. Guardar recibo con versión, usuario, rutas y resultado de protocolo. La instalación solo se declara verificada cuando todas estas comprobaciones pasan.
7. **Carga de Chrome.** Después del PASS del puente, el operador carga o recarga manualmente la carpeta de la extensión desde Chrome. No abrir ni manipular GUI mediante RDC salvo autorización explícita independiente. No declarar Chrome activo ni aceptación funcional hasta verificar la versión efectivamente cargada y la prueba de uso correspondiente.

### Compuerta de aceptación

La materialización Windows queda en estado **PREPARADA, NO COMPLETA** mientras falte cualquiera de estos puntos:

- ejecutable nativo materializado y SHA-256 coincidente;
- manifiesto Native Messaging con ruta absoluta y origen Chrome exacto;
- registro presente en el `HKCU` del usuario operativo;
- prueba del protocolo sobre la ruta registrada con resultado PASS;
- read-back conservado;
- carga manual de la extensión y versión activa confirmadas por el operador.

### Separación de componentes

El Native Messaging host `com.signalinterpreter.captionhost` es el puente entre Chrome y el proceso nativo declarado por la extensión. No debe confundirse con el lector Windows UI Automation de `bridge/windows-uia`, que es un componente separado con transporte y ciclo de vida propios. Instalar uno no demuestra que el otro esté instalado o ejecutándose.

### Excepción

Solo una instrucción expresa del operador puede dispensar SI-OP-01 para una materialización concreta. La excepción debe registrarse con su alcance y no cambia la regla por defecto.

### Evidencia de implementación del procedimiento

En el paquete 0.10.43 revisado, `PREPARAR-Y-CARGAR.cmd` llama directamente a `INSTALAR.ps1` y se detiene si falla; el instalador valida el host, registra bajo `HKCU` y realiza una prueba de protocolo. Este documento formaliza que esa vía debe utilizarse en toda materialización Windows.

**Límite de verificación actual:** la inspección de solo lectura en PC-13 encontró ausente la clave Native Messaging del usuario de esa sesión. No se ejecutó el instalador ni se modificó el registro en esta retoma; por tanto, SI-OP-01 queda documentada, pero la instalación del host en PC-13 permanece **NO EJECUTADA / NO VERIFICADA**.


## Verificación fila4 · SI-OP-01 · 2026-11-08 · G14

La lectura de vuelta del perfil Windows CENTRAL\\fila4 confirma que la clave HKU/<SID fila4>/Software/Google/Chrome/NativeMessagingHosts/com.signalinterpreter.captionhost existe y apunta a C:/Users/fila4/AppData/Local/SignalInterpreter/NativeMessagingHost/com.signalinterpreter.captionhost.json.

El manifiesto leído declara:
- name: com.signalinterpreter.captionhost
- type: stdio
- path: C:/Users/fila4/AppData/Local/SignalInterpreter/NativeMessagingHost/SignalInterpreter.CaptionHost.exe
- allowed_origins: chrome-extension://ldpbjhobnfgmhdoehehdmnbhhjckebmj/

El ejecutable existe y su SHA-256 es 313CCD3312A8C75131EC7C4ADFEBF883B028BCE8AEE8B1EA43BD4DDDBB202EFE, coincidente con ExpectedSha256 del paquete candidato.

La lectura histórica de PC-13 que informó ausencia de la clave se limita a ese perfil/equipo y no contradice la existencia verificada en fila4. Esta comprobación acredita registro y binario; no acredita que Chrome haya recargado 0.10.45 ni la ejecución funcional del host en una llamada.


## SI-OP-02 — Raíz operativa única bajo SeryMente

### Regla

La raíz de trabajo Windows del frente Signal Interpreter para el usuario operativo fila4 queda fijada en:

`C:\\Users\\fila4\\Desktop\\SeryMente\\Signal Interpreter`

El repositorio completo vive directamente en esa carpeta. La carpeta que el operador carga como extensión descomprimida en Chrome es, específicamente:

`C:\\Users\\fila4\\Desktop\\SeryMente\\Signal Interpreter\\extension`

La subcarpeta `extension` es el destino de **Cargar descomprimida**; no se debe seleccionar la raíz del repositorio ni crear otra subcarpeta de extensión dentro de ella.

### Rutina normativa

1. **Destino canónico.** Materializar y trabajar bajo `Desktop\\SeryMente\\Signal Interpreter` del perfil `fila4`. No crear una copia paralela en `Desktop\\Signal Interpreter` ni confundirla con la raíz del frente.
2. **Carga de Chrome.** La única ruta de extensión que se debe proporcionar al operador para cargarla manualmente es `C:\\Users\\fila4\\Desktop\\SeryMente\\Signal Interpreter\\extension`. Antes de indicar una versión, leer `extension\\manifest.json` en ese directorio; no inferirla del manifiesto de la raíz del repositorio.
3. **Separación de identidades.** MantenimientoRCI puede operar RDC, pero los artefactos y rutas de trabajo deben pertenecer al perfil Windows `fila4`. Las instancias `PC-N` de Cyber son efímeras: no son raíces persistentes ni destinos de trabajo.
4. **Preservación del checkout.** Antes de sincronizar, inspeccionar `git status`, rama, HEAD y divergencia. Si hay modificaciones o archivos no seguidos, no ejecutar reset, clean, checkout destructivo ni reemplazo de carpeta. Reconciliar desde un worktree separado, preservar los cambios originales y sólo integrar después de revisión.
5. **Instancia existente.** Si la raíz y `extension` ya existen, verificarlas y reutilizarlas; no clonar encima ni crear duplicados. La existencia de la carpeta no prueba que Chrome haya cargado esa versión.
6. **Aceptación.** El operador realiza la carga/reload desde Chrome salvo autorización independiente. Registrar por separado versión del manifiesto, ruta seleccionada, versión efectivamente cargada y aceptación funcional. La preparación de la carpeta no equivale a aceptación.

### Estado observado al fijar la regla · 2026-11-09 · G14

- La ruta `C:\\Users\\fila4\\Desktop\\SeryMente\\Signal Interpreter` existe y contiene el repositorio y la subcarpeta `extension`.
- El checkout de esa ruta está en `main`, 892 commits detrás de `origin/main`, con cuatro archivos tracked modificados y dos archivos no seguidos. Se conserva intacto; no se sincronizó ni reemplazó.
- El manifiesto raíz leído declara `0.10.40`; el manifiesto de `extension` declara `0.10.42`. La carpeta indicada para carga manual es la subcarpeta `extension`.
- El worktree aislado `Desktop\\SeryMente\\SI-G14-RECONCILE` estaba limpio en el commit `4645281ce204f05d2f824da3bf1ef97dadce8851` al iniciar esta retoma. Se utiliza para reconciliación automatizada sin alterar el checkout operativo.
- La copia antigua `Desktop\\Signal Interpreter` no tiene metadatos Git y declara `0.10.36`; no es el directorio de trabajo normativo.

La regla fija la ruta de trabajo, pero no autoriza por sí sola instalar el host, reemplazar artefactos locales, recargar Chrome, iniciar llamadas ni liberar una versión.



## SI-OP-03 — Prohibición de raíces duplicadas y reutilización del workspace existente

### Regla obligatoria

**Nunca crear una segunda carpeta raíz de Signal Interpreter si ya existe una carpeta del repositorio dentro del workspace `SeryMente`.** Windows trata los nombres de archivo y directorio sin distinguir mayúsculas/minúsculas en condiciones habituales; por lo tanto, `Signal Interpreter`, `signal-interpreter` y variantes equivalentes no se deben tratar como espacios distintos.

### Procedimiento previo a toda materialización

1. Enumerar las carpetas existentes dentro de `Desktop\\SeryMente` y localizar coincidencias del nombre del repositorio sin distinguir mayúsculas/minúsculas ni guiones/espacios cuando la comparación sea ambigua.
2. Inspeccionar cada candidato: ruta completa, contenido, metadatos Git, rama, HEAD, estado local y subcarpeta `extension`.
3. Si ya existe el directorio previsto, **reutilizar exactamente esa ruta**, aunque esté vacío. Materializar dentro de él; nunca crear un hermano con distinta capitalización o formato del nombre.
4. Si el directorio existente no está vacío, preservar su contenido y reconciliar cuidadosamente; no ejecutar `reset`, `clean`, reemplazos, movimientos ni eliminaciones sobre datos no inspeccionados.
5. Si existe más de un candidato, detener la creación de carpetas. Comparar inventario, tamaños, hashes, origen y metadatos; determinar cuál conservar antes de actuar. Retirar sólo una duplicación creada durante la operación actual, y únicamente después de probar que el contenido que se conserva está completo.
6. La única subcarpeta destinada a la carga manual de Chrome es `<raíz única>\\extension`. No crear otra raíz de extensión en el Escritorio.
7. En instancias Cyber efímeras (por ejemplo, PC-N), reutilizar el workspace existente de esa instancia y tratarlo como temporal. Persistir los cambios que deban sobrevivir en el perfil durable fila4 antes de que termine la sesión. Esta regla no convierte PC-N en identidad ni almacenamiento persistente.

### Estado verificado de la corrección · PC-14 · 2026-11-09

- Antes de materializar, ya existía `C:\\Users\\PC 13\\Desktop\\SeryMente\\signal-interpreter`, vacío.
- Se creó por error una segunda raíz con capitalización distinta: `...\\Signal Interpreter`.
- Se identificó la duplicación y se reutilizó el directorio original en minúsculas. Se movieron allí los 193 archivos de la candidata; los conteos y bytes antes/después coincidieron exactamente: **193 archivos · 2,831,513 bytes**.
- La carpeta con mayúscula creada durante la operación quedó retirada. Lectura posterior confirmó una sola raíz: `C:\\Users\\PC 13\\Desktop\\SeryMente\\signal-interpreter`.
- La carpeta de carga resultante es `C:\\Users\\PC 13\\Desktop\\SeryMente\\signal-interpreter\\extension`; manifiesto cargable 0.10.45.
- La regla SI-OP-02 conserva la raíz persistente bajo el usuario fila4; esta SI-OP-03 impide que al operar en una instancia temporal se genere una segunda raíz por diferencias de nombre. En cada dispositivo se respeta y reutiliza el workspace preexistente de ese contexto.

**Prohibición de cierre:** no declarar completada una materialización si no se verificó que existe una sola raíz de Signal Interpreter en el workspace objetivo y que Chrome recibe la ruta `extension` perteneciente a esa raíz.

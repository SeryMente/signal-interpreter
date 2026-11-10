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


## SI-OP-02 — Workspace SeryMente y ubicación de Signal Interpreter

**Estado:** RATIFICADA por instrucción directa del operador · 2026-11-09 · G14  
**Ámbito:** directorio local de trabajo del frente Signal Interpreter en Windows.

### Estructura obligatoria

La raíz de trabajo del workspace es:

`%USERPROFILE%\\Desktop\\SeryMente`

Dentro de esa raíz, la carpeta exclusiva del frente/repositorio es:

`%USERPROFILE%\\Desktop\\SeryMente\\signal-interpreter`

La carpeta que el operador destina a cargar como extensión desempaquetada en Chrome es:

`%USERPROFILE%\\Desktop\\SeryMente\\signal-interpreter\\extension`

El nombre de carpeta del repositorio usa el slug `signal-interpreter` ya creado en el workspace; no crear otro clon paralelo llamado `Signal Interpreter` ni una segunda raíz de proyecto por diferencias de mayúsculas/minúsculas. El repositorio completo y sus documentos permanecen en `signal-interpreter`; `extension` es su subdirectorio designado para el paquete que carga Chrome.

### Reglas de identidad, autenticación y persistencia

1. Antes de escribir, verificar hostname, identidad Windows, perfil, ruta real de Desktop, Device ID RDC y contenido existente. No deducir identidad persistente a partir del nombre `PC-N`.
2. Los equipos `PC-N` de Cyber son instancias efímeras. Una reconexión con el mismo nombre puede ser otra máquina/sesión y no recupera archivos anteriores. El contenido local no se considera durable ni se presume continuidad.
3. El repositorio remoto GitHub, sus commits y sus lecturas de vuelta son la superficie durable. Antes de que una instancia Cyber expire, sincronizar los cambios autorizados al remoto y verificar SHA/read-back; no dejar la única copia de trabajo en el Escritorio efímero.
4. Para clonar o sincronizar mediante Git, usar la identidad y autenticación GitHub del usuario Windows propietario. No eludir la compuerta de autenticación, no incrustar PAT/tokens en URL, comandos, scripts o documentación y no copiar credenciales desde otro perfil.
5. Este workspace de Cyber está materializado en claro y el volumen C: no está cifrado. Se permite código fuente, clones Git y documentación técnica no sensible. Se prohíben contraseñas, tokens, claves API/B2, archivos `.env` con secretos, material DPAPI, bóvedas, notas de custodia, datos personales/sensibles y contenido de llamadas/transcripciones privadas.
6. Si no existe autenticación, si el repo no es un clon válido o si el destino contiene datos no conciliados, detener la escritura y reportar el bloqueo; nunca inicializar un Git nuevo encima del scaffold ni sobrescribir archivos sin inventario y preservación.

### Compuerta de carga de Chrome

La ruta destinada por el operador es `signal-interpreter\\extension`. Antes de indicar que está lista para **Cargar descomprimida**, comprobar en esa carpeta:

- existe `manifest.json` directamente en la raíz de `extension`;
- todos los archivos referidos por el manifiesto existen y sus rutas son relativas a esa misma raíz;
- el ID de extensión, la versión, los hashes y el inventario coinciden con la candidata;
- se cumplen SI-OP-01 y las comprobaciones del Native Messaging host en el mismo usuario Windows de Chrome.

**Resolución de layout verificada en rama candidata (PR #80 draft; no integrada):** el manifiesto canónico permanece en raíz y `extension/manifest.json` es su variante normalizada para cargar `extension/` en Chrome. `tools/unpacked-layout-test.mjs`, `portable-root-test.mjs` y `verify-release-package.mjs` pasan; suite local 42/42, 77 archivos JS sin errores y 8 scripts PowerShell parseables; 60/60 SHA-256. La carpeta activa debe actualizarse con respaldo; la carga y aceptación en Chrome siguen a cargo del operador. `main` no se modifica hasta revisión/merge autorizados.

### Estado de la instancia inspeccionada · 2026-11-09

- Workspace: `C:\\Users\\PC 13\\Desktop\\SeryMente`, equipo observado `PC-14`, identidad `pc-14\\pc 13`; esta identidad corresponde a la instancia Cyber activa y no es persistente.
- Scaffold: `C:\\Users\\PC 13\\Desktop\\SeryMente\\signal-interpreter` existe y estaba vacío (cero elementos); todavía no es un clon Git.
- Git for Windows 2.56.0 está instalado en `C:\\Program Files\\Git\\cmd\\git.exe`; GitHub CLI 2.103.3 en `C:\\Program Files\\GitHub CLI\\gh.exe`. `gh auth status` devolvió **NOT LOGGED IN**. No se clonó ni se escribió payload en esa carpeta.
- La presente regla fija la ubicación futura; no certifica que la extensión esté materializada/cargable, que el host nativo esté instalado ni que Chrome se haya actualizado.

La instrucción autoriza este workspace como superficie provisional para código y documentación técnica no sensible. No autoriza guardar secretos, capturar audio/micrófono real, intervenir llamadas, recargar/reiniciar Chrome, declarar aceptación funcional, fusionar PR, desplegar o crear release.

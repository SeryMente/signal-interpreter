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

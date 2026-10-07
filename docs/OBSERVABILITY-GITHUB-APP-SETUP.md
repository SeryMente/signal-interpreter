# Configuración GitHub para la observabilidad de Signal Interpreter

## Objetivo

Configurar una única GitHub App para que la extensión Chrome pueda publicar observabilidad directamente en SeryMente/signal-interpreter, sin secreto privado ni software residente en Windows.

## 1. Crear o editar la GitHub App

En GitHub, abre:

https://github.com/organizations/SeryMente/settings/apps

La App debe:

- habilitar Device Flow;
- usar user access tokens que expiran;
- solicitar solamente el permiso de repositorio Contents: Read and write;
- no solicitar permisos de administración, Actions, secretos ni otros permisos que la publicación de observabilidad no necesita.

GitHub documenta que el Device Flow debe habilitarse explícitamente y que un user access token de una GitHub App puede limitarse además a un repositorio concreto mediante repository_id.

## 2. Instalar la App

Instala la App únicamente en:

SeryMente/signal-interpreter

No se requiere instalarla sobre toda la organización.

## 3. Obtener el Client ID

Copia el Client ID de la GitHub App.

Ese valor no es un secreto. Se introduce en:

Signal Interpreter → Desarrollo → Sincronización GitHub → GITHUB APP CLIENT ID

No se debe introducir el Client Secret en la extensión.

## 4. Autorizar desde Chrome

En Signal Interpreter:

1. introduce el Client ID;
2. pulsa Conectar;
3. Chrome abrirá la URL de verificación de GitHub;
4. introduce el código mostrado;
5. concede acceso a la GitHub App;
6. vuelve a Signal Interpreter.

La extensión comprobará que el token resultante puede acceder al repositorio SeryMente/signal-interpreter.

## 5. Qué sucede después

La extensión publica batches saneados en:

observations/inbox/<batchId>.json

GitHub Actions consume ese inbox mediante el evento de publicación y, como respaldo, mediante un barrido programado cada 5 minutos. Genera:

- observations/batches/
- observations/platform-snapshots/
- observations/platform-deltas/
- observations/platform-index.json
- observations/platform-latest.json
- observations/manifest.json
- observations/latest/
- observations/health/github-build.json

No existe ningún servicio local intermedio.

## 6. Renovación

Con la expiración activada, GitHub entrega un access token temporal y un refresh token. La extensión conserva ambos en chrome.storage.local y renueva el acceso cuando es necesario.

No se registra el token en logs ni se escribe en el repositorio.

## 7. Resultado esperado

Chrome → GitHub API → GitHub Actions → paquete de observabilidad → siguiente ciclo de desarrollo

Windows no ejecuta ningún proceso, tarea programada, host nativo, watchdog, supervisor o servidor para sostener la observabilidad.

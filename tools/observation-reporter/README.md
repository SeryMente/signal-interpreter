# Observation Reporter

El reporter local recibe batches sanitizados desde 127.0.0.1:8788 y sincroniza observations/ con GitHub usando el Git configurado en el repositorio.

Cada evento marca el registro como pendiente; la extensión coalescea el envío para no bloquear captura, UI ni bridge. El envío automático normal ocurre en una ventana de hasta 2 minutos; eventos críticos fuerzan un intento inmediato. El reporter escribe cada batch localmente y agrupa commit/push durante 10 minutos.

La sincronización manual está disponible en la consola Live con SINCRONIZAR LOG.

El endpoint GET `/health` expone el último envío automático confirmado a GitHub y el último registro local de revisión por IA, con sus marcas temporales; no contiene credenciales ni contenido conversacional.

El estado persistente del reporter se guarda fuera del repositorio en `%USERPROFILE%\\.signal-interpreter\\observation-reporter-status.json`, evitando generar commits adicionales sólo para observabilidad de observabilidad.

No se exporta texto de conversación, captions, snapshots ni credenciales al repositorio.

Ejecución manual: .\tools\observation-reporter\run.ps1

Arranque automático al iniciar sesión de Windows: .\tools\observation-reporter\install-autostart.ps1

Requiere Node y un origin/main autenticado para git push.

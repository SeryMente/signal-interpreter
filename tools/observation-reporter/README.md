## Observation Reporter

El reporter local recibe lotes sanitizados en `127.0.0.1:8788` y mantiene `observations/` como buffer de trabajo.

La publicación automática usa una copia dedicada fuera del repositorio de desarrollo y publica exclusivamente en `origin/main`; nunca hace commit ni push sobre la rama donde estés trabajando.

La extensión coalescea el envío normal para no interferir con captura, UI ni bridge. Los eventos críticos provocan un intento acelerado. Cada publicación confirmada actualiza el estado local fuera del repositorio en `%USERPROFILE%\\.signal-interpreter\\observation-reporter-status.json`.

`GET /health` expone el último envío automático confirmado, su commit, estado y la última revisión IA registrada. La interfaz usa estos datos para mostrar tiempos relativos sin lenguaje interno del servicio.

El reporter está diseñado para ejecutarse de forma persistente mediante una tarea programada al iniciar sesión de Windows y para reiniciarse ante un fallo. La instalación se realiza con `install-autostart.ps1`; la ejecución utilizada por la tarea es `run.ps1`.

La exportación completa del diagnóstico sigue siendo una acción manual separada; no se confunde con la publicación automática de observaciones.

No se publica texto conversacional, captions, audio ni credenciales en `observations/`.

# Development observability

`diagnostics/latest.json` is the single rolling diagnostic artifact.

Cada clic en **Exportar diagnóstico completo (eventos + Signal)** genera únicamente la ventana incremental desde el último checkpoint, o desde la última actualización de la extensión en el primer clic.

Incluye eventos estructurados y su resumen; errores y métricas de runtime; estado de captura Groq; snapshots de las pantallas observables de Cloud Interpreter; mapa estructural del portal (rutas, botones, enlaces, campos y encabezados); metadatos de red agregados por ventanas, sin cuerpos de peticiones; metadatos de sesiones y segmentos Signal sin texto de transcripción.

No se publican API keys, tokens, audio ni transcripciones crudas.
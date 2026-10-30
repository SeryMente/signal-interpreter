# C-SIGNAL-CIERRE-TECNICO-20261029-G4

## Identidad y corte

- Frente: Signal Interpreter, repositorio `SeryMente/signal-interpreter`.
- Corte: 2026-10-29; generación 4, folio `SES-20261029-F4026F60`, rol constructor.
- Gobierno releído: DUG Samantha v362 · NX-362m, Metacanon 1.24 y GOW 2.11. `INICIO.md` blob `3557bfe0ebd69e8520b11ec7733ed9f7e61daae5`; DUG blob `b7593409c428e209d35f53a5f13501652208d949`.
- Control read-back: generación 4, `ACTIVO`, rol `constructor`. MCP normativo continúa desactivado.

## División permanente de responsabilidades

El operador humano realiza la prueba local de uso real, utilizando Signal Interpreter en el equipo y perfil autorizados. El constructor se encarga de todo el trabajo restante que pueda ejecutar de forma autorizada sin esa interacción: análisis y diagnóstico, código y correcciones, diseño de pruebas, automatización, CI, revisión de seguridad, dependencias, empaquetado, gestión de ramas/PR, documentación, trazabilidad y análisis de evidencias.

Cuando una validación dependa de Windows/Chrome o del uso real, el constructor prepara el protocolo, define PASS/FAIL y especifica la evidencia mínima segura. El operador ejecuta SI y devuelve resultados; el constructor diagnostica, corrige, repite las pruebas automatizables y actualiza el OCP. No se solicitan transcripciones, audio, capturas ni datos de llamadas si bastan estados, contadores o logs saneados.

Metacanon 1.24 §§6/24 reserva RDC al rol asistente. En este ciclo, el constructor no invocó RDC ni realizó acciones en PC-8, GUI, perfil Chrome, instalación o llamadas reales.

## Reconciliación de la candidata

- `main` observado: `6756dcde7811f9b7ac9502499f7890359f20de02`, versión 0.10.37.
- PR #67: `fix/pipeline-e2e-20261029`, candidata 0.10.38; permaneció abierta, draft y sin fusionar.
- Cabeza candidata previa: `a5d6d4ab0b119da8cc8a3c6950edc0f0f236cf5c`; merge base: `cb2a2e35e3a2ef33901a75e3483470fcf8dfad3f`.
- El análisis de árboles completos detectó 18 rutas modificadas solo en main y 41 en la candidata, con una única intersección: `docs/frentes/signal-interpreter/OBJETO-CANONICO.md`. Main tenía además registros append-only de observabilidad. La resolución conservó el núcleo canónico de main y superpuso las 40 rutas funcionales/de prueba de la candidata.
- Merge commit: `a9e235bedd188c289db56369bcbb62df16aedd4d`; primer padre main `6756dcde...`, segundo padre candidata `a5d6d4ab...`. Read-back de ramas y compare: candidata 65 commits por delante, cero por detrás, 40 archivos de delta.
- La ficha `docs/versions/0.10.38-candidate.md` se actualizó en la rama mediante commit documental `b4945afeb1e1b03a712860b7442825385504dad0`. No cambió código ni payload.
- En la comparación posterior a la actualización de ficha, PR #67 quedó 66 commits por delante y cero por detrás de main. Este valor es un corte puntual anterior a la actualización documental de main; revalidar el grafo después de sincronizarla.

## Hallazgo de observabilidad

La observabilidad append-only de main 0.10.37 mostró un sondeo horario fallido cuando no había pestaña autenticada de Cloud Interpreter, con error de cola visible. La candidata implementa una vía exclusiva para sondeos programados: la ausencia de pestaña se convierte en `CLOUD_TAB_UNAVAILABLE`/omisión segura; no crea, navega ni recarga pestañas. Errores reales de red/API se propagan y permanecen visibles. El test automatizado cubre ambos caminos. No se afirma que este fix esté desplegado en producción.

## Verificación ejecutada

### Node.js 22.16.0 · sandbox Linux

- `presence-guard-test.mjs`: **29/29 PASS**.
- `presence-connect-test.mjs`: **22/22 PASS**.
- `caption-language-spans-test.mjs`: **46/46 PASS**.
- `official-sync-scheduled-no-tab-test.mjs`: **PASS**; no-tab omite de forma controlada y una falla genuina sigue visible.

Los harnesses usan APIs/DOM sintéticos y extractos funcionales de la candidata. No son ejecución completa de Windows ni aceptación en PC-8.

### GitHub Actions sobre la cabeza `b4945afeb1e1b03a712860b7442825385504dad0`

- [Package integrity](https://github.com/SeryMente/signal-interpreter/actions/runs/40993477067): **success**; inventario e invariantes del paquete.
- [signal-observability-audit](https://github.com/SeryMente/signal-interpreter/actions/runs/40993477076): **success**; sintaxis, disponibilidad fail-closed, login, hotload, micrófono, exportación, observabilidad, overlays, ganancias, sondeo sin pestaña, inventario, atajos, Live Caption core/bridge, laboratorio y auditorías estáticas.
- [native-caption-host-build](https://github.com/SeryMente/signal-interpreter/actions/runs/40993477194): **success** en runner Windows; sintaxis PowerShell, identidad, ZIP raíz, instalador Windows PowerShell 5.1, muestra integrada y prueba negativa de corrupción, compilación C# UI Automation, artefacto, framing Native Messaging y cierre limpio. La sincronización embebida se omitió porque el evento fue `pull_request`, no por fallo.

## Evidencia histórica que no se atribuye a este ciclo

El corte r3 previo reportó 59/59 hashes, 34/34 suites automatizadas, Native Messaging/protocolo y Chromium 149 headless PASS. Se conserva como evidencia histórica, registrada en las crónicas anteriores; no se repitió sobre PC-8 durante este ciclo. Tampoco se repitieron localmente idle, bloqueo, desbloqueo, suspensión, Live Caption real, llamada real, upgrade ni rollback.

## Estado y decisión

- CI verde sobre el checkpoint integrado y ficha de versión actualizada.
- PR #67 permanece draft, no fusionada; 0.10.38 no es release.
- No existe aceptación integral Windows ni confirmación del operador sobre la revisión exacta.
- La regla operativa vigente asigna al operador toda prueba local usando el sistema; el constructor debe ejecutar y cerrar todo lo demás.

## Única compuerta pendiente del operador

Sobre la revisión candidata exacta, en el entorno real y sin interrumpir una llamada:

1. Confirmar versión/revisión instalada.
2. Verificar Live Caption nativo, tramos inglés/español y conservación sin pérdida/duplicación; comprobar que neutros quedan sin asignar y que no se afirma identidad de hablante.
3. Verificar que presencia requiere disponibilidad explícita, se revoca al llegar a idle/bloqueo y no se rearma al volver; una llamada ya iniciada debe permanecer intacta.
4. Comprobar que la ausencia de pestaña autenticada no produce error de cola en el sondeo programado y que un error genuino de red/API sí queda visible.
5. En una ventana sin llamada, confirmar actualización y rollback del instalador si está previsto hacerlo en el entorno real.

Devolver solo versión/revisión, PASS/FAIL por punto, hora aproximada y logs/contadores saneados. No compartir texto ni audio de conversación. El constructor analizará cada resultado, implementará las correcciones necesarias, repetirá CI y actualizará el estado. No fusionar ni liberar antes de la aceptación del operador.

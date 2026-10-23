# Reglas operativas — extensión compañera de KHORA

Estas reglas gobiernan el frente de observabilidad de plataforma y son independientes de la tarea funcional que esté en curso.

## Producto e interfaz

- La extensión es el inicio de una compañera multiusos de KHORA, no una consola de diagnóstico saturada de detalles internos.
- La interfaz principal se abre en una pestaña propia de Chrome. No usar un popup estrecho como superficie principal.
- La taxonomía visible es **Desarrollo → Gobernanza → Plataforma → ChatGPT → Observabilidad → Arquitectura de la interfaz**.
- La estética sigue los tokens y principios de KHORA: fondo oscuro `#0A0A0B`, superficies `#17181A`, tinta `#C7CCD1`, acento sobrio `#8A9BA8`, bordes discretos y jerarquía tipográfica contenida.
- La interfaz de producto muestra un resumen de regiones y el estado de la evidencia. Los detalles de implementación y la documentación técnica permanecen en el repositorio.
- No fabricar capturas, métricas, eventos, estados ni resultados. Una región definida por documentación debe identificarse como definida/documental, no como observada en vivo.
- La primera superficie no ejecuta acciones sobre ChatGPT ni inspecciona contenido de conversaciones. El perfil de captura real es una fase posterior con permisos, consentimiento y pruebas específicos.
- El menú de cuenta que aparece al pulsar el nombre/avatar del usuario queda excluido del inventario. Otros menús contextuales sí forman parte del alcance.

## Revisión obligatoria de datos en cada actualización

En cada ciclo de trabajo o actualización candidata, incluso cuando el objetivo principal sea otro:

1. Leer el último checkpoint y el paquete actual: `observations/manifest.json`, `observations/platform-index.json`, `observations/platform-latest.json` y los deltas posteriores al checkpoint.
2. Comparar el paquete actual con el último estado realmente procesado; no asumir que el último batch es necesariamente el último conocimiento útil.
3. Filtrar novedades, cambios estructurales, controles, menús, estados, rutas, anomalías y huecos. Las repeticiones sin cambio no son novedad.
4. Evaluar explícitamente el impacto del delta sobre `docs/observability/CHATGPT-REGION-INVENTORY.md`.
5. Si un delta relevante cambia la taxonomía de regiones de ChatGPT, actualizar el inventario y la interfaz de resumen en el mismo ciclo, aunque la entrega funcional esté trabajando otra característica.
6. Mantener la procedencia y el nivel de evidencia: `documented`, `observed`, `changed`, `unknown` o `excluded`. No trasladar evidencia de Cloud Interpreter a ChatGPT.
7. Registrar qué checkpoint se leyó, qué delta se consideró y por qué cambió o no cambió el inventario.

Si no hay evidencia de ChatGPT en el paquete, la UI debe mostrar cobertura real como no verificada. No inferir cobertura a partir de los datos de otra plataforma.

## Entregas acumulativas, no parches distribuidos

- El trabajo interno puede acumular commits en una rama de propuesta, pero no debe presentarse cada commit como una entrega distribuida.
- La distribución/actualización de la extensión solo se realiza cuando el usuario lo decide explícitamente.
- Cada entrega autorizada recibe nombre, fecha, descripción, alcance, checkpoint comparado, cambios del inventario de UI, pruebas, limitaciones y estado de aceptación en `docs/observability/RELEASE-LEDGER.md`.
- El registro de entregas no reemplaza el historial Git. El historial Git registra desarrollo; el ledger registra entregas aprobadas para uso.
- No declarar “lista para instalar” hasta validar estructura, manifest, scripts, workflows y pruebas automatizadas. La aceptación de Windows/Chrome real debe ser independiente y quedar como `NOT-VERIFIABLE` mientras no exista evidencia real.
- No fusionar la rama de trabajo ni publicar un paquete distribuible sin revisar el estado de CI y las diferencias contra la arquitectura canónica.

## Estado de la primera entrega de trabajo

La vista `extension/ui/observability.html` presenta el inventario documental de regiones y deja claro que la observación real de ChatGPT está pendiente. El cambio del icono de extensión a una pestaña dedicada se encuentra en esta rama candidata. Todavía no equivale a validación real en Chrome/Windows ni a una entrega distribuida autorizada.

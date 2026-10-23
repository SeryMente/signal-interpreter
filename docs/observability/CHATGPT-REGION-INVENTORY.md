# Inventario de regiones de interfaz — ChatGPT

**Estado:** baseline documental para la primera entrega; no es un reporte de captura real.
**Alcance:** interfaz web de ChatGPT en Chrome sobre Windows.
**Fuente de alcance:** requisitos del frente y taxonomía de observabilidad existente.
**Exclusión explícita:** menú de cuenta que se abre al pulsar el nombre/avatar del usuario.

## Taxonomía de navegación

Desarrollo → Gobernanza → Plataforma → ChatGPT → Observabilidad → Arquitectura de la interfaz.

## Regiones a observar

| ID estable | Región | Qué se debe observar | Fuente de la definición | Estado de evidencia |
|---|---|---|---|---|
| `chatgpt.app-shell` | Estructura general | Contenedor principal, distribución, landmarks, regiones semánticas y cambios de layout | Contrato de observabilidad + alcance del frente | Definida; captura real pendiente |
| `chatgpt.sidebar` | Panel lateral | Visibilidad, colapso, expansión, anchura, controles y navegación | Alcance del frente | Definida; captura real pendiente |
| `chatgpt.sidebar.projects` | Proyectos | Lista, apertura, creación y controles visibles de proyecto | Alcance del frente | Definida; captura real pendiente |
| `chatgpt.sidebar.conversations` | Conversaciones | Historial, selección, creación, búsqueda y navegación de conversaciones | Alcance del frente | Definida; captura real pendiente |
| `chatgpt.conversation.viewport` | Área de conversación | Contenedor, orden de turnos, scroll, estados de carga y cambios de estructura | Contrato de snapshots/deltas + alcance del frente | Definida; captura real pendiente |
| `chatgpt.composer` | Compositor de mensaje | Campo de entrada, adjuntos, selector de herramientas/modelo visible, botón enviar/detener y estado habilitado | Alcance del frente | Definida; captura real pendiente |
| `chatgpt.turn-actions` | Acciones de mensaje | Copiar, editar, regenerar, valorar y otros controles disponibles en cada turno | Alcance del frente | Definida; captura real pendiente |
| `chatgpt.conversation-actions` | Acciones de conversación | Compartir, menú de más opciones y controles a nivel de conversación | Alcance del frente | Definida; captura real pendiente |
| `chatgpt.transient-menus` | Menús y popovers contextuales | Menús abiertos por controles observables, excepto menú de cuenta | Alcance del frente | Definida; captura real pendiente |
| `chatgpt.dialogs-overlays` | Diálogos y overlays | Diálogos, confirmaciones, selectores, paneles superpuestos y cierre | Contrato de observabilidad + alcance del frente | Definida; captura real pendiente |
| `chatgpt.status-errors` | Estados y errores | Streaming/generación, cancelación, límites, errores, reintentos y avisos visibles | Contrato de observabilidad | Definida; captura real pendiente |

## Regla para menús dinámicos

Los menús que aparecen al pulsar un control forman parte del área observada aunque no estén abiertos en el snapshot inicial. Se deben registrar como una transición: control activador → menú/diálogo visible → controles y estado → cierre o navegación resultante.

La observación no debe activar controles por su cuenta. Las transiciones deben detectarse durante interacción real autorizada o mediante fixtures sintéticos separados que nunca se presenten como evidencia de producción.

## Exclusión de cuenta

No inventariar ni observar el menú que se abre al pulsar el nombre/avatar de la cuenta del usuario. La exclusión cubre el menú desplegable de cuenta; no excluye otros menús contextuales de la aplicación.

## Reglas de evidencia

Los estados válidos para cada región son:

- `documented`: definida por documentación o alcance explícito;
- `observed`: confirmada por una captura real identificable;
- `changed`: un delta real modificó su estructura o comportamiento visible;
- `unknown`: la evidencia disponible no permite determinarla;
- `excluded`: fuera de alcance explícito.

No convertir `documented` en `observed` sin evidencia. El paquete actual de observabilidad documenta capturas de Cloud Interpreter; no constituye evidencia de ChatGPT. Hasta que haya capturas reales de ChatGPT, la cobertura real de esta plataforma debe indicarse como **sin verificar**, no como cero controles existentes ni como cobertura completa.

## Regla de actualización independiente

Cada actualización de la extensión debe comparar el inventario y el paquete con el último checkpoint de datos procesado. Si aparece un delta novedoso y relevante que afecte regiones, controles, estados o transiciones de la UI de ChatGPT, se actualiza este inventario y su resumen en la interfaz, aunque la entrega funcional en curso trate otro tema. La incorporación al release distribuido se acumula con los demás cambios hasta que el usuario autorice esa entrega.

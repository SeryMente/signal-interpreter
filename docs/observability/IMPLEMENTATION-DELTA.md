# Mapa de implementación y brechas — observabilidad de plataforma

**Estado:** análisis documental preliminar; no es auditoría exhaustiva del runtime.
**Contrato relacionado:** [PLATFORM-OBSERVABILITY-CONTRACT.md](PLATFORM-OBSERVABILITY-CONTRACT.md)
**Arquitectura vigente:** [OBSERVABILITY-ARCHITECTURE-BROWSER-GITHUB-v2.md](../OBSERVABILITY-ARCHITECTURE-BROWSER-GITHUB-v2.md)
**Matriz vigente:** [OBSERVABILITY-COVERAGE-MATRIX-v1.md](../OBSERVABILITY-COVERAGE-MATRIX-v1.md)
**Protocolo vigente:** [OBSERVABILITY-DELTA-PROTOCOL-v1.md](../OBSERVABILITY-DELTA-PROTOCOL-v1.md)
**Paquete vigente:** [OBSERVABILITY-PACKAGE-SPEC-v1.md](../OBSERVABILITY-PACKAGE-SPEC-v1.md)

## 1. Hallazgo principal

Signal Interpreter ya cuenta con especificaciones previas de arquitectura, cobertura, deltas y empaquetado; no conviene reemplazarlas por un segundo sistema. El contrato nuevo debe funcionar como una capa de aceptación transversal y como preparación para un perfil futuro de ChatGPT, conservando la arquitectura de producción vinculante:

**Chrome MV3 → IndexedDB / chrome.storage → Vercel Relay → GitHub API → GitHub Actions → paquete de observabilidad.**

La observabilidad de producción no puede depender de procesos residentes en Windows, localhost, Native Messaging, tareas programadas, watchdogs ni supervisores.

El código, las pruebas y el estado de ejecución no se han auditado exhaustivamente en este documento. Las palabras “cubierto” de la matriz anterior describen su estado declarado, no sustituyen una verificación del comportamiento real.

## 2. Mapa documental de responsabilidades

| Artefacto | Responsabilidad que conserva | Uso en el siguiente ciclo |
|---|---|---|
| `OBSERVABILITY-ARCHITECTURE-BROWSER-GITHUB-v2.md` | Arquitectura de runtime, transporte y construcción remota | Restricción vinculante; no duplicar ni contradecir |
| `OBSERVABILITY-COVERAGE-MATRIX-v1.md` | Dominios y señales que deben observarse | Fuente inicial para auditar cobertura |
| `OBSERVABILITY-DELTA-PROTOCOL-v1.md` | Identidad de superficie, snapshots y deltas | Contrato de comparación estructural |
| `OBSERVABILITY-PACKAGE-SPEC-v1.md` | Esquemas y artefactos derivados | Contrato de consumo por el siguiente ciclo |
| `.github/workflows/observability-audit.yml` | Guardas de auditoría CI | Lugar para pruebas automáticas de invariantes |
| `.github/workflows/observability-build.yml` | Construcción del paquete | Validar integridad y frescura del resultado |
| `extension/background.js` | Coordinación MV3/runtime | Auditar persistencia, reintentos, deduplicación y políticas |
| `extension/content.js` | Observación de la página | Auditar redacción, deltas, permisos y coste de mutaciones |
| `observations/` | Entrada y artefactos de observación | Comprobar manifiesto, historial, índices y salud |

La presencia de un archivo o una fila en una matriz no prueba por sí sola que el comportamiento esté implementado, probado ni activo en Chrome.

## 3. Brechas prioritarias por verificar

No se asigna `implemented` a un punto solo porque esté descrito en la documentación. Cada fila requiere inspección de código y/o una prueba reproducible.

| Prioridad | Invariante | Evidencia requerida | Tipo de verificación |
|---|---|---|---|
| P0 | Telemetría técnica no contiene texto conversacional por defecto | Fixture canario sintético atravesando content → spool → batch → relay/package | Test automatizado de extremo a extremo |
| P0 | La publicación remota está separada del consentimiento de captura de contenido | Pruebas de opt-in, pausa, revocación, reinicio y fallo de red | Unit/integration + revisión de UI |
| P0 | Ningún secreto o valor de formulario llega al paquete | Canary tests para URL, campos, errores y metadatos | Auditoría CI de privacidad |
| P0 | Runtime sigue siendo browser-only | Auditoría de manifest, imports, workflows y código de observabilidad | Static guard CI |
| P1 | Eventos duplicados no producen efectos duplicados | Repetir un mismo batch/evento y comprobar idempotencia | Integration test |
| P1 | Pérdida de secuencia exige resincronización explícita | Simular salto de secuencia y comparar snapshot nuevo | Unit/integration |
| P1 | MV3 puede suspenderse sin perder eventos confirmados localmente | Forzar reinicio entre captura, commit IndexedDB y ACK | Harness sintético + prueba Chrome |
| P1 | Orígenes y pestañas quedan aislados | Dos pestañas con fixtures de orígenes distintos | Integration test |
| P1 | El paquete no declara frescura inexistente | Comparar `generatedAt`, última secuencia, batch y estado de build | Auditoría de consistencia |
| P2 | Los estados de interfaz se basan en semántica antes que selectores frágiles | Fixture con rerender y cambio de clases sin cambio de rol/nombre | DOM regression test |
| P2 | ChatGPT tiene perfil y permisos independientes de Cloud Interpreter | Manifest/host allowlist y fixture específico, sin activar captura | Revisión de arquitectura antes de código |
| P2 | Los informes distinguen observado, inferido y desconocido | Esquema y consumidores preservan confianza/ausencia de evidencia | Schema + contract test |

## 4. Perfil futuro ChatGPT: aislamiento obligatorio

El perfil de ChatGPT no debe añadirse a los permisos del perfil de Cloud Interpreter como un efecto colateral. Antes de implementarlo, definir:

1. Origen permitido exacto y patrón de URL, sin comodines globales.
2. Permisos Chrome mínimos, razón de cada permiso y comportamiento al revocarlos.
3. Eventos técnicos que se pueden observar sin guardar texto de conversación.
4. Un modo de archivo de conversación independiente, apagado por defecto, con consentimiento explícito, indicador visible, pausa inmediata, retención, exportación y borrado.
5. Pruebas con conversaciones sintéticas que comprueben que el contenido no se filtra a logs, batches, errores, snapshots, CI ni GitHub.
6. Semántica para regeneración, edición, conversación ramificada, carga parcial, errores, adjuntos y streaming, sin inferir que la respuesta está completa solo porque el DOM dejó de mutar.
7. Una política de “desconocido” para señales que la interfaz no expone.

La extensión puede conservar respuestas y mensajes visibles solo bajo una función de archivo explícita autorizada por el usuario. No puede prometer registrar razonamiento interno oculto del modelo, ni debe buscar eludir límites de la plataforma.

## 5. Pruebas de aceptación de un ciclo

Cada ejecución debe adjuntar un recibo saneado que incluya:

- commit y versión de extensión;
- versión de esquema y extractor;
- entorno: `synthetic`, `CI` o `Windows-Chrome-real`;
- nombre del caso y fixture;
- estado `PASS`, `FAIL` o `NOT-VERIFIABLE`;
- cantidad de eventos antes/después de redacción;
- canarios encontrados en salidas;
- secuencias perdidas/duplicadas;
- estado del spool y ACK remoto;
- enlaces a artefactos sin contenido privado.

No incluir prompts, respuestas reales, cookies, tokens, nombres de cuenta ni identificadores privados de dispositivos. No presentar los resultados sintéticos como validación real de Windows.

## 6. Orden de trabajo recomendado

1. Inspeccionar los workflows de auditoría/build y los módulos de redacción existentes; evitar crear un segundo pipeline.
2. Ejecutar pruebas actuales de CI y revisar el paquete de observabilidad más reciente antes de cambiar código.
3. Crear pruebas canario para privacidad y publicación; integrar primero los guards de mayor riesgo.
4. Auditar idempotencia, secuencias y resincronización con fixtures sintéticos.
5. Verificar ciclo de vida MV3 y aislamiento entre pestañas.
6. Generar un informe de cobertura por contrato con estados probados y no probados.
7. Solo después, diseñar y activar el perfil ChatGPT aislado.
8. Reservar aceptación Windows/Chrome real para cuando el equipo objetivo esté conectado y se pueda demostrar una ventana segura; hasta entonces registrar `NOT-VERIFIABLE`.

## 7. Regla de cierre

Una brecha se cierra solo con prueba reproducible y evidencia de su resultado. Cambiar documentación, compilar en CI o ver una señal de telemetría aislada no equivale a aceptación integral. No hacer merge de este mapa ni del contrato sin revisar la rama base actual, el resultado de CI y cualquier cambio concurrente en la arquitectura canónica.

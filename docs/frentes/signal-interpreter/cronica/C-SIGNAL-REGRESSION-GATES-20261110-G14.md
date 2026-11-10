# Signal Interpreter — compuertas de regresión de micrófono y Connect · G14

- Fecha de registro: 2026-11-10 · zona: America/Mexico_City.
- Frente: Signal Interpreter · titular operativo G14 · agente único.
- Rama de trabajo: `candidate/autoanswer-fastpath-ready-20261110`.
- PR: [#82 — perf: integrate low-latency Auto-Answer reload candidate](https://github.com/SeryMente/signal-interpreter/pull/82).
- Estado de PR al iniciar este ciclo: abierta, draft, sin fusionar.
- Fuente conversacional: último tramo pegado literalmente por el operador en esta conversación. No se afirma que se haya obtenido una exportación nativa del historial.

## 1. Encargo del ciclo

El operador pidió implementar protecciones de regresión para el micrófono y el botón real de contestación, persistir el último tramo de conversación en el mismo frente y recuperar el backlog vigente. Se conserva la candidata sin fusionar.

Límites aplicados: desarrollo y documentación en la rama de candidata; sin Chrome GUI/reload, sin llamada ni audio reales, sin habilitar Auto-Answer, sin armar presencia, sin merge, deploy o release. La aceptación real sigue reservada al operador.

## 2. Salida literal del modelo preservada

El siguiente bloque reproduce literalmente la última salida técnica del modelo que el operador incluyó en el tramo de conversación:

> La protección más sólida es convertir el comportamiento actual del **micrófono y del botón Contestar en contratos de regresión**: cualquier cambio futuro debe demostrar que conserva esos comportamientos antes de poder integrarse en `main`.
>
> ## 1. Micrófono: proteger estos invariantes 🎙️
>
> | Situación | Comportamiento que debe preservarse |
> |---|---|
> | No hay llamada activa | Bloquear cualquier intento de desmutear |
> | Llamada activa | Permitir el cambio solo bajo las condiciones autorizadas |
> | Se incorpora una pista de audio tardía | Recuperar el estado sin desmutear indebidamente |
> | La llamada termina o se desconecta | No dejar el micrófono abierto |
> | El usuario silencia manualmente | No anular su decisión por una recuperación automática |
>
> La prueba crítica debe comprobar no solo que la operación se bloquea, sino también que el micrófono permanece silenciado y se registra el bloqueo.
>
> ## 2. Botón Contestar: proteger la activación
>
> El contrato debe exigir:
>
> - Una sola activación normal del botón real `Connect`, mediante `button.click()`.
> - Nunca dos clics para compensar una respuesta lenta.
> - No contestar una llamada distinta, una pestaña incorrecta o un estado obsoleto.
> - Rechazar autorizaciones vencidas, duplicadas o inválidas.
> - No repetir la operación si ya se inició la contestación.
> - Registrar el resultado y distinguir entre clic ejecutado y llamada efectivamente conectada.
>
> **Importante:** que el clic se haya ejecutado no demuestra por sí solo que la llamada quedó contestada.
>
> ## 3. Convertirlo en una barrera obligatoria antes de cada integración
>
> La candidata ya incluye una base de protección:
>
> | Prueba existente | Resultado de la última verificación |
> |---|---:|
> | Presencia y autorización | 94/94 |
> | Conexión y botón Contestar | 35/35 |
> | Protección del runtime Auto-Answer | 15/15 |
> | Protección del micrófono | Aprobada |
> | Paquete y estructura de extensión | Aprobados |
>
> Evidencia de la candidata local y PR #82; no equivale todavía a una aceptación con llamada real.
>
> Mi recomendación es establecer tres puertas antes de fusionar:
>
> 1. **Pruebas automáticas:** todas las pruebas de micrófono, conexión y Auto-Answer deben pasar.
> 2. **Integridad:** verificar los SHA-256 del paquete y comprobar que los archivos no cambiaron fuera de lo autorizado.
> 3. **Aceptación real:** una llamada de prueba debe demostrar transcripción, contestación y control correcto del micrófono.
>
> **La regla principal:** ningún cambio que mejore la velocidad debe poder debilitar las protecciones del micrófono o provocar activaciones duplicadas del botón.
>
> El siguiente paso sería incorporar estos invariantes como pruebas obligatorias de CI en PR #82, de forma que una regresión impida integrar el cambio.

## 3. Implementación persistida en la candidata

Los siguientes archivos se modificaron secuencialmente en la rama indicada y cada contenido se leyó de vuelta comparándolo exactamente con lo escrito:

| Archivo | Cambio persistido | Commit de escritura |
|---|---|---|
| `tools/microphone-guard-test.mjs` | Aserciones de que la captura se detiene y el remute de salida se solicita/verifica antes de borrar el estado de llamada; se exige el evento de remute no verificado si falla. | `39dc6104578bd9074ae93944badcc7fac26c03be` |
| `tools/presence-connect-test.mjs` | Caso de autorización expirada: cero clics y liberación de la concesión; aserción estática de un único punto de `button.click()`. | `4c32d761b2b84320cfc1e0b5ee8fcb2774cf9c9f` |
| `tools/verify-release-package.mjs` | La verificación de paquete ahora ejecuta cuatro suites críticas y falla si cualquiera devuelve código distinto de cero. | `327c2dfa370c1ac2b0bfc929e18f6a2fc4c15011` |

La compuerta integrada invoca:

1. `tools/microphone-guard-test.mjs`
2. `tools/presence-connect-test.mjs`
3. `tools/presence-guard-test.mjs`
4. `tools/autoanswer-runtime-guard-test.mjs`

El workflow ya existente `.github/workflows/package-integrity.yml` ejecuta `tools/verify-release-package.mjs` en PR, por lo que esa llamada convierte las cuatro suites en una compuerta de integridad/seguridad sin depender de un workflow nuevo.

### Límites de verificación

- Las escrituras GitHub devolvieron los commits indicados y las lecturas de vuelta de los tres archivos coincidieron exactamente con el contenido enviado.
- Tras el último commit, GitHub no devolvió ejecuciones de Actions ni status checks para ese SHA. Por tanto, **la compuerta CI está codificada y persistida, pero su ejecución en este commit NO ESTÁ VERIFICADA**.
- En este ciclo no se ejecutaron de nuevo las suites modificadas localmente; no se adjudican resultados PASS a las nuevas aserciones.
- Los tests existentes emplean Node VM, DOM/APIs sintéticas y comprobaciones estáticas. No prueban una llamada real ni la pista de micrófono física.
- El único sitio de activación normal inspeccionado para el flujo `autoAnswer()` es `button.click()`; el timeout registra `no-second-click`. La concesión se revalida después de esperar y contempla caducidad/generación/estado del botón.
- En el guard, unmute sin llamada activa falla cerrado; la recuperación de pista tardía requiere llamada activa e intención explícita. Al cerrar llamada, detener captura y solicitar/verificar remute precede a limpiar `callId` y `callStartedAt`.

## 4. Backlog vigente recuperado

El backlog formal del frente conserva seis líneas funcionales:

| ID | Prioridad | Tema | Pendiente principal |
|---|---:|---|---|
| SI-FB-01 | P0 | Política del micrófono ligada al estado real de llamada | Prueba integrada real de espera, llamada activa, pista tardía, pérdida y cierre; aceptación humana. |
| SI-FB-02 | P1 | Transcripción bilingüe del canal INTÉRPRETE | Diseño de captura limitada a llamada activa, permisos, proveedor, ZDR/privacidad y retención. No está implementada en main. |
| SI-FB-03 | P1 | Calidad, continuidad y atribución | Evaluación por idioma, parciales/duplicados, solapamientos, entidades críticas y WER/CER. |
| SI-FB-04 | P2 | Densidad visual del overlay | Compactación integral, accesibilidad, teclado y aceptación visual. |
| SI-FB-05 | P2 | Lector en pestaña independiente | Aceptación Chrome de sincronización en vivo y preservación de scroll histórico. |
| SI-FB-06 | P1 | Matriz de pruebas y aceptación | Integración en Windows/Chrome con transcripción, controles de audio y aceptación del operador. |

Regresiones y orden de cierre:
- **SI-REG-05 (P0):** política de unmute previo a llamada. El guard candidato bloquea la operación sin llamada activa; siguen pendientes ejecución nueva de tests, integración y aceptación real.
- **SI-REG-06 (P0):** latencia Auto-Answer sin comprometer guardas: una activación normal, un solo clic, concesión de un uso y revalidación; sin `isTrusted`, CDP, ratón físico ni endpoints privados.
- **SI-REG-01/02/03/04:** mantener separados interruptor y presencia explícita; validar switch y pista tardía bajo llamada activa; preservar pruebas de autorización paralela; cerrar aceptación integrada solo después de aceptación del operador.
- **CI:** revisar que el workflow package-integrity ejecute las cuatro suites; ejecución actual pendiente de evidencia de Actions.

## 5. Estado de conversación y continuidad

Estados breves que aparecieron en la interfaz durante el ciclo, preservados como mensajes de estado y no como evidencia técnica autónoma:

```text
Revisó el alcance
Verificada la autorización, archivos de control, backlog y objeto canónico
Confirmaste la documentación
Se buscó en la web
Ya confirmé que G14 sigue activo y que el repositorio tiene un backlog formal, no solo notas sueltas. Estoy cotejando ahora el backlog completo con la candidata #82 para evitar duplicar tareas o introducir protecciones que contradigan los guards existentes.
Implementaste protección CI durable y pruebas de regresión tras revisar el backlog
Organizaste la implementación
Recuperado y extraído contenido metodológico del archivo canónico
Aplicando protecciones
```

El texto recibido por el operador incluye una ruta personal de Windows en una respuesta anterior; se omite de esta crónica pública para no publicar datos de entorno. El directorio local no se modifica ni se declara sincronizado en este ciclo.

## 6. Cierre del ciclo

- Estado de código: **PERSISTIDO EN RAMA CANDIDATA**; tres archivos modificados; read-back exacto.
- Estado de CI: **NO VERIFICADO** para el último commit; no se devolvieron runs ni status checks.
- Estado de pruebas nuevas: **PENDIENTES DE EJECUCIÓN**.
- PR #82: conservar abierta y sin fusionar.
- Chrome reload, presencia/Auto-Answer, llamada/audio real, aceptación humana, merge, deploy y release: **NO EJECUTADOS**.
- Siguiente paso autorizado: ejecutar offline en el contexto de titularidad/identidad correcto, validar la compuerta y revisar Actions. Después, preparar la prueba manual del operador sin automatizar una llamada real.

---
**Procedencia:** reconstrucción documental basada en el tramo que pegó el operador y en lecturas/escrituras del repositorio. No representa exportación nativa de conversación ni afirma que los estados de interfaz sean eventos de ejecución.

## 7. Resultado final de CI tras corregir los fallos · 2026-11-10

**Cabeza candidata probada:** `b82c813dd3650e9f10fe47ef55a710489d6bad0b`.

Las tres ejecuciones de GitHub Actions terminaron `completed / success`:

| Workflow | Run | Resultado |
|---|---:|---|
| `signal-observability-audit` | `42906302139` | SUCCESS |
| `native-caption-host-build` | `42906302286` | SUCCESS |
| `Package integrity` | `42906302442` | SUCCESS |

El log de Package integrity confirma:
- Microphone Main Guard: PASS.
- Presence Connect: **36/36 PASS** (Node VM / DOM sintético).
- Presence Guard: **94/94 PASS** (Node VM / Chrome APIs sintéticas).
- Auto-Answer Runtime Guard: **15/15 PASS** (Node VM / Chrome APIs sintéticas).
- Gate ejecutado: `audio/Connect/presence regression gate (4 suites)` — PASS.
- Inventario de paquete: **60 archivos SHA-256 PASS**.

El workflow de Windows completó:
- Parser de scripts y validación de identidad de extensión: PASS.
- Verificación del archivo raíz e instalación de origen con Windows PowerShell 5.1: PASS.
- Compilación y empaquetado del host nativo: PASS.
- Publicación del artefacto: PASS.
- Verificación de framing Native Messaging y cierre limpio: PASS.

Los dos primeros intentos no se ocultan: el primero detectó el SHA del verificador desactualizado; el segundo detectó el orden incorrecto del caso añadido al harness. Ambos defectos se corrigieron y la ejecución final de los tres workflows pasó.

**Alcance de la evidencia:** CI sintético/automatizado y smoke test del host. No prueba una sesión activa de Chrome, pista física de micrófono, contestación real, transcripción real ni aceptación del operador. PR #82 permanece abierta/draft/sin fusionar; main no se modificó.

# Crónica G13 — Signal Interpreter 0.10.44 · QA y límites de aceptación

- Fecha: 2026-11-08
- Frente: Signal Interpreter
- Generación responsable: G13 (sin crear una generación paralela)
- UUIDv7 local de continuidad: `01a1bca3-e123-74f7-b884-5792d8fb3e62`
- Estado: CANDIDATA PREPARADA · QA AUTOMATIZADO PASS · ACEPTACIÓN HUMANA PENDIENTE
- PR: [#75](https://github.com/SeryMente/signal-interpreter/pull/75)

## 1. Cambios de la candidata 0.10.44

1. **Ruta caliente del DOM:** el trabajo disparado por mutaciones se agrupa a 150 ms. Se conservan detección de disponibilidad y Auto-Answer; se retiran escaneos repetidos de medios/pantalla y repintados de overlays de esa ruta frecuente.
2. **Render de captions:** historial en memoria hasta 800 filas; máximo 72 spans en el DOM del overlay. Rol/idioma se muestran cuando cambian, reduciendo metadatos repetidos.
3. **Lector independiente:** el botón HISTORIAL del overlay abre o reutiliza una pestaña Chrome normal a través de `chrome.tabs.query/update/create`; no abre un popup ni inicia otra captura de audio.
4. **Control flotante en llamada:** se muestra en ruta confirmada `/call/:id`, es independiente del toggle global y solo se oculta mediante la preferencia `callOverlayControlVisible` del popup. Permite recuperar overlays después de ocultarlos globalmente.
5. **Overlay de prellamada:** el panel Auto-Answer exige perfil autorizado y `callId=null`; no se renderiza en la pantalla de llamada.
6. **Guard del micrófono:** no hay sondeo ocioso. El temporizador de enforcement existe solo mientras haya pistas vivas que deban permanecer silenciadas; fuera de esa condición no hay ciclo periódico de guard.

## 2. QA ejecutado

### PC-13, carpeta local

- Manifiesto: **0.10.44**.
- Carpeta: `C:\Users\PC 12\Desktop\EP\Signal-Interpreter\extension`.
- Payload: 60 archivos sincronizados y respaldo conservado en `.rollback-0.10.43-20261108-performance`.
- Inventario local: **60/60 SHA-256 PASS**.
- Suites Node en copia completa de trabajo: **41/41 PASS**.
- Sintaxis JavaScript: **25/25 PASS**.
- No se modificó la clave estable/identidad de la extensión.

### GitHub Actions

Para head `dbdba0057ae664b0952907c6ec22d7c917729b36`:
- Package integrity: **SUCCESS**.
- signal-observability-audit: **SUCCESS**.
- native-caption-host-build: **SUCCESS**.
- Resultado: **3/3 SUCCESS**.

El workflow de host nativo compila el ejecutable y ejecuta un smoke test de framing/protocolo Native Messaging en un runner Windows aislado. No demuestra que el host esté instalado en el perfil Windows de PC-13.

## 3. Estado del backlog SI-FB-01–06

| Ítem | Estado tras 0.10.44 | Límite que sigue abierto |
|---|---|---|
| SI-FB-01 · mute según ciclo de llamada | **Parcial**; guard fail-closed y suites sintéticas PASS | Transiciones reales y verificación de pistas durante llamada Windows/Chrome |
| SI-FB-02 · transcripción del canal INTÉRPRETE | **No implementado** | No hay captura del micrófono ni integración runtime de `groq-transcriber.js`; requiere decisión revisada sobre proveedor, permisos, retención y privacidad |
| SI-FB-03 · continuidad/calidad/atribución | **Parcial**; fuente, rol e idioma separados; no se infiere hablante por idioma | WER/CER, entidades críticas, solapamientos y precisión real por idioma no medidos |
| SI-FB-04 · densidad visual | **Parcial en candidata**; 72 spans visibles y etiquetas compactadas | Comparativa visual real, accesibilidad y aceptación del operador |
| SI-FB-05 · lector en pestaña | **Implementado en candidata**; pestaña normal reutilizable | Aceptación durante llamada real, scroll/sincronización en vivo |
| SI-FB-06 · matriz integrada | **Parcial**; 41 suites y 3 workflows PASS | E2E Windows/Chrome y aceptación funcional explícita del operador |

## 4. Native Messaging y regla SI-OP-01

- SI-OP-01 quedó documentada como regla operativa provisional en `docs/frentes/signal-interpreter/REGLAS-OPERATIVAS.md`.
- En la última inspección de solo lectura en PC-13, la clave `HKCU\Software\Google\Chrome\NativeMessagingHosts\com.signalinterpreter.captionhost` no existía.
- No se ejecutó `INSTALAR.ps1` ni se escribió el registro de Windows: la autorización RDC G13 vigente limita las operaciones a terminal dentro de `EP/Signal-Interpreter/extension`, mientras que esa instalación escribe en `%LOCALAPPDATA%` y `HKCU`.
- Por lo tanto: puente compilado y smoke-tested en CI; **instalación local PC-13 NO EJECUTADA / NO VERIFICADA**.

## 5. Estado Git, release y aceptación

- PR #75 continúa **OPEN / DRAFT / NOT MERGED**.
- La rama se actualizó con un commit de dos padres sobre la cabeza de `main` observada, conservando la candidata anterior y sin sobrescribir rutas concurrentes de observabilidad. `main` no fue modificado por esa integración de código.
- `main/manifest.json` permanece en **0.10.40**; 0.10.44 existe únicamente en la candidata local y PR.
- No se recargó Chrome, no se intervino ninguna llamada, no se inició una llamada real, no hay aceptación E2E, release ni deploy.
- La integración final permanece bloqueada por la revisión directa UX/seguridad del operador. La aceptación real debe ocurrir después de cargar la candidata y comprobar la experiencia en una llamada controlada.

## 6. Dictamen

La **candidata 0.10.44 está preparada y pasa QA automatizado local/remoto**. No se declara el backlog cerrado: SI-FB-02 sigue sin captura de micrófono y SI-FB-06 no puede cerrarse sin prueba real y aceptación del operador. El estado del Native Messaging en PC-13 tampoco debe confundirse con el smoke test del runner Windows.

Esta crónica registra hechos ejecutados y verificaciones disponibles; no transforma acciones no realizadas en hechos aceptados.

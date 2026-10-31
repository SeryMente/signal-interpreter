# Retoma longitudinal — instrucciones verbatim del operador

- Frente: Signal Interpreter.
- Fecha: 2026-10-31.
- Naturaleza: fuente primaria de requisitos para SI-FB-01..06 y ampliaciones.
- Privacidad: conserva las órdenes funcionales y el alcance de producto. No contiene la transcripción cruda de la llamada, capturas, nombres, direcciones, teléfonos, correos, audio ni identificadores de participantes. La muestra de la llamada no se publica en el repositorio público.

## 1. Retroalimentación original

> Ok, we're on business now. Entonces te voy a dar retroalimentación de lo que fue la llamada que acabo de tomar con la extensión. Un par de cosas: cuando no esté en llamada y la extensión esté activa, es decir, cuando esté esperando por una nueva llamada, el micrófono debe estar en mute, invariablemente. Únicamente puede estar on mute si es que ya contesté una llamada. El estado default al contestar una llamada es sin mute; pero, corrijo: en esta versión el estado default al contestar una llamada es mute y lo tengo que desbloquear manualmente para poder empezar a hablar. Otra cosa: analiza la transcripción para que revises la calidad de la misma y encuentres áreas de oportunidad que puedas corregir en la siguiente entrega. Añade un botón para abrir en una tab de Google Chrome la transcripción a pantalla completa. Y fíjate, te voy a pasar una captura de pantalla para que veas cómo está dispuesta la información, ya que se gasta mucho espacio en el formato y en arreglos que no son realmente útiles y me deja poco espacio para poder leer qué es lo que está pasando. Por último, no veo que se esté transcribiendo lo que yo hablo, es decir la entrada de audio al sistema no se está transcribiendo tanto en español como en inglés. Recuerda que soy un agente bilingüe en este escenario y se me tiene que transcribir en ambos idiomas. Genera una lista de tareas persistente y provisional para este frente de trabajo con todo lo que te acabo de decir.

## 2. Estado objetivo del micrófono

La corrección “en esta versión el estado default al contestar una llamada es mute...” describe lo observado en 0.10.39; no sustituye al objetivo inicial.

- IDLE / WAITING: mute obligatorio.
- RINGING / CONNECTING: mute obligatorio.
- ANSWERED / ACTIVE: unmute automático después de confirmar la llamada aceptada.
- ENDED / DISCONNECTED / UNCERTAIN / ERROR: mute obligatorio.
- No se permite habilitar el micrófono por un estado ambiguo, error o mera presencia de la extensión. La transición de unmute exige una señal verificable de llamada activa; los fallos deben mantener/reaplicar mute.

## 3. Minimización reversible de overlays — instrucción verbatim

> sI AÑADE, es muy improtante, que pueda desactivar el overlay de la app, desde el propio overlay, añade botones, discretos para minimizarlos, que importa que no desaparezcan por compelto, pero que se minimizen, si es que llegan a tapar algun ui importante (Keypard para marcar etc)

Interpretación: ambos overlays (captions e ingresos) mantienen una cabecera compacta con control de restauración visible; no desaparecen por completo. El control del micrófono debe seguir accesible. La minimización debe sobrevivir a reinyecciones.

## 4. Bypass P012/P013 — instrucción verbatim

> Bypass P012, y P013

Este bypass se aplica al diseño y construcción de este alcance de Signal Interpreter. No elimina los requisitos técnicos de consentimiento, aislamiento de audio, privacidad, no persistencia de audio crudo, pruebas y aceptación humana.

## 5. Transcripción — instrucciones verbatim

> En cuantoa  al transcvripcion,  
> Piensa en limitless.ai...  
> Necesito una transcricpion, limpia, procesada de manera compleja, usando lo que ya tenemos de subitutlos en vivo, y procesamiento con groq. EL resultado debe ser altamente fiable y pulido. Y no voy a negociar esta posibilidad.

Criterios de producto:
- Historial continuo, legible, revisable y con timestamps.
- Coexistencia de captions nativos de la otra parte y transcripción del canal de micrófono propio del intérprete.
- Inglés y español detectados por segmento; no fijar idioma único de sesión.
- Separar source (procedencia de audio), speaker (hablante/rol) y language (idioma). El idioma no determina el hablante.
- ASR/refinamiento con Groq, timestamps, fragmentos con solapamiento, contexto bilingüe y reconciliación de parciales/duplicados.
- Mantener originalText separado de refinedText; toda corrección trazable, sin inventar nombres, direcciones, números ni contenido.
- Incertidumbre visible cuando la señal no sea fiable.
- Referencia de experiencia Limitless: continuidad y organización por hablante/momento, sin grabación permanente ni retención de audio crudo.

## 6. Ejecución longitudinal y perímetro

> Ok, resuelve de manera longitudinal y nada más detente para hacerme saber si hay algún bloqueante o algo que necesite mi atención.

> AYa no volvere el dia de hoy, resuielve de e2e, sin RDC, en github, y no te detengas hasta temroinarlo todo.

Condiciones: trabajar sobre el mismo frente y GitHub; no usar RDC ni acceder al equipo local; detenerse ante bloqueantes reales de credencial, seguridad, conectividad o pruebas locales; distinguir preparado, escrito, verificado, CI, merge, release, instalación y aceptación.

## 7. Límites explícitos

Estas instrucciones no autorizan publicar la transcripción cruda de la llamada ni datos identificativos, mantener grabación de audio, enviar audio/texto clínico a telemetría, abrir RDC ni afirmar que las pruebas Windows/Chrome o una llamada real se completaron sin ejecutarlas.

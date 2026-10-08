# Requisito del usuario — Live Caption + overlay de subtítulos para Cloud Interpreter

**Fecha de registro:** 2026-10-08  
**Naturaleza:** requisito funcional del usuario  
**Regla:** el texto de las secciones marcadas como **VERBATIM** debe conservarse literalmente. No sustituir por una paráfrasis. Las decisiones técnicas posteriores deben compararse contra este texto para verificar el apego estricto al requerimiento.

## VERBATIM — instrucción funcional original

> Actualmente, Chrome, mediante servicio de accesibildad, hace un trabajo decente a la hora de transcribir la saluda de audio, y mostramrelka. Para dos idiomas en español, e ingles. 
>
> La pregunta que te quiero hac eres la siguiente: Puedo hacer que teniendo el switch de subtitulso automaticos en posicionde encendido, pero habiendo cerrado los subitutlos tras su aparicion (Sale una ventanita con los subtitulso automaticos, pero si la cierro se queda el switch de Subtitulso Automaticos encendido, y ya no muestra la ventana) tu utilizes la extension para mostrarme en la misma pantalla donde tomo la llamada en la plataforma de cloud interpreter, un recuaddro, que armonize con la plataforma visualmente, sin obstruir por ejemplo el keypad para conferncia, etc. ni ninguna otra funcion, dobnde aparezcan los subtitlos, poniendome, por turnos, lo ue salga en ingles, yu luego lo que salga en español, de otro color, uno para el cliente, y otro para el LEP (Limited English Profficient) lo cual es terminologiad ela indsutria del interpetacion para los ahblantes de español que sirvo en als llamadas

## VERBATIM — instrucción de preservación

> Pero tal como te lo pedi, es importante que guardes verbatim, en el repo,  mis instrucciones, para consultarlas luegoy asegurarte el estricto apego a ellas

## Nota de control

Este archivo es una **fuente de requisitos**, no una autorización para introducir todavía cambios de arquitectura. Cualquier implementación futura de esta función debe contrastarse explícitamente con los textos VERBATIM anteriores y no debe reemplazar los requisitos del usuario por una interpretación resumida.


## AUTORIZACIÓN ARQUITECTÓNICA AÑADIDA POR EL USUARIO — 2026-10-08

El usuario autoriza explícitamente **expandir esta especificación canónica** para admitir la posibilidad de utilizar componentes o mecanismos adicionales cuando sean técnicamente necesarios para cumplir el objetivo funcional.

Esta autorización está condicionada a una regla arquitectónica prioritaria:

> **La arquitectura debe tender siempre a la mínima expresión posible en términos de sencillez y simplicidad.**

Por tanto, cualquier componente adicional debe justificar su existencia por necesidad técnica real y debe evaluarse contra alternativas más simples. No se debe introducir infraestructura, procesos, servicios residentes, dependencias o capas adicionales por conveniencia si el mismo objetivo puede alcanzarse con una solución más pequeña.

La preferencia arquitectónica queda ordenada así:

1. **Solo extensión + Chrome**, cuando sea suficiente.
2. **Extensión + el componente adicional mínimo indispensable**, cuando la plataforma de Chrome no exponga una capacidad necesaria.
3. Evitar componentes residentes, servidores locales, puentes complejos o infraestructura persistente salvo que sean estrictamente necesarios para satisfacer el requisito y no exista una alternativa más simple.

Esta ampliación **no modifica ni sustituye ningún bloque VERBATIM anterior**. Los bloques VERBATIM continúan siendo la referencia primaria para el comportamiento solicitado.

## Criterio de cumplimiento

Toda propuesta o implementación futura de esta función deberá indicar explícitamente:

- qué parte del requisito VERBATIM satisface;
- qué componentes utiliza;
- por qué cada componente es necesario;
- cuál es la alternativa más simple que fue considerada;
- y por qué la solución elegida representa la **mínima expresión arquitectónica viable**.

## Estado

**Especificación canónica ampliada y autorizada por el usuario.**


## VERBATIM — criterio adicional de UX, distribución y calidad

> Bien, mientras no sea intrusivo viualmente, y todo luzca comoe xtension normnal. Y siempre se incluya en la carpeta de la extension que el entorno persistente descarga a escritoriuo, me doy por satisfecho. SIempre y cauando resuelvas la implemetntacion elegantemente, armonizando con la UI de la plataforma, y que funcione agil ygracilmente, y que sea pulida maxima calidad de vida para mi como usuario, sin bloat.

## Criterios de aceptación derivados

La implementación futura deberá cumplir simultáneamente:

- **No intrusión visual:** el overlay no debe percibirse como una ventana ajena, flotante invasiva o herramienta superpuesta de terceros.
- **Apariencia de extensión normal:** todo componente visible debe integrarse como parte coherente de Signal Interpreter.
- **Armonización con Cloud Interpreter:** tipografía, proporciones, espaciado, bordes, jerarquía visual, estados y comportamiento deben procurar coherencia con la interfaz observada de la plataforma.
- **No obstrucción funcional:** el overlay debe evitar keypad, controles de llamada, mute, colgar, transferencia y cualquier otra función relevante de la plataforma.
- **Distribución persistente:** cualquier componente necesario para esta función debe quedar incluido en la **carpeta de la extensión** que el entorno persistente descarga/materializa en el Escritorio. No debe existir una segunda carpeta de instalación escondida o separada para completar la función.
- **Agilidad:** actualización del texto y respuesta visual con la menor latencia razonable, sin esperas artificiales ni animaciones innecesarias.
- **Graceful behavior:** el sistema debe comportarse de forma estable ante aparición, desaparición, cambios de idioma, cierre de la burbuja nativa, navegación y llamadas sucesivas.
- **Máxima calidad de vida:** priorizar legibilidad, bajo esfuerzo cognitivo, contexto útil y operación natural durante una llamada real.
- **Sin bloat:** no introducir controles, paneles, preferencias, procesos, dependencias o infraestructura que no aporten directamente al objetivo.
- **Calidad de acabado:** la implementación debe considerarse terminada solo cuando la interacción, estados de error, persistencia, posicionamiento y comportamiento en uso real estén suficientemente pulidos.

Estos criterios complementan, y no sustituyen, los bloques **VERBATIM** anteriores.

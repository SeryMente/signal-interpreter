# Observabilidad automática de Signal Interpreter

## Decisión canónica

Signal Interpreter utiliza un reporter local persistente en 127.0.0.1:8788 como capa de observabilidad entre la extensión y la publicación automática en GitHub.

Flujo canónico:

Extensión → reporter local → cola/observaciones locales → publisher aislado → origin/main

El reporter es infraestructura de soporte y no forma parte de la interfaz principal de la extensión.

## Por qué existe el reporter local

El reporter desacopla la extensión de Git/GitHub y permite:

- recibir y conservar eventos aunque GitHub esté temporalmente indisponible;
- reintentar publicaciones sin bloquear la extensión;
- publicar desde un worktree independiente fijado a main;
- mantener el registro de estado de sincronización fuera del repositorio fuente;
- exponer un estado local verificable mediante /health;
- mantener la observabilidad operativa aunque el popup de la extensión esté cerrado.

La extensión no ejecuta comandos Git ni necesita autenticación GitHub para cada evento.

## Publicación segura

El reporter no debe publicar desde la rama de desarrollo activa. Utiliza un publisher independiente en:

%USERPROFILE%\.signal-interpreter\observation-publisher

Ese worktree se sincroniza con origin/main y publica mediante:

git push origin HEAD:main

La separación evita que los eventos de observabilidad generen accidentalmente commits sobre la rama de desarrollo.

## Ejecución discreta

El servicio se instala mediante el Programador de tareas de Windows con una tarea asociada al usuario operativo.

La acción canónica ejecuta node.exe directamente, no cmd.exe ni una ventana de PowerShell interactiva. La tarea está configurada para:

- iniciar al iniciar sesión;
- reiniciar automáticamente tras un fallo;
- ignorar instancias duplicadas;
- funcionar con batería;
- ejecutarse con privilegios limitados.

Por diseño, no es necesario mantener abierta ninguna ventana de Command Prompt o PowerShell para que la observabilidad automática funcione.

El script tools/observation-reporter/run.ps1 se conserva como ruta manual de diagnóstico/arranque; no es necesario mantenerlo abierto en uso normal.

## Estado operacional

El endpoint local GET http://127.0.0.1:8788/health expone el estado del reporter, incluyendo sincronización Git, commit publicado, publisher utilizado y última revisión IA registrada.

La UI de la extensión muestra únicamente información de alto nivel y discreta:

- versión de observabilidad;
- estado de sincronización automática con GitHub;
- fecha relativa de la última revisión IA;
- acceso manual a diagnóstico completo.

Los detalles técnicos permanecen fuera de la superficie principal salvo mediante diagnóstico.

## Restricciones

El reporter no debe:

- abrir pestañas de Chrome;
- recargar ni navegar la sesión activa;
- interferir con una llamada en curso;
- publicar sobre ramas de desarrollo;
- exponer credenciales o API keys en las observaciones;
- convertirse en una dependencia funcional del flujo de interpretación en tiempo real.

## Operación normal

En una instalación funcional, el usuario puede iniciar Windows, abrir Signal Interpreter y utilizarlo normalmente sin abrir una consola adicional.

La observabilidad se considera infraestructura silenciosa: debe estar disponible, verificable y recuperable sin exigir intervención visible del usuario.
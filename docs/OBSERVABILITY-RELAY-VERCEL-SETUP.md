# Configuración canónica del relay de observabilidad en Vercel

**Fecha:** 2026-10-07  
**Repositorio:** SeryMente/signal-interpreter  
**Proyecto Vercel:** signal-interpreter-observability-relay

## Arquitectura

Chrome conserva el backlog en IndexedDB y publica HTTPS al relay Vercel. El relay escribe exclusivamente en `observations/inbox/<batchId>.json` mediante GitHub REST API. GitHub Actions procesa el inbox y reconstruye el paquete derivado.

No se requiere GitHub App, OAuth Device Flow, Client ID, Native Messaging, localhost, tareas programadas ni procesos residentes en Windows.

## Despliegue

El proyecto Vercel debe usar como root directory `tools/observability-relay` y Node.js 22 o superior.

La Function canónica es:

`/api/batch`

GET verifica salud del relay. POST recibe batches de observabilidad.

## Credencial

El único secreto remoto es `GITHUB_TOKEN`, almacenado como Secret de Vercel. Nunca se copia al árbol del repositorio ni a la extensión.

La credencial debe tener permiso suficiente para crear contenido en `SeryMente/signal-interpreter`.

## Flujo CLI

1. `vercel whoami`
2. Vincular o crear el proyecto `signal-interpreter-observability-relay` bajo el scope `victorhugotorresmendez-8991s-projects`.
3. Registrar `GITHUB_TOKEN` en Production como Secret.
4. Desplegar Production.
5. Verificar `GET /api/batch`.
6. Confirmar que la extensión use la URL canónica del relay.

## Operación

El relay limita el payload a 1.5 MB y 200 eventos por batch. También expone en GET la última publicación automática, la última publicación manual y la última marca de acceso del constructor al paquete.

La extensión muestra esos tres tiempos en la sección Desarrollo. Los dos primeros proceden de `observations/health/github-build.json` y el tercero de `observations/health/model-context-access.json`.

Cuando el modelo constructor accede al paquete para enriquecer contexto, debe ejecutar `node tools/observability-model-context-access.mjs` una vez completada la lectura; el script actualiza la marca usando la API autenticada de GitHub sin exponer el token en argumentos ni archivos.

 Sólo acepta el schema `signal-interpreter-observation-batch/v1` y construye el único destino remoto permitido: `observations/inbox/<batchId>.json`.

Los reenvíos del mismo batch son idempotentes: si el archivo ya existe, el relay devuelve aceptación duplicada.

## Seguridad

La URL del relay y la identidad del repositorio son públicas por diseño. La seguridad de la credencial depende de mantener `GITHUB_TOKEN` exclusivamente en Vercel como Secret.

El endpoint no debe interpretarse como un canal de autenticación de usuario. La protección principal es la validación estricta del contrato de observabilidad y el destino fijo.

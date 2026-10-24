# Registro de entregas de la extensión compañera de KHORA

Este registro describe **entregas autorizadas**, no cada commit ni cada parche interno. Los cambios pueden acumularse en ramas de trabajo; una entrega distribuida solo se declara cuando el usuario la autoriza.

## Regla operativa permanente del frente

En cada ciclo de actualización:

1. Leer el último checkpoint de datos procesados en `observations/manifest.json`, `observations/platform-index.json`, `observations/platform-latest.json` y el registro del último checkpoint de desarrollo.
2. Comparar la información nueva del repositorio contra ese checkpoint; separar datos nuevos, cambios relevantes, anomalías y repeticiones.
3. Evaluar de forma independiente si el delta cambia el inventario de regiones, controles, estados, menús o transiciones observables de la UI de ChatGPT.
4. Si cambia el inventario, actualizar `CHATGPT-REGION-INVENTORY.md` y el resumen de la interfaz, sin esperar a que el resto de la entrega funcional trate ese asunto.
5. Acumular los cambios funcionales y del inventario. No distribuir parches ni crear una release por cada commit.
6. Solo cuando el usuario decida publicar una entrega, registrar nombre, fecha, descripción, alcance, evidencia de validación y resultado de aceptación.

## Requisitos para cada entrada de entrega

Cada entrada debe contener:

- nombre de la entrega;
- fecha de autorización/publicación;
- resumen comprensible;
- cambios incluidos y cambios aplazados;
- checkpoint de datos comparado y resumen del delta;
- regiones de UI añadidas/modificadas/eliminadas, o “sin cambio” con evidencia;
- pruebas automatizadas y su resultado;
- pruebas reales Windows/Chrome y su resultado, o `NOT-VERIFIABLE`;
- limitaciones conocidas y criterio de reversión cuando aplique.

No inventar nombre, fecha de publicación ni aceptación. La rama de trabajo actual es una propuesta acumulativa; todavía no es una entrega autorizada.

## Entregas

| Nombre | Fecha | Descripción | Estado |
|---|---|---|---|
| — | — | Aún no se ha autorizado una entrega distribuible para este frente | Pendiente de decisión del usuario |

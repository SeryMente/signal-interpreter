# Crónica local — indicador global Signal Interpreter 0.10.45 · G12 · 2026-11-08

## Antes
La versión 0.10.44 pintaba azul en cada pestaña externa independientemente del color del perfil Cloud Interpreter. Los eventos readiness/availability recalculaban solo la pestaña emisora.

## Cambio
Se centralizó la resolución del estado de Cloud Interpreter y se derivó de ahí el icono de pestañas externas. Azul requiere estado verde válido; deshabilitado se propaga como rojo. Los eventos que alteran el estado fuente actualizan todos los indicadores.

## Motivo
Eliminar el estado visual contradictorio rojo-en-Cloud / azul-fuera-de-Cloud.

## Resultado
Código local 0.10.45 preparado. El paquete requiere recarga manual por el usuario en chrome://extensions. Esta operación no se ha realizado y no se ha abierto ni modificado Chrome.

## Procedencia y límites
Snapshot ZIP de work/g12-autoanswer-revalidation, commit fuente a098f9d58120fd41ca4e764062588d9fa77711a5, base remota 0.10.40 / origen candidato 0.10.43, estado local anterior 0.10.44. Sin Git local, no publicado y sin PR. FOL1 no está activa; folio global no asignado.
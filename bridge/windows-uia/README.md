# Signal Interpreter Bridge

Lector independiente de Chrome Live Caption mediante Windows UI Automation.

## Cadena observada

`Chrome_WidgetWin_1 → CaptionBubbleLabel → AXVirtualView → Name`

## Responsabilidades

El proceso:

- sondea Live Caption cada 150 ms por defecto;
- no captura audio;
- no usa Whisper;
- no usa Groq;
- no controla Effectif;
- emite JSONL por stdout;
- conserva `caption.delta` y `caption.revision` como diagnóstico bruto;
- añade `caption.segment` como salida reconciliada para `CLIENTE`.

## Reconciliación

Live Caption puede reescribir el snapshot actual. Por eso el Bridge no entrega cada cambio como texto final.

`CaptionReconciler`:

1. observa cada snapshot;
2. espera una ventana de estabilidad de 750 ms por defecto;
3. no vuelve a emitir el mismo snapshot estable;
4. elimina el prefijo ya comprometido cuando el caption es acumulativo;
5. detecta solapamiento de hasta 10 palabras para reducir duplicados cuando el texto rueda;
6. emite un segmento final cuando el snapshot permanece estable;
7. si el caption desaparece después de la ventana de estabilidad, permite un último `caption.segment` antes de `caption.status=not_found`.

Evento final:

```json
{
  "type": "caption.segment",
  "mode": "final",
  "source": "live-caption",
  "reason": "stable",
  "text": "texto reconciliado",
  "snapshot": "snapshot original"
}
```

Las razones posibles son:

- `stable`
- `stable-before-revision`
- `caption-cleared`

## Parámetros

```text
--interval-ms 150
--stability-ms 750
```

Ejemplo:

```text
dotnet run -- --interval-ms 150 --stability-ms 750
```

## Salida

Durante una conversación pueden coexistir eventos de diagnóstico y eventos finales:

```text
caption.status
caption.delta
caption.revision
caption.segment
```

La extensión debe consumir `caption.segment` como canal estable para `CLIENTE`. Los eventos `delta/revision` quedan disponibles para observabilidad y depuración.

## Siguiente frontera

El siguiente componente será el transporte entre este Bridge y la extensión Chrome, manteniendo `CLIENTE` separado de la entrada propia del intérprete (`YO`).

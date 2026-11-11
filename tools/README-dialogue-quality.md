# Evaluación de calidad del diálogo en vivo

El evaluador local compara una transcripción de referencia (*gold transcript*) con la hipótesis emitida por Signal Interpreter. No transcribe audio, no llama a Groq y no establece por sí mismo umbrales de aceptación.

## Ejecución

```powershell
node tools/dialogue-quality-evaluation-tests.mjs
node tools/evaluate-dialogue-quality.mjs C:\\ruta\\local\\evaluation.json
```

El JSON de entrada debe mantenerse fuera del repositorio si contiene conversaciones reales. Para el primer benchmark, usar un corpus sintético o expresamente autorizado, no clínico, con referencia revisada por una persona. El comando emite solamente métricas agregadas; no imprime las transcripciones.

## Contrato de entrada

```json
{
  "schema": "signal-interpreter-dialogue-evaluation/v1",
  "language": "en",
  "reference": {
    "segments": [
      {
        "source": "groq-remote",
        "speakerId": "remote-1",
        "language": "en",
        "startMs": 0,
        "endMs": 1800,
        "text": "Please confirm Tuesday at ten thirty."
      },
      {
        "source": "groq-interpreter",
        "speakerId": "interpreter",
        "language": "es",
        "startMs": 100,
        "endMs": 2200,
        "text": "Por favor confirme el martes a las diez treinta."
      }
    ]
  },
  "hypothesis": {
    "segments": [
      {
        "source": "groq-remote",
        "speakerId": "remote-1",
        "language": "en",
        "startMs": 0,
        "endMs": 1800,
        "latencyMs": 420,
        "text": "Please confirm Tuesday at ten thirty."
      },
      {
        "source": "groq-interpreter",
        "speakerId": "interpreter",
        "language": "es",
        "startMs": 100,
        "endMs": 2200,
        "latencyMs": 510,
        "text": "Por favor confirme el martes a las diez treinta."
      }
    ],
    "latenciesMs": [420, 510]
  },
  "criticalTerms": [
    { "term": "Tuesday", "source": "groq-remote", "language": "en" },
    { "term": "ten thirty", "source": "groq-remote", "language": "en" },
    { "term": "diez treinta", "source": "groq-interpreter", "language": "es" }
  ]
}
```

### Campos

- `schema`: versión obligatoria del contrato.
- `language`: idioma predeterminado BCP-47 cuando un segmento no declara idioma.
- `source`: únicamente `groq-remote` o `groq-interpreter`.
- `speakerId`: identificador anónimo estable; no usar nombre real. Puede ser `null` si la referencia no atribuye hablante.
- `language`: idioma del segmento, útil cuando los dos canales no comparten idioma.
- `startMs` / `endMs`: marcas en milisegundos sobre el mismo reloj de la llamada.
- `latencyMs`: latencia del segmento desde el final del audio que lo origina hasta que el texto quedó visible en la interfaz. Es opcional; se requiere para percentiles por canal.
- `hypothesis.latenciesMs`: muestras globales de latencia, opcionales; se usan para el p50/p95 general.
- `criticalTerms`: cadenas buscadas en ambos canales, o elementos `{term, source, language}` para exigir el término en un canal concreto.

## Métricas y cautelas

- **WER**: sustituciones + eliminaciones + inserciones divididas entre palabras de referencia; se calcula por canal y en conjunto.
- **CER**: distancia de edición por unidades Unicode, por canal y total. La normalización ignora espacios y puntuación; no comparar este CER con herramientas que los contabilicen.
- **Términos críticos**: recall de frases exactas normalizadas; no evalúa equivalencia semántica.
- **Atribución**: exactitud de `speakerId` en tokens correctamente alineados que sí tienen etiqueta de referencia. No mide diarización de segmentos insertados, eliminados o sustituidos.
- **Latencia**: p50, p95 y máximo; los valores solo son válidos si `latencyMs` se midió con un reloj monotónico común y el evento final corresponde a texto visible, no solo a respuesta HTTP.
- **Idioma**: usa `Intl.Segmenter` cuando está disponible; la segmentación y el gold transcript deben conservar la misma convención.

WER/CER bajos no prueban por sí solos un buen diálogo: revisar también negaciones, cantidades, nombres, turnos, solapamientos, pérdidas, duplicados, cronología y errores de atribución. No convertir los resultados de corpus sintético en afirmaciones de calidad acústica real. Definir los umbrales de aceptación antes de ejecutar el benchmark y conservar fuera del repo el audio, las transcripciones y cualquier dato de llamada.

## Esquema del informe

El resultado `signal-interpreter-dialogue-quality-report/v1` incluye WER/CER general y por fuente, recall de términos críticos (general y por fuente), exactitud de atribución y percentiles de latencia. El informe contiene números únicamente, sin segmentos ni transcripciones.

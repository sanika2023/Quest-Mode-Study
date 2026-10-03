import functools
import json
import os

from google import genai
from google.genai import types

import config  # noqa: F401  (loads .env)


@functools.cache
def _client():
    return genai.Client(api_key=os.environ["GEMINI_API_KEY"])


def _call(model, prompt, system, schema):
    response = _client().models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system,
            response_mime_type="application/json",
            response_schema=schema,
        ),
    )
    return json.loads(response.text)


def generate_json(prompt, system=None, schema=None):
    """Structured JSON from Gemini: primary model twice, then the fallback model once."""
    primary = os.environ["GEMINI_MODEL"]
    attempts = [primary, primary, os.environ["GEMINI_FALLBACK_MODEL"]]
    for i, model in enumerate(attempts):
        try:
            return _call(model, prompt, system, schema)
        except Exception:
            if i == len(attempts) - 1:
                raise

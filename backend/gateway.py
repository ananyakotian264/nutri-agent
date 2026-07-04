"""
gateway.py — The AI MODEL GATEWAY.

Every other file in this project talks to "the model" only through the
ModelGateway class below — never directly to the `groq` package. That
single choke point is the whole idea of a model gateway:

  * Swap providers (Groq -> OpenAI -> Anthropic -> a local model) by
    rewriting ONE file, not every call site.
  * Add cross-cutting concerns once — retries, logging, cost tracking,
    rate limiting, a fallback model — and every caller gets them for free.
  * Keep provider-specific request/response shapes out of the orchestrator,
    which should only think in terms of "messages in, message out".

In a bigger system this gateway might sit in front of several models and
route between them (a cheap/fast model for simple lookups, a stronger model
for planning). Here it's intentionally simple: one provider, one model,
clear seams for you to extend later.
"""

import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()


class ModelGateway:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key or api_key == "your_groq_key_here":
            raise RuntimeError("GROQ_API_KEY is missing. Add it to backend/.env")
        self.client = Groq(api_key=api_key)
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    def chat(self, messages: list, tools: list | None = None):
        """
        Single entry point used by the orchestrator. Returns the raw
        `message` object from the completion so the orchestrator can inspect
        both `.content` and `.tool_calls`.
        """
        kwargs = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,  # low temperature: this is a data task, not creative writing
        }
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "auto"

        completion = self.client.chat.completions.create(**kwargs)
        return completion.choices[0].message


gateway = ModelGateway()

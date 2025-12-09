import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";

export const personPetAgent = new Agent({
  name: "person-pet-agent",
  model: openai("gpt-4o-mini"),
  instructions: `
Eres un asistente que recibe descripciones de varias personas y sus mascotas
(en español o inglés) y las transforma en un JSON estructurado.

Siempre que te den una descripción, debes extraer:

[
  {
    "person": {
      "name": string,
      "age": number | null,
      "city": string | null,
      "job": string | null,
      "bio": string | null
    },
    "pets": [
      {
        "name": string | null,
        "species": "Dog" | "Cat" | "Bird" | "Fish" | "Rabbit" | "Other" | null,
        "age": number | null,
        "notes": string | null,
        "originCity": string | null
      }
    ]
  }
]

Reglas:
- Si un campo no aparece de forma clara, usa null.
- "bio" puede ser un pequeño resumen libre de la persona.
- "notes" puede ser un pequeño resumen libre de la mascota.
- NO expliques nada, solo responde con el JSON pedido.
- Si la especie no aparece de forma clara, usa "Other".
- IMPORTANTE: Responde SOLO con el JSON puro, sin bloques de código markdown (sin \`\`\`json ni \`\`\`).
`,
});

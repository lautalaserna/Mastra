// src/mastra/workflows/person-pet-to-airtable-workflow.ts
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { z } from "zod";
import { personPetAgent } from "../agents/person-pet-agent";
import { createPersonInAirtableTool } from "../tools/airtable-person-tool";
import { createPetInAirtableTool } from "../tools/airtable-pet-tool";
import { personPetSchema, petSchema } from "../../types/person-pet";

// =====================================================
// STEP 1: Parsear la descripción con el agent
// Input: { description: string }
// Output: { person: {...}, pet: {...} }
// =====================================================
const parseDescriptionStep = createStep({
  id: "parse-description",
  description: "Parsea la descripción de texto en persona + mascota",
  inputSchema: z.object({
    description: z.string(),
  }),
  outputSchema: personPetSchema,
  execute: async ({ inputData }) => {
    const { description } = inputData;

    const response = await personPetAgent.generate(
      [{ role: "user", content: description }],
    );

    const raw = response.text;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      throw new Error(
        `No se pudo parsear la respuesta del agent como JSON. Respuesta cruda:\n${raw}`,
      );
    }

    // Validar y normalizar con Zod
    const data = personPetSchema.parse(parsed);
    return data;
  },
});

// =====================================================
// STEP 2: Crear la persona en Airtable
// Input: { person, pet }
// Output: { personRecordId, pet }
// =====================================================
const createPersonStep = createStep({
  id: "create-person-in-airtable",
  description: "Crea un registro en la tabla People de Airtable",
  inputSchema: personPetSchema,
  outputSchema: z.object({
    personRecordId: z.string(),
    pet: petSchema,
  }),
  execute: async ({ inputData }) => {
    const { person, pet } = inputData;

    const result = await createPersonInAirtableTool.execute({
      context: {
        name: person.name,
        age: person.age ?? undefined,
        city: person.city ?? undefined,
        job: person.job ?? undefined,
        bio: person.bio ?? undefined,
      },
      runtimeContext: new RuntimeContext(),
    });

    return {
      personRecordId: result.recordId,
      pet,
    };
  },
});

// =====================================================
// STEP 3: Crear la mascota en Airtable
// Input: { personRecordId, pet }
// Output: { personRecordId, petRecordId }
// =====================================================
const createPetStep = createStep({
  id: "create-pet-in-airtable",
  description:
    "Crea un registro en la tabla Pet de Airtable vinculado a la persona",
  inputSchema: z.object({
    personRecordId: z.string(),
    pet: petSchema,
  }),
  outputSchema: z.object({
    personRecordId: z.string(),
    petRecordId: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { personRecordId, pet } = inputData;

    const result = await createPetInAirtableTool.execute({
      context: {
        ownerRecordId: personRecordId,
        name: pet.name ?? undefined,
        species: pet.species ?? undefined,
        age: pet.age ?? undefined,
        notes: pet.notes ?? undefined,
      },
      runtimeContext: new RuntimeContext(),
    });

    return {
      personRecordId,
      petRecordId: result.recordId,
    };
  },
});

// =====================================================
// WORKFLOW COMPLETO
// Input del workflow: { description: string }
// Output final: { personRecordId, petRecordId }
// =====================================================
export const personPetToAirtableWorkflow = createWorkflow({
  id: "person-pet-to-airtable-workflow",
  inputSchema: z.object({
    description: z.string(),
  }),
  outputSchema: z.object({
    personRecordId: z.string(),
    petRecordId: z.string(),
  }),
})
  .then(parseDescriptionStep)
  .then(createPersonStep)
  .then(createPetStep)
  .commit();

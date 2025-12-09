// src/mastra/workflows/person-pet-to-airtable-workflow.ts
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { z } from "zod";
import { personPetAgent } from "../agents/person-pet-agent";
import { createPersonInAirtableTool } from "../tools/airtable-person-tool";
import { createPetInAirtableTool } from "../tools/airtable-pet-tool";
import { peopleWithPetsSchema } from "../../types/person-pet";

// Schema para el resultado de una persona creada con sus mascotas
const personResultSchema = z.object({
  personRecordId: z.string(),
  petRecordIds: z.array(z.string()),
});

// Schema para el resultado final del workflow
const workflowResultSchema = z.array(personResultSchema);

// =====================================================
// STEP 1: Parsear la descripción con el agent
// Input: { description: string }
// Output: Array de { person: {...}, pets: [...] }
// =====================================================
const parseDescriptionStep = createStep({
  id: "parse-description",
  description: "Parsea la descripción de texto en múltiples personas con sus mascotas",
  inputSchema: z.object({
    description: z.string(),
  }),
  outputSchema: peopleWithPetsSchema,
  execute: async ({ inputData }) => {
    const { description } = inputData;

    const response = await personPetAgent.generate(
      [{ role: "user", content: description }],
    );

    let raw = response.text.trim();

    // Limpiar bloques de código markdown si el agente los incluye
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      throw new Error(
        `No se pudo parsear la respuesta del agent como JSON. Respuesta cruda:\n${raw}`,
      );
    }

    // Validar y normalizar con Zod
    const data = peopleWithPetsSchema.parse(parsed);
    return data;
  },
});

// =====================================================
// STEP 2: Crear todas las personas y mascotas en Airtable
// Input: Array de { person, pets }
// Output: Array de { personRecordId, petRecordIds }
// =====================================================
const createPeopleAndPetsStep = createStep({
  id: "create-people-and-pets-in-airtable",
  description: "Crea registros en las tablas People y Pets de Airtable",
  inputSchema: peopleWithPetsSchema,
  outputSchema: workflowResultSchema,
  execute: async ({ inputData }) => {
    const results: z.infer<typeof workflowResultSchema> = [];

    for (const { person, pets } of inputData) {
      // Crear la persona
      const personResult = await createPersonInAirtableTool.execute({
        context: {
          name: person.name,
          age: person.age ?? undefined,
          city: person.city ?? undefined,
          job: person.job ?? undefined,
          bio: person.bio ?? undefined,
        },
        runtimeContext: new RuntimeContext(),
      });

      const personRecordId = personResult.recordId;
      const petRecordIds: string[] = [];

      // Crear todas las mascotas de esta persona
      for (const pet of pets) {
        const petResult = await createPetInAirtableTool.execute({
          context: {
            ownerRecordId: personRecordId,
            name: pet.name ?? undefined,
            species: pet.species ?? undefined,
            age: pet.age ?? undefined,
            notes: pet.notes ?? undefined,
            originCity: pet.originCity ?? undefined,
          },
          runtimeContext: new RuntimeContext(),
        });
        petRecordIds.push(petResult.recordId);
      }

      results.push({
        personRecordId,
        petRecordIds,
      });
    }

    return results;
  },
});

// =====================================================
// WORKFLOW COMPLETO
// Input del workflow: { description: string }
// Output final: Array de { personRecordId, petRecordIds }
// =====================================================
export const personPetToAirtableWorkflow = createWorkflow({
  id: "person-pet-to-airtable-workflow",
  inputSchema: z.object({
    description: z.string(),
  }),
  outputSchema: workflowResultSchema,
})
  .then(parseDescriptionStep)
  .then(createPeopleAndPetsStep)
  .commit();

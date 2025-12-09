import { createTool } from "@mastra/core";
import z from "zod";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const AIRTABLE_PETS_TABLE = "Pets";

export const createPetInAirtableTool = createTool({
  id: "createPetInAirtable",
  description:
    "Crea una mascota en la tabla Pet de Airtable y la vincula con su dueño",
  inputSchema: z.object({
    ownerRecordId: z.string(),
    name: z.string().optional(),
    species: z.string().optional(),
    age: z.number().int().optional(),
    notes: z.string().optional(),
  }),
  outputSchema: z.object({
    recordId: z.string(),
  }),
  execute: async ({ context }) => {
    const payload = {
      records: [
        {
          fields: {
            Name: context.name ?? "Unnamed pet",
            Species: context.species ?? "Other",
            Age: context.age,
            Notes: context.notes,
            Owner: [context.ownerRecordId],
          },
        },
      ],
    };

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
        AIRTABLE_PETS_TABLE,
      )}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Error creando mascota en Airtable: ${res.status} ${text}`,
      );
    }

    const json = (await res.json()) as { records: { id: string }[] };
    const recordId = json.records[0].id;

    return { recordId };
  },
});

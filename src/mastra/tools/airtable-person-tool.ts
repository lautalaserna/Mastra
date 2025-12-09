// src/mastra/tools/airtable-people-pet-tools.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;
const AIRTABLE_PEOPLE_TABLE = "People";

export const createPersonInAirtableTool = createTool({
  id: "createPersonInAirtable",
  description: "Crea una persona en la tabla People de Airtable",
  inputSchema: z.object({
    name: z.string(),
    age: z.number().int().optional(),
    city: z.string().optional(),
    job: z.string().optional(),
    bio: z.string().optional(),
  }),
  outputSchema: z.object({
    recordId: z.string(),
  }),
  execute: async ({ context }) => {
    const payload = {
      records: [
        {
          fields: {
            "Name": context.name,
            "Age": context.age,
            "City": context.city,
            "Job": context.job,
            "Bio": context.bio,
          },
        },
      ],
    };

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(
        AIRTABLE_PEOPLE_TABLE,
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
        `Error creando persona en Airtable: ${res.status} ${text}`,
      );
    }

    const json = (await res.json()) as { records: { id: string }[] };
    const recordId = json.records[0].id;

    return { recordId };
  },
});

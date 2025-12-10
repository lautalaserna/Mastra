import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN!;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID!;

// Tipo para valores de campo de Airtable
const AirtableFieldValue = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.null(),
]);

export const updateAirtableRecordTool = createTool({
  id: "updateAirtableRecord",
  description: "Actualiza uno o más campos de un registro en cualquier tabla de Airtable",
  inputSchema: z.object({
    tableName: z.string().describe("Nombre de la tabla en Airtable"),
    recordId: z.string().describe("ID del registro a actualizar"),
    fields: z.record(z.string(), AirtableFieldValue)
      .describe("Objeto con los campos a actualizar: { NombreCampo: valor, ... }"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    recordId: z.string(),
    updatedFields: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { tableName, recordId, fields } = context;

    // Validar variables de entorno
    if (!AIRTABLE_TOKEN) {
      throw new Error("AIRTABLE_TOKEN no está configurado en las variables de entorno");
    }
    if (!AIRTABLE_BASE_ID) {
      throw new Error("AIRTABLE_BASE_ID no está configurado en las variables de entorno");
    }

    const payload = {
      records: [
        {
          id: recordId,
          fields,
        },
      ],
    };

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

    console.log(`[updateAirtableRecord] Updating record ${recordId} in table ${tableName}`);
    console.log(`[updateAirtableRecord] Fields:`, JSON.stringify(fields, null, 2));

    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`[updateAirtableRecord] Airtable API error: ${res.status} ${text}`);
        throw new Error(`Error actualizando registro en Airtable: ${res.status} ${text}`);
      }

      const responseData = await res.json();
      console.log(`[updateAirtableRecord] Success:`, JSON.stringify(responseData, null, 2));

      return {
        success: true,
        recordId,
        updatedFields: Object.keys(fields),
      };
    } catch (error) {
      console.error(`[updateAirtableRecord] Error:`, error);
      throw error;
    }
  },
});

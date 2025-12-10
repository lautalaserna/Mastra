import { createWorkflow, createStep } from "@mastra/core/workflows";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { z } from "zod";
import { updateAirtableRecordTool } from "../tools/airtable-update-record-tool";

const searchCompanyInfoStep = createStep({
  id: "search-company-info",
  inputSchema: z.object({
    airtableRecordId: z.string(),
    name: z.string(),
  }),
  outputSchema: z.object({
    airtableRecordId: z.string(),
    description: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { airtableRecordId, name } = inputData;

    console.log(`[searchCompanyInfoStep] Starting search for company: ${name}`);

    //const raw = await googleCompanySearch(`${name} company`); // tu función real
    //const description = await summarizeWithLLM(raw);          // tu agente/LLM

    // TODO: Obtener la description de un agent que busque la empresa en google
    const description = `Descripción simulada para la empresa ${name}. Esta es una empresa líder en su industria, conocida por su innovación y compromiso con la calidad. Fundada hace más de 20 años, ha crecido hasta convertirse en un actor global con presencia en múltiples mercados. Su misión es proporcionar soluciones excepcionales a sus clientes mientras fomenta un ambiente de trabajo inclusivo y dinámico para sus empleados.`;

    console.log(`[searchCompanyInfoStep] Generated description for ${name}`);

    return { airtableRecordId, description };
  },
});

const updateAirtableDescriptionStep = createStep({
  id: "update-airtable-description",
  inputSchema: z.object({
    airtableRecordId: z.string(),
    description: z.string(),
  }),
  outputSchema: z.object({
    airtableRecordId: z.string(),
    description: z.string(),
  }),
  execute: async ({ inputData }) => {
    const { airtableRecordId, description } = inputData;

    console.log(`[updateAirtableDescriptionStep] Updating Airtable record: ${airtableRecordId}`);

    try {
      await updateAirtableRecordTool.execute({
        context: {
          tableName: "Companies",
          recordId: airtableRecordId,
          fields: {
            "Google Description": description,
            "Status": "Synchronized"
          },
        },
        runtimeContext: new RuntimeContext(),
      });

      console.log(`[updateAirtableDescriptionStep] Successfully updated record: ${airtableRecordId}`);
    } catch (error) {
      console.error(`[updateAirtableDescriptionStep] Error updating record:`, error);
      throw error;
    }

    return { airtableRecordId, description };
  },
});

export const companyGoogleDescriptionWorkflow = createWorkflow({
  id: "company-google-description",
  inputSchema: z.object({
    airtableRecordId: z.string(),
    name: z.string(),
  }),
  outputSchema: z.object({
    airtableRecordId: z.string(),
    description: z.string(),
  }),
})
  .then(searchCompanyInfoStep)
  .then(updateAirtableDescriptionStep)
  .commit();

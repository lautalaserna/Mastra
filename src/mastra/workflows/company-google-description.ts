import { createWorkflow, createStep } from "@mastra/core/workflows";
import { RuntimeContext } from "@mastra/core/runtime-context";
import { z } from "zod";
import { updateAirtableRecordTool } from "../tools/airtable-update-record-tool";
import { createGoogleDescriptionAgent } from "../agents/google-description-agent";
import { descriptionPolisherAgent } from "../agents/description-polisher-agent";


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

    const agent = createGoogleDescriptionAgent(name);
    const response = await agent.generate(`Generate a sponsor description for: ${name}`);
    const description = response.text;

    console.log(`[searchCompanyInfoStep] Generated description for ${name}`);

    return { airtableRecordId, description };
  },
});

const polishDescriptionStep = createStep({
  id: "polish-description",
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

    console.log(`[polishDescriptionStep] Polishing description for record: ${airtableRecordId}`);

    const response = await descriptionPolisherAgent.generate(
      `Polish and improve the following sponsor description:\n\n${description}`
    );
    const polishedDescription = response.text;

    console.log(`[polishDescriptionStep] Description polished successfully`);

    return { airtableRecordId, description: polishedDescription };
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
  .then(polishDescriptionStep)
  .then(updateAirtableDescriptionStep)
  .commit();

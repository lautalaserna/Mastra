import { registerApiRoute } from "@mastra/core/server";

const BASE_PATH = "/airtable";

export const airtableWebhooks = [
  registerApiRoute(`${BASE_PATH}/company-created`, {
    method: "POST",
    handler: async (c) => {
      // 1) Parsear body
      let body: any;
      try {
        body = await c.req.json();
      } catch {
        return c.json({ error: "Invalid JSON body" }, 400);
      }

      const { airtableRecordId, name } = body ?? {};
      if (!airtableRecordId || !name) {
        return c.json(
          { error: "Missing airtableRecordId or name in body" },
          400
        );
      }

      console.log(`Received webhook for company ${name} (${airtableRecordId})`);

      try {
        // 2) Obtener workflow y dispararlo (fire-and-forget)
        const mastraInstance = c.get("mastra");
        const workflow = mastraInstance.getWorkflow("companyGoogleDescriptionWorkflow");

        const run = await workflow.createRunAsync();

        run.start({ inputData: { airtableRecordId, name } })
          .catch((err: Error) => {
            console.error("Error running companyGoogleDescriptionWorkflow", err);
          });

        // 3) Responder rápido a Airtable
        return c.json({
          status: "queued",
          runId: run.runId,
        });
      } catch (error) {
        console.error("Error creating workflow run:", error);
        return c.json({ error: "Failed to queue workflow" }, 500);
      }
    },
  }),
];

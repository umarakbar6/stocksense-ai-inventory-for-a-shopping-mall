import { createRequire } from "node:module";
import { resolve } from "node:path";

const globalRoot = process.platform === "win32" ? resolve(process.env.APPDATA, "npm", "node_modules") : "/usr/local/lib/node_modules";
const requireGlobal = createRequire(resolve(globalRoot, "n8n", "package.json"));
const sqlite3 = requireGlobal("sqlite3");
const database = new sqlite3.Database(resolve("n8n", "data", ".n8n", "database.sqlite"));

database.all("SELECT id, name, active FROM workflow_entity WHERE id LIKE 'stocksense-%' ORDER BY id", (workflowError, workflows) => {
  if (workflowError) throw workflowError;
  database.all("SELECT workflowId, webhookPath, method, node FROM webhook_entity ORDER BY workflowId", (webhookError, webhooks) => {
    if (webhookError) throw webhookError;
    console.log(JSON.stringify({ workflows, registeredWebhooks: webhooks }, null, 2));
    database.close();
  });
});

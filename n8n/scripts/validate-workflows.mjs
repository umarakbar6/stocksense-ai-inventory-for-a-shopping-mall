import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const workflowDir = resolve(root, "workflows");
const files = (await readdir(workflowDir)).filter((file) => file.endsWith(".json"));
if (!files.length) throw new Error("No workflow exports were found.");

for (const file of files) {
  const workflow = JSON.parse(await readFile(resolve(workflowDir, file), "utf8"));
  if (!workflow.name || !Array.isArray(workflow.nodes) || workflow.nodes.length < 2) throw new Error(`${file} is not a substantive n8n workflow.`);
  if (!workflow.connections || typeof workflow.connections !== "object") throw new Error(`${file} has no workflow connections.`);
  for (const node of workflow.nodes) {
    if (!node.name || !node.type || !Array.isArray(node.position)) throw new Error(`${file} contains an incomplete node.`);
  }
  const serialized = JSON.stringify(workflow);
  if (/sk-[A-Za-z0-9_-]{16,}/.test(serialized)) throw new Error(`${file} contains an API key-like value.`);
  if (/postgres(?:ql)?:\/\//i.test(serialized)) throw new Error(`${file} must not contain a database connection.`);
}

console.log(`Validated ${files.length} non-empty n8n workflow exports with no embedded API keys or database URLs.`);

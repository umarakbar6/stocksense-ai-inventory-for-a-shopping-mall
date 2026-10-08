import { spawnSync } from "node:child_process";

// This initializer is explicitly restricted to the StockSense demo database.
// Vercel supplies DATABASE_URL privately; no connection secret is logged/exported.
const connection = new URL(process.env.DATABASE_URL ?? "");
if (connection.username !== "postgres.mbsthncpfgzyfdxffhcd" ||
    connection.hostname !== "aws-0-ap-southeast-2.pooler.supabase.com") {
  throw new Error("Demo deployment initialization requires the approved StockSense Supabase database.");
}
connection.port = "5432"; // Session pooling is required for migration locks.
connection.searchParams.delete("pgbouncer");
const childEnv = { ...process.env, DATABASE_URL: connection.toString(), NODE_ENV: "development" };
for (const args of [
  ["node_modules/prisma/build/index.js", "migrate", "deploy", "--schema", "database/schema.prisma"],
  ["node_modules/tsx/dist/cli.mjs", "database/seed.ts"],
]) {
  const result = spawnSync(process.execPath, args, { env: childEnv, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

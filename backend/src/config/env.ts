import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: [path.resolve(process.cwd(), ".env.local"), path.resolve(process.cwd(), "../.env.local"), path.resolve(process.cwd(), ".env")], quiet: true });

process.env.DATABASE_URL ??= process.env.STOCKSENSE_DATABASE_URL;
process.env.JWT_SECRET ??= process.env.STOCKSENSE_JWT_SECRET;
process.env.AGENT_SERVICE_SECRET ??= process.env.STOCKSENSE_AGENT_SERVICE_SECRET;
process.env.AGENT_CONTEXT_SECRET ??= process.env.STOCKSENSE_AGENT_CONTEXT_SECRET;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
  APP_TIMEZONE: z.string().min(1).default("Asia/Karachi"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  AUTH_COOKIE_NAME: z.string().min(1).default("stocksense_session"),
  AUTH_TOKEN_TTL: z.string().min(2).default("8h"),
  N8N_WEBHOOK_URL: z.string().url().default("http://127.0.0.1:5678/webhook/stocksense-wf01-chat-router/authenticated%2520chat%2520webhook/stocksense-chat"),
  AGENT_SERVICE_SECRET: z.string().min(32),
  AGENT_CONTEXT_SECRET: z.string().min(32),
  AGENT_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(20_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid backend environment configuration", parsed.error.flatten().fieldErrors);
  throw new Error("Backend environment validation failed.");
}

export const env = parsed.data;


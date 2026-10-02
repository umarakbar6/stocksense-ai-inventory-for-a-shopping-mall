import { randomUUID } from "node:crypto";
import { Router } from "express";
import { requireAuth } from "../auth/auth-middleware.js";
import { env } from "../config/env.js";
import { AppError } from "../http/app-error.js";
import { asyncHandler } from "../http/async-handler.js";
import { agentResponseSchema, chatRequestSchema } from "./contracts.js";
import { issueAgentContext } from "./context-token.js";
import { rateLimit } from "../security/request-security.js";

export const chatRouter = Router();
chatRouter.use(requireAuth);

chatRouter.post("/messages", rateLimit({ windowMs: 60_000, max: 30, scope: "chat" }), asyncHandler(async (request, response) => {
  const input = chatRequestSchema.parse(request.body);
  const conversationId = input.conversationId ?? randomUUID();
  const contextRef = await issueAgentContext({ sub: request.user!.id, role: request.user!.role, requestId: response.locals.requestId, conversationId });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AGENT_TIMEOUT_MS);
  try {
    const result = await fetch(env.N8N_WEBHOOK_URL, {
      method: "POST", signal: controller.signal,
      headers: { "content-type": "application/json", "x-stocksense-agent-secret": env.AGENT_SERVICE_SECRET },
      body: JSON.stringify({ version: "1.0", requestId: response.locals.requestId, conversationId, message: input.message, userContextRef: contextRef, role: request.user!.role, locale: "en-PK", timezone: env.APP_TIMEZONE }),
    });
    if (!result.ok) throw new Error(`Agent workflow returned ${result.status}.`);
    const payload = agentResponseSchema.safeParse(await result.json());
    if (!payload.success || payload.data.requestId !== response.locals.requestId || payload.data.conversationId !== conversationId) throw new Error("Agent workflow returned an invalid response envelope.");
    response.json({ data: payload.data });
  } catch (error) {
    console.error("Agent gateway failure", { requestId: response.locals.requestId, reason: error instanceof Error ? error.message : "unknown" });
    throw new AppError(503, "AGENT_UNAVAILABLE", "The inventory assistant is temporarily unavailable. Normal inventory features are still working.");
  } finally { clearTimeout(timeout); }
}));

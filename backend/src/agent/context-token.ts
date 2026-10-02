import { SignJWT, jwtVerify } from "jose";
import { Role } from "@prisma/client";
import { z } from "zod";
import { env } from "../config/env.js";

const secret = new TextEncoder().encode(env.AGENT_CONTEXT_SECRET);
const issuer = "stocksense-backend";
const audience = "stocksense-agent-tools";
const claimsSchema = z.object({
  sub: z.string().uuid(),
  role: z.nativeEnum(Role),
  requestId: z.string().min(1),
  conversationId: z.string().uuid(),
});

export type AgentContext = z.infer<typeof claimsSchema>;

export function issueAgentContext(context: AgentContext) {
  return new SignJWT({ role: context.role, requestId: context.requestId, conversationId: context.conversationId })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(context.sub)
    .setIssuer(issuer)
    .setAudience(audience)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(secret);
}

export async function verifyAgentContext(token: string) {
  const { payload } = await jwtVerify(token, secret, { issuer, audience, algorithms: ["HS256"] });
  return claimsSchema.parse(payload);
}
